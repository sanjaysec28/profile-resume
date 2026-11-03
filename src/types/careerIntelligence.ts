/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 5: Smart Career Intelligence & Personalized Learning Roadmap
 * Complete typed contracts for career readiness analysis, skill gap tracking,
 * 6-stage structured roadmaps, proposed project ideas, and career guidance.
 */

export type SkillStatus =
  | 'demonstrated'       // Verified with actual code / project / experience evidence
  | 'student-reported'   // Listed in resume skills without clear project evidence
  | 'learning'           // Student actively pursuing or studying
  | 'missing';           // Expected for target role but absent from profile

export type SkillImportance = 'essential' | 'important' | 'optional';

export type SkillCategory =
  | 'programming-languages'
  | 'frameworks-libraries'
  | 'databases-storage'
  | 'cloud-devops'
  | 'core-cs'
  | 'system-design'
  | 'tools-methodologies'
  | 'soft-skills';

export interface SkillGapItem {
  id: string;
  name: string;
  category: SkillCategory;
  importance: SkillImportance;
  status: SkillStatus;
  evidence?: string;
  recommendedNextAction: string;
}

export type RoadmapStageId =
  | 'foundation'
  | 'core-technical'
  | 'tools-frameworks'
  | 'practical-application'
  | 'portfolio'
  | 'interview-prep';

export type RoadmapTaskStatus = 'not-started' | 'in-progress' | 'completed';

export interface TaskResource {
  title: string;
  url?: string;
  type: 'documentation' | 'tutorial' | 'course' | 'practice-problems' | 'open-source';
  isOfficial?: boolean;
}

export interface RoadmapTask {
  id: string;
  stageId: RoadmapStageId;
  title: string;
  objective: string;
  whyItMatters: string;
  suggestedTopics: string[];
  practicalExercises: string[];
  estimatedDuration: string; // Clearly marked as estimate, e.g. "1-2 weeks (est.)"
  completionCriteria: string;
  suggestedResources?: TaskResource[];
  status: RoadmapTaskStatus;
  studentNotes?: string;
  completedAt?: string;
}

export interface RoadmapStage {
  id: RoadmapStageId;
  title: string;
  order: number;
  description: string;
  tasks: RoadmapTask[];
}

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProjectStatus = 'proposed' | 'planned' | 'in-progress' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface RecommendedProject {
  id: string;
  title: string;
  problemStatement: string;
  difficulty: ProjectDifficulty;
  requiredSkills: string[];
  suggestedTechStack: string[];
  mainFeatures: string[];
  expectedLearningOutcomes: string[];
  targetRoleRelevance: string;
  milestones: ProjectMilestone[];
  status: ProjectStatus;
  githubUrl?: string;
  liveUrl?: string;
  studentNotes?: string;
  completedAt?: string;
}

export interface RecommendedCertification {
  id: string;
  name: string;
  issuer: string;
  relevantSkills: string[];
  whyUseful: string;
  isFreeOrPaid: 'free' | 'paid' | 'unverified';
  officialUrl?: string;
  status: 'recommended' | 'pursuing' | 'completed';
  verifiedByUser: boolean;
}

export interface CareerReadinessEvaluation {
  overallReadinessScore: number; // 0 - 100 deterministic coverage
  technicalCoverageScore: number;
  projectEvidenceScore: number;
  courseworkScore: number;
  readinessLabel: string; // e.g. "Early Foundation", "Developing", "Competitive", "Role Ready"
  strengths: string[];
  missingCompetencies: string[];
  partiallyDemonstrated: string[];
  skillsRequiringProjectEvidence: string[];
  priorityImprovements: string[];
  counts: {
    demonstrated: number;
    reported: number;
    learning: number;
    missing: number;
  };
}

export interface CareerPlan {
  id: string;
  userId?: string;
  targetRole: string;
  targetRoleCategory?: string;
  purpose: string;
  academicYear: string;
  graduationYear: string;
  degree: string;
  major: string;
  hoursPerWeek?: number;
  generatedAt: string;
  updatedAt: string;
  readiness: CareerReadinessEvaluation;
  skillGaps: SkillGapItem[];
  roadmapStages: RoadmapStage[];
  recommendedProjects: RecommendedProject[];
  recommendedCertifications: RecommendedCertification[];
}

export interface CareerChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CareerPlanGenerationInput {
  targetRole: string;
  purpose: string;
  academicYear: string;
  graduationYear: string;
  degree: string;
  major: string;
  collegeOrUniversity?: string;
  existingSkills: {
    technical: string[];
    soft: string[];
    tools?: string[];
  };
  projectsSummary: {
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
  coursework?: string[];
  certifications?: string[];
  jobDescriptionText?: string;
  hoursPerWeek?: number;
}
