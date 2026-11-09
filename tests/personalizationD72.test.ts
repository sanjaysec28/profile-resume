/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.2: Student Personalization & Context Intelligence Test Suite
 * Tests student context aggregation, persistent career goals CRUD, progress event detection,
 * duplicate recommendation prevention, user isolation, contradiction detection, and AI assistant integration.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  StudentCareerGoals,
  DEFAULT_CAREER_GOALS,
  StudentIntelligenceProfile,
  ProgressEvent,
} from '../src/types/personalization.ts';
import {
  loadStudentCareerGoals,
  saveStudentCareerGoals,
  buildUnifiedStudentIntelligence,
  detectProgressChanges,
  detectProfileContradictions,
  generatePersonalizedRecommendations,
} from '../src/lib/studentPersonalizationService.ts';
import { processUnifiedAssistantChat } from '../src/server/unifiedAssistantChat.ts';
import { StudentProfile } from '../src/types/profile.ts';
import { ResumeData } from '../src/types/resume.ts';
import { ApplicationRecord } from '../src/types/placementIntelligence.ts';
import { InterviewSession } from '../src/types/interviewIntelligence.ts';
import { CareerRoadmap } from '../src/types/careerReadiness.ts';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

const TEST_UID_1 = 'student_d72_primary';
const TEST_UID_2 = 'student_d72_secondary';

const MOCK_PROFILE: StudentProfile = {
  id: TEST_UID_1,
  fullName: 'Aarav Patel',
  email: 'aarav.patel@engineering.edu',
  phone: '+91 98765 43210',
  location: 'Bengaluru, India',
  collegeOrUniversity: 'National Institute of Technology',
  major: 'Computer Science and Engineering',
  graduationYear: '2026',
  gpa: '8.7',
  avatar: 'boy',
  targetRole: 'Full Stack Engineer',
  bio: 'Passionate student engineer building scalable web applications.',
};

const MOCK_RESUME: ResumeData = {
  id: 'res_d72',
  title: 'Full Stack Engineer Resume',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  personalInfo: {
    fullName: 'Aarav Patel',
    professionalTitle: 'Full Stack Engineer',
    email: 'aarav.patel@engineering.edu',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    summary: 'Proactive Computer Science student with expertise in React, TypeScript, and Node.js.',
  },
  education: [
    {
      id: 'edu_1',
      institution: 'National Institute of Technology',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science and Engineering',
      startDate: '2022',
      endDate: '2026',
      scoreOrGpa: '8.7',
    },
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Innovate Labs',
      position: 'Software Engineering Intern',
      startDate: '2024-05',
      endDate: '2024-08',
      description: 'Worked on internal tooling and dashboard services.',
      bullets: [
        'Built full-stack analytics dashboard using React and Express.',
        'Optimized database queries decreasing page load latency by 25%.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Campus Food Delivery Portal',
      techStack: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      description: 'Centralized ordering platform for university food stalls with live order tracking.',
      bullets: [
        'Implemented secure JWT auth serving 1,400 daily campus orders.',
        'Tuned PostgreSQL indexes achieving sub-40ms query execution times.',
      ],
      liveUrl: 'https://campus-food.example.com',
      repoUrl: 'https://github.com/aarav/campus-food',
    },
    {
      id: 'proj_2',
      title: 'Real-Time Collaborative Whiteboard',
      techStack: ['TypeScript', 'Canvas API', 'WebSockets', 'Redis'],
      description: 'Low-latency multiplayer whiteboard with real-time room synchronization.',
      bullets: [
        'Engineered WebSocket messaging pipeline handling 50 concurrent canvas collaborators.',
      ],
      repoUrl: 'https://github.com/aarav/collab-board',
    },
  ],
  skills: {
    technical: ['JavaScript / TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Git', 'Redis', 'Tailwind CSS'],
    soft: ['Teamwork', 'Clear Technical Communication', 'Analytical Thinking'],
  },
};

describe('Phase D.7.2: Student Personalization & Context Intelligence', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  // 1. Unified Student Intelligence Profile Aggregation
  it('1. Aggregates unified student intelligence from existing records without mutating data', () => {
    const goals: StudentCareerGoals = {
      ...DEFAULT_CAREER_GOALS,
      targetRole: 'Full Stack Engineer',
      primaryCareerGoal: 'Join a top product tier startup or tech company as a fresher.',
    };

    const intel = buildUnifiedStudentIntelligence({
      profile: MOCK_PROFILE,
      resumeData: MOCK_RESUME,
      goals,
    });

    assert.strictEqual(intel.academic.degree, 'B.Tech');
    assert.strictEqual(intel.academic.major, 'Computer Science and Engineering');
    assert.strictEqual(intel.academic.graduationYear, '2026');
    assert.strictEqual(intel.academic.gpa, '8.7');
    assert.strictEqual(intel.verifiedSkills.technical.length, 7);
    assert.strictEqual(intel.projects.length, 2);
    assert.strictEqual(intel.projects[0].hasMetrics, true, 'Detects metrics in project bullets');
    assert.strictEqual(intel.resume.completenessScore >= 80, true);
    assert.strictEqual(intel.goals.primaryCareerGoal, 'Join a top product tier startup or tech company as a fresher.');
  });

  // 2. Persistent Career Goals CRUD & LocalStorage Sync
  it('2. Saves, loads, and updates student career goals faithfully with user isolation', async () => {
    const customGoals: StudentCareerGoals = {
      primaryCareerGoal: 'Secure a Backend Engineering role at a high-growth Fintech firm.',
      targetRole: 'Backend Engineer',
      preferredIndustries: ['Fintech', 'Cloud Infrastructure'],
      preferredLocations: ['Bengaluru', 'Remote'],
      workPreference: 'hybrid',
      shortTermLearningGoals: [
        'Master Kafka event streaming',
        'Study distributed consensus and Raft algorithm',
      ],
      placementPrepGoals: [
        'Complete 5 system design mock interviews',
        'Solve 50 hard DSA questions on LeetCode',
      ],
      targetCompletionDate: '2026-08-31',
      preferences: {
        enablePersonalizedRecommendations: true,
        shareGoalsWithAiAssistant: true,
        notifyProgressMilestones: true,
      },
      updatedAt: new Date().toISOString(),
    };

    // Save for User 1
    await saveStudentCareerGoals(TEST_UID_1, customGoals);

    // Load for User 1
    const loaded1 = await loadStudentCareerGoals(TEST_UID_1);
    assert.strictEqual(loaded1.targetRole, 'Backend Engineer');
    assert.strictEqual(loaded1.preferredIndustries[0], 'Fintech');
    assert.strictEqual(loaded1.shortTermLearningGoals.length, 2);
    assert.strictEqual(loaded1.workPreference, 'hybrid');

    // User 2 should get default goals, not User 1's custom goals
    const loaded2 = await loadStudentCareerGoals(TEST_UID_2);
    assert.notStrictEqual(loaded2.primaryCareerGoal, customGoals.primaryCareerGoal);
  });

  // 3. Progress Change & Event Detection
  it('3. Detects incremental progress changes and prevents duplicate events', () => {
    const existingEvents: ProgressEvent[] = [
      {
        id: 'pe_proj_campus_food_delivery_portal',
        type: 'project_added',
        title: 'Project Documented: Campus Food Delivery Portal',
        description: 'Existing event description',
        timestamp: '2026-01-01T00:00:00Z',
      },
    ];

    // Detect changes with the same project plus a newly completed milestone
    const detected = detectProgressChanges(existingEvents, {
      projects: [{ title: 'Campus Food Delivery Portal' }],
      completedMilestoneTitles: ['PostgreSQL Index Optimization'],
      completedInterviewsCount: 2,
    });

    // Should add milestone and interview events, but NOT duplicate the project event
    assert.strictEqual(detected.length, 3);
    const eventTypes = detected.map((e) => e.type);
    assert.ok(eventTypes.includes('project_added'));
    assert.ok(eventTypes.includes('milestone_completed'));
    assert.ok(eventTypes.includes('mock_interview_completed'));

    // Count of project events must be exactly 1 (no duplicates)
    const projectEventCount = detected.filter((e) => e.id === 'pe_proj_campus_food_delivery_portal').length;
    assert.strictEqual(projectEventCount, 1);
  });

  // 4. Contradiction & Gap Detection
  it('4. Identifies profile contradictions, missing core skills, and academic timeline mismatches', () => {
    // A. Target role requires DevOps, but student has zero DevOps skills
    const devopsGaps = detectProfileContradictions({
      targetRole: 'DevOps / SRE Engineer',
      technicalSkills: ['HTML', 'CSS', 'JavaScript'],
      gpa: '8.0',
    });
    assert.ok(
      devopsGaps.some((g) => g.includes('infrastructure tools (Docker, Linux, CI/CD, Cloud) are currently missing')),
      'Must identify missing DevOps tools'
    );

    // B. Graduation Year in the past while listed as current student
    const timelineGaps = detectProfileContradictions({
      targetRole: 'Software Engineer',
      academicYear: '4th Year Student',
      graduationYear: '2021', // Past year
      technicalSkills: ['React', 'Node.js'],
      gpa: '7.5',
    });
    assert.ok(
      timelineGaps.some((g) => g.includes('Graduation Year is in the past')),
      'Must identify past graduation year mismatch'
    );

    // C. Missing GPA warning
    const missingGpa = detectProfileContradictions({
      targetRole: 'Frontend Engineer',
      technicalSkills: ['React', 'TypeScript'],
      gpa: '',
    });
    assert.ok(
      missingGpa.some((g) => g.includes('CGPA / Percentage is not provided')),
      'Must identify missing GPA when required for campus cutoffs'
    );
  });

  // 5. Context-Aware Recommendations Generation
  it('5. Generates tailored recommendations aligned with student goals and progress', () => {
    const goals: StudentCareerGoals = {
      ...DEFAULT_CAREER_GOALS,
      targetRole: 'Full Stack Engineer',
      primaryCareerGoal: 'Secure a high-impact product engineering offer.',
      shortTermLearningGoals: ['Learn GraphQL API schemas'],
    };

    const intel = buildUnifiedStudentIntelligence({
      profile: MOCK_PROFILE,
      resumeData: {
        ...MOCK_RESUME,
        projects: [
          {
            id: 'p_unq',
            title: 'Simple Portfolio Site',
            techStack: ['HTML', 'CSS'],
            description: 'A personal portfolio page with some links.', // No metrics
            bullets: ['Built with plain HTML and CSS.'],
          },
        ],
      },
      goals,
      latestAtsScore: 68,
      latestAtsMissingKeywords: ['Docker', 'AWS', 'Microservices'],
    });

    const recs = generatePersonalizedRecommendations(intel);
    assert.ok(recs.length >= 3, 'Must generate multiple tailored recommendations');

    const categories = recs.map((r) => r.category);
    assert.ok(categories.includes('resume'), 'Recommends quantifying metrics in unquantified project');
    assert.ok(categories.includes('ats'), 'Recommends adding missing ATS keywords');
    assert.ok(categories.includes('interview'), 'Recommends mock interview practice');
    assert.ok(categories.includes('roadmap'), 'Recommends roadmap milestone for learning goal');

    // Verify all recommendations have unique deterministic IDs
    const ids = new Set(recs.map((r) => r.id));
    assert.strictEqual(ids.size, recs.length, 'Recommendation IDs must be unique');
  });

  // 6. Unified AI Assistant Integration with Goals
  it('6. Unified AI Assistant ingests student goals and progress milestones in fallback mode', async () => {
    const goals: StudentCareerGoals = {
      ...DEFAULT_CAREER_GOALS,
      targetRole: 'Cloud Infrastructure Engineer',
      primaryCareerGoal: 'Specialize in Kubernetes orchestration and cloud cost optimization.',
      preferredIndustries: ['Cloud Infrastructure', 'Developer Tools'],
      preferredLocations: ['Bengaluru', 'Remote'],
      targetCompletionDate: '2026-12-31',
    };

    const res = await processUnifiedAssistantChat({
      message: 'What is my current career target and what should I focus on next?',
      context: {
        activeModule: 'dashboard',
        targetRole: goals.targetRole,
        studentGoalsSnapshot: {
          primaryCareerGoal: goals.primaryCareerGoal,
          targetRole: goals.targetRole,
          preferredIndustries: goals.preferredIndustries,
          preferredLocations: goals.preferredLocations,
          targetCompletionDate: goals.targetCompletionDate,
        },
        recentProgressEvents: [
          {
            id: 'pe_proj_whiteboard',
            type: 'project_added',
            title: 'Project Documented: Collaborative Whiteboard',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    assert.ok(res.reply.includes('Cloud Infrastructure Engineer'), 'Reply must reflect target role');
    assert.ok(res.reply.includes('Kubernetes orchestration') || res.reply.includes('Career Goals'), 'Reply must reflect student goals');
    assert.ok(
      res.verifiedDataDisclosures?.some((d) => d.includes('Active Student Goal') || d.includes('Recent Milestone')),
      'Disclosures must cite active student goals and recent milestones'
    );
  });
});
