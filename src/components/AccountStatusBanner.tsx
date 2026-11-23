import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AccountStatusBanner: React.FC = () => {
  const { profile, signOut } = useAuth();

  if (!profile || profile.accountStatus === 'approved') return null;

  const isBlocked = profile.accountStatus === 'blocked';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0d14]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#111622] border border-slate-800 rounded-2xl p-8 text-center shadow-2xl"
      >
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          isBlocked 
            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {isBlocked ? <ShieldAlert className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          {isBlocked ? 'Account Suspended' : 'Approval Pending'}
        </h2>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {isBlocked 
            ? 'Your account has been suspended by an administrator. You currently do not have access to private group messaging.'
            : 'This is an invite-only private messenger. Your registration is awaiting verification and approval from the administrator.'}
        </p>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 mb-6 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Signed in as:</p>
          <p className="text-indigo-400 mt-0.5">@{profile.username} ({profile.displayName})</p>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </motion.div>
    </div>
  );
};

