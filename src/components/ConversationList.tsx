import React from 'react';
import { Chat, UserProfile } from '../types';
import { MessageSquare, Pin } from 'lucide-react';

interface ConversationListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  onOpenDiscover: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenDiscover,
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
              className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                isActive ? 'bg-indigo-950/30 border-l-4 border-indigo-500' : 'hover:bg-slate-900/50'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={other?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.id}`}
                  alt={other?.displayName || 'Chat'}
                  className="w-12 h-12 rounded-full object-cover bg-slate-800 border border-slate-700/80"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-slate-100 truncate">
                    {other?.displayName || 'Friend'}
                  </h4>
                  {chat.lastMessageAt && (
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate max-w-[180px]">
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

