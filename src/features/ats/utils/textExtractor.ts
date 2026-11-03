/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Real Resume Text Extractor
 * Extracts genuine text and section layout from PDF, DOCX, and ProFile resume drafts.
 * Includes OCR fallback detection for scanned image-only PDFs.
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ResumeData } from '../../../types/resume.ts';
import { ExtractedResumeText } from '../types.ts';

// Configure pdfjs worker in browser environments
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch {
    // Global worker options fallback
  }
}

// Common tech & professional skills dictionary for keyword extraction
export const SKILL_LEXICON = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin',
  'react', 'react.js', 'react native', 'angular', 'vue', 'vue.js', 'next.js', 'nuxt.js', 'node', 'node.js', 'express',
  'express.js', 'django', 'flask', 'fastapi', 'spring boot', 'asp.net', 'laravel', 'graphql', 'rest api', 'restful apis',
  'html', 'html5', 'css', 'css3', 'tailwind css', 'tailwind', 'bootstrap', 'sass', 'scss',
  'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'firebase', 'firestore', 'supabase',
  'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'github actions',
  'jenkins', 'terraform', 'git', 'github', 'gitlab', 'linux', 'bash', 'shell scripting', 'nginx', 'apache',
  'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'data science', 'nlp', 'computer vision',
  'pandas', 'numpy', 'scipy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'opencv', 'tableau', 'power bi',
  'agile', 'scrum', 'jira', 'confluence', 'figma', 'ui/ux', 'system design', 'microservices', 'unit testing',
  'jest', 'cypress', 'playwright', 'selenium', 'oop', 'data structures', 'algorithms'
];

/**
 * Extracts plain text from an uploaded File (PDF, DOCX, TXT)
 */
export async function extractResumeFromFile(
  file: File,
  onProgress?: (message: string) => void
): Promise<ExtractedResumeText> {
  const fileName = file.name || 'uploaded_resume';
  const lowerName = fileName.toLowerCase();

  if (file.size === 0) {
    throw new Error('The selected file is empty (0 bytes). Please upload a valid resume.');
  }

  // 1. DOCX Processing
  if (lowerName.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    onProgress?.('Extracting text from Word document (DOCX)...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = (result.value || '').trim();

      if (!rawText || rawText.length < 20) {
        throw new Error('No readable text found inside this DOCX document. Please verify the file.');
      }

      return parseRawResumeText(rawText, 'docx', fileName, 1, false, false);
    } catch (err: any) {
      if (err.message?.includes('No readable text')) throw err;
      throw new Error(`Failed to parse DOCX: ${err.message || 'Corrupted or unsupported format'}`);
    }
  }

  // 2. PDF Processing
  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    onProgress?.('Reading PDF digital text stream...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages || 1;
      let fullText = '';
      let pagesWithText = 0;

      for (let i = 1; i <= numPages; i++) {
        onProgress?.(`Extracting page ${i} of ${numPages}...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText.length > 25) {
          pagesWithText++;
        }
        fullText += pageText + '\n\n';
      }

      fullText = fullText.trim();

      // Check for scanned / image-only PDF
      const isScanned = pagesWithText === 0 || fullText.length < 50;

      if (isScanned) {
        onProgress?.('Scanned PDF detected (no digital text layer). Initializing client-side OCR...');
        try {
          const ocrText = await performOcrOnPdf(pdfDoc, onProgress);
          if (ocrText && ocrText.length >= 50) {
            return parseRawResumeText(ocrText, 'pdf', fileName, numPages, true, true);
          }
          throw new Error('OCR returned insufficient legible characters.');
        } catch (ocrErr: any) {
          return {
            rawText: fullText || 'Scanned PDF with image-only content.',
            sourceType: 'pdf',
            fileName,
            pageCount: numPages,
            wordCount: 0,
            hasSelectableText: false,
            isScanned: true,
            isOcrApplied: false,
            contact: {},
            sections: {
              hasContact: false,
              hasSummary: false,
              hasEducation: false,
              hasExperience: false,
              hasProjects: false,
              hasSkills: false,
              hasCertifications: false,
              detectedSectionHeaders: [],
              missingStandardHeaders: ['Contact', 'Education', 'Skills', 'Experience', 'Projects'],
            },
            extractedSkills: [],
            extractedMetricsCount: 0,
            parsingWarnings: [
              'Image-only / scanned PDF detected: No selectable digital text layer was found in this file.',
              `OCR Notice: ${ocrErr.message || 'Client-side OCR could not extract reliable characters.'}`,
              'Standard ATS parsers (Workday, Greenhouse, Taleo) cannot read purely image-based resumes without native text.',
            ],
            parsingErrors: [
              'No machine-readable text stream in uploaded PDF.',
            ],
          };
        }
      }

      return parseRawResumeText(fullText, 'pdf', fileName, numPages, false, false);
    } catch (err: any) {
      if (err.name === 'PasswordException') {
        throw new Error('This PDF is password-protected. Please remove password protection and try again.');
      }
      if (err.name === 'InvalidPDFException' || err.message?.includes('Invalid PDF')) {
        throw new Error('This PDF file is invalid or corrupted.');
      }
      throw new Error(`Unable to read PDF: ${err.message || 'Unknown parsing failure'}`);
    }
  }

  // 3. Plain text / Markdown Fallback
  if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || file.type.startsWith('text/')) {
    onProgress?.('Reading text content...');
    const rawText = await file.text();
    if (!rawText.trim()) {
      throw new Error('The text file is empty.');
    }
    return parseRawResumeText(rawText.trim(), 'text', fileName, 1, false, false);
  }

  throw new Error('Unsupported format. Please upload a PDF (.pdf) or Word document (.docx).');
}

/**
 * Performs OCR on PDF pages using Tesseract.js
 */
async function performOcrOnPdf(
  pdfDoc: any,
  onProgress?: (msg: string) => void
): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const numPages = Math.min(pdfDoc.numPages, 3); // OCR first 3 pages max for browser performance
  let combinedOcrText = '';

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(`Performing OCR on page ${i} of ${numPages}...`);
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && m.progress) {
          onProgress?.(`OCR Page ${i}: ${Math.round(m.progress * 100)}% complete...`);
        }
      },
    });

    if (result?.data?.text) {
      combinedOcrText += result.data.text + '\n\n';
    }
  }

  return combinedOcrText.trim();
}

/**
 * Extracts and normalizes structured text from ProFile active resume data
 */
export function extractResumeFromProFileData(data: ResumeData): ExtractedResumeText {
  const parts: string[] = [];

  // 1. Contact / Header
  const p = data.personalInfo || { fullName: '', email: '', phone: '', location: '' };
  const contactLines: string[] = [];
  if (p.fullName) contactLines.push(p.fullName);
  if (p.professionalTitle) contactLines.push(p.professionalTitle);
  if (p.email) contactLines.push(`Email: ${p.email}`);
  if (p.phone) contactLines.push(`Phone: ${p.phone}`);
  if (p.location) contactLines.push(`Location: ${p.location}`);
  if (p.linkedin) contactLines.push(`LinkedIn: ${p.linkedin}`);
  if (p.github) contactLines.push(`GitHub: ${p.github}`);
  if (p.website) contactLines.push(`Portfolio: ${p.website}`);
  if (contactLines.length) {
    parts.push(`CONTACT INFORMATION\n${contactLines.join(' | ')}`);
  }

  // 2. Summary
  if (p.summary?.trim()) {
    parts.push(`PROFESSIONAL SUMMARY\n${p.summary.trim()}`);
  }

  // 3. Education
  if (data.education?.length) {
    const eduLines = data.education.map((e) => {
      const bits = [
        e.degree,
        e.fieldOfStudy ? `in ${e.fieldOfStudy}` : '',
        e.institution ? `at ${e.institution}` : '',
        e.endDate ? `(${e.endDate})` : '',
        e.scoreOrGpa ? `GPA: ${e.scoreOrGpa}` : '',
      ].filter(Boolean);
      return bits.join(' ');
    });
    parts.push(`EDUCATION\n${eduLines.join('\n')}`);
  }

  // 4. Skills
  const technical = data.skills?.technical || [];
  const soft = data.skills?.soft || [];
  const tools = data.skills?.tools || [];
  const allSkills = [...technical, ...soft, ...tools];
  if (allSkills.length) {
    parts.push(`TECHNICAL & PROFESSIONAL SKILLS\n${allSkills.join(', ')}`);
  }

  // 5. Experience
  if (data.experience?.length) {
    const expLines = data.experience.map((exp) => {
      const header = `${exp.position || 'Role'} at ${exp.company || 'Company'} (${exp.startDate || ''} - ${exp.endDate || (exp.isCurrent ? 'Present' : '')})`;
      const desc = exp.description ? `\n${exp.description}` : '';
      const bulletText = exp.bullets?.length ? `\n${exp.bullets.map((b) => `• ${b}`).join('\n')}` : '';
      return `${header}${desc}${bulletText}`;
    });
    parts.push(`WORK EXPERIENCE\n${expLines.join('\n\n')}`);
  }

  // 6. Projects
  if (data.projects?.length) {
    const projLines = data.projects.map((proj) => {
      const tech = proj.techStack?.length ? ` [Technologies: ${proj.techStack.join(', ')}]` : '';
      const desc = proj.description ? `\n${proj.description}` : '';
      const bulletText = proj.bullets?.length ? `\n${proj.bullets.map((b) => `• ${b}`).join('\n')}` : '';
      return `${proj.title || 'Project'}${tech}${desc}${bulletText}`;
    });
    parts.push(`PROJECTS & PRACTICAL WORK\n${projLines.join('\n\n')}`);
  }

  // 7. Certifications
  if (data.certifications?.length) {
    const certLines = data.certifications.map((c) => {
      return `${c.name || 'Certification'} by ${c.issuer || 'Issuer'} (${c.issueDate || ''})`;
    });
    parts.push(`CERTIFICATIONS\n${certLines.join('\n')}`);
  }

  const rawText = parts.join('\n\n');
  const parsed = parseRawResumeText(rawText, 'profile-draft', `${data.title || 'ProFile Resume'}.draft`, 1, false, false);
  parsed.originalResumeData = data;
  return parsed;
}

/**
 * Universal text parsing and structure extractor
 */
export function parseRawResumeText(
  rawText: string,
  sourceType: ExtractedResumeText['sourceType'],
  fileName: string,
  pageCount: number,
  isScanned: boolean,
  isOcrApplied: boolean
): ExtractedResumeText {
  const normalized = rawText.replace(/\r\n/g, '\n');
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Contact parsing
  const emailMatch = normalized.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = normalized.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = normalized.match(/(?:linkedin\.com\/(?:in|company)\/[\w-]+)/i);
  const githubMatch = normalized.match(/(?:github\.com\/[\w-]+)/i);
  const websiteMatch = normalized.match(/https?:\/\/(?!linkedin\.com|github\.com)[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/i);

  // Extract name: typically first non-empty line under 50 characters without symbols
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  let fullName: string | undefined;
  for (const line of lines.slice(0, 5)) {
    if (
      line.length >= 3 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !line.match(/\d{3}/) &&
      !line.match(/(resume|curriculum|cv|contact|email|phone)/i)
    ) {
      fullName = line;
      break;
    }
  }

  // Location heuristic
  let location: string | undefined;
  for (const line of lines.slice(0, 10)) {
    const locMatch = line.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s*\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);
    if (locMatch && !line.includes('@')) {
      location = locMatch[0].trim();
      break;
    }
  }

  // Detect sections
  const lower = normalized.toLowerCase();
  const hasContact = Boolean(emailMatch || phoneMatch);
  const hasSummary = Boolean(lower.match(/\b(summary|objective|profile|about me|professional summary)\b/i));
  const hasEducation = Boolean(lower.match(/\b(education|academic|university|degree|bachelor|master|phd|gpa|diploma)\b/i));
  const hasExperience = Boolean(lower.match(/\b(experience|employment|work history|professional experience|internship|internships)\b/i));
  const hasProjects = Boolean(lower.match(/\b(projects|personal projects|academic projects|portfolio|key projects)\b/i));
  const hasSkills = Boolean(lower.match(/\b(skills|technical skills|technologies|core competencies|tooling)\b/i));
  const hasCertifications = Boolean(lower.match(/\b(certifications|certificates|licenses|credentials|courses)\b/i));

  const detectedSectionHeaders: string[] = [];
  if (hasContact) detectedSectionHeaders.push('Contact Information');
  if (hasSummary) detectedSectionHeaders.push('Professional Summary');
  if (hasEducation) detectedSectionHeaders.push('Education');
  if (hasExperience) detectedSectionHeaders.push('Experience');
  if (hasProjects) detectedSectionHeaders.push('Projects');
  if (hasSkills) detectedSectionHeaders.push('Skills');
  if (hasCertifications) detectedSectionHeaders.push('Certifications');

  const missingStandardHeaders: string[] = [];
  if (!hasContact) missingStandardHeaders.push('Contact Information');
  if (!hasEducation) missingStandardHeaders.push('Education');
  if (!hasSkills) missingStandardHeaders.push('Skills');
  if (!hasExperience && !hasProjects) missingStandardHeaders.push('Experience or Projects');

  // Extract skills found in text
  const extractedSkillsSet = new Set<string>();
  for (const skill of SKILL_LEXICON) {
    const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
    if (regex.test(normalized)) {
      extractedSkillsSet.add(skill);
    }
  }

  // Count quantifiable metrics (e.g. 25%, $50K, 10x, 500+ users)
  const metricsMatches = normalized.match(/(\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?[kmb]?|\d+x|\b\d{2,}\+?\s*(?:users|clients|students|requests|downloads|stars|commits|tests|leads))/gi);
  const extractedMetricsCount = metricsMatches ? metricsMatches.length : 0;

  // Warnings
  const parsingWarnings: string[] = [];
  const parsingErrors: string[] = [];

  if (!emailMatch) {
    parsingWarnings.push('Missing or unreadable email address.');
  }
  if (!phoneMatch) {
    parsingWarnings.push('Missing or unreadable contact phone number.');
  }
  if (!hasEducation) {
    parsingWarnings.push('No recognized Education section detected.');
  }
  if (!hasExperience && !hasProjects) {
    parsingWarnings.push('No Work Experience or Projects section detected.');
  }
  if (wordCount < 100) {
    parsingWarnings.push(`Low word count (${wordCount} words). A standard single-page resume typically contains 350–650 words.`);
  }

  return {
    rawText: normalized,
    sourceType,
    fileName,
    pageCount,
    wordCount,
    hasSelectableText: !isScanned || isOcrApplied,
    isScanned,
    isOcrApplied,
    contact: {
      fullName,
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      location,
      linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
      github: githubMatch ? githubMatch[0] : undefined,
      website: websiteMatch ? websiteMatch[0] : undefined,
    },
    sections: {
      hasContact,
      hasSummary,
      hasEducation,
      hasExperience,
      hasProjects,
      hasSkills,
      hasCertifications,
      detectedSectionHeaders,
      missingStandardHeaders,
    },
    extractedSkills: Array.from(extractedSkillsSet),
    extractedMetricsCount,
    parsingWarnings,
    parsingErrors,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
