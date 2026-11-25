import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Users,
  Compass,
  ShieldCheck,
  Settings as SettingsIcon,
  Bell,
  Plus,
  Lock
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { ProfileSetupView } from './components/ProfileSetupView';
import { AccountStatusBanner } from './components/AccountStatusBanner';
import { ConversationList } from './components/ConversationList';
import { ChatArea } from './components/ChatArea';
import { DiscoverView } from './components/DiscoverView';
import { FriendsView } from './components/FriendsView';
import { AdminView } from './components/AdminView';
import { SettingsModal } from './components/SettingsModal';
import { ReportModal } from './components/ReportModal';
import { Chat, UserProfile, InAppNotification } from './types';
import { chatService } from './services/chatService';
import { notificationService, privacyService } from './services/adminService';
import { isDemoMode } from './lib/firebase';

type TabView = 'chats' | 'friends' | 'discover' | 'admin';

export const App: React.FC = () => {
  const { user, profile, isAdmin, loading, switchDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabView>('chats');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatOverride, setActiveChatOverride] = useState<Chat | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reportTargetUser, setReportTargetUser] = useState<UserProfile | null>(null);

  // Derive activeChat from list or immediate override
  const activeChat = chats.find(c => c.id === activeChatId) || activeChatOverride;

  // Total unread messages across all chats
  const totalUnreadMessages = chats.reduce((acc, c) => {
    if (c.pinned) return acc;
    const count = Number((profile?.uid && c.unreadCounts?.[profile.uid]) ?? c.unreadCount ?? 0);
    return acc + (isNaN(count) ? 0 : count);
  }, 0);

  // Automatically mark active chat as read when opened or new message arrives
  useEffect(() => {
    if (activeChatId && profile?.uid) {
      chatService.markChatAsRead(activeChatId, profile.uid);
    }
  }, [activeChatId, profile?.uid, chats]);

  // Subscribe to chats
  useEffect(() => {
    if (!profile || profile.accountStatus !== 'approved') return;

    chatService.getOrCreateChat(profile.uid, profile.uid).catch(console.warn);

    const unsubChats = chatService.subscribeUserChats(profile.uid, (loadedChats) => {
      const selfChatId = `chat_self_${profile.uid}`;
      const selfIndex = loadedChats.findIndex(c => c.id === selfChatId || (c.members.length === 2 && c.members[0] === profile.uid && c.members[1] === profile.uid));

      const orderedChats = [...loadedChats];
      if (selfIndex !== -1) {
        const [selfChat] = orderedChats.splice(selfIndex, 1);
        selfChat.pinned = true;
        selfChat.otherMember = {
          ...profile,
          displayName: `${profile.displayName} (You)`,
        };
        orderedChats.unshift(selfChat);
      } else {
        const virtualSelfChat: Chat = {
          id: selfChatId,
          type: 'direct',
          members: [profile.uid, profile.uid],
          createdAt: profile.createdAt,
          createdBy: profile.uid,
          pinned: true,
          lastMessageText: 'Personal notes',
          otherMember: {
            ...profile,
            displayName: `${profile.displayName} (You)`,
          }
        };
        orderedChats.unshift(virtualSelfChat);
      }

      setChats(orderedChats);
    });

    const unsubNotifs = notificationService.subscribeNotifications(profile.uid, (list) => {
      setNotifications(list);
    });

    return () => {
      unsubChats();
      unsubNotifs();
    };
  }, [profile?.uid, profile?.accountStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-muted)] text-[13px]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--text-muted)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (!profile) {
    return <ProfileSetupView />;
  }

  if (profile.accountStatus !== 'approved') {
    return <AccountStatusBanner />;
  }

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const handleStartChatWithUser = async (targetUser: UserProfile) => {
    if (!profile) return;
    try {
      const chatId = await chatService.getOrCreateChat(profile.uid, targetUser.uid);
      const newChatObj: Chat = {
        id: chatId,
        type: 'direct',
        members: [profile.uid, targetUser.uid],
        createdAt: Date.now(),
        createdBy: profile.uid,
        otherMember: targetUser,
      };
      setActiveChatOverride(newChatObj);
      setActiveChatId(chatId);
      setActiveTab('chats');
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const handleBlockUser = async (targetUser: UserProfile) => {
    if (!profile) return;
    if (confirm(`Block @${targetUser.username}?`)) {
      await privacyService.blockMember(profile.uid, targetUser.uid);
      setActiveChatId(null);
      setActiveChatOverride(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* 1. Left Nav Rail (Desktop & Tablet) */}
      <nav className="hidden md:flex flex-col items-center justify-between py-4 px-2.5 w-16 bg-[var(--bg-rail)] border-r border-[var(--border-hairline)] z-20">
        <div className="flex flex-col items-center gap-5">
          {/* Flat Wordmark / Mark */}
          <div
            className="w-9 h-9 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)]"
            title="Private Messenger"
          >
            <Lock size={16} strokeWidth={1.5} />
          </div>

          {/* Navigation icons */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('chats')}
              title="Chats"
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-150 relative cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <MessageSquare size={18} strokeWidth={1.5} />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-[5px] text-[10px] font-mono font-medium tabular-nums bg-[var(--accent)] text-[var(--accent-text)] border border-[var(--bg-rail)]">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              title="Friends"
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Users size={18} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              title="Discover"
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                activeTab === 'discover'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Compass size={18} strokeWidth={1.5} />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                title="Governance"
                className={`w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                <ShieldCheck size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Rail Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              title="Notifications"
              className="w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[8px] hover:bg-[var(--bg-surface)] transition-colors duration-150 relative flex items-center justify-center cursor-pointer"
            >
              <Bell size={18} strokeWidth={1.5} />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>

            {showNotificationsMenu && (
              <div
                className="absolute left-14 bottom-0 w-72 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[12px] p-3 z-50"
                style={{ boxShadow: 'var(--shadow-floating)' }}
              >
                <h4 className="text-[13px] font-medium text-[var(--text-primary)] mb-2 px-1">Notifications</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => notificationService.markAsRead(n.id)}
                        className={`p-2.5 rounded-[8px] text-[13px] cursor-pointer transition-colors duration-150 ${
                          n.read
                            ? 'bg-[var(--bg-canvas)] text-[var(--text-muted)]'
                            : 'bg-[var(--bg-raised)] text-[var(--text-primary)] border-l-2 border-[var(--accent)]'
                        }`}
                      >
                        <p className="font-medium">
                          {n.type === 'friend_request' && 'Friend request received'}
                          {n.type === 'friend_accepted' && 'Friend request accepted'}
                          {n.type === 'new_message' && 'New private message'}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Settings"
            className="p-1 rounded-[10px] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors duration-150 cursor-pointer"
          >
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-8 h-8 rounded-[7px] object-cover"
            />
          </button>
        </div>
      </nav>

      {/* 2. Middle Column: Conversations sidebar */}
      <div className={`w-full md:w-72 lg:w-80 flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-hairline)] ${
        activeChat ? 'hidden md:flex' : (activeTab === 'chats' ? 'flex' : 'hidden md:flex')
      }`}>
        {/* Header */}
        <div className="h-16 px-4 border-b border-[var(--border-hairline)] flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="font-medium text-[16px] text-[var(--text-primary)] truncate">Private Circle</h1>
            <p className="text-[12px] text-[var(--text-muted)] font-mono truncate">@{profile.username}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              title="New chat"
              className="px-2.5 h-8 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors duration-150 cursor-pointer flex items-center gap-1.5 text-[13px] font-medium"
            >
              <Plus size={15} strokeWidth={1.5} />
              <span className="hidden sm:inline">New</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Settings"
            >
              <SettingsIcon size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          chats={chats}
          activeChatId={activeChatId}
          currentUid={profile.uid}
          onSelectChat={(chat) => {
            setActiveChatOverride(chat);
            setActiveChatId(chat.id);
            if (profile.uid) {
              chatService.markChatAsRead(chat.id, profile.uid);
            }
          }}
          onOpenDiscover={() => setActiveTab('discover')}
          onDeleteChat={async (chatId) => {
            await chatService.deleteChat(chatId);
            if (activeChatId === chatId) {
              setActiveChatId(null);
              setActiveChatOverride(null);
            }
          }}
        />

        {/* Demo Switcher Quick Bar */}
        {isDemoMode && (
          <div className="p-3 bg-[var(--bg-rail)] border-t border-[var(--border-hairline)] text-[12px] flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Persona</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => switchDemoUser('demo-admin-1')}
                className="px-2 py-1 rounded-[6px] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-hairline)] cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => switchDemoUser('demo-friend-1')}
                className="px-2 py-1 rounded-[6px] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] border border-[var(--border-hairline)] cursor-pointer"
              >
                Aravind
              </button>
              <button
                type="button"
                onClick={() => switchDemoUser('demo-friend-2')}
                className="px-2 py-1 rounded-[6px] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[var(--text-secondary)] border border-[var(--border-hairline)] cursor-pointer"
              >
                Sneha
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Content */}
      <div className={`flex-1 flex flex-col h-full bg-[var(--bg-canvas)] relative overflow-hidden pb-16 md:pb-0 ${
        !activeChat && activeTab === 'chats' ? 'hidden md:flex' : 'flex'
      }`}>
        {activeTab === 'discover' && (
          <DiscoverView onStartChat={handleStartChatWithUser} />
        )}

        {activeTab === 'friends' && (
          <FriendsView onStartChatWithUser={handleStartChatWithUser} />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminView />
        )}

        {activeTab === 'chats' && (
          activeChat ? (
            <ChatArea
              key={activeChat.id}
              chat={activeChat}
              onBack={() => {
                setActiveChatId(null);
                setActiveChatOverride(null);
              }}
              onReportUser={(u) => setReportTargetUser(u)}
              onBlockUser={handleBlockUser}
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-muted)] flex items-center justify-center mb-3">
                <MessageSquare size={18} strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-medium text-[var(--text-primary)]">Select a conversation</h3>
              <p className="text-[13px] text-[var(--text-muted)] mt-1 max-w-xs">
                End-to-end encrypted messaging for your circle
              </p>
            </div>
          )
        )}
      </div>

      {/* 4. Mobile Bottom Nav Bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-sidebar)] border-t border-[var(--border-hairline)] flex items-center justify-around z-30 pb-[env(safe-area-inset-bottom)] ${
        activeChat ? 'hidden' : 'flex'
      }`}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('chats');
            setActiveChatId(null);
            setActiveChatOverride(null);
          }}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer touch-manipulation select-none ${
            activeTab === 'chats' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'
          }`}
        >
          <div className="relative pointer-events-none">
            <MessageSquare size={18} strokeWidth={1.5} />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 rounded-[5px] text-[10px] font-mono tabular-nums bg-[var(--accent)] text-[var(--accent-text)] min-w-4 text-center">
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </span>
            )}
          </div>
          <span className="pointer-events-none">Chats</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('friends');
            setActiveChatId(null);
            setActiveChatOverride(null);
          }}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer touch-manipulation select-none ${
            activeTab === 'friends' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'
          }`}
        >
          <Users size={18} strokeWidth={1.5} className="pointer-events-none" />
          <span className="pointer-events-none">Friends</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('discover');
            setActiveChatId(null);
            setActiveChatOverride(null);
          }}
          className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer touch-manipulation select-none ${
            activeTab === 'discover' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'
          }`}
        >
          <Compass size={18} strokeWidth={1.5} className="pointer-events-none" />
          <span className="pointer-events-none">Discover</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setActiveChatId(null);
              setActiveChatOverride(null);
            }}
            className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[12px] cursor-pointer touch-manipulation select-none ${
              activeTab === 'admin' ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'
            }`}
          >
            <ShieldCheck size={18} strokeWidth={1.5} className="pointer-events-none" />
            <span className="pointer-events-none">Admin</span>
          </button>
        )}
      </div>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {reportTargetUser && (
        <ReportModal
          targetUser={reportTargetUser}
          onClose={() => setReportTargetUser(null)}
        />
      )}
    </div>
  );
};
