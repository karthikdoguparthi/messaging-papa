import React, { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Search } from 'lucide-react';
import { UserProfile, FriendRequest } from '../types';
import { friendshipService } from '../services/friendshipService';
import { useAuth } from '../context/AuthContext';

interface FriendsViewProps {
  onStartChatWithUser: (user: UserProfile) => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onStartChatWithUser }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (!profile) return;

    const unsubFriends = friendshipService.subscribeFriends(profile.uid, setFriends);
    const unsubReceived = friendshipService.subscribeReceivedRequests(profile.uid, setReceivedRequests);
    const unsubSent = friendshipService.subscribeSentRequests(profile.uid, setSentRequests);

    return () => {
      unsubFriends();
      unsubReceived();
      unsubSent();
    };
  }, [profile]);

  const handleAccept = async (req: FriendRequest) => {
    if (!profile) return;
    await friendshipService.acceptFriendRequest(req.id, req.fromUid, profile.uid);
  };

  const handleDecline = async (req: FriendRequest) => {
    await friendshipService.declineFriendRequest(req.id);
  };

  const handleCancel = async (req: FriendRequest) => {
    await friendshipService.cancelFriendRequest(req.id);
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!profile) return;
    if (confirm('Remove this friend?')) {
      await friendshipService.removeFriend(profile.uid, friendUid);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-canvas)] overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="text-[24px] leading-[1.2] font-medium text-[var(--text-primary)]">Friends</h2>
            <p className="text-[14px] text-[var(--text-secondary)] mt-1">Manage your circle and requests</p>
          </div>

          <div className="flex bg-[var(--bg-surface)] p-1 rounded-[10px] border border-[var(--border-hairline)] text-[13px] font-medium self-start">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`px-3 py-1.5 rounded-[7px] transition-colors duration-150 cursor-pointer tabular-nums ${
                activeTab === 'friends'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-[7px] transition-colors duration-150 cursor-pointer flex items-center gap-1.5 tabular-nums ${
                activeTab === 'requests'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Requests</span>
              {receivedRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-[5px] text-[11px] font-mono bg-[var(--accent)] text-[var(--accent-text)]">
                  {receivedRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div>
            <div className="relative mb-4">
              <Search size={16} strokeWidth={1.5} className="text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-10 pl-10 pr-4 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
              />
            </div>

            <div className="space-y-2">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3.5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                        />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-surface)] ${
                          (Date.now() - (friend.lastSeenAt || 0) < 1000 * 60 * 10) ? 'bg-[var(--semantic-positive)]' : 'bg-[var(--text-muted)]'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] text-[14px] truncate">{friend.displayName}</p>
                        <p className="text-[12px] text-[var(--text-muted)] font-mono">@{friend.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStartChatWithUser(friend)}
                        className="flex items-center gap-1.5 px-3 h-9 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] border border-[var(--border-hairline)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        <MessageSquare size={15} strokeWidth={1.5} />
                        <span>Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(friend.uid)}
                        title="Remove friend"
                        className="p-2 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--semantic-negative)] transition-colors duration-150 cursor-pointer"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
                  No friends found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[13px] font-medium text-[var(--text-secondary)] mb-2.5 tabular-nums">
                Received ({receivedRequests.length})
              </h3>
              <div className="space-y-2">
                {receivedRequests.length > 0 ? (
                  receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.fromUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${req.fromUid}`}
                          alt={req.fromUser?.displayName || 'User'}
                          className="w-10 h-10 rounded-full bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                        />
                        <div>
                          <p className="text-[14px] font-medium text-[var(--text-primary)]">{req.fromUser?.displayName || 'User'}</p>
                          <p className="text-[12px] text-[var(--text-muted)] font-mono">@{req.fromUser?.username || 'member'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAccept(req)}
                          className="px-3 h-8 rounded-[8px] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(req)}
                          className="px-3 h-8 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] text-[var(--text-secondary)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[var(--text-muted)]">No incoming requests</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-medium text-[var(--text-secondary)] mb-2.5 tabular-nums">
                Sent ({sentRequests.length})
              </h3>
              <div className="space-y-2">
                {sentRequests.length > 0 ? (
                  sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.toUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${req.toUid}`}
                          alt={req.toUser?.displayName || 'User'}
                          className="w-10 h-10 rounded-full bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                        />
                        <div>
                          <p className="text-[14px] font-medium text-[var(--text-primary)]">{req.toUser?.displayName || 'User'}</p>
                          <p className="text-[12px] text-[var(--text-muted)] font-mono">@{req.toUser?.username || 'member'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancel(req)}
                        className="px-3 h-8 rounded-[8px] bg-[var(--bg-raised)] hover:text-[var(--semantic-negative)] text-[var(--text-secondary)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[var(--text-muted)]">No pending sent requests</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
