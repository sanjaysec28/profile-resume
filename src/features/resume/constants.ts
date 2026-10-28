/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData, ResumeTemplateId } from '../../types/resume.ts';

export interface TemplateDefinition {
  id: ResumeTemplateId;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  recommendedFor: string;
  atsScore: string;
  category: 'ats-first' | 'visual-first';
}

export type ResumeTemplateInfo = TemplateDefinition;

export const RESUME_TEMPLATES_CATALOG: TemplateDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Clean & Balanced',
    description: 'Clean typography, strong section hierarchy, subtle dividers, and balanced whitespace.',
    badge: 'Popular',
    recommendedFor: 'Engineering, Tech & Product roles',
    atsScore: '96%',
    category: 'ats-first',
  },
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Traditional Professional',
    description: 'Traditional professional layout, conservative typography, clear headings, and ATS-friendly formatting.',
    badge: 'ATS 99%',
    recommendedFor: 'Finance, Consulting & Corporate',
    atsScore: '99%',
    category: 'ats-first',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Pure & Uncluttered',
    description: 'Minimal decoration, generous whitespace, restrained typography, and a simple single-column layout.',
    badge: 'Clean',
    recommendedFor: 'Software Internships & Research',
    atsScore: '98%',
    category: 'ats-first',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Structured Business',
    description: 'Structured business layout, clear contact details, prominent experience and education, disciplined spacing.',
    badge: 'Standard',
    recommendedFor: 'Business Development & Analyst Roles',
    atsScore: '95%',
    category: 'ats-first',
  },
  {
    id: 'creative',
    name: 'Creative',
    tagline: 'Design & Visual Accents',
    description: 'Distinctive typography and restrained visual accents while keeping all resume content readable and organized.',
    badge: 'Visual First',
    recommendedFor: 'UI/UX, Frontend & Creative Tech',
    atsScore: '88%',
    category: 'visual-first',
  },
  {
    id: 'technical',
    name: 'Technical',
    tagline: 'Code & Systems Focus',
    description: 'Optimized for software engineering, AI/ML, and IT roles, emphasizing skills, projects, tools, and repos.',
    badge: 'Dev Choice',
    recommendedFor: 'Software Engineers & Data Scientists',
    atsScore: '97%',
    category: 'ats-first',
  },
  {
    id: 'academic',
    name: 'Academic',
    tagline: 'Research & Coursework',
    description: 'Education-first structure highlighting academic standing, coursework, achievements, and publications.',
    badge: 'Education First',
    recommendedFor: 'Grad School, Research Fellowships & Academia',
    atsScore: '96%',
    category: 'ats-first',
  },
  {
    id: 'compact',
    name: 'Compact',
    tagline: 'High-Density 1-Page',
    description: 'Space-efficient typography and margins for concise one-page resumes without making text unreadably small.',
    badge: '1-Page Fit',
    recommendedFor: 'Freshers & Tight 1-Page Guidelines',
    atsScore: '94%',
    category: 'ats-first',
  },
  {
    id: 'executive',
    name: 'Executive',
    tagline: 'Impact & Leadership',
    description: 'Refined typography and strong achievement-focused hierarchy showcasing measurable contributions and impact.',
    badge: 'Leadership',
    recommendedFor: 'Student Leaders, Founders & Senior Roles',
    atsScore: '95%',
    category: 'ats-first',
  },
  {
    id: 'contemporary-sidebar',
    name: 'Contemporary Sidebar',
    tagline: 'Modern 2-Column Split',
    description: 'Two-column layout with a visually distinct skills/contact sidebar and a main experience/project column.',
    badge: 'Visual First',
    recommendedFor: 'Portfolios, Agencies & Direct Email Applications',
    atsScore: '85%',
    category: 'visual-first',
  },
];

export const INITIAL_RESUME_DATA: ResumeData = {
  id: 'resume-sanjay-01',
  title: 'AI & Data Science Resume',
  updatedAt: new Date().toISOString(),
  templateId: 'modern',
  personalInfo: {
    fullName: 'Sanjay Kumar',
    professionalTitle: 'AI & Data Science Student',
    email: 'sanjay@example.com',
    phone: '+91 98765 43210',
    location: 'Chennai, Tamil Nadu',
    linkedin: 'https://linkedin.com/in/sanjay',
    github: 'https://github.com/sanjay',
    website: 'https://sanjay.dev',
    summary:
      'A passionate AI & Data Science student with a strong interest in building real-world solutions. Experienced in developing scalable machine learning pipelines, full-stack applications, and resilient software architectures.',
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Saveetha Engineering College',
      degree: 'B.Tech',
      fieldOfStudy: 'AI & Data Science',
      startDate: '2024',
      endDate: '2028',
      scoreOrGpa: '8.2',
      type: 'college',
    },
    {
      id: 'edu-2',
      institution: 'Vivekanandha Higher Secondary School',
      degree: 'Higher Secondary (12th)',
      fieldOfStudy: 'State Board',
      startDate: '2022',
      endDate: '2024',
      scoreOrGpa: '92%',
      type: 'higher-secondary',
    },
  ],
  skills: {
    technical: [
      'Python',
      'JavaScript',
      'React',
      'Tailwind CSS',
      'Node.js',
      'MongoDB',
      'MySQL',
      'Machine Learning',
      'Data Analysis',
      'Git',
      'Docker',
      'AWS',
    ],
    soft: [
      'Problem Solving',
      'Team Collaboration',
      'Technical Communication',
      'Adaptability',
      'Time Management',
    ],
    tools: ['VS Code', 'Jupyter', 'Postman', 'Figma'],
  },
  projects: [
    {
      id: 'proj-1',
      title: 'ResilientX',
      role: 'Lead Developer',
      link: 'https://github.com/sanjay/resilientx',
      liveUrl: 'https://resilientx-demo.web.app',
      repoUrl: 'https://github.com/sanjay/resilientx',
      techStack: ['React', 'Node.js', 'Python', 'Gemini AI'],
      description:
        'AI-powered software resilience engineering platform to detect, analyze, and automatically recover from distributed service failures.',
      bullets: [
        'Implemented autonomous fault-injection tests and telemetry anomaly detection using ML.',
        'Reduced simulated failover recovery latency by 38% across container clusters.',
      ],
    },
    {
      id: 'proj-2',
      title: 'NeuroGuard',
      role: 'ML Engineer',
      link: 'https://github.com/sanjay/neuroguard',
      liveUrl: 'https://neuroguard-ai.app',
      repoUrl: 'https://github.com/sanjay/neuroguard',
      techStack: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
      description:
        'Predictive equipment maintenance system leveraging time-series sensor data and automated alert dispatches.',
      bullets: [
        'Trained an LSTM classifier achieving 94.2% precision on industrial sensor failure prediction.',
        'Engineered an edge-compatible FastAPI inference service serving sub-50ms predictions.',
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Paytm',
      position: 'Onboarding Specialist Intern - PI Agents',
      location: 'Bengaluru & Noida',
      employmentType: 'Internship',
      startDate: 'Jun 2026',
      endDate: 'Aug 2026',
      isCurrent: false,
      description:
        '• Worked on AI agents for customer onboarding and document verification.\n• Collaborated with cross-functional product and engineering teams.\n• Gained hands-on experience in real-world high-throughput fintech workflows.',
      bullets: [
        'Worked on AI agents for automated merchant onboarding and document verification.',
        'Collaborated with cross-functional engineering teams to streamline onboarding verification pipelines.',
        'Gained hands-on production experience in high-throughput enterprise fintech microservices.',
      ],
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Google AI Essentials',
      issuer: 'Google',
      issueDate: 'May 2026',
      credentialUrl: 'https://www.coursera.org/account/accomplishments/verify/sample',
    },
    {
      id: 'cert-2',
      name: 'IBM SkillsBuild - AI Fundamentals',
      issuer: 'IBM',
      issueDate: 'Apr 2026',
      credentialUrl: 'https://skillsbuild.ibm.com/badges/sample',
    },
  ],
};

export const COMMON_TECHNICAL_SKILLS = [
  'C++',
  'Java',
  'TypeScript',
  'Next.js',
  'Firebase',
  'SQL',
  'pandas',
  'NumPy',
  'Scikit-learn',
  'TensorFlow',
  'PyTorch',
  'FastAPI',
  'PostgreSQL',
  'GraphQL',
  'Linux',
  'REST APIs',
];

export const COMMON_SOFT_SKILLS = [
  'Critical Thinking',
  'Leadership',
  'Public Speaking',
  'Agile / Scrum',
  'Analytical Thinking',
  'Cross-Functional Collaboration',
  'Conflict Resolution',
  'Project Management',
];
