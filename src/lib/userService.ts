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
    // New user initial profile document: only populate actual Google account information
    const newProfile: UserProfileDocument = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || '',
      email: firebaseUser.email,
      emailVerified: !!firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL || null,
      avatar: firebaseUser.photoURL ? 'custom' : 'boy',
      collegeOrUniversity: '',
      major: '',
      graduationYear: '',
      gpa: '',
      targetRole: '',
      bio: '',
      phone: '',
      location: '',
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
 * Preserves uid and createdAt. Strips any undefined fields so Firestore SDK never errors.
 */
export async function updateUserProfile(
  uid: string,
  profileUpdates: Partial<UserProfileDocument>
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const userDocRef = doc(db, 'users', uid);

  // Strip read-only, immutable, and undefined fields
  const safeUpdates: Record<string, any> = {};
  for (const [key, val] of Object.entries(profileUpdates)) {
    if (key === 'uid' || key === 'createdAt' || val === undefined) {
      continue;
    }
    if (key === 'socialLinks' && typeof val === 'object' && val !== null) {
      const cleanSocial: Record<string, string> = {};
      const socialObj = val as Record<string, any>;
      if (socialObj.linkedin !== undefined) cleanSocial.linkedin = socialObj.linkedin;
      if (socialObj.github !== undefined) cleanSocial.github = socialObj.github;
      if (socialObj.portfolio !== undefined) cleanSocial.portfolio = socialObj.portfolio;
      safeUpdates.socialLinks = cleanSocial;
    } else {
      safeUpdates[key] = val;
    }
  }

  safeUpdates.updatedAt = serverTimestamp();

  // If document does not exist yet, create it; otherwise update
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    safeUpdates.uid = uid;
    safeUpdates.createdAt = serverTimestamp();
    await setDoc(userDocRef, safeUpdates);
  } else {
    await updateDoc(userDocRef, safeUpdates);
  }
}

/**
 * Converts a Firestore UserProfileDocument to the application's internal StudentProfile
 * Respects real stored values (including empty strings) without resurrecting dummy fallbacks.
 */
export function mapUserDocToStudentProfile(
  userDoc: UserProfileDocument,
  fallback: StudentProfile
): StudentProfile {
  return {
    id: userDoc.uid,
    fullName: userDoc.displayName !== undefined && userDoc.displayName !== null ? userDoc.displayName : (fallback.fullName || ''),
    email: userDoc.email !== undefined && userDoc.email !== null ? userDoc.email : (fallback.email || ''),
    phone: userDoc.phone !== undefined ? userDoc.phone : (fallback.phone || ''),
    location: userDoc.location !== undefined ? userDoc.location : (fallback.location || ''),
    collegeOrUniversity: userDoc.collegeOrUniversity !== undefined ? userDoc.collegeOrUniversity : (fallback.collegeOrUniversity || ''),
    major: userDoc.major !== undefined ? userDoc.major : (fallback.major || ''),
    graduationYear: userDoc.graduationYear !== undefined ? userDoc.graduationYear : (fallback.graduationYear || ''),
    gpa: userDoc.gpa !== undefined ? userDoc.gpa : (fallback.gpa || ''),
    avatar: userDoc.avatar || fallback.avatar || 'boy',
    avatarUrl: userDoc.photoURL || fallback.avatarUrl || undefined,
    targetRole: userDoc.targetRole !== undefined ? userDoc.targetRole : (fallback.targetRole || ''),
    bio: userDoc.bio !== undefined ? userDoc.bio : (fallback.bio || ''),
    socialLinks: {
      linkedin: userDoc.socialLinks?.linkedin !== undefined ? userDoc.socialLinks.linkedin : (fallback.socialLinks?.linkedin || ''),
      github: userDoc.socialLinks?.github !== undefined ? userDoc.socialLinks.github : (fallback.socialLinks?.github || ''),
      portfolio: userDoc.socialLinks?.portfolio !== undefined ? userDoc.socialLinks.portfolio : (fallback.socialLinks?.portfolio || ''),
    },
  };
}
