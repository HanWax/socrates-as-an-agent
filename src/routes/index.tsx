import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { BookmarkCheck, ChevronDown, Globe, ImagePlus, X } from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ModelOption {
  id: string;
  name: string;
  provider: string;
}

export const Route = createFileRoute("/")({ component: Chat });

const composerShadow = "10px 10px 18px rgba(166, 180, 200, 0.4)";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function WebSearchPart({
  state,
  output,
}: {
  state: string;
  output?: { results: SearchResult[]; error?: string };
}) {
  const [open, setOpen] = useState(false);

  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <Globe size={14} className="animate-spin" />
        Searching the web...
      </div>
    );
  }

  const results = output?.results ?? [];

  return (
    <div className="my-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] text-[13px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 font-medium text-[#1a1a1a]"
      >
        <Globe size={14} className="text-[#5BA8A0]" />
        Web search ({results.length} results)
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-[#d4eeec] px-3 py-2 space-y-2">
          {results.map((r) => (
            <div key={r.url}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#5BA8A0] hover:underline"
              >
                {r.title}
              </a>
              <p className="text-[#8b8b8b] leading-snug">{r.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SaveInsightPart({
  state,
  output,
}: {
  state: string;
  output?: { saved: boolean; insight: string; topic: string | null };
}) {
  if (state !== "output-available") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#8b8b8b] italic py-1">
        <BookmarkCheck size={14} className="animate-pulse" />
        Saving insight...
      </div>
    );
  }

  return (
    <div className="my-2 flex items-start gap-2 rounded-xl border border-[#d4eeec] bg-[#f0faf9] px-3 py-2 text-[13px]">
      <BookmarkCheck size={14} className="mt-0.5 text-[#5BA8A0] shrink-0" />
      <div>
        <span className="font-medium text-[#1a1a1a]">Insight saved</span>
        {output?.topic && (
          <span className="text-[#8b8b8b]"> in {output.topic}</span>
        )}
      </div>
    </div>
  );
}

function removeFileAtIndex(files: FileList, index: number): FileList {
  const dt = new DataTransfer();
  for (let i = 0; i < files.length; i++) {
    if (i !== index) dt.items.add(files[i]);
  }
  return dt.files;
}

export function Chat() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");

  const { messages, sendMessage, status } = useChat({
    body: { modelId: selectedModelId },
  });
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data: ModelOption[]) => {
        setModels(data);
        if (data.length > 0) setSelectedModelId(data[0].id);
      });
  }, []);

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
  const hasFiles = files && files.length > 0;

  const submit = useCallback(() => {
    const text = input.trim();
    if ((!text && !hasFiles) || isLoading) return;
    setInput("");
    sendMessage({ text, files });
    setFiles(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, sendMessage, files, hasFiles]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    submit();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    if (!files) return;
    const updated = removeFileAtIndex(files, index);
    if (updated.length === 0) {
      setFiles(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFiles(updated);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dt = new DataTransfer();
    for (const file of Array.from(e.dataTransfer.files)) {
      if (file.type.startsWith("image/")) {
        dt.items.add(file);
      }
    }
    if (dt.files.length > 0) {
      setFiles(dt.files);
    }
  };

  const filePreview = hasFiles ? (
    <div
      className="flex gap-2 px-5 pt-3 pb-1 overflow-x-auto"
      data-testid="file-preview"
    >
      {Array.from(files).map((file, index) => (
        <div
          key={`${file.name}-${file.lastModified}`}
          className="relative shrink-0 group"
        >
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="w-16 h-16 rounded-lg object-cover border border-[#d4eeec]"
          />
          <button
            type="button"
            onClick={() => removeFile(index)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Remove ${file.name}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  ) : null;

  const uploadButton = (
    <div className="absolute bottom-3 left-3 z-20">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-[#8b8b8b] transition-all hover:text-[#5BA8A0] hover:bg-[#f0faf9] disabled:opacity-50 disabled:hover:text-[#8b8b8b] disabled:hover:bg-transparent"
        aria-label="Upload image"
      >
        <ImagePlus size={18} />
      </button>
    </div>
  );

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      onChange={handleFileChange}
      className="hidden"
      data-testid="file-input"
    />
  );

  const renderMessageParts = (message: (typeof messages)[number]) => {
    const elements: React.ReactNode[] = [];
    const imageFiles: { filename?: string }[] = [];

    for (const part of message.parts) {
      if (part.type === "text") {
        if (message.role === "assistant") {
          elements.push(
            <div
              key={`text-${part.text.slice(0, 32)}`}
              className="prose-socrates text-[15px] leading-relaxed"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>,
          );
        } else {
          elements.push(
            <div
              key={`text-${part.text.slice(0, 32)}`}
              className="prose-user text-[15px] leading-relaxed"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {part.text}
              </ReactMarkdown>
            </div>,
          );
        }
      } else if (
        part.type === "file" &&
        typeof part.mediaType === "string" &&
        part.mediaType.startsWith("image/")
      ) {
        imageFiles.push({ filename: part.filename });
      } else if (part.type === "tool-webSearch") {
        elements.push(
          <WebSearchPart
            key={`ws-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as {
                    results: SearchResult[];
                    error?: string;
                  })
                : undefined
            }
          />,
        );
      } else if (part.type === "tool-saveInsight") {
        elements.push(
          <SaveInsightPart
            key={`si-${part.toolCallId}`}
            state={part.state}
            output={
              part.state === "output-available"
                ? (part.output as {
                    saved: boolean;
                    insight: string;
                    topic: string | null;
                  })
                : undefined
            }
          />,
        );
      }
    }

    if (imageFiles.length > 0) {
      const count = imageFiles.length;
      const label = `${count} ${count === 1 ? "image" : "images"} attached`;
      const names = imageFiles
        .map((f) => f.filename)
        .filter(Boolean)
        .join(", ");

      elements.push(
        <p key="image-summary" className="text-[13px] italic opacity-80 mt-1">
          {label}
          {names && ` (${names})`}
        </p>,
      );
    }

    return elements;
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
          <p className="text-sm text-[#8b8b8b] mb-4">
            Socrates will question your assumptions.
          </p>
          {models.length > 1 && (
            <div className="relative mb-6">
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="appearance-none rounded-lg border border-[#d4eeec] bg-white px-3 py-1.5 pr-8 text-xs text-[#8b8b8b] focus:border-[#5BA8A0] focus:outline-none cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
              />
            </div>
          )}
          <form
            onSubmit={handleFormSubmit}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="w-full max-w-2xl"
          >
            {hiddenFileInput}
            <div
              className={`relative rounded-2xl border bg-white transition-all focus-within:border-[#5BA8A0] ${isDragging ? "border-[#5BA8A0] border-dashed border-2" : "border-[#d4eeec]"}`}
              style={{ boxShadow: composerShadow }}
            >
              {filePreview}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share a thought or belief..."
                rows={3}
                className="relative z-10 w-full resize-none bg-transparent pl-14 pr-5 pt-4 pb-14 text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none"
                disabled={isLoading}
              />
              {uploadButton}
              <div className="absolute bottom-3 right-3 z-20">
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !hasFiles)}
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
      {/* Sticky Socrates header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 bg-[#fafafa] border-b border-[#eae7e3]">
        <img src="/socrates.svg" alt="Socrates" className="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-medium text-[#1a1a1a] leading-tight">
            Socrates
          </h1>
          <p className="text-xs text-[#8b8b8b]">Questioning your assumptions</p>
        </div>
        {models.length > 1 && (
          <div className="relative shrink-0">
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="appearance-none rounded-lg border border-[#d4eeec] bg-white px-3 py-1.5 pr-8 text-xs text-[#8b8b8b] focus:border-[#5BA8A0] focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
            />
          </div>
        )}
      </div>

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
                    {renderMessageParts(message)}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <img
                    src="/socrates.svg"
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                  />
                  <div className="min-w-0">{renderMessageParts(message)}</div>
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
        <form
          onSubmit={handleFormSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="mx-auto max-w-2xl"
        >
          {hiddenFileInput}
          <div
            className={`relative rounded-2xl border bg-white transition-all focus-within:border-[#5BA8A0] ${isDragging ? "border-[#5BA8A0] border-dashed border-2" : "border-[#d4eeec]"}`}
            style={{ boxShadow: composerShadow }}
          >
            {filePreview}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply..."
              rows={1}
              className="relative z-10 w-full resize-none bg-transparent pl-14 pr-5 pt-3.5 pb-12 text-[15px] text-[#1a1a1a] placeholder:text-[#b5b0a8] focus:outline-none"
              disabled={isLoading}
            />
            {uploadButton}
            <div className="absolute bottom-3 right-3 z-20">
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !hasFiles)}
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
