/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Interview Coach & Mentor
 * Interactive chat assistant focused on technical drills, HR rehearsal, and answer breakdowns.
 */

import { GoogleGenAI } from '@google/genai';
import { InterviewCoachMessage } from '../types/interviewIntelligence.ts';

export interface InterviewCoachInput {
  message: string;
  history?: InterviewCoachMessage[];
  context?: {
    targetRole?: string;
    academicYear?: string;
    degree?: string;
    verifiedSkills?: string[];
    weakTopics?: string[];
    recentMockScore?: number;
    resumeProjects?: string[];
  };
}

export async function chatWithInterviewCoach(input: InterviewCoachInput): Promise<string> {
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

  const ctx = input.context || {};
  const targetRole = ctx.targetRole || 'Software Engineer';

  const systemContext = `
You are the ProFile Senior Interview Coach & Technical Mentor.
Your role is to help students, freshers, and early-career candidates prepare for placement interviews with confidence, clarity, and technical precision.

### STUDENT CONTEXT:
- Target Role: "${targetRole}"
- Academic Standing: "${ctx.academicYear || 'Undergraduate'}" (Degree: "${ctx.degree || 'B.Tech/BS'}")
- Verified Skills: ${(ctx.verifiedSkills || []).slice(0, 8).join(', ') || 'Core CS fundamentals'}
- Weak / Revision Topics: ${(ctx.weakTopics || []).slice(0, 5).join(', ') || 'System Design, Dynamic Programming'}
- Recent Mock Interview Score: ${ctx.recentMockScore !== undefined ? `${ctx.recentMockScore}/100` : 'None yet'}
- Documented Projects: ${(ctx.resumeProjects || []).join(', ') || 'Standard course projects'}

### COACHING RULES:
1. Conduct realistic drills: When the user asks for questions, ask 1 or 2 focused questions at a time, then invite their answer.
2. Critique constructive: Point out strong aspects, illuminate gaps, and demonstrate how to structure answers with the STAR technique or standard architectural flow.
3. Keep answers educational and concise: Use bullet points and bold headers for scannability.
4. ABSOLUTE RULE: Never guarantee placement, job offers, or exact salaries. Keep expectations realistic and focused on engineering craftsmanship.
`;

  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemContext}\n\nStudent message: "${input.message}"` }],
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
      console.warn(`[Interview Coach] Model ${modelName} warning:`, error);
    }
  }

  // Grounded fallback response if AI endpoints have temporary spikes
  return `### Interview Coach Guidance for ${targetRole}\n\nHere is how to approach this topic effectively in upcoming placement interviews:\n\n1. **Lead with Core Definitions:** Always define the principle in 1-2 sentences before diving into syntax or details.\n2. **Highlight Trade-offs:** Real interviewers love hearing *why* you chose one solution over an alternative.\n3. **Cite Your Resume Experience:** Connect your answer directly to your projects to prove practical application.\n\n*(Note: AI service is currently experiencing high demand; I am ready to evaluate any specific answer you submit!)*`;
}
