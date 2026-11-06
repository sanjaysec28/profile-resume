/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Deterministic Job Matching & Eligibility Engine
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
} from '../types/placementIntelligence.ts';
import { ResumeData } from '../types/resume.ts';
import { StudentProfile } from '../types/profile.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';

export type StudentPlacementContext = PlacementStudentContext;

/**
 * Extracts normalized placement context from resume, profile, and setup data.
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
    (profile as any)?.graduationYear ||
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
  let technicalSkills: string[] = [];
  let softSkills: string[] = [];

  if (Array.isArray(resumeData?.skills)) {
    (resumeData.skills as any[]).forEach((sk) => {
      const name = typeof sk === 'string' ? sk : sk?.name || '';
      if (!name) return;
      const cat = typeof sk === 'object' ? String(sk?.category || '').toLowerCase() : '';
      if (cat.includes('soft') || cat.includes('interpersonal')) {
        softSkills.push(name);
      } else {
        technicalSkills.push(name);
      }
    });
  } else if (resumeData?.skills) {
    if (Array.isArray(resumeData.skills.technical)) {
      technicalSkills.push(...resumeData.skills.technical);
    }
    if (Array.isArray(resumeData.skills.tools)) {
      technicalSkills.push(...resumeData.skills.tools);
    }
    if (Array.isArray(resumeData.skills.soft)) {
      softSkills.push(...resumeData.skills.soft);
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
  const certifications = (resumeData?.certifications || []).map((c: any) => typeof c === 'string' ? c : c?.name || '');
  const coursework = resumeData?.coursework || [];

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
  };
}

/**
 * Helper to match skill strings case-insensitively with alias support.
 */
function skillMatches(skillToFind: string, candidateSkills: string[]): boolean {
  const cleanTarget = skillToFind.toLowerCase().trim();
  return candidateSkills.some((s) => {
    const c = s.toLowerCase().trim();
    if (c === cleanTarget) return true;
    if (c.includes(cleanTarget) || cleanTarget.includes(c)) return true;
    if (cleanTarget.includes('or')) {
      return cleanTarget.split(/\bor\b/).some((part) => c.includes(part.trim()));
    }
    return false;
  });
}

/**
 * Deterministically computes the Match Score and returns breakdown.
 */
export function calculateJobResumeMatch(
  job: VerifiedJobOpportunity,
  context: StudentPlacementContext
): JobResumeMatchAnalysis {
  // 1. Role Alignment (0 - 20 pts)
  const roleLower = context.targetRole.toLowerCase();
  const isRoleAligned = job.targetRoles.some(
    (tr) => tr.toLowerCase().includes(roleLower) || roleLower.includes(tr.toLowerCase())
  );
  const roleScore = isRoleAligned ? 20 : 10;

  // 2. Required Skills (0 - 45 pts)
  const allCandidateSkills = [
    ...context.technicalSkills,
    ...context.projects.flatMap((p) => p.techStack),
  ];

  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  job.requiredSkills.forEach((reqSkill) => {
    if (skillMatches(reqSkill, allCandidateSkills)) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  });

  const reqSkillRatio =
    job.requiredSkills.length > 0 ? matchedRequired.length / job.requiredSkills.length : 1;
  const reqSkillScore = Math.round(reqSkillRatio * 45);

  // 3. Preferred Skills (0 - 15 pts)
  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];

  (job.preferredSkills || []).forEach((prefSkill) => {
    if (skillMatches(prefSkill, allCandidateSkills)) {
      matchedPreferred.push(prefSkill);
    } else {
      missingPreferred.push(prefSkill);
    }
  });

  const prefSkillRatio =
    (job.preferredSkills || []).length > 0
      ? matchedPreferred.length / (job.preferredSkills || []).length
      : 1;
  const prefSkillScore = Math.round(prefSkillRatio * 15);

  // 4. Practical Project Evidence (0 - 20 pts)
  const relevantEvidence: JobResumeMatchAnalysis['relevantResumeEvidence'] = [];
  let projectEvidencePts = 0;

  context.projects.forEach((proj) => {
    const matchingTech = proj.techStack.filter((tech) =>
      job.requiredSkills.some((rs) => skillMatches(rs, [tech]))
    );
    if (matchingTech.length > 0) {
      projectEvidencePts += 10;
      relevantEvidence.push({
        section: 'projects',
        title: proj.title,
        snippet: `Demonstrates ${matchingTech.join(', ')} in practical project implementation.`,
      });
    }
  });

  if (relevantEvidence.length === 0 && context.technicalSkills.length > 0) {
    relevantEvidence.push({
      section: 'skills',
      title: 'Technical Skills Section',
      snippet: `Lists verified candidate skills: ${context.technicalSkills.slice(0, 4).join(', ')}.`,
    });
    projectEvidencePts = 8;
  }

  const finalProjectScore = Math.min(projectEvidencePts, 20);

  // Aggregate final match score (0 - 100)
  const totalMatchScore = Math.min(
    Math.max(roleScore + reqSkillScore + prefSkillScore + finalProjectScore, 0),
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

  return {
    jobId: job.id,
    matchScore: totalMatchScore,
    matchedRequiredSkills: matchedRequired,
    missingRequiredSkills: missingRequired,
    matchedPreferredSkills: matchedPreferred,
    missingPreferredSkills: missingPreferred,
    qualificationMatchStatus: isRoleAligned ? 'aligned' : 'partially-aligned',
    experienceMatchStatus:
      job.experienceLevel === 'fresher' || job.experienceLevel === 'intern'
        ? 'freshers-welcome'
        : 'entry-aligned',
    relevantResumeEvidence: relevantEvidence.slice(0, 3),
    recommendedActions: recommendedActions.slice(0, 3),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministically evaluates Job Eligibility against explicit criteria.
 */
export function evaluateJobEligibility(
  job: VerifiedJobOpportunity,
  context: StudentPlacementContext
): EligibilityAssessment {
  const criteria: EligibilityCriterion[] = [];
  let unmetCount = 0;
  let unknownCount = 0;

  // 1. Degree & Major Check
  const degreeRequirement = job.requiredQualifications.find((q) =>
    /degree|bachelor|master|associate|b\.tech|bs|computer science/i.test(q)
  );
  if (degreeRequirement) {
    if (!context.degree && !context.major) {
      criteria.push({
        field: 'Degree & Discipline',
        requirement: degreeRequirement,
        studentValue: 'Not specified in profile',
        status: 'unknown',
        notes: 'Add your degree and major in your profile to verify program alignment.',
      });
      unknownCount++;
    } else {
      const isMajorRelevant =
        /computer science|information technology|software|engineering|data science|related/i.test(
          degreeRequirement
        );
      const studentMajorMatch =
        !context.major ||
        /computer|software|information|engineering|science|data|math|physics/i.test(context.major);

      if (isMajorRelevant && studentMajorMatch) {
        criteria.push({
          field: 'Degree & Discipline',
          requirement: degreeRequirement,
          studentValue: [context.degree, context.major].filter(Boolean).join(' in ') || 'Technical Degree',
          status: 'met',
          notes: 'Your technical degree aligns with the program qualifications.',
        });
      } else {
        criteria.push({
          field: 'Degree & Discipline',
          requirement: degreeRequirement,
          studentValue: [context.degree, context.major].filter(Boolean).join(' in ') || 'Degree recorded',
          status: 'unknown',
          notes: 'Degree discipline requires employer verification for program qualifications.',
        });
        unknownCount++;
      }
    }
  }

  // 2. Graduation Year Check (for internships and freshers)
  const gradReq = job.requiredQualifications.find((q) => /graduation|graduating|graduate between|batch/i.test(q));
  if (gradReq) {
    const reqYears = gradReq.match(/\b(20\d{2})\b/g);
    if (reqYears && reqYears.length > 0) {
      const studentYearMatch = context.graduationYear ? context.graduationYear.match(/\b(20\d{2})\b/) : null;
      if (!studentYearMatch) {
        criteria.push({
          field: 'Graduation Year Window',
          requirement: gradReq,
          studentValue: 'Not specified in profile',
          status: 'unknown',
          notes: `Program specifies cohort graduation window (${reqYears.join(' - ')}). Add expected graduation year to verify.`,
        });
        unknownCount++;
      } else {
        const studentYearNum = parseInt(studentYearMatch[0], 10);
        const isEligibleGrad = reqYears.some((y) => parseInt(y, 10) === studentYearNum);

        if (isEligibleGrad) {
          criteria.push({
            field: 'Graduation Year Window',
            requirement: gradReq,
            studentValue: `Graduating ${context.graduationYear}`,
            status: 'met',
            notes: 'Your anticipated graduation date aligns with the employer’s cohort timeline.',
          });
        } else {
          criteria.push({
            field: 'Graduation Year Window',
            requirement: gradReq,
            studentValue: `Graduating ${context.graduationYear}`,
            status: 'unmet',
            notes: `Program specifies graduation window (${reqYears.join(' - ')}).`,
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
          notes: 'Current academic standing recorded.',
        });
      }
    }
  }

  // 3. Experience Requirement Check (Protects Freshers)
  if (job.experienceLevel === 'fresher' || job.experienceLevel === 'intern') {
    criteria.push({
      field: 'Experience Level',
      requirement: 'Freshers & University Students Welcome (0 years prior experience required)',
      studentValue: `${context.experienceCount} professional role(s) / ${context.projects.length} project(s)`,
      status: 'met',
      notes: 'No prior full-time employment required; evaluated on projects and academic foundation.',
    });
  } else {
    criteria.push({
      field: 'Experience Level',
      requirement: 'Entry-level (0-1 year practical engineering experience)',
      studentValue: `${context.experienceCount} role(s) listed`,
      status: 'met',
      notes: 'Coursework and demonstrable projects qualify for early-career entry band.',
    });
  }

  // 4. CGPA / Minimum Grade Check (if present in job posting)
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
          notes: 'Academic standing recorded on profile meets employer threshold.',
        });
      } else {
        criteria.push({
          field: 'Academic Score / CGPA',
          requirement: gpaReq,
          studentValue: context.cgpaOrScore,
          status: 'unmet',
          notes: `Minimum academic threshold specified: ${gpaReq}.`,
        });
        unmetCount++;
      }
    } else {
      criteria.push({
        field: 'Academic Score / CGPA',
        requirement: gpaReq,
        studentValue: 'Not specified in profile',
        status: 'unknown',
        notes: 'Verify your university transcript meets employer threshold before applying.',
      });
      unknownCount++;
    }
  }

  // Determine overall status
  let overallStatus: EligibilityStatus = 'appears-eligible';
  let summary = 'You appear to meet all explicit eligibility requirements for this opportunity.';

  const metCount = criteria.filter((c) => c.status === 'met').length;

  if (unmetCount > 0) {
    overallStatus = 'likely-not-eligible';
    summary = 'One or more explicit program conditions (e.g. graduation year or CGPA) may not align with your current profile.';
  } else if (unknownCount > 0 && metCount <= 1 && (!context.degree || !context.graduationYear)) {
    overallStatus = 'eligibility-unknown';
    summary = 'Academic qualifications cannot be determined until your graduation year and degree are completed in your profile.';
  } else if (unknownCount > 0) {
    overallStatus = 'potentially-eligible';
    summary = 'You meet core qualifications, but additional information (such as transcript CGPA) requires verification.';
  }

  return {
    overallStatus,
    summary,
    criteria,
    assessedAt: new Date().toISOString(),
  };
}
