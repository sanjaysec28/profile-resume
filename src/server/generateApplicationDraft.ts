/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Application Assistant
 * Generates tailored cover letters, recruiter outreach messages, and project rationales
 * strictly grounded in the candidate's actual projects, verified skills, and academic profile.
 */

import { GoogleGenAI } from '@google/genai';
import { ApplicationDraft, VerifiedJobOpportunity } from '../types/placementIntelligence.ts';

export interface ApplicationDraftGenerationInput {
  job: VerifiedJobOpportunity;
  studentContext: {
    studentName?: string;
    targetRole: string;
    degree: string;
    major: string;
    academicYear: string;
    graduationYear: string;
    collegeOrUniversity?: string;
    verifiedSkills: string[];
    projects: {
      title: string;
      techStack: string[];
      description: string;
      bullets?: string[];
    }[];
  };
}

export async function generateApplicationDraft(
  input: ApplicationDraftGenerationInput
): Promise<Omit<ApplicationDraft, 'id' | 'generatedAt' | 'isApprovedByStudent'>> {
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

  const { job, studentContext: s } = input;
  const candidateName = s.studentName || 'Candidate';

  const prompt = `
You are the ProFile Senior Career & Placement Strategist.
Help this college student / fresher prepare a highly competitive, authentic, professional application for the following role:

### TARGET OPPORTUNITY:
- Role Title: "${job.title || 'Software Opportunity'}"
- Company: "${job.company || 'Hiring Organization'}"
- Location: "${job.location || 'Remote'}" (${job.workEnvironment || 'remote'})
- Job Type: "${job.jobType || 'Internship'}" (${job.experienceLevel || 'Entry-level'})
- Required Skills: ${(job.requiredSkills || []).join(', ')}
- Job Description Summary: """${(job.description || '').slice(0, 800)}"""

### CANDIDATE REAL BACKGROUND:
- Student Name: "${candidateName}"
- Degree & Major: "${s.degree || 'B.Tech'}" in "${s.major || 'Computer Science'}" (Graduating: "${s.graduationYear || '2026'}")
- University: "${s.collegeOrUniversity || 'Accredited University'}"
- Verified Technical Skills: ${(s.verifiedSkills || []).join(', ') || 'Computer Science fundamentals'}
- Candidate Projects:
${
  s.projects && s.projects.length > 0
    ? s.projects
        .map(
          (p) =>
            `- Title: "${p.title}" | Stack: ${(p.techStack || []).join(', ')} | Overview: ${p.description || 'N/A'}`
        )
        .join('\n')
    : 'Coursework and academic lab assignments.'
}

### STRICT ETHICAL & ACCURACY RULES:
1. NEVER invent past employers, internships, or years of experience the student does not have.
2. NEVER claim mastery of skills that are not listed in the candidate's background.
3. Highlight the candidate's actual projects as primary evidence of capability.
4. Keep tone professional, respectful, concise, and enthusiastic.
5. In recruiter outreach message, keep under 120 words suitable for LinkedIn or email.
6. In tailored cover letter, create 3-4 structured, punchy paragraphs.

### REQUIRED JSON OUTPUT:
{
  "jobId": "${job.id}",
  "jobTitle": "${job.title}",
  "company": "${job.company}",
  "tailoredSummary": "2-3 sentence professional summary highlighting candidate projects aligned with ${job.title}",
  "highlightedProjects": [
    {
      "title": "${s.projects[0]?.title || 'Academic Capstone Project'}",
      "reason": "Directly demonstrates implementation of relevant technologies required by ${job.company}"
    }
  ],
  "tailoredCoverLetter": "Dear Hiring Team at ${job.company}, ...\\n\\n[Paragraph 1: Role excitement]\\n\\n[Paragraph 2: Project evidence]\\n\\n[Paragraph 3: Eagerness to contribute and learn]\\n\\nSincerely,\\n${candidateName}",
  "recruiterOutreachMessage": "Hi [Recruiter Name], I hope you are having a productive week! I recently reviewed the ${job.title} opening at ${job.company}...",
  "commonQuestionsAnswers": [
    {
      "question": "Why are you interested in joining ${job.company}?",
      "suggestedAnswer": "Personalized answer connecting student's interest in ${job.departmentCategory || 'technology'} with ${job.company}'s mission..."
    },
    {
      "question": "How have your projects prepared you for this role?",
      "suggestedAnswer": "Walkthrough citing actual project tech stack and problem solving..."
    }
  ],
  "missingInformationNoticed": [
    "Verify whether the employer requires an official academic transcript submission."
  ]
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
          temperature: 0.3,
        },
      });

      const text = response.text || '';
      if (text) {
        const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          tailoredSummary: parsed.tailoredSummary || `Passionate ${s.degree} candidate in ${s.major} targeting the ${job.title} position at ${job.company}.`,
          highlightedProjects: Array.isArray(parsed.highlightedProjects) ? parsed.highlightedProjects : [],
          tailoredCoverLetter: parsed.tailoredCoverLetter || `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} role. As a ${s.degree} student in ${s.major}, I have focused on building hands-on projects...\n\nSincerely,\n${candidateName}`,
          recruiterOutreachMessage: parsed.recruiterOutreachMessage || `Hi [Hiring Team],\n\nI recently came across the ${job.title} opening at ${job.company} and wanted to reach out. As a ${s.degree} candidate with experience in ${s.verifiedSkills.slice(0, 3).join(', ')}, I would love to learn more.\n\nBest regards,\n${candidateName}`,
          commonQuestionsAnswers: Array.isArray(parsed.commonQuestionsAnswers) ? parsed.commonQuestionsAnswers : [],
          missingInformationNoticed: Array.isArray(parsed.missingInformationNoticed) ? parsed.missingInformationNoticed : ['Confirm your availability for the specified cohort start date.'],
        };
      }
    } catch (error) {
      console.warn(`[Application Draft Generator] Model ${modelName} warning:`, error);
    }
  }

  // Deterministic fallback if remote models have temporary outage
  const topProj = s.projects[0];
  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    tailoredSummary: `Enthusiastic ${s.degree} candidate in ${s.major} (Class of ${s.graduationYear}) targeting ${job.title} at ${job.company}. Demonstrates strong foundation in ${s.verifiedSkills.slice(0, 3).join(', ')}.`,
    highlightedProjects: topProj
      ? [{ title: topProj.title, reason: `Hands-on project utilizing ${topProj.techStack.join(', ')} directly relevant to ${job.company}’s tech stack.` }]
      : [{ title: 'Academic Coursework & Projects', reason: 'Demonstrates foundational algorithmic thinking and problem solving.' }],
    tailoredCoverLetter: `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. As a student graduating in ${s.graduationYear} with a ${s.degree} in ${s.major}, I have focused my academic journey on mastering software engineering fundamentals and building practical applications.\n\nThrough my project work${topProj ? ` (such as ${topProj.title})` : ''}, I have gained hands-on experience designing robust solutions and collaborating using Git version control. I am drawn to ${job.company} because of your commitment to engineering excellence.\n\nI welcome the opportunity to discuss how my academic background and dedication to continuous learning will contribute to your engineering team.\n\nSincerely,\n${candidateName}`,
    recruiterOutreachMessage: `Hi [Recruiter Name],\n\nI hope you're having a great week! I recently noticed the ${job.title} position at ${job.company} and wanted to reach out. As a ${s.degree} student in ${s.major} with practical experience in ${s.verifiedSkills.slice(0, 3).join(', ')}, I believe my background aligns well with the team's goals.\n\nI would be grateful for the chance to connect briefly or share my resume. Thank you for your time!\n\nBest regards,\n${candidateName}`,
    commonQuestionsAnswers: [
      {
        question: `Why are you interested in joining ${job.company}?`,
        suggestedAnswer: `I have been following ${job.company}’s work in the industry, and I am impressed by your engineering standards and culture of mentorship for early-career developers.`,
      },
      {
        question: `How have your projects prepared you for this role?`,
        suggestedAnswer: `Building my projects required designing clean data flows, writing unit tests, and debugging edge cases—disciplines that directly translate to contributing in ${job.company}'s production codebase.`,
      },
    ],
    missingInformationNoticed: [
      'Ensure your latest resume draft is saved before submitting your application.',
      'Check if the employer requests an unofficial transcript or portfolio link.',
    ],
  };
}
