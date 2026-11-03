/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Playwright QA Test Suite for Phase C.1 PDF Export Engine Validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(projectRoot, 'test-artifacts');

// Ensure artifacts dir exists
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

async function run() {
  console.log('===============================================================');
  console.log(' ProFile — PHASE C.1: PDF EXPORT QA & VISUAL VALIDATION SUITE ');
  console.log('===============================================================\n');

  // Load playwright-core and pdfjs-dist
  const { chromium } = await import('/usr/local/share/bun-global/node_modules/playwright-core/index.mjs');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  console.log('Launching Headless Chromium...');
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/?qa=true ...');
  await page.goto('http://localhost:3000/?qa=true', { waitUntil: 'networkidle' });

  // Wait for QA harness readiness
  await page.waitForFunction(() => Boolean(window.__PRO_FILE_QA__), { timeout: 15000 });
  console.log('✓ QA Harness initialized in browser.\n');

  const caseKeys = await page.evaluate(() => window.__PRO_FILE_QA__.getAvailableCases());
  console.log(`Found ${caseKeys.length} test cases:`, caseKeys.join(', '), '\n');

  const testReport = [];

  for (const caseKey of caseKeys) {
    console.log(`---------------------------------------------------------------`);
    console.log(`▶ Executing Test Case: ${caseKey.toUpperCase()}`);
    console.log(`---------------------------------------------------------------`);

    // Switch and run export in browser
    const result = await page.evaluate(async (key) => {
      return await window.__PRO_FILE_QA__.runExport(key);
    }, caseKey);

    if (!result.success || !result.pdfBase64) {
      console.error(`✖ FAILED: PDF generation failed for ${caseKey}:`, result.error);
      testReport.push({
        caseKey,
        success: false,
        error: result.error,
      });
      continue;
    }

    // Save actual PDF file to disk
    const base64Data = result.pdfBase64.includes(',')
      ? result.pdfBase64.split(',')[1]
      : result.pdfBase64;
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const pdfPath = path.join(artifactsDir, `${caseKey}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`✓ Generated & saved actual PDF: ${pdfPath} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // Parse and inspect with pdfjs-dist
    const pdfUint8 = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjs.getDocument({ data: pdfUint8 });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    console.log(`✓ Total Pages: ${numPages}`);

    const pagesData = [];
    let allExtractedText = '';
    let totalLinksFound = 0;

    for (let p = 1; p <= numPages; p++) {
      const pdfPage = await pdfDoc.getPage(p);
      const viewport = pdfPage.getViewport({ scale: 1 });
      const widthPt = viewport.width;
      const heightPt = viewport.height;

      // Extract text content
      const textContent = await pdfPage.getTextContent();
      const pageText = textContent.items
        .map((item) => (item.str ? item.str : ''))
        .join(' ');
      allExtractedText += `\n[PAGE ${p}]: ` + pageText;

      // Extract annotations (hyperlinks)
      const annotations = await pdfPage.getAnnotations();
      const linkAnnotations = annotations.filter((a) => a.subtype === 'Link');
      totalLinksFound += linkAnnotations.length;

      pagesData.push({
        pageNumber: p,
        widthPt: Math.round(widthPt * 100) / 100,
        heightPt: Math.round(heightPt * 100) / 100,
        textLength: pageText.trim().length,
        hasContent: pageText.trim().length > 0,
        linksCount: linkAnnotations.length,
        linkUrls: linkAnnotations.map((a) => a.url).filter(Boolean),
      });

      console.log(
        `   Page ${p}: Dimensions = ${widthPt.toFixed(2)}pt x ${heightPt.toFixed(2)}pt (A4: 595.28 x 841.89) | Text Chars = ${pageText.trim().length} | Links = ${linkAnnotations.length}`
      );
    }

    // Verify A4 dimensions (595.28 pt x 841.89 pt is standard A4 at 72 pt/inch)
    const page1 = pagesData[0];
    const isA4Width = Math.abs(page1.widthPt - 595.28) < 1.0;
    const isA4Height = Math.abs(page1.heightPt - 841.89) < 1.0;

    // Check blank trailing page
    const lastPage = pagesData[pagesData.length - 1];
    const hasBlankTrailingPage = numPages > 1 && lastPage.textLength < 10;

    console.log(`✓ A4 Geometry Match: ${isA4Width && isA4Height ? 'PASS (Exact A4)' : 'FAIL'}`);
    console.log(`✓ Trailing Blank Page Check: ${!hasBlankTrailingPage ? 'PASS (Clean)' : 'FAIL (Blank Trailing Page)'}`);
    console.log(`✓ Total Clickable Hyperlinks: ${totalLinksFound}`);

    testReport.push({
      caseKey,
      success: true,
      filename: result.filename,
      filePath: pdfPath,
      fileSizeKb: (pdfBuffer.length / 1024).toFixed(1),
      numPages,
      isA4: isA4Width && isA4Height,
      hasBlankTrailingPage,
      totalLinksFound,
      pagesData,
      snippet: allExtractedText.slice(0, 300).replace(/\s+/g, ' '),
    });
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log('               PHASE C.1 QA TEST RESULTS SUMMARY              ');
  console.log('===============================================================\n');

  let passedCount = 0;
  for (const report of testReport) {
    const isPassing =
      report.success &&
      report.isA4 &&
      !report.hasBlankTrailingPage;

    if (isPassing) passedCount++;

    console.log(
      `[${isPassing ? 'PASS' : 'FAIL'}] ${report.caseKey.toUpperCase().padEnd(8)}: Pages=${report.numPages} | Size=${report.fileSizeKb}KB | A4=${report.isA4} | Links=${report.totalLinksFound}`
    );
  }

  console.log(`\nFinal Score: ${passedCount} / ${testReport.length} Test Cases Passed.`);

  // Write detailed JSON report to disk
  fs.writeFileSync(
    path.join(artifactsDir, 'qa-summary-report.json'),
    JSON.stringify(testReport, null, 2)
  );
  console.log(`Detailed QA report written to: ${path.join(artifactsDir, 'qa-summary-report.json')}`);

  if (passedCount !== testReport.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
