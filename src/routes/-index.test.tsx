import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
const mockUseAuth = vi.fn(() => ({ isLoaded: true, isSignedIn: true }));

vi.mock("@ai-sdk/react", () => ({
  useChat: (...args: unknown[]) => mockUseChat(...args),
}));
vi.mock("@clerk/tanstack-react-start", () => ({
  useAuth: () => mockUseAuth(),
  SignIn: () => <div data-testid="clerk-sign-in">SignIn component</div>,
  SignUp: () => <div data-testid="clerk-sign-up">SignUp component</div>,
  UserButton: () => null,
}));

const mockSearch = { c: undefined as string | undefined };
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useSearch: () => mockSearch,
  }),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: unknown }) => (
    <div data-testid="router-navigate" data-to={String(to)} />
  ),
}));

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock fetch for /api/models
const originalFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = vi.fn(
    (input: string | URL | Request, init?: RequestInit) => {
      if (typeof input === "string" && input === "/api/models") {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (typeof input === "string" && input === "/api/conversations") {
        if (init?.method === "POST") {
          return Promise.resolve(
            new Response(JSON.stringify({ id: "test-conv-id" }), {
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify({ conversations: [] }), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (
        typeof input === "string" &&
        input.startsWith("/api/conversations/")
      ) {
        return Promise.resolve(
          new Response(JSON.stringify({}), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return originalFetch(input);
    },
  ) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
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
    mockSearch.c = undefined;
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });
    useChatDefaults();
  });

  it("calls useChat on mount", () => {
    render(<Chat />);
    expect(mockUseChat).toHaveBeenCalled();
  });

  describe("empty state", () => {
    it("renders a tagline", () => {
      render(<Chat />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeDefined();
      expect(heading.textContent).toBeTruthy();
    });

    it("renders the logo", () => {
      render(<Chat />);
      const img = screen.getByAltText("Socrates as a Service");
      expect(img).toBeDefined();
      expect(img.getAttribute("src")).toBe("/socrates.svg");
    });

    it("renders a textarea with placeholder", () => {
      render(<Chat />);
      expect(
        screen.getByPlaceholderText("Share a thought or belief…"),
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
        "Share a thought or belief…",
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
        "Share a thought or belief…",
      );
      expect(textarea.hasAttribute("disabled")).toBe(true);
    });

    it("renders image upload button", () => {
      render(<Chat />);
      const uploadBtn = screen.getByLabelText("Upload image");
      expect(uploadBtn).toBeDefined();
    });
  });

  describe("authentication gate", () => {
    it("redirects to sign-in route when signed out", () => {
      mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });

      render(<Chat />);

      const redirect = screen.getByTestId("router-navigate");
      expect(redirect.getAttribute("data-to")).toBe("/sign-in/$");
      expect(screen.queryByTestId("clerk-sign-in")).toBeNull();
      expect(screen.queryByTestId("clerk-sign-up")).toBeNull();
    });

    it("shows loading state while auth state is unresolved", () => {
      mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false });

      render(<Chat />);

      expect(screen.getByText("Loading session…")).toBeDefined();
      expect(screen.queryByTestId("router-navigate")).toBeNull();
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

    it("renders avatar next to assistant messages", () => {
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
      expect(screen.getByPlaceholderText("Reply…")).toBeDefined();
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

  it("ignores stale conversation fetch when navigating quickly", async () => {
    mockUseChat.mockImplementation(
      (opts: { messages?: ReturnType<typeof makeMessage>[] }) => ({
        messages: opts.messages ?? [],
        sendMessage: mockSendMessage,
        status: "ready",
      }),
    );

    let resolveFirstConversationFetch: ((res: Response) => void) | null = null;
    const firstConversationFetch = new Promise<Response>((resolve) => {
      resolveFirstConversationFetch = resolve;
    });

    globalThis.fetch = vi.fn(
      (input: string | URL | Request, init?: RequestInit) => {
        if (typeof input === "string" && input === "/api/models") {
          return Promise.resolve(
            new Response(JSON.stringify([]), {
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        if (typeof input === "string" && input === "/api/conversations") {
          if (init?.method === "POST") {
            return Promise.resolve(
              new Response(JSON.stringify({ id: "test-conv-id" }), {
                headers: { "Content-Type": "application/json" },
              }),
            );
          }
          return Promise.resolve(
            new Response(JSON.stringify({ conversations: [] }), {
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        if (
          typeof input === "string" &&
          input.startsWith("/api/conversations/")
        ) {
          const id = input.split("/").pop() ?? "";
          if (id === "first") return firstConversationFetch;
          return Promise.resolve(
            new Response(
              JSON.stringify({
                messages: [
                  {
                    id: `msg-${id}`,
                    role: "assistant",
                    content: [{ type: "text", text: `Message ${id}` }],
                    created_at: "2024-01-01T00:00:00Z",
                  },
                ],
              }),
              { headers: { "Content-Type": "application/json" } },
            ),
          );
        }
        return Promise.reject(new Error(`Unhandled fetch: ${String(input)}`));
      },
    ) as typeof fetch;

    mockSearch.c = "first";
    const { rerender } = render(<Chat />);

    mockSearch.c = "second";
    rerender(<Chat />);

    await waitFor(() => {
      expect(screen.getByText("Message second")).toBeDefined();
    });

    resolveFirstConversationFetch?.(
      new Response(
        JSON.stringify({
          messages: [
            {
              id: "msg-first",
              role: "assistant",
              content: [{ type: "text", text: "Message first" }],
              created_at: "2024-01-01T00:00:00Z",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    await Promise.resolve();
    expect(screen.queryByText("Message first")).toBeNull();
  });

  describe("keyboard interaction", () => {
    it("calls sendMessage when Cmd+Enter is pressed with input", async () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief…",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({ text: "What is virtue?" }),
          expect.objectContaining({ body: expect.any(Object) }),
        );
      });
    });

    it("calls sendMessage when Ctrl+Enter is pressed with input", async () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief…",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          expect.objectContaining({ text: "What is virtue?" }),
          expect.objectContaining({ body: expect.any(Object) }),
        );
      });
    });

    it("does not submit on plain Enter", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief…",
      );

      fireEvent.change(textarea, { target: { value: "What is virtue?" } });
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("does not submit when Cmd+Enter is pressed with empty input", () => {
      useChatDefaults();
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief…",
      );

      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("does not submit when loading", () => {
      useChatDefaults({ status: "streaming" });
      render(<Chat />);
      const textarea = screen.getByPlaceholderText(
        "Share a thought or belief…",
      );

      fireEvent.change(textarea, { target: { value: "Hello" } });
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });
});
