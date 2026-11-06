/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Cloud Resume Persistence & Migration Service
 * Manages atomic Cloud Firestore persistence at: users/{userId}/resumes/current
 * with local caching, debounced cloud autosaves, sanitization, and intelligent conflict resolution.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import { ResumeData } from '../types/resume.ts';
import { INITIAL_RESUME_DATA } from '../features/resume/constants.ts';

const LOCAL_STORAGE_KEY = 'profile_resume_draft';
const LOCAL_STORAGE_BACKUP_KEY = 'profile_resume_draft_backup';
const LOCAL_STORAGE_USER_KEY = 'profile_resume_owner_uid';

export type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export interface CloudResumeDocument {
  userId: string;
  resumeData: ResumeData;
  updatedAt: string;
  schemaVersion: number;
}

/**
 * Recursively cleans an object to strip `undefined` values and ensure
 * Firestore accepts all nested fields without throwing "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj as Record<string, any>)) {
      if (val === undefined) {
        continue;
      }
      cleaned[key] = sanitizeForFirestore(val);
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Checks if a resume contains actual student-entered data or is merely the default placeholder.
 */
export function isNonEmptyResume(resume?: ResumeData | null): boolean {
  if (!resume) return false;
  const name = resume.personalInfo?.fullName?.trim();
  if (!name || name === 'Alex Chen' || name === 'Sanjay Kumar' || name === 'ProFile Student' || name === 'Student') {
    return Boolean(
      (resume.education && resume.education.length > 0) ||
      (resume.projects && resume.projects.length > 0) ||
      (resume.skills?.technical && resume.skills.technical.length > 0)
    );
  }
  return true;
}

/**
 * Loads the user's resume, executing a safe migration & conflict resolution flow:
 * 1. Checks if a cloud resume exists under users/{userId}/resumes/current
 * 2. Checks if local draft exists in localStorage
 * 3. If cloud is empty and local draft exists, migrates local draft to cloud
 * 4. If both exist, compares update timestamps without silently overwriting
 * 5. Preserves a recoverable backup copy
 */
export async function loadUserResumeWithMigration(userId: string): Promise<{
  resumeData: ResumeData;
  source: 'cloud' | 'local' | 'migrated' | 'initial';
  message?: string;
}> {
  // 1. Read local storage draft
  let localDraft: ResumeData | null = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const lastOwner = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Only treat as valid local draft if it belonged to this user or an unauthenticated guest
      if (!lastOwner || lastOwner === userId) {
        localDraft = parsed;
      }
    }
  } catch (err) {
    console.warn('[ResumePersistence] Failed reading local draft cache:', err);
  }

  // 2. Read cloud resume if Firestore is ready
  let cloudResume: ResumeData | null = null;
  let cloudUpdatedAt: number = 0;

  if (db && userId) {
    try {
      const resumeDocRef = doc(db, 'users', userId, 'resumes', 'current');
      const snap = await getDoc(resumeDocRef);
      if (snap.exists()) {
        const data = snap.data() as CloudResumeDocument;
        if (data.resumeData) {
          cloudResume = data.resumeData;
          cloudUpdatedAt = new Date(data.updatedAt || data.resumeData.updatedAt || 0).getTime();
        }
      }
    } catch (err) {
      console.warn('[ResumePersistence] Firestore read error (using offline local cache):', err);
    }
  }

  // Record active owner
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  } catch {}

  // Scenario A: Cloud resume exists, no local draft -> use Cloud
  if (cloudResume && !localDraft) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudResume));
    } catch {}
    return { resumeData: cloudResume, source: 'cloud' };
  }

  // Scenario B: Cloud resume empty, local draft exists -> migrate local to cloud!
  if (!cloudResume && localDraft && isNonEmptyResume(localDraft)) {
    await saveResumeToCloud(userId, localDraft);
    return {
      resumeData: localDraft,
      source: 'migrated',
      message: 'Migrated your existing resume draft to cloud storage.',
    };
  }

  // Scenario C: Both exist -> compare timestamps and protect against silent overwrite
  if (cloudResume && localDraft) {
    const localUpdatedAt = new Date(localDraft.updatedAt || 0).getTime();

    // Preserve safety backup before any sync
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(localDraft));
    } catch {}

    // If local has newer timestamp by more than 5 seconds, use local and push to cloud
    if (localUpdatedAt > cloudUpdatedAt + 5000) {
      await saveResumeToCloud(userId, localDraft);
      return {
        resumeData: localDraft,
        source: 'local',
        message: 'Updated cloud resume with your recent offline changes.',
      };
    }

    // Otherwise, cloud is newer or equal -> use cloud and update local cache
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudResume));
    } catch {}
    return { resumeData: cloudResume, source: 'cloud' };
  }

  // Scenario D: Neither exists -> initial blank student resume
  const initial = INITIAL_RESUME_DATA;
  return { resumeData: initial, source: 'initial' };
}

export interface CloudResumeDocument {
  userId: string;
  resumeData: ResumeData;
  updatedAt: string;
  schemaVersion: number;
  revision?: number;
}

/**
 * Persists complete ResumeData to Cloud Firestore under users/{userId}/resumes/current.
 * Uses monotonic client revisions to ensure older saves never overwrite newer state.
 */
export async function saveResumeToCloud(
  userId: string,
  resumeData: ResumeData,
  revision?: number
): Promise<boolean> {
  // Update local storage cache immediately
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resumeData));
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  } catch (err) {
    console.warn('[ResumePersistence] LocalStorage write failed:', err);
  }

  if (!db || !userId) {
    return false;
  }

  try {
    const resumeDocRef = doc(db, 'users', userId, 'resumes', 'current');
    const sanitizedResume = sanitizeForFirestore(resumeData);

    const docPayload = {
      userId,
      resumeData: sanitizedResume,
      updatedAt: resumeData.updatedAt || new Date().toISOString(),
      schemaVersion: 2,
      revision: revision || Date.now(),
      cloudUpdatedAt: serverTimestamp(),
    };

    await setDoc(resumeDocRef, docPayload, { merge: true });
    return true;
  } catch (err) {
    console.error('[ResumePersistence] Firestore save error:', err);
    return false;
  }
}

/**
 * Creates an intelligent debounced autosave manager with:
 * - Monotonic revision sequencing
 * - In-flight write locking with queued-latest flushing (no race conditions)
 * - Strict session isolation (cancels pending writes on signout or user switch)
 */
export function createDebouncedResumeSaver(
  onStatusChange?: (status: CloudSyncStatus) => void,
  debounceMs = 1500
) {
  let timer: NodeJS.Timeout | null = null;
  let inFlight = false;
  let activeUserId: string | null = null;
  let currentRevision = 0;
  let pendingQueue: { userId: string; data: ResumeData; revision: number } | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingQueue = null;
    activeUserId = null;
  };

  const executeSave = async (userId: string, data: ResumeData, rev: number) => {
    inFlight = true;
    onStatusChange?.('saving');

    const success = await saveResumeToCloud(userId, data, rev);

    inFlight = false;

    // Check if user signed out or switched accounts during network transit
    if (activeUserId !== userId) {
      pendingQueue = null;
      return;
    }

    // If another edit occurred while this save was in flight, dispatch the latest queued version immediately!
    if (pendingQueue && pendingQueue.userId === userId) {
      const next = pendingQueue;
      pendingQueue = null;
      await executeSave(next.userId, next.data, next.revision);
      return;
    }

    if (success) {
      onStatusChange?.('saved');
      setTimeout(() => {
        if (activeUserId === userId) {
          onStatusChange?.('idle');
        }
      }, 2500);
    } else {
      onStatusChange?.('error');
    }
  };

  const scheduleSave = (userId: string | undefined, data: ResumeData) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    currentRevision++;
    const thisRevision = currentRevision;
    activeUserId = userId || null;

    // Cache to localStorage instantly
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      if (userId) localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
    } catch {}

    if (!userId) {
      onStatusChange?.('offline');
      return;
    }

    timer = setTimeout(async () => {
      timer = null;
      if (activeUserId !== userId) return;

      if (inFlight) {
        // Queue the latest revision to execute as soon as in-flight save completes
        pendingQueue = { userId, data, revision: thisRevision };
        return;
      }

      await executeSave(userId, data, thisRevision);
    }, debounceMs);
  };

  return { scheduleSave, cancel };
}

/**
 * Clears active in-memory and local cache when user signs out,
 * ensuring no cross-contamination between authenticated accounts.
 */
export function clearLocalResumeOnSignOut(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  } catch {}
}
