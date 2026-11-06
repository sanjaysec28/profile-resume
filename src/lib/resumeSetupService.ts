/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Resume Setup Persistence Service
 * Stores and retrieves AI Resume Assistant Setup Wizard state
 * in Firestore under users/{userId}/resumeSetups/{setupId} with localStorage caching.
 */

import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  ResumeSetupData,
  StudentProfileContext,
  TargetRole,
  DEFAULT_TARGET_ROLES,
} from '../types/resumeSetup.ts';
import { StudentProfile } from '../types/profile.ts';
import { User } from 'firebase/auth';
import { sanitizeForFirestore } from './resumePersistenceService.ts';

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
 * Writes to both 'current' for constant-time lookup and historical timestamp ID for audit history.
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
      const sanitized = sanitizeForFirestore(setup);

      // 1. Always update canonical 'current' pointer for deterministic single-document fetches
      const currentDocRef = doc(db, 'users', setup.userId, 'resumeSetups', 'current');
      await setDoc(
        currentDocRef,
        {
          ...sanitized,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Only write to a historical snapshot document when the setup wizard is completed,
      // avoiding duplicate documents on intermediate draft steps
      if (setup.status === 'completed' && setup.id && setup.id !== 'current') {
        const historicalDocRef = doc(db, 'users', setup.userId, 'resumeSetups', setup.id);
        await setDoc(
          historicalDocRef,
          {
            ...sanitized,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[ResumeSetup] Firestore sync failed (cached locally):', err);
    }
  }
}

/**
 * Retrieves the active resume setup from Firestore or local storage.
 * Gracefully migrates any historical records if 'current' does not exist yet,
 * and checks legacy collection paths (resume_setup, resumeSetup) for complete backward compatibility.
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
      // 2a. First attempt to load 'current' document
      const currentDocRef = doc(db, 'users', userId, 'resumeSetups', 'current');
      const snap = await getDoc(currentDocRef);
      if (snap.exists()) {
        const data = snap.data() as ResumeSetupData;
        try {
          localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(data));
        } catch {}
        return data;
      }

      // 2b. Backward compatibility: if 'current' does not exist, query historical documents
      // Checks resumeSetups, then legacy aliases resume_setup and resumeSetup
      const collectionsToCheck = ['resumeSetups', 'resume_setup', 'resumeSetup'];
      for (const colName of collectionsToCheck) {
        try {
          const colRef = collection(db, 'users', userId, colName);
          const snaps = await getDocs(colRef);
          if (!snaps.empty) {
            const candidates = snaps.docs
              .map((d) => d.data() as ResumeSetupData)
              .filter((d) => d && d.targetRole);

            if (candidates.length > 0) {
              candidates.sort(
                (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
              );
              const latest = candidates[0];

              // Migrate to canonical 'current' document in resumeSetups so subsequent loads are instant
              await setDoc(
                currentDocRef,
                { ...sanitizeForFirestore(latest), updatedAt: serverTimestamp() },
                { merge: true }
              );

              try {
                localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(latest));
              } catch {}
              return latest;
            }
          }
        } catch {
          // Continue to next alias
        }
      }
    } catch (err) {
      console.warn('[ResumeSetup] Firestore fetch failed:', err);
    }
  }

  return null;
}
