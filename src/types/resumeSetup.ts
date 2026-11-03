/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Assistant | Setup Wizard Data Models (Phase 1)
 * Clean, extensible TypeScript contracts for resume setup metadata,
 * role taxonomies, optional JD parsing structures, and student profile context.
 */

export type ResumePurposeId =
  | 'fresher'
  | 'internship'
  | 'campus-placement'
  | 'technical-job'
  | 'academic'
  | 'creative';

export interface ResumePurposeOption {
  id: ResumePurposeId;
  title: string;
  tagline: string;
  description: string;
  badge?: string;
}

export type RoleCategoryKey =
  | 'all'
  | 'software'
  | 'data-ai'
  | 'cloud-security'
  | 'design-creative';

export interface RoleCategory {
  id: RoleCategoryKey;
  label: string;
}

export interface TargetRole {
  id: string;
  title: string;
  category: RoleCategoryKey;
  isCustom?: boolean;
}

export interface JobDescriptionData {
  text: string;
  charCount: number;
  companyName?: string;
  jobTitle?: string;
  provided: boolean;
}

export interface StudentProfileContext {
  fullName: string;
  email: string;
  emailVerified: boolean;
  photoUrl?: string;
  collegeOrUniversity: string;
  major: string;
  degree: string;
  academicYear: string;
  graduationYear: string;
  gpa?: string;
  phone?: string;
  location?: string;
}

export interface ResumeSetupData {
  id: string;
  userId?: string;
  purpose: ResumePurposeId;
  targetRole: TargetRole;
  jobDescription: JobDescriptionData;
  profileContext: StudentProfileContext;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const RESUME_PURPOSE_OPTIONS: ResumePurposeOption[] = [
  {
    id: 'fresher',
    title: 'Fresher Resume',
    tagline: 'Entry-level careers',
    description: 'Designed for recent graduates or early-stage applicants emphasizing education, academic projects, and core foundational skills.',
    badge: 'Popular',
  },
  {
    id: 'internship',
    title: 'Internship Application',
    tagline: 'Summer & winter internships',
    description: 'Tailored for competitive student internships showcasing fast learning, hands-on tech stack, coursework, and personal builds.',
    badge: 'High Impact',
  },
  {
    id: 'campus-placement',
    title: 'Campus Placement',
    tagline: 'On-campus recruitment drives',
    description: 'Structured for university placement cells and multi-round corporate assessments with clean academic records and problem-solving focus.',
    badge: 'Campus Ready',
  },
  {
    id: 'technical-job',
    title: 'Technical Job',
    tagline: 'Industry engineering roles',
    description: 'High-density technical portfolio format highlighting production projects, GitHub repos, backend/frontend architectures, and live demos.',
    badge: 'Industry Standard',
  },
  {
    id: 'academic',
    title: 'Research / Academic',
    tagline: 'Higher studies & lab grants',
    description: 'Oriented toward MS/PhD admissions, research laboratories, conference publications, citations, and university scholar applications.',
  },
  {
    id: 'creative',
    title: 'Creative / Design',
    tagline: 'UI/UX, visual & media portfolios',
    description: 'Ideal for product designers, UI/UX strategists, and creative technologists prioritizing design systems, case studies, and visual impact.',
  },
];

export const ROLE_CATEGORIES: RoleCategory[] = [
  { id: 'all', label: 'All Roles' },
  { id: 'software', label: 'Software & Web' },
  { id: 'data-ai', label: 'AI, ML & Data' },
  { id: 'cloud-security', label: 'Cloud & Security' },
  { id: 'design-creative', label: 'Design & Product' },
];

export const DEFAULT_TARGET_ROLES: TargetRole[] = [
  { id: 'android-intern', title: 'Android Developer Intern', category: 'software' },
  { id: 'frontend-intern', title: 'Frontend Developer Intern', category: 'software' },
  { id: 'fullstack-dev', title: 'Full Stack Developer', category: 'software' },
  { id: 'software-engineer', title: 'Software Engineer', category: 'software' },
  { id: 'aiml-intern', title: 'AI/ML Engineer Intern', category: 'data-ai' },
  { id: 'data-analyst', title: 'Data Analyst', category: 'data-ai' },
  { id: 'python-dev', title: 'Python Developer', category: 'software' },
  { id: 'uiux-designer', title: 'UI/UX Designer', category: 'design-creative' },
  { id: 'cloud-engineer', title: 'Cloud Engineer', category: 'cloud-security' },
  { id: 'cybersecurity-intern', title: 'Cybersecurity Intern', category: 'cloud-security' },
  { id: 'ios-dev', title: 'iOS Developer Intern', category: 'software' },
  { id: 'backend-engineer', title: 'Backend Engineer', category: 'software' },
  { id: 'devops-engineer', title: 'DevOps Engineer', category: 'cloud-security' },
  { id: 'product-designer', title: 'Product Designer', category: 'design-creative' },
];
