/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Dedicated ATS Analysis Persistence Service (P0 Fix)
 * Manages owner-scoped Firestore persistence under `users/{uid}/atsReports/{resumeId}`,
 * local storage caching, offline sync, content fingerprinting, and outdated-report detection.
 */

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import { ResumeData } from '../types/resume.ts';
import { FullAtsReport } from '../features/ats/types.ts';
import { computeResumeContentFingerprint } from './resumeReviewScorer.ts';

export const ATS_SCHEMA_VERSION = 1;
export const LOCAL_STORAGE_ATS_PREFIX = 'profile_ats_report_';

export interface AtsCategoryDelta {
  id: string;
  label: string;
  previousScore: number;
  currentScore: number;
  delta: number;
}

export interface AtsScoreComparison {
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  previousAnalyzedAt: string;
  previousResumeContentHash: string;
  categoryDeltas: AtsCategoryDelta[];
  newlyCoveredKeywords: string[];
  stillMissingKeywords: string[];
}

export interface HistoricalScanSummary {
  id: string;
  analyzedAt: string;
  overallScore: number;
  scoreLabel: string;
  resumeContentHash: string;
  mode: 'job-specific' | 'general-quality';
  jobTitle?: string;
}

export interface PersistedAtsRecord {
  id: string;
  resumeId: string;
  userId?: string;
  resumeContentHash: string; // Fingerprint of resume content at time of scan
  report: FullAtsReport;
  jobDescriptionText?: string;
  targetJobTitle?: string;
  targetCompany?: string;
  analyzedAt: string;
  updatedAt: string;
  schemaVersion: number;
  isOutdated?: boolean;
  previousReport?: FullAtsReport | null;
  previousAnalyzedAt?: string;
  previousResumeContentHash?: string;
  comparison?: AtsScoreComparison | null;
  scanHistory?: HistoricalScanSummary[];
}

/**
 * Calculates a transparent comparison between two ATS scans.
 */
export function calculateAtsComparison(
  previousReport: FullAtsReport,
  currentReport: FullAtsReport,
  previousHash: string,
  previousTime: string
): AtsScoreComparison {
  const previousScore = previousReport.overallScore;
  const currentScore = currentReport.overallScore;
  const scoreDelta = currentScore - previousScore;

  const categoryDeltas: AtsCategoryDelta[] = (currentReport.categories || []).map((cat) => {
    const oldCat = (previousReport.categories || []).find((c) => c.id === cat.id);
    const oldScore = oldCat ? oldCat.score : cat.score;
    return {
      id: cat.id,
      label: cat.label,
      previousScore: oldScore,
      currentScore: cat.score,
      delta: cat.score - oldScore,
    };
  });

  // Identify keywords that were missing previously but now present
  const oldMissingTerms = new Set<string>();
  (previousReport.missingKeywords || []).forEach((k) => oldMissingTerms.add(k.term.toLowerCase()));
  (previousReport.requiredSkillsMatch?.missing || []).forEach((s) => oldMissingTerms.add(s.toLowerCase()));

  const currentPresentTerms = new Set<string>();
  (currentReport.matchedKeywords || []).forEach((k) => currentPresentTerms.add(k.term.toLowerCase()));
  (currentReport.requiredSkillsMatch?.present || []).forEach((s) => currentPresentTerms.add(s.toLowerCase()));

  const newlyCoveredKeywords: string[] = [];
  oldMissingTerms.forEach((term) => {
    if (currentPresentTerms.has(term)) {
      // Find original casing if possible
      const originalCasing =
        currentReport.matchedKeywords?.find((k) => k.term.toLowerCase() === term)?.term ||
        currentReport.requiredSkillsMatch?.present?.find((s) => s.toLowerCase() === term) ||
        term;
      newlyCoveredKeywords.push(originalCasing);
    }
  });

  const stillMissingKeywords: string[] = (currentReport.missingKeywords || []).map((k) => k.term);

  return {
    previousScore,
    currentScore,
    scoreDelta,
    previousAnalyzedAt: previousTime,
    previousResumeContentHash: previousHash,
    categoryDeltas,
    newlyCoveredKeywords,
    stillMissingKeywords,
  };
}

/**
 * Generates the local storage cache key for a specific user and resume.
 */
export function getAtsLocalStorageKey(userId: string | undefined, resumeId: string): string {
  const uid = userId ? userId.trim() : 'anonymous';
  const rId = resumeId ? resumeId.trim() : 'default_resume';
  return `${LOCAL_STORAGE_ATS_PREFIX}${uid}_${rId}`;
}

/**
 * Saves an ATS evaluation report to both Firestore (if authenticated) and localStorage (offline cache).
 */
export async function saveAtsReport(
  userId: string | undefined,
  resumeId: string,
  report: FullAtsReport,
  currentResumeData: ResumeData,
  jdMeta?: {
    jobDescription?: string;
    targetJobTitle?: string;
    targetCompany?: string;
  },
  existingRecord?: PersistedAtsRecord | null
): Promise<PersistedAtsRecord> {
  const safeResumeId = resumeId || currentResumeData.id || 'default_resume';
  const contentHash = computeResumeContentFingerprint(currentResumeData);
  const nowIso = new Date().toISOString();

  // If existing record was not passed, attempt to read from local cache
  let prevRecord = existingRecord;
  if (!prevRecord) {
    try {
      const storageKey = getAtsLocalStorageKey(userId, safeResumeId);
      const cached = localStorage.getItem(storageKey);
      if (cached) prevRecord = JSON.parse(cached);
    } catch {}
  }

  let comparison: AtsScoreComparison | null = null;
  let previousReport: FullAtsReport | null = null;
  let previousAnalyzedAt: string | undefined = undefined;
  let previousResumeContentHash: string | undefined = undefined;
  let scanHistory: HistoricalScanSummary[] = prevRecord?.scanHistory || [];

  if (prevRecord && prevRecord.report) {
    // If previous scan was from an earlier time or different fingerprint, compute comparison
    if (prevRecord.report.id !== report.id || prevRecord.resumeContentHash !== contentHash) {
      previousReport = prevRecord.report;
      previousAnalyzedAt = prevRecord.analyzedAt;
      previousResumeContentHash = prevRecord.resumeContentHash;
      comparison = calculateAtsComparison(
        prevRecord.report,
        report,
        prevRecord.resumeContentHash,
        prevRecord.analyzedAt
      );

      // Append to scanHistory (limit to 10 latest)
      const historicalEntry: HistoricalScanSummary = {
        id: prevRecord.id,
        analyzedAt: prevRecord.analyzedAt,
        overallScore: prevRecord.report.overallScore,
        scoreLabel: prevRecord.report.scoreLabel,
        resumeContentHash: prevRecord.resumeContentHash,
        mode: prevRecord.report.mode,
        jobTitle: prevRecord.report.jobTitle,
      };
      scanHistory = [historicalEntry, ...scanHistory.filter((h) => h.id !== prevRecord!.id)].slice(0, 10);
    } else {
      // Keep existing comparison if re-saving same scan
      comparison = prevRecord.comparison || null;
      previousReport = prevRecord.previousReport || null;
      previousAnalyzedAt = prevRecord.previousAnalyzedAt;
      previousResumeContentHash = prevRecord.previousResumeContentHash;
    }
  }

  const record: PersistedAtsRecord = {
    id: report.id || `ats_${Date.now()}`,
    resumeId: safeResumeId,
    userId: userId || undefined,
    resumeContentHash: contentHash,
    report,
    jobDescriptionText: jdMeta?.jobDescription || '',
    targetJobTitle: jdMeta?.targetJobTitle || report.jobTitle || '',
    targetCompany: jdMeta?.targetCompany || report.company || '',
    analyzedAt: report.analyzedAt || nowIso,
    updatedAt: nowIso,
    schemaVersion: ATS_SCHEMA_VERSION,
    isOutdated: false,
    previousReport,
    previousAnalyzedAt,
    previousResumeContentHash,
    comparison,
    scanHistory,
  };

  // 1. Always save to local storage cache for offline reliability and immediate retrieval
  try {
    const storageKey = getAtsLocalStorageKey(userId, safeResumeId);
    localStorage.setItem(storageKey, JSON.stringify(record));
    // Also set fallback general key
    localStorage.setItem(`${LOCAL_STORAGE_ATS_PREFIX}latest`, JSON.stringify(record));
  } catch (storageErr) {
    console.warn('[atsPersistenceService] Failed to cache ATS report to localStorage:', storageErr);
  }

  // 2. Persist to Firestore if user is authenticated and DB is initialized
  if (userId && db) {
    try {
      // Primary document path in Firestore: users/{userId}/atsReports/{resumeId}
      const atsDocRef = doc(db, 'users', userId, 'atsReports', safeResumeId);
      await setDoc(
        atsDocRef,
        {
          ...record,
          firestoreUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (firestoreErr) {
      console.warn('[atsPersistenceService] Failed to persist ATS report to Firestore:', firestoreErr);
      // Offline fallback: Report is already safely written to localStorage
    }
  }

  return record;
}

/**
 * Retrieves the latest saved ATS report for a user's resume, checking both Firestore and localStorage.
 * Evaluates the resume fingerprint to accurately detect if the resume was modified since the scan.
 */
export async function getSavedAtsReport(
  userId: string | undefined,
  resumeId: string,
  currentResumeData?: ResumeData
): Promise<PersistedAtsRecord | null> {
  const safeResumeId = resumeId || (currentResumeData?.id) || 'default_resume';
  let record: PersistedAtsRecord | null = null;

  // 1. If online and authenticated, attempt to fetch from Firestore first
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (userId && db && isOnline) {
    try {
      const atsDocRef = doc(db, 'users', userId, 'atsReports', safeResumeId);
      const snapshot = await getDoc(atsDocRef);

      if (snapshot.exists()) {
        record = snapshot.data() as PersistedAtsRecord;
      }
    } catch (firestoreErr) {
      console.warn('[atsPersistenceService] Firestore lookup failed, falling back to local cache:', firestoreErr);
    }
  }

  // 2. Fall back to local storage cache if Firestore did not return a record
  if (!record) {
    try {
      const storageKey = getAtsLocalStorageKey(userId, safeResumeId);
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        record = JSON.parse(localData);
      } else {
        // Check latest fallback
        const latestData = localStorage.getItem(`${LOCAL_STORAGE_ATS_PREFIX}latest`);
        if (latestData) {
          const parsed = JSON.parse(latestData);
          if (parsed.resumeId === safeResumeId || !userId || parsed.userId === userId) {
            record = parsed;
          }
        }
      }
    } catch (storageErr) {
      console.warn('[atsPersistenceService] Failed to read ATS cache from localStorage:', storageErr);
    }
  }

  if (!record) {
    return null;
  }

  // 3. Fingerprint Verification: Detect if the current resume content was modified since the scan was performed
  if (currentResumeData) {
    const currentHash = computeResumeContentFingerprint(currentResumeData);
    record.isOutdated = record.resumeContentHash !== currentHash;
  }

  return record;
}

/**
 * Removes saved ATS report from Firestore and local storage.
 */
export async function clearSavedAtsReport(userId: string | undefined, resumeId: string): Promise<void> {
  const safeResumeId = resumeId || 'default_resume';

  try {
    const storageKey = getAtsLocalStorageKey(userId, safeResumeId);
    localStorage.removeItem(storageKey);
  } catch {}

  if (userId && db) {
    try {
      const atsDocRef = doc(db, 'users', userId, 'atsReports', safeResumeId);
      await deleteDoc(atsDocRef);
    } catch (err) {
      console.warn('[atsPersistenceService] Failed to delete ATS report from Firestore:', err);
    }
  }
}
