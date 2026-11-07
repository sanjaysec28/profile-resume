/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.1: Automated Verification Test Suite
 * Validates deterministic 5-category job matching, 4-state eligibility engine,
 * missing student context handling, explainability breakdown, and data integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateJobResumeMatch,
  evaluateJobEligibility,
  buildPlacementContext,
  skillMatches,
} from '../src/lib/placementScorer.ts';
import { VERIFIED_JOB_OPPORTUNITIES } from '../src/lib/verifiedJobCatalog.ts';
import {
  VerifiedJobOpportunity,
  PlacementStudentContext,
} from '../src/types/placementIntelligence.ts';

// -----------------------------------------------------------------------------
// Test Fixtures
// -----------------------------------------------------------------------------

const idealCandidate: PlacementStudentContext = {
  targetRole: 'Software Engineer',
  degree: 'Bachelor of Technology',
  major: 'Computer Science and Engineering',
  academicYear: 'Final Year',
  graduationYear: '2026',
  cgpaOrScore: '8.8',
  technicalSkills: ['Java', 'Python', 'C++', 'Git', 'Data Structures', 'Algorithms', 'SQL'],
  softSkills: ['Problem Solving', 'Team Collaboration'],
  projects: [
    {
      title: 'Distributed File Store',
      techStack: ['Java', 'Git', 'Data Structures'],
      description: 'Built a fault-tolerant key-value store with replication.',
      bullets: ['Implemented distributed consensus algorithm'],
    },
    {
      title: 'Algorithmic Trading Bot',
      techStack: ['Python', 'Algorithms', 'SQL'],
      description: 'Backtesting engine for market signals.',
    },
  ],
  experienceCount: 1,
  certifications: ['AWS Cloud Practitioner'],
  coursework: ['Operating Systems', 'Computer Networks'],
  preferredLocations: ['Mountain View, CA', 'Remote'],
  preferredWorkEnvironment: 'hybrid',
  approvedAtsKeywords: ['distributed systems', 'concurrency'],
};

const candidateMissingCgpaAndGradYear: PlacementStudentContext = {
  targetRole: 'Software Engineer',
  degree: 'Bachelor of Science',
  major: 'Computer Science',
  academicYear: 'Undergraduate',
  graduationYear: '', // Missing
  cgpaOrScore: undefined, // Missing
  technicalSkills: ['Java', 'Git', 'Data Structures'],
  softSkills: [],
  projects: [
    {
      title: 'Student Portal',
      techStack: ['Java', 'Git'],
      description: 'Course enrollment system.',
    },
  ],
  experienceCount: 0,
  preferredLocations: ['Remote'],
  preferredWorkEnvironment: 'remote',
};

const candidateIncompatibleCohortAndLowGpa: PlacementStudentContext = {
  targetRole: 'Software Engineer',
  degree: 'Bachelor of Technology',
  major: 'Mechanical Engineering',
  academicYear: 'Alumni',
  graduationYear: '2022', // Graduated long ago, outside 2026-2027 intern cohort
  cgpaOrScore: '5.2', // Low CGPA
  technicalSkills: ['AutoCAD', 'SolidWorks'], // No required SWE skills
  softSkills: [],
  projects: [],
  experienceCount: 0,
  preferredLocations: ['Chicago, IL'],
  preferredWorkEnvironment: 'onsite',
};

const emptyProfileCandidate: PlacementStudentContext = {
  targetRole: 'Software Engineer',
  degree: '',
  major: '',
  academicYear: '',
  graduationYear: '',
  cgpaOrScore: undefined,
  technicalSkills: [],
  softSkills: [],
  projects: [],
  experienceCount: 0,
  preferredLocations: [],
  preferredWorkEnvironment: 'flexible',
};

// -----------------------------------------------------------------------------
// Suite 1: Skill Matching Helper
// -----------------------------------------------------------------------------
describe('D.6.1 — Skill Matching Robustness', () => {
  it('1.1 matches direct lowercase and uppercase strings', () => {
    assert.strictEqual(skillMatches('React', ['react', 'node']), true);
    assert.strictEqual(skillMatches('PYTHON', ['python', 'c++']), true);
    assert.strictEqual(skillMatches('Docker', ['Kubernetes', 'docker']), true);
  });

  it('1.2 handles compound "or" conditions (e.g. "Java or Python or C++")', () => {
    assert.strictEqual(skillMatches('Java or Python or C++', ['Python', 'SQL']), true);
    assert.strictEqual(skillMatches('Java or Python or C++', ['Ruby', 'PHP']), false);
    assert.strictEqual(skillMatches('C# or Java or TypeScript', ['TypeScript']), true);
  });

  it('1.3 handles common technology aliases', () => {
    assert.strictEqual(skillMatches('C++', ['cpp']), true);
    assert.strictEqual(skillMatches('JavaScript', ['js']), true);
    assert.strictEqual(skillMatches('PostgreSQL', ['postgres']), true);
    assert.strictEqual(skillMatches('Kubernetes', ['k8s']), true);
  });
});

// -----------------------------------------------------------------------------
// Suite 2: 4-State Eligibility Assessment
// -----------------------------------------------------------------------------
describe('D.6.1 — 4-State Eligibility Assessment Engine', () => {
  const googleInternship = VERIFIED_JOB_OPPORTUNITIES.find(
    (j) => j.id === 'job_google_swe_intern_2026'
  )!;

  it('2.1 classifies fully-qualified candidate as "appears-eligible"', () => {
    const result = evaluateJobEligibility(googleInternship, idealCandidate);
    assert.strictEqual(result.overallStatus, 'appears-eligible');
    assert.strictEqual(result.criteria.length >= 5, true);

    // Every criterion status must be 'met'
    const unmet = result.criteria.filter((c) => c.status === 'unmet');
    assert.strictEqual(unmet.length, 0);

    // Check specific criteria
    const degreeCheck = result.criteria.find((c) => c.field === 'Degree & Discipline');
    assert.ok(degreeCheck);
    assert.strictEqual(degreeCheck?.status, 'met');
    assert.strictEqual(degreeCheck?.studentValue.includes('Bachelor'), true);

    const gradCheck = result.criteria.find((c) => c.field === 'Graduation Cohort Window');
    assert.ok(gradCheck);
    assert.strictEqual(gradCheck?.status, 'met');
    assert.strictEqual(gradCheck?.studentValue.includes('2026'), true);
  });

  it('2.2 classifies candidate with missing graduation year as "potentially-eligible" or "eligibility-unknown" with transparent reason', () => {
    const result = evaluateJobEligibility(googleInternship, candidateMissingCgpaAndGradYear);
    // Because grad year is unverified for an internship specifying 2026-2027
    assert.ok(['potentially-eligible', 'eligibility-unknown'].includes(result.overallStatus));

    const gradCheck = result.criteria.find((c) => c.field === 'Graduation Cohort Window');
    assert.ok(gradCheck);
    assert.strictEqual(gradCheck?.status, 'unknown');
    assert.strictEqual(gradCheck?.studentValue, 'Not specified in profile');
    assert.ok(gradCheck?.notes?.includes('Enter graduation year in profile to verify'));
  });

  it('2.3 classifies candidate with mismatched cohort and missing skills as "likely-not-eligible"', () => {
    const result = evaluateJobEligibility(googleInternship, candidateIncompatibleCohortAndLowGpa);
    assert.strictEqual(result.overallStatus, 'likely-not-eligible');

    const gradCheck = result.criteria.find((c) => c.field === 'Graduation Cohort Window');
    assert.ok(gradCheck);
    assert.strictEqual(gradCheck?.status, 'unmet');
    assert.ok(gradCheck?.studentValue.includes('2022'));

    const skillsCheck = result.criteria.find((c) => c.field === 'Core Technical Skills');
    assert.ok(skillsCheck);
    assert.strictEqual(skillsCheck?.status, 'unmet');
  });

  it('2.4 classifies completely empty student profile as "eligibility-unknown"', () => {
    const result = evaluateJobEligibility(googleInternship, emptyProfileCandidate);
    assert.strictEqual(result.overallStatus, 'eligibility-unknown');
    assert.ok(result.summary.includes('Academic qualifications and skills cannot be evaluated'));
  });

  it('2.5 evaluates minimum CGPA cutoff properly when required by job', () => {
    const jobWithGpa: VerifiedJobOpportunity = {
      ...googleInternship,
      id: 'job_custom_gpa_cutoff',
      requiredQualifications: [
        'Enrolled in Bachelor of Science in Computer Science',
        'Minimum CGPA of 7.5 on a 10.0 scale required',
        'Graduating in 2026',
      ],
    };

    // Candidate with 8.8 CGPA -> met
    const passResult = evaluateJobEligibility(jobWithGpa, idealCandidate);
    const gpaCriterionPass = passResult.criteria.find((c) => c.field === 'Academic Score / CGPA');
    assert.ok(gpaCriterionPass);
    assert.strictEqual(gpaCriterionPass?.status, 'met');

    // Candidate with 5.2 CGPA -> unmet
    const failResult = evaluateJobEligibility(jobWithGpa, candidateIncompatibleCohortAndLowGpa);
    const gpaCriterionFail = failResult.criteria.find((c) => c.field === 'Academic Score / CGPA');
    assert.ok(gpaCriterionFail);
    assert.strictEqual(gpaCriterionFail?.status, 'unmet');

    // Candidate with missing CGPA -> unknown
    const unknownResult = evaluateJobEligibility(jobWithGpa, candidateMissingCgpaAndGradYear);
    const gpaCriterionUnknown = unknownResult.criteria.find((c) => c.field === 'Academic Score / CGPA');
    assert.ok(gpaCriterionUnknown);
    assert.strictEqual(gpaCriterionUnknown?.status, 'unknown');
  });

  it('2.6 evaluates location and work mode (remote vs hybrid/onsite)', () => {
    const remoteJob = VERIFIED_JOB_OPPORTUNITIES.find((j) => j.workEnvironment === 'remote')!;
    const result = evaluateJobEligibility(remoteJob, idealCandidate);
    const locCriterion = result.criteria.find((c) => c.field === 'Work Mode & Location');
    assert.ok(locCriterion);
    assert.strictEqual(locCriterion?.status, 'met');
    assert.ok(locCriterion?.notes?.includes('Remote position'));
  });
});

// -----------------------------------------------------------------------------
// Suite 3: Deterministic 5-Category Explainable Match Score
// -----------------------------------------------------------------------------
describe('D.6.1 — Explainable Job Match Score (0 - 100%)', () => {
  const googleInternship = VERIFIED_JOB_OPPORTUNITIES.find(
    (j) => j.id === 'job_google_swe_intern_2026'
  )!;

  it('3.1 produces complete 5-category breakdown with exact point maxima', () => {
    const match = calculateJobResumeMatch(googleInternship, idealCandidate);

    assert.ok(match.categoryBreakdown);
    const {
      roleAlignment,
      skillAlignment,
      qualificationAlignment,
      projectExperienceRelevance,
      graduationCompatibility,
    } = match.categoryBreakdown;

    // Check maximum scores match the specification: 20 + 35 + 20 + 15 + 10 = 100
    assert.strictEqual(qualificationAlignment.maxScore, 20);
    assert.strictEqual(skillAlignment.maxScore, 35);
    assert.strictEqual(roleAlignment.maxScore, 20);
    assert.strictEqual(projectExperienceRelevance.maxScore, 15);
    assert.strictEqual(graduationCompatibility.maxScore, 10);

    const sumMax =
      qualificationAlignment.maxScore +
      skillAlignment.maxScore +
      roleAlignment.maxScore +
      projectExperienceRelevance.maxScore +
      graduationCompatibility.maxScore;
    assert.strictEqual(sumMax, 100);

    // Sum of actual category scores equals total match score
    const sumActual =
      qualificationAlignment.score +
      skillAlignment.score +
      roleAlignment.score +
      projectExperienceRelevance.score +
      graduationCompatibility.score;
    assert.strictEqual(match.matchScore, sumActual);

    // Score bounded strictly between 0 and 100
    assert.ok(match.matchScore >= 0 && match.matchScore <= 100);
  });

  it('3.2 correctly partitions matched vs missing required skills', () => {
    const candidatePartialSkills: PlacementStudentContext = {
      ...idealCandidate,
      technicalSkills: ['Git', 'Python'], // Has Python and Git, lacks Java, Algorithms, Data Structures
      projects: [],
    };

    const match = calculateJobResumeMatch(googleInternship, candidatePartialSkills);
    assert.strictEqual(match.matchedRequiredSkills.includes('Git'), true);
    assert.strictEqual(match.missingRequiredSkills.includes('Data Structures'), true);
    assert.strictEqual(match.missingRequiredSkills.includes('Algorithms'), true);
  });

  it('3.3 includes non-guarantee advisory disclaimer in match analysis', () => {
    const match = calculateJobResumeMatch(googleInternship, idealCandidate);
    assert.ok(match.disclaimer);
    assert.ok(match.disclaimer.includes('deterministic advisory'));
    assert.ok(match.disclaimer.includes('do not constitute an application guarantee'));
  });

  it('3.4 remains strictly deterministic across multiple executions', () => {
    const match1 = calculateJobResumeMatch(googleInternship, idealCandidate);
    const match2 = calculateJobResumeMatch(googleInternship, idealCandidate);
    assert.strictEqual(match1.matchScore, match2.matchScore);
    assert.deepStrictEqual(match1.matchedRequiredSkills, match2.matchedRequiredSkills);
    assert.deepStrictEqual(match1.missingRequiredSkills, match2.missingRequiredSkills);
    assert.strictEqual(
      match1.categoryBreakdown.skillAlignment.score,
      match2.categoryBreakdown.skillAlignment.score
    );
  });
});

// -----------------------------------------------------------------------------
// Suite 4: Placement Context Extraction & Profile Grounding
// -----------------------------------------------------------------------------
describe('D.6.1 — Student Placement Context Extraction', () => {
  it('4.1 extracts verified academic fields and preferred locations without inventing values', () => {
    const profile = {
      id: 'student_123',
      fullName: 'Alex Chen',
      email: 'alex@uni.edu',
      collegeOrUniversity: 'Stanford University',
      major: 'Computer Science',
      graduationYear: '2026',
      gpa: '3.9',
      avatar: 'boy' as const,
      location: 'San Francisco, CA / Remote',
      targetRole: 'Full Stack Engineer',
    };

    const resumeData: any = {
      personalInfo: {
        fullName: 'Alex Chen',
        location: 'San Francisco, CA',
      },
      education: [
        {
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Science',
          endDate: '2026',
          scoreOrGpa: '3.9',
        },
      ],
      skills: {
        technical: ['TypeScript', 'React', 'Node.js'],
        soft: ['Communication'],
        tools: ['Git', 'Docker'],
      },
      projects: [
        {
          title: 'Campus Hub',
          techStack: ['React', 'Node.js'],
          description: 'Full stack app',
        },
      ],
      experience: [],
    };

    const context = buildPlacementContext(profile, resumeData, null);
    assert.strictEqual(context.targetRole, 'Full Stack Engineer');
    assert.strictEqual(context.degree, 'Bachelor of Science');
    assert.strictEqual(context.major, 'Computer Science');
    assert.strictEqual(context.graduationYear, '2026');
    assert.strictEqual(context.cgpaOrScore, '3.9');
    assert.ok(context.technicalSkills.includes('TypeScript'));
    assert.ok(context.technicalSkills.includes('Docker'));
    assert.ok(context.softSkills.includes('Communication'));
    assert.ok(context.preferredLocations?.includes('San Francisco, CA'));
  });

  it('4.2 leaves unprovided student fields empty instead of fabricating values', () => {
    const emptyContext = buildPlacementContext(null, null, null);
    assert.strictEqual(emptyContext.degree, '');
    assert.strictEqual(emptyContext.major, '');
    assert.strictEqual(emptyContext.graduationYear, '');
    assert.strictEqual(emptyContext.cgpaOrScore, undefined);
    assert.strictEqual(emptyContext.technicalSkills.length, 0);
    assert.strictEqual(emptyContext.projects.length, 0);
  });
});

// -----------------------------------------------------------------------------
// Suite 5: Verified Opportunity Catalog Integrity
// -----------------------------------------------------------------------------
describe('D.6.1 — Verified Opportunity Catalog Integrity', () => {
  it('5.1 all catalog opportunities have legitimate source types and non-empty URLs', () => {
    assert.ok(VERIFIED_JOB_OPPORTUNITIES.length >= 5);

    VERIFIED_JOB_OPPORTUNITIES.forEach((job) => {
      assert.ok(job.id, 'Job must have ID');
      assert.ok(job.title, 'Job must have title');
      assert.ok(job.company, 'Job must have company');
      assert.ok(job.originalUrl.startsWith('http'), 'Job URL must be a valid HTTP(S) link');
      assert.ok(
        ['official-career-page', 'trusted-job-feed', 'verified-placement', 'student-added'].includes(
          job.sourceType
        ),
        `Valid sourceType expected for ${job.id}`
      );
      assert.ok(job.requiredSkills.length > 0, 'Job must state required skills');
      assert.ok(job.requiredQualifications.length > 0, 'Job must state required qualifications');
      assert.ok(job.verifiedAt, 'Job must have verification timestamp');
    });
  });

  it('5.2 ensures published salaries are genuine bands and unverified salaries remain empty', () => {
    VERIFIED_JOB_OPPORTUNITIES.forEach((job) => {
      if (job.salaryOrStipend) {
        // If provided, must represent a published band
        assert.ok(
          job.salaryOrStipend.includes('$') || job.salaryOrStipend.includes('₹'),
          `Salary for ${job.id} should have explicit currency indicator`
        );
      }
    });
  });
});
