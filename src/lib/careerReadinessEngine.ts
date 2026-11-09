/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.3: Career Readiness, Skill Gap & Roadmap Engine
 * Deterministic calculation of 5 separate career readiness dimensions, 4-state skill
 * gap analysis, actionable roadmap milestones, and grounded project defense questions.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  CareerReadinessIndicators,
  DimensionReadinessScore,
  RoleSkillGapAnalysis,
  ClassifiedSkillItem,
  ProjectSkillOpportunity,
  CareerRoadmap,
  CareerRoadmapMilestone,
  MilestoneCategory,
  MilestoneStatus,
  ProjectDefenseQuestion,
} from '../types/careerReadiness.ts';
import { PlacementStudentContext, ApplicationRecord } from '../types/placementIntelligence.ts';
import { ResumeData } from '../types/resume.ts';
import { InterviewSession } from '../types/interviewIntelligence.ts';
import { cleanFirestoreData } from './placementIntelligenceService.ts';

const ROADMAP_LOCAL_STORAGE_PREFIX = 'profile_career_roadmap_';

/**
 * Standard role requirement benchmarks for engineering students and freshers.
 */
export const ROLE_REQUIREMENT_BENCHMARKS: Record<
  string,
  {
    roleName: string;
    essential: { name: string; category: ClassifiedSkillItem['category'] }[];
    important: { name: string; category: ClassifiedSkillItem['category'] }[];
    optional: { name: string; category: ClassifiedSkillItem['category'] }[];
  }
> = {
  frontend: {
    roleName: 'Frontend Engineer',
    essential: [
      { name: 'JavaScript / TypeScript', category: 'programming-languages' },
      { name: 'React', category: 'frameworks-libraries' },
      { name: 'HTML5 & Responsive CSS', category: 'frameworks-libraries' },
      { name: 'Git & Version Control', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'State Management (Redux/Zustand)', category: 'frameworks-libraries' },
      { name: 'Tailwind CSS', category: 'frameworks-libraries' },
      { name: 'REST APIs & Fetching', category: 'tools-methodologies' },
      { name: 'Web Performance & Accessibility', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Next.js & SSR', category: 'frameworks-libraries' },
      { name: 'Testing (Jest/Vitest/Playwright)', category: 'tools-methodologies' },
      { name: 'GraphQL', category: 'databases-storage' },
      { name: 'CI/CD Deployment (Vercel/GitHub Actions)', category: 'cloud-devops' },
    ],
  },
  backend: {
    roleName: 'Backend Engineer',
    essential: [
      { name: 'Node.js / Express or Python / Java', category: 'programming-languages' },
      { name: 'SQL Databases (PostgreSQL / MySQL)', category: 'databases-storage' },
      { name: 'RESTful API Architecture', category: 'system-design' },
      { name: 'Git & Version Control', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'Data Structures & Algorithms', category: 'core-cs' },
      { name: 'Authentication & JWT Security', category: 'system-design' },
      { name: 'Redis / In-Memory Caching', category: 'databases-storage' },
      { name: 'Database Indexing & Query Optimization', category: 'databases-storage' },
    ],
    optional: [
      { name: 'Docker & Containerization', category: 'cloud-devops' },
      { name: 'Message Queues (Kafka / RabbitMQ)', category: 'system-design' },
      { name: 'Cloud Services (AWS / GCP)', category: 'cloud-devops' },
      { name: 'Automated Unit & Integration Testing', category: 'tools-methodologies' },
    ],
  },
  fullstack: {
    roleName: 'Full Stack Engineer',
    essential: [
      { name: 'JavaScript / TypeScript', category: 'programming-languages' },
      { name: 'Frontend Framework (React / Next.js)', category: 'frameworks-libraries' },
      { name: 'Backend Runtime (Node.js or Python)', category: 'frameworks-libraries' },
      { name: 'Relational or Document Database', category: 'databases-storage' },
      { name: 'Git & GitHub', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'RESTful API & Client Integration', category: 'system-design' },
      { name: 'State Management & Async Data Handling', category: 'frameworks-libraries' },
      { name: 'Authentication & Session Handling', category: 'system-design' },
      { name: 'Data Structures & Algorithms', category: 'core-cs' },
    ],
    optional: [
      { name: 'Docker & Containerization', category: 'cloud-devops' },
      { name: 'Cloud Deployment (AWS / GCP / Vercel)', category: 'cloud-devops' },
      { name: 'Redis Caching', category: 'databases-storage' },
      { name: 'Automated Testing (Unit & E2E)', category: 'tools-methodologies' },
    ],
  },
  ai: {
    roleName: 'AI / Machine Learning Engineer',
    essential: [
      { name: 'Python Programming', category: 'programming-languages' },
      { name: 'NumPy, Pandas & Data Analysis', category: 'frameworks-libraries' },
      { name: 'Machine Learning (Scikit-Learn)', category: 'frameworks-libraries' },
      { name: 'Linear Algebra & Probability', category: 'core-cs' },
    ],
    important: [
      { name: 'Deep Learning (PyTorch or TensorFlow)', category: 'frameworks-libraries' },
      { name: 'SQL & Data Querying', category: 'databases-storage' },
      { name: 'LLM APIs & Prompt Engineering', category: 'frameworks-libraries' },
      { name: 'Model Evaluation & Validation', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Vector Databases (Chroma / Pinecone)', category: 'databases-storage' },
      { name: 'Model Deployment (FastAPI / Docker)', category: 'cloud-devops' },
      { name: 'RAG Architecture & Embeddings', category: 'system-design' },
      { name: 'MLOps & Experiment Tracking', category: 'tools-methodologies' },
    ],
  },
  devops: {
    roleName: 'DevOps / Cloud Engineer',
    essential: [
      { name: 'Linux Administration & Shell Scripting', category: 'core-cs' },
      { name: 'Git & Branching Strategies', category: 'tools-methodologies' },
      { name: 'Docker & Containerization', category: 'cloud-devops' },
      { name: 'Networking Fundamentals (TCP/IP, DNS, SSL)', category: 'core-cs' },
    ],
    important: [
      { name: 'CI/CD Pipelines (GitHub Actions / Jenkins)', category: 'cloud-devops' },
      { name: 'Cloud Platform (AWS / GCP / Azure)', category: 'cloud-devops' },
      { name: 'Infrastructure as Code (Terraform)', category: 'cloud-devops' },
      { name: 'Monitoring & Logging (Prometheus / Grafana)', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Kubernetes Orchestration', category: 'cloud-devops' },
      { name: 'Ansible / Configuration Management', category: 'tools-methodologies' },
      { name: 'Cloud Security & IAM Best Practices', category: 'cloud-devops' },
    ],
  },
};

/**
 * Normalizes text for clean fuzzy token matching.
 */
function normalizeToken(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Resolves role benchmark from target role title.
 */
export function resolveRoleBenchmarkKey(targetRole: string): string {
  const normalized = targetRole.toLowerCase();
  if (normalized.includes('front')) return 'frontend';
  if (normalized.includes('back')) return 'backend';
  if (normalized.includes('ai') || normalized.includes('ml') || normalized.includes('machine learning') || normalized.includes('data sci')) return 'ai';
  if (normalized.includes('devops') || normalized.includes('cloud') || normalized.includes('infra')) return 'devops';
  return 'fullstack';
}

/**
 * 1. UNIFIED CAREER READINESS DASHBOARD CALCULATOR
 * Calculates 5 separate readiness dimensions without combining them into a misleading single probability.
 */
export function calculateCareerReadinessIndicators(
  studentContext: PlacementStudentContext,
  resumeData?: ResumeData | null,
  applications: ApplicationRecord[] = [],
  interviewSessions: InterviewSession[] = []
): CareerReadinessIndicators {
  const targetRole = studentContext.targetRole || 'Full Stack Engineer';
  const roleKey = resolveRoleBenchmarkKey(targetRole);
  const benchmark = ROLE_REQUIREMENT_BENCHMARKS[roleKey];

  // --- Dimension 1: Resume Readiness (0 - 100%) ---
  let sectionCompleteness = 0;
  const diagResumeNotes: string[] = [];

  if (resumeData) {
    if (resumeData.personalInfo?.fullName && resumeData.personalInfo?.email) sectionCompleteness += 5;
    if (resumeData.personalInfo?.phone && (resumeData.personalInfo?.linkedin || resumeData.personalInfo?.github)) sectionCompleteness += 5;
    if (resumeData.personalInfo?.summary && resumeData.personalInfo.summary.trim().length > 30) sectionCompleteness += 5;
    if (resumeData.education && resumeData.education.length > 0) sectionCompleteness += 5;
    if ((resumeData.projects && resumeData.projects.length > 0) || (resumeData.experience && resumeData.experience.length > 0)) sectionCompleteness += 5;
    if (resumeData.skills?.technical && resumeData.skills.technical.length >= 3) sectionCompleteness += 5;
  } else {
    diagResumeNotes.push('Resume document has not been initialized.');
  }

  // Quality assessment (metrics, formatting, no AI conversational leaks)
  let qualityPoints = 0;
  if (resumeData) {
    let hasMetric = false;
    let hasConversationalLeak = false;
    let hasUnresolvedPlaceholder = false;
    let totalBullets = 0;

    const allTexts = [
      resumeData.personalInfo?.summary || '',
      ...(resumeData.projects || []).flatMap((p) => [p.description || '', ...(p.bullets || [])]),
      ...(resumeData.experience || []).flatMap((e) => [e.description || '', ...(e.bullets || [])]),
    ];

    allTexts.forEach((text) => {
      if (/\b\d+(\.\d+)?(%|ms|s|x|k|m|gb|mb)\b/i.test(text)) hasMetric = true;
      if (/(as an ai|i cannot|here is|certainly|improved efficiency by x%)/i.test(text)) hasConversationalLeak = true;
      if (/\[[^\]]+\]/.test(text)) hasUnresolvedPlaceholder = true;
      if (text.length > 15) totalBullets++;
    });

    if (totalBullets >= 4) qualityPoints += 15;
    else if (totalBullets >= 2) qualityPoints += 10;
    else diagResumeNotes.push('Add more structured project bullets.');

    if (hasMetric) qualityPoints += 10;
    else diagResumeNotes.push('Include measurable impact metrics (e.g., latency, throughput, scale).');

    if (!hasConversationalLeak && !hasUnresolvedPlaceholder) qualityPoints += 10;
    else diagResumeNotes.push('Remove unresolved brackets and conversational text.');
  }

  // Keyword alignment & formatting integrity
  const approvedKeywords = studentContext.approvedAtsKeywords || [];
  const keywordPoints = Math.min(approvedKeywords.length * 4, 20);
  const formattingPoints = resumeData?.personalInfo?.email ? 15 : 5;

  const rawResumeScore = sectionCompleteness + qualityPoints + keywordPoints + formattingPoints;
  const resumeScore = Math.min(Math.max(rawResumeScore, 10), 100);

  const resumeReadiness: DimensionReadinessScore = {
    score: resumeScore,
    level: resumeScore >= 85 ? 'exceptional' : resumeScore >= 70 ? 'strong' : resumeScore >= 50 ? 'moderate' : 'low',
    title: 'Resume Readiness',
    summary:
      resumeScore >= 75
        ? 'Resume is complete, cleanly structured, and aligned with target role keywords.'
        : 'Resume has baseline sections but needs measurable impact metrics and approved keywords.',
    metricsBreakdown: {
      'Section Completeness': `${sectionCompleteness} / 30 pts`,
      'Content Quality': `${qualityPoints} / 35 pts`,
      'ATS Keyword Alignment': `${keywordPoints} / 20 pts`,
      'Formatting Integrity': `${formattingPoints} / 15 pts`,
    },
    diagnosticNotes: diagResumeNotes.length > 0 ? diagResumeNotes : ['Resume meets clean standards.'],
  };

  // --- Dimension 2: Technical Skill Readiness (0 - 100%) ---
  const verifiedSkillTokens = new Set((studentContext.technicalSkills || []).map(normalizeToken));
  const projectTechTokens = new Set(
    (studentContext.projects || []).flatMap((p) => p.techStack.map(normalizeToken))
  );

  let demonstratedCount = 0;
  let partiallyDemonstratedCount = 0;
  let missingCount = 0;
  const allExpected = [...benchmark.essential, ...benchmark.important];
  const diagSkillNotes: string[] = [];

  allExpected.forEach((item) => {
    const token = normalizeToken(item.name);
    const inVerified = verifiedSkillTokens.has(token) || Array.from(verifiedSkillTokens).some((v) => v.includes(token) || token.includes(v));
    const inProjects = projectTechTokens.has(token) || Array.from(projectTechTokens).some((p) => p.includes(token) || token.includes(p));

    if (inVerified && inProjects) {
      demonstratedCount++;
    } else if (inVerified || inProjects) {
      partiallyDemonstratedCount++;
    } else {
      missingCount++;
      if (benchmark.essential.some((e) => e.name === item.name)) {
        diagSkillNotes.push(`Core skill missing: ${item.name}`);
      }
    }
  });

  const totalExpectedSkills = Math.max(allExpected.length, 1);
  const skillPoints = (demonstratedCount * 1.0 + partiallyDemonstratedCount * 0.5) / totalExpectedSkills;
  const technicalSkillScore = Math.min(Math.max(Math.round(skillPoints * 100), 10), 100);

  const technicalSkillReadiness: DimensionReadinessScore = {
    score: technicalSkillScore,
    level: technicalSkillScore >= 80 ? 'exceptional' : technicalSkillScore >= 65 ? 'strong' : technicalSkillScore >= 45 ? 'moderate' : 'low',
    title: 'Technical Skill Readiness',
    summary: `${demonstratedCount} of ${totalExpectedSkills} benchmark skills demonstrated with project evidence.`,
    metricsBreakdown: {
      'Demonstrated (Verified + Projects)': demonstratedCount,
      'Partially Demonstrated': partiallyDemonstratedCount,
      'Missing Core Competencies': missingCount,
      'Total Benchmark Skills': totalExpectedSkills,
    },
    diagnosticNotes:
      diagSkillNotes.length > 0
        ? diagSkillNotes.slice(0, 4)
        : ['Demonstrates strong alignment with core role benchmark skills.'],
  };

  // --- Dimension 3: Project Explanation Readiness (0 - 100%) ---
  const projects = studentContext.projects || [];
  let projPoints = 0;
  const diagProjNotes: string[] = [];

  if (projects.length >= 2) projPoints += 30;
  else if (projects.length === 1) {
    projPoints += 15;
    diagProjNotes.push('Add a second substantive project to demonstrate breadth.');
  } else {
    diagProjNotes.push('No projects documented yet. Projects are critical for placement interviews.');
  }

  const projectsWithStack = projects.filter((p) => p.techStack && p.techStack.length >= 2).length;
  projPoints += Math.min(projectsWithStack * 15, 25);

  const projectsWithDescription = projects.filter((p) => p.description && p.description.trim().length >= 40).length;
  projPoints += Math.min(projectsWithDescription * 15, 25);

  let hasLinks = false;
  if (resumeData?.projects) {
    hasLinks = resumeData.projects.some((p) => p.repoUrl || p.liveUrl || p.link);
  }
  if (hasLinks) projPoints += 20;
  else diagProjNotes.push('Provide public GitHub repositories or live deployment URLs for verification.');

  const projectScore = Math.min(Math.max(projPoints, 5), 100);

  const projectExplanationReadiness: DimensionReadinessScore = {
    score: projectScore,
    level: projectScore >= 80 ? 'exceptional' : projectScore >= 65 ? 'strong' : projectScore >= 45 ? 'moderate' : 'low',
    title: 'Project Explanation Readiness',
    summary:
      projects.length > 0
        ? `${projects.length} project(s) documented with technical architecture and stack specifications.`
        : 'Projects need architectural depth, documented trade-offs, and live repository links.',
    metricsBreakdown: {
      'Documented Projects': projects.length,
      'With Defined Tech Stack': projectsWithStack,
      'Detailed Architectural Descriptions': projectsWithDescription,
      'Live Repository / Demo Links': hasLinks ? 'Available' : 'Missing',
    },
    diagnosticNotes: diagProjNotes.length > 0 ? diagProjNotes : ['Projects have solid architecture and clear descriptions.'],
  };

  // --- Dimension 4: Interview Readiness (0 - 100%) ---
  const completedSessions = interviewSessions.filter((s) => s.status === 'completed');
  let interviewScore = 0;
  const diagInterviewNotes: string[] = [];

  if (completedSessions.length === 0) {
    interviewScore = 15;
    diagInterviewNotes.push('No completed mock interview sessions recorded yet.');
    diagInterviewNotes.push('Take a 5-question diagnostic mock interview to establish your baseline.');
  } else {
    const scores = completedSessions
      .map((s) => s.performanceSummary?.overallScore)
      .filter((sc): sc is number => typeof sc === 'number');

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    const sessionVolumeBonus = Math.min(completedSessions.length * 5, 20);
    interviewScore = Math.min(Math.round(avgScore * 0.8 + sessionVolumeBonus), 100);

    if (completedSessions.length < 3) {
      diagInterviewNotes.push(`Completed ${completedSessions.length} session(s). Complete at least 3 for solid consistency.`);
    }
  }

  const interviewReadiness: DimensionReadinessScore = {
    score: interviewScore,
    level: interviewScore >= 80 ? 'exceptional' : interviewScore >= 65 ? 'strong' : interviewScore >= 45 ? 'moderate' : 'low',
    title: 'Interview Readiness',
    summary:
      completedSessions.length > 0
        ? `Completed ${completedSessions.length} genuine mock interview session(s) with an average score of ${interviewScore}%.`
        : 'Baseline diagnostic mock recommended to rehearse STAR responses and technical deep-dives.',
    metricsBreakdown: {
      'Completed Mock Sessions': completedSessions.length,
      'Average Evaluated Score': completedSessions.length > 0 ? `${interviewScore}%` : 'N/A',
      'Recent Session Status': completedSessions.length > 0 ? 'Active' : 'Not Started',
    },
    diagnosticNotes: diagInterviewNotes.length > 0 ? diagInterviewNotes : ['Regular practice schedule maintained.'],
  };

  // --- Dimension 5: Application Activity (0 - 100%) ---
  let appPoints = 0;
  const totalApps = applications.length;
  const activeApps = applications.filter((a) => ['preparing', 'applied', 'assessment', 'interview'].includes(a.status)).length;
  const interviewsScheduled = applications.filter((a) => a.status === 'interview' || Boolean(a.interviewDate)).length;
  const offersCount = applications.filter((a) => a.status === 'offer').length;

  appPoints += Math.min(totalApps * 7, 35);
  appPoints += Math.min(activeApps * 10, 35);
  appPoints += Math.min(interviewsScheduled * 15, 20);
  if (offersCount > 0) appPoints += 10;

  const appScore = Math.min(Math.max(appPoints, 10), 100);
  const diagAppNotes: string[] = [];
  if (totalApps === 0) diagAppNotes.push('No applications tracked yet. Use Job Discovery to discover verified openings.');
  else if (activeApps === 0) diagAppNotes.push('All applications are currently resolved. Apply to new openings to keep your pipeline warm.');

  const applicationActivity: DimensionReadinessScore = {
    score: appScore,
    level: appScore >= 80 ? 'exceptional' : appScore >= 60 ? 'strong' : appScore >= 40 ? 'moderate' : 'low',
    title: 'Application Activity',
    summary: `${activeApps} active application(s) in pipeline across ${totalApps} total opportunity record(s).`,
    metricsBreakdown: {
      'Total Tracked Applications': totalApps,
      'Active Pipeline (Preparing / Applied)': activeApps,
      'Interviews Scheduled': interviewsScheduled,
      'Offers Received': offersCount,
    },
    diagnosticNotes: diagAppNotes.length > 0 ? diagAppNotes : ['Consistent pipeline flow and proactive tracking.'],
  };

  return {
    targetRole,
    calculatedAt: new Date().toISOString(),
    disclaimer:
      'Readiness indicators are distinct diagnostic assessments across 5 separate career preparation dimensions. They are not combined into a single selection probability or placement guarantee.',
    resumeReadiness,
    technicalSkillReadiness,
    projectExplanationReadiness,
    interviewReadiness,
    applicationActivity,
  };
}

/**
 * 2. ROLE-BASED SKILL GAP ANALYSIS
 * Classifies skills into 4 states: demonstrated, partially_demonstrated, missing, unverified.
 * Connects missing skills to student's actual projects.
 */
export function analyzeRoleSkillGaps(
  targetRole: string,
  studentContext: PlacementStudentContext
): RoleSkillGapAnalysis {
  const roleKey = resolveRoleBenchmarkKey(targetRole);
  const benchmark = ROLE_REQUIREMENT_BENCHMARKS[roleKey];

  const verifiedTokens = new Set((studentContext.technicalSkills || []).map(normalizeToken));
  const projectTechTokens = new Set(
    (studentContext.projects || []).flatMap((p) => p.techStack.map(normalizeToken))
  );

  const classifiedSkills: ClassifiedSkillItem[] = [];
  let seqIndex = 1;

  const processTier = (
    skills: { name: string; category: ClassifiedSkillItem['category'] }[],
    importance: 'essential' | 'important' | 'optional'
  ) => {
    skills.forEach((item) => {
      const token = normalizeToken(item.name);
      const inVerified = verifiedTokens.has(token) || Array.from(verifiedTokens).some((v) => v.includes(token) || token.includes(v));
      const matchingProject = (studentContext.projects || []).find((p) =>
        p.techStack.some((t) => normalizeToken(t).includes(token) || token.includes(normalizeToken(t)))
      );

      let classification: ClassifiedSkillItem['classification'];
      let evidence: string | undefined;
      let connectedProject: string | undefined;
      let learningAction: string;

      if (inVerified && matchingProject) {
        classification = 'demonstrated';
        evidence = `Verified in profile & utilized in project "${matchingProject.title}"`;
        connectedProject = matchingProject.title;
        learningAction = `Review architectural trade-offs of ${item.name} for technical interview discussions.`;
      } else if (inVerified && !matchingProject) {
        classification = 'unverified';
        evidence = 'Listed in verified profile skills but lacks concrete project implementation evidence.';
        learningAction = `Build a hands-on feature or mini-project integrating ${item.name} to prove practical production capability.`;
      } else if (!inVerified && matchingProject) {
        classification = 'partially_demonstrated';
        evidence = `Found in project "${matchingProject.title}" stack, but not listed in core profile skills.`;
        connectedProject = matchingProject.title;
        learningAction = `Add ${item.name} to your verified resume skills and document specific accomplishments.`;
      } else {
        classification = 'missing';
        learningAction = `Study foundational concepts of ${item.name} and build a proof-of-concept module.`;
      }

      classifiedSkills.push({
        id: `skill_${token}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        category: item.category,
        importance,
        classification,
        evidence,
        connectedProject,
        recommendedSequenceIndex: seqIndex++,
        learningAction,
      });
    });
  };

  processTier(benchmark.essential, 'essential');
  processTier(benchmark.important, 'important');
  processTier(benchmark.optional, 'optional');

  const demonstratedCount = classifiedSkills.filter((s) => s.classification === 'demonstrated').length;
  const partiallyDemonstratedCount = classifiedSkills.filter((s) => s.classification === 'partially_demonstrated').length;
  const missingCount = classifiedSkills.filter((s) => s.classification === 'missing').length;
  const unverifiedCount = classifiedSkills.filter((s) => s.classification === 'unverified').length;

  // Practical learning sequence: Essential Missing -> Essential Partially -> Important Missing -> Optional
  const learningSequence = [...classifiedSkills].sort((a, b) => {
    const priorityWeight: Record<string, number> = {
      'essential-missing': 1,
      'essential-partially_demonstrated': 2,
      'essential-unverified': 3,
      'important-missing': 4,
      'important-partially_demonstrated': 5,
      'optional-missing': 6,
      'demonstrated': 7,
    };
    const keyA = a.classification === 'demonstrated' ? 'demonstrated' : `${a.importance}-${a.classification}`;
    const keyB = b.classification === 'demonstrated' ? 'demonstrated' : `${b.importance}-${b.classification}`;
    return (priorityWeight[keyA] || 99) - (priorityWeight[keyB] || 99);
  });

  // Connect missing skills to existing student projects
  const missingEssentialOrImportant = classifiedSkills
    .filter((s) => s.classification === 'missing' && s.importance !== 'optional')
    .map((s) => s.name);

  const projectOpportunities: ProjectSkillOpportunity[] = [];
  (studentContext.projects || []).slice(0, 3).forEach((proj) => {
    if (missingEssentialOrImportant.length > 0) {
      const skillsForProject = missingEssentialOrImportant.slice(0, 2);
      projectOpportunities.push({
        projectTitle: proj.title,
        skillsToAdd: skillsForProject,
        suggestedEnhancement: `Extend "${proj.title}" by implementing ${skillsForProject.join(' and ')} (e.g., adding integration tests, caching, or container deployment).`,
      });
    }
  });

  return {
    targetRole,
    classifiedSkills,
    demonstratedCount,
    partiallyDemonstratedCount,
    missingCount,
    unverifiedCount,
    learningSequence,
    projectOpportunities,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * 3. CAREER ROADMAP GENERATION & MANAGEMENT
 * Pre-populates actionable milestones across 7 categories.
 */
export function generateDefaultCareerRoadmap(
  targetRole: string,
  skillGapAnalysis?: RoleSkillGapAnalysis
): CareerRoadmapMilestone[] {
  const missingSkillNames = (skillGapAnalysis?.classifiedSkills || [])
    .filter((s) => s.classification === 'missing')
    .map((s) => s.name)
    .slice(0, 2);

  const primaryMissing = missingSkillNames[0] || 'Modern Backend Architecture';
  const secondaryMissing = missingSkillNames[1] || 'Database Optimization & Indexing';

  return [
    {
      id: 'ms_st_1',
      title: 'ATS Keyword & Resume Header Audit',
      description: `Align your resume summary and technical skills with standard ATS requirements for ${targetRole}.`,
      category: 'short_term',
      priority: 'high',
      estimatedDuration: '2 days',
      status: 'in_progress',
      completionCriteria: 'Pass ProFile resume review with 0 conversational leaks and full section completeness.',
      orderIndex: 1,
    },
    {
      id: 'ms_tech_1',
      title: `Master Core Competency: ${primaryMissing}`,
      description: `Complete practical exercises and build a working module implementing ${primaryMissing}.`,
      category: 'technical_skills',
      priority: 'high',
      estimatedDuration: '10 days',
      status: 'not_started',
      completionCriteria: `Demonstrate working code or API endpoint leveraging ${primaryMissing}.`,
      orderIndex: 2,
    },
    {
      id: 'ms_tech_2',
      title: `Secondary Competency Deep-Dive: ${secondaryMissing}`,
      description: `Study theory and implement real-world design patterns for ${secondaryMissing}.`,
      category: 'technical_skills',
      priority: 'medium',
      estimatedDuration: '1 week',
      status: 'not_started',
      completionCriteria: 'Write a comprehensive technical summary and test cases.',
      orderIndex: 3,
    },
    {
      id: 'ms_dsa_1',
      title: 'Core DSA Drill: Arrays, Two-Pointers & Hashing',
      description: 'Solve 20 high-frequency placement coding problems with optimal time and space complexity.',
      category: 'dsa_problem_solving',
      priority: 'high',
      estimatedDuration: '2 weeks',
      status: 'not_started',
      completionCriteria: 'Explain Big-O bounds and edge-case handling for each solution.',
      orderIndex: 4,
    },
    {
      id: 'ms_proj_1',
      title: 'Full-Stack Portfolio Project Upgrade',
      description: 'Enhance your flagship project with authentication, automated tests, and production containerization.',
      category: 'project_development',
      priority: 'high',
      estimatedDuration: '3 weeks',
      status: 'not_started',
      completionCriteria: 'Publish live demo URL and verified GitHub README with architectural diagram.',
      orderIndex: 5,
    },
    {
      id: 'ms_res_1',
      title: 'Bullet Point Metrics & Action Verbs Pass',
      description: 'Refactor all project and internship bullets using Action Verb + Task + Quantified Result format.',
      category: 'resume_improvement',
      priority: 'medium',
      estimatedDuration: '3 days',
      status: 'not_started',
      completionCriteria: 'Include at least 2 quantified metrics per featured project.',
      orderIndex: 6,
    },
    {
      id: 'ms_int_1',
      title: 'Complete 3 Diagnostic Mock Interviews',
      description: 'Rehearse technical fundamentals, behavioral STAR stories, and project defense drills.',
      category: 'interview_prep',
      priority: 'high',
      estimatedDuration: '1 week',
      status: 'not_started',
      completionCriteria: 'Achieve ≥ 75% average score on ProFile Interview Intelligence.',
      orderIndex: 7,
    },
    {
      id: 'ms_app_1',
      title: 'Submit 10 Targeted Verified Applications',
      description: 'Track applications on ProFile Kanban pipeline and schedule timely follow-up reminders.',
      category: 'application_targets',
      priority: 'medium',
      estimatedDuration: '2 weeks',
      status: 'not_started',
      completionCriteria: 'Log 10 applications with tailored resume versions and verified job links.',
      orderIndex: 8,
    },
  ];
}

/**
 * Saves career roadmap to Firestore and LocalStorage.
 */
export async function saveCareerRoadmap(
  userId: string | undefined,
  roadmap: CareerRoadmap
): Promise<void> {
  const key = `${ROADMAP_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(roadmap));
  } catch (err) {
    console.warn('[CareerRoadmap] LocalStorage save error:', err);
  }

  if (userId && db) {
    try {
      const cleaned = cleanFirestoreData(roadmap);
      const docRef = doc(db, 'users', userId, 'careerRoadmap', 'active');
      await setDoc(docRef, {
        ...cleaned,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[CareerRoadmap] Firestore save error (offline mode):', err);
    }
  }
}

/**
 * Loads career roadmap for the student, initializing default milestones if none exist.
 */
export async function loadCareerRoadmap(
  userId: string | undefined,
  targetRole: string,
  skillGapAnalysis?: RoleSkillGapAnalysis
): Promise<CareerRoadmap> {
  const key = `${ROADMAP_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localRoadmap: CareerRoadmap | null = null;

  try {
    const raw = localStorage.getItem(key);
    if (raw) localRoadmap = JSON.parse(raw);
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'careerRoadmap', 'active');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as CareerRoadmap;
      }
    } catch (err) {
      console.warn('[CareerRoadmap] Firestore load error, using local fallback:', err);
    }
  }

  if (localRoadmap && localRoadmap.milestones && localRoadmap.milestones.length > 0) {
    return localRoadmap;
  }

  // Generate fresh default roadmap
  const newRoadmap: CareerRoadmap = {
    id: `rm_${Date.now()}`,
    targetRole,
    milestones: generateDefaultCareerRoadmap(targetRole, skillGapAnalysis),
    updatedAt: new Date().toISOString(),
  };

  await saveCareerRoadmap(userId, newRoadmap);
  return newRoadmap;
}

/**
 * 6. PROJECT DEFENSE QUESTIONS GENERATOR
 * Generates structured questions strictly grounded in the student's actual projects.
 */
export function generateProjectDefenseQuestions(
  projectTitle: string,
  techStack: string[],
  description: string
): ProjectDefenseQuestion[] {
  const stackText = techStack.length > 0 ? techStack.join(', ') : 'the selected technologies';

  return [
    {
      id: 'pdq_problem',
      dimension: 'problem_statement',
      topicTitle: 'Problem Statement & Motivation',
      question: `What exact problem does "${projectTitle}" solve, who are its intended users, and what gap in existing tools motivated you to build it?`,
      whyAsked: 'Evaluates product thinking and understanding of user requirements.',
      evaluationCriteria: ['Clear definition of user pain point', 'Articulation of value proposition', 'Real-world context'],
      hints: ['State the user pain point clearly, avoid generic descriptions like "it is a web application".'],
    },
    {
      id: 'pdq_architecture',
      dimension: 'architecture_design',
      topicTitle: 'Architecture & Design Choices',
      question: `Walk me through the high-level architecture of "${projectTitle}". How do client requests flow through to data storage and back?`,
      whyAsked: 'Assesses architectural clarity and end-to-end engineering comprehension.',
      evaluationCriteria: ['Clear separation of concerns', 'Data flow explanation', 'Component modularity'],
      hints: ['Trace a single typical user request from the UI, through API controllers, to database operations and back.'],
    },
    {
      id: 'pdq_tech_rationale',
      dimension: 'technology_rationale',
      topicTitle: 'Technology Selection Rationale',
      question: `Why did you select ${stackText} for "${projectTitle}"? What alternatives did you consider and why did you rule them out?`,
      whyAsked: 'Determines whether technologies were chosen consciously or copied from a tutorial.',
      evaluationCriteria: ['Justification of technology benefits', 'Awareness of trade-offs', 'Honest evaluation of constraints'],
      hints: ['Discuss developer velocity, type safety, ecosystem support, or runtime efficiency.'],
    },
    {
      id: 'pdq_database_api',
      dimension: 'database_api',
      topicTitle: 'Database & API Decisions',
      question: `How did you model your data schema in "${projectTitle}"? What indexing or validation rules did you enforce?`,
      whyAsked: 'Tests data modeling rigor, normalization, and API security awareness.',
      evaluationCriteria: ['Schema structure explanation', 'Validation strategy', 'Relational vs document considerations'],
      hints: ['Mention primary keys, foreign relations, or validation middleware used.'],
    },
    {
      id: 'pdq_challenges',
      dimension: 'challenges_debugging',
      topicTitle: 'Implementation Challenges & Debugging',
      question: `Describe the most difficult technical roadblock, race condition, or bug you encountered while building "${projectTitle}", and explain how you systematically debugged it.`,
      whyAsked: 'Measures perseverance, troubleshooting methodology, and composure under pressure.',
      evaluationCriteria: ['Use of STAR structure', 'Description of debugging tools/logs used', 'Verification of root cause'],
      hints: ['Focus on the root cause and the systematic steps you took, not just "I searched StackOverflow".'],
    },
    {
      id: 'pdq_tradeoffs_future',
      dimension: 'future_improvements',
      topicTitle: 'Trade-offs, Limitations & Future Scale',
      question: `If 10,000 active users logged into "${projectTitle}" tomorrow, where would the system bottleneck first, and what architectural upgrades would you prioritize?`,
      whyAsked: 'Evaluates scalability vision, self-awareness of technical debt, and production readiness.',
      evaluationCriteria: ['Identification of realistic bottlenecks', 'Caching/indexing strategy', 'Prioritization of upgrades'],
      hints: ['Consider database connection pools, in-memory caching (Redis), asynchronous queues, or CDN asset distribution.'],
    },
  ];
}
