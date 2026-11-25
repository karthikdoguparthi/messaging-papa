import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { UserProfile, ReportItem } from '../types';
import { privacyService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  targetUser: UserProfile;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetUser, onClose }) => {
  const { profile } = useAuth();
  const [reason, setReason] = useState<ReportItem['reason']>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    await privacyService.submitReport(profile.uid, targetUser.uid, reason, details);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => onClose(), 1500);
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

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-raised)] border border-[var(--border-hairline)] text-[var(--semantic-warning)] flex items-center justify-center">
            <ShieldAlert size={18} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-[var(--text-primary)]">Report @{targetUser.username}</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">Reviewed by administrators</p>
          </div>
        </div>

        {done ? (
          <div className="py-8 text-center text-[var(--semantic-positive)] text-[14px] font-medium">
            Report submitted for review
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportItem['reason'])}
                className="w-full h-10 px-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="spam">Spam or unwanted messages</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate behavior</option>
                <option value="fake">Fake or impersonated account</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">Details</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened"
                className="w-full p-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] rounded-[8px] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[8px] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
            >
              {submitting ? 'Submitting' : 'Submit report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
