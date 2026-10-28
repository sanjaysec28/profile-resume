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
  id: 'student-01',
  fullName: 'Alex Chen',
  email: 'alex.chen@university.edu',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  collegeOrUniversity: 'Stanford University',
  major: 'Computer Science & Human-Computer Interaction',
  graduationYear: '2027',
  gpa: '3.88 / 4.0',
  avatar: 'boy',
  targetRole: 'Software Engineering Intern',
  bio: 'First-year undergraduate building modern web applications, distributed systems, and intuitive user tools.',
  socialLinks: {
    linkedin: 'linkedin.com/in/alexchen',
    github: 'github.com/alexchen',
    portfolio: 'alexchen.dev',
  },
};

export const DASHBOARD_CARDS = [
  {
    id: 'build-resume' as const,
    title: 'Build Resume',
    subtitle: 'Craft professional resumes with live A4 preview',
    actionText: 'Start Building',
    targetView: 'resume-builder' as const,
    stats: '4 curated student templates',
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
    stats: 'Stanford Univ · CS 2027',
  },
] as const;
