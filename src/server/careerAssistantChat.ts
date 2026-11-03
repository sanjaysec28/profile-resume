/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Career Assistant Q&A Handler
 * Provides grounded, practical career guidance without promising unrealistic outcomes.
 */

import { GoogleGenAI } from '@google/genai';
import { CareerPlan, CareerChatMessage } from '../types/careerIntelligence.ts';

export interface CareerChatInput {
  question: string;
  history: CareerChatMessage[];
  careerPlan: Partial<CareerPlan>;
}

export async function answerCareerQuestion(input: CareerChatInput): Promise<string> {
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

  const plan = input.careerPlan || {};
  const readiness = plan.readiness;
  const targetRole = plan.targetRole || 'Software Engineer';

  const systemContext = `
You are the ProFile AI Career Assistant — a wise, pragmatic, supportive senior technical career mentor for college students and freshers.
Your mission is to provide clear, actionable, student-friendly engineering guidance towards becoming a successful "${targetRole}".

### STUDENT CAREER CONTEXT:
- Target Role: "${targetRole}"
- Academic Year: "${plan.academicYear || 'Undergraduate'}" (Graduation: "${plan.graduationYear || '2026'}")
- Degree & Major: "${plan.degree || 'B.Tech'}" in "${plan.major || 'Computer Science'}"
- Current Readiness Score: ${readiness?.overallReadinessScore || 50}/100 (${readiness?.readinessLabel || 'Developing'})
- Key Strengths: ${(readiness?.strengths || []).slice(0, 3).join('; ') || 'Foundational programming'}
- Missing Competencies: ${(readiness?.missingCompetencies || []).slice(0, 4).join('; ') || 'Advanced frameworks'}
- Priority Next Actions: ${(readiness?.priorityImprovements || []).join('; ') || 'Deepen project depth'}

### STRICT GUIDELINES:
1. Always be grounded in the student's actual target role and existing competencies.
2. Provide concrete, step-by-step technical advice (e.g., recommend specific libraries, DSA patterns, GitHub practices, or architectural concepts).
3. Keep tone encouraging, professional, and clear. Use bullet points for readability.
4. ABSOLUTE RULE: NEVER guarantee job offers, placement packages, compensation numbers, or internship outcomes. Emphasize continuous skill development and solid engineering portfolios.
5. Answer concisely (2 to 4 focused paragraphs or structured bullet lists).
`;

  // Build message history
  const recentHistory = (input.history || []).slice(-6).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemContext}\n\nStudent Question: "${input.question}"` }],
    },
  ];

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          temperature: 0.4,
        },
      });

      if (response.text && response.text.trim().length > 0) {
        return response.text;
      }
    } catch (error) {
      console.warn(`[Career Chat] Model ${modelName} warning:`, error);
    }
  }

  // Graceful, context-grounded fallback if all remote model endpoints encounter temporary spikes
  const missingSummary = (readiness?.missingCompetencies || []).slice(0, 3).join(', ') || 'key framework competencies';
  return `### Recommendations for ${targetRole}\n\nBased on your profile as a ${plan.academicYear || 'college student'} targeting **${targetRole}**:\n\n1. **Focus on Core Gaps First:** Prioritize bridging ${missingSummary} through hands-on code exercises before moving to specialized topics.\n2. **Build Verifiable Evidence:** Commit a complete end-to-end repository with clear documentation, unit tests, and live demonstration links.\n3. **Follow the Structured Roadmap:** Work through the 6-stage curriculum above sequentially to ensure your conceptual foundations are solid.\n\n*(Note: AI service is currently experiencing high demand; this guidance is synthesized from your verified readiness data.)*`;
}
