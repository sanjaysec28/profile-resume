/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppView =
  | 'welcome'
  | 'signin'
  | 'dashboard'
  | 'resume-builder'
  | 'resume-templates'
  | 'resume-editor'
  | 'resume-preview'
  | 'ats-upload'
  | 'ats-results'
  | 'profile'
  | 'history'
  | 'design-system';

export interface NavItem {
  id: AppView;
  label: string;
  href?: string;
  badge?: string;
}
