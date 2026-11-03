/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Resume Setup Persistence Service
 * Stores and retrieves AI Resume Assistant Setup Wizard state
 * in Firestore under users/{userId}/resumeSetups/{setupId} with localStorage caching.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  ResumeSetupData,
  StudentProfileContext,
  TargetRole,
  DEFAULT_TARGET_ROLES,
} from '../types/resumeSetup.ts';
import { StudentProfile } from '../types/profile.ts';
import { User } from 'firebase/auth';

const STORAGE_KEY_CURRENT = 'profile_resume_setup_active';

/**
 * Creates an initial default ResumeSetupData populated with current user & profile context.
 */
export function createInitialResumeSetup(
  user?: User | null,
  profile?: StudentProfile | null
): ResumeSetupData {
  const profileContext: StudentProfileContext = {
    fullName: user?.displayName || profile?.fullName || '',
    email: user?.email || profile?.email || '',
    emailVerified: user?.emailVerified ?? false,
    photoUrl: user?.photoURL || profile?.avatarUrl || '',
    collegeOrUniversity: profile?.collegeOrUniversity || '',
    major: profile?.major || '',
    degree: 'Bachelor of Technology (B.Tech)',
    academicYear: 'Final Year / 4th Year',
    graduationYear: profile?.graduationYear || new Date().getFullYear().toString(),
    gpa: profile?.gpa || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  };

  const defaultRole: TargetRole =
    DEFAULT_TARGET_ROLES.find(
      (r) =>
        profile?.targetRole &&
        r.title.toLowerCase() === profile.targetRole.toLowerCase()
    ) || DEFAULT_TARGET_ROLES[1]; // Frontend Developer Intern by default

  return {
    id: `setup_${Date.now()}`,
    userId: user?.uid,
    purpose: 'fresher',
    targetRole: defaultRole,
    jobDescription: {
      text: '',
      charCount: 0,
      provided: false,
    },
    profileContext,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Persists resume setup state to Firestore and local storage.
 */
export async function saveResumeSetup(setup: ResumeSetupData): Promise<void> {
  // Always update local cache first for instant responsiveness
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(setup));
    if (setup.id) {
      localStorage.setItem(`profile_resume_setup_${setup.id}`, JSON.stringify(setup));
    }
  } catch (err) {
    console.warn('[ResumeSetup] LocalStorage write failed:', err);
  }

  // Persist to Cloud Firestore if user is authenticated and DB is ready
  if (db && setup.userId) {
    try {
      const setupDocRef = doc(db, 'users', setup.userId, 'resumeSetups', setup.id || 'current');
      await setDoc(
        setupDocRef,
        {
          ...setup,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[ResumeSetup] Firestore sync failed (cached locally):', err);
    }
  }
}

/**
 * Retrieves the active resume setup from Firestore or local storage.
 */
export async function getActiveResumeSetup(userId?: string): Promise<ResumeSetupData | null> {
  // 1. Try local storage cache for zero-latency retrieval
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (cached) {
      const parsed = JSON.parse(cached) as ResumeSetupData;
      if (!userId || parsed.userId === userId) {
        return parsed;
      }
    }
  } catch {
    // Continue to Firestore fallback
  }

  // 2. Fetch from Cloud Firestore if authenticated
  if (db && userId) {
    try {
      const docRef = doc(db, 'users', userId, 'resumeSetups', 'current');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as ResumeSetupData;
        try {
          localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(data));
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('[ResumeSetup] Firestore fetch failed:', err);
    }
  }

  return null;
}
