import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { auth, googleProvider, db, isDemoMode } from '../lib/firebase';
import { UserProfile } from '../types';
import { mockStore } from './mockStore';

export const authService = {
  // Current user state subscriber
  subscribeAuthState(callback: (user: FirebaseUser | null, profile: UserProfile | null, isAdmin: boolean) => void) {
    if (isDemoMode) {
      // In demo mode without custom keys, provide seamless demo toggle
      const checkMock = () => {
        const storedUid = localStorage.getItem('demo_uid') || 'demo-admin-1';
        const user = mockStore.users.find(u => u.uid === storedUid) || mockStore.users[0];
        const isAdmin = mockStore.admins.has(user.uid);
        const pseudoFbUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: `${user.username}@private.local`,
          photoURL: user.photoURL,
        } as unknown as FirebaseUser;
        callback(pseudoFbUser, user, isAdmin);
      };
      
      checkMock();
      return mockStore.subscribe(checkMock);
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null, null, false);
        return;
      }

      // Check admin status
      let isAdmin = false;
      try {
        const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
        isAdmin = adminDoc.exists();
        // Fallback for bootstrap admin email if configured
        if (!isAdmin && import.meta.env.VITE_INITIAL_ADMIN_EMAIL && fbUser.email === import.meta.env.VITE_INITIAL_ADMIN_EMAIL) {
          isAdmin = true;
        }
      } catch (err) {
        console.warn('Could not check admin status:', err);
      }

      // Listen to profile updates in real-time
      const unsubProfile = onSnapshot(
        doc(db, 'users', fbUser.uid), 
        (docSnap) => {
          if (docSnap.exists()) {
            callback(fbUser, docSnap.data() as UserProfile, isAdmin);
          } else {
            callback(fbUser, null, isAdmin);
          }
        },
        (error) => {
          console.error("Firestore user profile listen error:", error);
          // Always invoke callback so the loading spinner doesn't hang
          callback(fbUser, null, isAdmin);
        }
      );

      return unsubProfile;
    });
  },

  // Google Sign-In
  async signInWithGoogle() {
    if (isDemoMode) {
      localStorage.setItem('demo_uid', 'demo-admin-1');
      mockStore.notify();
      return;
    }
    await signInWithPopup(auth, googleProvider);
  },

  // Switch demo account for easy local evaluation
  switchDemoUser(uid: string) {
    localStorage.setItem('demo_uid', uid);
    mockStore.notify();
  },

  // Sign out
  async signOut() {
    try {
      localStorage.removeItem('demo_uid');
      if (!isDemoMode) {
        await fbSignOut(auth);
      } else {
        mockStore.notify();
      }
      // Force page reload to clean state
      window.location.reload();
    } catch (err) {
      console.error("Sign out error:", err);
      window.location.reload();
    }
  },

  // Check username availability
  async checkUsernameAvailable(username: string): Promise<boolean> {
    const lower = username.trim().toLowerCase();
    if (!lower || lower.length < 3 || lower.length > 20 || !/^[a-z0-9_]+$/.test(lower)) {
      return false;
    }

    if (isDemoMode) {
      return !mockStore.users.some(u => u.usernameLower === lower);
    }

    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', lower));
      return !usernameDoc.exists();
    } catch (err) {
      console.warn("Username availability check warning:", err);
      return true; // Fallback to let setupProfile proceed
    }
  },

  // Complete profile setup for new users
  async setupProfile(uid: string, username: string, displayName: string, photoURL: string, bio: string = '') {
    const lower = username.trim().toLowerCase();

    // Determine initial status: if user email matches configured admin email, approve immediately!
    const currentUserEmail = auth.currentUser?.email;
    const initialAdminEmail = import.meta.env.VITE_INITIAL_ADMIN_EMAIL;
    const isAutoAdmin = !!(initialAdminEmail && currentUserEmail && currentUserEmail.toLowerCase() === initialAdminEmail.toLowerCase());
    const initialStatus = isAutoAdmin ? 'approved' : 'pending';

    if (isDemoMode) {
      const newProfile: UserProfile = {
        uid,
        username: username.trim(),
        usernameLower: lower,
        displayName: displayName.trim(),
        photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
        bio: bio.trim(),
        accountStatus: initialStatus,
        discoverable: true,
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      };
      mockStore.users.push(newProfile);
      if (isAutoAdmin) mockStore.admins.add(uid);
      mockStore.notify();
      return newProfile;
    }

    const newProfile: UserProfile = {
      uid,
      username: username.trim(),
      usernameLower: lower,
      displayName: displayName.trim(),
      photoURL: photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      bio: bio.trim(),
      accountStatus: initialStatus,
      discoverable: true,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    // Save profile and username reservation
    try {
      await setDoc(doc(db, 'users', uid), newProfile);
      await setDoc(doc(db, 'usernames', lower), { uid, createdAt: Date.now() });

      if (isAutoAdmin) {
        await setDoc(doc(db, 'admins', uid), { uid, email: currentUserEmail, createdAt: Date.now() });
      }
    } catch (err: any) {
      console.error("Error creating user profile in Firestore:", err);
      throw new Error(err?.message || "Failed to save profile. Please check Firestore security rules.");
    }
  },

  // Update profile fields (display name, bio, photoURL, discoverability)
  async updateProfile(uid: string, updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'photoURL' | 'discoverable'>>) {
    if (isDemoMode) {
      const idx = mockStore.users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        mockStore.users[idx] = { ...mockStore.users[idx], ...updates };
        mockStore.notify();
      }
      return;
    }

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      lastSeenAt: Date.now()
    });
  },

  // Update presence timestamp (minimal free-quota friendly lastSeen)
  async touchPresence(uid: string) {
    if (isDemoMode) {
      const idx = mockStore.users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        mockStore.users[idx].lastSeenAt = Date.now();
      }
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastSeenAt: Date.now()
      });
    } catch {
      // Ignore presence update errors silently
    }
  }
};

