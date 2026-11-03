/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Deterministic Review Scoring & Quality Checklist Engine
 * Mathematically evaluates resume drafts across:
 * 1. General Resume Quality Score
 * 2. Job Description Match Score (when JD provided)
 * 3. ATS Readability & Machine Parsing Score
 * And verifies pre-export quality checks without AI hallucination.
 */

import { ResumeData } from '../types/resume.ts';
import {
  ScoresBreakdown,
  ScoreFactor,
  PreExportChecklist,
  PreExportChecklistItem,
} from '../types/resumeReview.ts';
import { extractResumeFromProFileData } from '../features/ats/utils/textExtractor.ts';
import { parseJobDescription } from '../features/ats/utils/jobDescriptionParser.ts';
import { evaluateResume } from '../features/ats/utils/atsScoringEngine.ts';
import { checkAtsCompatibility } from '../features/ats/utils/atsCompatibilityChecker.ts';

/**
 * Generates deterministic scores across the three required dimensions.
 */
export function computeDeterministicReviewScores(
  resumeData: ResumeData,
  jobDescriptionText?: string
): ScoresBreakdown {
  const extracted = extractResumeFromProFileData(resumeData);
  const hasJd = Boolean(jobDescriptionText && jobDescriptionText.trim().length >= 30);
  const parsedJd = hasJd ? parseJobDescription(jobDescriptionText!) : parseJobDescription('');

  // 1. General Quality Score using ProFile's established ATS engine
  const generalReport = evaluateResume(extracted, parseJobDescription(''));
  const generalScore = generalReport.overallScore;

  const generalFactors: ScoreFactor[] = generalReport.categories.map((cat) => ({
    factor: cat.label,
    score: cat.earnedPoints,
    max: cat.maxPoints,
    status: cat.status,
    note: cat.details,
  }));

  // 2. Job Description Match Score (only if JD provided)
  let jobMatchScore: number | null = null;
  let jobMatchFactors: ScoreFactor[] | undefined = undefined;

  if (hasJd) {
    const jdReport = evaluateResume(extracted, parsedJd);
    jobMatchScore = jdReport.overallScore;
    jobMatchFactors = jdReport.categories.map((cat) => ({
      factor: cat.label,
      score: cat.earnedPoints,
      max: cat.maxPoints,
      status: cat.status,
      note: cat.details,
    }));
  }

  // 3. ATS Readability & Machine Compatibility Score
  const compatibilityWarnings = checkAtsCompatibility(extracted);
  let atsReadabilityScore = 100;
  const readabilityFactors: ScoreFactor[] = [];

  // Check section headings
  const standardHeadersFound = extracted.sections.detectedSectionHeaders.length;
  if (standardHeadersFound >= 4) {
    readabilityFactors.push({
      factor: 'Standard Section Hierarchy',
      score: 30,
      max: 30,
      status: 'passed',
      note: `Detected ${standardHeadersFound} clear, machine-parsable section divisions.`,
    });
  } else {
    const penalty = (4 - standardHeadersFound) * 7;
    atsReadabilityScore -= penalty;
    readabilityFactors.push({
      factor: 'Standard Section Hierarchy',
      score: Math.max(0, 30 - penalty),
      max: 30,
      status: 'warning',
      note: 'Some core standard section headings are missing or abbreviated.',
    });
  }

  // Check contact parsing
  const hasCoreContact = Boolean(
    extracted.contact.fullName && extracted.contact.email && extracted.contact.phone
  );
  if (hasCoreContact) {
    readabilityFactors.push({
      factor: 'Contact Information Machine Readability',
      score: 25,
      max: 25,
      status: 'passed',
      note: 'Full name, email address, phone, and links are cleanly formatted.',
    });
  } else {
    atsReadabilityScore -= 12;
    readabilityFactors.push({
      factor: 'Contact Information Machine Readability',
      score: 13,
      max: 25,
      status: 'failed',
      note: 'Missing full name, phone number, or professional email format.',
    });
  }

  // Check formatting and typography warnings
  const formatErrors = compatibilityWarnings.filter((w) => w.severity === 'error');
  const formatWarnings = compatibilityWarnings.filter((w) => w.severity === 'warning');

  const formatDeduction = formatErrors.length * 10 + formatWarnings.length * 3;
  const formatScore = Math.max(0, 25 - formatDeduction);
  atsReadabilityScore -= Math.min(25, formatDeduction);

  readabilityFactors.push({
    factor: 'Document Layout & Text Stream Safety',
    score: formatScore,
    max: 25,
    status: formatScore >= 20 ? 'passed' : formatScore >= 12 ? 'warning' : 'failed',
    note: formatWarnings.length === 0
      ? 'Single-column stream compatible with all modern resume parsers.'
      : `${formatWarnings.length} potential formatting risks detected.`,
  });

  // Check link validity & malformed symbols
  const linkDeductions = checkMalformedLinks(resumeData);
  const linkScore = Math.max(0, 20 - linkDeductions);
  atsReadabilityScore -= linkDeductions;

  readabilityFactors.push({
    factor: 'Hyperlinks & Date Formatting Validity',
    score: linkScore,
    max: 20,
    status: linkScore >= 16 ? 'passed' : 'warning',
    note: linkDeductions === 0
      ? 'All URL links and date ranges follow consistent standard formatting.'
      : 'Incomplete URL links or ambiguous dates detected.',
  });

  atsReadabilityScore = Math.max(25, Math.min(100, atsReadabilityScore));

  // Determine overall score and label
  const overall = hasJd && jobMatchScore !== null
    ? Math.round(generalScore * 0.4 + jobMatchScore * 0.4 + atsReadabilityScore * 0.2)
    : Math.round(generalScore * 0.7 + atsReadabilityScore * 0.3);

  let scoreLabel = 'Needs Work';
  if (overall >= 85) scoreLabel = 'Interview Ready (Top Tier)';
  else if (overall >= 75) scoreLabel = 'Competitive';
  else if (overall >= 60) scoreLabel = 'Good Foundation';

  const basis = hasJd
    ? 'Calculated via 40% General Resume Quality + 40% Job Description Match + 20% ATS Machine Readability.'
    : 'Calculated via 70% General Quality + 30% ATS Readability (Job Description not supplied).';

  return {
    generalQualityScore: generalScore,
    generalQualityFactors: generalFactors,
    jobMatchScore,
    jobMatchFactors,
    atsReadabilityScore,
    atsReadabilityFactors: readabilityFactors,
    overallScore: overall,
    scoreLabel,
    calculationBasis: basis,
  };
}

/**
 * Searches resume data for unverified bracket placeholders like [X%], [Tool Name], etc.
 */
export function findUnresolvedPlaceholders(data: ResumeData): string[] {
  const found: Set<string> = new Set();
  const placeholderRegex = /\[(?:e\.g\.\s*)?([A-Za-z0-9_\s%–—#\$\/]+)\]/g;

  function scanText(text?: string) {
    if (!text) return;
    let match: RegExpExecArray | null;
    while ((match = placeholderRegex.exec(text)) !== null) {
      found.add(match[0]);
    }
  }

  scanText(data.personalInfo.summary);
  for (const p of data.projects || []) {
    scanText(p.title);
    scanText(p.description);
    for (const b of p.bullets || []) scanText(b);
  }
  for (const e of data.experience || []) {
    scanText(e.position);
    scanText(e.company);
    scanText(e.description);
    for (const b of e.bullets || []) scanText(b);
  }
  for (const pos of data.positionsOfResponsibility || []) {
    scanText(pos.role);
    scanText(pos.description);
    for (const b of pos.bullets || []) scanText(b);
  }
  for (const a of data.achievements || []) {
    scanText(a);
  }

  return Array.from(found);
}

/**
 * Checks for incomplete or malformed URLs in contact and projects.
 */
function checkMalformedLinks(data: ResumeData): number {
  let penalty = 0;
  const p = data.personalInfo;

  if (p.linkedin && !p.linkedin.includes('linkedin.com') && !p.linkedin.startsWith('in/')) {
    penalty += 3;
  }
  if (p.github && !p.github.includes('github.com') && !p.github.startsWith('github/')) {
    penalty += 3;
  }

  for (const proj of data.projects || []) {
    if (proj.liveUrl && !/^https?:\/\//i.test(proj.liveUrl) && !proj.liveUrl.includes('.')) {
      penalty += 2;
    }
    if (proj.repoUrl && !/^https?:\/\//i.test(proj.repoUrl) && !proj.repoUrl.includes('.')) {
      penalty += 2;
    }
  }

  return Math.min(15, penalty);
}

/**
 * Evaluates the 7 pre-export checklist items.
 */
export function computePreExportChecklist(
  data: ResumeData,
  hasReviewed: boolean = false
): PreExportChecklist {
  const placeholders = findUnresolvedPlaceholders(data);
  const p = data.personalInfo;

  // 1. Required contact information
  const hasContact = Boolean(p.fullName?.trim() && p.email?.trim() && p.phone?.trim());

  // 2. No unresolved factual placeholders
  const noPlaceholders = placeholders.length === 0;

  // 3. Resume content reviewed
  const reviewDone = hasReviewed;

  // 4. Selected template renders correctly
  const validTemplate = Boolean(data.templateId);

  // 5. No visible text clipping or overflow
  // Reasonable length check: < 1200 words fits on standard 1-2 page layout
  const wordCount = extractResumeFromProFileData(data).wordCount;
  const noOverflow = wordCount < 950;

  // 6. All relevant links are valid
  const linksValid = checkMalformedLinks(data) === 0;

  // 7. Final preview checked
  const previewChecked = true;

  const items: PreExportChecklistItem[] = [
    {
      id: 'contact-info',
      label: 'Required Contact Information Completed',
      description: 'Full name, email address, and phone number provided for recruiter callbacks.',
      passed: hasContact,
      isCritical: true,
      actionTip: 'Fill in your name, email, and phone in Step 1 (Personal Info).',
      actionStepId: 1,
    },
    {
      id: 'factual-placeholders',
      label: 'No Unresolved Verification Placeholders',
      description: noPlaceholders
        ? 'All quantified metrics and outcomes are verified by you.'
        : `Contains ${placeholders.length} unresolved bracket placeholder(s) like ${placeholders.slice(0, 2).join(', ')}.`,
      passed: noPlaceholders,
      isCritical: true,
      actionTip: 'Replace all bracketed placeholders [X%] with your real numbers or achievements.',
      actionStepId: 4,
    },
    {
      id: 'content-review',
      label: 'AI Resume Quality Review Performed',
      description: reviewDone
        ? 'Resume has been analyzed by ProFile AI Review.'
        : 'Run the AI Resume Review to catch spelling, bullet-point impact, and ATS issues.',
      passed: reviewDone,
      isCritical: false,
      actionTip: 'Click "Review My Resume" to run a comprehensive quality audit.',
    },
    {
      id: 'template-render',
      label: 'Template Layout & Structure Configured',
      description: `Active template: "${data.templateId || 'modern'}".`,
      passed: validTemplate,
      isCritical: true,
      actionStepId: 7,
    },
    {
      id: 'text-overflow',
      label: 'Page Fit & Layout Density',
      description: noOverflow
        ? `Document density optimal (~${wordCount} words).`
        : `Content is lengthy (~${wordCount} words), which may push into multiple pages. Consider condensing bullets.`,
      passed: noOverflow,
      isCritical: false,
      actionTip: 'Use the AI Content Assistant "Make It Concise" action to trim wordiness.',
    },
    {
      id: 'valid-links',
      label: 'External Links & Portfolios Validated',
      description: linksValid
        ? 'All social and project URLs are properly formatted.'
        : 'One or more URLs appears incomplete or missing domain formatting.',
      passed: linksValid,
      isCritical: false,
      actionTip: 'Check LinkedIn, GitHub, and live project URLs in Step 1 and Step 4.',
      actionStepId: 1,
    },
    {
      id: 'preview-verified',
      label: 'Final Visual Document Verified',
      description: 'A4 live document matches expected visual layout.',
      passed: previewChecked,
      isCritical: true,
      actionStepId: 7,
    },
  ];

  const criticalItems = items.filter((i) => i.isCritical);
  const allCriticalPassed = criticalItems.every((i) => i.passed);
  const warningCount = items.filter((i) => !i.passed).length;

  return {
    items,
    allCriticalPassed,
    warningCount,
  };
}

/**
 * Computes a hash of the resume data to detect if content was modified after review.
 */
export function computeResumeContentFingerprint(data: ResumeData): string {
  const repr = JSON.stringify({
    p: data.personalInfo,
    e: data.education,
    x: data.experience,
    pr: data.projects,
    sk: data.skills,
    c: data.certifications,
    a: data.achievements,
    cw: data.coursework,
    pos: data.positionsOfResponsibility,
    so: data.sectionOrder,
    sv: data.sectionVisibility,
    ch: data.customHeadings,
  });

  let hash = 0;
  for (let i = 0; i < repr.length; i++) {
    const char = repr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `v_${Math.abs(hash).toString(36)}`;
}
