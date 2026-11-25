import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, AtSign, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const ProfileSetupView: React.FC = () => {
  const { user, setupProfile, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername || trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Use letters, numbers, and underscores only');
      return;
    }

    try {
      setChecking(true);
      const isAvailable = await authService.checkUsernameAvailable(trimmedUsername);
      setChecking(false);

      if (!isAvailable) {
        setError('That username is already taken');
        return;
      }

      setSaving(true);
      const photo = user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${trimmedUsername}`;
      await setupProfile(trimmedUsername, displayName || trimmedUsername, photo, bio);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete profile setup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[16px] p-6 md:p-8"
      >
        <div className="mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border-hairline)] text-[var(--text-secondary)] mb-4 flex items-center justify-center">
            <User size={18} strokeWidth={1.5} />
          </div>
          <h2 className="text-[22px] leading-[1.2] font-medium text-[var(--text-primary)]">Create your profile</h2>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1.5">
            Choose a unique handle so friends can find you
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--semantic-negative)]/30 text-[var(--semantic-negative)] text-[13px] flex items-center gap-2">
            <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Username
            </label>
            <div className="relative">
              <AtSign size={16} strokeWidth={1.5} className="text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="karthik"
                className="w-full h-10 pl-9 pr-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
              />
            </div>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full h-10 px-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Optional short note"
              className="w-full p-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={checking || saving}
            className="w-full h-11 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] font-medium rounded-[10px] text-[14px] transition-[background-color,transform] duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{saving ? 'Creating profile' : 'Complete and request access'}</span>
            <Check size={16} strokeWidth={1.5} />
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full mt-3 h-9 text-[13px] text-[var(--text-muted)] hover:text-[var(--semantic-negative)] rounded-[8px] transition-colors duration-150 text-center cursor-pointer"
        >
          Cancel and sign out
        </button>
      </motion.div>
    </div>
  );
};
