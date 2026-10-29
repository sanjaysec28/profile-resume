/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Firebase Authentication Context
 * Manages Google Sign-In, session persistence, and Firestore profile synchronization.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, checkFirebaseConfig } from '../lib/firebase.ts';
import {
  UserProfileDocument,
  getUserProfile,
  syncUserProfileOnLogin,
  updateUserProfile,
} from '../lib/userService.ts';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfileDocument | null;
  isLoading: boolean;
  isConfigured: boolean;
  missingFirebaseKeys: string[];
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfileDocument>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const configStatus = checkFirebaseConfig();

  // Listen for Firebase auth state changes (session restoration)
  useEffect(() => {
    if (!auth || !configStatus.isConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profile = await syncUserProfileOnLogin(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.error('[ProFile Auth Sync Error]:', err);
          // Attempt loading existing profile if sync write failed
          const existing = await getUserProfile(currentUser.uid);
          if (existing) {
            setUserProfile(existing);
          }
        }
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [configStatus.isConfigured]);

  // Google Sign-In with popup
  const signInWithGoogle = async () => {
    setAuthError(null);

    if (!configStatus.isConfigured || !auth || !googleProvider) {
      const msg = `Firebase Authentication is not configured yet. Missing environment variables: ${configStatus.missingKeys.join(
        ', '
      )}. Please provide your Firebase project web credentials.`;
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);

      // Sync user profile to Firestore
      const profile = await syncUserProfileOnLogin(result.user);
      setUserProfile(profile);
    } catch (err: any) {
      console.error('[ProFile Google Sign-In Error]:', err);

      let friendlyMessage = 'Failed to sign in with Google. Please try again.';

      if (err.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Sign-in window was closed before completing authentication.';
      } else if (err.code === 'auth/popup-blocked') {
        friendlyMessage =
          'The sign-in popup was blocked by your browser. Please allow popups for this site and retry.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        friendlyMessage = 'Sign-in operation was cancelled.';
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error occurred. Please check your internet connection.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage =
          'Google Sign-in is not enabled in your Firebase Console. Please enable Google under Authentication -> Sign-in method.';
      } else if (err.code === 'auth/unauthorized-domain') {
        friendlyMessage =
          'This domain is not authorized in Firebase Console. Please add this domain under Authentication -> Settings -> Authorized domains.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }

      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setAuthError(null);
    if (!auth) {
      setUser(null);
      setUserProfile(null);
      return;
    }

    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('[ProFile Sign-Out Error]:', err);
      setAuthError(err.message || 'Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user profile from Firestore
  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('[ProFile Refresh Profile Error]:', err);
    }
  };

  // Update profile data in Firestore and local state
  const updateProfile = async (updates: Partial<UserProfileDocument>) => {
    if (!user) {
      throw new Error('User is not authenticated.');
    }

    await updateUserProfile(user.uid, updates);

    setUserProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
      };
    });
  };

  const clearAuthError = () => setAuthError(null);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isConfigured: configStatus.isConfigured,
    missingFirebaseKeys: configStatus.missingKeys,
    authError,
    signInWithGoogle,
    signOut,
    refreshProfile,
    updateProfile,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
