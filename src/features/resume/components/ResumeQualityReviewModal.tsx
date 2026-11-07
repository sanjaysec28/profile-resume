/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Resume Content Quality Review Modal (Phase D.5.2)
 * Provides comprehensive inspection of resume content quality, duplicate bullets,
 * unresolved placeholders, empty descriptions, conversational AI leakage, and generic statements.
 * Gives students full transparency and granular control to inspect, edit, or resolve issues
 * without silent data loss.
 */

import React, { useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Wand2,
  ArrowRight,
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ResumeData } from '../../../types/resume.ts';
import {
  auditResumeContentQuality,
  applyResolvedQualityFix,
  applyAllSafeQualityFixes,
  QualityIssue,
  ResumeQualityAuditReport,
} from '../utils/resumeSanitizer.ts';

interface ResumeQualityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onUpdateResumeData: (newData: ResumeData) => void;
  onProceedAction?: () => void;
  proceedActionLabel?: string;
  targetRole?: string;
}

export function ResumeQualityReviewModal({
  isOpen,
  onClose,
  resumeData,
  onUpdateResumeData,
  onProceedAction,
  proceedActionLabel,
  targetRole,
}: ResumeQualityReviewModalProps) {
  const auditReport: ResumeQualityAuditReport = useMemo(() => {
    return auditResumeContentQuality(resumeData, targetRole);
  }, [resumeData, targetRole]);

  if (!isOpen) return null;

  const handleFixIssue = (issue: QualityIssue) => {
    const updated = applyResolvedQualityFix(resumeData, issue);
    onUpdateResumeData(updated);
  };

  const handleApplyAllSafeFixes = () => {
    const updated = applyAllSafeQualityFixes(resumeData, auditReport.issues);
    onUpdateResumeData(updated);
  };

  const scoreColor =
    auditReport.overallScore >= 90
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : auditReport.overallScore >= 75
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : 'text-rose-800 bg-rose-50 border-rose-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-page-enter"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171513] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  ProFile Content Quality Audit
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-[#E0D8CB] border border-white/10">
                  Phase D.5.2
                </span>
              </div>
              <p className="text-xs text-[#A8A196]">
                Targeting <strong className="text-white">{targetRole || 'Early-Career Role'}</strong> • Non-destructive student review
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A8A196] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Audit"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Score & Metric Bar */}
        <div className="px-6 py-4 bg-[#F2EDE4] border-b border-[#E2DBD0] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border text-sm font-extrabold flex items-center gap-2 ${scoreColor}`}>
              <span>Quality Score: {auditReport.overallScore}%</span>
            </div>
            <div className="text-xs text-[#6A645A]">
              {auditReport.isClean ? (
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All quality standards verified
                </span>
              ) : (
                <span>
                  <strong>{auditReport.issues.length}</strong> items detected for review
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#7A7368]">
            <span className="px-2 py-1 rounded-md bg-white border border-[#DDD6C9]">
              Duplicates: <strong>{auditReport.summary.duplicateBulletsCount}</strong>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-[#DDD6C9]">
              Placeholders: <strong>{auditReport.summary.placeholdersCount}</strong>
            </span>
            <span className="px-2 py-1 rounded-md bg-white border border-[#DDD6C9]">
              Suggestions: <strong>{auditReport.summary.suggestionCount}</strong>
            </span>
          </div>
        </div>

        {/* Scrollable Issue List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {auditReport.issues.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E0D8] space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#171513]">Resume Content is Pristine</h4>
              <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
                No duplicate bullets, unresolved placeholders, AI refusal messages, or incomplete descriptions were detected. Your resume content is ready for recruiter review and PDF export.
              </p>
            </div>
          ) : (
            auditReport.issues.map((issue) => {
              const isCritical = issue.severity === 'critical';
              const isWarning = issue.severity === 'warning';

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-2xl border bg-white transition-all space-y-2.5 ${
                    isCritical
                      ? 'border-rose-300 shadow-2xs'
                      : isWarning
                      ? 'border-amber-300'
                      : 'border-[#E5E0D8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-[#171513]">{issue.title}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-[#8C6D1F] capitalize bg-[#FAF5EC] px-2.5 py-0.5 rounded-full border border-[#E8DEC8]">
                      {issue.section.replace('_', ' ')} {issue.itemTitle ? `• ${issue.itemTitle}` : ''}
                    </span>
                  </div>

                  <p className="text-xs text-[#555555] leading-relaxed">{issue.message}</p>

                  {/* Problematic Snippet vs Proposed Fix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Current Text:
                      </span>
                      <div className="text-[#333333] font-mono text-[11px] line-clamp-3">
                        {issue.originalSnippet}
                      </div>
                    </div>

                    {issue.suggestedFix && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                            Proposed Resolution:
                          </span>
                          <div className="text-[#101010] text-[11px] line-clamp-3">
                            {issue.suggestedFix}
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleFixIssue(issue)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#171513] text-white text-[11px] font-bold hover:bg-[#2A2724] transition-colors cursor-pointer"
                          >
                            <Wand2 className="w-3 h-3 text-amber-300" />
                            <span>Apply This Fix</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F2EDE4] border-t border-[#E2DBD0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D5CEC2] bg-white text-xs font-semibold text-[#524E48] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            Close &amp; Return
          </button>

          <div className="flex items-center gap-2">
            {auditReport.issues.length > 0 && (
              <button
                type="button"
                onClick={handleApplyAllSafeFixes}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#171513] text-xs font-bold text-[#171513] hover:bg-[#FAF9F5] transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Apply Safe Deduplications &amp; Cleanups</span>
              </button>
            )}

            {onProceedAction && (
              <button
                type="button"
                onClick={() => {
                  onProceedAction();
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-sm"
              >
                <span>{proceedActionLabel || 'Proceed'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
