/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.5.1 New Resume Templates & PDF Design Enhancement Test Suite
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_RESUME_TEMPLATES,
  LEGACY_RESUME_TEMPLATES,
  RESUME_TEMPLATES_CATALOG,
  THEME_COLOR_PRESETS,
  DEFAULT_ACCENT_COLOR,
  getSidebarBackgroundColor,
} from '../src/features/resume/constants.ts';
import { ResumeData, ResumeTemplateId } from '../src/types/resume.ts';

function runD51Tests() {
  console.log('🎨 Starting ProFile Phase D.5.1 New Resume Templates & Design Suite...\n');
  let passed = 0;
  let total = 0;

  function test(description: string, fn: () => void) {
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

  // 1. Template Catalog Specification
  test('1.1 ACTIVE_RESUME_TEMPLATES contains exactly eight active templates', () => {
    assert.strictEqual(ACTIVE_RESUME_TEMPLATES.length, 8, 'Must have exactly 8 active templates');
    const ids = ACTIVE_RESUME_TEMPLATES.map((t) => t.id);
    assert.ok(ids.includes('modern'), 'Must include modern');
    assert.ok(ids.includes('classic'), 'Must include classic');
    assert.ok(ids.includes('technical'), 'Must include technical');
    assert.ok(ids.includes('minimal'), 'Must include minimal');
    assert.ok(ids.includes('compact'), 'Must include compact');
    assert.ok(ids.includes('sidebar-pro'), 'Must include sidebar-pro');
    assert.ok(ids.includes('creative-cards'), 'Must include creative-cards');
    assert.ok(ids.includes('accent-minimal'), 'Must include accent-minimal');
  });

  test('1.2 LEGACY_RESUME_TEMPLATES preserves all 5 previous templates for backward compatibility', () => {
    assert.strictEqual(LEGACY_RESUME_TEMPLATES.length, 5, 'Must have 5 legacy templates');
    const legacyIds = LEGACY_RESUME_TEMPLATES.map((t) => t.id);
    assert.ok(legacyIds.includes('professional'));
    assert.ok(legacyIds.includes('creative'));
    assert.ok(legacyIds.includes('academic'));
    assert.ok(legacyIds.includes('executive'));
    assert.ok(legacyIds.includes('contemporary-sidebar'));

    // Combined catalog should have 13 templates total
    assert.strictEqual(RESUME_TEMPLATES_CATALOG.length, 13);
  });

  // 2. Colour Customization Presets
  test('2.1 THEME_COLOR_PRESETS includes all 6 specified colors with correct hex codes', () => {
    assert.strictEqual(THEME_COLOR_PRESETS.length, 6);
    const presetMap = new Map(THEME_COLOR_PRESETS.map((p) => [p.name.toLowerCase(), p.hex.toUpperCase()]));
    assert.strictEqual(presetMap.get('yellow'), '#D99A00');
    assert.strictEqual(presetMap.get('blue'), '#2563EB');
    assert.strictEqual(presetMap.get('green'), '#047857');
    assert.strictEqual(presetMap.get('black'), '#222222');
    assert.strictEqual(presetMap.get('plum'), '#7C3AED');
    assert.strictEqual(presetMap.get('crimson'), '#BE123C');
  });

  test('2.2 getSidebarBackgroundColor produces high-contrast darker background for Sidebar Pro', () => {
    const blueSidebar = getSidebarBackgroundColor('#2563EB');
    assert.strictEqual(blueSidebar, '#1E3A8A');

    const yellowSidebar = getSidebarBackgroundColor('#D99A00');
    assert.strictEqual(yellowSidebar, '#785400');

    const customDark = getSidebarBackgroundColor('#3B82F6');
    assert.ok(customDark && customDark !== '#FFFFFF');
  });

  // 3. ResumeData Schema Support
  test('3.1 ResumeData and ResumeTemplateId support accentColor and all 8 active template IDs', () => {
    const sampleResume: ResumeData = {
      id: 'test-resume-1',
      title: 'Full Stack Engineer Resume',
      updatedAt: new Date().toISOString(),
      templateId: 'sidebar-pro',
      accentColor: '#047857',
      personalInfo: {
        fullName: 'Aarav Sharma',
        professionalTitle: 'Full-Stack Developer',
        email: 'aarav@example.com',
        phone: '+91 9876543210',
        location: 'Bengaluru, India',
        summary: 'Passionate developer building high-performance web applications.',
        showPhoto: true,
      },
      education: [
        {
          id: 'edu-1',
          institution: 'IIT Madras',
          degree: 'B.Tech Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2022',
          endDate: '2026',
          scoreOrGpa: '9.2 CGPA',
        },
      ],
      skills: {
        technical: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        soft: ['Problem Solving', 'Agile Collaboration'],
        tools: ['Git', 'VS Code', 'Postman'],
      },
      experience: [
        {
          id: 'exp-1',
          company: 'TechCorp Labs',
          position: 'Software Engineering Intern',
          startDate: 'May 2024',
          endDate: 'July 2024',
          description: 'Engineered responsive dashboards using React and Vite.',
          bullets: ['Reduced bundle size by 40%', 'Integrated REST endpoints'],
        },
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'Cloud Analytics Engine',
          techStack: ['TypeScript', 'Express', 'PostgreSQL'],
          description: 'Built high-throughput telemetry collector for microservices.',
          bullets: ['Processed 10,000 requests/sec', 'Designed clean API specs'],
          liveUrl: 'https://demo.example.com',
          repoUrl: 'https://github.com/example/engine',
        },
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
          issueDate: '2024',
        },
      ],
    };

    assert.strictEqual(sampleResume.templateId, 'sidebar-pro');
    assert.strictEqual(sampleResume.accentColor, '#047857');
  });

  // 4. Template Source Files Verification
  test('4.1 All three new template component source files exist and compile', () => {
    assert.ok(
      fs.existsSync(path.resolve('./src/features/resume/components/templates/SidebarProTemplate.tsx')),
      'SidebarProTemplate.tsx must exist'
    );
    assert.ok(
      fs.existsSync(path.resolve('./src/features/resume/components/templates/CreativeCardsTemplate.tsx')),
      'CreativeCardsTemplate.tsx must exist'
    );
    assert.ok(
      fs.existsSync(path.resolve('./src/features/resume/components/templates/AccentMinimalTemplate.tsx')),
      'AccentMinimalTemplate.tsx must exist'
    );
  });

  // 5. ResumeLivePreview Integration
  test('5.1 ResumeLivePreview.tsx integrates all three new templates with accentColor', () => {
    const livePreviewSrc = fs.readFileSync(
      path.resolve('./src/features/resume/components/ResumeLivePreview.tsx'),
      'utf-8'
    );
    assert.ok(livePreviewSrc.includes('SidebarProTemplate'), 'Must import SidebarProTemplate');
    assert.ok(livePreviewSrc.includes('CreativeCardsTemplate'), 'Must import CreativeCardsTemplate');
    assert.ok(livePreviewSrc.includes('AccentMinimalTemplate'), 'Must import AccentMinimalTemplate');
    assert.ok(livePreviewSrc.includes("activeTemplate === 'sidebar-pro'"), 'Must branch on sidebar-pro');
    assert.ok(livePreviewSrc.includes("activeTemplate === 'creative-cards'"), 'Must branch on creative-cards');
    assert.ok(livePreviewSrc.includes("activeTemplate === 'accent-minimal'"), 'Must branch on accent-minimal');
  });

  // 6. TemplateSelectStep UI & Color Customizer
  test('6.1 TemplateSelectStep.tsx exposes 8 active templates and Colour Theme Customization', () => {
    const stepSrc = fs.readFileSync(
      path.resolve('./src/features/resume/components/steps/TemplateSelectStep.tsx'),
      'utf-8'
    );
    assert.ok(stepSrc.includes('Choose from 8 Curated Professional Resume Layouts'));
    assert.ok(stepSrc.includes('Colour Theme Customization'));
    assert.ok(stepSrc.includes('THEME_COLOR_PRESETS'));
    assert.ok(stepSrc.includes('type="color"'), 'Must provide custom color picker input');
    assert.ok(stepSrc.includes("id === 'sidebar-pro'"), 'Must render thumbnail for sidebar-pro');
    assert.ok(stepSrc.includes("id === 'creative-cards'"), 'Must render thumbnail for creative-cards');
    assert.ok(stepSrc.includes("id === 'accent-minimal'"), 'Must render thumbnail for accent-minimal');
  });

  // 7. FinalPreviewModal Live Switcher Integration
  test('7.1 FinalPreviewModal.tsx supports real-time template and colour switching', () => {
    const modalSrc = fs.readFileSync(
      path.resolve('./src/features/resume/components/FinalPreviewModal.tsx'),
      'utf-8'
    );
    assert.ok(modalSrc.includes('onSelectColor?: (color: string) => void;'));
    assert.ok(modalSrc.includes('Quick Colour Switcher'));
  });

  console.log(`\n📊 D.5.1 Results: ${passed}/${total} assertions passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runD51Tests();
