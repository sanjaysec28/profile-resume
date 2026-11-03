/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Placement Intelligence Service
 * Handles Firestore & LocalStorage persistence, application tracker CRUD,
 * analytics calculation, and AI application draft assistance.
 */

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  VerifiedJobOpportunity,
  ApplicationRecord,
  ApplicationDraft,
  ApplicationStatus,
  PlacementAnalytics,
} from '../types/placementIntelligence.ts';
import { VERIFIED_JOB_OPPORTUNITIES } from './verifiedJobCatalog.ts';

const SAVED_JOBS_LOCAL_STORAGE_PREFIX = 'profile_saved_jobs_';
const APPLICATIONS_LOCAL_STORAGE_PREFIX = 'profile_applications_';
const DRAFTS_LOCAL_STORAGE_PREFIX = 'profile_app_drafts_';

/**
 * Loads saved job opportunities.
 */
export async function loadSavedJobs(userId: string | undefined): Promise<VerifiedJobOpportunity[]> {
  const key = `${SAVED_JOBS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localJobs: VerifiedJobOpportunity[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) localJobs = JSON.parse(raw);
  } catch {}

  if (userId && db) {
    try {
      const colRef = collection(db, 'users', userId, 'savedJobs');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const firestoreJobs = snap.docs.map((d) => d.data() as VerifiedJobOpportunity);
        const jobMap = new Map<string, VerifiedJobOpportunity>();
        firestoreJobs.forEach((j) => jobMap.set(j.id, j));
        localJobs.forEach((j) => {
          if (!jobMap.has(j.id)) jobMap.set(j.id, j);
        });
        return Array.from(jobMap.values());
      }
    } catch (err) {
      console.warn('[PlacementService] Firestore loadSavedJobs error, using local:', err);
    }
  }

  return localJobs;
}

/**
 * Saves a job opportunity to saved collection.
 */
export async function saveJobOpportunity(
  userId: string | undefined,
  job: VerifiedJobOpportunity
): Promise<void> {
  const key = `${SAVED_JOBS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    const existing: VerifiedJobOpportunity[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((j) => j.id !== job.id);
    filtered.unshift(job);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'savedJobs', job.id);
      await setDoc(docRef, { ...job, savedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('[PlacementService] Firestore saveJobOpportunity error:', err);
    }
  }
}

/**
 * Removes a job opportunity from saved collection.
 */
export async function removeSavedJob(
  userId: string | undefined,
  jobId: string
): Promise<void> {
  const key = `${SAVED_JOBS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const existing: VerifiedJobOpportunity[] = JSON.parse(raw);
      localStorage.setItem(key, JSON.stringify(existing.filter((j) => j.id !== jobId)));
    }
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'savedJobs', jobId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[PlacementService] Firestore removeSavedJob error:', err);
    }
  }
}

/**
 * Loads all applications tracked by student.
 */
export async function loadApplications(userId: string | undefined): Promise<ApplicationRecord[]> {
  const key = `${APPLICATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localApps: ApplicationRecord[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) localApps = JSON.parse(raw);
  } catch {}

  if (userId && db) {
    try {
      const colRef = collection(db, 'users', userId, 'applications');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreApps = snap.docs.map((d) => d.data() as ApplicationRecord);
        const appMap = new Map<string, ApplicationRecord>();
        firestoreApps.forEach((a) => appMap.set(a.id, a));
        localApps.forEach((a) => {
          if (!appMap.has(a.id)) appMap.set(a.id, a);
        });
        return Array.from(appMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    } catch (err) {
      console.warn('[PlacementService] Firestore loadApplications error, using local:', err);
    }
  }

  return localApps;
}

/**
 * Saves or updates an application record.
 */
export async function saveApplication(
  userId: string | undefined,
  appRecord: ApplicationRecord
): Promise<void> {
  const key = `${APPLICATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  const now = new Date().toISOString();
  const recordWithDates: ApplicationRecord = {
    ...appRecord,
    updatedAt: now,
    createdAt: appRecord.createdAt || now,
  };

  try {
    const raw = localStorage.getItem(key);
    const existing: ApplicationRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((a) => a.id !== recordWithDates.id);
    filtered.unshift(recordWithDates);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'applications', recordWithDates.id);
      await setDoc(docRef, recordWithDates);
    } catch (err) {
      console.warn('[PlacementService] Firestore saveApplication error:', err);
    }
  }
}

/**
 * Deletes an application record.
 */
export async function deleteApplication(
  userId: string | undefined,
  appId: string
): Promise<void> {
  const key = `${APPLICATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const existing: ApplicationRecord[] = JSON.parse(raw);
      localStorage.setItem(key, JSON.stringify(existing.filter((a) => a.id !== appId)));
    }
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'applications', appId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[PlacementService] Firestore deleteApplication error:', err);
    }
  }
}

/**
 * Updates application status, notes, and dates.
 */
export async function updateApplicationStatus(
  userId: string | undefined,
  applicationId: string,
  newStatus: ApplicationStatus,
  updates?: {
    notes?: string;
    nextFollowUpDate?: string;
    interviewDate?: string;
    appliedDate?: string;
  }
): Promise<ApplicationRecord | null> {
  const apps = await loadApplications(userId);
  const target = apps.find((a) => a.id === applicationId);
  if (!target) return null;

  const updated: ApplicationRecord = {
    ...target,
    status: newStatus,
    appliedDate:
      newStatus === 'applied' && !target.appliedDate
        ? new Date().toISOString().split('T')[0]
        : updates?.appliedDate ?? target.appliedDate,
    notes: updates?.notes !== undefined ? updates.notes : target.notes,
    nextFollowUpDate:
      updates?.nextFollowUpDate !== undefined ? updates.nextFollowUpDate : target.nextFollowUpDate,
    interviewDate:
      updates?.interviewDate !== undefined ? updates.interviewDate : target.interviewDate,
    updatedAt: new Date().toISOString(),
  };

  await saveApplication(userId, updated);
  return updated;
}

/**
 * Saves application draft generated by AI assistant.
 */
export async function saveApplicationDraft(
  userId: string | undefined,
  draft: ApplicationDraft
): Promise<void> {
  const key = `${DRAFTS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    const existing: ApplicationDraft[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((d) => d.id !== draft.id);
    filtered.unshift(draft);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'applicationDrafts', draft.id);
      await setDoc(docRef, draft);
    } catch (err) {
      console.warn('[PlacementService] Firestore saveApplicationDraft error:', err);
    }
  }
}

/**
 * Loads application draft for a given job.
 */
export async function loadApplicationDraft(
  userId: string | undefined,
  jobId: string
): Promise<ApplicationDraft | null> {
  const key = `${DRAFTS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const drafts: ApplicationDraft[] = JSON.parse(raw);
      const match = drafts.find((d) => d.jobId === jobId);
      if (match) return match;
    }
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'applicationDrafts', `draft_${jobId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as ApplicationDraft;
    } catch {}
  }

  return null;
}

/**
 * Calls server API to generate tailored application materials.
 */
export async function requestApplicationDraft(
  job: VerifiedJobOpportunity,
  studentContext: {
    studentName?: string;
    targetRole: string;
    degree: string;
    major: string;
    academicYear: string;
    graduationYear: string;
    collegeOrUniversity?: string;
    verifiedSkills: string[];
    projects: {
      title: string;
      techStack: string[];
      description: string;
      bullets?: string[];
    }[];
  }
): Promise<ApplicationDraft> {
  const response = await fetch('/api/placement/generate-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job, studentContext }),
  });

  if (!response.ok) {
    let msg = 'Failed to generate tailored application draft.';
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const draftContent = data.draft;

  return {
    id: `draft_${job.id}`,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    ...draftContent,
    generatedAt: new Date().toISOString(),
    isApprovedByStudent: false,
  };
}

/**
 * Computes Placement Analytics mathematically from genuine student records.
 */
export function calculatePlacementAnalytics(
  applications: ApplicationRecord[],
  savedJobs: VerifiedJobOpportunity[]
): PlacementAnalytics {
  const statusDistribution: Record<ApplicationStatus, number> = {
    saved: 0,
    preparing: 0,
    applied: 0,
    assessment: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };

  applications.forEach((a) => {
    if (statusDistribution[a.status] !== undefined) {
      statusDistribution[a.status]++;
    }
  });

  const activeCount =
    statusDistribution.preparing +
    statusDistribution.applied +
    statusDistribution.assessment +
    statusDistribution.interview;

  const now = new Date();
  const upcomingFollowUps = applications.filter((a) => {
    if (!a.nextFollowUpDate) return false;
    const d = new Date(a.nextFollowUpDate);
    return !isNaN(d.getTime()) && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const upcomingInterviews = applications.filter((a) => {
    if (!a.interviewDate) return false;
    const d = new Date(a.interviewDate);
    return !isNaN(d.getTime()) && d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  return {
    totalOpportunitiesSaved: savedJobs.length,
    totalApplications: applications.length,
    activeApplicationsCount: activeCount,
    interviewsScheduledCount: statusDistribution.interview,
    offersReceivedCount: statusDistribution.offer,
    rejectedCount: statusDistribution.rejected,
    withdrawnCount: statusDistribution.withdrawn,
    statusDistribution,
    upcomingFollowUps: upcomingFollowUps.sort(
      (a, b) => new Date(a.nextFollowUpDate!).getTime() - new Date(b.nextFollowUpDate!).getTime()
    ),
    upcomingInterviews: upcomingInterviews.sort(
      (a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime()
    ),
  };
}
