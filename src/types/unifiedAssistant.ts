/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.1: Unified AI Assistant & Cross-Module Intelligence Types
 * Centralized data contracts for context-aware conversations, cross-module actions,
 * conversation management, and student approval safeguards.
 */

export type ActiveAppModule =
  | 'dashboard'
  | 'resume_builder'
  | 'ats_checker'
  | 'resume_review'
  | 'career_roadmap'
  | 'job_discovery'
  | 'application_tracker'
  | 'interview_prep';

export interface ModuleContextPayload {
  activeModule: ActiveAppModule;
  targetRole?: string;
  // Module-specific lightweight snapshots
  resumeSnapshot?: {
    fullName?: string;
    professionalTitle?: string;
    sectionsCount?: number;
    topTechnicalSkills?: string[];
    topProjectTitles?: string[];
    summaryPreview?: string;
  };
  atsSnapshot?: {
    overallScore?: number;
    matchedKeywordsCount?: number;
    missingKeywords?: string[];
    topCriticalIssues?: string[];
  };
  roadmapSnapshot?: {
    totalMilestones?: number;
    completedMilestones?: number;
    inProgressTitle?: string;
  };
  jobSnapshot?: {
    jobId?: string;
    title?: string;
    company?: string;
    matchScore?: number;
    eligibilityStatus?: string;
    deadline?: string;
  };
  applicationSnapshot?: {
    applicationId?: string;
    company?: string;
    role?: string;
    currentStage?: string;
    nextFollowUpDate?: string;
  };
  interviewSnapshot?: {
    completedSessionsCount?: number;
    averageScore?: number;
    lastCategory?: string;
    topGaps?: string[];
  };
  studentGoalsSnapshot?: {
    primaryCareerGoal?: string;
    targetRole?: string;
    preferredIndustries?: string[];
    preferredLocations?: string[];
    workPreference?: string;
    targetCompletionDate?: string;
    shortTermLearningGoals?: string[];
    placementPrepGoals?: string[];
  };
  recentProgressEvents?: {
    id: string;
    title: string;
    type: string;
    timestamp: string;
  }[];
  detectedContradictions?: string[];
}

export type CrossModuleActionType =
  | 'open_resume_builder'
  | 'open_ats_checker'
  | 'suggest_roadmap_milestone'
  | 'prepare_application_draft'
  | 'start_mock_interview'
  | 'prepare_project_defense';

export interface CrossModuleAction {
  id: string;
  type: CrossModuleActionType;
  title: string;
  description: string;
  payload: Record<string, any>;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'dismissed' | 'executed';
  executedAt?: string;
}

export interface UnifiedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  activeModule: ActiveAppModule;
  action?: CrossModuleAction;
  modelUsed?: string;
  isFallback?: boolean;
  generationSource?: 'gemini' | 'deterministic-fallback';
  verifiedDataDisclosures?: string[];
  aiSuggestionsDisclosures?: string[];
}

export interface UnifiedConversation {
  id: string;
  title: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  lastActiveModule: ActiveAppModule;
  messages: UnifiedChatMessage[];
  isPinned?: boolean;
}

export interface UnifiedChatApiRequest {
  message: string;
  conversationId?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  context: ModuleContextPayload;
}

export interface UnifiedChatApiResponse {
  reply: string;
  action?: CrossModuleAction;
  modelUsed?: string;
  isFallback?: boolean;
  generationSource?: 'gemini' | 'deterministic-fallback';
  verifiedDataDisclosures?: string[];
  aiSuggestionsDisclosures?: string[];
}
