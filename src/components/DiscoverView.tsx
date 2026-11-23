import React, { useState } from 'react';
import { Search, UserPlus, Check, Clock, UserCheck, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';
import { friendshipService } from '../services/friendshipService';
import { useAuth } from '../context/AuthContext';

interface DiscoverViewProps {
  onStartChat: (targetUser: UserProfile) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onStartChat }) => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState<{ [uid: string]: boolean }>({});
  const [statusMsg, setStatusMsg] = useState<{ [uid: string]: string }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !profile) return;

    setLoading(true);
    try {
      const users = await friendshipService.searchMembers(searchTerm, profile.uid);
      setResults(users);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (target: UserProfile) => {
    if (!profile) return;
    try {
      await friendshipService.sendFriendRequest(profile.uid, target.uid);
      setSentMap(prev => ({ ...prev, [target.uid]: true }));
      setStatusMsg(prev => ({ ...prev, [target.uid]: 'Request Sent' }));
    } catch (err: any) {
      setStatusMsg(prev => ({ ...prev, [target.uid]: err?.message || 'Error' }));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d111a] overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Discover Members</h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Search for approved circle members by username (e.g. <span className="text-indigo-400">@username</span>).
            Emails are never exposed.
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Results List */}
        <div className="space-y-3">
          {results.length > 0 ? (
            results.map((u) => {
              const isSent = sentMap[u.uid];
              return (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#121722] border border-slate-800/80 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="w-12 h-12 rounded-full object-cover bg-slate-800 border border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm truncate">{u.displayName}</span>
                        <span className="text-xs text-indigo-400 font-mono">@{u.username}</span>
                      </div>
                      {u.bio && (
                        <p className="text-xs text-slate-400 truncate mt-0.5 max-w-sm">{u.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isSent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : searchTerm && !loading ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-400">No approved members found matching "{searchTerm}"</p>
              <p className="text-xs text-slate-500 mt-1">Make sure the username is spelled correctly.</p>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              Type a username above to find your friends.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

