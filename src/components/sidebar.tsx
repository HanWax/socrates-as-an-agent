import { MessageSquarePlus, Trash2, X } from "lucide-react";

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
  const { today, earlier } = groupByTime(conversations);

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
      ) : null}

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-[#eae7e3] z-50 transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eae7e3]">
          <h2 className="text-sm font-medium text-[#1a1a1a]">
            Conversations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#8b8b8b] hover:text-[#1a1a1a] hover:bg-[#f0faf9] transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={onNewConversation}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#5BA8A0] hover:bg-[#f0faf9] transition-colors"
          >
            <MessageSquarePlus size={16} />
            New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
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
  return (
    <div
      className={`group flex items-center rounded-lg transition-colors ${isActive ? "bg-[#f0faf9] text-[#5BA8A0]" : "text-[#1a1a1a] hover:bg-[#fafafa]"}`}
    >
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className="flex-1 min-w-0 px-3 py-2 text-left"
      >
        <p className="text-sm truncate">{conversation.title}</p>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(conversation.id);
        }}
        className="shrink-0 p-1.5 mr-1 rounded text-[#8b8b8b] opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
        aria-label={`Delete ${conversation.title}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
