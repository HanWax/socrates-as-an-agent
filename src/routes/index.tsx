import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const Route = createFileRoute("/")({ component: Chat });

const composerShadow = "10px 10px 18px rgba(166, 180, 200, 0.4)";

export function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const onInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const isLoading = status === "streaming" || status === "submitted";
  const hasMessages = messages && messages.length > 0;

  const submit = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Empty state
  if (!hasMessages) {
    return (
      <div className="flex flex-col h-screen bg-[#fafafa]">
        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
          <img
            src="/socrates.svg"
            alt="Socrates"
            className="w-80 h-auto mb-4"
          />
          <h1 className="text-2xl font-medium text-[#1a1a1a] mb-1">
            What would you like to examine?
          </h1>
          <p className="text-sm text-[#8b8b8b] mb-8">
            Socrates will question your assumptions.
          </p>
          <form onSubmit={handleFormSubmit} className="w-full max-w-2xl">
            <div
              className="relative rounded-2xl border border-[#d4eeec] bg-white transition-all focus-within:border-[#5BA8A0]"
              style={{ boxShadow: composerShadow }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share a thought or belief..."
                rows={3}
                className="relative z-10 w-full resize-none bg-transparent px-5 pt-4 pb-14 text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3 z-20">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#5BA8A0] text-white transition-all hover:shadow-lg hover:scale-105 disabled:bg-[#d4eeec] disabled:text-[#b5b0a8] disabled:scale-100 disabled:shadow-none"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl bg-[#5BA8A0] px-5 py-3 text-white"
                    style={{ boxShadow: composerShadow }}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <img
                    src="/socrates.svg"
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                  />
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-[15px] text-[#1a1a1a] leading-relaxed">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <img
                src="/socrates.svg"
                alt=""
                className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
              />
              <div className="flex items-center gap-1.5 py-2">
                <span className="w-2 h-2 rounded-full bg-[#5BA8A0] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#F08B8B] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#CCFFFF] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Pinned composer at bottom */}
      <div className="shrink-0 border-t border-[#eae7e3] bg-[#fafafa] px-4 py-4">
        <form onSubmit={handleFormSubmit} className="mx-auto max-w-2xl">
          <div
            className="relative rounded-2xl border border-[#d4eeec] bg-white transition-all focus-within:border-[#5BA8A0]"
            style={{ boxShadow: composerShadow }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              rows={1}
              className="relative z-10 w-full resize-none bg-transparent px-5 pt-3.5 pb-12 text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none"
              disabled={isLoading}
            />
            <div className="absolute bottom-3 right-3 z-20">
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#5BA8A0] text-white transition-all hover:shadow-lg hover:scale-105 disabled:bg-[#d4eeec] disabled:text-[#b5b0a8] disabled:scale-100 disabled:shadow-none"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
