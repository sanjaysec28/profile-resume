/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Real ATS Analysis Engine Types
 */

import { ResumeData } from '../../types/resume.ts';

export type ResumeSourceType = 'profile-draft' | 'pdf' | 'docx' | 'text';

export interface ExtractedResumeText {
  rawText: string;
  sourceType: ResumeSourceType;
  fileName: string;
  pageCount: number;
  wordCount: number;
  hasSelectableText: boolean;
  isScanned: boolean;
  isOcrApplied: boolean;
  contact: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  sections: {
    hasContact: boolean;
    hasSummary: boolean;
    hasEducation: boolean;
    hasExperience: boolean;
    hasProjects: boolean;
    hasSkills: boolean;
    hasCertifications: boolean;
    detectedSectionHeaders: string[];
    missingStandardHeaders: string[];
  };
  extractedSkills: string[];
  extractedMetricsCount: number; // occurrences of %, $, numbers in achievements
  parsingWarnings: string[];
  parsingErrors: string[];
  originalResumeData?: ResumeData;
}

export interface ParsedJobDescription {
  rawText: string;
  jobTitle?: string;
  company?: string;
  isEntryLevel: boolean;
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  keyResponsibilities: string[];
  experienceYearsMin?: number;
  hasIdentifiableRequirements: boolean;
  hasIdentifiablePreferred: boolean;
}

export interface AtsDetailedCategoryScore {
  id: string;
  label: string;
  score: number; // 0 - 100 percentage
  weight: number; // decimal e.g. 0.35
  earnedPoints: number; // score * weight
  maxPoints: number; // 100 * weight
  status: 'passed' | 'warning' | 'failed';
  details: string;
  evidence: string[];
  suggestions: string[];
}

export interface AtsKeywordItem {
  term: string;
  count: number;
  category: 'required-skill' | 'preferred-skill' | 'domain-tech' | 'soft-skill' | 'action-verb';
  contextSnippet?: string;
}

export interface AtsMissingKeywordItem {
  term: string;
  category: 'required-skill' | 'preferred-skill' | 'domain-tech' | 'action-verb';
  importance: 'high' | 'medium' | 'low';
  whyItMatters: string;
}

export interface AtsCompatibilityWarning {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export interface AtsActionItem {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  completed?: boolean;
}

export interface FullAtsReport {
  id: string;
  analyzedAt: string;
  mode: 'job-specific' | 'general-quality';
  overallScore: number; // 0 - 100
  scoreLabel: string;
  scoreExplanation: string;
  jobTitle?: string;
  company?: string;
  sourceType: ResumeSourceType;
  fileName?: string;
  categories: AtsDetailedCategoryScore[];
  requiredSkillsMatch: {
    present: string[];
    missing: string[];
    percentage: number;
  };
  preferredSkillsMatch: {
    present: string[];
    missing: string[];
    percentage: number;
  };
  matchedKeywords: AtsKeywordItem[];
  missingKeywords: AtsMissingKeywordItem[];
  strengths: string[];
  weaknesses: string[];
  compatibilityWarnings: AtsCompatibilityWarning[];
  actionChecklist: AtsActionItem[];
  summary: {
    whyThisScore: string;
    strongestQualifications: string[];
    topMissingRequirements: string[];
    topNextSteps: string[];
  };
  disclaimer: string;
}
