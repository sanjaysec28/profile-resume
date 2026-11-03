/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Resume Quality Review Engine
 * Uses @google/genai with 'gemini-3.8-flash' and resilient fallback to 'gemini-3.1-flash-lite'.
 * Performs deep qualitative critique, action-verb auditing, role alignment,
 * and formulates actionable, verifiable suggestions without inventing false facts.
 */

import { GoogleGenAI } from '@google/genai';
import { ReviewGenerationInput } from '../types/resumeReview.ts';

export async function generateResumeReview(input: ReviewGenerationInput) {
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

  const hasJd = Boolean(input.jobDescriptionText && input.jobDescriptionText.trim().length > 30);
  const data = input.resumeData || {};
  const isFresher = input.purpose === 'fresher' || input.purpose === 'internship';

  const prompt = `
You are the ProFile Senior Technical Recruiter & Head of ATS Resume Quality Assurance.
Perform a rigorous, constructive, evidence-based quality audit of this student candidate's resume draft for the role of "${input.targetRole}".

### CANDIDATE & APPLICATION CONTEXT:
- Target Role: "${input.targetRole}"
- Application Purpose: "${input.purpose}" (${isFresher ? 'Student / Fresher / Intern level — DO NOT penalize for lacking full-time experience; prioritize academic projects and skills' : 'Experienced / Industry level'})
- Academic Background: "${input.degree || 'B.Tech'}" in "${input.department || 'Computer Science'}" (${input.academicYear || 'Undergraduate'})
- Approved Phase 2 Skills: ${input.approvedRecommendations?.technicalSkills?.join(', ') || 'None'}
- Job Description Context:
${hasJd ? `"""\n${input.jobDescriptionText!.trim()}\n"""` : 'None provided. Evaluate based on global tech hiring standards for this target role.'}

### RESUME CONTENT TO AUDIT:
${JSON.stringify(data, null, 2)}

### STRICT AUDITING RULES:
1. Anti-Hallucination: DO NOT invent fake employment, fake companies, fake degrees, or false metrics.
2. For freshers/students, lack of formal employment is normal; evaluate their engineering projects, problem-solving, and coursework.
3. Every suggestion MUST quote actual evidence from the candidate's resume and provide an improved text replacement ready for the student to accept or edit.
4. When suggesting quantified outcomes in project or experience bullets, you MUST format numbers with explicit bracket placeholders (e.g. "[reduced query latency by X%]", "[handled ~N concurrent API requests]") so the student is prompted to provide true figures.
5. Identify real weaknesses: weak action verbs (e.g. "Worked on", "Helped with"), vague project scopes, repetition, missing tech stack tags, or unformatted links.

### OUTPUT JSON SCHEMA:
Respond with ONLY a valid, parseable JSON object matching this structure (no surrounding markdown code fences, no extra commentary):
{
  "contentQuality": {
    "summaryQuality": {
      "rating": "strong", // "strong" | "good" | "needs-work"
      "findings": ["Direct finding about summary strength, brevity, and role alignment"]
    },
    "projectDescriptions": {
      "rating": "good",
      "findings": ["Finding regarding depth, tech stack clarity, and engineering outcomes"]
    },
    "actionVerbsQuality": {
      "rating": "needs-work",
      "findings": ["Analysis of bullet-point action verbs vs passive phrases"]
    },
    "measurableOutcomes": {
      "rating": "needs-work",
      "findings": ["Analysis of quantified metrics, scalability, or performance indicators"]
    },
    "grammarAndClarity": {
      "rating": "strong",
      "findings": ["Notes on grammatical consistency, punctuation, and active voice"]
    }
  },
  "roleSuitability": {
    "technicalRelevance": {
      "rating": "strong",
      "notes": "Assessment of how technical skills align with ${input.targetRole}"
    },
    "projectRelevance": {
      "rating": "good",
      "notes": "Assessment of how projects demonstrate competencies required for ${input.targetRole}"
    },
    "courseworkRelevance": {
      "rating": "good",
      "notes": "Relevance of academic coursework to target role foundations"
    },
    "experienceRelevance": {
      "rating": "good",
      "notes": "Relevance of internships or leadership to target role"
    }
  },
  ${hasJd ? `"jdMatching": {
    "matchingRequiredSkills": ["Skill 1", "Skill 2"],
    "missingRequiredSkills": ["Skill 3"],
    "matchingPreferredSkills": ["Tool A"],
    "matchingKeywords": ["Keyword 1", "Keyword 2"],
    "missingKeywords": ["Keyword 3"],
    "highlightedEvidence": ["Evidence from projects or coursework matching the JD"]
  },` : ''}
  "completeness": {
    "hasContact": true,
    "hasSummary": true,
    "hasEducation": true,
    "hasSkills": true,
    "hasProjects": true,
    "hasExperience": true,
    "hasCertifications": true,
    "hasAchievements": true,
    "hasCoursework": true,
    "isFresherAppropriate": true,
    "notes": ["Positive remarks on complete sections or missing optional high-value sections"]
  },
  "atsReadability": {
    "standardHeadingsUsed": true,
    "contactParsable": true,
    "formattingRisk": "low", // "low" | "moderate" | "high"
    "overflowRisk": "none", // "none" | "potential-overflow"
    "unresolvedPlaceholders": [],
    "detectedSymbolsOrDecorations": [],
    "notes": ["Clear assessment of machine parsing safety"]
  },
  "suggestions": [
    {
      "id": "sug-1",
      "title": "Strengthen Project Bullet with Action Verbs & Metrics",
      "whyItMatters": "Technical screeners scan project bullets for measurable contributions and specific tools.",
      "evidence": "Exact text quoted from resume",
      "recommendedImprovement": "Architected responsive dashboard utilizing React and TypeScript, optimizing state re-renders to achieve [X%] faster page response times.",
      "expectedBenefit": "Increases recruiter confidence by demonstrating engineering rigor and measurable impact.",
      "priority": "high", // "high" | "medium" | "low"
      "section": "projects", // "summary" | "projects" | "experience" | "technical_skills" | "education" | "certifications" | "achievements"
      "targetItemId": "optional project ID or experience ID if specific",
      "category": "content-quality", // "content-quality" | "target-role-suitability" | "job-description-matching" | "resume-completeness" | "ats-readability"
      "placeholdersUsed": ["[X%]"],
      "isFactualCheckRequired": true
    }
  ]
}
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return parseReviewResponse(response.text);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[ResumeReview] gemini-3.8-flash failed (${errorMsg}), retrying with gemini-3.1-flash-lite...`);

    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return parseReviewResponse(fallbackResponse.text);
  }
}

function parseReviewResponse(rawText: string | undefined): any {
  if (!rawText) {
    throw new Error('Received empty response from AI resume review service.');
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI review JSON:', cleaned);
    throw new Error('Invalid JSON format returned from AI review engine.');
  }
}
