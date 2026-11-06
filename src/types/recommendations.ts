/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Recommendations Data Models (Phase 2)
 * Strongly typed structures for technical & soft skills, section organization,
 * project evaluations, unverified project ideas, JD keyword matching, and certifications.
 */

export type RecommendationStatus = 'suggested' | 'approved' | 'dismissed' | 'applied';
export type RecommendationImportance = 'essential' | 'high' | 'recommended' | 'optional';
export type SkillProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface BaseRecommendation {
  id: string;
  title: string;
  importance: RecommendationImportance;
  explanation: string;
  whyItMatters: string;
  status: RecommendationStatus;
  isAlreadyPresent?: boolean;
  notes?: string;
}

export interface TechnicalSkillRecommendation extends BaseRecommendation {
  category: 'essential' | 'supporting' | 'beginner';
  proficiencyLevel: SkillProficiencyLevel;
  relatedTechStack?: string[];
}

export interface SoftSkillRecommendation extends BaseRecommendation {
  demonstrationContext: string; // e.g. "Highlight in team hackathons or coursework project management"
}

export interface SectionRecommendation extends BaseRecommendation {
  sectionKey: 'education' | 'projects' | 'experience' | 'skills' | 'certifications' | 'coursework' | 'achievements';
  suggestedOrder: number;
  isOptional: boolean;
  contentTips: string;
}

export interface ExistingProjectRecommendation extends BaseRecommendation {
  existingProjectId: string;
  relevanceScore: number; // 0-100
  bulletImprovementTips: string[];
}

export interface ProjectIdeaRecommendation extends BaseRecommendation {
  techStack: string[];
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  sampleDeliverables: string[];
  disclaimer: string; // "Suggested idea for future build; do not mark as completed until built"
}

export interface KeywordRecommendation extends BaseRecommendation {
  keyword: string;
  frequencyInJD?: number;
  isMatchedInResume: boolean;
  suggestedSection: 'summary' | 'skills' | 'projects' | 'experience';
  placementExample: string;
}

export interface CertificationRecommendation extends BaseRecommendation {
  issuingOrganization: string;
  credibilityLevel: 'Industry Standard' | 'Foundational' | 'Academic';
  isCompletedByStudent: boolean; // Must always default to false unless student verifies
}

export interface ResumeRecommendationsData {
  id: string;
  setupId: string;
  userId?: string;
  targetRole: string;
  purpose: string;
  createdAt: string;
  updatedAt: string;
  sourceJobDescriptionProvided: boolean;
  summaryRationale: string;
  technicalSkills: TechnicalSkillRecommendation[];
  softSkills: SoftSkillRecommendation[];
  sections: SectionRecommendation[];
  existingProjectAdvice: ExistingProjectRecommendation[];
  suggestedProjectIdeas: ProjectIdeaRecommendation[];
  keywords: KeywordRecommendation[];
  certifications: CertificationRecommendation[];
  modelUsed?: string;
  generationSource?: 'gemini' | 'structured-fallback';
  isAiGenerated?: boolean;
}

export interface RecommendationsGenerationInput {
  targetRole: string;
  purpose: string;
  jobDescriptionText?: string;
  department: string;
  degree: string;
  academicYear: string;
  graduationYear: string;
  existingSkills: {
    technical: string[];
    soft: string[];
  };
  existingProjects: Array<{
    id: string;
    title: string;
    techStack: string[];
    description: string;
  }>;
  existingExperience: Array<{
    company: string;
    position: string;
    description?: string;
  }>;
  existingEducation: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
  }>;
}
