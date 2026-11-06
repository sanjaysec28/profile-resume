/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase D.3.2 Integration Test Suite:
 * 1. ATS Report persistence, fingerprinting, and outdated detection
 * 2. Resume review schema field access (experience, technical/soft/tools skills)
 * 3. ATS keyword handoff deduplication and verification guard
 */

import { computeResumeContentFingerprint } from '../src/lib/resumeReviewScorer.ts';
import { getAtsLocalStorageKey, ATS_SCHEMA_VERSION } from '../src/lib/atsPersistenceService.ts';
import { getDeterministicReviewFallback } from '../src/server/generateReview.ts';
import { ResumeData } from '../src/types/resume.ts';

function runD32Tests() {
  console.log('--- STARTING PHASE D.3.2 INTEGRATION VERIFICATION TESTS ---');
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

  // TEST 1: ATS Persistence Cache Key & Schema Version
  {
    const key = getAtsLocalStorageKey('user-123', 'resume-456');
    assert(key === 'profile_ats_report_user-123_resume-456', 'Test 1.1: getAtsLocalStorageKey generates correct owner key');
    const anonKey = getAtsLocalStorageKey(undefined, '');
    assert(anonKey === 'profile_ats_report_anonymous_default_resume', 'Test 1.2: Fallback key for anonymous/default');
    assert(ATS_SCHEMA_VERSION === 1, 'Test 1.3: ATS schema version is defined');
  }

  // TEST 2: Content Fingerprint & Outdated Scan Detection
  {
    const baseResume: ResumeData = {
      id: 'res-test-1',
      title: 'Full Stack Draft',
      updatedAt: '2026-03-01T12:00:00Z',
      templateId: 'modern',
      personalInfo: {
        fullName: 'Test Candidate',
        email: 'test@example.com',
        phone: '1234567890',
        location: 'Bengaluru, India',
        summary: 'Undergraduate Computer Science student',
      },
      education: [
        {
          id: 'edu-1',
          institution: 'National Institute of Technology',
          degree: 'B.Tech',
          fieldOfStudy: 'Computer Science',
          startDate: '2022',
          endDate: '2026'
        }
      ],
      experience: [
        {
          id: 'exp-1',
          company: 'Fintech Corp',
          position: 'Backend Intern',
          startDate: '2025-05',
          endDate: '2025-07',
          bullets: ['Engineered scalable microservices']
        }
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'Cloud Monitor',
          techStack: ['Node.js', 'Docker'],
          description: 'Distributed monitoring agent'
        }
      ],
      skills: {
        technical: ['Node.js', 'TypeScript', 'Docker'],
        soft: ['Critical Thinking'],
        tools: ['Git']
      }
    };

    const initialFingerprint = computeResumeContentFingerprint(baseResume);
    assert(typeof initialFingerprint === 'string' && initialFingerprint.startsWith('v_'), 'Test 2.1: Fingerprint is valid deterministic hash');

    // Identical resume produces identical fingerprint
    const sameFingerprint = computeResumeContentFingerprint({ ...baseResume });
    assert(initialFingerprint === sameFingerprint, 'Test 2.2: Deterministic stability for unchanged resume');

    // Editing resume (e.g. adding a skill) modifies fingerprint
    const modifiedResume: ResumeData = {
      ...baseResume,
      skills: {
        ...baseResume.skills,
        technical: [...baseResume.skills.technical, 'Kubernetes']
      }
    };
    const modifiedFingerprint = computeResumeContentFingerprint(modifiedResume);
    assert(initialFingerprint !== modifiedFingerprint, 'Test 2.3: Modifying skills alters fingerprint for outdated detection');
  }

  // TEST 3: Resume Review Schema Alignment (Fix 2 Verification)
  {
    const fresherResume: ResumeData = {
      id: 'fresher-1',
      title: 'Student Resume',
      updatedAt: new Date().toISOString(),
      templateId: 'technical',
      personalInfo: {
        fullName: 'Devika Sharma',
        email: 'devika@example.com',
        phone: '9876543210',
        location: 'New Delhi',
        summary: 'Computer Science student focusing on distributed systems'
      },
      education: [
        {
          id: 'edu-1',
          institution: 'IIT Delhi',
          degree: 'B.Tech',
          fieldOfStudy: 'Computer Science',
          startDate: '2022',
          endDate: '2026'
        }
      ],
      experience: [], // ZERO experience - Fresher
      projects: [
        {
          id: 'proj-1',
          title: 'Distributed KV Store',
          techStack: ['Go', 'Raft'],
          description: 'Consensus-backed storage engine'
        }
      ],
      skills: {
        technical: ['Go', 'Distributed Systems', 'C++'],
        soft: ['Leadership'],
        tools: ['Linux', 'Git']
      }
    };

    const reviewRes = getDeterministicReviewFallback({
      targetRole: 'Systems Software Engineer',
      purpose: 'fresher',
      resumeData: fresherResume
    });

    assert(reviewRes.completeness.hasExperience === false, 'Test 3.1: Fresher experience evaluated as false without crash');
    assert(reviewRes.completeness.isFresherAppropriate === true, 'Test 3.2: Fresher marked as isFresherAppropriate');
    assert(reviewRes.completeness.hasSkills === true, 'Test 3.3: Skills correctly read from technical/soft/tools');
    assert(reviewRes.completeness.hasProjects === true, 'Test 3.4: Projects recognized');
  }

  // TEST 4: ATS Keyword Handoff Verification Guard
  {
    const existingSkills = ['Python', 'SQL', 'FastAPI'];
    const existingLower = new Set(existingSkills.map((s) => s.toLowerCase()));

    // Suggested keywords from ATS
    const suggestedKws = ['FastAPI', 'Docker', 'PostgreSQL', 'python'];
    // Student selects ONLY Docker and PostgreSQL (they know them), but NOT unverified ones
    const studentSelected = ['Docker', 'PostgreSQL'];

    const filteredNew = studentSelected.filter((s) => !existingLower.has(s.toLowerCase()));
    assert(filteredNew.length === 2 && filteredNew.includes('Docker') && filteredNew.includes('PostgreSQL'), 'Test 4.1: Only student-selected skills are queued');

    // If student selected FastAPI, deduplication excludes it because it's already in resume
    const duplicateSelection = ['FastAPI', 'Docker'];
    const deduped = duplicateSelection.filter((s) => !existingLower.has(s.toLowerCase()));
    assert(deduped.length === 1 && deduped[0] === 'Docker', 'Test 4.2: Case-insensitive deduplication prevents duplicate skills');
  }

  console.log(`\nPHASE D.3.2 ALL TESTS COMPLETE: ${passed}/${total} assertions passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runD32Tests();
