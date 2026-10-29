/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Cloud Firestore User Profile Service
 * Manages minimal, typed user profile documents at: users/{uid}
 * 
 * Strict Spark-friendly design:
 * - Documents stored strictly at users/{uid}
 * - No resume documents, PDF binaries, or credentials in Firestore
 * - Preserves createdAt and custom Cloudinary photoURLs across logins
 * - Uses serverTimestamp() and eliminates redundant writes
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  FieldValue,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase.ts';
import { StudentProfile, AvatarType } from '../types/profile.ts';

export interface UserProfileDocument {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  avatar?: AvatarType;
  collegeOrUniversity?: string;
  major?: string;
  graduationYear?: string;
  gpa?: string;
  targetRole?: string;
  bio?: string;
  phone?: string;
  location?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  createdAt: FieldValue | Timestamp | string;
  updatedAt: FieldValue | Timestamp | string;
}

/**
 * Loads a user's profile document from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserProfileDocument | null> {
  if (!db) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfileDocument;
    }
    return null;
  } catch (err) {
    console.error('[ProFile Firestore getUserProfile Error]:', err);
    return null;
  }
}

/**
 * Syncs user profile after successful authentication.
 * - Creates profile document if it does not exist.
 * - Avoids overwriting custom Cloudinary photoURL with Google photo.
 * - Preserves createdAt and only writes if values actually changed.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: User
): Promise<UserProfileDocument> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userDocRef);

  if (!snap.exists()) {
    // New user initial profile document
    const newProfile: UserProfileDocument = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'ProFile Student',
      email: firebaseUser.email,
      emailVerified: !!firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || null,
      avatar: firebaseUser.photoURL ? 'custom' : 'boy',
      collegeOrUniversity: 'University / College',
      major: 'Computer Science',
      graduationYear: '2026',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newProfile);
    return newProfile;
  }

  // Existing user document
  const existing = snap.data() as UserProfileDocument;
  const updates: Partial<UserProfileDocument> = {};

  // Sync basic Google account metadata if modified
  if (firebaseUser.displayName && existing.displayName !== firebaseUser.displayName) {
    updates.displayName = firebaseUser.displayName;
  }
  if (firebaseUser.email && existing.email !== firebaseUser.email) {
    updates.email = firebaseUser.email;
  }
  if (existing.emailVerified !== firebaseUser.emailVerified) {
    updates.emailVerified = !!firebaseUser.emailVerified;
  }

  // Preserve existing Cloudinary or custom photoURL; only set if user had no photo at all
  if (!existing.photoURL && firebaseUser.photoURL) {
    updates.photoURL = firebaseUser.photoURL;
    updates.avatar = 'custom';
  }

  // Only perform a Firestore write if actual changes exist
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = serverTimestamp();
    await updateDoc(userDocRef, updates);
    return { ...existing, ...updates };
  }

  return existing;
}

/**
 * Updates an authenticated user's profile document in Firestore.
 * Preserves uid and createdAt.
 */
export async function updateUserProfile(
  uid: string,
  profileUpdates: Partial<UserProfileDocument>
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userDocRef = doc(db, 'users', uid);

  // Strip read-only or immutable fields
  const safeUpdates: Record<string, any> = { ...profileUpdates };
  delete safeUpdates.uid;
  delete safeUpdates.createdAt;

  safeUpdates.updatedAt = serverTimestamp();

  await updateDoc(userDocRef, safeUpdates);
}

/**
 * Converts a Firestore UserProfileDocument to the application's internal StudentProfile
 */
export function mapUserDocToStudentProfile(
  userDoc: UserProfileDocument,
  fallback: StudentProfile
): StudentProfile {
  return {
    id: userDoc.uid,
    fullName: userDoc.displayName || fallback.fullName,
    email: userDoc.email || fallback.email,
    phone: userDoc.phone || fallback.phone,
    location: userDoc.location || fallback.location,
    collegeOrUniversity: userDoc.collegeOrUniversity || fallback.collegeOrUniversity,
    major: userDoc.major || fallback.major,
    graduationYear: userDoc.graduationYear || fallback.graduationYear,
    gpa: userDoc.gpa || fallback.gpa,
    avatar: userDoc.avatar || fallback.avatar,
    avatarUrl: userDoc.photoURL || fallback.avatarUrl,
    targetRole: userDoc.targetRole || fallback.targetRole,
    bio: userDoc.bio || fallback.bio,
    socialLinks: {
      linkedin: userDoc.socialLinks?.linkedin || fallback.socialLinks?.linkedin,
      github: userDoc.socialLinks?.github || fallback.socialLinks?.github,
      portfolio: userDoc.socialLinks?.portfolio || fallback.socialLinks?.portfolio,
    },
  };
}
