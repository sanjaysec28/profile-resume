/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Placement Intelligence, Job Discovery & Application Management
 * Typed data contracts for genuine job opportunities, eligibility assessments,
 * deterministic resume matching, application tracking, and AI application assistance.
 */

export type WorkEnvironment = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type JobType = 'internship' | 'full-time' | 'contract' | 'part-time';
export type ExperienceLevel = 'fresher' | 'entry-level' | 'intern' | 'junior' | 'mid-level';

export interface VerifiedJobOpportunity {
  id: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string;
  workEnvironment: WorkEnvironment;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  departmentCategory?: string;
  targetRoles: string[]; // e.g. ["Full Stack Developer", "Frontend Engineer"]
  description: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications?: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
  salaryOrStipend?: string; // Only when officially published
  applicationDeadline?: string; // ISO date string or human readable
  originalUrl: string;
  sourceName: string; // e.g. "Direct Employer Careers", "Arbeitnow API", "University Placement Board"
  sourceType: 'official-career-page' | 'trusted-job-feed' | 'verified-placement' | 'student-added';
  verifiedAt: string; // ISO date
  isStaleOrExpired?: boolean;
}

export type EligibilityStatus =
  | 'appears-eligible'
  | 'potentially-eligible'
  | 'likely-not-eligible'
  | 'eligibility-unknown';

export interface EligibilityCriterion {
  field: string; // e.g. "Degree & Major", "Graduation Year", "CGPA / Academic Score", "Experience"
  requirement: string;
  studentValue: string;
  status: 'met' | 'unmet' | 'unknown';
  notes?: string;
}

export interface EligibilityAssessment {
  overallStatus: EligibilityStatus;
  summary: string;
  criteria: EligibilityCriterion[];
  assessedAt: string;
}

export interface MatchCategoryScore {
  category: 'role' | 'skills' | 'qualifications' | 'experience' | 'graduation';
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  details: string;
}

export interface JobResumeMatchAnalysis {
  jobId: string;
  matchScore: number; // 0 - 100 deterministic calculation
  categoryBreakdown: {
    roleAlignment: MatchCategoryScore;
    skillAlignment: MatchCategoryScore;
    qualificationAlignment: MatchCategoryScore;
    projectExperienceRelevance: MatchCategoryScore;
    graduationCompatibility: MatchCategoryScore;
  };
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  qualificationMatchStatus: 'aligned' | 'partially-aligned' | 'unspecified';
  experienceMatchStatus: 'freshers-welcome' | 'entry-aligned' | 'experience-required';
  relevantResumeEvidence: {
    section: 'projects' | 'skills' | 'experience' | 'coursework';
    title: string;
    snippet: string;
  }[];
  recommendedActions: string[];
  disclaimer: string;
  calculatedAt: string;
}

export type ApplicationStatus =
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationRecord {
  id: string;
  userId?: string;
  jobId?: string; // optional link to a discovered job
  jobTitle: string;
  company: string;
  companyWebsite?: string;
  location: string;
  workEnvironment: WorkEnvironment;
  jobType: JobType;
  jobUrl: string;
  sourceName: string;
  appliedDate?: string;
  deadline?: string;
  status: ApplicationStatus;
  matchScore?: number;
  eligibilityStatus?: EligibilityStatus;
  eligibilitySummary?: string;
  resumeVersionUsed?: string;
  coverLetterSnippet?: string;
  coverLetterDraftId?: string;
  notes?: string;
  nextFollowUpDate?: string;
  interviewDate?: string;
  salaryOffered?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDraft {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  tailoredSummary?: string;
  highlightedProjects: {
    title: string;
    reason: string;
  }[];
  tailoredCoverLetter?: string;
  recruiterOutreachMessage?: string;
  applicationEmailSubject?: string;
  applicationEmailBody?: string;
  commonQuestionsAnswers?: {
    question: string;
    suggestedAnswer: string;
  }[];
  missingInformationNoticed: string[];
  generatedAt: string;
  isApprovedByStudent: boolean;
  isAiGenerated?: boolean;
  generationSource?: 'gemini' | 'structured-fallback';
}

export interface PlacementAnalytics {
  totalOpportunitiesSaved: number;
  totalApplications: number;
  applicationsSubmittedCount: number; // applied, assessment, interview, offer, rejected
  activeApplicationsCount: number; // preparing, applied, assessment, interview
  assessmentsScheduledCount: number;
  interviewsScheduledCount: number;
  offersReceivedCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  statusDistribution: Record<ApplicationStatus, number>;
  upcomingFollowUps: ApplicationRecord[];
  upcomingInterviews: ApplicationRecord[];
  upcomingDeadlines: ApplicationRecord[];
}

export interface JobSearchFilters {
  keyword: string;
  targetRole: string;
  jobType: 'all' | 'internship' | 'full-time';
  workEnvironment: 'all' | 'remote' | 'hybrid' | 'onsite';
  experienceLevel: 'all' | 'fresher' | 'entry-level';
  location: string;
  hasPublishedSalary: boolean;
  minMatchScore?: number;
}

export interface PlacementStudentContext {
  targetRole: string;
  degree: string;
  major: string;
  academicYear: string;
  graduationYear: string;
  cgpaOrScore?: string;
  technicalSkills: string[];
  softSkills: string[];
  projects: {
    title: string;
    techStack: string[];
    description: string;
    bullets?: string[];
  }[];
  experienceCount: number;
  certifications?: string[];
  coursework?: string[];
  preferredLocations?: string[];
  preferredWorkEnvironment?: WorkEnvironment;
  approvedAtsKeywords?: string[];
}
