import React from 'react';
import { Chat, UserProfile } from '../types';
import { MessageSquare, Pin, Trash2 } from 'lucide-react';

interface ConversationListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onOpenDiscover: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenDiscover,
  onDeleteChat,
}) => {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
      {chats.length > 0 ? (
        chats.map((chat) => {
          const isActive = chat.id === activeChatId;
          const other = chat.otherMember;

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`p-3.5 flex items-center justify-between group cursor-pointer transition-colors ${
                isActive ? 'bg-indigo-950/30 border-l-4 border-indigo-500' : 'hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="relative shrink-0">
                  <img
                    src={other?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.id}`}
                    alt={other?.displayName || 'Chat'}
                    className="w-12 h-12 rounded-full object-cover bg-slate-800 border border-slate-700/80"
                  />
                  {chat.pinned && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[9px] shadow">
                      <Pin className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <h4 className="font-semibold text-sm text-slate-100 truncate">
                        {other?.displayName || 'Friend'}
                      </h4>
                      {chat.pinned && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-medium shrink-0">
                          Pinned
                        </span>
                      )}
                    </div>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate max-w-[170px]">
                      {chat.lastMessageText || 'No messages yet'}
                    </p>
                    {(chat.unreadCount || 0) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {onDeleteChat && (
                <button
                  type="button"
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this conversation?")) {
                      onDeleteChat(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="font-medium">No conversations yet.</p>
          <button
            onClick={onOpenDiscover}
            className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Find Friends
          </button>
        </div>
      )}
    </div>
  );
};


