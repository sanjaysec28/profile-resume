/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Real Job Description Parser & Skill Normalizer
 */

import { ParsedJobDescription } from '../types.ts';
import { SKILL_LEXICON } from './textExtractor.ts';

// Skill canonical normalization and alias mapping
export const SKILL_CANONICAL_MAP: Record<string, string> = {
  'react.js': 'react',
  'reactjs': 'react',
  'react native': 'react native',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'next.js': 'next.js',
  'nextjs': 'next.js',
  'node.js': 'node.js',
  'nodejs': 'node.js',
  'express.js': 'express',
  'expressjs': 'express',
  'typescript': 'typescript',
  'ts': 'typescript',
  'javascript': 'javascript',
  'js': 'javascript',
  'python3': 'python',
  'py': 'python',
  'c++': 'c++',
  'cpp': 'c++',
  'golang': 'go',
  'postgres': 'postgresql',
  'psql': 'postgresql',
  'amazon web services': 'aws',
  'google cloud platform': 'gcp',
  'google cloud': 'gcp',
  'k8s': 'kubernetes',
  'restful apis': 'rest api',
  'restful api': 'rest api',
  'rest apis': 'rest api',
  'rest': 'rest api',
  'ci/cd pipelines': 'ci/cd',
  'continuous integration': 'ci/cd',
  'ml': 'machine learning',
  'ai': 'artificial intelligence',
  'deep learning': 'deep learning',
  'git': 'git',
  'github': 'git',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
};

/**
 * Normalizes skill string by stripping punctuation, plurals, and canonical aliases
 */
export function normalizeSkill(skill: string): string {
  const clean = skill
    .toLowerCase()
    .replace(/[•\-,/\\()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip trailing plural 's' for multi-word or single terms unless ending in 'ss'
  const singular = clean.endsWith('s') && !clean.endsWith('ss') && !clean.endsWith('is')
    ? clean.slice(0, -1)
    : clean;

  return SKILL_CANONICAL_MAP[clean] || SKILL_CANONICAL_MAP[singular] || clean;
}

/**
 * Parses a Job Description into required skills, preferred skills, keywords, and entry-level flags
 */
export function parseJobDescription(
  jobDescriptionText: string,
  userJobTitle?: string,
  userCompany?: string
): ParsedJobDescription {
  const text = (jobDescriptionText || '').trim();
  if (!text) {
    return {
      rawText: '',
      jobTitle: userJobTitle?.trim() || undefined,
      company: userCompany?.trim() || undefined,
      isEntryLevel: false,
      requiredSkills: [],
      preferredSkills: [],
      keywords: [],
      keyResponsibilities: [],
      hasIdentifiableRequirements: false,
      hasIdentifiablePreferred: false,
    };
  }

  const lower = text.toLowerCase();

  // 1. Detect if role is entry level / intern
  const isEntryLevel = Boolean(
    lower.match(/\b(intern|internship|entry level|entry-level|junior|new grad|new graduate|fresh graduate|associate|0-1 years|0-2 years|no experience required)\b/i) ||
    (userJobTitle && userJobTitle.toLowerCase().match(/\b(intern|junior|entry|associate|graduate)\b/i))
  );

  // 2. Detect experience years requirement
  const expMatch = lower.match(/(\d+)\+?\s*(?:-\s*\d+\s*)?years?(?:\s*of)?\s*(?:relevant\s*)?experience/);
  const experienceYearsMin = expMatch ? parseInt(expMatch[1], 10) : undefined;

  // 3. Segment sections: Required vs Preferred
  const requiredSectionTexts: string[] = [];
  const preferredSectionTexts: string[] = [];
  const generalSectionTexts: string[] = [];

  const lines = text.split('\n');
  let currentSection: 'required' | 'preferred' | 'general' = 'general';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lowerLine = trimmed.toLowerCase();

    // Check heading switches
    if (lowerLine.match(/^(?:what you'?ll need|requirements|minimum qualifications|must have|basic qualifications|what we are looking for|skills required|qualifications):?/i)) {
      currentSection = 'required';
      continue;
    } else if (lowerLine.match(/^(?:preferred qualifications|bonus points|nice to have|preferred skills|plus if you have|good to have):?/i)) {
      currentSection = 'preferred';
      continue;
    } else if (lowerLine.match(/^(?:about us|about the role|responsibilities|what you'?ll do|benefits|compensation):?/i)) {
      currentSection = 'general';
      continue;
    }

    if (currentSection === 'required') {
      requiredSectionTexts.push(trimmed);
    } else if (currentSection === 'preferred') {
      preferredSectionTexts.push(trimmed);
    } else {
      generalSectionTexts.push(trimmed);
    }
  }

  // 4. Extract skills from lexicon and custom tokens
  const requiredSkillsSet = new Set<string>();
  const preferredSkillsSet = new Set<string>();
  const generalSkillsSet = new Set<string>();

  const requiredCorpus = requiredSectionTexts.join(' ').toLowerCase();
  const preferredCorpus = preferredSectionTexts.join(' ').toLowerCase();
  const generalCorpus = generalSectionTexts.join(' ').toLowerCase();

  for (const skill of SKILL_LEXICON) {
    const normalized = normalizeSkill(skill);
    const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');

    if (requiredCorpus && regex.test(requiredCorpus)) {
      requiredSkillsSet.add(normalized);
    } else if (preferredCorpus && regex.test(preferredCorpus)) {
      preferredSkillsSet.add(normalized);
    } else if (regex.test(lower)) {
      // If no distinct section was found, check if line mentions 'must' or 'required'
      if (lower.includes('preferred') || lower.includes('nice to have')) {
        generalSkillsSet.add(normalized);
      } else {
        requiredSkillsSet.add(normalized);
      }
    }
  }

  // If no explicit required section was detected, distribute detected skills to required
  if (requiredSkillsSet.size === 0 && generalSkillsSet.size > 0) {
    for (const s of generalSkillsSet) {
      requiredSkillsSet.add(s);
    }
  }

  // 5. Extract domain keywords (top frequency non-stop words)
  const stopWords = new Set([
    'and', 'the', 'with', 'for', 'you', 'will', 'our', 'team', 'work', 'your', 'from', 'this', 'that',
    'have', 'are', 'responsibilities', 'qualifications', 'years', 'experience', 'ability', 'working',
    'opportunity', 'company', 'position', 'requirements', 'candidate', 'strong', 'must', 'plus', 'preferred'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  }

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w);

  // Extract responsibilities lines
  const keyResponsibilities = lines
    .filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'))
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .slice(0, 6);

  const hasIdentifiableRequirements = requiredSkillsSet.size > 0;
  const hasIdentifiablePreferred = preferredSkillsSet.size > 0;

  return {
    rawText: text,
    jobTitle: userJobTitle?.trim() || undefined,
    company: userCompany?.trim() || undefined,
    isEntryLevel,
    requiredSkills: Array.from(requiredSkillsSet),
    preferredSkills: Array.from(preferredSkillsSet),
    keywords: topKeywords,
    keyResponsibilities,
    experienceYearsMin,
    hasIdentifiableRequirements,
    hasIdentifiablePreferred,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
