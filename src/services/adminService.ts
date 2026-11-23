import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, isDemoMode } from '../lib/firebase';
import { UserProfile, ReportItem, InAppNotification } from '../types';
import { mockStore } from './mockStore';

export const adminService = {
  // Subscribe to all members (for admin view)
  subscribeMembers(callback: (users: UserProfile[]) => void) {
    if (isDemoMode) {
      const update = () => callback([...mockStore.users]);
      update();
      return mockStore.subscribe(update);
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => d.data() as UserProfile);
      callback(users);
    });
  },

  // Approve a pending user account
  async approveUser(uid: string) {
    if (isDemoMode) {
      const user = mockStore.users.find(u => u.uid === uid);
      if (user) {
        user.accountStatus = 'approved';
        mockStore.notify();
      }
      return;
    }
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'approved'
    });
  },

  // Block/suspend a user
  async blockUser(uid: string) {
    if (isDemoMode) {
      const user = mockStore.users.find(u => u.uid === uid);
      if (user) {
        user.accountStatus = 'blocked';
        mockStore.notify();
      }
      return;
    }
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'blocked'
    });
  },

  // Unblock a suspended user
  async unblockUser(uid: string) {
    if (isDemoMode) {
      const user = mockStore.users.find(u => u.uid === uid);
      if (user) {
        user.accountStatus = 'approved';
        mockStore.notify();
      }
      return;
    }
    await updateDoc(doc(db, 'users', uid), {
      accountStatus: 'approved'
    });
  },

  // Subscribe to reports
  subscribeReports(callback: (reports: ReportItem[]) => void) {
    if (isDemoMode) {
      const update = () => callback([...mockStore.reports]);
      update();
      return mockStore.subscribe(update);
    }

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      const reports = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReportItem));
      callback(reports);
    });
  },

  // Update report status
  async resolveReport(reportId: string, status: 'reviewed' | 'resolved') {
    if (isDemoMode) {
      const r = mockStore.reports.find(item => item.id === reportId);
      if (r) {
        r.status = status;
        mockStore.notify();
      }
      return;
    }
    await updateDoc(doc(db, 'reports', reportId), { status });
  }
};

export const privacyService = {
  // Block another user
  async blockMember(currentUid: string, targetUid: string) {
    if (isDemoMode) {
      if (!mockStore.blockedUsers[currentUid]) {
        mockStore.blockedUsers[currentUid] = new Set();
      }
      mockStore.blockedUsers[currentUid].add(targetUid);
      mockStore.notify();
      return;
    }
    await setDoc(doc(db, 'users', currentUid, 'blockedUsers', targetUid), {
      blockedUid: targetUid,
      createdAt: Date.now()
    });
  },

  // Unblock a user
  async unblockMember(currentUid: string, targetUid: string) {
    if (isDemoMode) {
      if (mockStore.blockedUsers[currentUid]) {
        mockStore.blockedUsers[currentUid].delete(targetUid);
        mockStore.notify();
      }
      return;
    }
    await deleteDoc(doc(db, 'users', currentUid, 'blockedUsers', targetUid));
  },

  // Check if a user is blocked
  isBlocked(currentUid: string, targetUid: string): boolean {
    if (isDemoMode) {
      return !!mockStore.blockedUsers[currentUid]?.has(targetUid);
    }
    return false;
  },

  // Submit report against a user
  async submitReport(reporterUid: string, reportedUid: string, reason: ReportItem['reason'], details: string) {
    const reportData = {
      reporterUid,
      reportedUid,
      reason,
      details: details.trim(),
      createdAt: Date.now(),
      status: 'pending'
    };

    if (isDemoMode) {
      mockStore.reports.push({
        id: `rep_${Date.now()}`,
        ...reportData
      });
      mockStore.notify();
      return;
    }

    await setDoc(doc(collection(db, 'reports')), reportData);
  }
};

export const notificationService = {
  // In-app notifications listener
  subscribeNotifications(uid: string, callback: (notifications: InAppNotification[]) => void) {
    if (isDemoMode) {
      const update = () => {
        const notifs = mockStore.notifications
          .filter(n => n.recipientUid === uid)
          .map(n => ({
            ...n,
            actorProfile: mockStore.users.find(u => u.uid === n.actorUid)
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        callback(notifs);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    return onSnapshot(q, async (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as InAppNotification));
      callback(notifs);
    });
  },

  async markAsRead(notificationId: string) {
    if (isDemoMode) {
      const n = mockStore.notifications.find(item => item.id === notificationId);
      if (n) {
        n.read = true;
        mockStore.notify();
      }
      return;
    }
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  }
};

