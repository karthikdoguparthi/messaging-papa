import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, AtSign, CheckCircle2, AlertCircle } from 'lucide-react';
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
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    try {
      setChecking(true);
      const isAvailable = await authService.checkUsernameAvailable(trimmedUsername);
      setChecking(false);

      if (!isAvailable) {
        setError('That username is already claimed. Pick another.');
        return;
      }

      setSaving(true);
      const photo = user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${trimmedUsername}`;
      await setupProfile(trimmedUsername, displayName || trimmedUsername, photo, bio);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete profile setup.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0d14]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111622] border border-slate-800 rounded-2xl p-7 shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto mb-3 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Create Your Profile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a unique username so your friends can discover and add you.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Username <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. karthik"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used for friend discovery. Letters, numbers, and underscores only.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Short Bio (Optional)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Say something brief..."
              className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={checking || saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? 'Creating profile...' : 'Complete & Request Access'}
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full mt-4 py-2 px-3 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Cancel and Sign Out</span>
        </button>
      </motion.div>
    </div>
  );
};

