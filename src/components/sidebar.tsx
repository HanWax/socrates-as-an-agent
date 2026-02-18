import { MessageSquarePlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface ConversationItem {
  id: string;
  title: string;
  updated_at: string;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  conversations: ConversationItem[];
  currentConversationId: string | undefined;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

function groupByTime(conversations: ConversationItem[]) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const today: ConversationItem[] = [];
  const earlier: ConversationItem[] = [];

  for (const c of conversations) {
    const updated = new Date(c.updated_at);
    if (updated >= startOfToday) {
      today.push(c);
    } else {
      earlier.push(c);
    }
  }

  return { today, earlier };
}

export function Sidebar({
  open,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { today, earlier } = useMemo(
    () =>
      isHydrated
        ? groupByTime(conversations)
        : { today: [], earlier: conversations },
    [conversations, isHydrated],
  );

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <button
          type="button"
          className="fixed inset-0 bg-black/20 z-40 transition-opacity cursor-default md:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}

      {/* Panel */}
      <div
        className={`flex flex-col fixed top-0 left-0 h-full w-72 bg-[#F5F0E8]/95 backdrop-blur border-r border-[#1A1A1A]/15 z-50 transform transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:shrink-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]/10">
          <h2 className="text-sm font-medium text-[#1a1a1a]">Conversations</h2>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#8b8b8b] hover:text-[#1a1a1a] hover:bg-[#EDE8DF] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={onNewConversation}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1D3557] hover:bg-[#EDE8DF] transition-colors"
          >
            <MessageSquarePlus size={16} />
            New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          {today.length > 0 ? (
            <div className="mb-4">
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#8b8b8b]">
                Today
              </p>
              {today.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  isActive={c.id === currentConversationId}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          ) : null}
          {earlier.length > 0 ? (
            <div>
              <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#8b8b8b]">
                Earlier
              </p>
              {earlier.map((c) => (
                <ConversationRow
                  key={c.id}
                  conversation={c}
                  isActive={c.id === currentConversationId}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          ) : null}
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[#8b8b8b] text-center">
              No conversations yet
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function ConversationRow({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: ConversationItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      className={`group flex items-center rounded-lg transition-colors ${isActive ? "bg-[#D8E2F0] text-[#1D3557]" : "text-[#1a1a1a] hover:bg-[#EDE8DF]"}`}
    >
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className="flex-1 min-w-0 px-3 py-2 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D3557]/60"
        aria-current={isActive ? "page" : undefined}
      >
        <p className="text-sm truncate">{conversation.title}</p>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        className="shrink-0 p-1.5 mr-1 rounded text-[#8b8b8b] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:text-red-500 hover:bg-red-50 transition-colors transition-opacity"
        aria-label={`Delete ${conversation.title}`}
      >
        <Trash2 size={14} />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete conversation"
        description={`Are you sure you want to delete "${conversation.title}"? This action cannot be undone.`}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(conversation.id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
