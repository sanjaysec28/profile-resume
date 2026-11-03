/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Deterministic Career Readiness & Skill Gap Analyzer
 * Rigorously checks student profile evidence against target role competencies
 * without hallucinating progress or fabricating achievements.
 */

import { ResumeData } from '../types/resume.ts';
import { StudentProfile } from '../types/profile.ts';
import {
  SkillGapItem,
  SkillStatus,
  SkillImportance,
  SkillCategory,
  CareerReadinessEvaluation,
} from '../types/careerIntelligence.ts';

// Common role competency profiles for engineering students & freshers
const ROLE_BENCHMARKS: Record<
  string,
  {
    essential: { name: string; category: SkillCategory }[];
    important: { name: string; category: SkillCategory }[];
    optional: { name: string; category: SkillCategory }[];
  }
> = {
  'frontend': {
    essential: [
      { name: 'JavaScript / TypeScript', category: 'programming-languages' },
      { name: 'React', category: 'frameworks-libraries' },
      { name: 'HTML5 & Responsive CSS', category: 'frameworks-libraries' },
      { name: 'Git & GitHub', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'State Management (Redux/Zustand)', category: 'frameworks-libraries' },
      { name: 'Tailwind CSS', category: 'frameworks-libraries' },
      { name: 'REST APIs & Fetching', category: 'tools-methodologies' },
      { name: 'Web Performance & Core Web Vitals', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Next.js', category: 'frameworks-libraries' },
      { name: 'TypeScript Advanced Types', category: 'programming-languages' },
      { name: 'Testing (Jest/Playwright)', category: 'tools-methodologies' },
      { name: 'GraphQL', category: 'databases-storage' },
    ],
  },
  'backend': {
    essential: [
      { name: 'Node.js / Express or Python / Django', category: 'frameworks-libraries' },
      { name: 'SQL Databases (PostgreSQL/MySQL)', category: 'databases-storage' },
      { name: 'RESTful API Architecture', category: 'system-design' },
      { name: 'Git & Version Control', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'Data Structures & Algorithms', category: 'core-cs' },
      { name: 'Authentication & JWT Security', category: 'system-design' },
      { name: 'NoSQL / Redis Caching', category: 'databases-storage' },
      { name: 'Database Indexing & Query Tuning', category: 'databases-storage' },
    ],
    optional: [
      { name: 'Docker & Containerization', category: 'cloud-devops' },
      { name: 'Microservices & Message Queues', category: 'system-design' },
      { name: 'CI/CD Pipelines', category: 'cloud-devops' },
      { name: 'Cloud Services (AWS/GCP)', category: 'cloud-devops' },
    ],
  },
  'full stack': {
    essential: [
      { name: 'JavaScript / TypeScript', category: 'programming-languages' },
      { name: 'Frontend Framework (React/Next.js)', category: 'frameworks-libraries' },
      { name: 'Backend Runtime (Node.js/Express or Python)', category: 'frameworks-libraries' },
      { name: 'Relational or Document Database', category: 'databases-storage' },
      { name: 'Git & GitHub', category: 'tools-methodologies' },
    ],
    important: [
      { name: 'REST API & Client-Server Integration', category: 'system-design' },
      { name: 'State Management & Async Data', category: 'frameworks-libraries' },
      { name: 'Authentication & Session Handling', category: 'system-design' },
      { name: 'Data Structures & Algorithms', category: 'core-cs' },
    ],
    optional: [
      { name: 'Docker & Containers', category: 'cloud-devops' },
      { name: 'Cloud Deployment & Hosting', category: 'cloud-devops' },
      { name: 'Automated Testing', category: 'tools-methodologies' },
      { name: 'Redis / In-Memory Caching', category: 'databases-storage' },
    ],
  },
  'ai': {
    essential: [
      { name: 'Python Programming', category: 'programming-languages' },
      { name: 'NumPy, Pandas & Data Analysis', category: 'frameworks-libraries' },
      { name: 'Machine Learning Fundamentals (Scikit-Learn)', category: 'frameworks-libraries' },
      { name: 'Mathematics (Linear Algebra & Probability)', category: 'core-cs' },
    ],
    important: [
      { name: 'Deep Learning (PyTorch or TensorFlow)', category: 'frameworks-libraries' },
      { name: 'Data Preprocessing & Feature Engineering', category: 'tools-methodologies' },
      { name: 'SQL & Data Querying', category: 'databases-storage' },
      { name: 'LLM Prompt Engineering & GenAI APIs', category: 'frameworks-libraries' },
    ],
    optional: [
      { name: 'Model Serving & FastAPI', category: 'system-design' },
      { name: 'Vector Databases (Chroma/Pinecone)', category: 'databases-storage' },
      { name: 'Docker & Cloud ML (Vertex/SageMaker)', category: 'cloud-devops' },
      { name: 'Fine-tuning & RAG Architecture', category: 'system-design' },
    ],
  },
  'data': {
    essential: [
      { name: 'Python / R Programming', category: 'programming-languages' },
      { name: 'SQL & Relational Databases', category: 'databases-storage' },
      { name: 'Data Visualization (PowerBI / Tableau / Matplotlib)', category: 'tools-methodologies' },
      { name: 'Statistical Analysis & Probability', category: 'core-cs' },
    ],
    important: [
      { name: 'Pandas & Data Wrangling', category: 'frameworks-libraries' },
      { name: 'ETL Pipelines & Data Warehousing', category: 'databases-storage' },
      { name: 'Excel Advanced Modeling', category: 'tools-methodologies' },
      { name: 'Git & Reproducible Notebooks', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Big Data (Spark / Hadoop)', category: 'databases-storage' },
      { name: 'Cloud Data Lakes (BigQuery / Snowflake)', category: 'cloud-devops' },
      { name: 'Machine Learning Models', category: 'frameworks-libraries' },
    ],
  },
  'devops': {
    essential: [
      { name: 'Linux System Administration & Shell Scripting', category: 'core-cs' },
      { name: 'Git & Branching Strategies', category: 'tools-methodologies' },
      { name: 'Docker & Containerization', category: 'cloud-devops' },
      { name: 'Networking Fundamentals (TCP/IP, DNS, SSL)', category: 'core-cs' },
    ],
    important: [
      { name: 'CI/CD Pipelines (GitHub Actions / Jenkins)', category: 'cloud-devops' },
      { name: 'Cloud Platform (AWS / GCP / Azure)', category: 'cloud-devops' },
      { name: 'Infrastructure as Code (Terraform)', category: 'cloud-devops' },
      { name: 'Monitoring & Logging (Prometheus/Grafana)', category: 'tools-methodologies' },
    ],
    optional: [
      { name: 'Kubernetes Orchestration', category: 'cloud-devops' },
      { name: 'Ansible Configuration Management', category: 'tools-methodologies' },
      { name: 'Security & Secret Management', category: 'cloud-devops' },
    ],
  },
};

/**
 * Normalizes text for fuzzy skill checking.
 */
function clean(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Searches resume projects and experience for concrete evidence of a skill.
 */
function findSkillEvidence(skillName: string, resumeData: ResumeData): string | undefined {
  const target = clean(skillName);

  // 1. Check projects techStack
  for (const p of resumeData.projects || []) {
    const matchedStack = (p.techStack || []).find((t) => clean(t).includes(target) || target.includes(clean(t)));
    if (matchedStack) {
      return `Used in project "${p.title}" (${p.techStack.join(', ')})`;
    }

    const descClean = clean(p.description || '');
    if (descClean.includes(target)) {
      return `Demonstrated in project "${p.title}": "${p.description.slice(0, 70)}..."`;
    }

    for (const b of p.bullets || []) {
      if (clean(b).includes(target)) {
        return `Applied in project "${p.title}": "${b.slice(0, 70)}..."`;
      }
    }
  }

  // 2. Check experience
  for (const exp of resumeData.experience || []) {
    const descClean = clean(exp.description || '');
    if (descClean.includes(target)) {
      return `Demonstrated during role at "${exp.company}"`;
    }
    for (const b of exp.bullets || []) {
      if (clean(b).includes(target)) {
        return `Applied at "${exp.company}": "${b.slice(0, 70)}..."`;
      }
    }
  }

  return undefined;
}

/**
 * Computes deterministic skill gap analysis and career readiness scores.
 */
export function analyzeCareerReadiness(
  targetRole: string,
  resumeData: ResumeData,
  profile?: StudentProfile,
  existingLearningSkills: string[] = []
): { skillGaps: SkillGapItem[]; readiness: CareerReadinessEvaluation } {
  const roleKey = Object.keys(ROLE_BENCHMARKS).find((k) =>
    targetRole.toLowerCase().includes(k)
  ) || 'full stack';

  const benchmark = ROLE_BENCHMARKS[roleKey];

  const studentTechSkills = new Set(
    (resumeData.skills?.technical || []).map((s) => clean(s))
  );
  const studentTools = new Set(
    (resumeData.skills?.tools || []).map((s) => clean(s))
  );
  const learningSet = new Set(existingLearningSkills.map((s) => clean(s)));

  const skillGaps: SkillGapItem[] = [];

  let essentialTotal = 0;
  let essentialDemonstrated = 0;
  let importantTotal = 0;
  let importantDemonstrated = 0;
  let countDemonstrated = 0;
  let countReported = 0;
  let countLearning = 0;
  let countMissing = 0;

  const strengths: string[] = [];
  const missingCompetencies: string[] = [];
  const partiallyDemonstrated: string[] = [];
  const skillsRequiringProjectEvidence: string[] = [];
  const priorityImprovements: string[] = [];

  const processCategory = (
    skills: { name: string; category: SkillCategory }[],
    importance: SkillImportance
  ) => {
    for (const item of skills) {
      const target = clean(item.name);
      if (importance === 'essential') essentialTotal++;
      if (importance === 'important') importantTotal++;

      const evidence = findSkillEvidence(item.name, resumeData);
      const isReported =
        studentTechSkills.has(target) ||
        studentTools.has(target) ||
        Array.from(studentTechSkills).some((s) => s.includes(target) || target.includes(s)) ||
        Array.from(studentTools).some((s) => s.includes(target) || target.includes(s));

      const isLearning = learningSet.has(target);

      let status: SkillStatus;
      let nextAction: string;

      if (evidence) {
        status = 'demonstrated';
        countDemonstrated++;
        if (importance === 'essential') essentialDemonstrated++;
        if (importance === 'important') importantDemonstrated++;
        strengths.push(`${item.name} (${evidence})`);
        nextAction = 'Maintain mastery and leverage in system design discussions.';
      } else if (isLearning) {
        status = 'learning';
        countLearning++;
        partiallyDemonstrated.push(`${item.name} (In Progress)`);
        nextAction = 'Complete current tutorial modules and build a hands-on proof-of-concept.';
      } else if (isReported) {
        status = 'student-reported';
        countReported++;
        skillsRequiringProjectEvidence.push(item.name);
        nextAction = `Build a portfolio project demonstrating practical production use of ${item.name}.`;
      } else {
        status = 'missing';
        countMissing++;
        if (importance === 'essential') {
          missingCompetencies.push(`${item.name} (Essential)`);
          priorityImprovements.push(`Learn foundational ${item.name} to meet core role criteria.`);
        } else {
          missingCompetencies.push(`${item.name} (${importance})`);
        }
        nextAction = `Start with fundamentals of ${item.name} and complete hands-on exercises.`;
      }

      skillGaps.push({
        id: `gap_${target}_${Date.now()}`,
        name: item.name,
        category: item.category,
        importance,
        status,
        evidence,
        recommendedNextAction: nextAction,
      });
    }
  };

  processCategory(benchmark.essential, 'essential');
  processCategory(benchmark.important, 'important');
  processCategory(benchmark.optional, 'optional');

  // Also include student's additional skills not in benchmark
  for (const userSkill of resumeData.skills?.technical || []) {
    const c = clean(userSkill);
    const inGaps = skillGaps.some((g) => clean(g.name) === c || c.includes(clean(g.name)));
    if (!inGaps) {
      const evidence = findSkillEvidence(userSkill, resumeData);
      skillGaps.push({
        id: `user_skill_${c}`,
        name: userSkill,
        category: 'frameworks-libraries',
        importance: 'important',
        status: evidence ? 'demonstrated' : 'student-reported',
        evidence,
        recommendedNextAction: evidence
          ? 'Highlight quantified impact in resume project bullets.'
          : 'Create a standalone demo repo showcasing this competency.',
      });
      if (evidence) countDemonstrated++;
      else countReported++;
    }
  }

  // 1. Technical Coverage Score: Essential (65%) + Important (35%)
  const essentialRatio = essentialTotal > 0 ? essentialDemonstrated / essentialTotal : 0.5;
  const importantRatio = importantTotal > 0 ? importantDemonstrated / importantTotal : 0.5;
  const technicalCoverageScore = Math.round((essentialRatio * 65 + importantRatio * 35) * 100) / 100;

  // 2. Project Evidence Score based on projects length and technical depth
  const projectCount = (resumeData.projects || []).length;
  const projectEvidenceScore = Math.min(100, Math.round(projectCount * 30 + (countDemonstrated > 2 ? 40 : 15)));

  // 3. Coursework Score
  const courseworkCount = (resumeData.coursework || []).length;
  const courseworkScore = Math.min(100, courseworkCount > 0 ? 80 + courseworkCount * 5 : 60);

  // Overall Readiness Score (Strictly deterministic formula)
  const overallReadinessScore = Math.round(
    technicalCoverageScore * 0.5 + projectEvidenceScore * 0.3 + courseworkScore * 0.2
  );

  let readinessLabel = 'Early Foundation';
  if (overallReadinessScore >= 80) readinessLabel = 'Role Competitive';
  else if (overallReadinessScore >= 65) readinessLabel = 'Developing Competency';
  else if (overallReadinessScore >= 45) readinessLabel = 'Emerging Foundation';

  const readiness: CareerReadinessEvaluation = {
    overallReadinessScore,
    technicalCoverageScore: Math.round(technicalCoverageScore),
    projectEvidenceScore,
    courseworkScore,
    readinessLabel,
    strengths: strengths.slice(0, 5),
    missingCompetencies: missingCompetencies.slice(0, 6),
    partiallyDemonstrated: partiallyDemonstrated.slice(0, 4),
    skillsRequiringProjectEvidence: skillsRequiringProjectEvidence.slice(0, 4),
    priorityImprovements: priorityImprovements.slice(0, 3),
    counts: {
      demonstrated: countDemonstrated,
      reported: countReported,
      learning: countLearning,
      missing: countMissing,
    },
  };

  return { skillGaps, readiness };
}
