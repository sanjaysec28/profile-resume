/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Interview Question Generator
 * Generates role-specific, student-tailored interview questions using Gemini models.
 */

import {
  InterviewQuestion,
  QuestionGenerationInput,
} from '../types/interviewIntelligence.ts';
import { FALLBACK_QUESTIONS_BY_CATEGORY } from '../lib/interviewPrepData.ts';
import { generateContentWithFallback, GEMINI_GENERATION_MODELS } from './geminiConfig.ts';

export async function generateInterviewQuestions(
  input: QuestionGenerationInput
): Promise<InterviewQuestion[]> {

  const isResumeFocused = input.category === 'resume-focused' || input.category === 'projects-experience';
  const role = input.targetRole || 'Software Engineer';
  const count = Math.min(Math.max(input.count || 5, 3), 15);

  const prompt = `
You are the ProFile Senior Engineering Interviewer & Placement Director.
Generate ${count} highly realistic, practical interview questions tailored for a college student / fresher candidate targeting the role of "${role}".

### CANDIDATE BACKGROUND:
- Target Role: "${role}"
- Academic Standing: "${input.academicYear || '3rd/4th Year'}" (Degree: "${input.degree || 'B.Tech/BS'}")
- Verified Technical Skills: ${(input.verifiedSkills || []).slice(0, 10).join(', ') || 'General CS fundamentals'}
- Known Competency Gaps: ${(input.missingSkills || []).slice(0, 6).join(', ') || 'Advanced frameworks, System scale'}
- Student Projects from Resume:
${
  (input.projectsSummary || []).length > 0
    ? (input.projectsSummary || [])
        .map(
          (p) =>
            `- Project Title: "${p.title}" | Stack: ${p.techStack.join(', ')} | Overview: ${p.description || 'N/A'}`
        )
        .join('\n')
    : 'No complex projects documented yet.'
}
${
  input.jobDescriptionText
    ? `- Target Job Description Excerpt: """${input.jobDescriptionText.slice(0, 500)}"""`
    : ''
}

### INTERVIEW SPECIFICATIONS:
- Category Requested: "${input.category}"
- Target Difficulty: "${input.difficulty}" (Calibrate for campus placement / internship / junior engineering level; do NOT ask staff/principal architect questions)
${isResumeFocused ? '- CRITICAL: Ground questions directly in the candidate’s documented projects, languages, and technical choices. Ask them WHY they chose those tools, how they handled edge cases, and their debugging process. Never invent fictional projects.' : ''}

### REQUIRED OUTPUT FORMAT:
Return a valid JSON object matching:
{
  "questions": [
    {
      "id": "q_1",
      "question": "Clear, specific question text",
      "category": "${input.category}",
      "difficulty": "${input.difficulty}",
      "whyAsked": "Why hiring managers ask this in placements",
      "topic": "Specific sub-topic name",
      "hints": ["Helpful nudge if candidate gets stuck", "Another hint"],
      "evaluationCriteria": ["Key technical concept to mention", "Trade-off or edge case"],
      "isResumeDerived": ${isResumeFocused ? 'true' : 'false'},
      "resumeAnchor": "${input.projectsSummary?.[0]?.title || ''}"
    }
  ]
}
`;

  try {
    const { text } = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.3,
      models: GEMINI_GENERATION_MODELS,
      operationName: 'Interview Question Generation',
    });

    const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return parsed.questions.map((q: any, idx: number) => ({
        id: q.id || `q_gen_${Date.now()}_${idx}`,
        question: q.question,
        category: q.category || input.category,
        difficulty: q.difficulty || input.difficulty,
        whyAsked: q.whyAsked || 'Evaluates role readiness and conceptual clarity.',
        topic: q.topic || 'Core Engineering',
        hints: Array.isArray(q.hints) ? q.hints : ['Think about basic principles and real-world usage.'],
        evaluationCriteria: Array.isArray(q.evaluationCriteria) ? q.evaluationCriteria : ['Accuracy', 'Clarity'],
        isResumeDerived: Boolean(q.isResumeDerived),
        resumeAnchor: q.resumeAnchor || undefined,
      }));
    }
  } catch (error) {
    console.warn('[Interview Questions] AI generation fallback triggered:', error);
  }

  // Graceful fallback to rich curated question bank if remote AI experiences demand spikes
  return getCuratedFallbackQuestions(input);
}

function getCuratedFallbackQuestions(input: QuestionGenerationInput): InterviewQuestion[] {
  const categoryKey = input.category === 'mixed-comprehensive' ? 'technical-fundamentals' : input.category;
  const list = FALLBACK_QUESTIONS_BY_CATEGORY[categoryKey] || FALLBACK_QUESTIONS_BY_CATEGORY['technical-fundamentals'];

  // If resume-focused, synthesize from candidate's actual projects
  if (input.category === 'resume-focused' && input.projectsSummary && input.projectsSummary.length > 0) {
    const proj = input.projectsSummary[0];
    const tech = proj.techStack.join(', ') || 'the chosen technology';
    return [
      {
        id: `q_rf_1_${Date.now()}`,
        question: `In your project "${proj.title}", walk me through why you selected ${tech}. What alternative approaches did you consider?`,
        category: 'resume-focused',
        difficulty: input.difficulty,
        whyAsked: 'Assesses whether the candidate makes conscious architectural choices or merely copies tutorial code.',
        topic: 'Technology Selection & Trade-offs',
        hints: ['Discuss trade-offs such as community ecosystem, learning curve, and latency.'],
        evaluationCriteria: ['Clear architectural rationale', 'Awareness of alternatives', 'Honesty about project constraints'],
        isResumeDerived: true,
        resumeAnchor: proj.title,
      },
      {
        id: `q_rf_2_${Date.now()}`,
        question: `What was the most challenging technical roadblock or bug you encountered while building "${proj.title}", and how did you debug it?`,
        category: 'resume-focused',
        difficulty: input.difficulty,
        whyAsked: 'Measures persistence, systematic troubleshooting, and engineering depth under ambiguity.',
        topic: 'Debugging & Problem Solving',
        hints: ['Use the STAR framework: Situation, Task, Action (tools/logs used), and Result.'],
        evaluationCriteria: ['Specific description of root cause', 'Methodical debugging steps', 'Verification that fix succeeded'],
        isResumeDerived: true,
        resumeAnchor: proj.title,
      },
      {
        id: `q_rf_3_${Date.now()}`,
        question: `If you had another month to work on "${proj.title}", what performance optimization or architectural upgrade would you prioritize?`,
        category: 'resume-focused',
        difficulty: input.difficulty,
        whyAsked: 'Evaluates critical self-reflection and engineering vision for production readiness.',
        topic: 'Scalability & Future Architecture',
        hints: ['Consider indexing, caching, asynchronous queues, or automated integration tests.'],
        evaluationCriteria: ['Realistic scalability thinking', 'Identification of technical debt', 'Pragmatic prioritization'],
        isResumeDerived: true,
        resumeAnchor: proj.title,
      },
    ];
  }

  return list.map((q, idx) => ({
    ...q,
    id: `q_fb_${Date.now()}_${idx}`,
    difficulty: input.difficulty,
  }));
}
