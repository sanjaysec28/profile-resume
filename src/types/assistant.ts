/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 3: AI Resume Content Assistant Types
 * Enforces typed schemas for content generation, improvement actions,
 * staging reviews, and section management.
 */

export type ContentAssistantAction =
  | 'generate'
  | 'improve'
  | 'professional'
  | 'concise'
  | 'ats_keywords'
  | 'role_target'
  | 'fix_grammar'
  | 'regenerate';

export type ContentAssistantSection =
  | 'summary'
  | 'technical_skills'
  | 'soft_skills'
  | 'projects'
  | 'education'
  | 'experience'
  | 'certifications'
  | 'achievements'
  | 'positions_of_responsibility'
  | 'coursework';

export interface ContentAssistantRequest {
  section: ContentAssistantSection;
  action: ContentAssistantAction;
  currentContent?: string | string[] | Record<string, any>;
  targetRole: string;
  purpose: string;
  degree?: string;
  department?: string;
  academicYear?: string;
  jobDescriptionText?: string;
  approvedRecommendations?: {
    technicalSkills?: string[];
    softSkills?: string[];
    keywords?: string[];
    suggestedSections?: string[];
  };
  additionalInstructions?: string;
  itemTitle?: string; // e.g. project title or company/role name
  itemTechStack?: string[];
  contextSummary?: string;
}

export interface ContentAssistantResponse {
  generatedText: string;
  bulletPoints?: string[];
  explanation: string;
  placeholdersUsed: string[];
  atsScoreImpactNote: string;
  actionApplied: ContentAssistantAction;
  recommendedHeading?: string;
}

export interface SectionConfigItem {
  id: ContentAssistantSection;
  title: string;
  defaultHeading: string;
  isOptional: boolean;
  isVisible: boolean;
  description: string;
}

export const DEFAULT_RESUME_SECTIONS: SectionConfigItem[] = [
  {
    id: 'summary',
    title: 'Professional Summary',
    defaultHeading: 'Professional Summary',
    isOptional: false,
    isVisible: true,
    description: 'Concise executive summary highlighting your career direction and core strengths.',
  },
  {
    id: 'education',
    title: 'Education',
    defaultHeading: 'Education',
    isOptional: false,
    isVisible: true,
    description: 'College, degrees, majors, GPA, and academic timeline.',
  },
  {
    id: 'technical_skills',
    title: 'Technical Skills',
    defaultHeading: 'Technical Skills',
    isOptional: false,
    isVisible: true,
    description: 'Languages, frameworks, developer tools, databases, and core competencies.',
  },
  {
    id: 'soft_skills',
    title: 'Soft Skills',
    defaultHeading: 'Professional Skills',
    isOptional: true,
    isVisible: true,
    description: 'Communication, collaboration, agile methodologies, and leadership skills.',
  },
  {
    id: 'projects',
    title: 'Projects',
    defaultHeading: 'Projects & Academic Work',
    isOptional: false,
    isVisible: true,
    description: 'Key personal, academic, or open-source software and engineering projects.',
  },
  {
    id: 'experience',
    title: 'Experience / Internships',
    defaultHeading: 'Experience',
    isOptional: true,
    isVisible: true,
    description: 'Work history, internships, freelance, or research assistant roles.',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    defaultHeading: 'Certifications',
    isOptional: true,
    isVisible: true,
    description: 'Industry-recognized certifications and accredited technical credentials.',
  },
  {
    id: 'achievements',
    title: 'Achievements & Awards',
    defaultHeading: 'Achievements & Honors',
    isOptional: true,
    isVisible: true,
    description: 'Hackathons, coding competitions, scholarships, and academic honors.',
  },
  {
    id: 'positions_of_responsibility',
    title: 'Positions of Responsibility',
    defaultHeading: 'Leadership & Responsibility',
    isOptional: true,
    isVisible: true,
    description: 'Student clubs, community leadership, hackathon organizing, or student government.',
  },
  {
    id: 'coursework',
    title: 'Relevant Coursework',
    defaultHeading: 'Relevant Coursework',
    isOptional: true,
    isVisible: true,
    description: 'Key undergraduate or graduate courses matching your target job role.',
  },
];
