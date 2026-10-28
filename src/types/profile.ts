/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AvatarType = 'boy' | 'girl' | 'custom';

export interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  collegeOrUniversity: string;
  major: string;
  graduationYear: string;
  gpa?: string;
  avatar: AvatarType;
  avatarUrl?: string;
  targetRole?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}
