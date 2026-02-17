import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// --- Mocks ---

const mockSendMessage = vi.fn();
const mockUseChat = vi.fn();

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
}));

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock fetch for /api/models
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn((input) => {
    if (typeof input === "string" && input === "/api/models") {
      return Promise.resolve(
        new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return originalFetch(input);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

import { Chat } from "./index";

// --- Helpers ---

function useChatDefaults(overrides: Record<string, unknown> = {}) {
  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage: mockSendMessage,
    status: "ready",
    ...overrides,
  });
}

function makeMessage(id: string, role: "user" | "assistant", text: string) {
  return { id, role, parts: [{ type: "text" as const, text }] };
}

function makeImageMessage(
  id: string,
  role: "user" | "assistant",
  text: string,
  mediaType = "image/png",
  filename?: string,
) {
  return {
    id,
    role,
    parts: [
      { type: "text" as const, text },
      {
        type: "file" as const,
        mediaType,
        data: "iVBOR",
        url: "data:image/png;base64,iVBOR",
        ...(filename && { filename }),
      },
    ],
  };
}

// --- Tests ---

describe("Chat", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useChatDefaults();
  });

  it("calls useChat on mount", () => {
    render(<Chat />);
    expect(mockUseChat).toHaveBeenCalledOnce();
  });

  describe("empty state", () => {
    it("renders the title", () => {
      render(<Chat />);
      expect(screen.getByText("What would you like to examine?")).toBeDefined();
    });

    it("renders the subtitle", () => {
      render(<Chat />);
      expect(
        screen.getByText("Socrates will question your assumptions."),
      ).toBeDefined();
    });

    it("renders the Socrates logo", () => {
      render(<Chat />);
      const img = screen.getByAltText("Socrates");
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("/socrates.svg");
    });

    it("renders a textarea with placeholder", () => {
      render(<Chat />);
      expect(
        screen.getByPlaceholderText("Share a thought or belief..."),
      ).toBeDefined();
    });

    it("disables submit button when input is empty", () => {
      render(<Chat />);
      const submitButtons = screen
        .getAllByRole("button")
        .filter((b) => b.getAttribute("type") === "submit");
      expect(submitButtons[0].hasAttribute("disabled")).toBe(true);
    });

    it("enables submit button when input has text", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );
      fireEvent.change(textarea, { target: { value: "What is justice?" } });
      const submitButtons = screen
        .getAllByRole("button")
        .filter((b) => b.getAttribute("type") === "submit");
      expect(submitButtons[0].hasAttribute("disabled")).toBe(false);
    });

    it("disables textarea while loading", () => {
      useChatDefaults({ status: "streaming" });
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );
      expect(textarea.hasAttribute("disabled")).toBe(true);
    });

    it("renders image upload button", () => {
      render(<Chat />);
      const uploadBtn = screen.getByLabelText("Upload image");
      expect(uploadBtn).toBeDefined();
    });
  });

  describe("conversation view", () => {
    it("renders user messages", () => {
      useChatDefaults({
        messages: [makeMessage("1", "user", "What is justice?")],
      });
      render(<Chat />);
      expect(screen.getByText("What is justice?")).toBeDefined();
    });

    it("renders assistant messages", () => {
      useChatDefaults({
        messages: [
          makeMessage("1", "user", "What is justice?"),
          makeMessage("2", "assistant", "What do you mean by justice?"),
        ],
      });
      render(<Chat />);
      expect(screen.getByText("What do you mean by justice?")).toBeDefined();
    });

    it("renders Socrates avatar next to assistant messages", () => {
      useChatDefaults({
        messages: [
          makeMessage("1", "user", "Hello"),
          makeMessage("2", "assistant", "Greetings"),
        ],
      });
      const { container } = render(<Chat />);
      const avatars = container.querySelectorAll('img[src="/socrates.svg"]');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it("shows loading dots when streaming and last message is from user", () => {
      useChatDefaults({
        messages: [makeMessage("1", "user", "Hello")],
        status: "streaming",
      });
      const { container } = render(<Chat />);
      const dots = container.querySelectorAll(".animate-bounce");
      expect(dots.length).toBe(3);
    });

    it("hides loading dots when last message is from assistant", () => {
      useChatDefaults({
        messages: [
          makeMessage("1", "user", "Hello"),
          makeMessage("2", "assistant", "Thinking..."),
        ],
        status: "streaming",
      });
      const { container } = render(<Chat />);
      const dots = container.querySelectorAll(".animate-bounce");
      expect(dots.length).toBe(0);
    });

    it("shows reply placeholder in conversation view", () => {
      useChatDefaults({
        messages: [makeMessage("1", "user", "Hello")],
      });
      render(<Chat />);
      expect(screen.getByPlaceholderText("Reply...")).toBeDefined();
    });

    it("renders image attachment summary in user messages", () => {
      useChatDefaults({
        messages: [
          makeImageMessage(
            "1",
            "user",
            "Look at this",
            "image/png",
            "photo.png",
          ),
        ],
      });
      render(<Chat />);
      expect(screen.getByText("1 image attached (photo.png)")).toBeDefined();
    });

    it("renders image attachment summary in assistant messages", () => {
      useChatDefaults({
        messages: [
          makeMessage("1", "user", "Hello"),
          makeImageMessage("2", "assistant", "Here is an image"),
        ],
      });
      render(<Chat />);
      expect(screen.getByText("1 image attached")).toBeDefined();
    });
  });

  describe("keyboard interaction", () => {
    it("calls sendMessage when Cmd+Enter is pressed with input", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ text: "What is virtue?" }),
      );
    });

    it("calls sendMessage when Ctrl+Enter is pressed with input", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ text: "What is virtue?" }),
      );
    });

    it("does not submit on plain Enter", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("does not submit when Cmd+Enter is pressed with empty input", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );

      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("does not submit when loading", () => {
      useChatDefaults({ status: "streaming" });
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief...",
      );

      fireEvent.change(textarea, { target: { value: "Hello" } });
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
