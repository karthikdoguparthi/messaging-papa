import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setupProfile: (username: string, displayName: string, photoURL: string, bio?: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'photoURL' | 'discoverable'>>) => Promise<void>;
  switchDemoUser: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = authService.subscribeAuthState((fbUser, userProfile, adminStatus) => {
      setUser(fbUser);
      setProfile(userProfile);
      setIsAdmin(adminStatus);
      setLoading(false);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Update presence periodically (every 2 minutes)
  useEffect(() => {
    if (!profile?.uid || profile.accountStatus !== 'approved') return;
    authService.touchPresence(profile.uid);
    const interval = setInterval(() => {
      authService.touchPresence(profile.uid);
    }, 120000);
    return () => clearInterval(interval);
  }, [profile?.uid, profile?.accountStatus]);

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const setupProfile = async (username: string, displayName: string, photoURL: string, bio: string = '') => {
    if (!user) throw new Error("User must be authenticated to setup profile");
    await authService.setupProfile(user.uid, username, displayName, photoURL, bio);
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'displayName' | 'bio' | 'photoURL' | 'discoverable'>>) => {
    if (!profile?.uid) return;
    await authService.updateProfile(profile.uid, updates);
  };

  const switchDemoUser = (uid: string) => {
    authService.switchDemoUser(uid);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      loading,
      signInWithGoogle,
      signOut,
      setupProfile,
      updateProfile,
      switchDemoUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

