import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserX, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { UserProfile, ReportItem } from '../types';
import { adminService } from '../services/adminService';

export const AdminView: React.FC = () => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'members' | 'reports'>('approvals');

  useEffect(() => {
    const unsubMembers = adminService.subscribeMembers(setMembers);
    const unsubReports = adminService.subscribeReports(setReports);
    return () => {
      unsubMembers();
      unsubReports();
    };
  }, []);

  const pendingMembers = members.filter(m => m.accountStatus === 'pending');

  const handleApprove = async (uid: string) => {
    await adminService.approveUser(uid);
  };

  const handleBlock = async (uid: string) => {
    if (confirm('Suspend access for this user?')) {
      await adminService.blockUser(uid);
    }
  };

  const handleUnblock = async (uid: string) => {
    await adminService.unblockUser(uid);
  };

  const handleResolveReport = async (reportId: string) => {
    await adminService.resolveReport(reportId, 'resolved');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-canvas)] overflow-y-auto p-6 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center border border-[var(--border-hairline)]">
              <ShieldCheck size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[24px] leading-[1.2] font-medium text-[var(--text-primary)]">Governance</h2>
              <p className="text-[13px] text-[var(--text-secondary)]">Member approvals and moderation</p>
            </div>
          </div>

          <div className="flex bg-[var(--bg-surface)] p-1 rounded-[10px] border border-[var(--border-hairline)] text-[13px] font-medium self-start">
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded-[7px] transition-colors duration-150 cursor-pointer tabular-nums ${
                activeTab === 'approvals'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Approvals ({pendingMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-[7px] transition-colors duration-150 cursor-pointer tabular-nums ${
                activeTab === 'members'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-[7px] transition-colors duration-150 cursor-pointer tabular-nums ${
                activeTab === 'reports'
                  ? 'bg-[var(--bg-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Reports ({reports.filter(r => r.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'approvals' && (
          <div className="space-y-2.5">
            <h3 className="text-[13px] font-medium text-[var(--text-secondary)] mb-2 tabular-nums">
              Waiting for approval ({pendingMembers.length})
            </h3>
            {pendingMembers.length > 0 ? (
              pendingMembers.map((user) => (
                <div
                  key={user.uid}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)]"
                    />
                    <div>
                      <p className="font-medium text-[14px] text-[var(--text-primary)]">{user.displayName}</p>
                      <p className="text-[12px] text-[var(--text-muted)] font-mono">@{user.username}</p>
                      {user.bio && <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{user.bio}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(user.uid)}
                      className="px-3.5 h-9 rounded-[8px] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-[13px] font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                    >
                      <CheckCircle size={15} strokeWidth={1.5} />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlock(user.uid)}
                      className="px-3.5 h-9 rounded-[8px] bg-[var(--bg-raised)] hover:text-[var(--semantic-negative)] text-[var(--text-secondary)] border border-[var(--border-hairline)] text-[13px] font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
                    >
                      <UserX size={15} strokeWidth={1.5} />
                      <span>Block</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-[var(--text-muted)] text-[13px] bg-[var(--bg-surface)] rounded-[12px] border border-[var(--border-hairline)]">
                <Clock size={18} strokeWidth={1.5} className="mx-auto mb-2 text-[var(--text-muted)]" />
                No pending registrations
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Members */}
        {activeTab === 'members' && (
          <div className="space-y-2">
            <h3 className="text-[13px] font-medium text-[var(--text-secondary)] mb-2 tabular-nums">
              Registered accounts ({members.length})
            </h3>
            {members.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between p-3.5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover bg-[var(--bg-raised)] border border-[var(--border-hairline)] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[14px] text-[var(--text-primary)] truncate">{user.displayName}</span>
                      <span className="text-[12px] text-[var(--text-muted)] font-mono">@{user.username}</span>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-[5px] border border-[var(--border-hairline)] ${
                        user.accountStatus === 'approved'
                          ? 'text-[var(--semantic-positive)] bg-[var(--bg-canvas)]'
                          : user.accountStatus === 'pending'
                          ? 'text-[var(--semantic-warning)] bg-[var(--bg-canvas)]'
                          : 'text-[var(--semantic-negative)] bg-[var(--bg-canvas)]'
                      }`}>
                        {user.accountStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {user.accountStatus === 'blocked' ? (
                    <button
                      type="button"
                      onClick={() => handleUnblock(user.uid)}
                      className="px-3 h-8 rounded-[8px] bg-[var(--bg-raised)] hover:bg-[var(--border-strong)] text-[13px] font-medium text-[var(--text-primary)] transition-colors duration-150 cursor-pointer"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBlock(user.uid)}
                      className="px-3 h-8 rounded-[8px] bg-[var(--bg-raised)] hover:text-[var(--semantic-negative)] text-[var(--text-secondary)] border border-[var(--border-hairline)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-2.5">
            <h3 className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">
              User reports
            </h3>
            {reports.length > 0 ? (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={15} strokeWidth={1.5} className="text-[var(--semantic-warning)]" />
                      <span className="text-[14px] font-medium text-[var(--text-primary)] capitalize">{report.reason}</span>
                      <span className="text-[12px] text-[var(--text-muted)] font-mono tabular-nums">
                        · {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1">{report.details || 'No details provided'}</p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-2 font-mono">
                      Target: {report.reportedUid} · Reporter: {report.reporterUid}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {report.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleResolveReport(report.id)}
                        className="px-3 h-8 rounded-[8px] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-[13px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-[12px] font-mono text-[var(--semantic-positive)]">Resolved</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[var(--text-muted)] text-[13px] bg-[var(--bg-surface)] rounded-[12px] border border-[var(--border-hairline)]">
                No reports submitted
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
