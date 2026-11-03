/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — High-Reliability A4 PDF Generator & Deterministic Pagination Engine
 * 
 * Key Architecture Highlights (Phase C):
 * 1. Deterministic Forward-Pass Pagination: Replaces the cascading margin-push approach
 *    with a single-pass spacer algorithm based on stable initial layout measurements.
 * 2. Strict A4 Geometry: Standard 210mm x 297mm (794px x 1123px at 96 DPI) with 2x
 *    high-density retina rasterization.
 * 3. DOM Isolation: Operates on a dedicated off-screen full-scale clone (1x zoom),
 *    independent of any preview zoom or responsive viewport constraints.
 * 4. Layout-Based Content Boundary Detection: Measures actual text and media node bottoms,
 *    eliminating false-positive blank pages caused by off-white or ivory backgrounds.
 * 5. Widow/Orphan Header Prevention: Guarantees section headings stay attached to their
 *    first entry, moving both cleanly to the next page when space is insufficient.
 * 6. Two-Column Compatibility: Independent column pagination preserving continuous
 *    sidebar background geometry for the Contemporary Sidebar template.
 * 7. Asset Resilience: Waits for custom fonts and images (e.g. Cloudinary) to resolve,
 *    gracefully handling broken URLs without failing the export pipeline.
 * 8. Searchable Text & Active Links: PDF Standard Text Rendering Mode 3 (invisible text)
 *    and exact coordinate-mapped hyperlink annotations.
 * 9. CSS Color 4 Sanitization: Full W3C sRGB conversion of modern oklab/oklch/color-mix.
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
  autoDownload?: boolean;
  onProgress?: (
    step: 'preparing' | 'rendering' | 'processing' | 'saving' | 'complete' | 'error',
    message: string
  ) => void;
}

export interface PdfExportResult {
  success: boolean;
  filename: string;
  error?: string;
  totalPages?: number;
  pdfBase64?: string;
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

// Canonical A4 Specifications at 96 DPI
export const A4_WIDTH_PX = 794;
export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PX_TO_MM = A4_WIDTH_MM / A4_WIDTH_PX; // ~0.2644836

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

interface PaginationMetrics {
  pageHeightPx: number;
  topMarginPx: number;
  bottomMarginPx: number;
  usablePageHeight: number;
}

/**
 * Accurately measures the furthest vertical extent of real content (text nodes and media),
 * ignoring background colors, borders, or container heights to eliminate trailing blank pages.
 */
function getActualContentBottom(container: HTMLElement, referenceTop: number): number {
  const contentElements = container.querySelectorAll<HTMLElement>(
    'p, span, h1, h2, h3, h4, h5, h6, li, a, img, svg, canvas, .resume-entry, .resume-section'
  );
  let maxBottom = 0;
  contentElements.forEach((el) => {
    const hasText = Boolean(el.textContent && el.textContent.trim().length > 0);
    const isMedia = el.tagName === 'IMG' || el.tagName === 'SVG' || el.tagName === 'CANVAS';
    if (hasText || isMedia) {
      const rect = el.getBoundingClientRect();
      const b = rect.bottom - referenceTop;
      if (b > maxBottom) {
        maxBottom = b;
      }
    }
  });
  return maxBottom;
}

/**
 * Deterministically paginates a single container column in forward order.
 * Inserts precise page-break spacer blocks without mutating existing margins or coordinates.
 */
function paginateColumn(
  columnEl: HTMLElement,
  containerTop: number,
  metrics: PaginationMetrics,
  maxPages: number = 6
): void {
  const { pageHeightPx, topMarginPx, bottomMarginPx, usablePageHeight } = metrics;

  // Collect candidate break elements in strict DOM reading order
  const rawBreakItems = Array.from(
    columnEl.querySelectorAll<HTMLElement>(
      '.resume-entry, .resume-section-header, .resume-section.break-inside-avoid'
    )
  );

  // Filter to top-level atomic units so we don't process nested children twice
  const atomicUnits = rawBreakItems.filter((el) => {
    let parent = el.parentElement;
    while (parent && parent !== columnEl) {
      if (rawBreakItems.includes(parent)) {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  });

  if (atomicUnits.length === 0) return;

  let currentPage = 1;

  for (let i = 0; i < atomicUnits.length; i++) {
    if (currentPage >= maxPages) break;

    const unit = atomicUnits[i];
    const unitRect = unit.getBoundingClientRect();
    const unitTop = unitRect.top - containerTop;
    const unitBottom = unitRect.bottom - containerTop;
    const unitHeight = unitBottom - unitTop;

    // Advance currentPage tracker if this unit already naturally lands on a subsequent page
    const currentPageBoundary = currentPage * pageHeightPx;
    if (unitTop >= currentPageBoundary) {
      currentPage = Math.floor(unitTop / pageHeightPx) + 1;
    }

    const currentLimit = currentPage * pageHeightPx - bottomMarginPx;
    const nextPageTop = currentPage * pageHeightPx + topMarginPx;

    // Check if unit crosses the usable bottom threshold for the current page
    if (unitBottom > currentLimit && unitTop < currentLimit) {
      // If the unit is exceptionally tall (> usable page height), let it flow naturally
      if (
        unitHeight > usablePageHeight &&
        unitTop <= (currentPage - 1) * pageHeightPx + topMarginPx + 40
      ) {
        continue;
      }

      // Check if this unit is an entry and would leave an orphan section header
      let targetToMove: HTMLElement = unit;
      const section = unit.closest<HTMLElement>('.resume-section');
      const sectionHeader = section?.querySelector<HTMLElement>('.resume-section-header');

      if (sectionHeader && sectionHeader !== unit && section?.contains(unit)) {
        const headerRect = sectionHeader.getBoundingClientRect();
        const headerTop = headerRect.top - containerTop;
        const headerPage = Math.floor(headerTop / pageHeightPx) + 1;

        // If the header is on the current page, check if moving this entry leaves the header stranded
        if (headerPage === currentPage) {
          const sectionEntries = Array.from(
            section.querySelectorAll<HTMLElement>('.resume-entry')
          );
          const entryIndex = sectionEntries.indexOf(unit);

          // If this is the first entry, or the header is close to the bottom limit, move header with entry!
          if (entryIndex <= 0 || headerTop > currentLimit - 75) {
            targetToMove = sectionHeader;
          }
        }
      }

      const targetRect = targetToMove.getBoundingClientRect();
      const targetTop = targetRect.top - containerTop;
      const spacerHeight = nextPageTop - targetTop;

      if (spacerHeight > 2 && spacerHeight < pageHeightPx) {
        const spacer = document.createElement('div');
        spacer.className = 'pdf-page-break-spacer';
        spacer.setAttribute('data-page-spacer', String(currentPage));
        spacer.style.display = 'block';
        spacer.style.width = '100%';
        spacer.style.height = `${Math.round(spacerHeight)}px`;
        spacer.style.margin = '0';
        spacer.style.padding = '0';
        spacer.style.border = 'none';
        spacer.style.clear = 'both';
        spacer.style.pointerEvents = 'none';

        targetToMove.parentNode?.insertBefore(spacer, targetToMove);
        currentPage++;
      }
    }
  }
}

/**
 * Applies deterministic pagination across single-column or two-column resume templates.
 */
function applyDeterministicPagination(
  container: HTMLElement,
  metrics: PaginationMetrics
): void {
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top;

  // Check if Two-Column layout (Contemporary Sidebar)
  const isTwoColumn = Boolean(container.querySelector('.grid-cols-12'));

  if (isTwoColumn) {
    const mainCol = container.querySelector<HTMLElement>('.col-span-8');
    const sideCol = container.querySelector<HTMLElement>('.col-span-4');

    if (mainCol) {
      paginateColumn(mainCol, containerTop, metrics);
    }
    if (sideCol) {
      paginateColumn(sideCol, containerTop, metrics);
    }
  } else {
    paginateColumn(container, containerTop, metrics);
  }
}

/**
 * Export the resume element directly to an A4 PDF with guaranteed color compatibility,
 * deterministic pagination, clickable links, and crisp typography.
 */
export async function exportResumeToPdf({
  elementId = 'resume-final-preview-document',
  sourceElement,
  fullName,
  mode = 'searchable',
  autoDownload = true,
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
        // Fallback gracefully if document.fonts is not supported
      }
    }

    // 2. Locate target element in DOM with intelligent discovery
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
      throw new Error('Resume document was not found or is currently hidden.');
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
    clone.style.width = `${A4_WIDTH_PX}px`;
    clone.style.minWidth = `${A4_WIDTH_PX}px`;
    clone.style.maxWidth = `${A4_WIDTH_PX}px`;
    clone.style.minHeight = `${A4_PAGE_HEIGHT_PX}px`;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '-10000px'; // Off-screen to avoid visual disturbance
    clone.style.zIndex = '-9999';
    clone.style.backgroundColor = '#FFFFFF';
    clone.style.color = '#101010';
    clone.style.display = 'block';
    clone.style.boxSizing = 'border-box';

    // 4. Pre-sanitize all elements in the clone using computed styles from original DOM
    const origElements = Array.from(target.querySelectorAll('*')) as HTMLElement[];
    const cloneElements = Array.from(clone.querySelectorAll('*')) as HTMLElement[];

    cloneElements.forEach((clonedEl, i) => {
      const origEl = origElements[i] || clonedEl;
      sanitizeElementColors(clonedEl, origEl.ownerDocument?.defaultView || window);
    });
    sanitizeElementColors(clone, target.ownerDocument?.defaultView || window);

    // 5. Ensure all images are loaded, have CORS set, and handle broken URLs gracefully
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        img.setAttribute('crossOrigin', 'anonymous');
        if (img.complete && img.naturalWidth !== 0) return Promise.resolve(true);
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => {
            // Replace broken image with transparent placeholder to avoid corrupting canvas
            img.style.display = 'none';
            resolve(true);
          };
          setTimeout(() => resolve(true), 1500);
        });
      })
    );

    document.body.appendChild(clone);

    // Wait briefly for layout reflow and font metric settlement
    await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 60)));

    // 6. Detect template padding and configure pagination metrics
    const computedStyle = window.getComputedStyle(clone);
    const padTop = parseFloat(computedStyle.paddingTop) || 36;
    const padBottom = parseFloat(computedStyle.paddingBottom) || 36;

    const topMarginPx = padTop > 0 ? padTop : 36;
    const bottomMarginPx = padBottom > 0 ? padBottom : 36;
    const usablePageHeight = A4_PAGE_HEIGHT_PX - topMarginPx - bottomMarginPx;

    const metrics: PaginationMetrics = {
      pageHeightPx: A4_PAGE_HEIGHT_PX,
      topMarginPx,
      bottomMarginPx,
      usablePageHeight,
    };

    // 7. Check if document naturally fits on 1 page before inserting any spacers
    const initialCloneRect = clone.getBoundingClientRect();
    const naturalContentBottom = getActualContentBottom(clone, initialCloneRect.top);

    if (naturalContentBottom > A4_PAGE_HEIGHT_PX - 12) {
      // Multi-page document: apply deterministic forward-pass pagination
      applyDeterministicPagination(clone, metrics);
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 40)));
    }

    // 8. Calculate exact page count based on real content extent (immune to background color false-positives)
    const cloneRect = clone.getBoundingClientRect();
    const finalContentBottom = getActualContentBottom(clone, cloneRect.top);
    const effectiveHeight = Math.max(A4_PAGE_HEIGHT_PX, finalContentBottom);

    let totalPages = Math.ceil((effectiveHeight - 12) / A4_PAGE_HEIGHT_PX);
    totalPages = Math.max(1, Math.min(6, totalPages));

    // Fix the clone height to exactly totalPages * A4_PAGE_HEIGHT_PX for clean canvas slicing
    clone.style.height = `${totalPages * A4_PAGE_HEIGHT_PX}px`;
    clone.style.minHeight = `${totalPages * A4_PAGE_HEIGHT_PX}px`;

    // 9. Capture clickable link positions for PDF annotation layer
    const linkElements: { href: string; rect: DOMRect }[] = [];
    const anchorTags = Array.from(clone.querySelectorAll<HTMLAnchorElement>('a[href]'));

    anchorTags.forEach((a) => {
      const rawHref = a.getAttribute('href');
      if (rawHref && rawHref.trim() && rawHref !== '#') {
        const rects = Array.from(a.getClientRects());
        const validRects = rects.length > 0 ? rects : [a.getBoundingClientRect()];

        let href = rawHref.trim();
        if (
          !href.startsWith('http://') &&
          !href.startsWith('https://') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:')
        ) {
          href = `https://${href}`;
        }

        validRects.forEach((rect) => {
          if (rect.width > 0 && rect.height > 0) {
            linkElements.push({ href, rect });
          }
        });
      }
    });

    onProgress?.('rendering', 'Rendering high-resolution A4 pages...');

    // 10. Execute html2canvas with sanitized styles in cloned document
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x high-resolution retina rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
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
          clonedTarget.style.transform = 'none';
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

    // 11. Multi-page A4 PDF Assembly using Discrete Page Slices
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Height of one A4 page in canvas pixels (scale 2 => 1123 * 2 = 2246 px)
    const canvasPageHeight = Math.round((canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM);

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
      pdf.addImage(pageImgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
    }

    // 12. Embed clickable hyperlink annotations (email, LinkedIn, GitHub, demo, repo)
    linkElements.forEach(({ href, rect }) => {
      const relX = rect.left - cloneRect.left;
      const totalY = rect.top - cloneRect.top;

      // Determine page index and on-page coordinates
      const pageIndex = Math.floor(totalY / A4_PAGE_HEIGHT_PX);
      const targetPage = pageIndex + 1;
      const yOnPagePx = totalY - pageIndex * A4_PAGE_HEIGHT_PX;

      if (targetPage >= 1 && targetPage <= totalPages) {
        const xMm = relX * PX_TO_MM;
        const yMm = yOnPagePx * PX_TO_MM;
        const wMm = Math.max(rect.width * PX_TO_MM, 4);
        const hMm = Math.max(rect.height * PX_TO_MM, 3);

        try {
          pdf.setPage(targetPage);
          pdf.link(Math.max(0, xMm), Math.max(0, yMm), wMm, hMm, { url: href });
        } catch {
          // Ignore individual annotation errors on marginal boundaries
        }
      }
    });

    // 13. Embed selectable and searchable text layer (PDF Standard Mode 3: invisible text)
    if (mode !== 'raster') {
      try {
        onProgress?.('processing', 'Embedding selectable & searchable text layer...');
        const textLines = extractTextLayerFromElement(clone, cloneRect);
        applyTextLayerToPdf(pdf, textLines, cloneRect, PX_TO_MM, A4_HEIGHT_MM, totalPages);
      } catch (textLayerErr) {
        console.warn(
          '[ProFile PDF Export]: Text layer extraction failed, falling back to raster-only:',
          textLayerErr
        );
      }
    }

    // 14. Download directly if enabled
    if (autoDownload !== false) {
      onProgress?.('saving', 'Saving PDF file to downloads...');
      pdf.save(filename);
      onProgress?.('complete', `Downloaded: ${filename}`);
    } else {
      onProgress?.('complete', `Generated: ${filename}`);
    }

    const pdfBase64 = pdf.output('datauristring');

    return {
      success: true,
      filename,
      totalPages,
      pdfBase64,
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

/**
 * Extracts visible text fragments from the rendered DOM clone in logical reading order
 * and groups words on the same line together into clean phrases.
 */
export function extractTextLayerFromElement(
  container: HTMLElement,
  _containerRect: DOMRect
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
  _a4HeightMm: number,
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
    const totalY = line.topPx - cloneRect.top;

    const pageIndex = Math.floor(totalY / A4_PAGE_HEIGHT_PX);
    const targetPage = pageIndex + 1;
    const yOnPagePx = totalY - pageIndex * A4_PAGE_HEIGHT_PX;

    const xMm = relX * pxToMm;
    const yMm = yOnPagePx * pxToMm;

    if (targetPage >= 1 && targetPage <= totalPages) {
      try {
        pdf.setPage(targetPage);

        // Map CSS font family to standard PDF font
        let pdfFont = 'helvetica';
        const fam = line.fontFamily.toLowerCase();
        if (
          fam.includes('times') ||
          fam.includes('georgia') ||
          fam.includes('cambria') ||
          fam.includes('serif')
        ) {
          pdfFont = 'times';
        } else if (
          fam.includes('mono') ||
          fam.includes('courier') ||
          fam.includes('code') ||
          fam.includes('consolas')
        ) {
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

        pdf.text(cleanText, Math.max(0, xMm), Math.max(0, yMm), {
          baseline: 'top',
          renderingMode: 'invisible',
          ...(charSpace !== undefined ? { charSpace } : {}),
        });
      } catch {
        try {
          pdf.text(cleanText, Math.max(0, xMm), Math.max(0, yMm), {
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
