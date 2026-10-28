/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ResumeData, ResumeTemplateId } from '../../../types/resume.ts';
import { RESUME_TEMPLATES_CATALOG } from '../constants.ts';
import { ResumeLivePreview } from './ResumeLivePreview.tsx';
import { exportResumeToPdf } from '../utils/pdfExport.ts';
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

interface FinalPreviewModalProps {
  data: ResumeData;
  isOpen: boolean;
  onClose: () => void;
  onEditSection: (stepId: number) => void;
  onDownloadPdf?: () => void;
  onSelectTemplate?: (id: ResumeTemplateId) => void;
}

export function FinalPreviewModal({
  data,
  isOpen,
  onClose,
  onEditSection,
  onSelectTemplate,
}: FinalPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentTpl =
    RESUME_TEMPLATES_CATALOG.find((t) => t.id === data.templateId) ||
    RESUME_TEMPLATES_CATALOG[0];

  const handleDirectDownloadPdf = async () => {
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

  const handleSystemPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#101010]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#F8F5EE] border border-[#E5E0D8] rounded-[28px] shadow-2xl p-4 sm:p-7 flex flex-col max-h-[96vh]">
        {/* Header Bar matching Screen 8 in reference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
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
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick Template Switcher Dropdown */}
            {onSelectTemplate && (
              <div className="relative inline-flex items-center gap-1.5 bg-white border border-[#E5E0D8] rounded-xl px-2.5 py-1.5 shadow-2xs">
                <LayoutTemplate className="w-3.5 h-3.5 text-[#777777]" />
                <select
                  value={data.templateId || 'modern'}
                  onChange={(e) => onSelectTemplate(e.target.value as ResumeTemplateId)}
                  className="bg-transparent text-xs font-semibold text-[#101010] focus:outline-none cursor-pointer pr-1"
                >
                  {RESUME_TEMPLATES_CATALOG.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.atsScore}% ATS)
                    </option>
                  ))}
                </select>
              </div>
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

        {/* Feedback alert banner if success/error */}
        {exportFeedback && (
          <div
            className={`mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between ${
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

        {/* Scrollable Document Area with Zoom Toggles */}
        <div className="relative flex-1 overflow-y-auto py-6 flex justify-center bg-[#ECE6DA]/40 rounded-2xl my-3 p-4 sm:p-8">
          {/* Floating Zoom Controls matching reference */}
          <div className="fixed sm:absolute right-6 sm:right-8 top-28 sm:top-8 z-20 flex flex-col items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E5E0D8] shadow-md text-[#101010]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1 py-0.5 select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-2 hover:bg-[#F2ECE0] rounded-xl transition-colors cursor-pointer"
              title="Reset Zoom"
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
    </div>
  );
}
