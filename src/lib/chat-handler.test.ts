import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConvertToModelMessages = vi.fn((msgs: unknown) =>
  Promise.resolve(msgs),
);

vi.mock("ai", () => ({
  streamText: vi.fn(),
  stepCountIs: vi.fn((n: number) => `stepCountIs(${n})`),
  convertToModelMessages: (...args: unknown[]) =>
    mockConvertToModelMessages(...args),
}));
vi.mock("./model", () => ({
  getModelById: vi.fn(() => ({ provider: "mock", model: "test-model" })),
  isValidModelId: vi.fn(() => true),
}));
vi.mock("./tools", () => ({
  tools: {
    webSearch: { mock: true },
    saveInsight: { mock: true },
    retrievalPractice: { mock: true },
    progressiveDisclosure: { mock: true },
  },
}));
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("./rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 19 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}));
vi.mock("@clerk/tanstack-react-start/server", () => ({
  auth: vi.fn(async () => ({ userId: "user_123" })),
}));

import { auth } from "@clerk/tanstack-react-start/server";
import { streamText } from "ai";
import { handleChatPost, SYSTEM_PROMPT } from "./chat-handler";
import { logger } from "./logger";
import { getModelById, isValidModelId } from "./model";
import { checkRateLimit } from "./rate-limit";
import { tools } from "./tools";

function createRequest(
  body: unknown,
  headers?: Record<string, string>,
): Request {
  const json = JSON.stringify(body);
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": String(new TextEncoder().encode(json).byteLength),
      ...headers,
    },
    body: json,
  });
}

function setupStreamTextMock() {
  const mockResponse = new Response("streamed", { status: 200 });
  const mockResult = {
    toUIMessageStreamResponse: vi.fn(() => mockResponse),
  };
  vi.mocked(streamText).mockReturnValue(
    mockResult as ReturnType<typeof streamText>,
  );
  return { mockResult, mockResponse };
}

describe("SYSTEM_PROMPT", () => {
  it("contains Socratic method instructions", () => {
    expect(SYSTEM_PROMPT).toContain("Socrates");
    expect(SYSTEM_PROMPT).toContain("NEVER give direct answers");
    expect(SYSTEM_PROMPT).toContain("probing questions");
  });

  it("instructs to challenge assumptions", () => {
    expect(SYSTEM_PROMPT).toContain("Challenge assumptions");
  });

  it("instructs to keep questions focused", () => {
    expect(SYSTEM_PROMPT).toContain("one or two questions at a time");
  });

  it("instructs how to handle images", () => {
    expect(SYSTEM_PROMPT).toContain("image");
  });

  it("describes available tools", () => {
    expect(SYSTEM_PROMPT).toContain("webSearch");
    expect(SYSTEM_PROMPT).toContain("saveInsight");
    expect(SYSTEM_PROMPT).toContain("retrievalPractice");
    expect(SYSTEM_PROMPT).toContain("progressiveDisclosure");
  });
});

describe("handleChatPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 19,
    });
    vi.mocked(isValidModelId).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
  });

  it("calls streamText with system prompt, model, tools, and converted messages", async () => {
    const { mockResult, mockResponse } = setupStreamTextMock();

    const messages = [{ role: "user", content: "What is justice?" }];
    const request = createRequest({ messages });

    const response = await handleChatPost(request);

    expect(mockConvertToModelMessages).toHaveBeenCalledWith(messages, {
      tools,
    });
    expect(streamText).toHaveBeenCalledOnce();
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { provider: "mock", model: "test-model" },
        system: SYSTEM_PROMPT,
        messages,
        tools,
      }),
    );
    expect(mockResult.toUIMessageStreamResponse).toHaveBeenCalledOnce();
    expect(response).toBe(mockResponse);
  });

  it("passes multi-turn conversation messages through convertToModelMessages", async () => {
    setupStreamTextMock();

    const messages = [
      { role: "user", content: "What is virtue?" },
      { role: "assistant", content: "What do you mean by virtue?" },
      { role: "user", content: "Living a good life" },
    ];
    const request = createRequest({ messages });

    await handleChatPost(request);

    expect(mockConvertToModelMessages).toHaveBeenCalledWith(messages, {
      tools,
    });
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({ messages }),
    );
  });

  it("uses the model returned by getModelById()", async () => {
    setupStreamTextMock();

    const request = createRequest({ messages: [] });
    await handleChatPost(request);

    expect(getModelById).toHaveBeenCalledOnce();
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { provider: "mock", model: "test-model" },
      }),
    );
  });

  it("passes modelId from request body to getModelById", async () => {
    setupStreamTextMock();

    const request = createRequest({ messages: [], modelId: "gpt-4o" });
    await handleChatPost(request);

    expect(getModelById).toHaveBeenCalledWith("gpt-4o");
  });

  it("returns 400 for non-JSON request bodies", async () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Length": "8" },
      body: "not json",
    });

    const response = await handleChatPost(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid JSON");
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: false,
      remaining: 0,
      retryAfterMs: 30000,
    });

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toContain("Too many requests");
  });
});

describe("authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 19,
    });
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
  });

  it("returns 401 when Clerk auth has no user session", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: null,
    } as Awaited<ReturnType<typeof auth>>);

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    expect(response.status).toBe(401);
  });

  it("returns 401 when Clerk middleware is unavailable", async () => {
    vi.mocked(auth).mockRejectedValue(
      new Error("Clerk middleware not configured"),
    );

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    expect(response.status).toBe(401);
  });

  it("allows request when Clerk auth has a signed in user", async () => {
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
    setupStreamTextMock();

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    expect(response.status).toBe(200);
  });
});

describe("request validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 19,
    });
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
  });

  it("returns 400 when messages exceed max count", async () => {
    const messages = Array.from({ length: 101 }, (_, i) => ({
      role: "user",
      content: `msg ${i}`,
    }));

    const request = createRequest({ messages });
    const response = await handleChatPost(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Too many messages");
  });

  it("returns 400 when text part is too long", async () => {
    const messages = [
      {
        role: "user",
        content: "x",
        parts: [{ type: "text", text: "a".repeat(10_001) }],
      },
    ];

    const request = createRequest({ messages });
    const response = await handleChatPost(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Text too long");
  });

  it("returns 400 for disallowed MIME types", async () => {
    const messages = [
      {
        role: "user",
        content: "x",
        parts: [{ type: "file", mediaType: "application/pdf", data: "abc" }],
      },
    ];

    const request = createRequest({ messages });
    const response = await handleChatPost(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("File type not allowed");
  });

  it("returns 400 when too many files per message", async () => {
    const fileParts = Array.from({ length: 5 }, () => ({
      type: "file",
      mediaType: "image/png",
      data: "abc",
    }));
    const messages = [{ role: "user", content: "x", parts: fileParts }];

    const request = createRequest({ messages });
    const response = await handleChatPost(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Too many files");
  });

  it("returns 400 when body exceeds max size", async () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": String(10 * 1024 * 1024),
      },
      body: JSON.stringify({ messages: [] }),
    });

    const response = await handleChatPost(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("too large");
  });
});

describe("error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({
      allowed: true,
      remaining: 19,
    });
    vi.mocked(auth).mockResolvedValue({
      userId: "user_123",
    } as Awaited<ReturnType<typeof auth>>);
  });

  it("returns 500 when streamText throws", async () => {
    vi.mocked(streamText).mockImplementation(() => {
      throw new Error("LLM provider down");
    });

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Internal server error");
  });

  it("does not leak internal error details to client", async () => {
    vi.mocked(streamText).mockImplementation(() => {
      throw new Error("SECRET_API_KEY_INVALID");
    });

    const request = createRequest({ messages: [] });
    const response = await handleChatPost(request);

    const json = await response.json();
    expect(json.error).not.toContain("SECRET");
    expect(json.error).toBe("Internal server error");
  });

  it("logs the actual error", async () => {
    vi.mocked(streamText).mockImplementation(() => {
      throw new Error("LLM provider down");
    });

    const request = createRequest({ messages: [] });
    await handleChatPost(request);

    expect(logger.error).toHaveBeenCalledWith(
      "chat_error",
      expect.objectContaining({ error: "LLM provider down" }),
    );
  });
});
