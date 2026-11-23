import React, { useEffect, useState } from 'react';
import { UserCheck, MessageSquare, Trash2, Search, Clock } from 'lucide-react';
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
    if (confirm('Are you sure you want to remove this friend?')) {
      await friendshipService.removeFriend(profile.uid, friendUid);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.displayName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d111a] overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Tabs */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Friends & Connections</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your approved circle and friend requests.</p>
          </div>

          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'friends' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg transition-all relative ${
                activeTab === 'requests' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Requests
              {receivedRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white">
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
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter friends..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2.5">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-11 h-11 rounded-full object-cover bg-slate-800"
                        />
                        {/* Presence badge */}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121722] ${
                          (Date.now() - (friend.lastSeenAt || 0) < 1000 * 60 * 10) ? 'bg-emerald-500' : 'bg-slate-500'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-100 text-sm truncate">{friend.displayName}</p>
                        <p className="text-xs text-indigo-400 font-mono">@{friend.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStartChatWithUser(friend)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.uid)}
                        title="Remove friend"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No friends found. Discover members using the Discover tab to connect!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Received */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Received Requests ({receivedRequests.length})
              </h3>
              <div className="space-y-2.5">
                {receivedRequests.length > 0 ? (
                  receivedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.fromUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${req.fromUid}`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full bg-slate-800"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{req.fromUser?.displayName || 'User'}</p>
                          <p className="text-xs text-indigo-400">@{req.fromUser?.username || 'member'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(req)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(req)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No incoming friend requests.</p>
                )}
              </div>
            </div>

            {/* Sent */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Sent Requests ({sentRequests.length})
              </h3>
              <div className="space-y-2.5">
                {sentRequests.length > 0 ? (
                  sentRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.toUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${req.toUid}`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full bg-slate-800"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{req.toUser?.displayName || 'User'}</p>
                          <p className="text-xs text-indigo-400">@{req.toUser?.username || 'member'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancel(req)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No pending sent requests.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

