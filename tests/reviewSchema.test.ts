/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Regression Test Suite: Resume Review Schema Alignment (Fix 2)
 * Tests server-side field access for:
 * 1. Resume with experience
 * 2. Resume without experience
 * 3. Resume with technical skills
 * 4. Resume with soft skills and tools
 * 5. Empty resume
 */

import { getDeterministicReviewFallback } from '../src/server/generateReview.ts';
import { ReviewGenerationInput } from '../src/types/resumeReview.ts';

function runTests() {
  console.log('--- STARTING RESUME REVIEW SCHEMA ALIGNMENT REGRESSION TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    }
  }

  // 1. Resume with experience
  {
    const inputWithExp: ReviewGenerationInput = {
      targetRole: 'Software Engineer',
      purpose: 'placement',
      resumeData: {
        personalInfo: { fullName: 'Sanjay Kumar', email: 'sanjay@example.com' },
        experience: [
          {
            id: 'exp-1',
            company: 'Tech Corp',
            position: 'Software Engineering Intern',
            startDate: '2024-05',
            endDate: '2024-08',
            bullets: ['Built REST APIs with TypeScript and Express']
          }
        ],
        projects: [
          { id: 'proj-1', title: 'Portfolio Platform', techStack: ['React', 'Node'], description: 'Web app' }
        ],
        skills: { technical: ['TypeScript', 'React'], soft: ['Teamwork'], tools: ['Git'] }
      }
    };
    const res = getDeterministicReviewFallback(inputWithExp);
    assert(res.completeness.hasExperience === true, 'Case 1: Resume with experience hasExperience === true');
    assert(res.completeness.hasSkills === true, 'Case 1: Resume with experience hasSkills === true');
    assert(res.completeness.hasProjects === true, 'Case 1: Resume with experience hasProjects === true');
  }

  // 2. Resume without experience (Fresher)
  {
    const inputWithoutExp: ReviewGenerationInput = {
      targetRole: 'Junior Frontend Developer',
      purpose: 'fresher',
      resumeData: {
        personalInfo: { fullName: 'Anita Roy', email: 'anita@example.com' },
        experience: [],
        projects: [
          { id: 'proj-1', title: 'Campus Portal', techStack: ['React'], description: 'College app' }
        ],
        skills: { technical: ['JavaScript', 'HTML', 'CSS'], soft: [], tools: [] }
      }
    };
    const res = getDeterministicReviewFallback(inputWithoutExp);
    assert(res.completeness.hasExperience === false, 'Case 2: Resume without experience hasExperience === false');
    assert(res.completeness.isFresherAppropriate === true, 'Case 2: Resume without experience remains fresher-appropriate');
    assert(res.completeness.hasProjects === true, 'Case 2: Resume has projects recognized');
  }

  // 3. Resume with technical skills only
  {
    const inputTechOnly: ReviewGenerationInput = {
      targetRole: 'Backend Engineer',
      purpose: 'placement',
      resumeData: {
        skills: { technical: ['Python', 'Django', 'PostgreSQL'], soft: [], tools: [] }
      }
    };
    const res = getDeterministicReviewFallback(inputTechOnly);
    assert(res.completeness.hasSkills === true, 'Case 3: Resume with technical skills hasSkills === true');
  }

  // 4. Resume with soft skills and tools (no technical skills)
  {
    const inputSoftAndTools: ReviewGenerationInput = {
      targetRole: 'Scrum Lead / Project Coordinator',
      purpose: 'placement',
      resumeData: {
        skills: { technical: [], soft: ['Agile Collaboration', 'Conflict Resolution'], tools: ['Jira', 'Docker'] }
      }
    };
    const res = getDeterministicReviewFallback(inputSoftAndTools);
    assert(res.completeness.hasSkills === true, 'Case 4: Resume with soft skills & tools hasSkills === true');
  }

  // 5. Empty resume
  {
    const inputEmpty: ReviewGenerationInput = {
      targetRole: 'General Candidate',
      purpose: 'placement',
      resumeData: {}
    };
    const res = getDeterministicReviewFallback(inputEmpty);
    assert(res.completeness.hasExperience === false, 'Case 5: Empty resume hasExperience === false');
    assert(res.completeness.hasSkills === false, 'Case 5: Empty resume hasSkills === false');
    assert(res.completeness.hasProjects === false, 'Case 5: Empty resume hasProjects === false');
    assert(res.completeness.hasContact === false, 'Case 5: Empty resume hasContact === false');
  }

  console.log(`\nTEST RESULTS: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
