/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 4: Final Resume Review & Quality Assurance Types
 * Complete contracts for deterministic scores, qualitative findings,
 * actionable suggestions, and pre-export checklist.
 */

export type ReviewStatus =
  | 'not-reviewed'
  | 'review-completed'
  | 'improvements-available'
  | 'ready-for-export';

export type ReviewCategory =
  | 'content-quality'
  | 'target-role-suitability'
  | 'job-description-matching'
  | 'resume-completeness'
  | 'ats-readability';

export type ReviewIssuePriority = 'high' | 'medium' | 'low';

export type ReviewSuggestionStatus = 'suggested' | 'applied' | 'dismissed';

export interface ReviewSuggestion {
  id: string;
  title: string;
  whyItMatters: string;
  evidence: string; // Quoted evidence from actual resume
  recommendedImprovement: string; // The improved content ready to apply
  expectedBenefit: string;
  priority: ReviewIssuePriority;
  section: string; // e.g. 'summary', 'projects', 'experience', 'technical_skills', 'education', 'certifications', 'achievements', 'positions_of_responsibility', 'coursework'
  targetItemId?: string; // Specific project ID or experience ID if applicable
  category: ReviewCategory;
  status: ReviewSuggestionStatus;
  placeholdersUsed: string[]; // e.g. ['[X%]', '[N]']
  isFactualCheckRequired: boolean;
}

export interface PreExportChecklistItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  isCritical: boolean; // Non-critical allows proceeding with warning
  actionTip?: string;
  actionStepId?: number; // Step number in ResumeBuilder to jump to for fixing
}

export interface PreExportChecklist {
  items: PreExportChecklistItem[];
  allCriticalPassed: boolean;
  warningCount: number;
}

export interface ScoreFactor {
  factor: string;
  score: number;
  max: number;
  status: 'passed' | 'warning' | 'failed';
  note: string;
}

export interface ScoresBreakdown {
  generalQualityScore: number; // 0 - 100
  generalQualityFactors: ScoreFactor[];
  jobMatchScore: number | null; // 0 - 100 (null if no JD)
  jobMatchFactors?: ScoreFactor[];
  atsReadabilityScore: number; // 0 - 100
  atsReadabilityFactors: ScoreFactor[];
  overallScore: number; // 0 - 100
  scoreLabel: string; // e.g. "Excellent", "Competitive", "Needs Polish"
  calculationBasis: string;
}

export interface FinalResumeReviewReport {
  id: string;
  userId?: string;
  resumeId: string;
  resumeContentHash: string; // Content fingerprint to detect outdated reviews
  analyzedAt: string;
  targetRole: string;
  purpose: string;
  hasJobDescription: boolean;
  jobTitle?: string;
  companyName?: string;
  scores: ScoresBreakdown;
  contentQuality: {
    summaryQuality: { rating: 'strong' | 'good' | 'needs-work'; findings: string[] };
    projectDescriptions: { rating: 'strong' | 'good' | 'needs-work'; findings: string[] };
    actionVerbsQuality: { rating: 'strong' | 'good' | 'needs-work'; findings: string[] };
    measurableOutcomes: { rating: 'strong' | 'good' | 'needs-work'; findings: string[] };
    grammarAndClarity: { rating: 'strong' | 'good' | 'needs-work'; findings: string[] };
  };
  roleSuitability: {
    technicalRelevance: { rating: 'strong' | 'good' | 'needs-work'; notes: string };
    projectRelevance: { rating: 'strong' | 'good' | 'needs-work'; notes: string };
    courseworkRelevance: { rating: 'strong' | 'good' | 'needs-work'; notes: string };
    experienceRelevance: { rating: 'strong' | 'good' | 'needs-work'; notes: string };
  };
  jdMatching?: {
    matchingRequiredSkills: string[];
    missingRequiredSkills: string[];
    matchingPreferredSkills: string[];
    matchingKeywords: string[];
    missingKeywords: string[];
    highlightedEvidence: string[];
  };
  completeness: {
    hasContact: boolean;
    hasSummary: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
    hasProjects: boolean;
    hasExperience: boolean;
    hasCertifications: boolean;
    hasAchievements: boolean;
    hasCoursework: boolean;
    isFresherAppropriate: boolean;
    notes: string[];
  };
  atsReadability: {
    standardHeadingsUsed: boolean;
    contactParsable: boolean;
    formattingRisk: 'low' | 'moderate' | 'high';
    overflowRisk: 'none' | 'potential-overflow';
    unresolvedPlaceholders: string[];
    detectedSymbolsOrDecorations: string[];
    notes: string[];
  };
  suggestions: ReviewSuggestion[];
  preExportChecklist: PreExportChecklist;
  reviewStatus: ReviewStatus;
  isOutdated?: boolean;
}

export interface ReviewGenerationInput {
  resumeData: any;
  targetRole: string;
  purpose: string;
  jobDescriptionText?: string;
  degree?: string;
  department?: string;
  academicYear?: string;
  approvedRecommendations?: {
    technicalSkills?: string[];
    softSkills?: string[];
    keywords?: string[];
  };
}
