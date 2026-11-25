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
  CheckCheck,
  ChevronLeft,
  Lock
} from 'lucide-react';
import { Chat, ChatMessage, UserProfile } from '../types';
import { chatService } from '../services/chatService';
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
    <div className="flex-1 flex flex-col h-[100dvh] md:h-full w-full bg-[var(--bg-canvas)] fixed md:relative inset-0 z-40 overflow-hidden">
      {/* Top Chat Header */}
      <div className="h-16 shrink-0 px-4 md:px-6 border-b border-[var(--border-hairline)] bg-[var(--bg-sidebar)] flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }}
            className="md:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-raised)] rounded-[8px] cursor-pointer touch-manipulation z-30"
            title="Back"
          >
            <ChevronLeft size={18} strokeWidth={1.5} className="pointer-events-none" />
          </button>

          <div className="relative shrink-0">
            <img
              src={chat.otherMember?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${chat.id}`}
              alt={chat.otherMember?.displayName || 'Friend'}
              className="w-9 h-9 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
            />
            {chat.otherMember && (
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-sidebar)] ${
                isRecent(chat.otherMember.lastSeenAt) ? 'bg-[var(--semantic-positive)]' : 'bg-[var(--text-muted)]'
              }`} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[14px] text-[var(--text-primary)] truncate">
                {chat.otherMember?.displayName || 'Friend'}
              </h3>
              <span
                title="End-to-end encrypted (AES-GCM)"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[11px] font-mono text-[var(--accent)] shrink-0"
              >
                <Lock size={11} strokeWidth={1.5} />
                <span className="hidden sm:inline">E2EE</span>
              </span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] font-mono truncate">
              @{chat.otherMember?.username || 'user'} · {isRecent(chat.otherMember?.lastSeenAt || 0) ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[8px] hover:bg-[var(--bg-raised)] transition-colors duration-150 cursor-pointer"
          >
            <MoreVertical size={18} strokeWidth={1.5} />
          </button>

          {showOptionsDropdown && (
            <div
              className="absolute right-0 top-11 w-48 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[10px] py-1 z-50 text-[13px]"
              style={{ boxShadow: 'var(--shadow-floating)' }}
            >
              {chat.otherMember && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onReportUser(chat.otherMember!);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldAlert size={15} strokeWidth={1.5} />
                    <span>Report account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBlockUser(chat.otherMember!);
                      setShowOptionsDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-[var(--semantic-negative)] hover:bg-[var(--bg-raised)] flex items-center gap-2 cursor-pointer"
                  >
                    <UserX size={15} strokeWidth={1.5} />
                    <span>Block member</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent)] mb-3">
              <Lock size={16} strokeWidth={1.5} />
            </div>
            <p className="text-[14px] text-[var(--text-secondary)]">End-to-end encrypted conversation</p>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">Send a message to begin</p>
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
                {/* Reply quote preview */}
                {msg.replyToMessage && (
                  <div className={`text-[12px] mb-1 px-3 py-1.5 rounded-[8px] bg-[var(--bg-surface)] border-l-2 border-[var(--accent)] text-[var(--text-secondary)] max-w-sm ${isMe ? 'mr-1' : 'ml-1'}`}>
                    <span className="font-medium text-[var(--text-primary)]">{msg.replyToMessage.senderName}: </span>
                    <span className="truncate">{msg.replyToMessage.text}</span>
                  </div>
                )}

                <div className="relative flex items-center gap-2 max-w-[85%] md:max-w-[68%]">
                  {/* Action buttons */}
                  {!isDeleted && (
                    <div className={`hidden group-hover:flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[8px] p-1 ${
                      isMe ? 'order-first mr-1' : 'order-last ml-1'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setActiveReactionPickerMsgId(activeReactionPickerMsgId === msg.id ? null : msg.id)}
                        className="p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
                        title="React"
                      >
                        <Smile size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(msg);
                          setEditingMessage(null);
                        }}
                        className="p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
                        title="Reply"
                      >
                        <Reply size={14} strokeWidth={1.5} />
                      </button>
                      {isMe && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessage(msg);
                              setText(msg.text);
                              setReplyingTo(null);
                            }}
                            className="p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => chatService.deleteMessage(chat.id, msg.id)}
                            className="p-1 hover:text-[var(--semantic-negative)] text-[var(--text-muted)] transition-colors duration-150 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-[12px] text-[14px] leading-[20px] ${
                      isDeleted
                        ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-hairline)]'
                        : isMe
                        ? 'bg-[var(--bubble-own-bg)] text-[var(--bubble-own-text)] border border-[var(--border-hairline)]'
                        : 'bg-[var(--bubble-other-bg)] text-[var(--bubble-other-text)] border border-[var(--border-hairline)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[11px] font-mono tabular-nums opacity-65">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.editedAt && <span>edited</span>}
                      {isMe && <CheckCheck size={12} strokeWidth={1.5} />}
                    </div>
                  </div>
                </div>

                {/* Reaction Picker */}
                {activeReactionPickerMsgId === msg.id && (
                  <div
                    className={`flex items-center gap-1 mt-1.5 p-1.5 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[10px] z-20 ${
                      isMe ? 'mr-1' : 'ml-1'
                    }`}
                    style={{ boxShadow: 'var(--shadow-floating)' }}
                  >
                    {COMMON_REACTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="px-1.5 py-0.5 hover:bg-[var(--bg-raised)] rounded-[6px] transition-colors duration-150 text-[14px] cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Attached Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {Object.entries(msg.reactions).map(([emoji, uids]) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => profile && handleToggleReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[12px] border cursor-pointer transition-colors duration-150 ${
                          profile && uids.includes(profile.uid)
                            ? 'bg-[var(--bg-raised)] border-[var(--accent)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[11px] font-mono tabular-nums">{uids.length}</span>
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
        <div className="px-4 py-2 bg-[var(--bg-sidebar)] border-t border-[var(--border-hairline)] flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 truncate text-[var(--text-secondary)]">
            {replyingTo ? (
              <>
                <Reply size={14} strokeWidth={1.5} className="text-[var(--accent)] shrink-0" />
                <span className="truncate">Replying to "{replyingTo.text}"</span>
              </>
            ) : (
              <>
                <Edit2 size={14} strokeWidth={1.5} className="text-[var(--accent)] shrink-0" />
                <span className="truncate">Editing message</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setText('');
            }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Bottom Text Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 md:p-4 bg-[var(--bg-sidebar)] border-t border-[var(--border-hairline)] flex items-center gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          autoFocus={false}
          className="flex-1 h-11 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[10px] px-3.5 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-11 w-11 flex items-center justify-center bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-40 text-[var(--btn-primary-text)] rounded-[10px] transition-[background-color,transform] duration-150 active:scale-[0.97] cursor-pointer shrink-0"
          title="Send"
        >
          <Send size={16} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  );
};
