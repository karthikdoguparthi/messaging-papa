import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserX, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
  const approvedMembers = members.filter(m => m.accountStatus === 'approved');
  const blockedMembers = members.filter(m => m.accountStatus === 'blocked');

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
    <div className="flex-1 flex flex-col h-full bg-[#0d111a] overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Admin Governance</h2>
              <p className="text-xs text-slate-400">Invite-only approval pipeline and moderation controls.</p>
            </div>
          </div>

          {/* Navigation Pill */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'approvals' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Approvals ({pendingMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'members' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reports ({reports.filter(r => r.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'approvals' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Waiting for Approval ({pendingMembers.length})
            </h3>
            {pendingMembers.length > 0 ? (
              pendingMembers.map((user) => (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#121722] border border-amber-500/20"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-11 h-11 rounded-full object-cover bg-slate-800"
                    />
                    <div>
                      <p className="font-semibold text-sm text-slate-100">{user.displayName}</p>
                      <p className="text-xs text-indigo-400 font-mono">@{user.username}</p>
                      {user.bio && <p className="text-xs text-slate-400 mt-0.5">{user.bio}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(user.uid)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleBlock(user.uid)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject & Block</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                <Clock className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                No pending registrations. All members are verified.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Members */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Registered Accounts ({members.length})
            </h3>
            {members.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#121722] border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover bg-slate-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{user.displayName}</span>
                      <span className="text-xs text-indigo-400 font-mono">@{user.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        user.accountStatus === 'approved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : user.accountStatus === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {user.accountStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {user.accountStatus === 'blocked' ? (
                    <button
                      onClick={() => handleUnblock(user.uid)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(user.uid)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-medium transition-colors"
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
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              User Reports
            </h3>
            {reports.length > 0 ? (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-[#121722] border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-200 uppercase">{report.reason}</span>
                      <span className="text-xs text-slate-500">• {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{report.details || 'No additional details provided.'}</p>
                    <p className="text-[11px] text-slate-500 mt-2 font-mono">
                      Reported UID: {report.reportedUid} | By: {report.reporterUid}
                    </p>
                  </div>

                  <div>
                    {report.status !== 'resolved' ? (
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">Resolved</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                No reports submitted. Community is clean.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

