'use client';

// ==============================================================================
// AUTHENTICATION & RBAC CONTEXT (Section 6, 7, 8)
// Provides reactive Firebase Auth state, server custom claims, and Firestore profile
// ==============================================================================

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onIdTokenChanged, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase/firebase';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  subscribeToAuthChanges,
} from '../lib/firebase/auth';
import { fetchUserProfile } from '../lib/firebase/firestore';
import { UserProfile, UserRole } from '../types/user';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  token: string | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('USER');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const configured = useMemo(() => isFirebaseConfigured(), []);

  // Sync profile & resolve custom claims
  const syncUserState = async (user: User | null) => {
    if (!user) {
      setCurrentUser(null);
      setUserProfile(null);
      setRole('USER');
      setToken(null);
      apiClient.setAuthToken(null);
      setLoading(false);
      return;
    }

    try {
      setCurrentUser(user);
      const idToken = await user.getIdToken();
      setToken(idToken);
      apiClient.setAuthToken(idToken);

      // Extract custom claims if set by server
      const tokenResult = await user.getIdTokenResult();
      const claimRole = (tokenResult.claims.role as UserRole) || null;

      // Fetch Firestore profile
      let profile = (await fetchUserProfile(user.uid)) as UserProfile | null;

      if (!profile) {
        // Construct fallback initial profile
        profile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Meteorologist',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          role: claimRole || 'USER',
          preferredLanguage: 'en',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }

      setUserProfile(profile);
      setRole(claimRole || profile.role || 'USER');
    } catch (err: unknown) {
      console.error('Error synchronizing auth state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      syncUserState(user);
    });

    // Listen to token changes for custom claim refreshes
    const unsubscribeToken = onIdTokenChanged(auth, (user) => {
      if (user) {
        syncUserState(user);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  const handleSignInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await loginWithEmail(email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
      throw err;
    }
  };

  const handleSignUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    try {
      const cred = await registerWithEmail(email, pass);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    }
  };

  const handleSignInWithGoogle = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
      throw err;
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserProfile(null);
      setRole('USER');
      setToken(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logout failed';
      setError(msg);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await syncUserState(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        token,
        loading,
        isConfigured: configured,
        error,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithGoogle: handleSignInWithGoogle,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
