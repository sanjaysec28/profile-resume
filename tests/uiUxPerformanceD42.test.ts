/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.4.2 UI/UX, Responsiveness & Performance Test Suite
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

function runD42Tests() {
  console.log('🧪 Starting ProFile Phase D.4.2 UI/UX, Responsiveness & Performance Suite...\n');
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

  // 1. Bundle Optimization & Manual Chunks Verification
  test('vite.config.ts configures manualChunks for vendor splitting', () => {
    const viteConfig = fs.readFileSync(path.resolve('./vite.config.ts'), 'utf-8');
    assert.ok(viteConfig.includes('manualChunks'), 'vite.config.ts should define manualChunks');
    assert.ok(viteConfig.includes('vendor-pdf-ocr'), 'vite.config.ts should isolate PDF/OCR vendor libraries');
    assert.ok(viteConfig.includes('vendor-firebase'), 'vite.config.ts should isolate Firebase vendor libraries');
    assert.ok(viteConfig.includes('vendor-react'), 'vite.config.ts should isolate React vendor libraries');
    assert.ok(!viteConfig.includes('__dirname'), 'vite.config.ts should avoid deprecated __dirname for native config loading');
  });

  // 2. Mobile Responsive Resume Actions in ResumeBuilder
  test('ResumeBuilder includes mobile quick preview button and responsive download button', () => {
    const builderContent = fs.readFileSync(
      path.resolve('./src/features/resume/components/ResumeBuilder.tsx'),
      'utf-8'
    );
    assert.ok(
      builderContent.includes('setIsMobilePreviewOpen(true)'),
      'ResumeBuilder must have a button to open mobile live preview'
    );
    assert.ok(
      builderContent.includes('lg:hidden inline-flex items-center gap-1.5'),
      'ResumeBuilder must expose a mobile preview button on small viewports'
    );
    assert.ok(
      builderContent.includes('handleDownloadPdf'),
      'ResumeBuilder must retain PDF download capability'
    );
  });

  // 3. Responsive Scaling & Controls in FinalPreviewModal
  test('FinalPreviewModal provides responsive zoom initialization and repositioned controls', () => {
    const previewContent = fs.readFileSync(
      path.resolve('./src/features/resume/components/FinalPreviewModal.tsx'),
      'utf-8'
    );
    assert.ok(
      previewContent.includes('window.innerWidth < 640') && previewContent.includes('0.55'),
      'FinalPreviewModal should initialize scale to fit mobile screens under 640px'
    );
    assert.ok(
      previewContent.includes('bottom-4') && previewContent.includes('flex-row sm:flex-col'),
      'FinalPreviewModal should place zoom controls horizontally at bottom on mobile'
    );
  });

  // 4. Clean Student Domain Terminology (Anti-Slop)
  test('App.tsx and CareerIntelligenceWorkspace are free from developer sprint phase labels', () => {
    const appContent = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
    assert.ok(
      !appContent.includes('Phase 5 Intelligence'),
      'App.tsx should not expose Phase 5 Intelligence to students'
    );
    assert.ok(
      !appContent.includes('Phase 6 Intelligence'),
      'App.tsx should not expose Phase 6 Intelligence to students'
    );
    assert.ok(
      !appContent.includes('Phase 7 Intelligence'),
      'App.tsx should not expose Phase 7 Intelligence to students'
    );
    assert.ok(
      appContent.includes('Roadmap Engine'),
      'App.tsx should use student-friendly domain label Roadmap Engine'
    );
    assert.ok(
      appContent.includes('Interview Studio'),
      'App.tsx should use student-friendly domain label Interview Studio'
    );
    assert.ok(
      appContent.includes('Placement Portal'),
      'App.tsx should use student-friendly domain label Placement Portal'
    );

    const careerContent = fs.readFileSync(
      path.resolve('./src/features/career/CareerIntelligenceWorkspace.tsx'),
      'utf-8'
    );
    assert.ok(
      !careerContent.includes('Phase 5 Intelligence'),
      'CareerIntelligenceWorkspace should not expose Phase 5 Intelligence'
    );
  });

  // 5. Monochrome Design Tokens & Color Discipline
  test('Strict palette enforcement: No rogue gold, cyber, or neon styling introduced', () => {
    const appContent = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');
    assert.ok(!appContent.includes('#FFD700'), 'Should not use bright gold #FFD700');
    assert.ok(!appContent.includes('text-yellow-400'), 'Should not use raw bright yellow');
    assert.ok(appContent.includes('#F8F5EE') || appContent.includes('#FAF9F5'), 'Should preserve warm cream background');
  });

  // 6. Build Output Verification
  test('dist/ directory contains separated vendor chunks after build', () => {
    const distAssets = fs.existsSync(path.resolve('./dist/assets'))
      ? fs.readdirSync(path.resolve('./dist/assets'))
      : [];
    assert.ok(distAssets.length > 0, 'dist/assets should contain built files');
    const hasVendorPdf = distAssets.some((f) => f.startsWith('vendor-pdf-ocr'));
    const hasVendorFirebase = distAssets.some((f) => f.startsWith('vendor-firebase'));
    const hasVendorReact = distAssets.some((f) => f.startsWith('vendor-react'));
    assert.ok(hasVendorPdf, 'Build output must include vendor-pdf-ocr chunk');
    assert.ok(hasVendorFirebase, 'Build output must include vendor-firebase chunk');
    assert.ok(hasVendorReact, 'Build output must include vendor-react chunk');
  });

  console.log(`\n📊 D.4.2 Results: ${passed}/${total} tests passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runD42Tests();
