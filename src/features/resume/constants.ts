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
  {
    id: 'sidebar-pro',
    name: 'Sidebar Pro',
    tagline: '2-Column Accent Sidebar',
    description: 'Distinctive colored sidebar with profile photo, identity, and skills paired with a clean white content canvas.',
    badge: 'Executive',
    recommendedFor: 'Full-Stack Engineers, Product Designers & Leadership',
    atsScore: '93%',
    category: 'visual-first',
    status: 'active',
  },
  {
    id: 'creative-cards',
    name: 'Creative Cards',
    tagline: 'Warm Canvas & Section Cards',
    description: 'Warm cream page background with crisp white rounded cards, colored icons, and structured visual hierarchy.',
    badge: 'Modern UI',
    recommendedFor: 'Designers, Frontend Devs & Creative Technologists',
    atsScore: '92%',
    category: 'visual-first',
    status: 'active',
  },
  {
    id: 'accent-minimal',
    name: 'Accent Minimal',
    tagline: 'Single-Column Accent Line',
    description: 'Clean single-column layout with bold identity header, colored divider bar, uppercase headings, and compact tags.',
    badge: 'Recruiter Pick',
    recommendedFor: 'Internships, New Grads & Campus Placements',
    atsScore: '98%',
    category: 'ats-first',
    status: 'active',
  },
];

/**
 * Color Theme Presets for templates with customizable color schemes.
 * Controls headings, icons, dividers, skill tags, borders, and decorative accents.
 */
export interface ThemeColorPreset {
  id: string;
  name: string;
  hex: string;
  sidebarBg: string;
  badgeBg: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  { id: 'yellow', name: 'Yellow', hex: '#D99A00', sidebarBg: '#785400', badgeBg: '#FEFCE8' },
  { id: 'blue', name: 'Blue', hex: '#2563EB', sidebarBg: '#1E3A8A', badgeBg: '#EFF6FF' },
  { id: 'green', name: 'Green', hex: '#047857', sidebarBg: '#064E3B', badgeBg: '#ECFDF5' },
  { id: 'black', name: 'Black', hex: '#222222', sidebarBg: '#121212', badgeBg: '#F5F5F5' },
  { id: 'plum', name: 'Plum', hex: '#7C3AED', sidebarBg: '#2E1065', badgeBg: '#F5F3FF' },
  { id: 'crimson', name: 'Crimson', hex: '#BE123C', sidebarBg: '#881337', badgeBg: '#FFF1F2' },
];

export const DEFAULT_ACCENT_COLOR = '#2563EB';

export function getSidebarBackgroundColor(colorHex?: string): string {
  if (!colorHex) return '#1E3A8A';
  const found = THEME_COLOR_PRESETS.find((p) => p.hex.toLowerCase() === colorHex.toLowerCase());
  if (found) return found.sidebarBg;
  
  // Custom hex color calculation: deeply darken hex for sidebar background with strong text contrast (>10:1)
  try {
    const cleanHex = colorHex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = Math.max(0, Math.round(parseInt(cleanHex.slice(0, 2), 16) * 0.32));
      const g = Math.max(0, Math.round(parseInt(cleanHex.slice(2, 4), 16) * 0.32));
      const b = Math.max(0, Math.round(parseInt(cleanHex.slice(4, 6), 16) * 0.32));
      return `rgb(${r}, ${g}, ${b})`;
    }
  } catch {}
  return colorHex;
}

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
 * Complete catalog of all templates (8 active + 5 legacy), ensuring existing saved drafts resolve metadata correctly.
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
  accentColor: '#2563EB',
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
