/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Resume Content Assistant
 * Uses @google/genai with 'gemini-3.8-flash' and resilient fallback to 'gemini-3.1-flash-lite'.
 * Enforces strict factual accuracy, student-level appropriateness, and anti-hallucination.
 */

import { GoogleGenAI } from '@google/genai';
import {
  ContentAssistantRequest,
  ContentAssistantResponse,
} from '../types/assistant.ts';

export async function generateResumeContent(
  req: ContentAssistantRequest
): Promise<ContentAssistantResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please ensure the Gemini API key is configured in Settings > Secrets.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Format current content for prompt
  let currentContentStr = '';
  if (req.currentContent) {
    if (typeof req.currentContent === 'string') {
      currentContentStr = req.currentContent.trim();
    } else if (Array.isArray(req.currentContent)) {
      currentContentStr = req.currentContent.join('\n• ');
    } else {
      currentContentStr = JSON.stringify(req.currentContent, null, 2);
    }
  }

  // Approved recommendations context
  const approvedTech = req.approvedRecommendations?.technicalSkills?.join(', ') || 'None specified';
  const approvedSoft = req.approvedRecommendations?.softSkills?.join(', ') || 'None specified';
  const approvedKeywords = req.approvedRecommendations?.keywords?.join(', ') || 'None specified';

  const prompt = `
You are the ProFile Senior Resume Content Architect and ATS Specialist.
Your mission is to generate, improve, or adapt resume content for a student candidate applying for "${req.targetRole}".

### CANDIDATE & CONTEXT:
- Resume Purpose: "${req.purpose || 'internship'}"
- Target Role: "${req.targetRole}"
- Academic Background: "${req.degree || 'B.Tech / B.S.'}" in "${req.department || 'Computer Science'}"
- Academic Standing: "${req.academicYear || 'Undergraduate'}"
- Optional Job Description Context:
${req.jobDescriptionText ? `"""\n${req.jobDescriptionText.trim()}\n"""` : 'None provided. Adhere to current global industry expectations for this role.'}

### APPROVED STUDENT RECOMMENDATIONS (From Phase 2):
- Approved Technical Skills: ${approvedTech}
- Approved Soft Skills: ${approvedSoft}
- High-Priority Role Keywords: ${approvedKeywords}

### SECTION & ACTION REQUESTED:
- Resume Section: "${req.section}"
- Requested Action: "${req.action}" (options: generate, improve, professional, concise, ats_keywords, role_target, fix_grammar, regenerate)
${req.itemTitle ? `- Item Subject / Role / Project Title: "${req.itemTitle}"` : ''}
${req.itemTechStack?.length ? `- Tech Stack / Tools: "${req.itemTechStack.join(', ')}"` : ''}
${req.additionalInstructions ? `- Student's Specific Custom Instructions: "${req.additionalInstructions}"` : ''}

### CURRENT EXISTING DRAFT CONTENT:
${currentContentStr ? `"""\n${currentContentStr}\n"""` : '[Empty — please generate a fresh, tailored draft]'}

### STRICT ANTI-HALLUCINATION & FACTUAL ACCURACY RULES (CRITICAL):
1. NEVER fabricate student employment, companies, internships, fake certificates, fake grades, or unverified achievements.
2. When generating bullets for an existing project or role, build upon the student's stated details.
3. If metric achievements are suggested (e.g. percentage speedup, query optimizations, user counts), you MUST format them as bracketed placeholders so the student can verify and provide real numbers (e.g., "[reduced build time by X%]", "[handled ~N concurrent API requests]").
4. Never assume an AI-suggested project is already completed.
5. Content must be student-appropriate: avoid pretentious corporate jargon ("synergized paradigm shifts"), use clean, active, direct engineering/professional language.
6. For bullets, use strong action verbs (e.g., Architected, Designed, Implemented, Engineered, Integrated, Containerized, Optimized).

### ACTION-SPECIFIC DIRECTIVES:
- "generate": Write clear, ATS-friendly, student-tailored content from scratch based on target role and provided background.
- "improve": Elevate vocabulary, strengthen action verbs, enhance structure, and eliminate weak phrasing.
- "professional": Tone refinement for formal tech/industry recruiters.
- "concise": Tighten word count, cut redundant filler words while maintaining metric impact.
- "ats_keywords": Incorporate industry-standard keywords from the target role naturally without keyword stuffing.
- "role_target": Re-align phrasing and highlighted aspects specifically toward "${req.targetRole}".
- "fix_grammar": Correct grammatical inaccuracies, punctuation, active/passive voice, and tense consistency.
- "regenerate": Provide an alternative creative or technical angle with fresh phrasing.

### OUTPUT JSON FORMAT:
Respond with ONLY a valid, parseable JSON object matching this schema (no surrounding markdown code fences, no extra commentary):
{
  "generatedText": "The refined or generated paragraph or main text content",
  "bulletPoints": [
    "Optional array of bullet points if applicable (e.g. for projects, experience, coursework, achievements)",
    "Second bullet point with action verb and metric placeholder [X%]"
  ],
  "explanation": "1-2 sentences explaining why this content is effective for the target role",
  "placeholdersUsed": [
    "[X%]",
    "[Tool Name]"
  ],
  "atsScoreImpactNote": "Brief note on how this improves ATS keyword alignment",
  "actionApplied": "${req.action}",
  "recommendedHeading": "Suggested heading name for this section"
}
`.trim();

  // Primary model: gemini-3.8-flash, with automatic fallback to gemini-3.1-flash-lite
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = parseResponse(response.text, req.action);
    return parsed;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[ContentAssistant] gemini-3.8-flash attempt failed (${errorMsg}), retrying with gemini-3.1-flash-lite...`);

    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedFallback = parseResponse(fallbackResponse.text, req.action);
    return parsedFallback;
  }
}

function parseResponse(
  rawText: string | undefined,
  action: ContentAssistantRequest['action']
): ContentAssistantResponse {
  if (!rawText) {
    throw new Error('Received empty response from AI content assistant.');
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);
    return {
      generatedText: data.generatedText || '',
      bulletPoints: Array.isArray(data.bulletPoints) ? data.bulletPoints : undefined,
      explanation: data.explanation || 'Refined content aligned with target role standards.',
      placeholdersUsed: Array.isArray(data.placeholdersUsed) ? data.placeholdersUsed : [],
      atsScoreImpactNote: data.atsScoreImpactNote || 'Includes relevant industry keywords for ATS parsing.',
      actionApplied: action,
      recommendedHeading: data.recommendedHeading,
    };
  } catch (parseError) {
    console.error('Failed to parse AI JSON response:', cleaned);
    // Graceful fallback to raw text if model returned non-JSON
    return {
      generatedText: cleaned,
      explanation: 'Content generated successfully.',
      placeholdersUsed: [],
      atsScoreImpactNote: 'Aligned with target role.',
      actionApplied: action,
    };
  }
}
