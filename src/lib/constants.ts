/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProfile } from '../types/profile.ts';

export const APP_CONFIG = {
  name: 'ProFile',
  tagline: 'Premium Student Resume Builder & ATS Checker',
  subtext: 'Built for first-year students and ambitious grads to craft clean, ATS-proof resumes.',
  version: '1.0.0',
};

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  location: '',
  collegeOrUniversity: '',
  major: '',
  graduationYear: '',
  gpa: '',
  avatar: 'boy',
  targetRole: '',
  bio: '',
  socialLinks: {
    linkedin: '',
    github: '',
    portfolio: '',
  },
};

export const DASHBOARD_CARDS = [
  {
    id: 'build-resume' as const,
    title: 'Build Resume',
    subtitle: 'Craft professional resumes with live A4 preview',
    actionText: 'Start Building',
    targetView: 'resume-builder' as const,
    stats: '10 curated student templates',
  },
  {
    id: 'ats-checker' as const,
    title: 'ATS Checker',
    subtitle: 'Test resume compatibility & score against job keywords',
    actionText: 'Scan Document',
    targetView: 'ats-upload' as const,
    stats: 'Instant ATS parsing & breakdown',
  },
  {
    id: 'my-profile' as const,
    title: 'My Profile',
    subtitle: 'Manage your student details, education & avatar',
    actionText: 'View Details',
    targetView: 'profile' as const,
    stats: 'Manage profile & photo',
  },
] as const;
