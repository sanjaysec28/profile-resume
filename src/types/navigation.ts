/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView =
  | 'welcome'
  | 'signin'
  | 'onboarding'
  | 'dashboard'
  | 'resume-setup'
  | 'resume-recommendations'
  | 'resume-builder'
  | 'resume-templates'
  | 'resume-editor'
  | 'resume-preview'
  | 'ats-upload'
  | 'ats-results'
  | 'profile'
  | 'career-intelligence'
  | 'interview-prep'
  | 'placement-intelligence'
  | 'history'
  | 'design-system';

export interface NavItem {
  id: AppView;
  label: string;
  href?: string;
  badge?: string;
}
