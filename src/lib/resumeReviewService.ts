/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 4: Final Resume Review & Quality Assurance Service
 * Handles API calls to secure server-side AI review endpoint, combines
 * deterministic scores and checklist, manages Firestore & localStorage persistence,
 * and executes student-approved suggestion applications safely.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import { ResumeData } from '../types/resume.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';
import { ResumeRecommendationsData } from '../types/recommendations.ts';
import {
  FinalResumeReviewReport,
  ReviewGenerationInput,
  ReviewSuggestion,
  ReviewSuggestionStatus,
  ReviewStatus,
} from '../types/resumeReview.ts';
import {
  computeDeterministicReviewScores,
  computePreExportChecklist,
  computeResumeContentFingerprint,
} from './resumeReviewScorer.ts';

const STORAGE_KEY_PREFIX = 'profile_resume_review_';

/**
 * Computes the unified review status based on current report and resume state.
 */
export function determineReviewStatus(
  report: FinalResumeReviewReport | null,
  currentResumeData: ResumeData
): ReviewStatus {
  if (!report) return 'not-reviewed';

  const currentHash = computeResumeContentFingerprint(currentResumeData);
  const isOutdated = report.resumeContentHash !== currentHash;

  // If outdated, student needs to re-review or review is pending
  if (isOutdated) {
    return 'review-completed';
  }

  const checklist = computePreExportChecklist(currentResumeData, true);
  const pendingHigh = report.suggestions.filter(
    (s) => s.status === 'suggested' && s.priority === 'high'
  );

  if (!checklist.allCriticalPassed || pendingHigh.length > 0) {
    return 'improvements-available';
  }

  return 'ready-for-export';
}

/**
 * Runs the comprehensive review: deterministic mathematical scoring + server-side AI qualitative audit.
 */
export async function runResumeQualityReview(
  resumeId: string,
  userId: string | undefined,
  resumeData: ResumeData,
  setupData: ResumeSetupData | null,
  approvedRecs?: ResumeRecommendationsData | null
): Promise<FinalResumeReviewReport> {
  const targetRole = setupData?.targetRole?.title || resumeData.personalInfo?.professionalTitle || 'Software Engineer';
  const purpose = setupData?.purpose || 'fresher';
  const jobDescriptionText = setupData?.jobDescription?.text || '';
  const degree = setupData?.profileContext?.degree || resumeData.education?.[0]?.degree || '';
  const department = setupData?.profileContext?.major || resumeData.education?.[0]?.fieldOfStudy || '';

  // 1. Deterministic mathematical scores
  const scores = computeDeterministicReviewScores(resumeData, jobDescriptionText);

  // 2. Pre-export checklist
  const checklist = computePreExportChecklist(resumeData, true);

  // 3. Extract approved recommendations for context
  const approvedSkills = (approvedRecs?.technicalSkills || [])
    .filter((s) => s.status === 'approved' || s.status === 'applied')
    .map((s) => s.title);

  const reviewInput: ReviewGenerationInput = {
    resumeData,
    targetRole,
    purpose,
    jobDescriptionText: jobDescriptionText.trim().length >= 30 ? jobDescriptionText : undefined,
    degree,
    department,
    academicYear: setupData?.profileContext?.academicYear,
    approvedRecommendations: {
      technicalSkills: approvedSkills,
    },
  };

  // 4. Request server-side AI qualitative review
  const response = await fetch('/api/assistant/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reviewInput),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to conduct AI resume review.';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      errorMsg = `Server error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  const aiResult = await response.json();

  // Normalize suggestions
  const suggestions: ReviewSuggestion[] = (aiResult.suggestions || []).map(
    (s: Partial<ReviewSuggestion>, idx: number) => ({
      id: s.id || `sug_${Date.now()}_${idx}`,
      title: s.title || 'Suggested Improvement',
      whyItMatters: s.whyItMatters || 'Enhances clarity and recruiter impact.',
      evidence: s.evidence || '',
      recommendedImprovement: s.recommendedImprovement || '',
      expectedBenefit: s.expectedBenefit || 'Improves ATS parsing and recruiter readability.',
      priority: (s.priority as any) || 'medium',
      section: s.section || 'summary',
      targetItemId: s.targetItemId,
      category: (s.category as any) || 'content-quality',
      status: 'suggested' as ReviewSuggestionStatus,
      placeholdersUsed: s.placeholdersUsed || [],
      isFactualCheckRequired: Boolean(s.isFactualCheckRequired || (s.placeholdersUsed && s.placeholdersUsed.length > 0)),
    })
  );

  const reportId = `rev_${Date.now()}`;
  const contentHash = computeResumeContentFingerprint(resumeData);

  const finalReport: FinalResumeReviewReport = {
    id: reportId,
    userId,
    resumeId,
    resumeContentHash: contentHash,
    analyzedAt: new Date().toISOString(),
    targetRole,
    purpose,
    hasJobDescription: Boolean(jobDescriptionText && jobDescriptionText.trim().length >= 30),
    jobTitle: setupData?.jobDescription?.jobTitle,
    companyName: setupData?.jobDescription?.companyName,
    scores,
    contentQuality: aiResult.contentQuality || {
      summaryQuality: { rating: 'good', findings: ['Summary reviewed'] },
      projectDescriptions: { rating: 'good', findings: ['Project descriptions evaluated'] },
      actionVerbsQuality: { rating: 'good', findings: ['Action verbs checked'] },
      measurableOutcomes: { rating: 'good', findings: ['Outcomes checked'] },
      grammarAndClarity: { rating: 'good', findings: ['Clean layout'] },
    },
    roleSuitability: aiResult.roleSuitability || {
      technicalRelevance: { rating: 'good', notes: 'Skills align with candidate profile.' },
      projectRelevance: { rating: 'good', notes: 'Projects demonstrate core fundamentals.' },
      courseworkRelevance: { rating: 'good', notes: 'Standard undergraduate curriculum.' },
      experienceRelevance: { rating: 'good', notes: 'Appropriate for candidate experience level.' },
    },
    jdMatching: aiResult.jdMatching,
    completeness: aiResult.completeness || {
      hasContact: Boolean(resumeData.personalInfo?.fullName && resumeData.personalInfo?.email),
      hasSummary: Boolean(resumeData.personalInfo?.summary),
      hasEducation: (resumeData.education || []).length > 0,
      hasSkills: (resumeData.skills?.technical || []).length > 0 || (resumeData.skills?.soft || []).length > 0,
      hasProjects: (resumeData.projects || []).length > 0,
      hasExperience: (resumeData.experience || []).length > 0,
      hasCertifications: (resumeData.certifications || []).length > 0,
      hasAchievements: (resumeData.achievements || []).length > 0,
      hasCoursework: (resumeData.coursework || []).length > 0,
      isFresherAppropriate: purpose === 'fresher' || purpose === 'internship',
      notes: [],
    },
    atsReadability: aiResult.atsReadability || {
      standardHeadingsUsed: true,
      contactParsable: true,
      formattingRisk: 'low',
      overflowRisk: 'none',
      unresolvedPlaceholders: [],
      detectedSymbolsOrDecorations: [],
      notes: ['Clean single-column ATS readable layout'],
    },
    suggestions,
    preExportChecklist: checklist,
    reviewStatus: 'review-completed',
  };

  // Determine refined status
  finalReport.reviewStatus = determineReviewStatus(finalReport, resumeData);

  // 5. Persist report
  await saveResumeReviewReport(userId, finalReport);

  return finalReport;
}

/**
 * Persists the review report to Firestore and localStorage.
 */
export async function saveResumeReviewReport(
  userId: string | undefined,
  report: FinalResumeReviewReport
): Promise<void> {
  // Always cache locally for instant retrieval & offline resilience
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${report.resumeId}`, JSON.stringify(report));
  } catch (err) {
    console.warn('[ReviewService] LocalStorage save warning:', err);
  }

  // Persist to Firestore if authenticated & db is available
  if (db && userId) {
    try {
      const reviewDocRef = doc(db, 'users', userId, 'resumeReviews', report.resumeId);
      await setDoc(
        reviewDocRef,
        {
          ...report,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[ReviewService] Firestore sync error (using local cache):', err);
    }
  }
}

/**
 * Retrieves the latest saved review report for a resume.
 */
export async function getLatestResumeReview(
  userId: string | undefined,
  resumeId: string,
  currentResumeData?: ResumeData
): Promise<FinalResumeReviewReport | null> {
  let report: FinalResumeReviewReport | null = null;

  // 1. Try Firestore first if authenticated
  if (db && userId) {
    try {
      const reviewDocRef = doc(db, 'users', userId, 'resumeReviews', resumeId);
      const snap = await getDoc(reviewDocRef);
      if (snap.exists()) {
        report = snap.data() as FinalResumeReviewReport;
      }
    } catch (err) {
      console.warn('[ReviewService] Firestore read error, checking local storage:', err);
    }
  }

  // 2. Fallback to localStorage
  if (!report) {
    try {
      const localData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${resumeId}`);
      if (localData) {
        report = JSON.parse(localData) as FinalResumeReviewReport;
      }
    } catch (err) {
      console.warn('[ReviewService] LocalStorage read error:', err);
    }
  }

  if (report && currentResumeData) {
    const currentHash = computeResumeContentFingerprint(currentResumeData);
    report.isOutdated = report.resumeContentHash !== currentHash;
    report.preExportChecklist = computePreExportChecklist(currentResumeData, true);
    report.reviewStatus = determineReviewStatus(report, currentResumeData);
  }

  return report;
}

/**
 * Updates the status of an individual suggestion (e.g. applied, dismissed).
 */
export async function updateSuggestionStatus(
  userId: string | undefined,
  report: FinalResumeReviewReport,
  suggestionId: string,
  status: ReviewSuggestionStatus,
  editedImprovement?: string
): Promise<FinalResumeReviewReport> {
  const updatedSuggestions = report.suggestions.map((sug) => {
    if (sug.id === suggestionId) {
      return {
        ...sug,
        status,
        recommendedImprovement: editedImprovement !== undefined ? editedImprovement : sug.recommendedImprovement,
      };
    }
    return sug;
  });

  const updatedReport: FinalResumeReviewReport = {
    ...report,
    suggestions: updatedSuggestions,
  };

  await saveResumeReviewReport(userId, updatedReport);
  return updatedReport;
}

/**
 * Safely applies an approved suggestion to the active resume data without mutating the original.
 * Returns the modified ResumeData.
 */
export function applySuggestionToResume(
  currentResumeData: ResumeData,
  suggestion: ReviewSuggestion,
  confirmedText?: string
): ResumeData {
  const textToApply = (confirmedText ?? suggestion.recommendedImprovement).trim();
  if (!textToApply) return currentResumeData;

  const updated: ResumeData = JSON.parse(JSON.stringify(currentResumeData));
  const sec = suggestion.section.toLowerCase();

  switch (sec) {
    case 'summary':
    case 'profile':
    case 'objective': {
      if (!updated.personalInfo) updated.personalInfo = {} as any;
      updated.personalInfo.summary = textToApply;
      break;
    }

    case 'skills':
    case 'technical_skills':
    case 'technicalskills': {
      // If the improvement contains comma-separated skills or a skill title
      const newSkills = textToApply
        .split(/[,;\n]/)
        .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
        .filter((s) => s.length > 0 && !s.includes('['));

      if (!updated.skills) updated.skills = { technical: [], soft: [] };
      if (!updated.skills.technical) updated.skills.technical = [];
      const existingLower = new Set(updated.skills.technical.map((s: string) => s.toLowerCase()));
      for (const skill of newSkills) {
        if (!existingLower.has(skill.toLowerCase())) {
          updated.skills.technical.push(skill);
          existingLower.add(skill.toLowerCase());
        }
      }
      break;
    }

    case 'projects': {
      if (!updated.projects || updated.projects.length === 0) break;
      // Match by targetItemId or match by evidence in description
      let matchedIndex = -1;
      if (suggestion.targetItemId) {
        matchedIndex = updated.projects.findIndex((p) => p.id === suggestion.targetItemId);
      }
      if (matchedIndex === -1 && suggestion.evidence) {
        const evSnippet = suggestion.evidence.slice(0, 30).toLowerCase();
        matchedIndex = updated.projects.findIndex((p) =>
          (p.description || '').toLowerCase().includes(evSnippet) ||
          (p.bullets || []).some((h: string) => h.toLowerCase().includes(evSnippet))
        );
      }
      if (matchedIndex === -1) {
        matchedIndex = 0; // Default to top project
      }

      const proj = updated.projects[matchedIndex];
      // Check if textToApply has bullets
      const lines = textToApply
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
        .filter((l) => l.length > 0);

      if (lines.length > 1) {
        proj.bullets = lines;
        proj.description = lines.join(' ');
      } else {
        proj.description = textToApply;
        if (!proj.bullets || proj.bullets.length === 0) {
          proj.bullets = [textToApply];
        } else {
          // If evidence matched a specific bullet, replace that bullet
          let bulletReplaced = false;
          if (suggestion.evidence) {
            const evSnippet = suggestion.evidence.slice(0, 25).toLowerCase();
            const bIdx = proj.bullets.findIndex((h: string) => h.toLowerCase().includes(evSnippet));
            if (bIdx !== -1) {
              proj.bullets[bIdx] = textToApply;
              bulletReplaced = true;
            }
          }
          if (!bulletReplaced) {
            proj.bullets[0] = textToApply;
          }
        }
      }
      break;
    }

    case 'experience':
    case 'internships': {
      if (!updated.experience || updated.experience.length === 0) break;
      let matchedIndex = -1;
      if (suggestion.targetItemId) {
        matchedIndex = updated.experience.findIndex((e) => e.id === suggestion.targetItemId);
      }
      if (matchedIndex === -1 && suggestion.evidence) {
        const evSnippet = suggestion.evidence.slice(0, 30).toLowerCase();
        matchedIndex = updated.experience.findIndex((e) =>
          (e.description || '').toLowerCase().includes(evSnippet) ||
          (e.bullets || []).some((h: string) => h.toLowerCase().includes(evSnippet))
        );
      }
      if (matchedIndex === -1) {
        matchedIndex = 0;
      }

      const exp = updated.experience[matchedIndex];
      const lines = textToApply
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
        .filter((l) => l.length > 0);

      if (lines.length > 1) {
        exp.bullets = lines;
        exp.description = lines.join(' ');
      } else {
        exp.description = textToApply;
        if (!exp.bullets || exp.bullets.length === 0) {
          exp.bullets = [textToApply];
        } else {
          let bulletReplaced = false;
          if (suggestion.evidence) {
            const evSnippet = suggestion.evidence.slice(0, 25).toLowerCase();
            const bIdx = exp.bullets.findIndex((h: string) => h.toLowerCase().includes(evSnippet));
            if (bIdx !== -1) {
              exp.bullets[bIdx] = textToApply;
              bulletReplaced = true;
            }
          }
          if (!bulletReplaced) {
            exp.bullets[0] = textToApply;
          }
        }
      }
      break;
    }

    case 'achievements': {
      if (!updated.achievements) updated.achievements = [];
      const lines = textToApply
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
        .filter((l) => l.length > 0);

      if (lines.length > 0) {
        // If evidence matches an achievement, replace it; else append
        let replaced = false;
        if (suggestion.evidence) {
          const evSnippet = suggestion.evidence.slice(0, 25).toLowerCase();
          const idx = updated.achievements.findIndex((a) => a.toLowerCase().includes(evSnippet));
          if (idx !== -1) {
            updated.achievements[idx] = lines[0];
            replaced = true;
          }
        }
        if (!replaced) {
          updated.achievements.push(...lines);
        }
      }
      break;
    }

    default: {
      // If unclassified section, try checking personal summary or log
      if (updated.personalInfo && !updated.personalInfo.summary) {
        updated.personalInfo.summary = textToApply;
      }
      break;
    }
  }

  return updated;
}
