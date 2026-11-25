import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccountStatusBanner: React.FC = () => {
  const { profile, signOut } = useAuth();

  if (!profile || profile.accountStatus === 'approved') return null;

  const isBlocked = profile.accountStatus === 'blocked';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[16px] p-6 md:p-8"
      >
        <div className={`w-10 h-10 rounded-[10px] mb-4 flex items-center justify-center bg-[var(--bg-raised)] border border-[var(--border-hairline)] ${
          isBlocked ? 'text-[var(--semantic-negative)]' : 'text-[var(--semantic-warning)]'
        }`}>
          {isBlocked ? <ShieldAlert size={18} strokeWidth={1.5} /> : <Clock size={18} strokeWidth={1.5} />}
        </div>

        <h2 className="text-[22px] leading-[1.2] font-medium text-[var(--text-primary)] mb-2">
          {isBlocked ? 'Account suspended' : 'Approval pending'}
        </h2>

        <p className="text-[14px] leading-[20px] text-[var(--text-secondary)] mb-6">
          {isBlocked
            ? 'Your account has been suspended by an administrator and no longer has access to private messaging.'
            : 'This is an invite-only messenger. Your registration is waiting for administrator approval.'}
        </p>

        <div className="bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-[10px] p-3.5 mb-6 text-[13px]">
          <p className="text-[var(--text-muted)]">Signed in as</p>
          <p className="text-[var(--text-primary)] font-mono mt-0.5">
            @{profile.username} <span className="font-sans text-[var(--text-secondary)]">({profile.displayName})</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[14px] font-medium transition-colors duration-150 cursor-pointer"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </motion.div>
    </div>
  );
};
