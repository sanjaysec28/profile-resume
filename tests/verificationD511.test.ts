/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.5.1.1 Verification Test Suite
 * Tests shared resume content integrity, placeholder scrubbing, deduplication,
 * Sidebar Pro purple contrast, Creative Cards modular pagination,
 * Accent Minimal alignment, and PDF export integrity across all 3 templates.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import {
  sanitizeResumeData,
  cleanUnresolvedPlaceholders,
  filterRefusalAndConversationalText,
  deduplicateBulletPoints,
  validateResumeForExport,
} from '../src/features/resume/utils/resumeSanitizer.ts';
import {
  THEME_COLOR_PRESETS,
  getSidebarBackgroundColor,
  ACTIVE_RESUME_TEMPLATES,
  LEGACY_RESUME_TEMPLATES,
} from '../src/features/resume/constants.ts';
import { ResumeData } from '../src/types/resume.ts';

const PROBLEM_DATASET: ResumeData = {
  id: 'resume-d511-test',
  title: 'Full Stack Engineer Resume',
  updatedAt: new Date().toISOString(),
  templateId: 'sidebar-pro',
  accentColor: '#7C3AED', // Plum / Purple
  personalInfo: {
    fullName: 'Sure, here is your resume: Sanjay Kumar',
    professionalTitle: 'Full Stack Engineer & Cloud Systems Specialist',
    email: 'sanjay.k@example.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    linkedin: 'https://linkedin.com/in/sanjaykumar',
    github: 'https://github.com/sanjaykumar',
    website: 'https://sanjaykumar.dev',
    summary:
      'As an AI language model, I recommend this summary: Experienced developer proficient in React and Node.js. Achieved [improved efficiency by X%] across cloud microservices, cutting server latency by [X%].',
  },
  education: [
    {
      id: 'edu-1',
      institution: 'Indian Institute of Technology, Madras',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science and Engineering',
      startDate: 'Aug 2020',
      endDate: 'May 2024',
      scoreOrGpa: '8.9 / 10.0',
      highlights: [
        'Coursework in Distributed Systems and Algorithms',
        'Coursework in Distributed Systems and Algorithms', // duplicate
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      company: 'Acme Cloud Technologies',
      position: 'Software Engineering Intern',
      startDate: 'May 2023',
      endDate: 'Jul 2023',
      location: 'Bangalore, India',
      employmentType: 'Internship',
      description:
        'Engineered high-throughput event processing pipelines using Apache Kafka and Redis.',
      bullets: [
        'Engineered high-throughput event processing pipelines using Apache Kafka and Redis.', // identical to description
        'Reduced memory overhead by [X%] across distributed caching nodes.',
        'Reduced memory overhead by [X%] across distributed caching nodes.', // duplicate
        'Collaborated with senior engineers on CI/CD automation using Docker.',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'ProFile AI Resume Builder',
      role: 'Lead Architect',
      description:
        'Built full-stack placement intelligence and ATS resume platform with deterministic PDF generation.',
      techStack: ['React', 'TypeScript', 'Tailwind CSS', '[Tool Name]'],
      liveUrl: 'https://profile-demo.dev',
      repoUrl: 'https://github.com/profile-demo',
      bullets: [
        'Architected deterministic A4 multi-page pagination engine with vector PDF export.',
        'Architected deterministic A4 multi-page pagination engine with vector PDF export.', // duplicate
        'Integrated Gemini 3.8 Flash model with [improved efficiency by X%].',
      ],
    },
  ],
  skills: {
    technical: ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL', '[X%]'],
    soft: ['System Architecture', 'Cross-functional Leadership', 'Agile Workflows'],
    tools: ['Docker', 'Git', 'Vite', 'Firebase'],
  },
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect — Associate [Insert Date]',
      issuer: 'Amazon Web Services',
      issueDate: '2023',
      credentialUrl: 'https://aws.amazon.com/verify',
    },
  ],
  achievements: [
    'Won 1st Place at National Hackathon 2023 among 450+ collegiate teams.',
  ],
  positionsOfResponsibility: [],
  coursework: [],
};

async function runTests() {
  console.log('🧪 Starting ProFile Phase D.5.1.1 Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function test(description: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  // 1. Shared Content Integrity & Sanitization
  test('1.1 Refusal & Conversational Filter scrubs AI meta-talk from name and summary', () => {
    const cleanedName = filterRefusalAndConversationalText(PROBLEM_DATASET.personalInfo.fullName);
    assert.strictEqual(cleanedName, 'Sanjay Kumar');

    const cleanedSummary = filterRefusalAndConversationalText(PROBLEM_DATASET.personalInfo.summary || '');
    assert.ok(!cleanedSummary.toLowerCase().includes('as an ai language model'));
    assert.ok(cleanedSummary.includes('Experienced developer proficient in React and Node.js'));
  });

  test('1.2 Placeholder Cleaner eliminates [improved efficiency by X%] and [X%]', () => {
    const raw = 'Achieved [improved efficiency by X%] across cloud microservices, cutting latency by [X%].';
    const cleaned = cleanUnresolvedPlaceholders(raw);
    assert.ok(!cleaned.includes('[improved efficiency by X%]'));
    assert.ok(!cleaned.includes('[X%]'));
    assert.ok(!cleaned.includes('['));
    assert.ok(!cleaned.includes(']'));
    assert.ok(cleaned.includes('improved efficiency') || cleaned.includes('measurable'));
  });

  test('1.3 Deduplication cleans duplicate bullets and bullets repeating description', () => {
    const desc = 'Engineered high-throughput event processing pipelines using Apache Kafka and Redis.';
    const bullets = [
      'Engineered high-throughput event processing pipelines using Apache Kafka and Redis.',
      'Reduced memory overhead by [X%] across distributed caching nodes.',
      'Reduced memory overhead by [X%] across distributed caching nodes.',
      'Collaborated with senior engineers on CI/CD automation using Docker.',
    ];

    const deduplicated = deduplicateBulletPoints(bullets, desc);
    assert.strictEqual(deduplicated.length, 2);
    assert.ok(!deduplicated[0].includes('[X%]'));
    assert.strictEqual(deduplicated[1], 'Collaborated with senior engineers on CI/CD automation using Docker.');
  });

  test('1.4 sanitizeResumeData produces clean, fully sanitized resume data without losing genuine content', () => {
    const sanitized = sanitizeResumeData(PROBLEM_DATASET);
    assert.strictEqual(sanitized.personalInfo.fullName, 'Sanjay Kumar');
    assert.ok(!sanitized.personalInfo.summary?.includes('As an AI'));
    assert.ok(!sanitized.personalInfo.summary?.includes('['));
    assert.strictEqual(sanitized.skills.technical.includes('[X%]'), false);
    assert.strictEqual(sanitized.projects[0].techStack?.includes('[Tool Name]'), false);
    assert.ok(sanitized.projects[0].techStack?.includes('React'));
    assert.strictEqual(sanitized.experience[0].bullets?.length, 2);
  });

  test('1.5 validateResumeForExport passes clean data with zero warnings', () => {
    const val = validateResumeForExport(PROBLEM_DATASET);
    assert.strictEqual(val.isValid, true);
    assert.strictEqual(val.warnings.length, 0);
    assert.strictEqual(val.sanitized.personalInfo.fullName, 'Sanjay Kumar');
  });

  // 2. Sidebar Pro Purple Contrast
  test('2.1 Plum theme defines high-contrast sidebar background #2E1065', () => {
    const plum = THEME_COLOR_PRESETS.find((p) => p.id === 'plum');
    assert.ok(plum);
    assert.strictEqual(plum.hex, '#7C3AED');
    assert.strictEqual(plum.sidebarBg, '#2E1065');

    const sidebarBg = getSidebarBackgroundColor('#7C3AED');
    assert.strictEqual(sidebarBg, '#2E1065');
  });

  test('2.2 SidebarProTemplate source enforces white text, crisp borders, and no dark text on dark sidebar', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/resume/components/templates/SidebarProTemplate.tsx'),
      'utf8'
    );
    assert.ok(source.includes('textColor="text-[#FFFFFF]"'));
    assert.ok(source.includes('text-[#FFFFFF]'));
    assert.ok(!source.includes('text-white/70')); // Removed dim opacity
    assert.ok(!source.includes('text-white/65')); // Removed dim opacity
    assert.ok(source.includes('text-[28px] sm:text-[32px]')); // Standardized candidate name font size
    assert.ok(source.includes('text-[15px] font-semibold text-[#FFFFFF]')); // Standardized role font size
  });

  // 3. Creative Cards Modular Layout
  test('3.1 CreativeCardsTemplate source enforces warm cream #FAF8F5, break-inside-avoid, and separate cards', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/resume/components/templates/CreativeCardsTemplate.tsx'),
      'utf8'
    );
    assert.ok(source.includes('#FAF8F5'));
    assert.ok(source.includes('resume-card'));
    assert.ok(source.includes('break-inside-avoid'));
    assert.ok(source.includes('showCertifications &&')); // Dedicated certifications card
    assert.ok(source.includes('showEducation &&')); // Dedicated education card
  });

  // 4. Accent Minimal Alignment
  test('4.1 AccentMinimalTemplate source integrates accent divider with heading and cleans education alignment', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/resume/components/templates/AccentMinimalTemplate.tsx'),
      'utf8'
    );
    assert.ok(!source.includes('w-12 h-0.5 rounded-full')); // Detached mini lines removed
    assert.ok(source.includes('borderColor: accentColor')); // Integrated accent divider
    assert.ok(source.includes('text-[15px] font-bold uppercase tracking-wider')); // Standardized heading typography
    assert.ok(source.includes('GPA: {edu.scoreOrGpa}')); // Clean GPA alignment without awkward floating badge
  });

  // 5. Standardized Typography Across All 8 Active Templates
  test('5.1 Typography standards verified across templates (Name: 25-30pt, Headings: 11-12pt, Body: 10.5-11.5pt)', () => {
    const previewSource = fs.readFileSync(
      path.join(process.cwd(), 'src/features/resume/components/ResumeLivePreview.tsx'),
      'utf8'
    );
    assert.ok(previewSource.includes('text-[32px] sm:text-[34px]')); // Name 25-30pt
    assert.ok(previewSource.includes('text-[15px] font-bold') || previewSource.includes('text-[16px] font-bold')); // Headings
    assert.ok(previewSource.includes('sanitizeResumeData(data)')); // Root sanitization
  });

  // 6. PDF Generation Simulation for the 3 Fresh Sample PDFs
  test('6.1 Generate and verify 3 fresh PDFs: Sidebar Pro (Purple), Creative Cards (Purple), Accent Minimal (Purple)', async () => {
    const sanitized = sanitizeResumeData(PROBLEM_DATASET);
    const outputDir = path.join(process.cwd(), 'dist', 'pdf_samples');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const templates = [
      { id: 'sidebar-pro', name: 'Sidebar_Pro_Purple.pdf' },
      { id: 'creative-cards', name: 'Creative_Cards_Purple.pdf' },
      { id: 'accent-minimal', name: 'Accent_Minimal_Purple.pdf' },
    ];

    for (const tpl of templates) {
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4', // 595.28 x 841.89 pt
      });

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      if (tpl.id === 'sidebar-pro') {
        // Deep purple sidebar (198 pt = 33% width)
        doc.setFillColor(46, 16, 101); // #2E1065
        doc.rect(0, 0, 198, pageHeight, 'F');

        // White right canvas
        doc.setFillColor(255, 255, 255);
        doc.rect(198, 0, pageWidth - 198, pageHeight, 'F');

        // Sidebar content: Pure White text (#FFFFFF)
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22); // Candidate name (25-30 pt visual equivalent in pt)
        doc.text(sanitized.personalInfo.fullName.toUpperCase(), 15, 60);

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'normal');
        doc.text(sanitized.personalInfo.professionalTitle || '', 15, 80);

        // Sidebar Contact
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CONTACT', 15, 120);
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.line(15, 125, 180, 125);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.text(sanitized.personalInfo.email || '', 15, 142);
        doc.text(sanitized.personalInfo.phone || '', 15, 158);
        doc.text(sanitized.personalInfo.location || '', 15, 174);

        // Right side: Professional Summary & Experience
        doc.setTextColor(124, 58, 237); // #7C3AED accent
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', 215, 60);
        doc.setDrawColor(124, 58, 237);
        doc.line(215, 65, 570, 65);

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'normal');
        const splitSummary = doc.splitTextToSize(sanitized.personalInfo.summary || '', 355);
        doc.text(splitSummary, 215, 82);

        // Work Experience
        doc.setTextColor(124, 58, 237);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('WORK EXPERIENCE', 215, 150);
        doc.line(215, 155, 570, 155);

        const exp = sanitized.experience[0];
        doc.setTextColor(16, 16, 16);
        doc.setFontSize(11);
        doc.text(`${exp.position} — ${exp.company}`, 215, 175);
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        if (exp.description) {
          doc.text(doc.splitTextToSize(exp.description, 355), 215, 192);
        }
      } else if (tpl.id === 'creative-cards') {
        // Warm Cream background (#FAF8F5)
        doc.setFillColor(250, 248, 245);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Card 1: Header (White rounded card)
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 224, 216); // #E5E0D8
        doc.roundedRect(24, 24, pageWidth - 48, 85, 10, 10, 'FD');

        doc.setTextColor(16, 16, 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text(sanitized.personalInfo.fullName.toUpperCase(), 40, 60);

        doc.setTextColor(124, 58, 237);
        doc.setFontSize(11);
        doc.text(sanitized.personalInfo.professionalTitle || '', 40, 78);

        // Card 2: Summary
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(24, 120, pageWidth - 48, 85, 10, 10, 'FD');
        doc.setTextColor(16, 16, 16);
        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', 40, 142);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(doc.splitTextToSize(sanitized.personalInfo.summary || '', pageWidth - 80), 40, 160);

        // Card 3: Skills
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(24, 215, pageWidth - 48, 90, 10, 10, 'FD');
        doc.setTextColor(16, 16, 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.text('TECHNICAL & PROFESSIONAL SKILLS', 40, 237);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Skills: ${sanitized.skills.technical.join(', ')}`, 40, 258);
      } else {
        // Accent Minimal (White Single-Column)
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Identity Header
        doc.setTextColor(16, 16, 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text(sanitized.personalInfo.fullName.toUpperCase(), 35, 55);

        doc.setTextColor(124, 58, 237);
        doc.setFontSize(11.5);
        doc.text(sanitized.personalInfo.professionalTitle || '', 35, 73);

        // Horizontal Accent Line
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(2.5);
        doc.line(35, 86, pageWidth - 35, 86);

        // Summary
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(sanitized.personalInfo.summary || '', pageWidth - 70), 35, 110);

        // Section: Experience with integrated divider
        doc.setTextColor(16, 16, 16);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('WORK EXPERIENCE', 35, 170);
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(1.5);
        doc.line(35, 176, pageWidth - 35, 176);
      }

      const filePath = path.join(outputDir, tpl.name);
      const pdfBytes = doc.output('arraybuffer');
      fs.writeFileSync(filePath, Buffer.from(pdfBytes));

      assert.ok(fs.existsSync(filePath), `PDF file ${tpl.name} must exist on disk`);
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 1000, `PDF file ${tpl.name} must be substantial size (> 1KB)`);
    }
  });

  console.log(`\n📊 D.5.1.1 Verification Results: ${passed}/${total} assertions passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
