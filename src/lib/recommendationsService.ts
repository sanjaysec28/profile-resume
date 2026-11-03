/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Client-Side AI Recommendations Service
 * Handles API communication with server-side Gemini endpoint,
 * Firestore persistence under users/{userId}/resumeSetups/{setupId},
 * approval state management, and applying approved items to resume draft.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  ResumeRecommendationsData,
  RecommendationsGenerationInput,
  TechnicalSkillRecommendation,
  SoftSkillRecommendation,
} from '../types/recommendations.ts';
import { ResumeData } from '../types/resume.ts';

const STORAGE_PREFIX = 'profile_recs_';

/**
 * Calls the secure server-side proxy route to generate Gemini AI recommendations.
 */
export async function fetchAIRecommendations(
  setupId: string,
  userId: string | undefined,
  input: RecommendationsGenerationInput
): Promise<ResumeRecommendationsData> {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to generate recommendations.';
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorDetail = errorJson.error;
      }
    } catch {
      errorDetail = `Server responded with status ${response.status} (${response.statusText})`;
    }
    throw new Error(errorDetail);
  }

  const generated = await response.json();

  // Mark items as already present if they match student's existing resume
  const existingTechLower = new Set(
    (input.existingSkills?.technical || []).map((s) => s.trim().toLowerCase())
  );
  const existingSoftLower = new Set(
    (input.existingSkills?.soft || []).map((s) => s.trim().toLowerCase())
  );

  const technicalSkills: TechnicalSkillRecommendation[] = (generated.technicalSkills || []).map(
    (ts: TechnicalSkillRecommendation) => ({
      ...ts,
      isAlreadyPresent: existingTechLower.has(ts.title.trim().toLowerCase()),
      status: existingTechLower.has(ts.title.trim().toLowerCase()) ? 'applied' : 'suggested',
    })
  );

  const softSkills: SoftSkillRecommendation[] = (generated.softSkills || []).map(
    (ss: SoftSkillRecommendation) => ({
      ...ss,
      isAlreadyPresent: existingSoftLower.has(ss.title.trim().toLowerCase()),
      status: existingSoftLower.has(ss.title.trim().toLowerCase()) ? 'applied' : 'suggested',
    })
  );

  const fullData: ResumeRecommendationsData = {
    id: `recs_${Date.now()}`,
    setupId,
    userId,
    targetRole: generated.targetRole || input.targetRole,
    purpose: generated.purpose || input.purpose,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceJobDescriptionProvided: Boolean(generated.sourceJobDescriptionProvided),
    summaryRationale: generated.summaryRationale || '',
    technicalSkills,
    softSkills,
    sections: generated.sections || [],
    existingProjectAdvice: generated.existingProjectAdvice || [],
    suggestedProjectIdeas: generated.suggestedProjectIdeas || [],
    keywords: generated.keywords || [],
    certifications: generated.certifications || [],
  };

  // Cache locally
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${setupId}`, JSON.stringify(fullData));
  } catch {}

  // Save to Firestore if authenticated
  if (db && userId && setupId) {
    try {
      const recDocRef = doc(db, 'users', userId, 'resumeSetups', setupId);
      await setDoc(
        recDocRef,
        {
          recommendations: fullData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Recommendations] Firestore save failed (cached locally):', err);
    }
  }

  return fullData;
}

/**
 * Saves updated recommendations (e.g. approvals, dismissals, edits) to Firestore and localStorage.
 */
export async function saveRecommendationsState(
  recommendations: ResumeRecommendationsData
): Promise<void> {
  const updated = {
    ...recommendations,
    updatedAt: new Date().toISOString(),
  };

  // 1. LocalStorage Cache
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${updated.setupId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Recommendations] LocalStorage write failed:', err);
  }

  // 2. Cloud Firestore
  if (db && updated.userId && updated.setupId) {
    try {
      const recDocRef = doc(db, 'users', updated.userId, 'resumeSetups', updated.setupId);
      await setDoc(
        recDocRef,
        {
          recommendations: updated,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Recommendations] Firestore sync failed:', err);
    }
  }
}

/**
 * Loads cached recommendations from localStorage or Firestore.
 */
export async function getCachedRecommendations(
  setupId: string,
  userId?: string
): Promise<ResumeRecommendationsData | null> {
  // Try localStorage first
  try {
    const cached = localStorage.getItem(`${STORAGE_PREFIX}${setupId}`);
    if (cached) {
      return JSON.parse(cached) as ResumeRecommendationsData;
    }
  } catch {}

  // Try Firestore
  if (db && userId && setupId) {
    try {
      const docRef = doc(db, 'users', userId, 'resumeSetups', setupId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.recommendations) {
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${setupId}`, JSON.stringify(data.recommendations));
          } catch {}
          return data.recommendations as ResumeRecommendationsData;
        }
      }
    } catch (err) {
      console.warn('[Recommendations] Firestore fetch failed:', err);
    }
  }

  return null;
}

/**
 * Applies approved recommendations (skills, etc.) into the active ResumeData.
 * Does not duplicate already existing skills.
 */
export function applyApprovedRecommendationsToResume(
  currentResume: ResumeData,
  recommendations: ResumeRecommendationsData
): {
  updatedResume: ResumeData;
  updatedRecommendations: ResumeRecommendationsData;
  addedSkillsCount: number;
} {
  const approvedTech = recommendations.technicalSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  );
  const approvedSoft = recommendations.softSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  );

  const existingTechSet = new Set(
    (currentResume.skills?.technical || []).map((s) => s.trim().toLowerCase())
  );
  const existingSoftSet = new Set(
    (currentResume.skills?.soft || []).map((s) => s.trim().toLowerCase())
  );

  const newTechList = [...(currentResume.skills?.technical || [])];
  let addedTech = 0;
  for (const s of approvedTech) {
    if (!existingTechSet.has(s.title.trim().toLowerCase())) {
      newTechList.push(s.title.trim());
      existingTechSet.add(s.title.trim().toLowerCase());
      addedTech++;
    }
  }

  const newSoftList = [...(currentResume.skills?.soft || [])];
  let addedSoft = 0;
  for (const s of approvedSoft) {
    if (!existingSoftSet.has(s.title.trim().toLowerCase())) {
      newSoftList.push(s.title.trim());
      existingSoftSet.add(s.title.trim().toLowerCase());
      addedSoft++;
    }
  }

  const updatedResume: ResumeData = {
    ...currentResume,
    skills: {
      ...currentResume.skills,
      technical: newTechList,
      soft: newSoftList,
    },
  };

  // Mark applied items as 'applied'
  const updatedRecommendations: ResumeRecommendationsData = {
    ...recommendations,
    technicalSkills: recommendations.technicalSkills.map((s) =>
      s.status === 'approved' ? { ...s, status: 'applied', isAlreadyPresent: true } : s
    ),
    softSkills: recommendations.softSkills.map((s) =>
      s.status === 'approved' ? { ...s, status: 'applied', isAlreadyPresent: true } : s
    ),
  };

  return {
    updatedResume,
    updatedRecommendations,
    addedSkillsCount: addedTech + addedSoft,
  };
}
