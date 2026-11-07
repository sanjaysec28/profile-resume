/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Shared Resume Content Sanitizer & Integrity Pipeline (Phase D.5.1.1)
 * Enforces strict content integrity, anti-hallucination, deduplication,
 * removal of unresolved bracketed placeholders, and refusal message scrubbing.
 * Applied at shared boundaries: AI Assistant -> State -> Storage -> Preview -> PDF.
 */

import { ResumeData, ResumeExperience, ResumeProject, ResumeEducation } from '../../../types/resume.ts';

// Refusal / Conversational patterns that must NEVER enter resume content
const CONVERSATIONAL_PATTERNS: RegExp[] = [
  /^(?:as an ai language model|as an ai|as a large language model|as a language model)[^:\n.]*?[:\n.]\s*/i,
  /^(?:i cannot fulfill|i am unable to|i apologize, but|i'm sorry, but|i can't assist with)[^:\n.]*?[:\n.]\s*/i,
  /^(?:sure, here is|certainly! here is|here is a tailored|here is an improved|here is the refined|here are the updated)[^:\n.]*?[:\n.]\s*/i,
  /^(?:here is|here are|below is|below are) (?:a|the) (?:draft|summary|bullets?|version)[^:\n.]*?[:\n.]\s*/i,
  /(?:\n|^)(?:note:|please note:|disclaimer:|tip:)[^\n]*$/i,
  /(?:\n|^)(?:hope this helps!|let me know if you (?:need|would like)|feel free to ask)[^\n]*$/i,
];

// Placeholder patterns (e.g., [improved efficiency by X%], [X%], [Company Name], [Insert ...])
const UNRESOLVED_PLACEHOLDER_REGEXES: { regex: RegExp; replacement: string }[] = [
  // [improved efficiency by X%] -> improved efficiency
  { regex: /\[improved efficiency by X%\]/gi, replacement: 'improved efficiency' },
  { regex: /achieving \[improved efficiency by X%\]\.?/gi, replacement: 'achieving measurable workflow improvements.' },
  // [X%] or [X] -> significant
  { regex: /by \[X%\]/gi, replacement: 'significantly' },
  { regex: /\[X%\]/gi, replacement: 'measurable impact' },
  { regex: /\[X\]/gi, replacement: 'key' },
  { regex: /\[N\]/gi, replacement: 'multiple' },
  // [Insert Company / Project / Tool Name]
  { regex: /\[Insert\s+[^\]]+\]/gi, replacement: '' },
  { regex: /\[Tool\s+Name\]/gi, replacement: 'industry tools' },
  { regex: /\[Company\s+Name\]/gi, replacement: 'organization' },
  { regex: /\[Metric\s+[^\]]+\]/gi, replacement: 'measurable outcomes' },
  { regex: /\[Month,\s*Year\]/gi, replacement: '' },
  { regex: /\[Date\]/gi, replacement: '' },
  // Generic bracketed placeholders like [any words here with % or placeholder]
  {
    regex: /\[[a-zA-Z0-9\s,%_\-]{2,40}\]/g,
    replacement: ((match: string) => {
      // If it looks like a metric placeholder like [increased by 20%] where user provided real number, keep it without brackets!
      const inner = match.slice(1, -1).trim();
      if (/\d+/.test(inner)) {
        return inner; // user wrote real numbers inside brackets
      }
      // Otherwise strip brackets or provide clean term
      if (/efficiency|speed|performance|latency/i.test(inner)) {
        return inner.replace(/by\s+X%?/i, 'measurably');
      }
      return '';
    }) as unknown as string,
  },
];

// Generic statement patterns (clichés, weak passive phrases)
const GENERIC_STATEMENT_PATTERNS: { regex: RegExp; label: string; suggestion: string }[] = [
  {
    regex: /\b(?:responsible for (?:various|all|multiple|day[- ]to[- ]day|assigned)?)\b/i,
    label: 'Passive responsibility phrasing',
    suggestion: 'Replace with direct action verbs such as "Orchestrated", "Engineered", "Maintained", or "Implemented".',
  },
  {
    regex: /\b(?:duties (?:included|consisted of))\b/i,
    label: 'Job description duty phrasing',
    suggestion: 'Replace passive duties with measurable technical contributions and tools used.',
  },
  {
    regex: /\b(?:hardworking|results[- ]oriented|team player|fast learner|detail[- ]oriented|go[- ]getter)\b/i,
    label: 'Cliché soft-skill filler',
    suggestion: 'Demonstrate competencies through concrete projects and outcomes instead of self-descriptive buzzwords.',
  },
  {
    regex: /\b(?:helped with|assisted in|worked on|contributed to)\b/i,
    label: 'Diminishing action phrasing',
    suggestion: 'Specify your exact ownership (e.g. "Co-developed", "Designed modular components for", "Wrote unit tests for").',
  },
  {
    regex: /\b(?:various tasks|various technologies|etc\.|and so on)\b/i,
    label: 'Vague non-specific terminology',
    suggestion: 'List specific technologies, protocols, or frameworks utilized.',
  },
];

export interface QualityIssue {
  id: string;
  section: string;
  itemId?: string;
  itemTitle?: string;
  field: string;
  severity: 'critical' | 'warning' | 'suggestion';
  issueType:
    | 'duplicate_bullet'
    | 'conversational_refusal'
    | 'unresolved_placeholder'
    | 'empty_description'
    | 'generic_statement'
    | 'excessive_repetition';
  title: string;
  message: string;
  originalSnippet: string;
  suggestedFix?: string;
}

export interface ResumeQualityAuditReport {
  overallScore: number;
  status: 'excellent' | 'needs_attention' | 'critical_issues';
  issues: QualityIssue[];
  summary: {
    criticalCount: number;
    warningCount: number;
    suggestionCount: number;
    duplicateBulletsCount: number;
    placeholdersCount: number;
    conversationalCount: number;
    emptyDescriptionsCount: number;
    genericStatementsCount: number;
  };
  isClean: boolean;
}

/**
 * Strips AI refusal messages, conversational meta-talk, and pleasantries.
 */
export function filterRefusalAndConversationalText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  for (const pattern of CONVERSATIONAL_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').trim();
  }

  // Strip leading/trailing markdown code blocks if raw response leaked
  cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

  return cleaned;
}

/**
 * Detects if a text contains AI refusal messages or conversational meta-talk.
 */
export function containsConversationalOrRefusalText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(text.trim()));
}

/**
 * Detects if a text contains unresolved bracketed placeholders.
 */
export function containsUnresolvedPlaceholders(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  // Match bracketed terms like [X%], [improved efficiency by X%], [Tool Name], [Company Name], etc.
  return /\[[a-zA-Z0-9\s,%_\-\.]{1,50}\]/.test(text);
}

/**
 * Removes unresolved bracketed placeholders unless replaced with genuine information.
 */
export function cleanUnresolvedPlaceholders(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  for (const item of UNRESOLVED_PLACEHOLDER_REGEXES) {
    if (typeof item.replacement === 'function') {
      cleaned = cleaned.replace(item.regex, item.replacement);
    } else {
      cleaned = cleaned.replace(item.regex, item.replacement);
    }
  }

  // Clean up any double spaces or stranded punctuation left after removal
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();

  return cleaned;
}

/**
 * Deduplicates bullet points and removes bullets identical to the section description.
 */
export function deduplicateBulletPoints(
  bullets: string[] | undefined,
  description?: string
): string[] {
  if (!bullets || !Array.isArray(bullets)) return [];

  const descNormalized = description ? description.trim().toLowerCase().replace(/[.\s]+/g, '') : '';
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawBullet of bullets) {
    if (!rawBullet || typeof rawBullet !== 'string') continue;
    
    // Clean bullet markers
    const cleaned = cleanUnresolvedPlaceholders(
      filterRefusalAndConversationalText(
        rawBullet.replace(/^[•\-\*]\s*/, '').trim()
      )
    );

    if (!cleaned || cleaned.length < 3) continue;

    const normalized = cleaned.toLowerCase().replace(/[.\s]+/g, '');
    
    // Check if this bullet repeats the main description or an already seen bullet
    if (descNormalized && normalized === descNormalized) {
      continue;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(cleaned);
    }
  }

  return result;
}

/**
 * Performs a comprehensive content quality audit across the entire resume.
 * Pure function: never mutates input.
 */
export function auditResumeContentQuality(
  data: ResumeData,
  targetRole?: string
): ResumeQualityAuditReport {
  const issues: QualityIssue[] = [];

  // 1. Audit Personal Info & Summary
  if (data.personalInfo) {
    const summary = data.personalInfo.summary || '';
    if (containsConversationalOrRefusalText(summary)) {
      issues.push({
        id: 'issue-summary-refusal',
        section: 'summary',
        field: 'summary',
        severity: 'critical',
        issueType: 'conversational_refusal',
        title: 'Conversational AI Text in Summary',
        message: 'Summary contains conversational AI preambles or refusal text that should not appear on a professional resume.',
        originalSnippet: summary.slice(0, 80),
        suggestedFix: filterRefusalAndConversationalText(summary),
      });
    }

    if (containsUnresolvedPlaceholders(summary)) {
      issues.push({
        id: 'issue-summary-placeholder',
        section: 'summary',
        field: 'summary',
        severity: 'warning',
        issueType: 'unresolved_placeholder',
        title: 'Unresolved Placeholder in Summary',
        message: 'Summary contains bracketed placeholders such as [X%] or [Tool Name].',
        originalSnippet: summary.match(/\[.*?\]/)?.[0] || summary.slice(0, 60),
        suggestedFix: cleanUnresolvedPlaceholders(summary),
      });
    }

    for (const generic of GENERIC_STATEMENT_PATTERNS) {
      if (generic.regex.test(summary)) {
        issues.push({
          id: `issue-summary-generic-${generic.label.replace(/\s+/g, '-').toLowerCase()}`,
          section: 'summary',
          field: 'summary',
          severity: 'suggestion',
          issueType: 'generic_statement',
          title: generic.label,
          message: `${generic.suggestion} Found in professional summary.`,
          originalSnippet: summary.match(generic.regex)?.[0] || 'Generic statement',
          suggestedFix: summary.replace(generic.regex, (m) => m.toLowerCase().includes('responsible for') ? 'Led' : 'demonstrating proficiency in'),
        });
        break;
      }
    }
  }

  // 2. Audit Projects
  (data.projects || []).forEach((proj, pIdx) => {
    const pTitle = proj.title?.trim() || `Project ${pIdx + 1}`;
    const pDesc = proj.description?.trim() || '';
    const bullets = proj.bullets || [];

    // Check empty/incomplete project description
    if (pDesc.length < 15 && bullets.length === 0) {
      issues.push({
        id: `issue-project-${proj.id || pIdx}-empty`,
        section: 'projects',
        itemId: proj.id,
        itemTitle: pTitle,
        field: 'description',
        severity: 'critical',
        issueType: 'empty_description',
        title: `Incomplete Project: ${pTitle}`,
        message: `Project "${pTitle}" has no description or bullet points. Recruiters and ATS require concrete details on what was engineered.`,
        originalSnippet: pDesc || '(Empty description)',
        suggestedFix: `Architected and developed ${pTitle} using modern design patterns, focusing on robust functionality and code quality.`,
      });
    }

    // Conversational text in project
    if (containsConversationalOrRefusalText(pDesc)) {
      issues.push({
        id: `issue-project-${proj.id || pIdx}-refusal`,
        section: 'projects',
        itemId: proj.id,
        itemTitle: pTitle,
        field: 'description',
        severity: 'critical',
        issueType: 'conversational_refusal',
        title: `AI Meta-Text in Project: ${pTitle}`,
        message: 'Project description contains AI conversational response phrasing.',
        originalSnippet: pDesc.slice(0, 80),
        suggestedFix: filterRefusalAndConversationalText(pDesc),
      });
    }

    // Placeholders in project description
    if (containsUnresolvedPlaceholders(pDesc)) {
      issues.push({
        id: `issue-project-${proj.id || pIdx}-placeholder-desc`,
        section: 'projects',
        itemId: proj.id,
        itemTitle: pTitle,
        field: 'description',
        severity: 'warning',
        issueType: 'unresolved_placeholder',
        title: `Unresolved Placeholder in ${pTitle}`,
        message: 'Project description contains unresolved bracketed placeholders.',
        originalSnippet: pDesc.match(/\[.*?\]/)?.[0] || pDesc.slice(0, 60),
        suggestedFix: cleanUnresolvedPlaceholders(pDesc),
      });
    }

    // Duplicate bullets within project or repeating description
    const seenBullets = new Set<string>();
    const descNorm = pDesc.toLowerCase().replace(/[.\s]+/g, '');

    bullets.forEach((b, bIdx) => {
      const bNorm = b.toLowerCase().replace(/[•\-\*.\s]+/g, '');
      if (!bNorm) return;

      if (descNorm && bNorm === descNorm) {
        issues.push({
          id: `issue-project-${proj.id || pIdx}-b${bIdx}-dup-desc`,
          section: 'projects',
          itemId: proj.id,
          itemTitle: pTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'duplicate_bullet',
          title: `Duplicate Bullet in ${pTitle}`,
          message: 'Bullet point duplicates the project description verbatim.',
          originalSnippet: b,
        });
      } else if (seenBullets.has(bNorm)) {
        issues.push({
          id: `issue-project-${proj.id || pIdx}-b${bIdx}-dup`,
          section: 'projects',
          itemId: proj.id,
          itemTitle: pTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'duplicate_bullet',
          title: `Repeated Bullet in ${pTitle}`,
          message: 'Identical bullet point repeated multiple times in this project.',
          originalSnippet: b,
        });
      } else {
        seenBullets.add(bNorm);
      }

      if (containsUnresolvedPlaceholders(b)) {
        issues.push({
          id: `issue-project-${proj.id || pIdx}-b${bIdx}-placeholder`,
          section: 'projects',
          itemId: proj.id,
          itemTitle: pTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'unresolved_placeholder',
          title: `Unresolved Placeholder in Bullet: ${pTitle}`,
          message: 'Bullet contains placeholder like [X%] or [Tool Name].',
          originalSnippet: b.match(/\[.*?\]/)?.[0] || b,
          suggestedFix: cleanUnresolvedPlaceholders(b),
        });
      }
    });
  });

  // 3. Audit Experience / Internships
  (data.experience || []).forEach((exp, eIdx) => {
    const eRole = exp.position?.trim() || `Experience ${eIdx + 1}`;
    const eCompany = exp.company?.trim() || '';
    const eTitle = eCompany ? `${eRole} at ${eCompany}` : eRole;
    const eDesc = exp.description?.trim() || '';
    const bullets = exp.bullets || [];

    if (eDesc.length < 15 && bullets.length === 0) {
      issues.push({
        id: `issue-exp-${exp.id || eIdx}-empty`,
        section: 'experience',
        itemId: exp.id,
        itemTitle: eTitle,
        field: 'description',
        severity: 'critical',
        issueType: 'empty_description',
        title: `Incomplete Experience: ${eTitle}`,
        message: `Experience entry has neither description nor bullet points. Specify your core contributions.`,
        originalSnippet: eDesc || '(Empty)',
        suggestedFix: `Contributed to software development and engineering workflows at ${eCompany || 'organization'}, collaborating on production tasks.`,
      });
    }

    if (containsConversationalOrRefusalText(eDesc)) {
      issues.push({
        id: `issue-exp-${exp.id || eIdx}-refusal`,
        section: 'experience',
        itemId: exp.id,
        itemTitle: eTitle,
        field: 'description',
        severity: 'critical',
        issueType: 'conversational_refusal',
        title: `AI Meta-Text in Experience: ${eTitle}`,
        message: 'Experience description contains conversational AI response text.',
        originalSnippet: eDesc.slice(0, 80),
        suggestedFix: filterRefusalAndConversationalText(eDesc),
      });
    }

    if (containsUnresolvedPlaceholders(eDesc)) {
      issues.push({
        id: `issue-exp-${exp.id || eIdx}-placeholder-desc`,
        section: 'experience',
        itemId: exp.id,
        itemTitle: eTitle,
        field: 'description',
        severity: 'warning',
        issueType: 'unresolved_placeholder',
        title: `Unresolved Placeholder in ${eTitle}`,
        message: 'Experience description contains bracketed placeholders.',
        originalSnippet: eDesc.match(/\[.*?\]/)?.[0] || eDesc.slice(0, 60),
        suggestedFix: cleanUnresolvedPlaceholders(eDesc),
      });
    }

    const seenExpBullets = new Set<string>();
    const descNorm = eDesc.toLowerCase().replace(/[.\s]+/g, '');

    bullets.forEach((b, bIdx) => {
      const bNorm = b.toLowerCase().replace(/[•\-\*.\s]+/g, '');
      if (!bNorm) return;

      if (descNorm && bNorm === descNorm) {
        issues.push({
          id: `issue-exp-${exp.id || eIdx}-b${bIdx}-dup-desc`,
          section: 'experience',
          itemId: exp.id,
          itemTitle: eTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'duplicate_bullet',
          title: `Duplicate Bullet in ${eTitle}`,
          message: 'Bullet point duplicates the role description verbatim.',
          originalSnippet: b,
        });
      } else if (seenExpBullets.has(bNorm)) {
        issues.push({
          id: `issue-exp-${exp.id || eIdx}-b${bIdx}-dup`,
          section: 'experience',
          itemId: exp.id,
          itemTitle: eTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'duplicate_bullet',
          title: `Repeated Bullet in ${eTitle}`,
          message: 'Identical bullet point repeated multiple times in this role.',
          originalSnippet: b,
        });
      } else {
        seenExpBullets.add(bNorm);
      }

      if (containsUnresolvedPlaceholders(b)) {
        issues.push({
          id: `issue-exp-${exp.id || eIdx}-b${bIdx}-placeholder`,
          section: 'experience',
          itemId: exp.id,
          itemTitle: eTitle,
          field: `bullets[${bIdx}]`,
          severity: 'warning',
          issueType: 'unresolved_placeholder',
          title: `Unresolved Placeholder in Bullet: ${eTitle}`,
          message: 'Bullet contains placeholder like [X%] or [improved efficiency by X%].',
          originalSnippet: b.match(/\[.*?\]/)?.[0] || b,
          suggestedFix: cleanUnresolvedPlaceholders(b),
        });
      }
    });
  });

  // 4. Audit Education Highlights
  (data.education || []).forEach((edu, eduIdx) => {
    const seenEdu = new Set<string>();
    (edu.highlights || []).forEach((hl, hlIdx) => {
      const hlNorm = hl.toLowerCase().replace(/[•\-\*.\s]+/g, '');
      if (!hlNorm) return;
      if (seenEdu.has(hlNorm)) {
        issues.push({
          id: `issue-edu-${edu.id || eduIdx}-hl${hlIdx}-dup`,
          section: 'education',
          itemId: edu.id,
          itemTitle: edu.institution || 'Education',
          field: `highlights[${hlIdx}]`,
          severity: 'warning',
          issueType: 'duplicate_bullet',
          title: `Duplicate Education Highlight in ${edu.institution || 'Education'}`,
          message: 'Identical highlight listed multiple times.',
          originalSnippet: hl,
        });
      } else {
        seenEdu.add(hlNorm);
      }
    });
  });

  // 5. Audit Achievements
  const seenAchievements = new Set<string>();
  (data.achievements || []).forEach((ach, achIdx) => {
    const achNorm = ach.toLowerCase().replace(/[•\-\*.\s]+/g, '');
    if (!achNorm) return;
    if (seenAchievements.has(achNorm)) {
      issues.push({
        id: `issue-ach-${achIdx}-dup`,
        section: 'achievements',
        field: `achievements[${achIdx}]`,
        severity: 'warning',
        issueType: 'duplicate_bullet',
        title: 'Duplicate Achievement',
        message: 'Identical achievement listed multiple times.',
        originalSnippet: ach,
      });
    } else {
      seenAchievements.add(achNorm);
    }
  });

  // 6. Calculate Summaries and Scores
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const suggestionCount = issues.filter((i) => i.severity === 'suggestion').length;

  const duplicateBulletsCount = issues.filter((i) => i.issueType === 'duplicate_bullet').length;
  const placeholdersCount = issues.filter((i) => i.issueType === 'unresolved_placeholder').length;
  const conversationalCount = issues.filter((i) => i.issueType === 'conversational_refusal').length;
  const emptyDescriptionsCount = issues.filter((i) => i.issueType === 'empty_description').length;
  const genericStatementsCount = issues.filter((i) => i.issueType === 'generic_statement').length;

  // Mathematical scoring: 100 - (critical * 18) - (warnings * 6) - (suggestions * 2)
  const penalty = criticalCount * 18 + warningCount * 6 + suggestionCount * 2;
  const overallScore = Math.max(0, Math.min(100, 100 - penalty));

  let status: 'excellent' | 'needs_attention' | 'critical_issues' = 'excellent';
  if (criticalCount > 0) {
    status = 'critical_issues';
  } else if (warningCount > 0 || overallScore < 85) {
    status = 'needs_attention';
  }

  return {
    overallScore,
    status,
    issues,
    summary: {
      criticalCount,
      warningCount,
      suggestionCount,
      duplicateBulletsCount,
      placeholdersCount,
      conversationalCount,
      emptyDescriptionsCount,
      genericStatementsCount,
    },
    isClean: criticalCount === 0 && warningCount === 0,
  };
}

/**
 * Resolves a specific quality issue on the resume data without touching unrelated items.
 */
export function applyResolvedQualityFix(data: ResumeData, issue: QualityIssue): ResumeData {
  if (!issue) return data;

  if (issue.section === 'summary' && data.personalInfo) {
    const summary = data.personalInfo.summary || '';
    let updatedSummary = summary;
    if (issue.suggestedFix) {
      updatedSummary = issue.suggestedFix;
    } else if (issue.issueType === 'conversational_refusal') {
      updatedSummary = filterRefusalAndConversationalText(summary);
    } else if (issue.issueType === 'unresolved_placeholder') {
      updatedSummary = cleanUnresolvedPlaceholders(summary);
    }

    return {
      ...data,
      personalInfo: {
        ...data.personalInfo,
        summary: updatedSummary,
      },
    };
  }

  if (issue.section === 'projects' && issue.itemId) {
    return {
      ...data,
      projects: (data.projects || []).map((proj) => {
        if (proj.id !== issue.itemId) return proj;

        if (issue.field === 'description') {
          return {
            ...proj,
            description: issue.suggestedFix || cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(proj.description || '')),
          };
        }

        if (issue.issueType === 'duplicate_bullet') {
          return {
            ...proj,
            bullets: deduplicateBulletPoints(proj.bullets, proj.description),
          };
        }

        if (issue.field.startsWith('bullets[')) {
          const match = issue.field.match(/\[(\d+)\]/);
          if (match && proj.bullets) {
            const idx = parseInt(match[1], 10);
            const newBullets = [...proj.bullets];
            if (issue.suggestedFix) {
              newBullets[idx] = issue.suggestedFix;
            } else {
              newBullets.splice(idx, 1);
            }
            return {
              ...proj,
              bullets: newBullets,
            };
          }
        }

        return proj;
      }),
    };
  }

  if (issue.section === 'experience' && issue.itemId) {
    return {
      ...data,
      experience: (data.experience || []).map((exp) => {
        if (exp.id !== issue.itemId) return exp;

        if (issue.field === 'description') {
          return {
            ...exp,
            description: issue.suggestedFix || cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(exp.description || '')),
          };
        }

        if (issue.issueType === 'duplicate_bullet') {
          return {
            ...exp,
            bullets: deduplicateBulletPoints(exp.bullets, exp.description),
          };
        }

        if (issue.field.startsWith('bullets[')) {
          const match = issue.field.match(/\[(\d+)\]/);
          if (match && exp.bullets) {
            const idx = parseInt(match[1], 10);
            const newBullets = [...exp.bullets];
            if (issue.suggestedFix) {
              newBullets[idx] = issue.suggestedFix;
            } else {
              newBullets.splice(idx, 1);
            }
            return {
              ...exp,
              bullets: newBullets,
            };
          }
        }

        return exp;
      }),
    };
  }

  return sanitizeResumeData(data);
}

/**
 * Resolves all safe, non-destructive quality issues (deduplicating bullets, cleaning refusal text,
 * resolving bracketed placeholders with safe phrases) while preserving student data.
 */
export function applyAllSafeQualityFixes(data: ResumeData, issues?: QualityIssue[]): ResumeData {
  return sanitizeResumeData(data);
}

/**
 * Deeply sanitizes an entire ResumeData payload.
 * Pure function: never mutates input.
 */
export function sanitizeResumeData(data: ResumeData): ResumeData {
  if (!data) return data;

  const sanitizedPersonalInfo = {
    ...data.personalInfo,
    fullName: filterRefusalAndConversationalText(data.personalInfo.fullName || ''),
    professionalTitle: filterRefusalAndConversationalText(data.personalInfo.professionalTitle || ''),
    summary: cleanUnresolvedPlaceholders(
      filterRefusalAndConversationalText(data.personalInfo.summary || '')
    ),
    email: data.personalInfo.email?.trim() || '',
    phone: data.personalInfo.phone?.trim() || '',
    location: data.personalInfo.location?.trim() || '',
    linkedin: data.personalInfo.linkedin?.trim() || '',
    github: data.personalInfo.github?.trim() || '',
    website: data.personalInfo.website?.trim() || '',
  };

  const sanitizedExperience: ResumeExperience[] = (data.experience || []).map((exp) => {
    const cleanedDesc = cleanUnresolvedPlaceholders(
      filterRefusalAndConversationalText(exp.description || '')
    );
    const cleanedBullets = deduplicateBulletPoints(exp.bullets, cleanedDesc);

    return {
      ...exp,
      company: filterRefusalAndConversationalText(exp.company || ''),
      position: filterRefusalAndConversationalText(exp.position || ''),
      description: cleanedDesc,
      bullets: cleanedBullets,
      location: exp.location?.trim() || undefined,
    };
  });

  const sanitizedProjects: ResumeProject[] = (data.projects || []).map((proj) => {
    const cleanedDesc = cleanUnresolvedPlaceholders(
      filterRefusalAndConversationalText(proj.description || '')
    );
    const cleanedBullets = deduplicateBulletPoints(proj.bullets, cleanedDesc);
    const cleanedTech = (proj.techStack || [])
      .map((t) => filterRefusalAndConversationalText(t).trim())
      .filter((t) => t.length > 0 && !t.includes('[') && !t.includes(']'));

    return {
      ...proj,
      title: filterRefusalAndConversationalText(proj.title || ''),
      role: proj.role ? filterRefusalAndConversationalText(proj.role) : undefined,
      description: cleanedDesc,
      bullets: cleanedBullets,
      techStack: Array.from(new Set(cleanedTech)),
    };
  });

  const sanitizedEducation: ResumeEducation[] = (data.education || []).map((edu) => ({
    ...edu,
    institution: filterRefusalAndConversationalText(edu.institution || ''),
    degree: filterRefusalAndConversationalText(edu.degree || ''),
    fieldOfStudy: edu.fieldOfStudy ? filterRefusalAndConversationalText(edu.fieldOfStudy) : '',
    highlights: deduplicateBulletPoints(edu.highlights),
  }));

  const sanitizedSkills = {
    technical: Array.from(
      new Set(
        (data.skills?.technical || [])
          .map((s) => cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(s)).trim())
          .filter((s) => s.length > 0 && !s.includes('['))
      )
    ),
    soft: Array.from(
      new Set(
        (data.skills?.soft || [])
          .map((s) => cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(s)).trim())
          .filter((s) => s.length > 0 && !s.includes('['))
      )
    ),
    tools: Array.from(
      new Set(
        (data.skills?.tools || [])
          .map((s) => cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(s)).trim())
          .filter((s) => s.length > 0 && !s.includes('['))
      )
    ),
  };

  const sanitizedCertifications = (data.certifications || []).map((cert) => ({
    ...cert,
    name: cleanUnresolvedPlaceholders(filterRefusalAndConversationalText(cert.name || '')),
    issuer: cert.issuer ? filterRefusalAndConversationalText(cert.issuer) : '',
  }));

  return {
    ...data,
    personalInfo: sanitizedPersonalInfo,
    experience: sanitizedExperience,
    projects: sanitizedProjects,
    education: sanitizedEducation,
    skills: sanitizedSkills,
    certifications: sanitizedCertifications,
    achievements: deduplicateBulletPoints(data.achievements),
    positionsOfResponsibility: (data.positionsOfResponsibility || []).map((pos) => ({
      ...pos,
      role: filterRefusalAndConversationalText(pos.role || ''),
      organization: filterRefusalAndConversationalText(pos.organization || ''),
      bullets: deduplicateBulletPoints(pos.bullets),
    })),
    coursework: (data.coursework || [])
      .map((c) => filterRefusalAndConversationalText(c).trim())
      .filter((c) => c.length > 0 && !c.includes('[')),
  };
}

/**
 * Validates resume data prior to cloud persistence or PDF export.
 */
export function validateResumeForExport(data: ResumeData): {
  isValid: boolean;
  warnings: string[];
  sanitized: ResumeData;
  auditReport: ResumeQualityAuditReport;
} {
  const sanitized = sanitizeResumeData(data);
  const auditReport = auditResumeContentQuality(sanitized);
  const warnings: string[] = [];

  if (!sanitized.personalInfo.fullName.trim()) {
    warnings.push('Candidate full name is required for PDF export.');
  }

  if (!sanitized.personalInfo.email?.trim() && !sanitized.personalInfo.phone?.trim()) {
    warnings.push('At least one contact method (email or phone) is recommended.');
  }

  // Add any remaining critical audit issues on sanitized output
  auditReport.issues.forEach((issue) => {
    if (issue.severity === 'critical') {
      warnings.push(`${issue.title}: ${issue.message}`);
    }
  });

  return {
    isValid: warnings.length === 0,
    warnings,
    sanitized,
    auditReport,
  };
}
