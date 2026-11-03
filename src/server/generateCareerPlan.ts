/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Career Roadmap & Intelligence Generator
 * Generates personalized 6-stage roadmaps, practical proposed projects,
 * and verified certification guidance without inventing false credentials.
 */

import { GoogleGenAI } from '@google/genai';
import {
  CareerPlanGenerationInput,
  RoadmapStage,
  RecommendedProject,
  RecommendedCertification,
} from '../types/careerIntelligence.ts';

export async function generateCareerRoadmapPlan(input: CareerPlanGenerationInput): Promise<{
  roadmapStages: RoadmapStage[];
  recommendedProjects: RecommendedProject[];
  recommendedCertifications: RecommendedCertification[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please ensure the Gemini API key is configured in Settings > Secrets.'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = `
You are the ProFile Senior Career Architect & Engineering Mentor for university students.
Generate an actionable, realistic, personalized 6-stage learning roadmap and project recommendations for this student.

### STUDENT PROFILE:
- Target Role: "${input.targetRole}"
- Application Purpose: "${input.purpose}"
- Academic Year: "${input.academicYear}" (Graduation: "${input.graduationYear}")
- Degree & Major: "${input.degree}" in "${input.major}" (${input.collegeOrUniversity || 'University'})
- Available Time: ~${input.hoursPerWeek || 10} hours/week
- Existing Technical Skills: ${input.existingSkills.technical.join(', ') || 'None provided'}
- Existing Tools: ${input.existingSkills.tools?.join(', ') || 'None provided'}
- Current Projects: ${input.projectsSummary.map((p) => `${p.title} (${p.techStack.join(', ')})`).join('; ') || 'None yet'}
- Coursework: ${input.coursework?.join(', ') || 'Standard undergraduate engineering'}
- Optional Job Description Context:
${input.jobDescriptionText ? `"""\n${input.jobDescriptionText.trim()}\n"""` : 'None. Evaluate based on standard tech industry hiring benchmarks for this role.'}

### STRICT REQUIREMENTS:
1. Divide the roadmap into EXACTLY the 6 mandatory stages:
   Stage 1: "Foundation" (core programming, logic, computer science basics)
   Stage 2: "Core Technical Skills" (languages, paradigms, algorithms)
   Stage 3: "Tools and Frameworks" (libraries, development environments, version control)
   Stage 4: "Practical Application" (integrations, APIs, databases, mini-builds)
   Stage 5: "Portfolio Development" (full-featured capstone project, deployment, documentation)
   Stage 6: "Interview Preparation" (DSA coding patterns, behavioral STAR stories, technical fundamentals)
2. In each stage, provide 2 to 3 practical tasks with realistic duration estimates (e.g. "1-2 weeks (est.)", "3-4 weeks (est.)"). Do NOT overwhelm the student.
3. Recommend 3 distinct proposed project ideas:
   - 1 Beginner/Foundational project
   - 1 Intermediate real-world web/system project
   - 1 Advanced role-specific capstone project
   Include milestones, required skills, and clear problem statements. Every project must be clearly marked as proposed.
4. Recommend 3 to 4 reputable certifications or learning courses from verified platforms (e.g., FreeCodeCamp, Coursera, Meta, AWS, Harvard CS50, DeepLearning.AI).
   Only state "free" or "paid" when accurate. Never invent false certification names.

### OUTPUT JSON SCHEMA:
Respond with ONLY valid JSON matching this exact structure:
{
  "roadmapStages": [
    {
      "id": "foundation",
      "title": "1. Foundation",
      "order": 1,
      "description": "...",
      "tasks": [
        {
          "id": "task_1_1",
          "stageId": "foundation",
          "title": "...",
          "objective": "...",
          "whyItMatters": "...",
          "suggestedTopics": ["..."],
          "practicalExercises": ["..."],
          "estimatedDuration": "1-2 weeks (est.)",
          "completionCriteria": "...",
          "suggestedResources": [
            { "title": "...", "url": "https://...", "type": "documentation", "isOfficial": true }
          ],
          "status": "not-started"
        }
      ]
    },
    {
      "id": "core-technical",
      "title": "2. Core Technical Skills",
      "order": 2,
      "description": "...",
      "tasks": [ ... ]
    },
    {
      "id": "tools-frameworks",
      "title": "3. Tools and Frameworks",
      "order": 3,
      "description": "...",
      "tasks": [ ... ]
    },
    {
      "id": "practical-application",
      "title": "4. Practical Application",
      "order": 4,
      "description": "...",
      "tasks": [ ... ]
    },
    {
      "id": "portfolio",
      "title": "5. Portfolio Development",
      "order": 5,
      "description": "...",
      "tasks": [ ... ]
    },
    {
      "id": "interview-prep",
      "title": "6. Interview Preparation",
      "order": 6,
      "description": "...",
      "tasks": [ ... ]
    }
  ],
  "recommendedProjects": [
    {
      "id": "proj_rec_1",
      "title": "...",
      "problemStatement": "...",
      "difficulty": "beginner",
      "requiredSkills": ["..."],
      "suggestedTechStack": ["..."],
      "mainFeatures": ["..."],
      "expectedLearningOutcomes": ["..."],
      "targetRoleRelevance": "...",
      "milestones": [
        { "id": "m1", "title": "...", "completed": false },
        { "id": "m2", "title": "...", "completed": false }
      ],
      "status": "proposed"
    }
  ],
  "recommendedCertifications": [
    {
      "id": "cert_rec_1",
      "name": "...",
      "issuer": "...",
      "relevantSkills": ["..."],
      "whyUseful": "...",
      "isFreeOrPaid": "free",
      "officialUrl": "https://...",
      "status": "recommended",
      "verifiedByUser": false
    }
  ]
}
`;

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text || '';
      if (text) {
        const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.roadmapStages && Array.isArray(parsed.roadmapStages)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(`[Career Plan] Model ${modelName} notice:`, error);
    }
  }

  // Grounded fallback generation if remote AI models experience temporary demand spikes
  return generateGroundedCareerPlanFallback(input);
}

function generateGroundedCareerPlanFallback(input: CareerPlanGenerationInput): {
  roadmapStages: RoadmapStage[];
  recommendedProjects: RecommendedProject[];
  recommendedCertifications: RecommendedCertification[];
} {
  const role = input.targetRole || 'Software Engineer';
  const knownTech = input.existingSkills?.technical || [];
  const primaryKnown = knownTech[0] || 'Core Programming Language';

  const stages: RoadmapStage[] = [
    {
      id: 'foundation',
      title: '1. Foundation',
      order: 1,
      description: 'Solidify algorithmic complexity, data structures, and computer science fundamentals.',
      tasks: [
        {
          id: 'task_f1',
          stageId: 'foundation',
          title: 'Algorithmic Thinking & Complexity Analysis',
          objective: 'Master Big-O time and space complexity across sorting, searching, and tree traversals.',
          whyItMatters: `Standard baseline for ${role} technical assessments and scalable system design.`,
          suggestedTopics: ['Big-O Analysis', 'Array & Hash Table manipulation', 'Recursion & Dynamic Programming basics'],
          practicalExercises: ['Solve 15 NeetCode/LeetCode core patterns', 'Analyze space-time trade-offs in writing'],
          estimatedDuration: '2-3 weeks (est.)',
          completionCriteria: 'Confidently explain Big-O trade-offs for array, linked list, and hash map operations.',
          suggestedResources: [
            { title: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', type: 'practice-problems', isOfficial: true },
            { title: 'Visualgo Algorithm Visualizations', url: 'https://visualgo.net', type: 'tutorial' }
          ],
          status: 'not-started',
        },
        {
          id: 'task_f2',
          stageId: 'foundation',
          title: 'Clean Code, Version Control & Git Workflows',
          objective: 'Establish professional Git conventions, branching models, and clean commit hygiene.',
          whyItMatters: 'Essential for collaborating in modern engineering teams.',
          suggestedTopics: ['Feature branching', 'Semantic commit messages', 'Rebasing vs merging'],
          practicalExercises: ['Configure SSH keys and GPG signing', 'Manage a multi-branch repository with PR reviews'],
          estimatedDuration: '1 week (est.)',
          completionCriteria: 'Maintain a clean Git repository with meaningful commit messages and branch protection.',
          suggestedResources: [
            { title: 'Official Git Documentation', url: 'https://git-scm.com/doc', type: 'documentation', isOfficial: true }
          ],
          status: 'not-started',
        },
      ],
    },
    {
      id: 'core-technical',
      title: '2. Core Technical Skills',
      order: 2,
      description: `Target essential competencies and deep language concepts for ${role}.`,
      tasks: [
        {
          id: 'task_c1',
          stageId: 'core-technical',
          title: `Advanced ${primaryKnown} & Concurrency Fundamentals`,
          objective: `Gain practical fluency in ${primaryKnown} deep mechanics, memory/runtime models, and asynchronous design.`,
          whyItMatters: `Identified as a critical competency for solidifying the ${role} foundation.`,
          suggestedTopics: ['Async execution & promises', 'Error boundary strategies', 'Modular code architecture'],
          practicalExercises: [`Build a standalone sandbox module demonstrating ${primaryKnown}`],
          estimatedDuration: '2-3 weeks (est.)',
          completionCriteria: `Write idiomatically correct code utilizing ${primaryKnown} without tutorial walkthroughs.`,
          suggestedResources: [
            { title: 'MDN Web Docs / Official Manual', url: 'https://developer.mozilla.org', type: 'documentation', isOfficial: true }
          ],
          status: 'not-started',
        },
        {
          id: 'task_c2',
          stageId: 'core-technical',
          title: 'Relational & Document Database Mastery',
          objective: 'Design normalized relational schemas and understand query optimization.',
          whyItMatters: 'Backend data persistence is core to nearly all software engineering roles.',
          suggestedTopics: ['SQL indexing', 'ACID transactions', 'ORM vs raw queries'],
          practicalExercises: ['Design a schema for an e-commerce or booking platform with composite indices'],
          estimatedDuration: '2 weeks (est.)',
          completionCriteria: 'Explain index mechanics and write multi-table JOINs and aggregation queries.',
          suggestedResources: [
            { title: 'Use The Index, Luke (SQL Indexing Guide)', url: 'https://use-the-index-luke.com', type: 'tutorial' }
          ],
          status: 'not-started',
        },
      ],
    },
    {
      id: 'tools-frameworks',
      title: '3. Tools & Frameworks',
      order: 3,
      description: `Integrate industry-standard frameworks and development pipelines.`,
      tasks: [
        {
          id: 'task_t1',
          stageId: 'tools-frameworks',
          title: `Modern Framework Architecture & State Flow`,
          objective: 'Understand component lifecycles, state synchronization, and modular design.',
          whyItMatters: `Standard industry expectation for entry-level and junior ${role} positions.`,
          suggestedTopics: ['Component architecture', 'Context & reactive state', 'REST/GraphQL client integration'],
          practicalExercises: ['Build a reactive dashboard fetching paginated API data'],
          estimatedDuration: '2-3 weeks (est.)',
          completionCriteria: 'Deploy a clean, responsive web application consuming external REST APIs.',
          suggestedResources: [
            { title: 'React Official Documentation', url: 'https://react.dev', type: 'documentation', isOfficial: true },
            { title: 'Developer Roadmaps', url: 'https://roadmap.sh', type: 'course' }
          ],
          status: 'not-started',
        },
      ],
    },
    {
      id: 'practical-application',
      title: '4. Practical Application',
      order: 4,
      description: 'Build real-world systems with authentication, validation, and containerization.',
      tasks: [
        {
          id: 'task_p1',
          stageId: 'practical-application',
          title: 'Dockerization & Environment Standardization',
          objective: 'Containerize multi-tier applications with multi-stage Dockerfiles and docker-compose.',
          whyItMatters: 'Demonstrates modern DevOps fluency on your resume.',
          suggestedTopics: ['Multi-stage builds', 'Docker compose networks', 'Volume persistence'],
          practicalExercises: ['Containerize a backend API and database with one-command launch'],
          estimatedDuration: '1-2 weeks (est.)',
          completionCriteria: 'Verify containers run predictably across fresh environments.',
          suggestedResources: [
            { title: 'Docker Official Get Started Guide', url: 'https://docs.docker.com/get-started', type: 'documentation', isOfficial: true }
          ],
          status: 'not-started',
        },
      ],
    },
    {
      id: 'portfolio',
      title: '5. Portfolio Development',
      order: 5,
      description: 'Document and publish demonstrable software with live deployments and clear READMEs.',
      tasks: [
        {
          id: 'task_port1',
          stageId: 'portfolio',
          title: 'Architecture Documentation & Live Demo Deployment',
          objective: 'Deploy projects to cloud hosting (Vercel, Render, or GCP) with automated CI/CD.',
          whyItMatters: 'Recruiters and hiring managers inspect deployed projects before granting interviews.',
          suggestedTopics: ['System architecture diagrams', 'README writing', 'Automated GitHub Actions CI'],
          practicalExercises: ['Set up GitHub Actions to run tests on pull requests', 'Deploy live demo link'],
          estimatedDuration: '1-2 weeks (est.)',
          completionCriteria: 'Include live URL and architecture diagram in the GitHub repository README.',
          suggestedResources: [
            { title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', type: 'documentation', isOfficial: true }
          ],
          status: 'not-started',
        },
      ],
    },
    {
      id: 'interview-prep',
      title: '6. Interview Preparation',
      order: 6,
      description: 'Refine technical communication, STAR-method storytelling, and live coding speed.',
      tasks: [
        {
          id: 'task_int1',
          stageId: 'interview-prep',
          title: 'Technical Behavioral & System Walkthroughs',
          objective: 'Articulate engineering decisions, trade-offs, and debugging sessions using STAR methodology.',
          whyItMatters: 'Differentiates junior engineers who can communicate clearly under interview pressure.',
          suggestedTopics: ['STAR technique', 'Deep-dive into project trade-offs', 'Post-mortem discussions'],
          practicalExercises: ['Record a 5-minute video walkthrough explaining a difficult bug you solved'],
          estimatedDuration: '2 weeks (est.)',
          completionCriteria: 'Concisely summarize project technical decisions in under 3 minutes.',
          status: 'not-started',
        },
      ],
    },
  ];

  const projects: RecommendedProject[] = [
    {
      id: 'proj_rec_beginner',
      title: `${role} Utility CLI & Data Pipeline`,
      problemStatement: `Entry-level project to demonstrate mastery of language idioms, file I/O, error handling, and unit testing for ${role}.`,
      difficulty: 'beginner',
      requiredSkills: [primaryKnown, 'Git', 'Unit Testing'],
      suggestedTechStack: [primaryKnown, 'Jest/PyTest', 'GitHub Actions'],
      mainFeatures: [
        'Command-line argument parsing and configuration validation',
        'Data transformation engine with schema validation',
        'Comprehensive automated test coverage (>85%)',
      ],
      expectedLearningOutcomes: [
        'Deep understanding of language standard library',
        'Strict error boundary and input validation patterns',
        'Automated CI execution via GitHub Actions',
      ],
      targetRoleRelevance: `Direct evidence of code quality and discipline for ${role} hiring managers.`,
      milestones: [
        { id: 'm1', title: 'Initialize project structure with ESLint/Prettier & CI pipeline', completed: false },
        { id: 'm2', title: 'Implement core transformation logic with 100% test coverage', completed: false },
        { id: 'm3', title: 'Publish CLI package or standalone binary with README documentation', completed: false },
      ],
      status: 'proposed',
    },
    {
      id: 'proj_rec_intermediate',
      title: `Collaborative Micro-SaaS Platform`,
      problemStatement: `Build a full-stack platform addressing authenticated multi-tenant data access and API design for ${role}.`,
      difficulty: 'intermediate',
      requiredSkills: [primaryKnown, 'RESTful APIs', 'Database Design', 'Authentication'],
      suggestedTechStack: [primaryKnown, 'Node.js/Express', 'PostgreSQL/Firestore', 'Tailwind CSS'],
      mainFeatures: [
        'Secure JWT or session-based user authentication',
        'Role-based authorization and resource ownership protection',
        'Optimistic UI updates and responsive mobile-first interface',
      ],
      expectedLearningOutcomes: [
        `Hands-on production evidence for ${role}`,
        'Understanding auth flows, tokens, and database foreign keys',
        'API error code standardization and toast alerts',
      ],
      targetRoleRelevance: `Demonstrates full-lifecycle software delivery aligned with ${role} requirements.`,
      milestones: [
        { id: 'm1', title: 'Design database schema and seed mock records', completed: false },
        { id: 'm2', title: 'Implement backend API routes with validation middleware', completed: false },
        { id: 'm3', title: 'Connect front-end client and deploy live demo on cloud provider', completed: false },
      ],
      status: 'proposed',
    },
    {
      id: 'proj_rec_advanced',
      title: `Event-Driven High-Throughput Analytics Dashboard`,
      problemStatement: `Advanced capstone project demonstrating distributed queuing, caching, and real-time visualization for high-scale applications.`,
      difficulty: 'advanced',
      requiredSkills: ['System Design', 'Redis / Caching', 'WebSockets / Async Queues', 'Docker'],
      suggestedTechStack: ['TypeScript', 'Redis', 'Docker', 'PostgreSQL', 'Chart.js / Tailwind'],
      mainFeatures: [
        'Asynchronous job queue processing background tasks',
        'Redis cache layer with TTL invalidation policies',
        'Real-time metrics stream rendering dynamic charts',
      ],
      expectedLearningOutcomes: [
        'Architectural understanding of cache stampede prevention and queue workers',
        'Docker containerization with multi-container docker-compose',
        'Measuring latency improvements using benchmark tools',
      ],
      targetRoleRelevance: `Distinguishes candidate from generic bootcamp applicants by showcasing systems thinking.`,
      milestones: [
        { id: 'm1', title: 'Architect event-driven pipeline and benchmark baseline latency', completed: false },
        { id: 'm2', title: 'Containerize with Docker Compose and write stress tests', completed: false },
        { id: 'm3', title: 'Write an engineering blog post / technical README on architecture trade-offs', completed: false },
      ],
      status: 'proposed',
    },
  ];

  const certs: RecommendedCertification[] = [
    {
      id: 'cert_rec_1',
      name: 'freeCodeCamp Full Stack Certification',
      issuer: 'freeCodeCamp',
      relevantSkills: ['JavaScript', 'React', 'Node.js', 'Databases'],
      whyUseful: 'Rigorous 300-hour hands-on curriculum with 5 verified portfolio projects.',
      isFreeOrPaid: 'free',
      officialUrl: 'https://www.freecodecamp.org/learn',
      status: 'recommended',
      verifiedByUser: false,
    },
    {
      id: 'cert_rec_2',
      name: 'AWS Certified Cloud Practitioner or Solutions Architect Associate',
      issuer: 'Amazon Web Services (AWS)',
      relevantSkills: ['Cloud Infrastructure', 'EC2', 'S3', 'IAM Security'],
      whyUseful: 'Widely recognized industry certification demonstrating foundational cloud architecture knowledge.',
      isFreeOrPaid: 'paid',
      officialUrl: 'https://aws.amazon.com/certification/',
      status: 'recommended',
      verifiedByUser: false,
    },
    {
      id: 'cert_rec_3',
      name: 'Meta Front-End or Back-End Developer Professional Certificate',
      issuer: 'Coursera / Meta',
      relevantSkills: ['Version Control', 'APIs', 'Modern Frameworks', 'Testing'],
      whyUseful: 'Structured university-level industry curriculum with capstone project review.',
      isFreeOrPaid: 'paid',
      officialUrl: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
      status: 'recommended',
      verifiedByUser: false,
    },
  ];

  return {
    roadmapStages: stages,
    recommendedProjects: projects,
    recommendedCertifications: certs,
  };
}
