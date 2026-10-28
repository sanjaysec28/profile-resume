/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AtsCategoryScore {
  category: 'formatting' | 'keywords' | 'impact' | 'structure' | 'contact';
  label: string;
  score: number; // 0 - 100
  weight: number;
  feedback: string[];
}

export interface AtsKeywordMatch {
  keyword: string;
  found: boolean;
  category: 'hard-skill' | 'soft-skill' | 'qualification' | 'action-verb';
  frequency?: number;
}

export interface AtsAnalysisResult {
  id: string;
  analyzedAt: string;
  resumeFileName?: string;
  targetJobTitle?: string;
  overallScore: number; // 0 - 100
  summary: string;
  categoryScores: AtsCategoryScore[];
  matchedKeywords: AtsKeywordMatch[];
  missingKeywords: AtsKeywordMatch[];
  criticalFixes: string[];
  recommendedImprovements: string[];
}
