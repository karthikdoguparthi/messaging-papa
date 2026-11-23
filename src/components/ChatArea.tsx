import React, { useEffect, useState, useRef } from 'react';
import { 
  Send, 
  Smile, 
  Reply, 
  Trash2, 
  Edit2, 
  X, 
  MoreVertical, 
  ShieldAlert, 
  UserX, 
  Check, 
  CheckCheck,
  ChevronLeft,
  Lock
} from 'lucide-react';
import { Chat, ChatMessage, UserProfile } from '../types';
import { chatService } from '../services/chatService';
import { privacyService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

interface ChatAreaProps {
  chat: Chat;
  onBack: () => void;
  onReportUser: (targetUser: UserProfile) => void;
  onBlockUser: (targetUser: UserProfile) => void;
}

const COMMON_REACTIONS = ['❤️', '👍', '🔥', '😂', '🎉', '😮'];

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onBack, onReportUser, onBlockUser }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = chatService.subscribeMessages(chat.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !text.trim()) return;

    if (editingMessage) {
      await chatService.editMessage(chat.id, editingMessage.id, text);
      setEditingMessage(null);
      setText('');
      return;
    }

    const replyPayload = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.text,
      senderName: replyingTo.senderUid === profile.uid ? 'You' : (chat.otherMember?.displayName || 'Friend')
    } : undefined;

    await chatService.sendMessage(chat.id, profile.uid, text, replyPayload);
    setText('');
    setReplyingTo(null);
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!profile) return;
    await chatService.toggleReaction(chat.id, messageId, emoji, profile.uid);
    setActiveReactionPickerMsgId(null);
  };

  const isRecent = (timestamp: number) => {
    return Date.now() - timestamp < 1000 * 60 * 10;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] relative">
      {/* Top Chat Header */}
      <div className="h-16 px-4 md:px-6 border-b border-slate-800/80 bg-[#0f1420]/90 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <img
              src={chat.otherMember?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.id}`}
              alt={chat.otherMember?.displayName || 'Friend'}
              className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700"
            />
            {chat.otherMember && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f1420] ${
                isRecent(chat.otherMember.lastSeenAt) ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-slate-100 text-sm">{chat.otherMember?.displayName || 'Friend'}</h3>
              <span title="End-to-End Encrypted (AES-GCM)" className="inline-flex items-center">
                <Lock className="w-3 h-3 text-emerald-400" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              @{chat.otherMember?.username || 'user'} • {isRecent(chat.otherMember?.lastSeenAt || 0) ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Dropdown Menu for options */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showOptionsDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-[#151a26] border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs">
              {chat.otherMember && (
                <>
                  <button
                    onClick={() => {
                      onReportUser(chat.otherMember!);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Report Account</span>
                  </button>
                  <button
                    onClick={() => {
                      onBlockUser(chat.otherMember!);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Block Member</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
            <p>End-to-end encrypted private friendship chat.</p>
            <p className="mt-1">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUid === profile?.uid;
            const isDeleted = !!msg.deletedAt;

            return (
              <div
                key={msg.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Reply quote preview if any */}
                {msg.replyToMessage && (
                  <div className={`text-[11px] mb-1 px-3 py-1 rounded-t-lg bg-slate-800/60 border-l-2 border-indigo-400 text-slate-300 max-w-sm ${isMe ? 'mr-1' : 'ml-1'}`}>
                    <span className="font-semibold text-indigo-400">{msg.replyToMessage.senderName}: </span>
                    <span className="truncate">{msg.replyToMessage.text}</span>
                  </div>
                )}

                <div className="relative flex items-center gap-2 max-w-[85%] md:max-w-[70%]">
                  {/* Action buttons (Reply, React, Edit, Delete) - shown on hover */}
                  {!isDeleted && (
                    <div className={`hidden group-hover:flex items-center gap-1 bg-[#151a26] border border-slate-800 rounded-lg p-0.5 shadow-md ${
                      isMe ? 'order-first mr-1' : 'order-last ml-1'
                    }`}>
                      <button
                        onClick={() => setActiveReactionPickerMsgId(activeReactionPickerMsgId === msg.id ? null : msg.id)}
                        className="p-1 hover:text-amber-400 text-slate-400 transition-colors"
                        title="React"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(msg);
                          setEditingMessage(null);
                        }}
                        className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      {isMe && (
                        <>
                          <button
                            onClick={() => {
                              setEditingMessage(msg);
                              setText(msg.text);
                              setReplyingTo(null);
                            }}
                            className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => chatService.deleteMessage(chat.id, msg.id)}
                            className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isDeleted
                        ? 'bg-slate-900/60 text-slate-500 italic border border-slate-800/40'
                        : isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/10'
                        : 'bg-[#151a26] text-slate-100 rounded-bl-xs border border-slate-800/80'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-70">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.editedAt && <span>(edited)</span>}
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>

                {/* Reaction Picker Popover */}
                {activeReactionPickerMsgId === msg.id && (
                  <div className={`flex items-center gap-1.5 mt-1.5 p-1.5 bg-[#181f2e] border border-slate-700/80 rounded-full shadow-lg z-20 ${
                    isMe ? 'mr-2' : 'ml-2'
                  }`}>
                    {COMMON_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="p-1 hover:scale-125 transition-transform text-sm cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Render Attached Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (
                      <button
                        key={emoji}
                        onClick={() => profile && handleToggleReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                          profile && uids.includes(profile.uid)
                            ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-medium">{uids.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply or Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate text-slate-300">
            {replyingTo ? (
              <>
                <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">Replying to message: "{replyingTo.text}"</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Editing message</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Text Input Bar */}
      <form onSubmit={handleSend} className="p-3 md:p-4 bg-[#0f1420] border-t border-slate-800/80 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a private message..."
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

