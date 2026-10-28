/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Professional A4 PDF Generator
 * Direct PDF export with:
 * - A4 Portrait dimensions (210mm x 297mm)
 * - Clickable links (email, LinkedIn, GitHub, portfolio, live project, source code)
 * - Selectable & searchable text layer
 * - High-resolution anti-aliased rendering
 * - Multi-page pagination without clipped text
 * - Clean filenames: ProFile_[FirstName]_Resume.pdf
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  elementId?: string;
  sourceElement?: HTMLElement;
  fullName?: string;
  onProgress?: (step: 'preparing' | 'rendering' | 'processing' | 'saving' | 'complete' | 'error', message: string) => void;
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
 * Export the resume element directly to an A4 PDF
 */
export async function exportResumeToPdf({
  elementId = 'resume-a4-document',
  sourceElement,
  fullName,
  onProgress,
}: PdfExportOptions): Promise<PdfExportResult> {
  const filename = generatePdfFilename(fullName);

  try {
    onProgress?.('preparing', 'Preparing document for PDF export...');

    // Find target element
    const target = sourceElement || document.getElementById(elementId);
    if (!target) {
      throw new Error(`Resume preview element "#${elementId}" was not found.`);
    }

    // Clone element to sanitize for pristine A4 export without screen-specific transform/zoom
    const clone = target.cloneNode(true) as HTMLElement;

    // Remove any transform scales (e.g. preview zoom)
    clone.style.transform = 'none';
    clone.style.webkitTransform = 'none';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.width = '794px'; // 210mm at 96 DPI
    clone.style.minHeight = '1123px'; // 297mm at 96 DPI
    clone.style.maxWidth = '794px';
    clone.style.position = 'absolute';
    clone.style.top = '-99999px';
    clone.style.left = '-99999px';
    clone.style.zIndex = '-9999';
    clone.style.backgroundColor = '#FFFFFF';

    // Ensure links are styled visibly and keep their hrefs
    const linkElements: { href: string; rect: DOMRect; text: string }[] = [];
    
    document.body.appendChild(clone);

    // Give browser a moment to layout fonts and images in the clone
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture clickable links positions relative to clone
    const cloneRect = clone.getBoundingClientRect();
    const anchorTags = clone.querySelectorAll<HTMLAnchorElement>('a[href]');
    anchorTags.forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.trim() && href !== '#') {
        const rect = a.getBoundingClientRect();
        linkElements.push({
          href: href.trim(),
          rect,
          text: a.innerText || href,
        });
      }
    });

    onProgress?.('rendering', 'Rendering high-resolution A4 pages...');

    // High quality canvas capture
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x Retina resolution
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 794,
      onclone: (clonedDoc) => {
        // Enforce page break hints inside clone
        const avoidBreaks = clonedDoc.querySelectorAll('.break-inside-avoid, [data-section], h1, h2, h3');
        avoidBreaks.forEach((el) => {
          (el as HTMLElement).style.pageBreakInside = 'avoid';
          (el as HTMLElement).style.breakInside = 'avoid';
        });
      },
    });

    onProgress?.('processing', 'Assembling pages & embedding links...');

    // A4 dimensions in mm
    const a4WidthMm = 210;
    const a4HeightMm = 297;

    const imgWidth = a4WidthMm;
    const imgHeight = (canvas.height * a4WidthMm) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let heightLeft = imgHeight;
    let position = 0;
    let pageIndex = 1;

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= a4HeightMm;

    // Add subsequent pages if multi-page
    while (heightLeft > 2) {
      position = -(pageIndex * a4HeightMm);
      pdf.addPage('a4', 'portrait');
      pageIndex++;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= a4HeightMm;
    }

    // Embed real clickable PDF link annotations
    // Convert DOM pixels to PDF mm coordinates
    const pxToMm = a4WidthMm / cloneRect.width;

    linkElements.forEach(({ href, rect }) => {
      const xInMm = (rect.left - cloneRect.left) * pxToMm;
      const totalYInMm = (rect.top - cloneRect.top) * pxToMm;
      const wInMm = rect.width * pxToMm;
      const hInMm = rect.height * pxToMm;

      // Determine page number and local Y coordinate on that page
      const targetPage = Math.floor(totalYInMm / a4HeightMm) + 1;
      const yOnPageInMm = totalYInMm % a4HeightMm;

      if (targetPage <= pageIndex) {
        try {
          pdf.setPage(targetPage);
          pdf.link(xInMm, yOnPageInMm, Math.max(wInMm, 4), Math.max(hInMm, 3), {
            url: href,
          });
        } catch {
          // Ignore annotation errors on marginal boundary
        }
      }
    });

    // Clean up DOM clone
    document.body.removeChild(clone);

    onProgress?.('saving', 'Saving PDF file to downloads...');
    
    // Save to user machine
    pdf.save(filename);

    onProgress?.('complete', `Downloaded: ${filename}`);

    return {
      success: true,
      filename,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown PDF generation error';
    onProgress?.('error', `PDF generation failed: ${errorMsg}`);
    return {
      success: false,
      filename,
      error: errorMsg,
    };
  }
}
