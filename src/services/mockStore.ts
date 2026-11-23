import { UserProfile, Chat, ChatMessage, FriendRequest, InAppNotification } from '../types';

// Mock storage for local preview/development when Firebase credentials are not yet linked
const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo-admin-1',
    username: 'karthik',
    usernameLower: 'karthik',
    displayName: 'Karthik (Admin)',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Building private spaces for friends ✨',
    accountStatus: 'approved',
    discoverable: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    lastSeenAt: Date.now(),
  },
  {
    uid: 'demo-friend-1',
    username: 'aravind',
    usernameLower: 'aravind',
    displayName: 'Aravind R.',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Coffee, books, and code ☕',
    accountStatus: 'approved',
    discoverable: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastSeenAt: Date.now() - 1000 * 60 * 5,
  },
  {
    uid: 'demo-friend-2',
    username: 'sneha',
    usernameLower: 'sneha',
    displayName: 'Sneha Patel',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Designer & photographer 🎨',
    accountStatus: 'approved',
    discoverable: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    lastSeenAt: Date.now() - 1000 * 60 * 45,
  },
  {
    uid: 'demo-pending-1',
    username: 'rohit',
    usernameLower: 'rohit',
    displayName: 'Rohit Verma',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Friend from college',
    accountStatus: 'pending',
    discoverable: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    lastSeenAt: Date.now() - 1000 * 60 * 60 * 2,
  }
];

class MockStore {
  users: UserProfile[] = [...DEMO_USERS];
  admins: Set<string> = new Set(['demo-admin-1']);
  friendships: { id: string; members: [string, string]; createdAt: number }[] = [
    { id: 'demo-admin-1_demo-friend-1', members: ['demo-admin-1', 'demo-friend-1'], createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    { id: 'demo-admin-1_demo-friend-2', members: ['demo-admin-1', 'demo-friend-2'], createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5 }
  ];
  friendRequests: FriendRequest[] = [];
  chats: Chat[] = [
    {
      id: 'chat_demo-admin-1_demo-friend-1',
      type: 'direct',
      members: ['demo-admin-1', 'demo-friend-1'],
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
      createdBy: 'demo-admin-1',
      lastMessageText: 'Hey! The private messenger UI looks super clean!',
      lastMessageAt: Date.now() - 1000 * 60 * 15,
      lastMessageSenderUid: 'demo-friend-1',
      unreadCount: 0,
    },
    {
      id: 'chat_demo-admin-1_demo-friend-2',
      type: 'direct',
      members: ['demo-admin-1', 'demo-friend-2'],
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
      createdBy: 'demo-admin-1',
      lastMessageText: 'Let me know when the group weekend plan is confirmed 🚀',
      lastMessageAt: Date.now() - 1000 * 60 * 60 * 3,
      lastMessageSenderUid: 'demo-admin-1',
      unreadCount: 0,
    }
  ];
  messages: { [chatId: string]: ChatMessage[] } = {
    'chat_demo-admin-1_demo-friend-1': [
      {
        id: 'msg-1',
        senderUid: 'demo-admin-1',
        type: 'text',
        text: 'Welcome to our private friend group messenger! Zero ads, zero tracking.',
        createdAt: Date.now() - 1000 * 60 * 60,
      },
      {
        id: 'msg-2',
        senderUid: 'demo-friend-1',
        type: 'text',
        text: 'Love the dark aesthetic and instant feel.',
        createdAt: Date.now() - 1000 * 60 * 45,
        reactions: { '❤️': ['demo-admin-1'] },
      },
      {
        id: 'msg-3',
        senderUid: 'demo-friend-1',
        type: 'text',
        text: 'Hey! The private messenger UI looks super clean!',
        createdAt: Date.now() - 1000 * 60 * 15,
      }
    ]
  };
  notifications: InAppNotification[] = [
    {
      id: 'notif-1',
      recipientUid: 'demo-admin-1',
      type: 'friend_request',
      actorUid: 'demo-pending-1',
      relatedId: 'req-1',
      read: false,
      createdAt: Date.now() - 1000 * 60 * 40,
    }
  ];
  blockedUsers: { [uid: string]: Set<string> } = {};
  reports: any[] = [];
  listeners: (() => void)[] = [];

  notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const mockStore = new MockStore();

