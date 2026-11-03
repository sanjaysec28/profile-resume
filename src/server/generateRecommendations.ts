/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Recommendation Engine
 * Uses @google/genai with model 'gemini-3.8-flash'
 * Produces structured, student-specific resume recommendations.
 */

import { GoogleGenAI } from '@google/genai';
import {
  RecommendationsGenerationInput,
  ResumeRecommendationsData,
} from '../types/recommendations.ts';

/**
 * Generates personalized, verifiable resume recommendations using Gemini 3.8 Flash.
 */
export async function generateResumeRecommendations(
  input: RecommendationsGenerationInput
): Promise<Omit<ResumeRecommendationsData, 'id' | 'setupId' | 'userId' | 'createdAt' | 'updatedAt'>> {
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

  const prompt = `
You are the ProFile Senior Career & Resume Architect. Analyze this student candidate and their target role to generate intelligent, actionable, evidence-based recommendations.

### CANDIDATE INPUT CONTEXT:
- Resume Purpose: "${input.purpose}"
- Target Role: "${input.targetRole}"
- Academic Degree & Major: "${input.degree}" in "${input.department}"
- Academic Standing: "${input.academicYear}" (Graduation Year: "${input.graduationYear}")
- Job Description: ${
    input.jobDescriptionText && input.jobDescriptionText.trim().length > 0
      ? `"""\n${input.jobDescriptionText.trim()}\n"""`
      : 'None provided. Use current industry standards and employer expectations for this target role.'
  }

### CANDIDATE EXISTING BACKGROUND:
- Existing Technical Skills: ${
    input.existingSkills?.technical?.length
      ? input.existingSkills.technical.join(', ')
      : 'None listed yet'
  }
- Existing Soft Skills: ${
    input.existingSkills?.soft?.length
      ? input.existingSkills.soft.join(', ')
      : 'None listed yet'
  }
- Existing Projects (${input.existingProjects?.length || 0}):
${
  input.existingProjects?.map(
    (p, idx) => `  ${idx + 1}. "${p.title}" | Stack: ${p.techStack.join(', ')} | Desc: ${p.description}`
  ).join('\n') || '  (No projects created yet)'
}
- Existing Experience (${input.existingExperience?.length || 0}):
${
  input.existingExperience?.map(
    (e, idx) => `  ${idx + 1}. ${e.position} at ${e.company}`
  ).join('\n') || '  (No formal work experience listed yet)'
}
- Existing Education:
${
  input.existingEducation?.map(
    (ed, idx) => `  ${idx + 1}. ${ed.degree} in ${ed.fieldOfStudy} at ${ed.institution}`
  ).join('\n') || '  (No education listed yet)'
}

### GENERATION RULES:
1. Technical Skills:
   - Provide 4-6 essential skills strictly required for ${input.targetRole}.
   - Provide 3-5 supporting skills that give an edge.
   - Provide 2-3 beginner-friendly skills calibrated for a student in their ${input.academicYear}.
   - Check if the skill is already present in their existing skills (set isAlreadyPresent accordingly).
2. Soft Skills:
   - Provide 3-4 professional soft skills directly relevant to a ${input.targetRole} (avoid generic platitudes; provide clear demonstration context).
3. Sections:
   - Suggest the ideal ordering of resume sections tailored to their purpose (${input.purpose}). For example, for a student/intern with limited experience, Education or Projects should rank higher than Experience.
   - Explain why optional sections (like Certifications, Coursework, or Achievements) are or are not recommended.
4. Projects:
   - For existing student projects, evaluate how well each one aligns with the target role, assign a relevance score (0-100), and provide concrete bullet-point improvement tips.
   - Suggest 2-3 realistic project ideas the student could build next to fill skill gaps. Explicitly state these are suggestions and NOT completed work.
5. Keywords:
   - Extract 5-8 crucial technical and domain keywords from the job description (or role standard).
   - Indicate whether the candidate's existing resume already matches each keyword or is missing it.
   - Give an actionable example of where each keyword could naturally fit.
6. Certifications:
   - Suggest 2-3 recognized, reputable certification areas or credentials for this role.
   - Set isCompletedByStudent to false. Never state the student already holds an unverified credential.

Return ONLY valid JSON matching this structure:
{
  "targetRole": "${input.targetRole}",
  "purpose": "${input.purpose}",
  "sourceJobDescriptionProvided": ${Boolean(input.jobDescriptionText?.trim())},
  "summaryRationale": "Brief 2-sentence executive summary of the student's alignment and recommended strategy",
  "technicalSkills": [
    {
      "id": "tech-1",
      "title": "Skill Name",
      "category": "essential" | "supporting" | "beginner",
      "proficiencyLevel": "beginner" | "intermediate" | "advanced",
      "importance": "essential" | "high" | "recommended" | "optional",
      "explanation": "Why this skill is needed",
      "whyItMatters": "Specific impact on resume screening",
      "status": "suggested",
      "isAlreadyPresent": false,
      "relatedTechStack": ["RelatedLib1", "RelatedLib2"]
    }
  ],
  "softSkills": [
    {
      "id": "soft-1",
      "title": "Skill Name",
      "importance": "high" | "recommended",
      "explanation": "Concrete explanation",
      "whyItMatters": "Why recruiters look for it in this role",
      "status": "suggested",
      "isAlreadyPresent": false,
      "demonstrationContext": "How to demonstrate in projects or internships"
    }
  ],
  "sections": [
    {
      "id": "sec-1",
      "title": "Section Name",
      "sectionKey": "education" | "projects" | "experience" | "skills" | "certifications" | "coursework" | "achievements",
      "suggestedOrder": 1,
      "isOptional": false,
      "importance": "essential" | "high" | "recommended",
      "explanation": "Why this section should be placed here",
      "whyItMatters": "Recruiter scanning behavior rationale",
      "contentTips": "Actionable advice for this section",
      "status": "suggested"
    }
  ],
  "existingProjectAdvice": [
    {
      "id": "epa-1",
      "title": "Existing Project Title",
      "existingProjectId": "project-id",
      "importance": "high" | "recommended",
      "explanation": "Assessment of relevance",
      "whyItMatters": "How it helps prove technical capabilities",
      "relevanceScore": 85,
      "bulletImprovementTips": ["Tip 1", "Tip 2"],
      "status": "suggested"
    }
  ],
  "suggestedProjectIdeas": [
    {
      "id": "idea-1",
      "title": "Project Idea Title",
      "importance": "recommended" | "optional",
      "explanation": "What this project demonstrates",
      "whyItMatters": "Fills gaps in target role portfolio",
      "techStack": ["React", "TypeScript", "Node.js"],
      "complexity": "Intermediate",
      "sampleDeliverables": ["Deliverable 1", "Deliverable 2"],
      "disclaimer": "Suggested idea for future build; do not mark as completed until built",
      "status": "suggested"
    }
  ],
  "keywords": [
    {
      "id": "kw-1",
      "title": "Keyword",
      "keyword": "Keyword",
      "importance": "essential" | "high" | "recommended",
      "explanation": "Keyword significance in screening",
      "whyItMatters": "ATS parsing relevance",
      "isMatchedInResume": false,
      "suggestedSection": "skills" | "projects" | "summary" | "experience",
      "placementExample": "Example sentence using the keyword naturally",
      "status": "suggested"
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "title": "Certification / Credential Area",
      "importance": "recommended" | "optional",
      "explanation": "What this credential validates",
      "whyItMatters": "Industry recognition",
      "issuingOrganization": "e.g. AWS / Google / Coursera / Meta",
      "credibilityLevel": "Industry Standard",
      "isCompletedByStudent": false,
      "status": "suggested"
    }
  ]
}
`;

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: Error | null = null;
  let parsed: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert technical resume coach and ATS optimization specialist for college students and fresh graduates. You generate fact-based, rigorous resume recommendations. Never hallucinate achievements or claim the student has completed work they have not.',
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error(`Model ${modelName} returned an empty response.`);
      }

      parsed = JSON.parse(responseText);
      break; // Successfully generated and parsed
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Recommendations Model ${modelName} Notice]:`, msg);
      lastError = err instanceof Error ? err : new Error(msg);
      // Continue to fallback model if available
    }
  }

  if (!parsed) {
    throw new Error(`AI Recommendations failed: ${lastError?.message || 'Unable to generate response from available AI models.'}`);
  }

  return {
    targetRole: parsed.targetRole || input.targetRole,
    purpose: parsed.purpose || input.purpose,
    sourceJobDescriptionProvided: parsed.sourceJobDescriptionProvided ?? Boolean(input.jobDescriptionText?.trim()),
    summaryRationale:
      parsed.summaryRationale ||
      `Recommendations tailored for ${input.targetRole} based on your academic background in ${input.department}.`,
    technicalSkills: Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills : [],
    softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills : [],
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    existingProjectAdvice: Array.isArray(parsed.existingProjectAdvice) ? parsed.existingProjectAdvice : [],
    suggestedProjectIdeas: Array.isArray(parsed.suggestedProjectIdeas) ? parsed.suggestedProjectIdeas : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
  };
}
