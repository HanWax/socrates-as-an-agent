import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConvertToModelMessages = vi.fn((msgs: unknown) => msgs);

vi.mock("ai", () => ({
  streamText: vi.fn(),
  convertToModelMessages: (...args: unknown[]) =>
    mockConvertToModelMessages(...args),
}));
vi.mock("./model", () => ({
  getModelById: vi.fn(() => ({ provider: "mock", model: "test-model" })),
}));

import { streamText } from "ai";
import { handleChatPost, SYSTEM_PROMPT } from "./chat-handler";
import { getModelById } from "./model";

function createRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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
});

describe("handleChatPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls streamText with system prompt, model, and converted messages", async () => {
    const mockResponse = new Response("streamed", { status: 200 });
    const mockResult = {
      toUIMessageStreamResponse: vi.fn(() => mockResponse),
    };
    vi.mocked(streamText).mockReturnValue(
      mockResult as ReturnType<typeof streamText>,
    );

    const messages = [{ role: "user", content: "What is justice?" }];
    const request = createRequest({ messages });

    const response = await handleChatPost(request);

    expect(mockConvertToModelMessages).toHaveBeenCalledWith(messages);
    expect(streamText).toHaveBeenCalledOnce();
    expect(streamText).toHaveBeenCalledWith({
      model: { provider: "mock", model: "test-model" },
      system: SYSTEM_PROMPT,
      messages,
    });
    expect(mockResult.toUIMessageStreamResponse).toHaveBeenCalledOnce();
    expect(response).toBe(mockResponse);
  });

  it("passes multi-turn conversation messages through convertToModelMessages", async () => {
    const mockResult = {
      toUIMessageStreamResponse: vi.fn(() => new Response()),
    };
    vi.mocked(streamText).mockReturnValue(
      mockResult as ReturnType<typeof streamText>,
    );

    const messages = [
      { role: "user", content: "What is virtue?" },
      { role: "assistant", content: "What do you mean by virtue?" },
      { role: "user", content: "Living a good life" },
    ];
    const request = createRequest({ messages });

    await handleChatPost(request);

    expect(mockConvertToModelMessages).toHaveBeenCalledWith(messages);
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({ messages }),
    );
  });

  it("uses the model returned by getModelById()", async () => {
    const mockResult = {
      toUIMessageStreamResponse: vi.fn(() => new Response()),
    };
    vi.mocked(streamText).mockReturnValue(
      mockResult as ReturnType<typeof streamText>,
    );

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
    const mockResult = {
      toUIMessageStreamResponse: vi.fn(() => new Response()),
    };
    vi.mocked(streamText).mockReturnValue(
      mockResult as ReturnType<typeof streamText>,
    );

    const request = createRequest({ messages: [], modelId: "gpt-4o" });
    await handleChatPost(request);

    expect(getModelById).toHaveBeenCalledWith("gpt-4o");
  });

  it("rejects non-JSON request bodies", async () => {
    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: "not json",
    });

    await expect(handleChatPost(request)).rejects.toThrow();
  });
});
