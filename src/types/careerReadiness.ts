/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.3: Career Readiness, Interview Intelligence & Placement Preparation
 * Data contracts for 5 separate readiness indicators, 4-state role skill gap classification,
 * actionable career roadmap milestones, 6-type interview prep, and project defense mode.
 */

export interface DimensionReadinessScore {
  score: number; // 0 - 100%
  level: 'low' | 'moderate' | 'strong' | 'exceptional';
  title: string;
  summary: string;
  metricsBreakdown: Record<string, number | string>;
  diagnosticNotes: string[];
}

export interface CareerReadinessIndicators {
  targetRole: string;
  calculatedAt: string;
  disclaimer: string;
  resumeReadiness: DimensionReadinessScore;
  technicalSkillReadiness: DimensionReadinessScore;
  projectExplanationReadiness: DimensionReadinessScore;
  interviewReadiness: DimensionReadinessScore;
  applicationActivity: DimensionReadinessScore;
}

export type SkillReadinessState =
  | 'demonstrated'
  | 'partially_demonstrated'
  | 'missing'
  | 'unverified';

export type SkillImportanceTier = 'essential' | 'important' | 'optional';

export interface ClassifiedSkillItem {
  id: string;
  name: string;
  category:
    | 'programming-languages'
    | 'frameworks-libraries'
    | 'databases-storage'
    | 'cloud-devops'
    | 'core-cs'
    | 'system-design'
    | 'tools-methodologies'
    | 'soft-skills';
  importance: SkillImportanceTier;
  classification: SkillReadinessState;
  evidence?: string;
  connectedProject?: string;
  connectedCoursework?: string;
  recommendedSequenceIndex: number;
  learningAction: string;
}

export interface ProjectSkillOpportunity {
  projectTitle: string;
  skillsToAdd: string[];
  suggestedEnhancement: string;
}

export interface RoleSkillGapAnalysis {
  targetRole: string;
  classifiedSkills: ClassifiedSkillItem[];
  demonstratedCount: number;
  partiallyDemonstratedCount: number;
  missingCount: number;
  unverifiedCount: number;
  learningSequence: ClassifiedSkillItem[];
  projectOpportunities: ProjectSkillOpportunity[];
  assessedAt: string;
}

export type MilestoneCategory =
  | 'short_term'
  | 'technical_skills'
  | 'dsa_problem_solving'
  | 'project_development'
  | 'resume_improvement'
  | 'interview_prep'
  | 'application_targets';

export type MilestonePriority = 'high' | 'medium' | 'low';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';

export interface CareerRoadmapMilestone {
  id: string;
  title: string;
  description: string;
  category: MilestoneCategory;
  priority: MilestonePriority;
  estimatedDuration: string;
  status: MilestoneStatus;
  completionCriteria: string;
  optionalDeadline?: string;
  isCustom?: boolean;
  orderIndex: number;
  completedAt?: string;
  notes?: string;
}

export interface CareerRoadmap {
  id: string;
  targetRole: string;
  milestones: CareerRoadmapMilestone[];
  updatedAt: string;
}

export type D63InterviewType =
  | 'technical'
  | 'behavioral'
  | 'project_defense'
  | 'resume_based'
  | 'role_specific'
  | 'dsa_problem_solving';

export type D63InterviewDifficulty = 'entry_level' | 'mid_level' | 'advanced';

export interface AnswerRubricScore {
  technicalCorrectness: number; // 0 - 10
  clarity: number; // 0 - 10
  structure: number; // 0 - 10
  problemSolvingApproach: number; // 0 - 10
  communication: number; // 0 - 10
  relevance: number; // 0 - 10
}

export interface EvaluatedInterviewAnswerD63 {
  questionId: string;
  questionText: string;
  studentAnswer: string;
  answerMode: 'text' | 'voice';
  overallScore: number; // 0 - 100%
  rubric: AnswerRubricScore;
  whatWasDoneWell: string[];
  whatWasMissing: string[];
  improvementSuggestions: string[];
  exampleStrongerAnswer: string;
  relatedTopicsToRevise: string[];
  evaluatedAt: string;
  isApprovedByStudent?: boolean;
  savedToProfileNotes?: boolean;
}

export interface ProjectDefenseQuestion {
  id: string;
  dimension:
    | 'problem_statement'
    | 'architecture_design'
    | 'technology_rationale'
    | 'database_api'
    | 'challenges_debugging'
    | 'testing_debugging'
    | 'tradeoffs_limitations'
    | 'future_improvements';
  topicTitle: string;
  question: string;
  whyAsked: string;
  evaluationCriteria: string[];
  hints: string[];
}

export interface ProjectDefenseSession {
  id: string;
  projectId: string;
  projectTitle: string;
  projectTechStack: string[];
  questions: ProjectDefenseQuestion[];
  answers: Record<string, EvaluatedInterviewAnswerD63>;
  currentQuestionIndex: number;
  completedAt?: string;
  overallScore?: number;
}
