/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  scoreOrGpa?: string;
  board?: string;
  type?: 'college' | 'higher-secondary' | 'school';
  highlights?: string[];
}

export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  employmentType?: 'Internship' | 'Full-time' | 'Part-time' | 'Freelance' | string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description?: string;
  bullets?: string[];
}

export interface ResumeProject {
  id: string;
  title: string;
  role?: string;
  link?: string; // Legacy field preserved for backward compatibility
  liveUrl?: string; // Live Project URL / Demo
  repoUrl?: string; // GitHub / Source Code Repository URL
  techStack: string[];
  description: string;
  bullets?: string[];
}

export interface ResumeCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
}

export type ResumeTemplateId =
  | 'modern'
  | 'classic'
  | 'minimal'
  | 'professional'
  | 'creative'
  | 'technical'
  | 'academic'
  | 'compact'
  | 'executive'
  | 'contemporary-sidebar'
  // Legacy aliases for backward compatibility with saved drafts
  | 'minimal-cream'
  | 'executive-mono'
  | 'modern-student'
  | 'technical-clean';

export interface ResumeData {
  id: string;
  title: string;
  updatedAt: string;
  templateId: ResumeTemplateId;
  personalInfo: {
    fullName: string;
    professionalTitle?: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
    github?: string;
    summary: string;
    photoUrl?: string;
  };
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: {
    technical: string[];
    soft: string[];
    tools?: string[];
  };
  certifications?: ResumeCertification[];
  achievements?: string[];
  coursework?: string[];
}
