/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData, ResumeTemplateId } from '../../types/resume.ts';

export interface TemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  recommendedFor: string;
  atsScore: string;
  category: 'ats-first' | 'visual-first';
  status: 'active' | 'legacy';
}

export type ResumeTemplateInfo = TemplateDefinition;

/**
 * The 5 active, recruiter-recommended templates for ProFile.
 * Curated for student resumes, internships, campus placements, and ATS-friendly applications.
 */
export const ACTIVE_RESUME_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Clean & Balanced',
    description: 'Clean typography, strong section hierarchy, subtle dividers, and balanced whitespace.',
    badge: 'Popular',
    recommendedFor: 'Engineering, Tech & Product roles',
    atsScore: '96%',
    category: 'ats-first',
    status: 'active',
  },
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Traditional Professional',
    description: 'Traditional professional layout, conservative typography, clear headings, and ATS-friendly formatting.',
    badge: 'ATS 99%',
    recommendedFor: 'Finance, Consulting & Corporate',
    atsScore: '99%',
    category: 'ats-first',
    status: 'active',
  },
  {
    id: 'technical',
    name: 'Technical',
    tagline: 'Code & Systems Focus',
    description: 'Optimized for software engineering, AI/ML, and IT roles, emphasizing skills, projects, tools, and repos.',
    badge: 'Dev Choice',
    recommendedFor: 'Software Engineers & Data Scientists',
    atsScore: '97%',
    category: 'ats-first',
    status: 'active',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Pure & Uncluttered',
    description: 'Minimal decoration, generous whitespace, restrained typography, and a simple single-column layout.',
    badge: 'Clean',
    recommendedFor: 'Software Internships & Research',
    atsScore: '98%',
    category: 'ats-first',
    status: 'active',
  },
  {
    id: 'compact',
    name: 'Compact',
    tagline: 'High-Density 1-Page',
    description: 'Space-efficient typography and margins for concise one-page resumes without making text unreadably small.',
    badge: '1-Page Fit',
    recommendedFor: 'Freshers & Tight 1-Page Guidelines',
    atsScore: '94%',
    category: 'ats-first',
    status: 'active',
  },
];

/**
 * Legacy templates retained strictly for backwards compatibility with existing saved resumes.
 * These are hidden from the active template picker for new template choices.
 */
export const LEGACY_RESUME_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Structured Business',
    description: 'Structured business layout, clear contact details, prominent experience and education, disciplined spacing.',
    badge: 'Legacy',
    recommendedFor: 'Business Development & Analyst Roles',
    atsScore: '95%',
    category: 'ats-first',
    status: 'legacy',
  },
  {
    id: 'creative',
    name: 'Creative',
    tagline: 'Design & Visual Accents',
    description: 'Distinctive typography and restrained visual accents while keeping all resume content readable and organized.',
    badge: 'Legacy',
    recommendedFor: 'UI/UX, Frontend & Creative Tech',
    atsScore: '88%',
    category: 'visual-first',
    status: 'legacy',
  },
  {
    id: 'academic',
    name: 'Academic',
    tagline: 'Research & Coursework',
    description: 'Education-first structure highlighting academic standing, coursework, achievements, and publications.',
    badge: 'Legacy',
    recommendedFor: 'Grad School, Research Fellowships & Academia',
    atsScore: '96%',
    category: 'ats-first',
    status: 'legacy',
  },
  {
    id: 'executive',
    name: 'Executive',
    tagline: 'Impact & Leadership',
    description: 'Refined typography and strong achievement-focused hierarchy showcasing measurable contributions and impact.',
    badge: 'Legacy',
    recommendedFor: 'Student Leaders, Founders & Senior Roles',
    atsScore: '95%',
    category: 'ats-first',
    status: 'legacy',
  },
  {
    id: 'contemporary-sidebar',
    name: 'Contemporary Sidebar',
    tagline: 'Modern 2-Column Split',
    description: 'Two-column layout with a visually distinct skills/contact sidebar and a main experience/project column.',
    badge: 'Legacy',
    recommendedFor: 'Portfolios, Agencies & Direct Email Applications',
    atsScore: '85%',
    category: 'visual-first',
    status: 'legacy',
  },
];

/**
 * Complete catalog of all templates (5 active + 5 legacy), ensuring existing saved drafts resolve metadata correctly.
 */
export const RESUME_TEMPLATES_CATALOG: TemplateDefinition[] = [
  ...ACTIVE_RESUME_TEMPLATES,
  ...LEGACY_RESUME_TEMPLATES,
];

export const INITIAL_RESUME_DATA: ResumeData = {
  id: 'resume-draft',
  title: 'My Resume',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  personalInfo: {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
    showPhoto: false,
  },
  education: [],
  skills: {
    technical: [],
    soft: [],
    tools: [],
  },
  projects: [],
  experience: [],
  certifications: [],
};

export const COMMON_TECHNICAL_SKILLS = [
  'C++',
  'Java',
  'TypeScript',
  'Next.js',
  'Firebase',
  'SQL',
  'pandas',
  'NumPy',
  'Scikit-learn',
  'TensorFlow',
  'PyTorch',
  'FastAPI',
  'PostgreSQL',
  'GraphQL',
  'Linux',
  'REST APIs',
];

export const COMMON_SOFT_SKILLS = [
  'Critical Thinking',
  'Leadership',
  'Public Speaking',
  'Agile / Scrum',
  'Analytical Thinking',
  'Cross-Functional Collaboration',
  'Conflict Resolution',
  'Project Management',
];
