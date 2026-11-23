import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  limit, 
  orderBy 
} from 'firebase/firestore';
import { db, isDemoMode } from '../lib/firebase';
import { UserProfile, FriendRequest, Friendship } from '../types';
import { mockStore } from './mockStore';

export const friendshipService = {
  // Search approved discoverable members by username prefix or exact match
  async searchMembers(searchTerm: string, currentUid: string): Promise<UserProfile[]> {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    if (isDemoMode) {
      const blocked = mockStore.blockedUsers[currentUid] || new Set();
      return mockStore.users.filter(u => 
        u.uid !== currentUid &&
        u.accountStatus === 'approved' &&
        u.discoverable &&
        !blocked.has(u.uid) &&
        (u.usernameLower.includes(term) || u.displayName.toLowerCase().includes(term))
      ).slice(0, 10);
    }

    // Clean search term (remove leading @ if user typed @venkatsiddu)
    const cleanTerm = term.startsWith('@') ? term.substring(1) : term;

    try {
      // 1. Try exact username match first
      const exactQ = query(
        collection(db, 'users'),
        where('usernameLower', '==', cleanTerm),
        limit(5)
      );
      const exactSnap = await getDocs(exactQ);
      if (!exactSnap.empty) {
        return exactSnap.docs
          .map(d => d.data() as UserProfile)
          .filter(u => u.uid !== currentUid && u.accountStatus === 'approved');
      }

      // 2. Fallback prefix search without multi-field composite index constraint
      const prefixQ = query(
        collection(db, 'users'),
        where('usernameLower', '>=', cleanTerm),
        where('usernameLower', '<=', cleanTerm + '\uf8ff'),
        limit(10)
      );
      const prefixSnap = await getDocs(prefixQ);
      return prefixSnap.docs
        .map(d => d.data() as UserProfile)
        .filter(u => u.uid !== currentUid && u.accountStatus === 'approved');
    } catch (err) {
      console.error("Firestore searchMembers error:", err);
      // Fallback: fetch approved users and filter in-memory (cost-effective for small friend groups)
      try {
        const fallbackQ = query(collection(db, 'users'), limit(50));
        const allSnap = await getDocs(fallbackQ);
        return allSnap.docs
          .map(d => d.data() as UserProfile)
          .filter(u => 
            u.uid !== currentUid &&
            u.accountStatus === 'approved' &&
            (u.usernameLower?.includes(cleanTerm) || u.displayName?.toLowerCase().includes(cleanTerm))
          );
      } catch (fallbackErr) {
        console.error("Search fallback error:", fallbackErr);
        return [];
      }
    }
  },

  // Subscribe to accepted friends
  subscribeFriends(uid: string, callback: (friends: UserProfile[]) => void) {
    if (isDemoMode) {
      const update = () => {
        const friendships = mockStore.friendships.filter(f => f.members.includes(uid));
        const friendUids = friendships.map(f => f.members[0] === uid ? f.members[1] : f.members[0]);
        const friends = mockStore.users.filter(u => friendUids.includes(u.uid));
        callback(friends);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'friendships'),
      where('members', 'array-contains', uid)
    );

    return onSnapshot(q, async (snapshot) => {
      const friendUids = snapshot.docs.map(doc => {
        const data = doc.data() as Friendship;
        return data.members[0] === uid ? data.members[1] : data.members[0];
      });

      if (friendUids.length === 0) {
        callback([]);
        return;
      }

      // Fetch profiles in batches or individually cached
      const profiles: UserProfile[] = [];
      for (const friendUid of friendUids) {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', friendUid), limit(1)));
        if (!userDoc.empty) {
          profiles.push(userDoc.docs[0].data() as UserProfile);
        }
      }
      callback(profiles);
    });
  },

  // Subscribe to received friend requests
  subscribeReceivedRequests(uid: string, callback: (requests: FriendRequest[]) => void) {
    if (isDemoMode) {
      const update = () => {
        const list = mockStore.friendRequests
          .filter(r => r.toUid === uid && r.status === 'pending')
          .map(r => ({
            ...r,
            fromUser: mockStore.users.find(u => u.uid === r.fromUid)
          }));
        callback(list);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    );

    return onSnapshot(q, async (snap) => {
      const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      callback(requests);
    });
  },

  // Subscribe to sent friend requests
  subscribeSentRequests(uid: string, callback: (requests: FriendRequest[]) => void) {
    if (isDemoMode) {
      const update = () => {
        const list = mockStore.friendRequests
          .filter(r => r.fromUid === uid && r.status === 'pending')
          .map(r => ({
            ...r,
            toUser: mockStore.users.find(u => u.uid === r.toUid)
          }));
        callback(list);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', uid),
      where('status', '==', 'pending')
    );

    return onSnapshot(q, (snap) => {
      const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      callback(requests);
    });
  },

  // Send a friend request
  async sendFriendRequest(fromUid: string, toUid: string) {
    if (fromUid === toUid) throw new Error("Cannot send request to yourself");

    if (isDemoMode) {
      const existing = mockStore.friendRequests.find(r => 
        (r.fromUid === fromUid && r.toUid === toUid && r.status === 'pending')
      );
      if (existing) throw new Error("Friend request already pending");

      const req: FriendRequest = {
        id: `req_${Date.now()}`,
        fromUid,
        toUid,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockStore.friendRequests.push(req);
      mockStore.notifications.push({
        id: `notif_${Date.now()}`,
        recipientUid: toUid,
        type: 'friend_request',
        actorUid: fromUid,
        relatedId: req.id,
        read: false,
        createdAt: Date.now(),
      });
      mockStore.notify();
      return;
    }

    const requestId = `${fromUid}_${toUid}`;
    await setDoc(doc(db, 'friendRequests', requestId), {
      fromUid,
      toUid,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Notify recipient
    await setDoc(doc(collection(db, 'notifications')), {
      recipientUid: toUid,
      type: 'friend_request',
      actorUid: fromUid,
      relatedId: requestId,
      read: false,
      createdAt: Date.now()
    });
  },

  // Accept a friend request
  async acceptFriendRequest(requestId: string, fromUid: string, toUid: string) {
    const friendshipId = [fromUid, toUid].sort().join('_');

    if (isDemoMode) {
      const req = mockStore.friendRequests.find(r => r.id === requestId || (r.fromUid === fromUid && r.toUid === toUid));
      if (req) req.status = 'accepted';

      if (!mockStore.friendships.some(f => f.id === friendshipId)) {
        mockStore.friendships.push({
          id: friendshipId,
          members: [fromUid, toUid],
          createdAt: Date.now(),
        });
      }

      mockStore.notifications.push({
        id: `notif_${Date.now()}`,
        recipientUid: fromUid,
        type: 'friend_accepted',
        actorUid: toUid,
        relatedId: friendshipId,
        read: false,
        createdAt: Date.now(),
      });
      mockStore.notify();
      return;
    }

    // Create deterministic friendship record
    await setDoc(doc(db, 'friendships', friendshipId), {
      members: [fromUid, toUid],
      createdAt: Date.now(),
      createdBy: toUid,
    });

    // Mark request accepted
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
      updatedAt: Date.now()
    });

    // Notify original sender
    await setDoc(doc(collection(db, 'notifications')), {
      recipientUid: fromUid,
      type: 'friend_accepted',
      actorUid: toUid,
      relatedId: friendshipId,
      read: false,
      createdAt: Date.now()
    });
  },

  // Decline friend request
  async declineFriendRequest(requestId: string) {
    if (isDemoMode) {
      mockStore.friendRequests = mockStore.friendRequests.filter(r => r.id !== requestId);
      mockStore.notify();
      return;
    }
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'declined',
      updatedAt: Date.now()
    });
  },

  // Cancel outgoing request
  async cancelFriendRequest(requestId: string) {
    if (isDemoMode) {
      mockStore.friendRequests = mockStore.friendRequests.filter(r => r.id !== requestId);
      mockStore.notify();
      return;
    }
    await deleteDoc(doc(db, 'friendRequests', requestId));
  },

  // Remove friend
  async removeFriend(uid1: string, uid2: string) {
    const friendshipId = [uid1, uid2].sort().join('_');
    if (isDemoMode) {
      mockStore.friendships = mockStore.friendships.filter(f => f.id !== friendshipId);
      mockStore.notify();
      return;
    }
    await deleteDoc(doc(db, 'friendships', friendshipId));
  }
};

