/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ATS Feature Module — Prepared for Phase 2+
 * Covers ATS File Upload, Keyword Matching, and Score Breakdown.
 */

export * from '../../types/ats.ts';

export const ATS_BENCHMARKS = {
  excellentThreshold: 85,
  goodThreshold: 70,
  needsWorkThreshold: 55,
  coreCategories: [
    { key: 'formatting', label: 'Formatting & Layout', weight: 0.25 },
    { key: 'keywords', label: 'Keyword Match Rate', weight: 0.35 },
    { key: 'impact', label: 'Impact & Action Metrics', weight: 0.20 },
    { key: 'structure', label: 'Section Completeness', weight: 0.10 },
    { key: 'contact', label: 'Contact & Links Validation', weight: 0.10 },
  ],
} as const;
