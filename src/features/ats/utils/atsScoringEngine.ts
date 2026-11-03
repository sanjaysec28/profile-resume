/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Deterministic ATS Scoring Engine
 * Implements transparent, mathematically verifiable scoring formulas for
 * both job-specific match analysis and general resume quality.
 */

import {
  ExtractedResumeText,
  ParsedJobDescription,
  FullAtsReport,
  AtsDetailedCategoryScore,
  AtsKeywordItem,
  AtsMissingKeywordItem,
  AtsActionItem,
} from '../types.ts';
import { normalizeSkill } from './jobDescriptionParser.ts';
import { checkAtsCompatibility } from './atsCompatibilityChecker.ts';
import { generateAtsSummary } from './summaryGenerator.ts';

export const ATS_DISCLAIMER =
  'This score represents ProFile’s deterministic resume parsing analysis and keyword relevance engine. It reflects document machine-readability, qualification coverage, and standard ATS formatting benchmarks. It does not constitute a formal hiring score or an official rating from third-party ATS vendors such as Workday, Greenhouse, Lever, or Taleo.';

/**
 * Computes deterministic ATS Report
 */
export function evaluateResume(
  resume: ExtractedResumeText,
  jobDesc: ParsedJobDescription
): FullAtsReport {
  const isJobSpecific = jobDesc.hasIdentifiableRequirements || (jobDesc.keywords.length >= 3 && jobDesc.rawText.length >= 50);

  if (isJobSpecific) {
    return evaluateJobSpecificMatch(resume, jobDesc);
  } else {
    return evaluateGeneralQuality(resume);
  }
}

/**
 * 1. Job-Specific ATS Match Evaluation
 * Standard formula:
 * - Required skill match: 35 points (or 45 points if no preferred skills in JD)
 * - Preferred skill match: 15 points (redistributed if absent)
 * - Relevant experience: 15 points (or 20 points if redistributed; evaluated via projects if entry-level)
 * - Project & achievement relevance: 10 points
 * - Resume structure & sections: 10 points
 * - Keyword relevance & density: 10 points
 * - Contact & document readability: 5 points
 */
function evaluateJobSpecificMatch(
  resume: ExtractedResumeText,
  jobDesc: ParsedJobDescription
): FullAtsReport {
  const resumeText = resume.rawText.toLowerCase();
  const resumeSkillsNormalized = new Set(resume.extractedSkills.map((s) => normalizeSkill(s)));

  // 1. Required Skills Match
  const requiredTotal = jobDesc.requiredSkills.length;
  const requiredPresent: string[] = [];
  const requiredMissing: string[] = [];

  for (const skill of jobDesc.requiredSkills) {
    const norm = normalizeSkill(skill);
    if (resumeSkillsNormalized.has(norm) || resumeText.includes(norm)) {
      requiredPresent.push(skill);
    } else {
      requiredMissing.push(skill);
    }
  }

  const requiredMatchRatio = requiredTotal > 0 ? requiredPresent.length / requiredTotal : 0.8;
  const hasPreferred = jobDesc.hasIdentifiablePreferred && jobDesc.preferredSkills.length > 0;

  // Weight redistribution if preferred skills are not specified in JD
  const requiredMaxPoints = hasPreferred ? 35 : 45;
  const requiredEarned = Math.round(requiredMatchRatio * requiredMaxPoints);

  const requiredCategory: AtsDetailedCategoryScore = {
    id: 'required-skills',
    label: hasPreferred ? 'Required Skill Match (35 pts)' : 'Required Skill Match (45 pts redistributed)',
    score: Math.round(requiredMatchRatio * 100),
    weight: requiredMaxPoints / 100,
    earnedPoints: requiredEarned,
    maxPoints: requiredMaxPoints,
    status: requiredMatchRatio >= 0.75 ? 'passed' : requiredMatchRatio >= 0.45 ? 'warning' : 'failed',
    details: `Found ${requiredPresent.length} of ${requiredTotal} required skill requirements.`,
    evidence: requiredPresent.slice(0, 8),
    suggestions: requiredMissing.length
      ? [`Incorporate missing required competencies: ${requiredMissing.slice(0, 5).join(', ')}.`]
      : ['Excellent coverage of all core required skills.'],
  };

  // 2. Preferred Skills Match
  let preferredPresent: string[] = [];
  let preferredMissing: string[] = [];
  let preferredCategory: AtsDetailedCategoryScore | null = null;
  let preferredEarned = 0;

  if (hasPreferred) {
    for (const skill of jobDesc.preferredSkills) {
      const norm = normalizeSkill(skill);
      if (resumeSkillsNormalized.has(norm) || resumeText.includes(norm)) {
        preferredPresent.push(skill);
      } else {
        preferredMissing.push(skill);
      }
    }
    const prefRatio = jobDesc.preferredSkills.length > 0 ? preferredPresent.length / jobDesc.preferredSkills.length : 1;
    preferredEarned = Math.round(prefRatio * 15);
    preferredCategory = {
      id: 'preferred-skills',
      label: 'Preferred / Bonus Skills (15 pts)',
      score: Math.round(prefRatio * 100),
      weight: 0.15,
      earnedPoints: preferredEarned,
      maxPoints: 15,
      status: prefRatio >= 0.6 ? 'passed' : prefRatio >= 0.3 ? 'warning' : 'failed',
      details: `Found ${preferredPresent.length} of ${jobDesc.preferredSkills.length} preferred bonus skills.`,
      evidence: preferredPresent.slice(0, 6),
      suggestions: preferredMissing.length
        ? [`Bonus keywords to add if you have practical experience: ${preferredMissing.slice(0, 4).join(', ')}.`]
        : ['All preferred bonus qualifications present.'],
    };
  }

  // 3. Relevant Experience Match (15 pts, or 20 pts if redistributed)
  const experienceMaxPoints = hasPreferred ? 15 : 20;
  let experienceScorePct = 0;

  if (jobDesc.isEntryLevel) {
    // For entry-level / intern roles, evaluate relevant projects and education equally without penalizing missing formal employment
    if (resume.sections.hasProjects && resume.sections.hasEducation) {
      experienceScorePct = 100;
    } else if (resume.sections.hasProjects || resume.sections.hasExperience) {
      experienceScorePct = 85;
    } else {
      experienceScorePct = 35;
    }
  } else {
    // Standard role
    if (resume.sections.hasExperience && resume.sections.hasProjects) {
      experienceScorePct = 100;
    } else if (resume.sections.hasExperience) {
      experienceScorePct = 80;
    } else if (resume.sections.hasProjects) {
      experienceScorePct = 60;
    } else {
      experienceScorePct = 25;
    }
  }

  const experienceEarned = Math.round((experienceScorePct / 100) * experienceMaxPoints);
  const experienceCategory: AtsDetailedCategoryScore = {
    id: 'relevant-experience',
    label: jobDesc.isEntryLevel
      ? `Entry-Level Practical Relevance (${experienceMaxPoints} pts)`
      : `Relevant Experience (${experienceMaxPoints} pts)`,
    score: experienceScorePct,
    weight: experienceMaxPoints / 100,
    earnedPoints: experienceEarned,
    maxPoints: experienceMaxPoints,
    status: experienceScorePct >= 75 ? 'passed' : 'warning',
    details: jobDesc.isEntryLevel
      ? 'Target role identified as entry-level/intern. Assessed project competencies, coursework, and practical impact without penalizing missing senior work history.'
      : 'Evaluated hands-on industry work history and role responsibilities.',
    evidence: resume.sections.hasExperience
      ? ['Documented work experience identified.']
      : ['Practical technical projects demonstrate required hands-on competence.'],
    suggestions:
      experienceScorePct < 75
        ? ['Add 1-2 major practical projects or internship records demonstrating hands-on tool usage.']
        : ['Strong alignment with target role expectations.'],
  };

  // 4. Project and Achievement Relevance (10 pts)
  let projScorePct = 0;
  if (resume.sections.hasProjects && resume.extractedMetricsCount >= 2) {
    projScorePct = 100;
  } else if (resume.sections.hasProjects || resume.extractedMetricsCount >= 1) {
    projScorePct = 75;
  } else if (resume.sections.hasExperience) {
    projScorePct = 60;
  } else {
    projScorePct = 20;
  }
  const projEarned = Math.round((projScorePct / 100) * 10);
  const projectCategory: AtsDetailedCategoryScore = {
    id: 'project-relevance',
    label: 'Projects & Measurable Accomplishments (10 pts)',
    score: projScorePct,
    weight: 0.1,
    earnedPoints: projEarned,
    maxPoints: 10,
    status: projScorePct >= 75 ? 'passed' : 'warning',
    details: `Detected ${resume.extractedMetricsCount} quantified achievement metric${resume.extractedMetricsCount === 1 ? '' : 's'} (percentages, numbers, or performance indicators).`,
    evidence: resume.extractedMetricsCount > 0 ? [`${resume.extractedMetricsCount} quantified metrics found in bullets.`] : [],
    suggestions:
      resume.extractedMetricsCount < 2
        ? ['Quantify project outcomes with numbers (e.g. "Reduced load time by 35%", "Served 500+ active users").']
        : ['Measurable project impact effectively demonstrated.'],
  };

  // 5. Resume Structure & Section Completeness (10 pts)
  const requiredSections = ['hasContact', 'hasEducation', 'hasSkills'] as const;
  let structurePassed = 0;
  for (const s of requiredSections) {
    if (resume.sections[s]) structurePassed++;
  }
  if (resume.sections.hasExperience || resume.sections.hasProjects) structurePassed++;
  if (resume.sections.hasSummary) structurePassed += 0.5;

  const structurePct = Math.min(100, Math.round((structurePassed / 4.5) * 100));
  const structureEarned = Math.round((structurePct / 100) * 10);
  const structureCategory: AtsDetailedCategoryScore = {
    id: 'resume-structure',
    label: 'Standard Resume Structure & Sections (10 pts)',
    score: structurePct,
    weight: 0.1,
    earnedPoints: structureEarned,
    maxPoints: 10,
    status: structurePct >= 80 ? 'passed' : 'warning',
    details: `Detected ${resume.sections.detectedSectionHeaders.length} recognized standard sections.`,
    evidence: resume.sections.detectedSectionHeaders,
    suggestions: resume.sections.missingStandardHeaders.length
      ? [`Missing standard sections: ${resume.sections.missingStandardHeaders.join(', ')}.`]
      : ['All core ATS sections present.'],
  };

  // 6. Keyword Relevance & Density (10 pts)
  const matchedKeywords: AtsKeywordItem[] = [];
  const missingKeywords: AtsMissingKeywordItem[] = [];

  for (const kw of jobDesc.keywords) {
    const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi');
    const matches = resumeText.match(regex);
    if (matches && matches.length > 0) {
      matchedKeywords.push({
        term: kw,
        count: matches.length,
        category: 'domain-tech',
      });
    } else {
      missingKeywords.push({
        term: kw,
        category: 'domain-tech',
        importance: missingKeywords.length < 3 ? 'high' : 'medium',
        whyItMatters: 'Frequent keyword found in target job description.',
      });
    }
  }

  const keywordCoverage = jobDesc.keywords.length > 0 ? matchedKeywords.length / jobDesc.keywords.length : 0.75;
  const keywordScorePct = Math.min(100, Math.round(keywordCoverage * 100));
  const keywordEarned = Math.round((keywordScorePct / 100) * 10);
  const keywordCategory: AtsDetailedCategoryScore = {
    id: 'keyword-relevance',
    label: 'Keyword Relevance & Density (10 pts)',
    score: keywordScorePct,
    weight: 0.1,
    earnedPoints: keywordEarned,
    maxPoints: 10,
    status: keywordScorePct >= 70 ? 'passed' : keywordScorePct >= 40 ? 'warning' : 'failed',
    details: `Matched ${matchedKeywords.length} of ${jobDesc.keywords.length} job-specific keywords.`,
    evidence: matchedKeywords.slice(0, 8).map((k) => `${k.term} (${k.count}x)`),
    suggestions: missingKeywords.length
      ? [`Consider weaving in natural terms like "${missingKeywords.slice(0, 4).map((k) => k.term).join('", "')}".`]
      : ['Strong keyword density without artificial stuffing.'],
  };

  // 7. Contact & Document Readability (5 pts)
  let contactScorePct = 0;
  if (resume.contact.email) contactScorePct += 40;
  if (resume.contact.phone) contactScorePct += 30;
  if (resume.contact.fullName) contactScorePct += 15;
  if (resume.contact.location) contactScorePct += 15;
  if (resume.isScanned && !resume.isOcrApplied) contactScorePct = 0;

  const contactEarned = Math.round((contactScorePct / 100) * 5);
  const contactCategory: AtsDetailedCategoryScore = {
    id: 'contact-readability',
    label: 'Contact & Document Readability (5 pts)',
    score: contactScorePct,
    weight: 0.05,
    earnedPoints: contactEarned,
    maxPoints: 5,
    status: contactScorePct >= 70 ? 'passed' : 'warning',
    details:
      contactScorePct >= 70
        ? 'Contact details cleanly extractable by automated parser.'
        : 'Missing critical contact fields (e.g. Email or Phone).',
    evidence: [
      resume.contact.email ? `Email: ${resume.contact.email}` : 'Email missing',
      resume.contact.phone ? `Phone: ${resume.contact.phone}` : 'Phone missing',
    ],
    suggestions:
      contactScorePct < 70
        ? ['Add email and phone directly under your name in standard plain text.']
        : ['Contact information verified.'],
  };

  const categories: AtsDetailedCategoryScore[] = [
    requiredCategory,
    ...(preferredCategory ? [preferredCategory] : []),
    experienceCategory,
    projectCategory,
    structureCategory,
    keywordCategory,
    contactCategory,
  ];

  const rawTotal = categories.reduce((sum, c) => sum + c.earnedPoints, 0);
  const overallScore = Math.min(100, Math.max(10, Math.round(rawTotal)));

  // Generate score label and interpretation
  let scoreLabel = 'Needs Improvement';
  let scoreExplanation = 'The resume has noticeable gaps in required skills and keywords for this target role.';
  if (overallScore >= 85) {
    scoreLabel = 'Exceptional Match';
    scoreExplanation = 'The resume closely mirrors the target role requirements and exhibits strong ATS parsability.';
  } else if (overallScore >= 72) {
    scoreLabel = 'Strong Candidate';
    scoreExplanation = 'Solid coverage of essential skills and experience, with minor optimization opportunities.';
  } else if (overallScore >= 58) {
    scoreLabel = 'Competitive';
    scoreExplanation = 'Meets several baseline qualifications but misses key required skills or domain keywords.';
  }

  // Compatibility and warnings audit
  const compatibilityWarnings = checkAtsCompatibility(resume);

  // Strengths and weaknesses
  const strengths: string[] = [];
  if (requiredMatchRatio >= 0.75) strengths.push(`High coverage of required skills (${requiredPresent.length} core skills verified).`);
  if (resume.extractedMetricsCount >= 2) strengths.push(`Quantifiable metrics (${resume.extractedMetricsCount} performance indicators) strengthen project impact.`);
  if (structurePct >= 85) strengths.push('Clean section hierarchy complies with standard corporate ATS parsers.');
  if (resume.contact.email && resume.contact.phone) strengths.push('Direct contact channels (email and telephone) are readily extractable.');

  const weaknesses: string[] = [];
  if (requiredMissing.length > 0) weaknesses.push(`Missing ${requiredMissing.length} required skill${requiredMissing.length > 1 ? 's' : ''}: ${requiredMissing.slice(0, 4).join(', ')}.`);
  if (resume.extractedMetricsCount === 0) weaknesses.push('No measurable metrics or numerical outcomes found in bullet points.');
  if (keywordScorePct < 60) weaknesses.push('Keyword density is below optimal target threshold for this specific job description.');

  // Action checklist
  const actionChecklist: AtsActionItem[] = [];
  if (requiredMissing.length > 0) {
    actionChecklist.push({
      id: 'fix-required-skills',
      priority: 'high',
      category: 'Skills Match',
      title: 'Incorporate Missing Required Technologies',
      description: `Integrate ${requiredMissing.slice(0, 3).join(', ')} into your Skills section or project bullets if you possess practical experience with them.`,
      impact: '+15–25 pts',
    });
  }
  if (resume.extractedMetricsCount < 2) {
    actionChecklist.push({
      id: 'add-metrics',
      priority: 'high',
      category: 'Impact Metrics',
      title: 'Quantify Project & Role Outcomes',
      description: 'Add specific numbers, percentage gains, time savings, or user volumes (e.g., "Increased test coverage to 92%").',
      impact: '+8–12 pts',
    });
  }
  if (!resume.sections.hasSummary) {
    actionChecklist.push({
      id: 'add-summary',
      priority: 'medium',
      category: 'Header Profile',
      title: 'Include a 2-Sentence Professional Summary',
      description: 'A focused summary at the top highlights your target role and immediately indexes critical keywords.',
      impact: '+5–8 pts',
    });
  }
  if (missingKeywords.length > 0) {
    actionChecklist.push({
      id: 'align-keywords',
      priority: 'medium',
      category: 'Keyword Optimization',
      title: 'Align Vocabulary with Job Posting',
      description: `Use exact terminology from the posting (e.g. "${missingKeywords[0].term}") where appropriate.`,
      impact: '+5–10 pts',
    });
  }

  // Summary
  const summary = generateAtsSummary({
    overallScore,
    isJobSpecific: true,
    jobTitle: jobDesc.jobTitle,
    company: jobDesc.company,
    requiredPresent,
    requiredMissing,
    metricsCount: resume.extractedMetricsCount,
    wordCount: resume.wordCount,
  });

  return {
    id: `ats-${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    mode: 'job-specific',
    overallScore,
    scoreLabel,
    scoreExplanation,
    jobTitle: jobDesc.jobTitle,
    company: jobDesc.company,
    sourceType: resume.sourceType,
    fileName: resume.fileName,
    categories,
    requiredSkillsMatch: {
      present: requiredPresent,
      missing: requiredMissing,
      percentage: Math.round(requiredMatchRatio * 100),
    },
    preferredSkillsMatch: {
      present: preferredPresent,
      missing: preferredMissing,
      percentage: hasPreferred ? Math.round((preferredPresent.length / jobDesc.preferredSkills.length) * 100) : 100,
    },
    matchedKeywords,
    missingKeywords,
    strengths,
    weaknesses,
    compatibilityWarnings,
    actionChecklist,
    summary,
    disclaimer: ATS_DISCLAIMER,
  };
}

/**
 * 2. General Resume Quality Evaluation (When no Job Description is provided)
 * Documented formula:
 * - Contact & Header Information: 15 points
 * - Professional Summary & Objective: 10 points
 * - Academic & Educational Credentials: 20 points
 * - Experience & Practical Project Impact: 25 points (projects count equally for student/entry-level)
 * - Technical & Core Skills Depth: 20 points
 * - Standard ATS Structure & Parsability: 10 points
 */
function evaluateGeneralQuality(resume: ExtractedResumeText): FullAtsReport {
  // 1. Contact (15 pts)
  let contactScore = 0;
  if (resume.contact.fullName) contactScore += 30;
  if (resume.contact.email) contactScore += 35;
  if (resume.contact.phone) contactScore += 20;
  if (resume.contact.location) contactScore += 15;
  const contactEarned = Math.round((contactScore / 100) * 15);
  const contactCategory: AtsDetailedCategoryScore = {
    id: 'gen-contact',
    label: 'Contact & Header Information (15 pts)',
    score: contactScore,
    weight: 0.15,
    earnedPoints: contactEarned,
    maxPoints: 15,
    status: contactScore >= 80 ? 'passed' : 'warning',
    details: contactScore === 100 ? 'All key contact information found.' : 'Some contact fields missing.',
    evidence: [
      resume.contact.fullName ? `Name: ${resume.contact.fullName}` : 'Name missing',
      resume.contact.email ? `Email: ${resume.contact.email}` : 'Email missing',
      resume.contact.phone ? `Phone: ${resume.contact.phone}` : 'Phone missing',
    ],
    suggestions: contactScore < 80 ? ['Include full name, email, phone number, and city/state in header.'] : [],
  };

  // 2. Summary (10 pts)
  let summaryScore = 0;
  if (resume.sections.hasSummary) summaryScore = 100;
  else summaryScore = 20;
  const summaryEarned = Math.round((summaryScore / 100) * 10);
  const summaryCategory: AtsDetailedCategoryScore = {
    id: 'gen-summary',
    label: 'Professional Summary & Headline (10 pts)',
    score: summaryScore,
    weight: 0.1,
    earnedPoints: summaryEarned,
    maxPoints: 10,
    status: summaryScore >= 70 ? 'passed' : 'warning',
    details: resume.sections.hasSummary ? 'Clear introductory profile summary detected.' : 'No summary header identified.',
    evidence: resume.sections.hasSummary ? ['Professional summary present.'] : [],
    suggestions: !resume.sections.hasSummary ? ['Add a 2-sentence career summary highlighting your target role and key technical focus.'] : [],
  };

  // 3. Education (20 pts)
  let eduScore = 0;
  if (resume.sections.hasEducation) eduScore = 100;
  else eduScore = 20;
  const eduEarned = Math.round((eduScore / 100) * 20);
  const eduCategory: AtsDetailedCategoryScore = {
    id: 'gen-education',
    label: 'Academic & Educational Credentials (20 pts)',
    score: eduScore,
    weight: 0.2,
    earnedPoints: eduEarned,
    maxPoints: 20,
    status: eduScore >= 70 ? 'passed' : 'failed',
    details: resume.sections.hasEducation ? 'Formal education section detected with degree information.' : 'Missing education section.',
    evidence: resume.sections.hasEducation ? ['Education section detected.'] : [],
    suggestions: !resume.sections.hasEducation ? ['Add your university, degree, major, and graduation year.'] : [],
  };

  // 4. Experience & Projects Impact (25 pts)
  let expScore = 0;
  if (resume.sections.hasExperience && resume.sections.hasProjects) expScore = 100;
  else if (resume.sections.hasProjects && resume.extractedMetricsCount >= 1) expScore = 90;
  else if (resume.sections.hasProjects || resume.sections.hasExperience) expScore = 75;
  else expScore = 25;
  const expEarned = Math.round((expScore / 100) * 25);
  const expCategory: AtsDetailedCategoryScore = {
    id: 'gen-experience',
    label: 'Experience & Practical Project Impact (25 pts)',
    score: expScore,
    weight: 0.25,
    earnedPoints: expEarned,
    maxPoints: 25,
    status: expScore >= 75 ? 'passed' : 'warning',
    details: `Evaluated practical work history and projects with ${resume.extractedMetricsCount} quantified achievement metrics.`,
    evidence: resume.sections.hasProjects ? ['Hands-on project work verified.'] : [],
    suggestions: resume.extractedMetricsCount === 0 ? ['Add quantifiable figures (e.g. %, users, latency) to demonstrate tangible impact.'] : [],
  };

  // 5. Skills Depth (20 pts)
  const skillCount = resume.extractedSkills.length;
  let skillScore = 0;
  if (skillCount >= 8) skillScore = 100;
  else if (skillCount >= 4) skillScore = 75;
  else if (skillCount >= 1) skillScore = 40;
  else skillScore = 15;
  const skillEarned = Math.round((skillScore / 100) * 20);
  const skillCategory: AtsDetailedCategoryScore = {
    id: 'gen-skills',
    label: 'Technical & Domain Skills Depth (20 pts)',
    score: skillScore,
    weight: 0.2,
    earnedPoints: skillEarned,
    maxPoints: 20,
    status: skillScore >= 75 ? 'passed' : 'warning',
    details: `Indexed ${skillCount} recognized technical and professional skills.`,
    evidence: resume.extractedSkills.slice(0, 10),
    suggestions: skillCount < 6 ? ['Add 4-6 additional domain tools, frameworks, or languages to your skills section.'] : [],
  };

  // 6. Structure & Parsability (10 pts)
  const structureEarned = resume.isScanned && !resume.isOcrApplied ? 0 : 10;
  const structureCategory: AtsDetailedCategoryScore = {
    id: 'gen-structure',
    label: 'Standard ATS Hierarchy & Layout (10 pts)',
    score: structureEarned * 10,
    weight: 0.1,
    earnedPoints: structureEarned,
    maxPoints: 10,
    status: structureEarned >= 8 ? 'passed' : 'failed',
    details: 'Single & dual column linear hierarchy compliant with standard machine readers.',
    evidence: resume.sections.detectedSectionHeaders,
    suggestions: [],
  };

  const categories = [contactCategory, summaryCategory, eduCategory, expCategory, skillCategory, structureCategory];
  const overallScore = Math.min(100, Math.max(10, categories.reduce((sum, c) => sum + c.earnedPoints, 0)));

  let scoreLabel = 'General Quality: Needs Work';
  if (overallScore >= 85) scoreLabel = 'General Quality: Excellent';
  else if (overallScore >= 70) scoreLabel = 'General Quality: Solid Candidate';
  else if (overallScore >= 55) scoreLabel = 'General Quality: Moderate';

  const compatibilityWarnings = checkAtsCompatibility(resume);

  const matchedKeywords: AtsKeywordItem[] = resume.extractedSkills.slice(0, 15).map((s) => ({
    term: s,
    count: 1,
    category: 'domain-tech',
  }));

  const strengths: string[] = [];
  if (eduScore === 100) strengths.push('Education credentials clearly defined.');
  if (skillCount >= 6) strengths.push(`Strong technical skill depth (${skillCount} keywords indexed).`);
  if (resume.extractedMetricsCount > 0) strengths.push('Contains quantifiable outcome metrics.');

  const weaknesses: string[] = [];
  if (!resume.sections.hasSummary) weaknesses.push('Lacks an executive summary/objective statement.');
  if (resume.extractedMetricsCount === 0) weaknesses.push('Bullets could be strengthened with measurable numbers and percentages.');
  if (skillCount < 5) weaknesses.push('Relatively few technical competencies indexed.');

  const actionChecklist: AtsActionItem[] = [
    {
      id: 'paste-jd',
      priority: 'high',
      category: 'Job Matching',
      title: 'Paste a Real Job Description for Role-Specific Analysis',
      description: 'Unlock exact required vs. preferred skill match percentages and missing keyword diagnostics by entering a target job description.',
      impact: 'Targeted Match',
    },
    {
      id: 'expand-metrics',
      priority: 'medium',
      category: 'Impact Metrics',
      title: 'Include Quantifiable Outcomes in Bullet Points',
      description: 'Strengthen project descriptions with metrics (e.g. "Reduced API latency by 40%").',
      impact: '+5–10 pts',
    },
  ];

  const summary = generateAtsSummary({
    overallScore,
    isJobSpecific: false,
    metricsCount: resume.extractedMetricsCount,
    wordCount: resume.wordCount,
  });

  return {
    id: `ats-${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    mode: 'general-quality',
    overallScore,
    scoreLabel,
    scoreExplanation: 'General resume quality analysis evaluated without a target job description. Paste a target job description to obtain role-specific keyword matching.',
    sourceType: resume.sourceType,
    fileName: resume.fileName,
    categories,
    requiredSkillsMatch: {
      present: resume.extractedSkills,
      missing: [],
      percentage: skillCount >= 8 ? 100 : Math.round((skillCount / 8) * 100),
    },
    preferredSkillsMatch: {
      present: [],
      missing: [],
      percentage: 100,
    },
    matchedKeywords,
    missingKeywords: [],
    strengths,
    weaknesses,
    compatibilityWarnings,
    actionChecklist,
    summary,
    disclaimer: ATS_DISCLAIMER,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
