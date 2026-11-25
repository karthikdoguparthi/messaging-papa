import React from 'react';
import { Chat } from '../types';
import { MessageSquare, Pin, Trash2 } from 'lucide-react';

interface ConversationListProps {
  chats: Chat[];
  activeChatId: string | null;
  currentUid?: string;
  onSelectChat: (chat: Chat) => void;
  onOpenDiscover: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  chats,
  activeChatId,
  currentUid,
  onSelectChat,
  onOpenDiscover,
  onDeleteChat,
}) => {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-hairline)]">
      {chats.length > 0 ? (
        chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          const other = chat.otherMember;
          const rawUnread = (currentUid && chat.unreadCounts?.[currentUid]) ?? chat.unreadCount ?? 0;
          const unread = Number(rawUnread) || 0;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`px-4 py-3 flex items-center justify-between group cursor-pointer transition-colors duration-150 ${
                isActive
                  ? 'bg-[var(--bg-raised)]'
                  : 'hover:bg-[var(--bg-surface)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="relative shrink-0">
                  <img
                    src={other?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.id}`}
                    alt={other?.displayName || 'Chat'}
                    className="w-10 h-10 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                  />
                  {chat.pinned && (
                    <span
                      title="Pinned"
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-full flex items-center justify-center text-[var(--text-secondary)]"
                    >
                      <Pin size={10} strokeWidth={1.5} />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-medium text-[14px] text-[var(--text-primary)] truncate">
                        {other?.displayName || 'Friend'}
                      </h4>
                      {chat.pinned && (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono shrink-0">
                          Notes
                        </span>
                      )}
                    </div>
                    {chat.lastMessageAt && (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums shrink-0">
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-[var(--text-secondary)] truncate">
                      {chat.lastMessageText || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-[6px] text-[11px] font-mono font-medium tabular-nums bg-[var(--accent)] text-[var(--accent-text)] shrink-0">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onDeleteChat && !chat.pinned && (
                <button
                  type="button"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      onDeleteChat(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--semantic-negative)] rounded-[6px] transition-[opacity,color] duration-150 cursor-pointer"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              )}
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center">
          <MessageSquare size={20} strokeWidth={1.5} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-[13px] text-[var(--text-secondary)]">No conversations yet</p>
          <button
            type="button"
            onClick={onOpenDiscover}
            className="mt-3 px-3 py-1.5 rounded-[8px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-[13px] font-medium hover:bg-[var(--btn-primary-hover)] transition-colors duration-150 cursor-pointer"
          >
            Find friends
          </button>
        </div>
      )}
    </div>
  );
};
