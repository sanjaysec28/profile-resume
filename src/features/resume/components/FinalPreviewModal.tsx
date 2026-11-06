/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ResumeData, ResumeTemplateId } from '../../../types/resume.ts';
import { ACTIVE_RESUME_TEMPLATES, RESUME_TEMPLATES_CATALOG } from '../constants.ts';
import { ResumeLivePreview } from './ResumeLivePreview.tsx';
import { exportResumeToPdf } from '../utils/pdfExport.ts';
import { lockBodyScroll, unlockBodyScroll } from '../../../lib/scrollLock.ts';
import {
  Download,
  Edit3,
  Plus,
  Minus,
  RotateCcw,
  X,
  Check,
  LayoutTemplate,
  ShieldCheck,
  Loader2,
  Printer,
  AlertCircle,
} from 'lucide-react';

import { computePreExportChecklist } from '../../../lib/resumeReviewScorer.ts';
import { PreExportChecklist } from '../../../types/resumeReview.ts';

interface FinalPreviewModalProps {
  data: ResumeData;
  isOpen: boolean;
  onClose: () => void;
  onEditSection: (stepId: number) => void;
  onDownloadPdf?: () => void;
  onSelectTemplate?: (id: ResumeTemplateId) => void;
  onOpenReview?: () => void;
}

export function FinalPreviewModal({
  data,
  isOpen,
  onClose,
  onEditSection,
  onSelectTemplate,
  onOpenReview,
}: FinalPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 0.55;
      if (window.innerWidth < 1024) return 0.75;
    }
    return 1;
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [showChecklistWarning, setShowChecklistWarning] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const checklist: PreExportChecklist = computePreExportChecklist(data, true);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const currentTpl =
    RESUME_TEMPLATES_CATALOG.find((t) => t.id === data.templateId) ||
    RESUME_TEMPLATES_CATALOG[0];

  const executePdfExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportFeedback(null);
    setExportProgress('Starting PDF export...');

    const result = await exportResumeToPdf({
      elementId: 'resume-final-preview-document',
      fullName: data.personalInfo.fullName,
      onProgress: (_step, message) => {
        setExportProgress(message);
      },
    });

    setIsExporting(false);

    if (result.success) {
      setExportFeedback({
        type: 'success',
        message: `Successfully downloaded ${result.filename}`,
      });
      setTimeout(() => {
        setExportFeedback(null);
      }, 5000);
    } else {
      setExportFeedback({
        type: 'error',
        message: result.error || 'Could not generate PDF. Please try again.',
      });
    }
  };

  const handleDirectDownloadPdf = async () => {
    // If critical items failed or unresolved placeholders exist, show warning modal first
    if (!checklist.allCriticalPassed) {
      setShowChecklistWarning(true);
      return;
    }
    await executePdfExport();
  };

  const handleSystemPrint = () => {
    window.print();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6"
    >
      {/* Subtle charcoal overlay without blur */}
      <div
        onClick={() => onCloseRef.current?.()}
        className="fixed inset-0 transition-opacity duration-150 cursor-pointer"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-5xl bg-[#FAF8F5] border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] shadow-2xl p-4 sm:p-6 flex flex-col min-h-0 max-h-[90dvh] z-10 overflow-hidden">
        {/* Header Bar matching Screen 8 in reference */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#101010]">Final Preview</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#EBF5EE] text-[#1E5631] border border-[#CDE5D2]">
                <ShieldCheck className="w-3 h-3 text-[#1E5631]" />
                {currentTpl.atsScore}% ATS Match
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#777777]">
              Layout: <strong className="text-[#101010]">{currentTpl.name}</strong> • {currentTpl.tagline}
              {currentTpl.status === 'legacy' && (
                <span className="ml-2 text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                  Legacy Layout
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick Template Switcher Dropdown (5 Active Templates + Legacy fallback) */}
            {onSelectTemplate && (
              <div className="relative inline-flex items-center gap-1.5 bg-white border border-[#E5E0D8] rounded-xl px-2.5 py-1.5 shadow-2xs">
                <LayoutTemplate className="w-3.5 h-3.5 text-[#777777]" />
                <select
                  value={data.templateId || 'modern'}
                  onChange={(e) => onSelectTemplate(e.target.value as ResumeTemplateId)}
                  className="bg-transparent text-xs font-semibold text-[#101010] focus:outline-none cursor-pointer pr-1"
                >
                  {/* If currently loaded resume is using a legacy template, preserve it as an option */}
                  {currentTpl.status === 'legacy' && (
                    <option value={data.templateId}>
                      {currentTpl.name} (Legacy Layout • {currentTpl.atsScore}% ATS)
                    </option>
                  )}
                  {ACTIVE_RESUME_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.atsScore}% ATS)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onOpenReview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReview();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] hover:bg-[#F2EBDC] shadow-2xs transition-colors cursor-pointer"
                title="Open comprehensive resume quality review"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Review My Resume</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditSection(1);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Sections</span>
            </button>

            {/* Direct PDF Download Action */}
            <button
              type="button"
              onClick={handleDirectDownloadPdf}
              disabled={isExporting}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
                isExporting
                  ? 'bg-[#3A3A3A] opacity-90 cursor-wait'
                  : 'bg-[#101010] hover:bg-[#252525]'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{exportProgress || 'Generating PDF...'}</span>
                </>
              ) : exportFeedback?.type === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Optional System Print Dialog */}
            <button
              type="button"
              onClick={handleSystemPrint}
              title="Open System Print Dialog"
              className="hidden sm:inline-flex items-center gap-1.5 p-2 rounded-xl bg-white border border-[#E5E0D8] text-[#555555] hover:text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pre-export Quality Alert Bar */}
        {!checklist.allCriticalPassed ? (
          <div className="mt-3 px-4 py-2.5 rounded-xl text-xs bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pre-export Quality Warning: </strong>
                {checklist.warningCount} item(s) need attention (such as bracketed placeholders <code>[X%]</code> or contact info).
              </span>
            </div>
            {onOpenReview && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReview();
                }}
                className="shrink-0 font-bold text-[#8C6D1F] hover:text-[#705615] underline cursor-pointer"
              >
                Inspect in Review
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2.5 px-3.5 py-1.5 rounded-xl text-[11px] bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pre-export checklist passed: All critical requirements and links verified.</span>
          </div>
        )}

        {/* Feedback alert banner if success/error */}
        {exportFeedback && (
          <div
            className={`mt-2 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between ${
              exportFeedback.type === 'success'
                ? 'bg-[#EBF5EE] text-[#1E5631] border border-[#CDE5D2]'
                : 'bg-[#FFF5F5] text-[#C53030] border border-[#F0D5D5]'
            }`}
          >
            <div className="flex items-center gap-2">
              {exportFeedback.type === 'success' ? (
                <Check className="w-4 h-4 text-[#1E5631]" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#C53030]" />
              )}
              <span>{exportFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportFeedback(null)}
              className="text-[#777777] hover:text-[#101010] text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Warning Confirmation Dialog before export */}
        {showChecklistWarning && (
          <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 max-w-md w-full shadow-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#101010]">Unresolved Pre-Export Checks</h4>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Your resume has unresolved items that recruiters may notice:
                  </p>
                </div>
              </div>

              <ul className="text-xs text-[#555555] bg-[#FAF9F5] p-3 rounded-xl space-y-1 list-disc list-inside border border-[#F0ECE3]">
                {checklist.items
                  .filter((i) => !i.passed)
                  .map((item) => (
                    <li key={item.id}>
                      <strong>{item.label}:</strong> {item.description}
                    </li>
                  ))}
              </ul>

              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                {onOpenReview && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowChecklistWarning(false);
                      onClose();
                      onOpenReview();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] text-[#8C6D1F] font-semibold hover:bg-[#F2EBDC] cursor-pointer"
                  >
                    Review & Fix
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowChecklistWarning(false);
                    executePdfExport();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#101010] text-white font-semibold hover:bg-[#252525] cursor-pointer"
                >
                  Download Anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Document Area with Zoom Toggles */}
        <div className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain py-6 flex justify-center bg-[#ECE6DA]/40 rounded-2xl my-3 p-4 sm:p-8">
          {/* Floating Zoom Controls: bottom horizontal on mobile, top-right vertical on tablet/desktop */}
          <div className="fixed sm:absolute right-4 sm:right-8 bottom-4 sm:bottom-auto sm:top-8 z-20 flex flex-row sm:flex-col items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5E0D8] shadow-lg text-[#101010]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 select-none text-center min-w-[36px]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#777777]" />
            </button>
          </div>

          {/* Centered A4 Sheet */}
          <div className="w-full max-w-3xl transition-transform duration-200">
            <ResumeLivePreview
              id="resume-final-preview-document"
              data={data}
              scale={zoomLevel}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
