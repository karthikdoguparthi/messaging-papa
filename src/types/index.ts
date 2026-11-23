export type AccountStatus = 'pending' | 'approved' | 'blocked';

export interface UserProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  photoURL: string;
  bio: string;
  accountStatus: AccountStatus;
  discoverable: boolean;
  createdAt: number;
  lastSeenAt: number;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: FriendRequestStatus;
  createdAt: number;
  updatedAt: number;
  fromUser?: UserProfile;
  toUser?: UserProfile;
}

export interface Friendship {
  id: string;
  members: [string, string];
  createdAt: number;
  createdBy: string;
  friendProfile?: UserProfile;
}

export interface Chat {
  id: string;
  type: 'direct';
  members: string[];
  createdAt: number;
  createdBy: string;
  lastMessageText?: string;
  lastMessageAt?: number;
  lastMessageSenderUid?: string;
  unreadCount?: number;
  unreadCounts?: { [uid: string]: number };
  pinned?: boolean;
  muted?: boolean;
  otherMember?: UserProfile;
}

export interface ReactionMap {
  [emoji: string]: string[]; // array of UIDs who reacted
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  type: 'text';
  text: string;
  createdAt: number;
  editedAt?: number;
  replyToMessageId?: string;
  replyToMessage?: {
    text: string;
    senderName: string;
  };
  reactions?: ReactionMap;
  deletedAt?: number;
}

export interface InAppNotification {
  id: string;
  recipientUid: string;
  type: 'friend_request' | 'friend_accepted' | 'new_message';
  actorUid: string;
  relatedId: string;
  read: boolean;
  createdAt: number;
  actorProfile?: UserProfile;
}

export interface ReportItem {
  id: string;
  reporterUid: string;
  reportedUid: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
  details: string;
  createdAt: number;
  status: 'pending' | 'reviewed' | 'resolved';
}

