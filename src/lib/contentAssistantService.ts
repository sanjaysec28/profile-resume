/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 3: Client-Side Content Assistant Service
 * Connects UI components to the secure server-side AI content generator.
 * Manages draft caching, context extraction, and error handling.
 */

import {
  ContentAssistantRequest,
  ContentAssistantResponse,
  ContentAssistantSection,
  ContentAssistantAction,
} from '../types/assistant.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';
import { ResumeRecommendationsData } from '../types/recommendations.ts';

const DRAFT_CACHE_KEY = 'profile_assistant_staging_drafts';

/**
 * Invokes the secure server-side AI Content Assistant route.
 */
export async function fetchAIContentAssistance(
  request: ContentAssistantRequest
): Promise<ContentAssistantResponse> {
  const response = await fetch('/api/assistant/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate content.';
    try {
      const errJson = await response.json();
      if (errJson.error) {
        errorMsg = errJson.error;
      }
    } catch {
      errorMsg = `Server returned status ${response.status} (${response.statusText})`;
    }
    throw new Error(errorMsg);
  }

  const result: ContentAssistantResponse = await response.json();
  return result;
}

/**
 * Builds standard candidate context payload from Phase 1 setup and Phase 2 recommendations.
 */
export function buildCandidateAssistantContext(
  setup: ResumeSetupData | null | undefined,
  recommendations?: ResumeRecommendationsData | null
): Partial<ContentAssistantRequest> {
  const targetRole = setup?.targetRole.title || 'Software Engineer Intern';
  const purpose = setup?.purpose || 'internship';
  const degree = setup?.profileContext.degree || 'B.Tech';
  const department = setup?.profileContext.major || 'Computer Science';
  const academicYear = setup?.profileContext.academicYear || '3rd Year';
  const jobDescriptionText = setup?.jobDescription?.text || undefined;

  // Extract approved recommendations from Phase 2
  const approvedTech = recommendations?.technicalSkills
    ?.filter((s) => s.status === 'approved' || s.status === 'applied')
    ?.map((s) => s.title);

  const approvedSoft = recommendations?.softSkills
    ?.filter((s) => s.status === 'approved' || s.status === 'applied')
    ?.map((s) => s.title);

  const keywords = recommendations?.keywords?.map((k) => k.keyword);

  return {
    targetRole,
    purpose,
    degree,
    department,
    academicYear,
    jobDescriptionText,
    approvedRecommendations: {
      technicalSkills: approvedTech,
      softSkills: approvedSoft,
      keywords,
    },
  };
}

/**
 * Cache an unaccepted staged AI draft so student does not lose it upon reload.
 */
export function cacheStagedDraft(
  sectionKey: string,
  content: { original: string; generated: string; explanation: string }
): void {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[sectionKey] = content;
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

/**
 * Retrieve cached staged draft if any.
 */
export function getStagedDraft(
  sectionKey: string
): { original: string; generated: string; explanation: string } | null {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[sectionKey] || null;
  } catch {
    return null;
  }
}

/**
 * Clear cached staged draft after student accepts or discards.
 */
export function clearStagedDraft(sectionKey: string): void {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[sectionKey];
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Action display metadata with labels and descriptions
 */
export const ASSISTANT_ACTIONS: {
  action: ContentAssistantAction;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    action: 'generate',
    label: 'Generate Fresh Content',
    badge: 'Draft',
    description: 'Create an ATS-friendly, student-tailored draft from scratch.',
  },
  {
    action: 'improve',
    label: 'Improve & Polish',
    badge: 'Enhance',
    description: 'Elevate vocabulary, active phrasing, and impact.',
  },
  {
    action: 'professional',
    label: 'Make It Professional',
    badge: 'Tone',
    description: 'Refine tone to match corporate and engineering recruiters.',
  },
  {
    action: 'concise',
    label: 'Make It Concise',
    badge: 'Trim',
    description: 'Cut filler words while preserving key metrics and skills.',
  },
  {
    action: 'ats_keywords',
    label: 'Boost ATS Keywords',
    badge: 'Keywords',
    description: 'Weave high-priority role keywords organically.',
  },
  {
    action: 'role_target',
    label: 'Tailor for Target Role',
    badge: 'Target',
    description: 'Align highlights specifically to your selected job role.',
  },
  {
    action: 'fix_grammar',
    label: 'Fix Grammar & Voice',
    badge: 'Grammar',
    description: 'Ensure active voice, flawless punctuation, and consistent tense.',
  },
  {
    action: 'regenerate',
    label: 'Regenerate (Different Angle)',
    badge: 'Alternative',
    description: 'Try a fresh perspective and different phrasing structure.',
  },
];
