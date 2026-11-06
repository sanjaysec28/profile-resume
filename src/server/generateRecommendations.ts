/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Recommendation Engine
 * Uses @google/genai with model 'gemini-3.8-flash'
 * Produces structured, student-specific resume recommendations.
 */

import {
  RecommendationsGenerationInput,
  ResumeRecommendationsData,
} from '../types/recommendations.ts';
import { generateContentWithFallback, GEMINI_GENERATION_MODELS } from './geminiConfig.ts';

/**
 * Generates personalized, verifiable resume recommendations using multi-model fallback.
 */
export async function generateResumeRecommendations(
  input: RecommendationsGenerationInput
): Promise<Omit<ResumeRecommendationsData, 'id' | 'setupId' | 'userId' | 'createdAt' | 'updatedAt'>> {
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

  try {
    const { text: responseText, modelUsed } = await generateContentWithFallback({
      contents: prompt,
      systemInstruction:
        'You are an expert technical resume coach and ATS optimization specialist for college students and fresh graduates. You generate fact-based, rigorous resume recommendations. Never hallucinate achievements or claim the student has completed work they have not.',
      responseMimeType: 'application/json',
      models: GEMINI_GENERATION_MODELS,
      operationName: 'Resume Recommendations',
    });

    const parsed = JSON.parse(responseText);

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
      isAiGenerated: true,
      generationSource: 'gemini',
      modelUsed,
    };
  } catch (error) {
    console.warn('[Resume Recommendations] Remote models unavailable or timed out; generating structured audit fallback:', error);
    return getDeterministicRecommendationsFallback(input);
  }
}

function getDeterministicRecommendationsFallback(input: RecommendationsGenerationInput) {
  const role = input.targetRole || 'Software Engineer';
  const isFrontend = role.toLowerCase().includes('front') || role.toLowerCase().includes('react');
  const isData = role.toLowerCase().includes('data') || role.toLowerCase().includes('analytics') || role.toLowerCase().includes('ml');

  const defaultTech = isFrontend
    ? ['TypeScript', 'React', 'HTML5 & CSS3', 'Tailwind CSS', 'Next.js', 'REST APIs', 'Git']
    : isData
    ? ['Python', 'SQL', 'Pandas & NumPy', 'Data Visualization', 'Scikit-Learn', 'Git']
    : ['Java', 'Python', 'Data Structures & Algorithms', 'SQL', 'RESTful Web Services', 'Git', 'Linux Fundamentals'];

  return {
    targetRole: role,
    purpose: input.purpose,
    sourceJobDescriptionProvided: Boolean(input.jobDescriptionText?.trim()),
    summaryRationale: `Structured industry baseline recommendations tailored for ${role} entry-level candidates.`,
    technicalSkills: defaultTech.map((skill, idx) => ({
      id: `tech-fallback-${idx + 1}`,
      title: skill,
      category: (idx < 3 ? 'essential' : 'supporting') as 'essential' | 'supporting' | 'beginner',
      proficiencyLevel: 'intermediate' as const,
      importance: (idx < 3 ? 'essential' : 'recommended') as 'essential' | 'high' | 'recommended' | 'optional',
      explanation: `Core technical competency heavily evaluated in entry-level ${role} technical screens.`,
      whyItMatters: `Standard industry baseline tool for modern ${role} development.`,
      status: 'suggested' as const,
    })),
    softSkills: [
      {
        id: 'soft-fallback-1',
        title: 'Technical Problem Solving',
        importance: 'essential' as const,
        explanation: 'Ability to deconstruct ambiguous software problems into modular algorithmic steps.',
        whyItMatters: 'Primary attribute evaluated during technical whiteboard and live coding sessions.',
        demonstrationContext: 'Highlight in project descriptions and coding coursework.',
        status: 'suggested' as const,
      },
      {
        id: 'soft-fallback-2',
        title: 'Engineering Collaboration',
        importance: 'high' as const,
        explanation: 'Experience with code reviews, branching models, and cross-functional team discussions.',
        whyItMatters: 'Demonstrates readiness to onboard into production engineering environments.',
        demonstrationContext: 'Highlight in hackathon or capstone project experiences.',
        status: 'suggested' as const,
      }
    ],
    sections: [
      {
        id: 'sec-fallback-1',
        title: 'Education',
        sectionKey: 'education' as const,
        suggestedOrder: 1,
        isOptional: false,
        importance: 'essential' as const,
        explanation: 'Must appear at the top for current undergraduate and fresher resumes.',
        whyItMatters: 'Establishes candidate academic timeline and major.',
        contentTips: 'List expected graduation year and relevant CS coursework.',
        status: 'suggested' as const,
      },
      {
        id: 'sec-fallback-2',
        title: 'Projects',
        sectionKey: 'projects' as const,
        suggestedOrder: 2,
        isOptional: false,
        importance: 'essential' as const,
        explanation: 'Primary proof of hands-on technical competence for freshers.',
        whyItMatters: 'Demonstrates coding ability beyond classroom theory.',
        contentTips: 'Quantify metrics and detail tech stacks used.',
        status: 'suggested' as const,
      }
    ],
    existingProjectAdvice: (input.existingProjects || []).map((p) => ({
      id: `proj-adv-${p.id}`,
      title: `Enhance ${p.title} with measurable outcomes`,
      existingProjectId: p.id,
      relevanceScore: 85,
      importance: 'high' as const,
      explanation: 'Strengthen bullet points by adding quantifiable technical impact and tools used.',
      whyItMatters: 'ATS parsers and engineering recruiters scan for action verbs and performance metrics.',
      bulletImprovementTips: [
        'Start each bullet with a strong action verb (e.g. Architected, Engineered, Optimized).',
        'State the specific problem solved and include estimated latency or scale impact [X%].',
      ],
      status: 'suggested' as const,
    })),
    suggestedProjectIdeas: [
      {
        id: 'idea-fallback-1',
        title: `Full-Stack ${role} Application`,
        techStack: defaultTech.slice(0, 4),
        complexity: 'Intermediate' as const,
        sampleDeliverables: ['REST API backend', 'Interactive frontend', 'CI/CD deployment pipeline'],
        disclaimer: 'Suggested idea for future build; do not mark as completed until built.',
        importance: 'recommended' as const,
        explanation: `Demonstrates end-to-end full lifecycle architecture directly relevant to ${role}.`,
        whyItMatters: 'Shows prospective employers you can build and ship software independently.',
        status: 'suggested' as const,
      }
    ],
    keywords: [
      {
        id: 'kw-fallback-1',
        title: role,
        keyword: role,
        isMatchedInResume: false,
        suggestedSection: 'summary' as const,
        placementExample: `Aspiring ${role} passionate about building scalable web applications.`,
        importance: 'essential' as const,
        explanation: 'Primary job title keyword required for ATS matching.',
        whyItMatters: 'Directly impacts keyword match score in automated recruitment filters.',
        status: 'suggested' as const,
      }
    ],
    certifications: [
      {
        id: 'cert-fallback-1',
        title: 'Foundational Cloud / Engineering Credential',
        issuingOrganization: 'AWS / Google Cloud / Meta',
        credibilityLevel: 'Industry Standard' as const,
        isCompletedByStudent: false,
        importance: 'recommended' as const,
        explanation: 'Validates baseline cloud and DevOps principles.',
        whyItMatters: 'Recognized industry standard verification of technical knowledge.',
        status: 'suggested' as const,
      }
    ],
    isAiGenerated: false,
    generationSource: 'structured-fallback' as const,
  };
}
