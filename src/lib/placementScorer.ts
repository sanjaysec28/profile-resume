/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.1: Intelligent Job Matching & Eligibility Engine
 * Mathematically evaluates resume compatibility and eligibility against job requirements
 * without arbitrary AI score fluctuations.
 */

import {
  VerifiedJobOpportunity,
  JobResumeMatchAnalysis,
  EligibilityAssessment,
  EligibilityCriterion,
  EligibilityStatus,
  PlacementStudentContext,
  MatchCategoryScore,
  WorkEnvironment,
} from '../types/placementIntelligence.ts';
import { ResumeData } from '../types/resume.ts';
import { StudentProfile } from '../types/profile.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';

export type StudentPlacementContext = PlacementStudentContext;

/**
 * Extracts normalized placement context from resume, profile, and setup data.
 * Does not assume missing information or invent qualifications.
 */
export function buildPlacementContext(
  profile?: StudentProfile | null,
  resumeData?: ResumeData | null,
  setupData?: ResumeSetupData | null
): StudentPlacementContext {
  const targetRole =
    (typeof setupData?.targetRole === 'object' && setupData.targetRole?.title)
      ? setupData.targetRole.title
      : (typeof setupData?.targetRole === 'string' && setupData.targetRole)
      ? setupData.targetRole
      : profile?.targetRole ||
        resumeData?.personalInfo?.professionalTitle ||
        'Software Engineer';

  const degree =
    setupData?.profileContext?.degree ||
    (profile as any)?.degree ||
    resumeData?.education?.[0]?.degree ||
    '';

  const major =
    setupData?.profileContext?.major ||
    profile?.major ||
    resumeData?.education?.[0]?.fieldOfStudy ||
    (resumeData?.education?.[0] as any)?.field ||
    '';

  const academicYear =
    setupData?.profileContext?.academicYear ||
    (profile as any)?.academicYear ||
    '';

  const graduationYear =
    setupData?.profileContext?.graduationYear ||
    profile?.graduationYear ||
    resumeData?.education?.[0]?.endDate ||
    (resumeData?.education?.[0] as any)?.endYear ||
    '';

  const cgpaOrScore =
    profile?.gpa ||
    ((profile as any)?.cgpa !== undefined ? String((profile as any).cgpa) : undefined) ||
    resumeData?.education?.[0]?.scoreOrGpa ||
    (resumeData?.education?.[0] as any)?.gpa ||
    undefined;

  // Extract skills supporting both object format and array format
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];

  if (Array.isArray(resumeData?.skills)) {
    (resumeData.skills as any[]).forEach((sk) => {
      const name = typeof sk === 'string' ? sk : sk?.name || '';
      if (!name) return;
      const cat = typeof sk === 'object' ? String(sk?.category || '').toLowerCase() : '';
      if (cat.includes('soft') || cat.includes('interpersonal')) {
        if (!softSkills.includes(name)) softSkills.push(name);
      } else {
        if (!technicalSkills.includes(name)) technicalSkills.push(name);
      }
    });
  } else if (resumeData?.skills) {
    if (Array.isArray(resumeData.skills.technical)) {
      resumeData.skills.technical.forEach((s) => {
        if (s && !technicalSkills.includes(s)) technicalSkills.push(s);
      });
    }
    if (Array.isArray(resumeData.skills.tools)) {
      resumeData.skills.tools.forEach((s) => {
        if (s && !technicalSkills.includes(s)) technicalSkills.push(s);
      });
    }
    if (Array.isArray(resumeData.skills.soft)) {
      resumeData.skills.soft.forEach((s) => {
        if (s && !softSkills.includes(s)) softSkills.push(s);
      });
    }
  }

  // Profile-level skills fallback if present
  if (Array.isArray((profile as any)?.skills)) {
    (profile as any).skills.forEach((sk: any) => {
      const name = typeof sk === 'string' ? sk : sk?.name || '';
      if (name && !technicalSkills.includes(name)) {
        technicalSkills.push(name);
      }
    });
  }

  const projects = (resumeData?.projects || []).map((p: any) => ({
    title: p.title || '',
    techStack: p.techStack || p.technologies || [],
    description: p.description || '',
    bullets: p.bullets || p.bulletPoints || [],
  }));

  const experienceCount = (resumeData?.experience || (resumeData as any)?.experiences || []).length;
  const certifications = (resumeData?.certifications || []).map((c: any) =>
    typeof c === 'string' ? c : c?.name || ''
  );
  const coursework = resumeData?.coursework || [];

  // Extract locations
  const preferredLocations: string[] = [];
  const rawLoc =
    setupData?.profileContext?.location ||
    profile?.location ||
    resumeData?.personalInfo?.location ||
    '';
  if (rawLoc.trim()) {
    rawLoc
      .split(/[/|;\n]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((loc) => {
        if (!preferredLocations.includes(loc)) preferredLocations.push(loc);
      });
  }

  const preferredWorkEnvironment: WorkEnvironment =
    (profile as any)?.preferredWorkEnvironment || 'flexible';

  // Approved ATS keywords from setupData or resume coursework/achievements
  const approvedAtsKeywords: string[] = [];
  if (Array.isArray((setupData as any)?.approvedRecommendations?.keywords)) {
    approvedAtsKeywords.push(...(setupData as any).approvedRecommendations.keywords);
  }

  return {
    targetRole,
    degree,
    major,
    academicYear,
    graduationYear,
    cgpaOrScore,
    technicalSkills,
    softSkills,
    projects,
    experienceCount,
    certifications,
    coursework,
    preferredLocations,
    preferredWorkEnvironment,
    approvedAtsKeywords,
  };
}

/**
 * Helper to match skill strings case-insensitively with alias and boundary support.
 */
export function skillMatches(skillToFind: string, candidateSkills: string[]): boolean {
  if (!skillToFind || !candidateSkills || candidateSkills.length === 0) return false;
  const cleanTarget = skillToFind.toLowerCase().trim();

  // If skill contains " or " (e.g., "Java or Python or C++")
  if (cleanTarget.includes(' or ')) {
    const parts = cleanTarget.split(/\bor\b/).map((p) => p.trim()).filter(Boolean);
    return parts.some((part) => skillMatches(part, candidateSkills));
  }

  // Common aliases map
  const aliases: Record<string, string[]> = {
    'js': ['javascript'],
    'javascript': ['js', 'es6', 'typescript', 'ts'],
    'ts': ['typescript'],
    'typescript': ['ts'],
    'react': ['reactjs', 'react.js', 'react native'],
    'reactjs': ['react'],
    'node': ['nodejs', 'node.js', 'express'],
    'nodejs': ['node', 'express'],
    'postgres': ['postgresql', 'sql'],
    'postgresql': ['postgres', 'sql'],
    'mongo': ['mongodb'],
    'mongodb': ['mongo'],
    'c++': ['cpp'],
    'cpp': ['c++'],
    'c#': ['csharp', '.net'],
    'csharp': ['c#', '.net'],
    'golang': ['go'],
    'go': ['golang'],
    'k8s': ['kubernetes'],
    'kubernetes': ['k8s'],
    'aws': ['amazon web services', 'cloud'],
    'gcp': ['google cloud platform', 'cloud'],
    'azure': ['microsoft azure', 'cloud'],
    'ai': ['artificial intelligence', 'machine learning', 'ml'],
    'ml': ['machine learning', 'artificial intelligence', 'ai'],
    'oop': ['object-oriented programming', 'object oriented programming'],
    'dsa': ['data structures', 'algorithms'],
  };

  const targetAliases = aliases[cleanTarget] || [];

  return candidateSkills.some((s) => {
    const c = s.toLowerCase().trim();
    if (c === cleanTarget) return true;
    if (targetAliases.includes(c)) return true;

    // Substring checks for compound tokens (e.g. "React" matching "React.js" or "React (Vite)")
    if (c.startsWith(cleanTarget + ' ') || c.endsWith(' ' + cleanTarget)) return true;
    if (c.startsWith(cleanTarget + '.') || c.startsWith(cleanTarget + '-')) return true;
    if (cleanTarget.startsWith(c + ' ') || cleanTarget.endsWith(' ' + c)) return true;

    // Substring containment for multi-word skills like "data structures"
    if (cleanTarget.length > 3 && c.includes(cleanTarget)) return true;
    if (c.length > 3 && cleanTarget.includes(c)) return true;

    return false;
  });
}

/**
 * Deterministically computes the Explainable Job Match Score (0 - 100%)
 * based strictly on 5 distinct categories:
 * 1. Qualification alignment (20 pts)
 * 2. Skill alignment (35 pts)
 * 3. Target-role alignment (20 pts)
 * 4. Project and internship relevance (15 pts)
 * 5. Graduation-year compatibility (10 pts)
 */
export function calculateJobResumeMatch(
  job: VerifiedJobOpportunity,
  context: StudentPlacementContext
): JobResumeMatchAnalysis {
  // Aggregate candidate skill inventory
  const allCandidateSkills = [
    ...context.technicalSkills,
    ...context.softSkills,
    ...context.projects.flatMap((p) => p.techStack),
    ...(context.approvedAtsKeywords || []),
  ];

  // -------------------------------------------------------------
  // 1. Qualification Alignment (0 - 20 pts)
  // Degree: up to 10 pts, Major: up to 5 pts, CGPA: up to 5 pts
  // -------------------------------------------------------------
  let qualScore = 0;
  const qualNotes: string[] = [];

  const degreeRequirement = job.requiredQualifications.find((q) =>
    /degree|bachelor|master|b\.tech|btech|bs|associate|computer science/i.test(q)
  );

  const studentDegree = (context.degree || '').toLowerCase();
  const studentMajor = (context.major || '').toLowerCase();

  if (degreeRequirement) {
    if (studentDegree) {
      if (/bachelor|b\.tech|btech|bs|be|b\.e|master|ms|m\.tech|associate/i.test(studentDegree)) {
        qualScore += 10;
        qualNotes.push('Degree type aligns with requirements');
      } else {
        qualScore += 6;
        qualNotes.push('General degree recorded');
      }
    } else {
      qualScore += 3;
      qualNotes.push('Degree not specified');
    }

    if (studentMajor) {
      if (/computer|software|information|engineering|data|science|math|electronics/i.test(studentMajor)) {
        qualScore += 5;
        qualNotes.push('Major discipline aligned');
      } else {
        qualScore += 3;
        qualNotes.push('Related discipline');
      }
    } else {
      qualScore += 2;
      qualNotes.push('Major not specified');
    }
  } else {
    // No specific degree required
    qualScore += 15;
    qualNotes.push('No restrictive degree requirement');
  }

  // Academic Score / CGPA component (5 pts)
  const gpaReq = job.requiredQualifications.find((q) => /cgpa|gpa|percentage/i.test(q));
  if (gpaReq) {
    if (context.cgpaOrScore && context.cgpaOrScore.trim()) {
      const studentNum = parseFloat(context.cgpaOrScore.replace(/[^0-9.]/g, ''));
      const reqNumMatch = gpaReq.match(/\b([2-9](\.[0-9]+)?|[6-9][0-9]%)\b/);
      let isMet = true;
      if (!isNaN(studentNum) && reqNumMatch) {
        const reqNum = parseFloat(reqNumMatch[0].replace('%', ''));
        if (studentNum < reqNum && reqNum <= 10 && studentNum <= 10) {
          isMet = false;
        }
      }
      if (isMet) {
        qualScore += 5;
        qualNotes.push('CGPA meets threshold');
      } else {
        qualNotes.push('CGPA below stated threshold');
      }
    } else {
      qualScore += 2;
      qualNotes.push('CGPA unverified on profile');
    }
  } else {
    qualScore += 5;
    qualNotes.push('No minimum CGPA required');
  }

  qualScore = Math.min(Math.max(qualScore, 0), 20);

  const qualificationAlignment: MatchCategoryScore = {
    category: 'qualifications',
    title: 'Qualification Alignment',
    score: qualScore,
    maxScore: 20,
    percentage: Math.round((qualScore / 20) * 100),
    details: qualNotes.join('; '),
  };

  // -------------------------------------------------------------
  // 2. Skill Alignment (0 - 35 pts)
  // Required skills (25 pts), Preferred skills (5 pts), Soft/Keywords (5 pts)
  // -------------------------------------------------------------
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  job.requiredSkills.forEach((reqSkill) => {
    if (skillMatches(reqSkill, allCandidateSkills)) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  });

  const reqRatio =
    job.requiredSkills.length > 0 ? matchedRequired.length / job.requiredSkills.length : 1;
  const reqSkillPts = Math.round(reqRatio * 25);

  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];

  (job.preferredSkills || []).forEach((prefSkill) => {
    if (skillMatches(prefSkill, allCandidateSkills)) {
      matchedPreferred.push(prefSkill);
    } else {
      missingPreferred.push(prefSkill);
    }
  });

  const prefRatio =
    (job.preferredSkills || []).length > 0
      ? matchedPreferred.length / (job.preferredSkills || []).length
      : 1;
  const prefSkillPts = Math.round(prefRatio * 5);

  // Soft skills / approved keywords / coursework overlap (up to 5 pts)
  let extraKeywordPts = 0;
  const jobText = (
    job.title +
    ' ' +
    job.description +
    ' ' +
    (job.responsibilities || []).join(' ')
  ).toLowerCase();

  const extraTokens = [
    ...(context.softSkills || []),
    ...(context.approvedAtsKeywords || []),
    ...(context.coursework || []),
  ];

  let matchedExtraCount = 0;
  extraTokens.forEach((token) => {
    if (token && token.length > 2 && jobText.includes(token.toLowerCase().trim())) {
      matchedExtraCount++;
    }
  });

  if (matchedExtraCount >= 3) {
    extraKeywordPts = 5;
  } else if (matchedExtraCount >= 1) {
    extraKeywordPts = 3;
  } else if (context.softSkills.length > 0) {
    extraKeywordPts = 2;
  }

  const skillScore = Math.min(Math.max(reqSkillPts + prefSkillPts + extraKeywordPts, 0), 35);

  const skillAlignment: MatchCategoryScore = {
    category: 'skills',
    title: 'Skill Alignment',
    score: skillScore,
    maxScore: 35,
    percentage: Math.round((skillScore / 35) * 100),
    details: `${matchedRequired.length}/${job.requiredSkills.length} required skills matched (${reqSkillPts}/25 pts) + preferred & keywords (${prefSkillPts + extraKeywordPts}/10 pts).`,
  };

  // -------------------------------------------------------------
  // 3. Target-Role Alignment (0 - 20 pts)
  // Direct match: 20 pts, Partial/Category match: 12-16 pts, Baseline: 8 pts
  // -------------------------------------------------------------
  const roleLower = context.targetRole.toLowerCase().trim();
  const jobTitleLower = job.title.toLowerCase().trim();
  let roleScore = 8;
  let roleDetail = 'General early-career engineering alignment';

  const isExactRole = job.targetRoles.some(
    (tr) => tr.toLowerCase().trim() === roleLower || jobTitleLower.includes(roleLower)
  );

  if (isExactRole) {
    roleScore = 20;
    roleDetail = `Direct role alignment with target "${context.targetRole}"`;
  } else {
    // Check partial keyword overlap
    const roleTokens = roleLower.split(/\s+/).filter((t) => t.length > 2);
    const hasTokenOverlap = job.targetRoles.some((tr) => {
      const trLower = tr.toLowerCase();
      return roleTokens.some((tok) => trLower.includes(tok));
    });

    if (hasTokenOverlap) {
      roleScore = 15;
      roleDetail = `Related role field matches "${context.targetRole}"`;
    } else if (
      /software|engineer|developer|frontend|backend|fullstack|data|cloud/i.test(roleLower) &&
      /software|engineer|developer|frontend|backend|fullstack|data|cloud/i.test(jobTitleLower)
    ) {
      roleScore = 12;
      roleDetail = 'Domain overlap in technical engineering';
    }
  }

  const roleAlignment: MatchCategoryScore = {
    category: 'role',
    title: 'Target-Role Alignment',
    score: roleScore,
    maxScore: 20,
    percentage: Math.round((roleScore / 20) * 100),
    details: roleDetail,
  };

  // -------------------------------------------------------------
  // 4. Project and Internship Relevance (0 - 15 pts)
  // Evaluates practical demonstrated technology in student projects / experience
  // -------------------------------------------------------------
  const relevantEvidence: JobResumeMatchAnalysis['relevantResumeEvidence'] = [];
  let projectPoints = 0;

  context.projects.forEach((proj) => {
    const matchingTech = proj.techStack.filter((tech) =>
      job.requiredSkills.some((rs) => skillMatches(rs, [tech])) ||
      (job.preferredSkills || []).some((ps) => skillMatches(ps, [tech]))
    );

    if (matchingTech.length > 0) {
      projectPoints += 6;
      relevantEvidence.push({
        section: 'projects',
        title: proj.title,
        snippet: `Demonstrates ${matchingTech.join(', ')} in practical project implementation.`,
      });
    }
  });

  // Check prior internship / experience
  if (context.experienceCount > 0) {
    projectPoints += 4;
    relevantEvidence.push({
      section: 'experience',
      title: 'Prior Experience',
      snippet: `Candidate has ${context.experienceCount} professional or internship position(s) listed.`,
    });
  }

  if (projectPoints === 0 && context.technicalSkills.length > 0) {
    projectPoints = 4;
    relevantEvidence.push({
      section: 'skills',
      title: 'Technical Skills Baseline',
      snippet: `Candidate lists relevant verified skills: ${context.technicalSkills.slice(0, 4).join(', ')}.`,
    });
  }

  const projectExpScore = Math.min(Math.max(projectPoints, 0), 15);

  const projectExperienceRelevance: MatchCategoryScore = {
    category: 'experience',
    title: 'Project & Experience Relevance',
    score: projectExpScore,
    maxScore: 15,
    percentage: Math.round((projectExpScore / 15) * 100),
    details: `${context.projects.length} project(s) & ${context.experienceCount} experience record(s) analyzed.`,
  };

  // -------------------------------------------------------------
  // 5. Graduation-Year Compatibility (0 - 10 pts)
  // -------------------------------------------------------------
  let gradScore = 5; // Default unverified baseline
  let gradDetail = 'Cohort graduation year verification recommended';

  const gradReq = job.requiredQualifications.find((q) =>
    /graduation|graduating|graduate between|batch|graduates/i.test(q)
  );

  if (gradReq) {
    const reqYears = gradReq.match(/\b(20\d{2})\b/g);
    if (reqYears && reqYears.length > 0) {
      const studentYearMatch = context.graduationYear
        ? context.graduationYear.match(/\b(20\d{2})\b/)
        : null;

      if (!studentYearMatch) {
        gradScore = 5;
        gradDetail = `Cohort specified (${reqYears.join(' - ')}); graduation year unverified on profile.`;
      } else {
        const studentYearNum = parseInt(studentYearMatch[0], 10);
        const isEligibleGrad = reqYears.some((y) => parseInt(y, 10) === studentYearNum);

        if (isEligibleGrad) {
          gradScore = 10;
          gradDetail = `Class of ${studentYearNum} matches target recruitment cohort (${reqYears.join(' - ')}).`;
        } else {
          // Check if close (+/- 1 year)
          const minYear = Math.min(...reqYears.map((y) => parseInt(y, 10)));
          const maxYear = Math.max(...reqYears.map((y) => parseInt(y, 10)));
          if (studentYearNum >= minYear - 1 && studentYearNum <= maxYear + 1) {
            gradScore = 4;
            gradDetail = `Class of ${studentYearNum} is near target window (${reqYears.join(' - ')}).`;
          } else {
            gradScore = 0;
            gradDetail = `Class of ${studentYearNum} outside employer's specified cohort window (${reqYears.join(' - ')}).`;
          }
        }
      }
    } else {
      gradScore = context.graduationYear ? 9 : 6;
      gradDetail = 'General university graduate alignment';
    }
  } else {
    // No restrictive graduation year specified
    gradScore = 10;
    gradDetail = 'Open to all eligible graduating batches and recent alumni.';
  }

  const graduationCompatibility: MatchCategoryScore = {
    category: 'graduation',
    title: 'Graduation-Year Compatibility',
    score: gradScore,
    maxScore: 10,
    percentage: Math.round((gradScore / 10) * 100),
    details: gradDetail,
  };

  // -------------------------------------------------------------
  // Aggregate Deterministic Final Match Score (0 - 100)
  // -------------------------------------------------------------
  const totalMatchScore = Math.min(
    Math.max(qualScore + skillScore + roleScore + projectExpScore + gradScore, 0),
    100
  );

  // Recommended actions
  const recommendedActions: string[] = [];
  if (missingRequired.length > 0) {
    recommendedActions.push(
      `Review core requirements: practice hands-on exercises in ${missingRequired.slice(0, 2).join(' and ')}.`
    );
  }
  if (missingPreferred.length > 0) {
    recommendedActions.push(
      `Familiarize yourself with preferred tool: ${missingPreferred[0]} for a competitive edge in technical screenings.`
    );
  }
  if (relevantEvidence.length > 0) {
    recommendedActions.push(
      `Highlight "${relevantEvidence[0].title}" prominently in your tailored application summary.`
    );
  } else {
    recommendedActions.push(
      'Build or link a practical GitHub repository demonstrating the required language fundamentals.'
    );
  }

  const disclaimer =
    'Match scores and eligibility evaluations are deterministic advisory guides based on published requirements and your provided profile. They do not constitute an application guarantee or represent an official employer decision.';

  return {
    jobId: job.id,
    matchScore: totalMatchScore,
    categoryBreakdown: {
      roleAlignment,
      skillAlignment,
      qualificationAlignment,
      projectExperienceRelevance,
      graduationCompatibility,
    },
    matchedRequiredSkills: matchedRequired,
    missingRequiredSkills: missingRequired,
    matchedPreferredSkills: matchedPreferred,
    missingPreferredSkills: missingPreferred,
    qualificationMatchStatus: roleScore >= 15 ? 'aligned' : 'partially-aligned',
    experienceMatchStatus:
      job.experienceLevel === 'fresher' || job.experienceLevel === 'intern'
        ? 'freshers-welcome'
        : 'entry-aligned',
    relevantResumeEvidence: relevantEvidence.slice(0, 3),
    recommendedActions: recommendedActions.slice(0, 3),
    disclaimer,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministically evaluates Job Eligibility against explicit published criteria:
 * - Degree & Department requirements
 * - Graduation year & eligible batches
 * - Minimum CGPA
 * - Required skills
 * - Experience requirements
 * - Location & work mode
 * 
 * Classifies strictly into 4 states:
 * - 'appears-eligible'
 * - 'potentially-eligible'
 * - 'likely-not-eligible'
 * - 'eligibility-unknown'
 */
export function evaluateJobEligibility(
  job: VerifiedJobOpportunity,
  context: StudentPlacementContext
): EligibilityAssessment {
  const criteria: EligibilityCriterion[] = [];
  let unmetCount = 0;
  let unknownCount = 0;

  // -------------------------------------------------------------
  // 1. Degree & Discipline Check
  // -------------------------------------------------------------
  const degreeRequirement = job.requiredQualifications.find((q) =>
    /degree|bachelor|master|associate|b\.tech|btech|bs|computer science/i.test(q)
  );

  if (degreeRequirement) {
    if (!context.degree && !context.major) {
      criteria.push({
        field: 'Degree & Discipline',
        requirement: degreeRequirement,
        studentValue: 'Not specified in profile',
        status: 'unknown',
        notes: 'Degree and major not recorded on profile. Add them to verify academic program eligibility.',
      });
      unknownCount++;
    } else {
      const studentMajorMatch =
        !context.major ||
        /computer|software|information|engineering|science|data|math|physics|electronics|technology/i.test(
          context.major
        );

      if (studentMajorMatch) {
        criteria.push({
          field: 'Degree & Discipline',
          requirement: degreeRequirement,
          studentValue: [context.degree, context.major].filter(Boolean).join(' in ') || 'Technical Degree',
          status: 'met',
          notes: 'Candidate degree discipline aligns with employer requirements.',
        });
      } else {
        criteria.push({
          field: 'Degree & Discipline',
          requirement: degreeRequirement,
          studentValue: [context.degree, context.major].filter(Boolean).join(' in ') || 'Degree recorded',
          status: 'unknown',
          notes: 'Non-standard technical major; employer manual transcript review required.',
        });
        unknownCount++;
      }
    }
  } else {
    criteria.push({
      field: 'Degree & Discipline',
      requirement: 'Open degree / equivalent demonstrable portfolio',
      studentValue: [context.degree, context.major].filter(Boolean).join(' in ') || 'Degree or portfolio',
      status: 'met',
      notes: 'No restrictive degree requirement specified.',
    });
  }

  // -------------------------------------------------------------
  // 2. Graduation Year Window & Eligible Batches
  // -------------------------------------------------------------
  const gradReq = job.requiredQualifications.find((q) =>
    /graduation|graduating|graduate between|batch|graduates/i.test(q)
  );

  if (gradReq) {
    const reqYears = gradReq.match(/\b(20\d{2})\b/g);
    if (reqYears && reqYears.length > 0) {
      const studentYearMatch = context.graduationYear
        ? context.graduationYear.match(/\b(20\d{2})\b/)
        : null;

      if (!studentYearMatch) {
        criteria.push({
          field: 'Graduation Cohort Window',
          requirement: gradReq,
          studentValue: 'Not specified in profile',
          status: 'unknown',
          notes: `Program specifies eligible cohort window (${reqYears.join(' - ')}). Enter graduation year in profile to verify.`,
        });
        unknownCount++;
      } else {
        const studentYearNum = parseInt(studentYearMatch[0], 10);
        const isEligibleGrad = reqYears.some((y) => parseInt(y, 10) === studentYearNum);

        if (isEligibleGrad) {
          criteria.push({
            field: 'Graduation Cohort Window',
            requirement: gradReq,
            studentValue: `Graduating ${context.graduationYear}`,
            status: 'met',
            notes: 'Anticipated graduation year aligns with the employer’s cohort recruitment schedule.',
          });
        } else {
          criteria.push({
            field: 'Graduation Cohort Window',
            requirement: gradReq,
            studentValue: `Graduating ${context.graduationYear}`,
            status: 'unmet',
            notes: `Class of ${studentYearNum} does not fall within specified cohort (${reqYears.join(' - ')}).`,
          });
          unmetCount++;
        }
      }
    } else {
      if (!context.academicYear && !context.graduationYear) {
        criteria.push({
          field: 'Graduation Standing',
          requirement: gradReq,
          studentValue: 'Not specified in profile',
          status: 'unknown',
          notes: 'Academic standing or cohort year not yet recorded on profile.',
        });
        unknownCount++;
      } else {
        criteria.push({
          field: 'Graduation Standing',
          requirement: gradReq,
          studentValue: [context.academicYear, context.graduationYear ? `Class of ${context.graduationYear}` : '']
            .filter(Boolean)
            .join(' - '),
          status: 'met',
          notes: 'Current academic standing recorded and aligns with general campus requirements.',
        });
      }
    }
  } else {
    criteria.push({
      field: 'Graduation Standing',
      requirement: 'Open to freshers and recent graduates',
      studentValue: context.graduationYear ? `Class of ${context.graduationYear}` : 'Early career applicant',
      status: 'met',
      notes: 'No specific cohort restriction specified by employer.',
    });
  }

  // -------------------------------------------------------------
  // 3. Minimum CGPA / Academic Score
  // -------------------------------------------------------------
  const gpaReq = job.requiredQualifications.find((q) => /cgpa|gpa|percentage/i.test(q));
  if (gpaReq) {
    if (context.cgpaOrScore && context.cgpaOrScore.trim()) {
      const studentNum = parseFloat(context.cgpaOrScore.replace(/[^0-9.]/g, ''));
      const reqNumMatch = gpaReq.match(/\b([2-9](\.[0-9]+)?|[6-9][0-9]%)\b/);
      let isMet = true;

      if (!isNaN(studentNum) && reqNumMatch) {
        const reqNum = parseFloat(reqNumMatch[0].replace('%', ''));
        if (studentNum < reqNum && reqNum <= 10 && studentNum <= 10) {
          isMet = false;
        }
      }

      if (isMet) {
        criteria.push({
          field: 'Academic Score / CGPA',
          requirement: gpaReq,
          studentValue: context.cgpaOrScore,
          status: 'met',
          notes: 'Academic standing recorded on profile meets or exceeds stated employer threshold.',
        });
      } else {
        criteria.push({
          field: 'Academic Score / CGPA',
          requirement: gpaReq,
          studentValue: context.cgpaOrScore,
          status: 'unmet',
          notes: `Minimum academic threshold specified: ${gpaReq}. Recorded value is below requirement.`,
        });
        unmetCount++;
      }
    } else {
      criteria.push({
        field: 'Academic Score / CGPA',
        requirement: gpaReq,
        studentValue: 'Not specified in profile',
        status: 'unknown',
        notes: 'Opportunity specifies a minimum academic score. Verify your transcript before applying.',
      });
      unknownCount++;
    }
  } else {
    criteria.push({
      field: 'Academic Score / CGPA',
      requirement: 'No minimum cutoff specified',
      studentValue: context.cgpaOrScore || 'Unspecified (not required)',
      status: 'met',
      notes: 'Employer evaluates candidates holistically through technical interviews and projects.',
    });
  }

  // -------------------------------------------------------------
  // 4. Experience Requirement Check (Protects Freshers)
  // -------------------------------------------------------------
  if (job.experienceLevel === 'fresher' || job.experienceLevel === 'intern') {
    criteria.push({
      field: 'Experience Level',
      requirement: 'Freshers & University Students Welcome (0 years prior experience required)',
      studentValue: `${context.experienceCount} professional role(s) / ${context.projects.length} project(s)`,
      status: 'met',
      notes: 'No prior full-time employment required; evaluated on projects and academic foundation.',
    });
  } else if (job.experienceLevel === 'entry-level') {
    criteria.push({
      field: 'Experience Level',
      requirement: 'Entry-level (0-1 year practical engineering experience)',
      studentValue: `${context.experienceCount} role(s) listed / ${context.projects.length} project(s)`,
      status: 'met',
      notes: 'Academic coursework and demonstrable portfolio projects qualify for early-career entry band.',
    });
  } else {
    if (context.experienceCount > 0) {
      criteria.push({
        field: 'Experience Level',
        requirement: 'Prior experience expected',
        studentValue: `${context.experienceCount} role(s) listed`,
        status: 'met',
        notes: 'Candidate lists prior professional experience.',
      });
    } else {
      criteria.push({
        field: 'Experience Level',
        requirement: 'Prior industry experience expected',
        studentValue: 'No prior employment listed',
        status: 'unknown',
        notes: 'Role may expect prior industry experience; check if student projects substitute.',
      });
      unknownCount++;
    }
  }

  // -------------------------------------------------------------
  // 5. Core Technical Skills Check
  // -------------------------------------------------------------
  const candidateTech = Array.isArray(context.technicalSkills)
    ? context.technicalSkills
    : (Array.isArray((context as any).skills) ? (context as any).skills : []);
  const candidateProjects = Array.isArray(context.projects) ? context.projects : [];
  const allCandidateSkills = [
    ...candidateTech,
    ...candidateProjects.flatMap((p) => (Array.isArray(p.techStack) ? p.techStack : [])),
  ];

  const matchedRequiredCount = job.requiredSkills.filter((rs) =>
    skillMatches(rs, allCandidateSkills)
  ).length;

  if (job.requiredSkills.length > 0) {
    const requiredRatio = matchedRequiredCount / job.requiredSkills.length;
    if (requiredRatio >= 0.5) {
      criteria.push({
        field: 'Core Technical Skills',
        requirement: job.requiredSkills.join(', '),
        studentValue: `${matchedRequiredCount}/${job.requiredSkills.length} skills matched`,
        status: 'met',
        notes: `You demonstrate majority of required foundational skills (${matchedRequiredCount}/${job.requiredSkills.length}).`,
      });
    } else if (matchedRequiredCount > 0) {
      criteria.push({
        field: 'Core Technical Skills',
        requirement: job.requiredSkills.join(', '),
        studentValue: `${matchedRequiredCount}/${job.requiredSkills.length} skills matched`,
        status: 'unknown',
        notes: `Partial skill overlap (${matchedRequiredCount}/${job.requiredSkills.length}). Review missing requirements before applying.`,
      });
      unknownCount++;
    } else {
      criteria.push({
        field: 'Core Technical Skills',
        requirement: job.requiredSkills.join(', '),
        studentValue: '0 required skills demonstrated',
        status: 'unmet',
        notes: 'None of the primary required technical skills are currently present in your profile or resume.',
      });
      unmetCount++;
    }
  }

  // -------------------------------------------------------------
  // 6. Location & Work Mode
  // -------------------------------------------------------------
  if (job.workEnvironment === 'remote') {
    criteria.push({
      field: 'Work Mode & Location',
      requirement: 'Remote / Virtual Work Environment',
      studentValue: (context.preferredLocations && context.preferredLocations.length > 0)
        ? context.preferredLocations.join(', ')
        : 'Open / flexible location',
      status: 'met',
      notes: 'Remote position is accessible from all eligible locations.',
    });
  } else {
    // Hybrid or Onsite
    const studentLocations = context.preferredLocations || [];
    const jobLoc = job.location.toLowerCase();

    const isLocationMatched =
      studentLocations.length === 0 || // no constraint
      studentLocations.some((loc) => jobLoc.includes(loc.toLowerCase()) || loc.toLowerCase().includes('remote'));

    if (isLocationMatched) {
      criteria.push({
        field: 'Work Mode & Location',
        requirement: `${job.location} (${job.workEnvironment})`,
        studentValue: studentLocations.length > 0 ? studentLocations.join(', ') : 'Flexible location',
        status: 'met',
        notes: `Work environment (${job.workEnvironment}) aligns with candidate location parameters.`,
      });
    } else {
      criteria.push({
        field: 'Work Mode & Location',
        requirement: `${job.location} (${job.workEnvironment})`,
        studentValue: studentLocations.join(', '),
        status: 'unknown',
        notes: `In-person attendance in ${job.location} required. Relocation or commute necessary.`,
      });
      unknownCount++;
    }
  }

  // -------------------------------------------------------------
  // Determine Overall 4-State Eligibility
  // -------------------------------------------------------------
  let overallStatus: EligibilityStatus = 'appears-eligible';
  let summary = 'You appear to meet all explicit eligibility requirements for this opportunity.';

  // If candidate has completely missing profile (no degree, no graduation year, no skills)
  const isProfileEmpty =
    !context.degree &&
    !context.major &&
    !context.graduationYear &&
    context.technicalSkills.length === 0;

  if (isProfileEmpty) {
    overallStatus = 'eligibility-unknown';
    summary =
      'Academic qualifications and skills cannot be evaluated until your degree, graduation year, and technical skills are completed in your profile.';
  } else if (unmetCount > 0) {
    overallStatus = 'likely-not-eligible';
    summary =
      'One or more non-negotiable program conditions (such as cohort graduation year, minimum CGPA, or required skills) do not align with your current profile.';
  } else if (unknownCount > 0) {
    // If degree or graduation year is completely missing from student profile when job specifies it
    const missingCoreAcademic =
      (!context.degree && Boolean(degreeRequirement)) ||
      (!context.graduationYear && Boolean(gradReq));

    if (missingCoreAcademic && unknownCount >= 2) {
      overallStatus = 'eligibility-unknown';
      summary =
        'Key academic details (such as degree program or graduation year) are not specified in your profile. Complete them to determine eligibility.';
    } else {
      overallStatus = 'potentially-eligible';
      summary =
        'You meet core qualifications, but additional criteria (such as transcript verification, location compatibility, or specific skills) require employer confirmation.';
    }
  } else {
    overallStatus = 'appears-eligible';
    summary =
      'All verified criteria (degree discipline, cohort batch, academic score, skills, and work mode) align with published requirements.';
  }

  return {
    overallStatus,
    summary,
    criteria,
    assessedAt: new Date().toISOString(),
  };
}

