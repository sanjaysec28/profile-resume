/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Pre-Export Quality Checklist Card
 * Verifies the 7 essential pre-flight requirements before PDF generation.
 */

import { PreExportChecklist } from '../../../../types/resumeReview.ts';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface PreExportChecklistCardProps {
  checklist: PreExportChecklist;
  onJumpToStep?: (stepId: number) => void;
  onProceedToExport?: () => void;
}

export function PreExportChecklistCard({
  checklist,
  onJumpToStep,
  onProceedToExport,
}: PreExportChecklistCardProps) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0ECE3]">
        <div className="flex items-center gap-2">
          {checklist.allCriticalPassed ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-[#101010]">Pre-Export Readiness Checklist</h4>
            <p className="text-xs text-[#777777]">
              7 quality checks evaluated before downloading your production resume.
            </p>
          </div>
        </div>

        <div>
          {checklist.allCriticalPassed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for Final Export
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Action Required
            </span>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
              item.passed
                ? 'bg-[#FDFDFD] border-[#EAE6DF]'
                : item.isCritical
                ? 'bg-rose-50/50 border-rose-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : item.isCritical ? (
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#101010]">{item.label}</span>
                  {item.isCritical && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#666666] mt-0.5">{item.description}</p>
                {!item.passed && item.actionTip && (
                  <p className="text-[11px] text-[#8C6D1F] font-medium mt-1">
                    Tip: {item.actionTip}
                  </p>
                )}
              </div>
            </div>

            {!item.passed && item.actionStepId && onJumpToStep && (
              <button
                type="button"
                onClick={() => onJumpToStep(item.actionStepId!)}
                className="self-end sm:self-center shrink-0 text-xs font-semibold text-[#101010] bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Fix in Step {item.actionStepId}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#F0ECE3] flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#777777]">
          {checklist.allCriticalPassed
            ? 'All critical checks passed. You can proceed with export!'
            : 'Non-critical warnings will not block export, but resolving them maximizes recruiter callbacks.'}
        </p>

        {onProceedToExport && (
          <button
            type="button"
            onClick={onProceedToExport}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
              checklist.allCriticalPassed
                ? 'bg-[#101010] hover:bg-[#252525]'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <span>
              {checklist.allCriticalPassed ? 'Proceed to Final Preview & Export' : 'Proceed with Warnings'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
