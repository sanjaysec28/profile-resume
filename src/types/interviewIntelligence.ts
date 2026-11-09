/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: AI Interview Intelligence & Placement Preparation
 * Typed data contracts for mock interviews, answer evaluation, resume-based Q&A,
 * DSA practice, HR communication training, and AI interview coach.
 */

export type InterviewCategory =
  | 'technical-fundamentals'
  | 'problem-solving'
  | 'dsa'
  | 'projects-experience'
  | 'frameworks-technologies'
  | 'database-sql'
  | 'system-design'
  | 'hr-behavioral'
  | 'internship-placement'
  | 'mixed-comprehensive'
  | 'resume-focused'
  | 'project-defense'
  | 'role-specific';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface AnswerRubricScore {
  technicalCorrectness: number; // 0 - 10
  clarity: number; // 0 - 10
  structure: number; // 0 - 10
  problemSolvingApproach: number; // 0 - 10
  communication: number; // 0 - 10
  relevance: number; // 0 - 10
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: InterviewCategory;
  difficulty: QuestionDifficulty;
  whyAsked: string;
  topic: string;
  hints?: string[];
  evaluationCriteria: string[];
  isResumeDerived?: boolean;
  resumeAnchor?: string; // Project title, skill, or certification from resume
}

export interface EvaluatedAnswer {
  questionId: string;
  studentAnswer: string;
  answerMode: 'text' | 'voice';
  score: number; // 0 - 100 qualitative AI estimate
  rubric?: AnswerRubricScore;
  whatWasDoneWell: string[];
  whatWasMissing: string[];
  improvementSuggestions: string[];
  exampleStrongerAnswer: string;
  relatedTopicsToRevise: string[];
  evaluatedAt: string;
  isApprovedByStudent?: boolean;
  savedToProfileNotes?: boolean;
}

export type InterviewSessionStatus = 'configuring' | 'in-progress' | 'paused' | 'completed';

export interface InterviewPerformanceSummary {
  overallScore: number;
  qualitativeLabel: 'Needs Practice' | 'Developing' | 'Solid Preparation' | 'Interview Ready';
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  qualitativeFeedback: string;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  targetRole: string;
  category: InterviewCategory;
  difficulty: QuestionDifficulty;
  questionCount: number; // 5, 10, or 15
  questions: InterviewQuestion[];
  answers: Record<string, EvaluatedAnswer>;
  currentQuestionIndex: number;
  status: InterviewSessionStatus;
  startedAt: string;
  completedAt?: string;
  performanceSummary?: InterviewPerformanceSummary;
}

export type DsaTopicId =
  | 'arrays-strings'
  | 'searching-sorting'
  | 'hashing'
  | 'linked-lists'
  | 'stacks-queues'
  | 'recursion-backtracking'
  | 'trees-bst'
  | 'graphs'
  | 'greedy'
  | 'dynamic-programming';

export interface DsaPracticeProblem {
  id: string;
  title: string;
  difficulty: QuestionDifficulty;
  description: string;
  expectedTimeComplexity: string;
  expectedSpaceComplexity: string;
  hints: string[];
  exampleInputOutput?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  studentNotes?: string;
}

export interface DsaTopic {
  id: DsaTopicId;
  title: string;
  overview: string;
  difficulty: QuestionDifficulty;
  learningObjectives: string[];
  problems: DsaPracticeProblem[];
  status: 'not-started' | 'in-progress' | 'completed';
  relatedRoadmapStageId?: string;
}

export interface HrPracticeQuestion {
  id: string;
  question: string;
  purpose: string;
  starFrameworkGuidance: string;
  keyPointsToCover: string[];
  pitfallsToAvoid: string[];
  sampleStructure: string;
  status: 'not-started' | 'in-progress' | 'completed';
  lastAnswer?: string;
  lastEvaluation?: EvaluatedAnswer;
}

export interface InterviewDashboardMetrics {
  targetRole: string;
  totalSessionsCompleted: number;
  averageMockScore: number; // 0-100 qualitative average
  technicalReadinessPercent: number; // 0-100
  hrReadinessPercent: number; // 0-100
  communicationPracticeCount: number;
  dsaTopicsCompletedCount: number;
  dsaTotalTopics: number;
  recentSessions: InterviewSession[];
  recommendedActivities: {
    id: string;
    title: string;
    category: InterviewCategory | 'dsa' | 'hr';
    reason: string;
    priority: 'high' | 'medium' | 'low';
    actionLabel: string;
  }[];
}

export interface InterviewCoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QuestionGenerationInput {
  targetRole: string;
  category: InterviewCategory;
  difficulty: QuestionDifficulty;
  count: number;
  academicYear?: string;
  degree?: string;
  verifiedSkills?: string[];
  missingSkills?: string[];
  projectsSummary?: {
    title: string;
    techStack: string[];
    description: string;
    bullets?: string[];
  }[];
  experienceSummary?: {
    company: string;
    position: string;
    description?: string;
  }[];
  jobDescriptionText?: string;
}

export interface AnswerEvaluationInput {
  question: InterviewQuestion;
  studentAnswer: string;
  answerMode: 'text' | 'voice';
  targetRole: string;
}
