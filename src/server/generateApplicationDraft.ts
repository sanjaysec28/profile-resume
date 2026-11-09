/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Application Assistant
 * Generates tailored cover letters, recruiter outreach messages, and project rationales
 * strictly grounded in the candidate's actual projects, verified skills, and academic profile.
 */

import { ApplicationDraft, VerifiedJobOpportunity } from '../types/placementIntelligence.ts';
import { generateContentWithFallback, GEMINI_GENERATION_MODELS } from './geminiConfig.ts';

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
  "roleSummary": "Concise 2-sentence summary of the role's primary focus and expected technical contributions at ${job.company}",
  "checklist": [
    "Verify target graduation cohort matches ${job.company}'s requirements",
    "Review technical resume to highlight relevant technologies (${(job.requiredSkills || []).slice(0, 2).join(', ')})",
    "Attach verified GitHub repository link showcasing hands-on builds",
    "Tailor cover letter emphasizing genuine interest in ${job.company}"
  ],
  "missingDocuments": [
    "Official / Unofficial University Transcript",
    "GitHub Portfolio / Live Project Links",
    "Tailored Cover Letter"
  ],
  "resumeImprovements": [
    "Position practical project experience prominently in the top half of your resume",
    "Explicitly reference ${(job.requiredSkills || []).slice(0, 2).join(' and ')} in project bullet points with measurable impact"
  ],
  "tailoredSummary": "2-3 sentence professional summary highlighting candidate projects aligned with ${job.title}",
  "highlightedProjects": [
    {
      "title": "${s.projects?.[0]?.title || 'Academic Capstone Project'}",
      "reason": "Directly demonstrates implementation of relevant technologies required by ${job.company}"
    }
  ],
  "tailoredCoverLetter": "Dear Hiring Team at ${job.company}, ...\\n\\n[Paragraph 1: Role excitement]\\n\\n[Paragraph 2: Project evidence]\\n\\n[Paragraph 3: Eagerness to contribute and learn]\\n\\nSincerely,\\n${candidateName}",
  "recruiterOutreachMessage": "Hi [Recruiter Name], I hope you are having a productive week! I recently reviewed the ${job.title} opening at ${job.company}...",
  "recruiterFollowUpMessage": "Hi [Recruiter Name], I hope you're doing well! Following up on my recent application for the ${job.title} role...",
  "applicationEmailSubject": "Application: ${job.title} — ${candidateName}",
  "applicationEmailBody": "Dear ${job.company} Hiring Team,\\n\\nPlease accept my application for the ${job.title} position...\\n\\nBest regards,\\n${candidateName}",
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
  "interviewRecommendations": [
    "Review fundamental data structures and time complexity analysis",
    "Prepare a structured walkthrough of ${s.projects?.[0]?.title || 'your key project'} covering architecture and trade-offs",
    "Review ${job.company}'s engineering values and recent technical initiatives"
  ],
  "missingInformationNoticed": [
    "Verify whether the employer requires an official academic transcript submission."
  ]
}
`;

  try {
    const { text } = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.3,
      models: GEMINI_GENERATION_MODELS,
      operationName: 'Application Draft Generator',
    });

    const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      isAiGenerated: true,
      generationSource: 'gemini',
      roleSummary: parsed.roleSummary || `${job.title} at ${job.company} focusing on scalable solutions and engineering excellence.`,
      checklist: Array.isArray(parsed.checklist) ? parsed.checklist : [
        `Confirm graduation cohort eligibility for ${job.title}`,
        'Verify resume tech stack matches key requirements',
        'Ensure public GitHub repository links are accessible',
      ],
      missingDocuments: Array.isArray(parsed.missingDocuments) ? parsed.missingDocuments : [
        'Updated Resume (PDF format)',
        'Academic Transcript (if requested by employer)',
      ],
      resumeImprovements: Array.isArray(parsed.resumeImprovements) ? parsed.resumeImprovements : [
        `Highlight experience with ${(job.requiredSkills || []).slice(0, 2).join(' and ')} in your project descriptions`,
        'Ensure contact information and graduation year are prominent',
      ],
      tailoredSummary: parsed.tailoredSummary || `Passionate ${s.degree} candidate in ${s.major} targeting the ${job.title} position at ${job.company}.`,
      highlightedProjects: Array.isArray(parsed.highlightedProjects) ? parsed.highlightedProjects : [],
      tailoredCoverLetter: parsed.tailoredCoverLetter || `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} role. As a ${s.degree} student in ${s.major}, I have focused on building hands-on projects...\n\nSincerely,\n${candidateName}`,
      recruiterOutreachMessage: parsed.recruiterOutreachMessage || `Hi [Hiring Team],\n\nI recently came across the ${job.title} opening at ${job.company} and wanted to reach out. As a ${s.degree} candidate with experience in ${(s.verifiedSkills || []).slice(0, 3).join(', ')}, I would love to learn more.\n\nBest regards,\n${candidateName}`,
      recruiterFollowUpMessage: parsed.recruiterFollowUpMessage || `Hi [Recruiter Name],\n\nI hope your week is going well! I am writing to politely follow up on my application for the ${job.title} role submitted recently. I remain very enthusiastic about the opportunity to contribute to ${job.company}.\n\nThank you for your time and consideration!\n\nBest regards,\n${candidateName}`,
      applicationEmailSubject: parsed.applicationEmailSubject || `Application: ${job.title} — ${candidateName}`,
      applicationEmailBody: parsed.applicationEmailBody || `Dear Hiring Team at ${job.company},\n\nI am writing to submit my application for the ${job.title} position. Attached please find my resume detailing my projects and coursework.\n\nThank you for your consideration.\n\nSincerely,\n${candidateName}`,
      commonQuestionsAnswers: Array.isArray(parsed.commonQuestionsAnswers) ? parsed.commonQuestionsAnswers : [],
      interviewRecommendations: Array.isArray(parsed.interviewRecommendations) ? parsed.interviewRecommendations : [
        'Review core algorithms and data structures',
        'Prepare 2-3 specific technical challenges solved during project work',
      ],
      missingInformationNoticed: Array.isArray(parsed.missingInformationNoticed) ? parsed.missingInformationNoticed : ['Confirm your availability for the specified cohort start date.'],
    };
  } catch (error) {
    console.warn('[Application Draft Generator] AI generation fallback triggered:', error);
  }

  // Deterministic fallback if remote models have temporary outage
  const topProj = s.projects?.[0];
  const reqSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const degree = s.degree || 'B.Tech';
  const major = s.major || 'Computer Science';
  const gradYear = s.graduationYear || '2026';

  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    isAiGenerated: false,
    generationSource: 'structured-fallback',
    roleSummary: `${job.title} opportunity at ${job.company}${reqSkills.length ? ` requiring ${reqSkills.slice(0, 3).join(', ')}` : ''}.`,
    checklist: [
      `Review cohort eligibility: ${job.requiredQualifications?.[0] || 'Check graduating batches'}`,
      `Tailor resume technical summary for ${job.title}`,
      `Verify project links for ${topProj?.title || 'featured projects'} are live and accessible`,
      'Review official job description before submitting application',
    ],
    missingDocuments: [
      'Tailored Resume (PDF)',
      'Academic Transcript / Grade Card (if required)',
      'GitHub / Live Project Portfolio Links',
    ],
    resumeImprovements: [
      `Feature ${topProj?.title || 'your technical projects'} prominently at the top of your experience/projects section.`,
      `Emphasize hands-on usage of ${reqSkills.slice(0, 3).join(', ') || 'core technologies'} in bullet points.`,
      'Include quantitative metrics (e.g. users, performance, latency, test coverage) where genuine.',
    ],
    tailoredSummary: `Enthusiastic ${degree} candidate in ${major} (Class of ${gradYear}) targeting ${job.title} at ${job.company}. Demonstrates strong foundation in ${(s.verifiedSkills || []).slice(0, 3).join(', ') || 'software engineering'}.`,
    highlightedProjects: topProj
      ? [{ title: topProj.title, reason: `Hands-on project utilizing ${(topProj.techStack || []).join(', ')} directly relevant to ${job.company}’s tech stack.` }]
      : [{ title: 'Academic Coursework & Projects', reason: 'Demonstrates foundational algorithmic thinking and problem solving.' }],
    tailoredCoverLetter: `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. As a student graduating in ${gradYear} with a ${degree} in ${major}, I have focused my academic journey on mastering software engineering fundamentals and building practical applications.\n\nThrough my project work${topProj ? ` (such as ${topProj.title})` : ''}, I have gained hands-on experience designing robust solutions and collaborating using Git version control. I am drawn to ${job.company} because of your commitment to engineering excellence.\n\nI welcome the opportunity to discuss how my academic background and dedication to continuous learning will contribute to your engineering team.\n\nSincerely,\n${candidateName}`,
    recruiterOutreachMessage: `Hi [Recruiter Name],\n\nI hope you're having a great week! I recently noticed the ${job.title} position at ${job.company} and wanted to reach out. As a ${degree} student in ${major} with practical experience in ${(s.verifiedSkills || []).slice(0, 3).join(', ') || 'modern software development'}, I believe my background aligns well with the team's goals.\n\nI would be grateful for the chance to connect briefly or share my resume. Thank you for your time!\n\nBest regards,\n${candidateName}`,
    recruiterFollowUpMessage: `Hi [Recruiter Name],\n\nI hope you are doing well! I wanted to follow up briefly on my application for the ${job.title} role submitted approximately a week ago. I remain very enthusiastic about the position and the engineering culture at ${job.company}.\n\nPlease let me know if any additional information or portfolio work would be helpful. Thank you for your time!\n\nBest regards,\n${candidateName}`,
    applicationEmailSubject: `Application: ${job.title} — ${candidateName}`,
    applicationEmailBody: `Dear Hiring Team at ${job.company},\n\nI am pleased to submit my application for the ${job.title} opportunity. As a student in ${major} graduating in ${gradYear}, I have developed hands-on technical competencies in ${(s.verifiedSkills || []).slice(0, 4).join(', ') || 'software engineering'} through projects such as ${topProj?.title || 'my capstone project'}.\n\nMy resume is attached for your review. I look forward to hearing from you regarding potential next steps.\n\nSincerely,\n${candidateName}`,
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
    interviewRecommendations: [
      `Review core data structures and problem solving in ${(s.verifiedSkills || []).slice(0, 2).join(' or ')}`,
      `Be prepared to explain the architectural design and trade-offs of ${topProj?.title || 'your recent project'}`,
      `Review ${job.company}'s main business focus and customer-facing products`,
    ],
    missingInformationNoticed: [
      'Ensure your latest resume draft is saved before submitting your application.',
      'Check if the employer requests an unofficial transcript or portfolio link.',
    ],
  };
}
