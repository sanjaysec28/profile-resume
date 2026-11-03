/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — ATS Compatibility & Parsing Verification
 * Audits contact info, layout risks, date continuity, section structure, and keyword stuffing.
 */

import { ExtractedResumeText, AtsCompatibilityWarning } from '../types.ts';

export function checkAtsCompatibility(resume: ExtractedResumeText): AtsCompatibilityWarning[] {
  const warnings: AtsCompatibilityWarning[] = [];
  const text = resume.rawText;
  const lower = text.toLowerCase();

  // 1. Contact verification
  if (!resume.contact.email) {
    warnings.push({
      id: 'missing-email',
      severity: 'error',
      title: 'Missing or Unparseable Email',
      description: 'No valid RFC-standard email address was identified in the document header.',
      recommendation: 'Add a clean email address (e.g., name@domain.com) in your top contact header.',
    });
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(resume.contact.email)) {
    warnings.push({
      id: 'malformed-email',
      severity: 'warning',
      title: 'Potentially Malformed Email',
      description: `The extracted email "${resume.contact.email}" may contain special characters or spaces.`,
      recommendation: 'Ensure your email is in plain text without embedded hyperlinks obscuring the text.',
    });
  }

  if (!resume.contact.phone) {
    warnings.push({
      id: 'missing-phone',
      severity: 'warning',
      title: 'Missing Contact Phone Number',
      description: 'Most ATS parsers expect a primary contact phone number with country/area code.',
      recommendation: 'Include a standard phone number (e.g., +1 (555) 012-3456) in the header.',
    });
  }

  // 2. Scanned / Image-Only PDF Warning
  if (resume.isScanned && !resume.isOcrApplied) {
    warnings.push({
      id: 'scanned-pdf-error',
      severity: 'error',
      title: 'Image-Based / Scanned PDF (Zero Digital Text)',
      description: 'The uploaded file is a flattened graphic or scan without an embedded digital text stream.',
      recommendation: 'Export your resume as a standard vector PDF or DOCX so text can be indexed by ATS algorithms.',
    });
  } else if (resume.isOcrApplied) {
    warnings.push({
      id: 'ocr-applied-notice',
      severity: 'info',
      title: 'Text Extracted via OCR',
      description: 'Text was recovered using browser-based Optical Character Recognition. Some punctuation or layout may differ slightly from the original.',
      recommendation: 'For 100% parsing accuracy with corporate ATS platforms, prefer native searchable PDF or DOCX exports.',
    });
  }

  // 3. Section structure checks
  if (!resume.sections.hasEducation) {
    warnings.push({
      id: 'missing-education',
      severity: 'error',
      title: 'Missing Standard "Education" Heading',
      description: 'Applicant Tracking Systems look for a recognizable "Education" section to parse degrees and graduation dates.',
      recommendation: 'Use the standard heading "Education" or "Academic Credentials".',
    });
  }

  if (!resume.sections.hasSkills) {
    warnings.push({
      id: 'missing-skills',
      severity: 'warning',
      title: 'No Dedicated "Skills" Section Header',
      description: 'Skills are most reliably indexed when grouped under a clear "Technical Skills" or "Skills" heading.',
      recommendation: 'Group competencies under "Skills" with clear category sub-headers.',
    });
  }

  if (!resume.sections.hasExperience && !resume.sections.hasProjects) {
    warnings.push({
      id: 'missing-experience-and-projects',
      severity: 'error',
      title: 'Missing "Experience" and "Projects" Sections',
      description: 'The resume lacks both professional experience and practical project records.',
      recommendation: 'Add internships, research, open-source work, or academic projects to show practical competence.',
    });
  }

  // 4. Date Continuity & Inverted Date Checks
  // Check for suspicious date inversions like "2024 - 2021" or "2025 - 2020"
  const dateRangeMatches = text.matchAll(/(\d{4})\s*[-–—to]+\s*(\d{4})/gi);
  for (const m of dateRangeMatches) {
    const startYear = parseInt(m[1], 10);
    const endYear = parseInt(m[2], 10);
    if (startYear > endYear) {
      warnings.push({
        id: `inverted-date-${m[0]}`,
        severity: 'error',
        title: 'Chronologically Inverted Date Range',
        description: `Found suspicious date sequence "${m[0]}" where start year (${startYear}) is after end year (${endYear}).`,
        recommendation: 'Reverse the order to follow standard chronological syntax (e.g. 2021 – 2024).',
      });
      break;
    }
  }

  // 5. Keyword Stuffing Detection
  // Detect unnatural repetition (> 6 mentions of a single specific skill in a single resume)
  const words = lower.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
  const termCounts: Record<string, number> = {};
  for (const w of words) {
    termCounts[w] = (termCounts[w] || 0) + 1;
  }

  const suspiciousTerms = Object.entries(termCounts).filter(
    ([term, count]) =>
      count >= 8 &&
      !['and', 'the', 'with', 'for', 'from', 'project', 'projects', 'experience', 'using', 'system', 'data'].includes(term)
  );

  if (suspiciousTerms.length > 0) {
    warnings.push({
      id: 'keyword-stuffing',
      severity: 'warning',
      title: 'Potential Keyword Stuffing Detected',
      description: `Terms such as "${suspiciousTerms.map(([t]) => t).slice(0, 3).join(', ')}" appear with unusually high frequency (${suspiciousTerms[0][1]}+ times).`,
      recommendation: 'Modern ATS algorithms penalize repetitive keyword lists. Integrate terms naturally within achievement bullet points.',
    });
  }

  // 6. Text length & word count bounds
  if (resume.wordCount < 120 && (!resume.isScanned || resume.isOcrApplied)) {
    warnings.push({
      id: 'low-word-count',
      severity: 'warning',
      title: 'Extremely Brief Resume Content',
      description: `Only ${resume.wordCount} words detected. Typical competitive student resumes contain 350 to 650 words.`,
      recommendation: 'Expand on specific project bullet points, tools utilized, and measurable outcomes.',
    });
  } else if (resume.wordCount > 1200) {
    warnings.push({
      id: 'high-word-count',
      severity: 'info',
      title: 'Extended Document Length',
      description: `Resume is ${resume.wordCount} words (${resume.pageCount} pages). For undergraduate and entry-level positions, a focused 1-page format is strongly preferred.`,
      recommendation: 'Condense older or less relevant positions into high-impact bullet points.',
    });
  }

  // 7. Multi-column / Table parsing safety notice
  if (resume.sourceType === 'pdf') {
    warnings.push({
      id: 'template-safety-info',
      severity: 'info',
      title: 'Design Template Compatibility',
      description: 'ProFile standard single and dual-column layouts use linear DOM structuring for high parser compatibility.',
      recommendation: 'Avoid inserting floating text boxes, intricate nested tables, or decorative canvas icons.',
    });
  }

  return warnings;
}
