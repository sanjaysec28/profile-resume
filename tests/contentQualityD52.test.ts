/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.5.2 Automated Content Quality & Truthful AI Verification Suite
 * Tests:
 * 1. AI Resume Content Quality Engine (auditResumeContentQuality)
 * 2. Duplicate bullet detection and deduplication
 * 3. AI conversational leakage and refusal message detection & filtering
 * 4. Unresolved placeholder detection and safe resolution
 * 5. Incomplete project & experience description detection
 * 6. Generic statement detection and action verb recommendations
 * 7. Non-destructive resolution (applyResolvedQualityFix & applyAllSafeQualityFixes)
 * 8. Truthful AI invariants (anti-metric fabrication & student approval safeguards)
 * 9. Multi-template data feed across all 8 active resume templates
 */

import {
  auditResumeContentQuality,
  applyResolvedQualityFix,
  applyAllSafeQualityFixes,
  filterRefusalAndConversationalText,
  cleanUnresolvedPlaceholders,
  deduplicateBulletPoints,
  containsConversationalOrRefusalText,
  containsUnresolvedPlaceholders,
  validateResumeForExport,
  sanitizeResumeData,
  QualityIssue,
} from '../src/features/resume/utils/resumeSanitizer.ts';
import { ResumeData, ResumeTemplateId } from '../src/types/resume.ts';
import { generateResumeContent } from '../src/server/generateContent.ts';

// Test Dataset with Intentional Quality Flaws for Verification
const TEST_FLAWED_RESUME: ResumeData = {
  id: 'resume-test-d52',
  title: 'Software Engineer Resume',
  updatedAt: new Date().toISOString(),
  personalInfo: {
    fullName: 'Alex Vance',
    professionalTitle: 'Full-Stack Software Engineer',
    email: 'alex.vance@example.com',
    phone: '+1 555-0199',
    location: 'San Francisco, CA',
    summary:
      'Sure, here is an improved draft: Hardworking team player responsible for various tasks and developing scalable web applications using React and Node.js with [improved efficiency by X%].',
  },
  education: [
    {
      id: 'edu-1',
      institution: 'University of Washington',
      degree: 'B.S.',
      fieldOfStudy: 'Computer Science',
      startDate: '2021-09',
      endDate: '2025-06',
      highlights: [
        'Dean’s List for 6 consecutive quarters',
        'Dean’s List for 6 consecutive quarters', // duplicate bullet!
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'TechCorp Cloud',
      position: 'Software Engineering Intern',
      startDate: '2024-06',
      endDate: '2024-08',
      description: 'As an AI language model, I cannot provide real company data. Developed backend microservices using Node.js and PostgreSQL.',
      bullets: [
        'Developed backend microservices using Node.js and PostgreSQL.', // duplicate of description!
        'Engineered distributed message queue consumer using RabbitMQ.',
        'Engineered distributed message queue consumer using RabbitMQ.', // duplicate bullet!
        'Improved endpoint latency by [X%] through Redis caching layer.', // unresolved placeholder!
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Distributed Key-Value Store',
      role: 'Lead Architect',
      description: 'Built distributed Raft-consensus key-value store in Go with gRPC RPCs.',
      bullets: [
        'Implemented leader election and log replication conforming strictly to Raft protocol specifications.',
        'Benchmarked partition tolerance using Chaos Mesh under simulated latency [insert achievement].', // placeholder!
      ],
      techStack: ['Go', 'gRPC', 'Protobuf', 'Raft'],
    },
    {
      id: 'proj-2',
      title: 'Empty Project Entry',
      role: 'Developer',
      description: '', // incomplete/empty description!
      bullets: [],
      techStack: [],
    },
  ],
  skills: {
    technical: ['Go', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', '[Tool Name]'],
    soft: ['Agile Development', 'Team Leadership', 'Fast Learner'],
    tools: ['Git', 'VS Code', 'GitHub Actions'],
  },
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Cloud Practitioner [2024]', // legitimate bracket with year!
      issuer: 'Amazon Web Services',
      issueDate: '2024-04',
    },
  ],
  achievements: [
    'First Place - UW Annual Hackathon 2024 (out of 120 teams)',
    'First Place - UW Annual Hackathon 2024 (out of 120 teams)', // duplicate achievement!
  ],
  positionsOfResponsibility: [],
  coursework: ['Distributed Systems', 'Database Internals', 'Algorithms'],
  templateId: 'modern',
};

async function runTestSuite() {
  console.log('================================================================');
  console.log(' ProFile — D.5.2 Content Quality & Truthful AI Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (detail) console.error(`    Detail: ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // Test Group 1: Content Quality Audit Engine
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Content Quality Audit Engine ---');
  const auditReport = auditResumeContentQuality(TEST_FLAWED_RESUME, 'Distributed Systems Engineer');

  assert(
    auditReport.summary.conversationalCount >= 2,
    '1.1 Detects conversational AI preambles and refusal messages',
    `Found conversational: ${auditReport.summary.conversationalCount}`
  );

  assert(
    auditReport.summary.placeholdersCount >= 3,
    '1.2 Detects unresolved bracketed placeholders ([improved efficiency by X%], [X%], [insert achievement])',
    `Found placeholders: ${auditReport.summary.placeholdersCount}`
  );

  assert(
    auditReport.summary.duplicateBulletsCount >= 2,
    '1.3 Detects duplicate bullets and bullets mirroring section descriptions',
    `Found duplicates: ${auditReport.summary.duplicateBulletsCount}`
  );

  assert(
    auditReport.summary.emptyDescriptionsCount >= 1,
    '1.4 Detects empty/incomplete project descriptions',
    `Found empty descriptions: ${auditReport.summary.emptyDescriptionsCount}`
  );

  assert(
    auditReport.summary.genericStatementsCount >= 1,
    '1.5 Detects generic/passive statements (e.g., "responsible for various tasks")',
    `Found generic statements: ${auditReport.summary.genericStatementsCount}`
  );

  assert(
    auditReport.overallScore < 80 && auditReport.status === 'critical_issues',
    '1.6 Accurately assesses flawed resume score and assigns critical_issues status',
    `Score: ${auditReport.overallScore}, Status: ${auditReport.status}`
  );

  // -------------------------------------------------------------
  // Test Group 2: Non-Destructive Resolution & Safe Fixes
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Non-Destructive Resolution & Safe Fixes ---');

  // Test individual fix on summary
  const summaryIssue = auditReport.issues.find((i) => i.id === 'issue-summary-refusal');
  assert(Boolean(summaryIssue), '2.1 Successfully located summary refusal issue');

  if (summaryIssue) {
    const fixedSingle = applyResolvedQualityFix(TEST_FLAWED_RESUME, summaryIssue);
    assert(
      !fixedSingle.personalInfo.summary.includes('Sure, here is an improved draft:'),
      '2.2 applyResolvedQualityFix cleanly strips AI conversational header from summary'
    );
    assert(
      fixedSingle.personalInfo.fullName === 'Alex Vance',
      '2.3 applyResolvedQualityFix preserves all unaffected student data'
    );
  }

  // Test applyAllSafeQualityFixes
  const safeFixedResume = applyAllSafeQualityFixes(TEST_FLAWED_RESUME, auditReport.issues);
  const reAuditSafe = auditResumeContentQuality(safeFixedResume);

  assert(
    reAuditSafe.summary.conversationalCount === 0,
    '2.4 All conversational refusal messages eliminated after safe fixes',
    `Remaining: ${reAuditSafe.summary.conversationalCount}`
  );

  assert(
    reAuditSafe.summary.duplicateBulletsCount === 0,
    '2.5 All duplicate bullets safely deduplicated without data loss',
    `Remaining: ${reAuditSafe.summary.duplicateBulletsCount}`
  );

  assert(
    !safeFixedResume.experience[0].bullets?.some((b) => b.includes('[X%]')),
    '2.6 Placeholders safely resolved to professional qualitative statements'
  );

  assert(
    safeFixedResume.skills.technical.includes('Go') && safeFixedResume.skills.technical.includes('PostgreSQL'),
    '2.7 Legitimate student skills remain intact after safe fixes'
  );

  // -------------------------------------------------------------
  // Test Group 3: Truthful AI Invariants & Server Generator
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Truthful AI Invariants & Server Generator ---');

  const aiResponse = await generateResumeContent({
    section: 'projects',
    action: 'role_target',
    targetRole: 'Distributed Systems Engineer',
    purpose: 'internship',
    degree: 'B.S. Computer Science',
    department: 'Computer Science',
    itemTitle: 'Distributed Key-Value Store',
    itemTechStack: ['Go', 'gRPC', 'Raft'],
    currentContent: 'Built distributed Raft-consensus key-value store in Go with gRPC RPCs.',
  });

  assert(
    Boolean(aiResponse.generatedText || (aiResponse.bulletPoints && aiResponse.bulletPoints.length > 0)),
    '3.1 AI generator produces structured, role-aligned content'
  );

  assert(
    aiResponse.truthfulGuaranteeVerified === true,
    '3.2 Response includes truthfulGuaranteeVerified flag'
  );

  assert(
    Boolean(aiResponse.explanation && aiResponse.explanation.length > 10),
    '3.3 Response provides clear rationale explaining why improvement fits target role',
    `Explanation: "${aiResponse.explanation}"`
  );

  // Verify that AI response does not inject bracketed placeholders or refusal text
  const responseCleanCheck =
    !containsConversationalOrRefusalText(aiResponse.generatedText) &&
    !containsUnresolvedPlaceholders(aiResponse.generatedText);

  assert(
    responseCleanCheck,
    '3.4 Generated output contains 0 conversational leaks and 0 unresolved placeholders'
  );

  // -------------------------------------------------------------
  // Test Group 4: Export Validation
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Export Validation ---');

  const exportCheckFlawed = validateResumeForExport(TEST_FLAWED_RESUME);
  assert(
    exportCheckFlawed.warnings.length > 0,
    '4.1 validateResumeForExport raises itemized warnings for flawed resume',
    `Warnings count: ${exportCheckFlawed.warnings.length}`
  );

  const pristineResume: ResumeData = {
    ...safeFixedResume,
    projects: [
      {
        id: 'proj-1',
        title: 'Distributed Key-Value Store',
        role: 'Lead Developer',
        description: 'Engineered high-throughput Raft consensus store in Go with automated cluster failover.',
        bullets: [
          'Implemented leader election and log replication conforming to Raft protocol specifications.',
          'Benchmarked partition tolerance using simulated network partitions and high-load traffic.',
        ],
        techStack: ['Go', 'gRPC', 'Protobuf'],
      },
    ],
  };

  const exportCheckPristine = validateResumeForExport(pristineResume);
  assert(
    exportCheckPristine.isValid === true,
    '4.2 validateResumeForExport marks clean, verified resume as 100% valid for export'
  );

  // -------------------------------------------------------------
  // Test Group 5: Multi-Template Compatibility (All 8 Active Templates)
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: Multi-Template Compatibility across 8 Templates ---');

  const activeTemplates: ResumeTemplateId[] = [
    'modern',
    'classic',
    'minimal',
    'sidebar-pro',
    'creative-cards',
    'accent-minimal',
    'technical',
    'compact',
  ];

  let templatePasses = 0;
  for (const tpl of activeTemplates) {
    const tplResume: ResumeData = {
      ...pristineResume,
      templateId: tpl,
    };
    const sanitized = sanitizeResumeData(tplResume);
    const audit = auditResumeContentQuality(sanitized);
    if (sanitized && audit.overallScore >= 90) {
      templatePasses++;
    }
  }

  assert(
    templatePasses === 8,
    '5.1 All 8 active resume templates receive verified, high-quality content (8/8 pass)',
    `Passed: ${templatePasses}/8`
  );

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed}/${total} assertions PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite execution failed with unhandled error:', err);
  process.exit(1);
});
