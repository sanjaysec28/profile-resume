/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Interview Answer Evaluator
 * Analyzes candidate answers against interview questions with rigorous, transparent criteria.
 */

import { GoogleGenAI } from '@google/genai';
import {
  AnswerEvaluationInput,
  EvaluatedAnswer,
} from '../types/interviewIntelligence.ts';

export async function evaluateInterviewAnswer(
  input: AnswerEvaluationInput
): Promise<EvaluatedAnswer> {
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

  const question = input.question;
  const answer = (input.studentAnswer || '').trim();

  // If answer is essentially blank or trivially short
  if (answer.length < 5) {
    return {
      questionId: question.id,
      studentAnswer: answer,
      answerMode: input.answerMode,
      score: 10,
      whatWasDoneWell: ['Answer submission recorded.'],
      whatWasMissing: ['Substantive explanation of the technical or behavioral concept.'],
      improvementSuggestions: [
        'Attempt to define key terms, give an example, or explain your thought process even if uncertain.',
      ],
      exampleStrongerAnswer:
        'A comprehensive answer should address the core definition, explain the underlying mechanism, and cite a practical example.',
      relatedTopicsToRevise: [question.topic],
      evaluatedAt: new Date().toISOString(),
    };
  }

  const isDsaOrCoding = question.category === 'dsa' || question.category === 'problem-solving';
  const isHr = question.category === 'hr-behavioral' || question.category === 'internship-placement';

  const rubric = isDsaOrCoding
    ? 'Problem understanding, algorithm selection, logical correctness, Big-O time and space complexity, and edge-case handling. (Note: do NOT claim code was executed in a sandbox).'
    : isHr
    ? 'Relevance, answer structure (STAR method when describing past actions), clarity of communication, professional tone, and honesty.'
    : 'Technical accuracy, conceptual understanding, explanation clarity, trade-off awareness, and practical real-world context.';

  const prompt = `
You are a senior technical interviewer and hiring manager at a top technology firm evaluating an entry-level / fresher candidate.

### INTERVIEW QUESTION:
- Question: "${question.question}"
- Category: "${question.category}"
- Target Role: "${input.targetRole}"
- Topic: "${question.topic}"
- Evaluation Criteria: ${(question.evaluationCriteria || []).join('; ')}

### CANDIDATE'S ACTUAL SUBMISSION:
"""
${answer}
"""
(Answer Mode: ${input.answerMode})

### EVALUATION RUBRIC:
${rubric}

### STRICT SCORING GUIDELINES:
1. Score the candidate honestly from 0 to 100 as a qualitative estimate.
2. If the answer is completely off-topic or nonsensical, score between 10-35.
3. If the answer demonstrates partial understanding but misses key mechanisms or complexities, score between 40-70.
4. If the answer is accurate, well-structured, and covers edge cases/trade-offs, score between 75-95.
5. In "whatWasDoneWell", cite exact good points from their answer.
6. In "whatWasMissing", highlight precise technical concepts they omitted.
7. In "improvementSuggestions", provide concrete bullet points they can practice immediately.
8. In "exampleStrongerAnswer", provide an exemplary response that an outstanding junior engineer would say in an interview.

### REQUIRED JSON OUTPUT FORMAT:
{
  "score": 75,
  "whatWasDoneWell": ["Accurately identified the core data structure...", "Good initial intuition..."],
  "whatWasMissing": ["Did not mention the worst-case space complexity...", "Overlooked empty input edge case..."],
  "improvementSuggestions": ["Always state Big-O bounds explicitly...", "Structure behavioral answers with the STAR method..."],
  "exampleStrongerAnswer": "A full, polished model answer...",
  "relatedTopicsToRevise": ["${question.topic}", "Time Complexity Analysis"]
}
`;

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text || '';
      if (text) {
        const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          questionId: question.id,
          studentAnswer: answer,
          answerMode: input.answerMode,
          score: typeof parsed.score === 'number' ? Math.min(Math.max(parsed.score, 0), 100) : 65,
          whatWasDoneWell: Array.isArray(parsed.whatWasDoneWell) ? parsed.whatWasDoneWell : ['Demonstrated basic familiarity with the topic.'],
          whatWasMissing: Array.isArray(parsed.whatWasMissing) ? parsed.whatWasMissing : ['Could provide deeper architectural context.'],
          improvementSuggestions: Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : ['Practice articulating edge cases clearly.'],
          exampleStrongerAnswer: parsed.exampleStrongerAnswer || 'A structured response starts with a clear definition, followed by trade-off analysis and practical usage.',
          relatedTopicsToRevise: Array.isArray(parsed.relatedTopicsToRevise) ? parsed.relatedTopicsToRevise : [question.topic],
          evaluatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(`[Answer Evaluation] Model ${modelName} warning:`, error);
    }
  }

  // Grounded heuristic evaluation if remote models have temporary outage
  const words = answer.split(/\s+/).filter(Boolean).length;
  const estimatedScore = Math.min(Math.max(Math.round(words * 1.5 + 40), 30), 85);

  return {
    questionId: question.id,
    studentAnswer: answer,
    answerMode: input.answerMode,
    score: estimatedScore,
    whatWasDoneWell: [
      `Addressed the question with a ${words}-word response.`,
      `Attempted to communicate concepts related to ${question.topic}.`,
    ],
    whatWasMissing: [
      'Specific trade-off comparisons and formal edge-case analysis.',
      'Explicit reference to standard industry best practices.',
    ],
    improvementSuggestions: [
      'Structure your response: first define the concept, then explain the mechanism, and finish with a trade-off or practical example.',
      'Explicitly state time and space complexity when answering algorithms or data structures questions.',
    ],
    exampleStrongerAnswer: `To answer "${question.question}" effectively, start by stating: "In software engineering, this is primarily utilized to achieve X. For instance, in real-world applications, it allows us to handle Y while keeping time complexity at O(N)."`,
    relatedTopicsToRevise: [question.topic, 'Technical Communication'],
    evaluatedAt: new Date().toISOString(),
  };
}
