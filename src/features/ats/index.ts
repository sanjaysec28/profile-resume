/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ATS Feature Module — ProFile Real Resume Analysis Engine
 */

export * from '../../types/ats.ts';
export * from './types.ts';
export * from './utils/textExtractor.ts';
export * from './utils/jobDescriptionParser.ts';
export * from './utils/atsCompatibilityChecker.ts';
export * from './utils/atsScoringEngine.ts';
export * from './utils/summaryGenerator.ts';
export * from './tests/atsEngineTest.ts';

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
