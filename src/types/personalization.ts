/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.2: Student Personalization & Context Intelligence Data Contracts
 * Centralized schema for persistent student goals, progress event detection,
 * unified intelligence aggregation, and personalized recommendation models.
 */

export interface PersonalizationPreferences {
  enablePersonalizedRecommendations: boolean;
  shareGoalsWithAiAssistant: boolean;
  notifyProgressMilestones: boolean;
}

export interface StudentCareerGoals {
  primaryCareerGoal: string;
  targetRole: string;
  preferredIndustries: string[];
  preferredLocations: string[];
  workPreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  shortTermLearningGoals: string[];
  placementPrepGoals: string[];
  targetCompletionDate: string;
  preferences: PersonalizationPreferences;
  updatedAt: string;
}

export type ProgressEventType =
  | 'project_added'
  | 'skill_verified'
  | 'milestone_completed'
  | 'ats_scan_completed'
  | 'mock_interview_completed'
  | 'application_stage_changed';

export interface ProgressEvent {
  id: string;
  type: ProgressEventType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StudentIntelligenceProfile {
  academic: {
    degree: string;
    major: string;
    graduationYear: string;
    academicYear?: string;
    gpa?: string;
    collegeOrUniversity: string;
  };
  verifiedSkills: {
    technical: string[];
    soft: string[];
  };
  projects: {
    title: string;
    techStack: string[];
    hasMetrics: boolean;
    repoUrl?: string;
  }[];
  resume: {
    completenessScore: number;
    lastSaved?: string;
    summaryPresent: boolean;
    sectionsCount: number;
  };
  ats: {
    latestScore?: number;
    topMissingKeywords?: string[];
    scanCount: number;
    lastScannedDate?: string;
  };
  pipeline: {
    totalApplications: number;
    inProgress: number;
    interviews: number;
    offers: number;
    upcomingDeadlinesCount: number;
  };
  roadmap: {
    totalMilestones: number;
    completedCount: number;
    currentFocus?: string;
    readinessScores?: Record<string, number>;
  };
  interview: {
    completedSessions: number;
    averageScore?: number;
    recentCategory?: string;
    topIdentifiedGaps?: string[];
  };
  goals: StudentCareerGoals;
  recentEvents: ProgressEvent[];
  contradictionsOrGaps: string[];
  generatedAt: string;
}

export interface PersonalizedRecommendation {
  id: string;
  category: 'resume' | 'ats' | 'job' | 'skill' | 'roadmap' | 'interview' | 'application';
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  actionType?: string;
  actionPayload?: Record<string, any>;
}

export const DEFAULT_CAREER_GOALS: StudentCareerGoals = {
  primaryCareerGoal: 'Secure a full-time software engineering role at a product-focused company',
  targetRole: 'Full Stack Engineer',
  preferredIndustries: ['Software & Internet', 'Fintech', 'Cloud Infrastructure'],
  preferredLocations: ['Bengaluru', 'Hyderabad', 'Remote'],
  workPreference: 'any',
  shortTermLearningGoals: [
    'Deepen relational database indexing and query tuning in PostgreSQL',
    'Build and deploy a containerized microservice project with Docker',
  ],
  placementPrepGoals: [
    'Complete at least 5 technical and behavioral mock interview sessions',
    'Achieve >=80% ATS compatibility for campus placement opportunities',
  ],
  targetCompletionDate: '2026-07-01',
  preferences: {
    enablePersonalizedRecommendations: true,
    shareGoalsWithAiAssistant: true,
    notifyProgressMilestones: true,
  },
  updatedAt: new Date().toISOString(),
};
