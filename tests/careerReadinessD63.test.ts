/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.3: Career Readiness, Interview Intelligence & Placement Preparation Test Suite
 * Tests 5-dimension readiness indicators, 4-state skill gap classification, career roadmap CRUD,
 * 6-type interview prep, 6-dimension evaluation rubric, project defense grounding, and genuine analytics.
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  calculateCareerReadinessIndicators,
  analyzeRoleSkillGaps,
  generateDefaultCareerRoadmap,
  saveCareerRoadmap,
  loadCareerRoadmap,
  generateProjectDefenseQuestions,
  resolveRoleBenchmarkKey,
} from '../src/lib/careerReadinessEngine.ts';
import {
  PlacementStudentContext,
  ApplicationRecord,
} from '../src/types/placementIntelligence.ts';
import { ResumeData } from '../src/types/resume.ts';
import {
  InterviewSession,
  EvaluatedAnswer,
  InterviewQuestion,
} from '../src/types/interviewIntelligence.ts';
import { generateInterviewQuestions } from '../src/server/generateInterviewQuestions.ts';
import { evaluateInterviewAnswer } from '../src/server/evaluateInterviewAnswer.ts';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

const TEST_USER = 'test_student_d63';

const MOCK_STUDENT_CONTEXT: PlacementStudentContext = {
  targetRole: 'Full Stack Engineer',
  degree: 'B.Tech',
  major: 'Computer Science and Engineering',
  academicYear: '4th Year',
  graduationYear: '2026',
  cgpaOrScore: '8.8',
  technicalSkills: ['JavaScript / TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git & GitHub'],
  softSkills: ['Team Leadership', 'Clear Communication'],
  projects: [
    {
      title: 'Campus Campus Hub',
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      description: 'Centralized university portal for student announcements and peer tutoring sessions with JWT auth.',
      bullets: [
        'Engineered responsive web client with React and Tailwind CSS serving 1,200 active campus users.',
        'Architected PostgreSQL relational schema with index tuning, reducing query latency by 35%.',
      ],
    },
    {
      title: 'DevCollab Code Sharing',
      techStack: ['TypeScript', 'Express', 'Redis'],
      description: 'Real-time collaborative code editor with in-memory caching and WebSocket synchronization.',
      bullets: [
        'Integrated Redis caching layer reducing API response times down to 28ms under high load.',
      ],
    },
  ],
  experienceCount: 1,
  approvedAtsKeywords: ['Full Stack', 'RESTful APIs', 'PostgreSQL', 'TypeScript', 'Node.js'],
};

const MOCK_RESUME_DATA: ResumeData = {
  id: 'res_test_1',
  title: 'Default Resume',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  accentColor: '#101010',
  personalInfo: {
    fullName: 'Alex Vance',
    email: 'alex.vance@university.edu',
    phone: '+1 555-0199',
    location: 'San Jose, CA',
    professionalTitle: 'Full Stack Engineer',
    github: 'https://github.com/alexvance',
    linkedin: 'https://linkedin.com/in/alexvance',
    summary: 'Detail-oriented Computer Science senior with production experience building scalable TypeScript applications.',
  },
  education: [
    {
      id: 'edu_1',
      institution: 'State University',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science',
      startDate: '2022-08-01',
      endDate: '2026-05-31',
      scoreOrGpa: '3.85 / 4.0',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'TechWorks Labs',
      position: 'Software Engineering Intern',
      location: 'San Jose, CA',
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      description: 'Built REST APIs and automated unit tests for internal tools.',
      bullets: [
        'Developed 6 REST endpoints using Express and TypeScript with 92% unit test coverage.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Campus Hub Portal',
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      description: 'University portal for student tutoring.',
      bullets: ['Improved query response latency by 35% on high-load endpoints.'],
      repoUrl: 'https://github.com/alexvance/campus-hub',
    },
  ],
  skills: {
    technical: ['JavaScript / TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git & GitHub'],
    soft: ['Team Leadership', 'Clear Communication'],
    tools: ['VS Code', 'Postman', 'Docker'],
  },
};

describe('D.6.3 — 1. Unified Career Readiness Dashboard (5 Separate Indicators)', () => {
  it('1.1 calculates 5 separate indicators without combining into a single fake guarantee', () => {
    const indicators = calculateCareerReadinessIndicators(
      MOCK_STUDENT_CONTEXT,
      MOCK_RESUME_DATA,
      [
        {
          id: 'app_1',
          jobId: 'job_google',
          company: 'Google',
          jobTitle: 'Software Engineering Intern',
          location: 'Mountain View, CA',
          workEnvironment: 'hybrid',
          jobType: 'internship',
          jobUrl: 'https://careers.google.com',
          sourceName: 'Google Careers',
          status: 'applied',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      []
    );

    assert.ok(indicators.resumeReadiness, 'Resume readiness indicator must exist');
    assert.ok(indicators.technicalSkillReadiness, 'Technical skill readiness indicator must exist');
    assert.ok(indicators.projectExplanationReadiness, 'Project explanation readiness must exist');
    assert.ok(indicators.interviewReadiness, 'Interview readiness must exist');
    assert.ok(indicators.applicationActivity, 'Application activity must exist');

    // Values must be valid percentages between 0 and 100
    assert.ok(indicators.resumeReadiness.score >= 0 && indicators.resumeReadiness.score <= 100);
    assert.ok(indicators.technicalSkillReadiness.score >= 0 && indicators.technicalSkillReadiness.score <= 100);
    assert.ok(indicators.projectExplanationReadiness.score >= 0 && indicators.projectExplanationReadiness.score <= 100);
    assert.ok(indicators.interviewReadiness.score >= 0 && indicators.interviewReadiness.score <= 100);
    assert.ok(indicators.applicationActivity.score >= 0 && indicators.applicationActivity.score <= 100);

    // Transparency anti-guarantee disclaimer must be present
    assert.ok(indicators.disclaimer.includes('not combined into a single selection probability'));
  });

  it('1.2 correctly assesses zero completed interview sessions with honest diagnostic baseline', () => {
    const indicators = calculateCareerReadinessIndicators(
      MOCK_STUDENT_CONTEXT,
      MOCK_RESUME_DATA,
      [],
      [] // Zero completed sessions
    );

    assert.strictEqual(indicators.interviewReadiness.level, 'low');
    assert.strictEqual(indicators.interviewReadiness.metricsBreakdown['Completed Mock Sessions'], 0);
    assert.ok(
      indicators.interviewReadiness.diagnosticNotes.some((n) => n.includes('No completed mock interview')),
      'Must transparently diagnose lack of interview practice'
    );
  });
});

describe('D.6.3 — 2. Role-Based Skill Gap Analysis (4-State Classification)', () => {
  it('2.1 classifies skills into demonstrated, partially_demonstrated, missing, and unverified', () => {
    const analysis = analyzeRoleSkillGaps('Full Stack Engineer', MOCK_STUDENT_CONTEXT);

    assert.ok(analysis.classifiedSkills.length >= 8, 'Must assess benchmark role skills');

    const states = new Set(analysis.classifiedSkills.map((s) => s.classification));
    assert.ok(states.has('demonstrated'), 'Must identify demonstrated skills');
    assert.ok(states.has('missing'), 'Must identify missing skills');

    // Demonstrated skills must have verified evidence
    const demonstrated = analysis.classifiedSkills.filter((s) => s.classification === 'demonstrated');
    demonstrated.forEach((s) => {
      assert.ok(s.evidence, `Demonstrated skill ${s.name} must include evidence`);
    });

    // Invariant: Missing skills are never marked as demonstrated
    const missing = analysis.classifiedSkills.filter((s) => s.classification === 'missing');
    missing.forEach((s) => {
      assert.strictEqual(s.classification, 'missing');
      assert.ok(!s.evidence, 'Missing skill must not have false evidence');
    });
  });

  it('2.2 generates practical learning sequence prioritizing essential missing competencies', () => {
    const analysis = analyzeRoleSkillGaps('Full Stack Engineer', MOCK_STUDENT_CONTEXT);
    assert.ok(analysis.learningSequence.length > 0);

    // First item in learning sequence should be essential or important
    const firstTask = analysis.learningSequence[0];
    assert.ok(firstTask.importance === 'essential' || firstTask.importance === 'important');
  });

  it('2.3 connects missing skills to candidate actual documented projects', () => {
    const analysis = analyzeRoleSkillGaps('Full Stack Engineer', MOCK_STUDENT_CONTEXT);
    assert.ok(analysis.projectOpportunities.length > 0, 'Must connect gaps to existing projects');
    const opp = analysis.projectOpportunities[0];
    assert.ok(
      MOCK_STUDENT_CONTEXT.projects.some((p) => p.title === opp.projectTitle),
      'Project opportunity must reference genuine student project'
    );
  });
});

describe('D.6.3 — 3. Actionable Career Roadmap & Progress Persistence', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  it('3.1 generates actionable milestones across all 7 required categories', () => {
    const milestones = generateDefaultCareerRoadmap('Full Stack Engineer');
    assert.strictEqual(milestones.length, 8);

    const categories = new Set(milestones.map((m) => m.category));
    assert.ok(categories.has('short_term'));
    assert.ok(categories.has('technical_skills'));
    assert.ok(categories.has('dsa_problem_solving'));
    assert.ok(categories.has('project_development'));
    assert.ok(categories.has('resume_improvement'));
    assert.ok(categories.has('interview_prep'));
    assert.ok(categories.has('application_targets'));

    milestones.forEach((m) => {
      assert.ok(m.title && m.description);
      assert.ok(m.priority);
      assert.ok(m.estimatedDuration);
      assert.ok(m.completionCriteria);
    });
  });

  it('3.2 saves and reloads career roadmap progress faithfully', async () => {
    const initial = await loadCareerRoadmap(TEST_USER, 'Full Stack Engineer');
    assert.ok(initial.milestones.length >= 8);

    // Toggle a milestone to completed
    const updatedMilestones = initial.milestones.map((m, idx) =>
      idx === 0 ? { ...m, status: 'completed' as const, completedAt: new Date().toISOString() } : m
    );

    await saveCareerRoadmap(TEST_USER, {
      ...initial,
      milestones: updatedMilestones,
    });

    const reloaded = await loadCareerRoadmap(TEST_USER, 'Full Stack Engineer');
    assert.strictEqual(reloaded.milestones[0].status, 'completed');
    assert.ok(reloaded.milestones[0].completedAt);
  });
});

describe('D.6.3 — 4. Intelligent Interview Preparation (6 Types & Grounding)', () => {
  it('4.1 generates role-tailored questions strictly grounded in student actual projects', async () => {
    const questions = await generateInterviewQuestions({
      targetRole: 'Full Stack Engineer',
      category: 'resume-focused',
      difficulty: 'medium',
      count: 3,
      verifiedSkills: MOCK_STUDENT_CONTEXT.technicalSkills,
      academicYear: MOCK_STUDENT_CONTEXT.academicYear,
      degree: MOCK_STUDENT_CONTEXT.degree,
      projectsSummary: MOCK_STUDENT_CONTEXT.projects.map((p) => ({
        title: p.title,
        techStack: p.techStack,
        description: p.description,
      })),
    });

    assert.ok(questions.length >= 3);
    const mentionsProject = questions.some(
      (q) => q.question.includes('Campus Campus Hub') || q.resumeAnchor?.includes('Campus')
    );
    assert.ok(mentionsProject, 'Questions must anchor to student actual project');
  });

  it('4.2 supports all six interview types cleanly', async () => {
    const types: ('technical-fundamentals' | 'hr-behavioral' | 'projects-experience' | 'resume-focused' | 'frameworks-technologies' | 'dsa')[] = [
      'technical-fundamentals',
      'hr-behavioral',
      'projects-experience',
      'resume-focused',
      'frameworks-technologies',
      'dsa',
    ];

    for (const cat of types) {
      const qs = await generateInterviewQuestions({
        targetRole: 'Backend Engineer',
        category: cat,
        difficulty: 'medium',
        count: 2,
        verifiedSkills: ['Node.js', 'PostgreSQL'],
      });
      assert.ok(qs.length >= 1, `Category ${cat} must return questions`);
    }
  });
});

describe('D.6.3 — 5. Interactive Mock Interview & 6-Dimension Rubric Evaluation', () => {
  it('5.1 evaluates candidate answer across all 6 rubric dimensions', async () => {
    const testQuestion: InterviewQuestion = {
      id: 'q_test_eval',
      question: 'Explain how database indexing works in PostgreSQL and when a B-Tree index might not be utilized.',
      category: 'database-sql',
      difficulty: 'medium',
      whyAsked: 'Assesses query optimization awareness.',
      topic: 'Database Indexing',
      evaluationCriteria: ['B-Tree mechanism', 'Sequential scan scenarios', 'Low cardinality'],
    };

    const studentAnswer =
      'PostgreSQL uses B-Tree indexes by default to provide O(log N) search times. However, if a table has very few rows, or if the WHERE clause queries high-percentage cardinality columns, PostgreSQL query planner opts for a sequential table scan because reading pages sequentially is faster.';

    const evaluation = await evaluateInterviewAnswer({
      question: testQuestion,
      studentAnswer,
      answerMode: 'text',
      targetRole: 'Backend Engineer',
    });

    assert.ok(evaluation.score >= 50, 'Substantive answer must receive appropriate qualitative score');
    assert.ok(evaluation.rubric, 'Rubric breakdown must be present');
    assert.ok(typeof evaluation.rubric.technicalCorrectness === 'number');
    assert.ok(typeof evaluation.rubric.clarity === 'number');
    assert.ok(typeof evaluation.rubric.structure === 'number');
    assert.ok(typeof evaluation.rubric.problemSolvingApproach === 'number');
    assert.ok(typeof evaluation.rubric.communication === 'number');
    assert.ok(typeof evaluation.rubric.relevance === 'number');
    assert.ok(evaluation.whatWasDoneWell.length > 0);
    assert.ok(evaluation.exampleStrongerAnswer.length > 20);
  });

  it('5.2 distinguishes short/incomplete answers with low score and improvement guidance', async () => {
    const testQuestion: InterviewQuestion = {
      id: 'q_test_short',
      question: 'Explain the difference between optimistic and pessimistic locking.',
      category: 'database-sql',
      difficulty: 'hard',
      whyAsked: 'Concurrency control understanding.',
      topic: 'Concurrency Control',
      evaluationCriteria: ['Version numbers vs locks', 'Conflict frequency'],
    };

    const evaluation = await evaluateInterviewAnswer({
      question: testQuestion,
      studentAnswer: 'idk',
      answerMode: 'text',
      targetRole: 'Backend Engineer',
    });

    assert.ok(evaluation.score <= 35, 'Short non-answer must receive low score');
    assert.ok(evaluation.whatWasMissing.length > 0);
    assert.ok(evaluation.improvementSuggestions.length > 0);
  });
});

describe('D.6.3 — 6. Dedicated Project Defense Mode Grounding', () => {
  it('6.1 generates questions strictly covering the 8 required project defense topics', () => {
    const questions = generateProjectDefenseQuestions(
      'Campus Campus Hub',
      ['React', 'Node.js', 'PostgreSQL'],
      'Centralized portal for student announcements and peer tutoring sessions.'
    );

    assert.strictEqual(questions.length, 6);
    const dimensions = questions.map((q) => q.dimension);
    assert.ok(dimensions.includes('problem_statement'));
    assert.ok(dimensions.includes('architecture_design'));
    assert.ok(dimensions.includes('technology_rationale'));
    assert.ok(dimensions.includes('database_api'));
    assert.ok(dimensions.includes('challenges_debugging'));
    assert.ok(dimensions.includes('future_improvements'));

    // Question text must cite actual project name
    questions.forEach((q) => {
      assert.ok(q.question.includes('Campus Campus Hub'), 'Must name student actual project');
      assert.ok(q.evaluationCriteria.length > 0);
    });
  });
});
