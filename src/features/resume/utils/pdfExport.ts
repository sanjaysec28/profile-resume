/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — High-Reliability A4 PDF Generator
 * 
 * Fixes "Attempting to parse an unsupported color function 'oklab'" by:
 * 1. Pre-sanitizing computed styles and inline styles of all elements before export
 * 2. Converting CSS Color Module 4 functions (oklab, oklch, color-mix, lab, lch)
 *    to standard sRGB HEX / RGBA values using Canvas2D and mathematical converters
 * 3. Sanitizing cloned stylesheets and rules in the html2canvas sandbox
 * 4. Preserving standard A4 portrait sizing, multi-page pagination, clickable links,
 *    and uploaded profile photos
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  replaceUnsupportedColorFunctions,
  sanitizeElementColors,
} from './colorConverter.ts';

export interface PdfExportOptions {
  elementId?: string;
  sourceElement?: HTMLElement;
  fullName?: string;
  onProgress?: (
    step: 'preparing' | 'rendering' | 'processing' | 'saving' | 'complete' | 'error',
    message: string
  ) => void;
}

export interface PdfExportResult {
  success: boolean;
  filename: string;
  error?: string;
}

/**
 * Generate a clean, meaningful filename: ProFile_[FirstName]_Resume.pdf
 */
export function generatePdfFilename(fullName?: string): string {
  if (!fullName || !fullName.trim()) {
    return 'ProFile_Resume.pdf';
  }
  const firstName = fullName
    .trim()
    .split(/\s+/)[0]
    .replace(/[^a-zA-Z0-9_-]/g, '');

  return `ProFile_${firstName || 'Student'}_Resume.pdf`;
}

/**
 * Export the resume element directly to an A4 PDF with guaranteed color compatibility
 * and pixel-accurate layout identical to the live preview.
 */
export async function exportResumeToPdf({
  elementId = 'resume-a4-document',
  sourceElement,
  fullName,
  onProgress,
}: PdfExportOptions): Promise<PdfExportResult> {
  const filename = generatePdfFilename(fullName);
  let clone: HTMLElement | null = null;

  try {
    onProgress?.('preparing', 'Preparing document for PDF export...');

    // 1. Find target element in DOM with intelligent discovery
    let target: HTMLElement | null = sourceElement || null;

    if (!target && elementId) {
      target = document.getElementById(elementId);
    }

    // If target not found or hidden (e.g., inside hidden column), search for any visible resume root
    if (!target || target.offsetWidth === 0 || target.offsetHeight === 0) {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#resume-final-preview-document, #resume-a4-document, .resume-a4-root'
        )
      );
      // Prefer candidate with visible layout dimensions
      target = candidates.find((el) => el.offsetWidth > 100 && el.offsetHeight > 100) || candidates[0] || null;
    }

    if (!target) {
      throw new Error(`Resume document was not found or is currently hidden.`);
    }

    // 2. Clone the element for off-screen preparation
    clone = target.cloneNode(true) as HTMLElement;
    clone.id = 'resume-export-clone';

    // Remove any screen-specific preview scales/zooms and drop shadows
    clone.style.transform = 'none';
    clone.style.webkitTransform = 'none';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.width = '794px'; // 210mm at 96 DPI
    clone.style.minWidth = '794px';
    clone.style.maxWidth = '794px';
    clone.style.minHeight = '1123px'; // 297mm at 96 DPI
    clone.style.position = 'fixed';
    clone.style.top = '-99999px';
    clone.style.left = '-99999px';
    clone.style.zIndex = '-9999';
    clone.style.backgroundColor = '#FFFFFF';
    clone.style.color = '#101010';
    clone.style.display = 'block';

    // 3. Pre-sanitize all elements in the clone using computed styles from original DOM
    const origElements = Array.from(target.querySelectorAll('*')) as HTMLElement[];
    const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

    cloneElements.forEach((clonedEl, i) => {
      const origEl = origElements[i] || clonedEl;
      sanitizeElementColors(clonedEl, origEl.ownerDocument?.defaultView || window);
    });
    sanitizeElementColors(clone, target.ownerDocument?.defaultView || window);

    // Ensure all images are loaded and have crossOrigin set
    const images = Array.from(clone.querySelectorAll('img'));
    images.forEach((img) => {
      img.setAttribute('crossOrigin', 'anonymous');
    });

    document.body.appendChild(clone);

    // Wait briefly for layout calculation
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 4. Smart Element-Aware Page Break Splitting
    // An A4 page at 794px width has an exact height of 1123px.
    const pageHeightPx = 1123;
    const cloneTop = clone.getBoundingClientRect().top;

    // Scan for break-sensitive items: entries, section titles, headings
    const breakItems = Array.from(
      clone.querySelectorAll<HTMLElement>(
        '.resume-entry, .resume-section-header, .break-inside-avoid, [data-section]'
      )
    );

    // If an item straddles a page boundary (starts before and ends after k * pageHeightPx),
    // we insert a clean spacer element right before it to push it to the next page.
    let pageCountLimit = 6; // Safety ceiling
    for (let pageNum = 1; pageNum <= pageCountLimit; pageNum++) {
      const boundaryY = pageNum * pageHeightPx;
      const straddlingItem = breakItems.find((el) => {
        const rect = el.getBoundingClientRect();
        const topRelativeToClone = rect.top - cloneTop;
        const bottomRelativeToClone = rect.bottom - cloneTop;
        // Check if item crosses the boundary and starts reasonably close to it
        return (
          topRelativeToClone < boundaryY - 15 &&
          bottomRelativeToClone > boundaryY &&
          topRelativeToClone > (pageNum - 1) * pageHeightPx + 100
        );
      });

      if (straddlingItem && straddlingItem.parentElement) {
        const itemTop = straddlingItem.getBoundingClientRect().top - cloneTop;
        const spacerHeight = boundaryY - itemTop;
        if (spacerHeight > 10 && spacerHeight < pageHeightPx - 50) {
          const spacer = document.createElement('div');
          spacer.className = 'resume-export-page-spacer';
          spacer.style.height = `${spacerHeight}px`;
          spacer.style.width = '100%';
          spacer.style.display = 'block';
          straddlingItem.parentElement.insertBefore(spacer, straddlingItem);
          // Wait for reflow
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
      }
    }

    // 5. Capture clickable link positions for PDF annotation layer
    const cloneRect = clone.getBoundingClientRect();
    const linkElements: { href: string; rect: DOMRect; text: string }[] = [];
    const anchorTags = Array.from(clone.querySelectorAll<HTMLAnchorElement>('a[href]'));

    anchorTags.forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.trim() && href !== '#') {
        const rect = a.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          linkElements.push({
            href: href.trim(),
            rect,
            text: a.innerText || href,
          });
        }
      }
    });

    onProgress?.('rendering', 'Rendering high-resolution A4 pages...');

    // 6. Execute html2canvas with sanitized styles in cloned document
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x high-resolution rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 794,
      onclone: (clonedDoc, clonedTarget) => {
        // Sanitize all <style> elements in the cloned document
        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
        styleTags.forEach((tag) => {
          const rawCss = tag.textContent || '';
          if (
            rawCss.includes('oklab') ||
            rawCss.includes('oklch') ||
            rawCss.includes('color-mix') ||
            rawCss.includes('lab(') ||
            rawCss.includes('lch(')
          ) {
            tag.textContent = replaceUnsupportedColorFunctions(rawCss);
          }
        });

        // Re-sanitize all cloned elements inside clonedDoc
        const allClonedNodes = Array.from(clonedDoc.querySelectorAll('*')) as HTMLElement[];
        allClonedNodes.forEach((node) => {
          sanitizeElementColors(node, clonedDoc.defaultView || window);
        });

        if (clonedTarget) {
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.backgroundColor = '#FFFFFF';
        }
      },
    });

    onProgress?.('processing', 'Assembling pages & embedding links...');

    // 7. Multi-page A4 PDF Assembly using Discrete Page Slices
    const a4WidthMm = 210;
    const a4HeightMm = 297;
    const pxToMm = a4WidthMm / cloneRect.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Height of one A4 page in canvas pixels
    const canvasPageHeight = Math.round((canvas.width * a4HeightMm) / a4WidthMm);

    // Calculate total pages: if trailing content is less than 30px (e.g., whitespace padding), don't create extra page
    const totalPages = Math.max(1, Math.ceil((canvas.height - 30) / canvasPageHeight));

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Create an individual page canvas of exact A4 aspect ratio
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = canvasPageHeight;
      const ctx = pageCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        const sourceY = p * canvasPageHeight;
        const sourceHeight = Math.min(canvasPageHeight, canvas.height - sourceY);

        if (sourceHeight > 0) {
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );
        }
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(pageImgData, 'JPEG', 0, 0, a4WidthMm, a4HeightMm, undefined, 'FAST');
    }

    // 8. Embed clickable hyperlink annotations (email, LinkedIn, GitHub, demo, repo)
    linkElements.forEach(({ href, rect }) => {
      const xInMm = (rect.left - cloneRect.left) * pxToMm;
      const totalYInMm = (rect.top - cloneRect.top) * pxToMm;
      const wInMm = rect.width * pxToMm;
      const hInMm = rect.height * pxToMm;

      // Determine which page this link lands on
      const targetPage = Math.floor(totalYInMm / a4HeightMm) + 1;
      const yOnPageInMm = totalYInMm % a4HeightMm;

      if (targetPage <= totalPages) {
        try {
          pdf.setPage(targetPage);
          pdf.link(
            Math.max(0, xInMm),
            Math.max(0, yOnPageInMm),
            Math.max(wInMm, 5),
            Math.max(hInMm, 3.5),
            { url: href }
          );
        } catch {
          // Ignore annotation errors on marginal boundaries
        }
      }
    });

    onProgress?.('saving', 'Saving PDF file to downloads...');

    // 9. Download directly
    pdf.save(filename);

    onProgress?.('complete', `Downloaded: ${filename}`);

    return {
      success: true,
      filename,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unknown error during PDF generation';
    console.error('[ProFile PDF Export Error]:', err);
    onProgress?.('error', `PDF generation failed: ${errorMsg}`);
    return {
      success: false,
      filename,
      error: errorMsg,
    };
  } finally {
    // Clean up temporary DOM clone
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}
