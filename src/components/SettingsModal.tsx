import React, { useState } from 'react';
import { X, LogOut, Check, Sun, Moon, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [discoverable, setDiscoverable] = useState(profile?.discoverable ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    await updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      discoverable,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[16px] p-6 relative"
        style={{ boxShadow: 'var(--shadow-floating)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[6px] cursor-pointer"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <h3 className="text-[18px] font-medium text-[var(--text-primary)] mb-5">Settings and profile</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Username</label>
            <input
              type="text"
              disabled
              value={`@${profile?.username}`}
              className="w-full h-10 px-3 bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[8px] text-[13px] text-[var(--text-muted)] font-mono"
            />
            <p className="text-[12px] text-[var(--text-muted)] mt-1">Usernames are permanent</p>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-150 resize-none"
            />
          </div>

          {/* Theme Mode Selector */}
          <div className="p-3 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
            <p className="text-[13px] font-medium text-[var(--text-primary)] mb-2">Appearance</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-[8px] text-[12px] font-medium border transition-colors duration-150 cursor-pointer ${
                  theme === 'system'
                    ? 'bg-[var(--bg-raised)] border-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-transparent border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Laptop size={16} strokeWidth={1.5} />
                <span>Auto</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-[8px] text-[12px] font-medium border transition-colors duration-150 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[var(--bg-raised)] border-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-transparent border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon size={16} strokeWidth={1.5} />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-[8px] text-[12px] font-medium border transition-colors duration-150 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[var(--bg-raised)] border-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-transparent border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun size={16} strokeWidth={1.5} />
                <span>Light</span>
              </button>
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] cursor-pointer">
            <div>
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Discoverable by username</p>
              <p className="text-[12px] text-[var(--text-muted)]">Allow friends to find your handle</p>
            </div>
            <input
              type="checkbox"
              checked={discoverable}
              onChange={(e) => setDiscoverable(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
            />
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-[8px] text-[13px] font-medium transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check size={15} strokeWidth={1.5} className="text-[var(--semantic-positive)]" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{saving ? 'Saving' : 'Save changes'}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 h-10 bg-[var(--bg-raised)] hover:text-[var(--semantic-negative)] text-[var(--text-secondary)] border border-[var(--border-hairline)] rounded-[8px] text-[13px] font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
            >
              <LogOut size={15} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
