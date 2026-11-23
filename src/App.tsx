import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Compass, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  Bell, 
  Plus, 
  Search,
  LogOut
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
  const { user, profile, isAdmin, loading, signOut, switchDemoUser } = useAuth();

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
    if (c.pinned) return acc; // Don't count self notes as unread
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

    // Ensure self-chat document exists so user can message themselves right away
    chatService.getOrCreateChat(profile.uid, profile.uid).catch(console.warn);

    const unsubChats = chatService.subscribeUserChats(profile.uid, (loadedChats) => {
      // Pin self-chat to top, with other chats sorted by latest message
      const selfChatId = `chat_self_${profile.uid}`;
      const selfIndex = loadedChats.findIndex(c => c.id === selfChatId || (c.members.length === 2 && c.members[0] === profile.uid && c.members[1] === profile.uid));
      
      let orderedChats = [...loadedChats];
      if (selfIndex !== -1) {
        const [selfChat] = orderedChats.splice(selfIndex, 1);
        selfChat.pinned = true;
        selfChat.otherMember = {
          ...profile,
          displayName: `${profile.displayName} (You)`,
        };
        orderedChats.unshift(selfChat);
      } else {
        // If self chat not yet in list snapshot, add virtual pinned item
        const virtualSelfChat: Chat = {
          id: selfChatId,
          type: 'direct',
          members: [profile.uid, profile.uid],
          createdAt: profile.createdAt,
          createdBy: profile.uid,
          pinned: true,
          lastMessageText: 'Message yourself / Personal notes',
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

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-slate-400 text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-2" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <LoginView />;
  }

  // Profile not completed (needs username)
  if (!profile) {
    return <ProfileSetupView />;
  }

  // Pending approval or blocked account
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
      console.error("Failed to start chat:", err);
    }
  };

  const handleBlockUser = async (targetUser: UserProfile) => {
    if (!profile) return;
    if (confirm(`Block @${targetUser.username}? You won't be able to chat.`)) {
      await privacyService.blockMember(profile.uid, targetUser.uid);
      setActiveChatId(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0d14] text-slate-100">
      {/* 1. Left Nav Rail (Desktop & Tablet) */}
      <nav className="hidden md:flex flex-col items-center justify-between py-5 px-3 w-18 bg-[#0b0f19] border-r border-slate-800/80 z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Logo mark */}
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <span className="font-extrabold text-base tracking-tight text-white">PM</span>
          </div>

          {/* Navigation icons */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => { setActiveTab('chats'); }}
              title="Chats"
              className={`p-3 rounded-2xl transition-all relative ${
                activeTab === 'chats'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white border-2 border-[#0b0f19] shadow">
                  {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('friends'); }}
              title="Friends"
              className={`p-3 rounded-2xl transition-all ${
                activeTab === 'friends'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setActiveTab('discover'); }}
              title="Discover Members"
              className={`p-3 rounded-2xl transition-all ${
                activeTab === 'discover'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-5 h-5" />
            </button>

            {isAdmin && (
              <button
                onClick={() => { setActiveTab('admin'); }}
                title="Admin Governance"
                className={`p-3 rounded-2xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Rail Controls */}
        <div className="flex flex-col items-center gap-3">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="p-3 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-800/60 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b0f19]" />
              )}
            </button>

            {/* Notification Menu Dropdown */}
            {showNotificationsMenu && (
              <div className="absolute left-16 bottom-0 w-72 bg-[#121722] border border-slate-800 rounded-2xl shadow-2xl p-3 z-50">
                <h4 className="text-xs font-semibold text-slate-300 mb-2 px-1">Notifications</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => notificationService.markAsRead(n.id)}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer ${
                          n.read ? 'bg-slate-900/30 text-slate-400' : 'bg-indigo-950/40 text-slate-200 border-l-2 border-indigo-500'
                        }`}
                      >
                        <p className="font-medium">
                          {n.type === 'friend_request' && 'New friend request received'}
                          {n.type === 'friend_accepted' && 'Friend request accepted!'}
                          {n.type === 'new_message' && 'New private message'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile & Settings Trigger */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-2xl border border-slate-700/80 hover:border-indigo-500 transition-colors"
          >
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-8 h-8 rounded-xl object-cover"
            />
          </button>
        </div>
      </nav>

      {/* 2. Middle Column: Conversations sidebar (Desktop) or Tab View */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col h-full bg-[#0e121c] border-r border-slate-800/80 ${
        activeChat && 'hidden md:flex'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-white">Private Circle</h1>
            <p className="text-xs text-slate-400">@{profile.username}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('friends')}
              title="Start chat with friend"
              className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <SettingsIcon className="w-4 h-4" />
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

        {/* Demo Switcher Quick Bar if in Demo Mode */}
        {isDemoMode && (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Demo Persona:</span>
            <div className="flex gap-1">
              <button
                onClick={() => switchDemoUser('demo-admin-1')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white"
              >
                Admin
              </button>
              <button
                onClick={() => switchDemoUser('demo-friend-1')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
              >
                Aravind
              </button>
              <button
                onClick={() => switchDemoUser('demo-friend-2')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white"
              >
                Sneha
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Content: Active Chat or Alternative Tab View */}
      <div className={`flex-1 flex flex-col h-full bg-[#0a0d14] relative overflow-hidden ${
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
              onBack={() => setActiveChatId(null)}
              onReportUser={(u) => setReportTargetUser(u)}
              onBlockUser={handleBlockUser}
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-300">Select a conversation</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Real-time, private and end-to-end invite-only messaging for your circle.
              </p>
            </div>
          )
        )}
      </div>

      {/* 4. Mobile Bottom Nav Bar (Hidden when activeChat is open for full-screen chat experience) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e121c]/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around z-30 ${
        activeChat ? 'hidden' : 'flex'
      }`}>
        <button
          onClick={() => { setActiveTab('chats'); setActiveChatId(null); }}
          className={`flex flex-col items-center gap-1 text-xs relative ${
            activeTab === 'chats' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 rounded-full text-[9px] font-bold bg-indigo-500 text-white min-w-4 text-center">
                {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
              </span>
            )}
          </div>
          <span>Chats</span>
        </button>
        <button
          onClick={() => { setActiveTab('friends'); setActiveChatId(null); }}
          className={`flex flex-col items-center gap-1 text-xs ${
            activeTab === 'friends' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Friends</span>
        </button>
        <button
          onClick={() => { setActiveTab('discover'); setActiveChatId(null); }}
          className={`flex flex-col items-center gap-1 text-xs ${
            activeTab === 'discover' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </button>
        {isAdmin && (
          <button
            onClick={() => { setActiveTab('admin'); setActiveChatId(null); }}
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin</span>
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

