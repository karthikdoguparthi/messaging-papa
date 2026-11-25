import React, { useState } from 'react';
import { Search, UserPlus, Check } from 'lucide-react';
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-canvas)] overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-[24px] leading-[1.2] font-medium text-[var(--text-primary)]">Discover members</h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">
            Find approved members by username (for example <span className="font-mono text-[var(--text-primary)]">@karthik</span>). Emails are never exposed.
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} strokeWidth={1.5} className="text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search username"
              className="w-full h-11 pl-10 pr-4 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[10px] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="h-11 px-5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-40 text-[var(--btn-primary-text)] text-[14px] font-medium rounded-[10px] transition-colors duration-150 cursor-pointer shrink-0"
          >
            {loading ? 'Searching' : 'Search'}
          </button>
        </form>

        {/* Results List */}
        <div className="space-y-2">
          {results.length > 0 ? (
            results.map((u) => {
              const isSent = sentMap[u.uid];
              return (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-4 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.photoURL}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text-primary)] text-[14px] truncate">{u.displayName}</span>
                        <span className="text-[12px] text-[var(--text-muted)] font-mono">@{u.username}</span>
                      </div>
                      {u.bio && (
                        <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5 max-w-sm">{u.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isSent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--bg-raised)] text-[var(--semantic-positive)] text-[13px] font-medium border border-[var(--border-hairline)]">
                        <Check size={14} strokeWidth={1.5} />
                        <span>Requested</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(u)}
                        className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        <UserPlus size={15} strokeWidth={1.5} />
                        <span>Add friend</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : searchTerm && !loading ? (
            <div className="text-center py-12 rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
              <Search size={18} strokeWidth={1.5} className="text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-[14px] text-[var(--text-secondary)]">No approved members found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
              Enter a username above to find friends
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
