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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#121722] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Report @{targetUser.username}</h3>
            <p className="text-xs text-slate-400">Reports are reviewed strictly by administrators.</p>
          </div>
        </div>

        {done ? (
          <div className="py-8 text-center text-emerald-400 text-sm font-medium">
            Thank you. Your report has been submitted for administrative review.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportItem['reason'])}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="spam">Spam or unwanted messages</option>
                <option value="harassment">Harassment or bullying</option>
                <option value="inappropriate">Inappropriate behavior</option>
                <option value="fake">Fake or impersonated account</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Details</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

