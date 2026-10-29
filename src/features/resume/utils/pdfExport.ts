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
  mode?: 'searchable' | 'raster';
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
  mode = 'searchable',
  onProgress,
}: PdfExportOptions): Promise<PdfExportResult> {
  const filename = generatePdfFilename(fullName);
  let clone: HTMLElement | null = null;

  try {
    onProgress?.('preparing', 'Preparing document for PDF export...');

    // 1. Wait for custom web fonts (Inter, serif fonts) to fully render
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
      } catch {
        // Fallback gracefully
      }
    }

    // 2. Find target element in DOM with intelligent discovery
    let target: HTMLElement | null = sourceElement || null;

    if (!target && elementId) {
      target = document.getElementById(elementId);
    }

    // If target not found or hidden, search for any visible resume root
    if (!target || target.offsetWidth === 0 || target.offsetHeight === 0) {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(
          '#resume-final-preview-document, #resume-a4-document, .resume-a4-root'
        )
      );
      target =
        candidates.find((el) => el.offsetWidth > 100 && el.offsetHeight > 100) ||
        candidates[0] ||
        null;
    }

    if (!target) {
      throw new Error(`Resume document was not found or is currently hidden.`);
    }

    // 3. Clone the element for off-screen preparation
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
    clone.style.top = '0';
    clone.style.left = '-10000px'; // Off-screen to avoid visual disturbance
    clone.style.zIndex = '-9999';
    clone.style.backgroundColor = '#FFFFFF';
    clone.style.color = '#101010';
    clone.style.display = 'block';

    // 4. Pre-sanitize all elements in the clone using computed styles from original DOM
    const origElements = Array.from(target.querySelectorAll('*')) as HTMLElement[];
    const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

    cloneElements.forEach((clonedEl, i) => {
      const origEl = origElements[i] || clonedEl;
      sanitizeElementColors(clonedEl, origEl.ownerDocument?.defaultView || window);
    });
    sanitizeElementColors(clone, target.ownerDocument?.defaultView || window);

    // 5. Ensure all images are loaded and have crossOrigin set
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        img.setAttribute('crossOrigin', 'anonymous');
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve(true);
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
          setTimeout(() => resolve(true), 1200);
        });
      })
    );

    document.body.appendChild(clone);

    // Wait briefly for layout reflow and font metric settlement
    await new Promise((resolve) => setTimeout(resolve, 80));

    // 6. Non-Disruptive Margin-Based Page Break Splitting
    const pageHeightPx = 1123;
    const cloneTop = clone.getBoundingClientRect().top;

    const breakEntries = Array.from(
      clone.querySelectorAll<HTMLElement>('.resume-entry, [data-section-entry]')
    );
    const breakHeaders = Array.from(
      clone.querySelectorAll<HTMLElement>('.resume-section-header, .break-after-avoid')
    );

    // Up to 5 potential pages
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
      const boundaryY = pageNum * pageHeightPx;

      // Check orphan section headers within 50px of page boundary
      const orphanHeader = breakHeaders.find((h) => {
        const rect = h.getBoundingClientRect();
        const topRel = rect.top - cloneTop;
        return topRel > boundaryY - 50 && topRel < boundaryY;
      });

      if (orphanHeader) {
        const topRel = orphanHeader.getBoundingClientRect().top - cloneTop;
        const push = boundaryY - topRel + 16;
        orphanHeader.style.marginTop = `${push}px`;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Check entries that start before the boundary and cross it
      const straddlingEntry = breakEntries.find((el) => {
        const rect = el.getBoundingClientRect();
        const topRel = rect.top - cloneTop;
        const bottomRel = rect.bottom - cloneTop;
        return (
          topRel < boundaryY - 10 &&
          bottomRel > boundaryY &&
          topRel > (pageNum - 1) * pageHeightPx + 80
        );
      });

      if (straddlingEntry) {
        const topRel = straddlingEntry.getBoundingClientRect().top - cloneTop;
        const push = boundaryY - topRel + 16;
        if (push > 0 && push < pageHeightPx - 60) {
          straddlingEntry.style.marginTop = `${push}px`;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }
    }

    // 7. Capture clickable link positions for PDF annotation layer
    const cloneRect = clone.getBoundingClientRect();
    const linkElements: { href: string; rect: DOMRect }[] = [];
    const anchorTags = Array.from(clone.querySelectorAll<HTMLAnchorElement>('a[href]'));

    anchorTags.forEach((a) => {
      const rawHref = a.getAttribute('href');
      if (rawHref && rawHref.trim() && rawHref !== '#') {
        const rect = a.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          let href = rawHref.trim();
          if (
            !href.startsWith('http://') &&
            !href.startsWith('https://') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:')
          ) {
            href = `https://${href}`;
          }
          linkElements.push({ href, rect });
        }
      }
    });

    onProgress?.('rendering', 'Rendering high-resolution A4 pages...');

    // 8. Execute html2canvas with sanitized styles in cloned document
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x high-resolution rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc, clonedTarget) => {
        if (clonedTarget) {
          clonedTarget.style.left = '0';
          clonedTarget.style.top = '0';
          clonedTarget.style.position = 'static';
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.backgroundColor = '#FFFFFF';
        }

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
      },
    });

    onProgress?.('processing', 'Assembling pages & embedding links...');

    // 9. Multi-page A4 PDF Assembly using Discrete Page Slices
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

    // Detect actual content bottom to prevent accidental blank pages
    let contentBottomY = canvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        const scanHeight = Math.min(canvas.height, Math.round(canvasPageHeight * 0.45));
        const startY = canvas.height - scanHeight;
        const imgData = ctx.getImageData(0, startY, canvas.width, scanHeight);
        const data = imgData.data;
        let found = false;

        // Scan backwards from bottom for non-background pixels
        for (let y = scanHeight - 1; y >= 0; y -= 2) {
          for (let x = 0; x < canvas.width; x += 12) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a > 20 && (r < 248 || g < 248 || b < 248)) {
              contentBottomY = startY + y;
              found = true;
              break;
            }
          }
          if (found) break;
        }
      } catch {
        contentBottomY = canvas.height;
      }
    }

    const effectiveHeight = Math.min(canvas.height, contentBottomY + 16);
    const totalPages = Math.max(1, Math.ceil(effectiveHeight / canvasPageHeight));

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Create an individual page canvas of exact A4 aspect ratio
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = canvasPageHeight;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        pageCtx.fillStyle = '#FFFFFF';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        const sourceY = p * canvasPageHeight;
        const sourceHeight = Math.min(canvasPageHeight, canvas.height - sourceY);

        if (sourceHeight > 0) {
          pageCtx.drawImage(
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

    // 10. Embed clickable hyperlink annotations (email, LinkedIn, GitHub, demo, repo)
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
            Math.max(wInMm, 4),
            Math.max(hInMm, 3),
            { url: href }
          );
        } catch {
          // Ignore annotation errors on marginal boundaries
        }
      }
    });

    // 11. Embed selectable and searchable text layer (PDF Standard Mode 3: invisible text)
    if (mode !== 'raster') {
      try {
        onProgress?.('processing', 'Embedding selectable & searchable text layer...');
        const textLines = extractTextLayerFromElement(clone, cloneRect);
        applyTextLayerToPdf(pdf, textLines, cloneRect, pxToMm, a4HeightMm, totalPages);
      } catch (textLayerErr) {
        console.warn(
          '[ProFile PDF Export]: Text layer extraction failed, falling back to raster-only:',
          textLayerErr
        );
      }
    }

    onProgress?.('saving', 'Saving PDF file to downloads...');

    // 12. Download directly
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

/**
 * Convenient explicit fallback to original raster-only exporter if ever needed
 */
export async function exportResumeToPdfRasterFallback(
  options: PdfExportOptions
): Promise<PdfExportResult> {
  return exportResumeToPdf({
    ...options,
    mode: 'raster',
  });
}

export interface ExtractedTextLine {
  text: string;
  leftPx: number;
  topPx: number;
  rightPx: number;
  bottomPx: number;
  fontSizePt: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Extracts visible text fragments from the rendered DOM clone in logical reading order
 * and groups words on the same line together into clean phrases.
 */
export function extractTextLayerFromElement(
  container: HTMLElement,
  containerRect: DOMRect
): ExtractedTextLine[] {
  const doc = container.ownerDocument || document;
  const win = doc.defaultView || window;
  const lines: ExtractedTextLine[] = [];

  // Discover all visible text nodes in document DOM reading order
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      const text = node.textContent;
      if (!text || !text.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (
        tag === 'script' ||
        tag === 'style' ||
        tag === 'svg' ||
        tag === 'path' ||
        tag === 'noscript' ||
        tag === 'canvas'
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  interface RawWord {
    text: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    fontSizePt: number;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
  }

  const words: RawWord[] = [];
  const range = doc.createRange();

  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    const textNode = currentNode as Text;
    const rawText = (textNode.textContent || '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');

    const parent = textNode.parentElement;
    if (parent && rawText.trim()) {
      let compStyle: CSSStyleDeclaration | null = null;
      try {
        compStyle = win.getComputedStyle(parent);
      } catch {
        // Fallback gracefully
      }

      const isHidden =
        compStyle &&
        (compStyle.display === 'none' ||
          compStyle.visibility === 'hidden' ||
          compStyle.opacity === '0');

      if (!isHidden) {
        const fontSizePx = compStyle ? parseFloat(compStyle.fontSize) || 12 : 12;
        // 1 CSS px at 96 DPI = 0.75 pt (72/96)
        const fontSizePt = Math.max(6, Math.min(36, fontSizePx * 0.75));
        const fontFamily = compStyle?.fontFamily || 'helvetica';
        const fontWeight = compStyle?.fontWeight || 'normal';
        const fontStyle = compStyle?.fontStyle || 'normal';
        const isBold =
          fontWeight === 'bold' ||
          fontWeight === 'bolder' ||
          parseInt(fontWeight, 10) >= 600;
        const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

        const wordRegex = /\S+/g;
        let match: RegExpExecArray | null;

        while ((match = wordRegex.exec(rawText)) !== null) {
          const wordStr = match[0];
          const startIdx = match.index;
          const endIdx = startIdx + wordStr.length;

          try {
            range.setStart(textNode, startIdx);
            range.setEnd(textNode, endIdx);
            const rect = range.getBoundingClientRect();

            if (rect.width > 0 && rect.height > 0) {
              words.push({
                text: wordStr,
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                fontSizePt,
                fontFamily,
                isBold,
                isItalic,
              });
            }
          } catch {
            const parentRect = parent.getBoundingClientRect();
            if (parentRect.width > 0 && parentRect.height > 0) {
              words.push({
                text: wordStr,
                left: parentRect.left,
                top: parentRect.top,
                right: parentRect.right,
                bottom: parentRect.bottom,
                fontSizePt,
                fontFamily,
                isBold,
                isItalic,
              });
            }
          }
        }
      }
    }

    currentNode = walker.nextNode();
  }

  // Group contiguous words on the same horizontal line
  let currentLine: ExtractedTextLine | null = null;

  for (const w of words) {
    if (!currentLine) {
      currentLine = {
        text: w.text,
        leftPx: w.left,
        topPx: w.top,
        rightPx: w.right,
        bottomPx: w.bottom,
        fontSizePt: w.fontSizePt,
        fontFamily: w.fontFamily,
        isBold: w.isBold,
        isItalic: w.isItalic,
      };
      continue;
    }

    const vertDiff = Math.abs(w.top - currentLine.topPx);
    const horizGap = w.left - currentLine.rightPx;
    const maxVertDiff = Math.max(3.5, (currentLine.bottomPx - currentLine.topPx) * 0.45);
    const maxHorizGap = Math.max(32, currentLine.fontSizePt * 2.8);

    const isSameLine =
      vertDiff <= maxVertDiff &&
      horizGap >= -4 &&
      horizGap <= maxHorizGap;

    if (isSameLine) {
      currentLine.text += ' ' + w.text;
      currentLine.rightPx = Math.max(currentLine.rightPx, w.right);
      currentLine.bottomPx = Math.max(currentLine.bottomPx, w.bottom);
    } else {
      lines.push(currentLine);
      currentLine = {
        text: w.text,
        leftPx: w.left,
        topPx: w.top,
        rightPx: w.right,
        bottomPx: w.bottom,
        fontSizePt: w.fontSizePt,
        fontFamily: w.fontFamily,
        isBold: w.isBold,
        isItalic: w.isItalic,
      };
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Places the extracted text lines into jsPDF using Text Rendering Mode 3 (invisible text)
 * at the exact coordinates on each page.
 */
export function applyTextLayerToPdf(
  pdf: jsPDF,
  lines: ExtractedTextLine[],
  cloneRect: DOMRect,
  pxToMm: number,
  a4HeightMm: number,
  totalPages: number
): void {
  for (const line of lines) {
    const rawText = line.text;
    if (!rawText || !rawText.trim()) continue;

    // Normalize quotes and dashes to standard characters for universal searchability and clipboard copy
    const cleanText = rawText
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2022/g, '•')
      .trim();

    if (!cleanText) continue;

    const relX = line.leftPx - cloneRect.left;
    const relY = line.topPx - cloneRect.top;
    const xMm = relX * pxToMm;
    const totalYMm = relY * pxToMm;

    const targetPage = Math.floor(totalYMm / a4HeightMm) + 1;
    const yOnPageMm = totalYMm % a4HeightMm;

    if (targetPage >= 1 && targetPage <= totalPages) {
      try {
        pdf.setPage(targetPage);

        // Map CSS font family to standard PDF font
        let pdfFont = 'helvetica';
        const fam = line.fontFamily.toLowerCase();
        if (fam.includes('times') || fam.includes('georgia') || fam.includes('cambria') || fam.includes('serif')) {
          pdfFont = 'times';
        } else if (fam.includes('mono') || fam.includes('courier') || fam.includes('code') || fam.includes('consolas')) {
          pdfFont = 'courier';
        }

        const fontStyle = line.isBold
          ? line.isItalic
            ? 'bolditalic'
            : 'bold'
          : line.isItalic
          ? 'italic'
          : 'normal';

        pdf.setFont(pdfFont, fontStyle);
        pdf.setFontSize(line.fontSizePt);

        // Adjust character spacing subtly to align selection highlight with text length
        const lineWidthMm = (line.rightPx - line.leftPx) * pxToMm;
        const textWidthMm = pdf.getTextWidth(cleanText);
        let charSpace: number | undefined = undefined;

        if (cleanText.length > 2 && textWidthMm > 0) {
          const diffMm = lineWidthMm - textWidthMm;
          const computedCharSpace = diffMm / (cleanText.length - 1);
          if (computedCharSpace >= -0.25 && computedCharSpace <= 0.8) {
            charSpace = computedCharSpace;
          }
        }

        pdf.text(cleanText, Math.max(0, xMm), Math.max(0, yOnPageMm), {
          baseline: 'top',
          renderingMode: 'invisible',
          ...(charSpace !== undefined ? { charSpace } : {}),
        });
      } catch {
        try {
          pdf.text(cleanText, Math.max(0, xMm), Math.max(0, yOnPageMm), {
            baseline: 'top',
            renderingMode: 'invisible',
          });
        } catch {
          // Ignore individual line placement errors
        }
      }
    }
  }
}

