import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, ShieldCheck, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isDemoMode } from '../lib/firebase';

export const LoginView: React.FC = () => {
  const { signInWithGoogle, switchDemoUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-[16px] p-6 md:p-8">
          {/* Flat Wordmark & Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-raised)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)]">
                <Lock size={16} strokeWidth={1.5} />
              </div>
              <span className="text-[16px] font-medium tracking-tight text-[var(--text-primary)]">
                Private Messenger
              </span>
            </div>

            <h1 className="text-[28px] leading-[1.15] font-medium text-[var(--text-primary)]">
              Quiet messaging for your circle
            </h1>
            <p className="text-[14px] leading-[20px] text-[var(--text-secondary)] mt-2">
              Invite-only, end-to-end encrypted conversations with zero ads and zero tracking.
            </p>
          </div>

          {/* Quiet Spec Rows */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[13px] text-[var(--text-secondary)]">
              <Lock size={16} strokeWidth={1.5} className="text-[var(--text-muted)] shrink-0" />
              <span>E2E encrypted</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[13px] text-[var(--text-secondary)]">
              <Users size={16} strokeWidth={1.5} className="text-[var(--text-muted)] shrink-0" />
              <span>Admin approved</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[13px] text-[var(--text-secondary)]">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-[var(--text-muted)] shrink-0" />
              <span>Zero ads</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[13px] text-[var(--text-secondary)]">
              <EyeOff size={16} strokeWidth={1.5} className="text-[var(--text-muted)] shrink-0" />
              <span>No AI tracking</span>
            </div>
          </div>

          {/* Primary Action */}
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full h-11 flex items-center justify-center gap-2.5 px-4 rounded-[10px] text-[14px] font-medium bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] active:scale-[0.98] transition-[background-color,transform] duration-150 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Sandbox Persona Switcher (Demo Mode only) */}
          {isDemoMode && (
            <div className="mt-6 pt-5 border-t border-[var(--border-hairline)]">
              <p className="text-[12px] text-[var(--text-muted)] mb-3">
                Demo sandbox personas
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoUser('demo-admin-1')}
                  className="px-3 py-2 rounded-[8px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-raised)] text-left border border-[var(--border-hairline)] transition-colors duration-150 cursor-pointer"
                >
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Karthik</p>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono">Admin</p>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser('demo-friend-1')}
                  className="px-3 py-2 rounded-[8px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-raised)] text-left border border-[var(--border-hairline)] transition-colors duration-150 cursor-pointer"
                >
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Aravind</p>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono">Member</p>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser('demo-friend-2')}
                  className="px-3 py-2 rounded-[8px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-raised)] text-left border border-[var(--border-hairline)] transition-colors duration-150 cursor-pointer"
                >
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">Sneha</p>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono">Member</p>
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoUser('demo-pending-1')}
                  className="px-3 py-2 rounded-[8px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-raised)] text-left border border-[var(--border-hairline)] transition-colors duration-150 cursor-pointer"
                >
                  <p className="text-[13px] font-medium text-[var(--semantic-warning)]">Rohit</p>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono">Pending</p>
                </button>
              </div>
            </div>
          )}

          <p className="mt-5 text-[12px] text-[var(--text-muted)] text-center">
            Protected by Firebase Security Rules
          </p>
        </div>
      </motion.div>
    </div>
  );
};
