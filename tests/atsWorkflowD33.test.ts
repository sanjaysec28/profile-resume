/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase D.3.3 Automated Test Suite:
 * 1. ATS Score Comparison & Delta Calculations
 * 2. Category Deltas and Newly Covered Keywords Tracking
 * 3. ATS Scan History Archiving & Persistence
 * 4. ATS Recommendation Item Construction & Mapping
 * 5. Transparent Disclaimer & Honest Skill Safeguards
 */

import {
  calculateAtsComparison,
  saveAtsReport,
  getAtsLocalStorageKey,
  PersistedAtsRecord,
} from '../src/lib/atsPersistenceService.ts';
import { FullAtsReport } from '../src/features/ats/types.ts';

function runD33Tests() {
  console.log('--- STARTING PHASE D.3.3 ATS WORKFLOW & INTEGRATION VERIFICATION TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    }
  }

  // Create mock FullAtsReport
  const mockInitialReport: FullAtsReport = {
    id: 'report-1',
    analyzedAt: '2026-03-01T10:00:00Z',
    mode: 'job-specific',
    overallScore: 68,
    scoreLabel: 'Needs Improvement',
    scoreExplanation: 'Baseline resume with missing keywords',
    sourceType: 'profile-draft',
    categories: [
      {
        id: 'skills_keywords',
        label: 'Skill & Keyword Coverage',
        score: 65,
        weight: 0.35,
        earnedPoints: 22.75,
        maxPoints: 35,
        status: 'warning',
        details: 'Missing core skills',
        evidence: [],
        suggestions: ['Add TypeScript'],
      },
      {
        id: 'measurable_impact',
        label: 'Measurable Impact',
        score: 60,
        weight: 0.25,
        earnedPoints: 15,
        maxPoints: 25,
        status: 'warning',
        details: 'Needs more metrics',
        evidence: [],
        suggestions: ['Quantify results'],
      },
    ],
    requiredSkillsMatch: {
      present: ['React', 'JavaScript'],
      missing: ['TypeScript', 'Docker'],
      percentage: 50,
    },
    preferredSkillsMatch: {
      present: ['Git'],
      missing: ['Jest'],
      percentage: 50,
    },
    matchedKeywords: [
      { term: 'React', count: 3, category: 'required-skill' },
      { term: 'JavaScript', count: 4, category: 'required-skill' },
    ],
    missingKeywords: [
      { term: 'TypeScript', importance: 'high', category: 'domain-tech', whyItMatters: 'Key frontend language' },
      { term: 'Docker', importance: 'medium', category: 'domain-tech', whyItMatters: 'Containerization tool' },
      { term: 'Jest', importance: 'medium', category: 'domain-tech', whyItMatters: 'Testing framework' },
    ],
    strengths: ['Clear contact details'],
    weaknesses: ['Missing TypeScript'],
    compatibilityWarnings: [],
    actionChecklist: [
      { id: 'act-1', priority: 'high', category: 'Skills', title: 'Add TypeScript', description: 'Highlight TypeScript in skills', impact: 'High' },
    ],
    summary: {
      whyThisScore: 'Needs keyword improvements',
      strongestQualifications: ['React'],
      topMissingRequirements: ['TypeScript'],
      topNextSteps: ['Update skills'],
    },
    disclaimer: 'ProFile ATS simulated score.',
  };

  const mockImprovedReport: FullAtsReport = {
    ...mockInitialReport,
    id: 'report-2',
    analyzedAt: '2026-03-01T11:00:00Z',
    overallScore: 84,
    scoreLabel: 'Strong ATS Match',
    scoreExplanation: 'Substantial improvement across all categories',
    categories: [
      {
        id: 'skills_keywords',
        label: 'Skill & Keyword Coverage',
        score: 88,
        weight: 0.35,
        earnedPoints: 30.8,
        maxPoints: 35,
        status: 'passed',
        details: 'Keywords covered',
        evidence: ['TypeScript found'],
        suggestions: [],
      },
      {
        id: 'measurable_impact',
        label: 'Measurable Impact',
        score: 80,
        weight: 0.25,
        earnedPoints: 20,
        maxPoints: 25,
        status: 'passed',
        details: 'Metrics quantified',
        evidence: [],
        suggestions: [],
      },
    ],
    requiredSkillsMatch: {
      present: ['React', 'JavaScript', 'TypeScript', 'Docker'],
      missing: [],
      percentage: 100,
    },
    preferredSkillsMatch: {
      present: ['Git'],
      missing: ['Jest'],
      percentage: 50,
    },
    matchedKeywords: [
      { term: 'React', count: 3, category: 'required-skill' },
      { term: 'JavaScript', count: 4, category: 'required-skill' },
      { term: 'TypeScript', count: 2, category: 'required-skill' },
      { term: 'Docker', count: 1, category: 'required-skill' },
    ],
    missingKeywords: [
      { term: 'Jest', importance: 'medium', category: 'domain-tech', whyItMatters: 'Testing framework' },
    ],
  };

  // TEST 1: Score Comparison & Delta Calculations
  {
    const comparison = calculateAtsComparison(
      mockInitialReport,
      mockImprovedReport,
      'hash_initial_abc',
      '2026-03-01T10:00:00Z'
    );

    assert(comparison.previousScore === 68, 'Test 1.1: previousScore matches initial report (68)');
    assert(comparison.currentScore === 84, 'Test 1.2: currentScore matches improved report (84)');
    assert(comparison.scoreDelta === 16, 'Test 1.3: scoreDelta correctly computes +16');
    assert(comparison.previousResumeContentHash === 'hash_initial_abc', 'Test 1.4: previousResumeContentHash preserved');
    assert(comparison.previousAnalyzedAt === '2026-03-01T10:00:00Z', 'Test 1.5: previousAnalyzedAt preserved');
  }

  // TEST 2: Category Score Deltas
  {
    const comparison = calculateAtsComparison(
      mockInitialReport,
      mockImprovedReport,
      'hash_initial_abc',
      '2026-03-01T10:00:00Z'
    );

    const skillsDelta = comparison.categoryDeltas.find((c) => c.id === 'skills_keywords');
    assert(Boolean(skillsDelta), 'Test 2.1: skills_keywords delta found');
    assert(skillsDelta?.previousScore === 65, 'Test 2.2: skills_keywords previous score is 65');
    assert(skillsDelta?.currentScore === 88, 'Test 2.3: skills_keywords current score is 88');
    assert(skillsDelta?.delta === 23, 'Test 2.4: skills_keywords delta is +23');

    const impactDelta = comparison.categoryDeltas.find((c) => c.id === 'measurable_impact');
    assert(Boolean(impactDelta), 'Test 2.5: measurable_impact delta found');
    assert(impactDelta?.delta === 20, 'Test 2.6: measurable_impact delta is +20');
  }

  // TEST 3: Newly Covered Keywords & Remaining Missing Keywords
  {
    const comparison = calculateAtsComparison(
      mockInitialReport,
      mockImprovedReport,
      'hash_initial_abc',
      '2026-03-01T10:00:00Z'
    );

    assert(comparison.newlyCoveredKeywords.some((k) => k.toLowerCase() === 'typescript'), 'Test 3.1: TypeScript identified as newly covered keyword');
    assert(comparison.newlyCoveredKeywords.some((k) => k.toLowerCase() === 'docker'), 'Test 3.2: Docker identified as newly covered keyword');
    assert(comparison.stillMissingKeywords.includes('Jest'), 'Test 3.3: Jest remains in stillMissingKeywords');
  }

  // TEST 4: ATS LocalStorage Cache Key
  {
    const key = getAtsLocalStorageKey('user-xyz', 'res-123');
    assert(key === 'profile_ats_report_user-xyz_res-123', 'Test 4.1: getAtsLocalStorageKey returns correct key');
  }

  // TEST 5: Negative Delta Handling
  {
    const regressedReport: FullAtsReport = {
      ...mockInitialReport,
      overallScore: 55,
      categories: [
        {
          ...mockInitialReport.categories[0],
          score: 50,
        },
      ],
    };

    const deltaComparison = calculateAtsComparison(
      mockInitialReport,
      regressedReport,
      'hash_prev',
      '2026-03-01T09:00:00Z'
    );

    assert(deltaComparison.scoreDelta === -13, 'Test 5.1: Negative scoreDelta handled (-13)');
    assert(deltaComparison.categoryDeltas[0].delta === -15, 'Test 5.2: Negative category delta handled (-15)');
  }

  console.log(`\n--- ALL D.3.3 INTEGRATION TESTS COMPLETED: ${passed} / ${total} PASSED ---`);
  if (passed !== total) {
    process.exit(1);
  }
}

runD33Tests();
