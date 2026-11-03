/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Skill Gap Analysis Matrix
 * Compares target role competencies against student profile evidence
 * with priority filters, status chips, and next-action recommendations.
 */

import { useState } from 'react';
import {
  SkillGapItem,
  SkillImportance,
  SkillStatus,
} from '../../../types/careerIntelligence.ts';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Filter,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface SkillGapMatrixProps {
  skillGaps: SkillGapItem[];
  onToggleLearning?: (skillName: string) => void;
}

export function SkillGapMatrix({ skillGaps, onToggleLearning }: SkillGapMatrixProps) {
  const [importanceFilter, setImportanceFilter] = useState<'all' | SkillImportance>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SkillStatus>('all');

  const filteredSkills = skillGaps.filter((item) => {
    if (importanceFilter !== 'all' && item.importance !== importanceFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: SkillStatus) => {
    switch (status) {
      case 'demonstrated':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Demonstrated
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
            <BookOpen className="w-3 h-3 text-amber-700" />
            Learning
          </span>
        );
      case 'student-reported':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100/70 border border-blue-300 px-2 py-0.5 rounded-full">
            Student-Reported
          </span>
        );
      case 'missing':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100/70 border border-rose-300 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            Missing
          </span>
        );
    }
  };

  const getImportanceBadge = (importance: SkillImportance) => {
    switch (importance) {
      case 'essential':
        return (
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            Essential
          </span>
        );
      case 'important':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Important
          </span>
        );
      case 'optional':
      default:
        return (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#777777] bg-[#FAF9F5] border border-[#E5E0D8] px-2 py-0.5 rounded">
            Optional
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-5 sm:p-7 shadow-2xs space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE3]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#101010]">
            Target Competency & Skill Gap Analysis
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Compares your resume and profile evidence directly against expected competencies.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Importance Filter */}
          <div className="flex items-center bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-1">
            {(['all', 'essential', 'important', 'optional'] as const).map((imp) => (
              <button
                key={imp}
                type="button"
                onClick={() => setImportanceFilter(imp)}
                className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                  importanceFilter === imp
                    ? 'bg-[#101010] text-white'
                    : 'text-[#666666] hover:text-[#101010]'
                }`}
              >
                {imp}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-1">
            {(['all', 'missing', 'learning', 'demonstrated'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#101010] text-white'
                    : 'text-[#666666] hover:text-[#101010]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Matrix List */}
      <div className="space-y-3">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                item.status === 'demonstrated'
                  ? 'bg-[#FCFDFD] border-[#E2EBE5]'
                  : item.status === 'learning'
                  ? 'bg-amber-50/30 border-amber-200'
                  : item.importance === 'essential'
                  ? 'bg-rose-50/20 border-rose-200'
                  : 'bg-[#FAF9F5] border-[#EAE5DC]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-[#101010]">{item.name}</span>
                  {getImportanceBadge(item.importance)}
                  <span className="text-[10px] text-[#777777] bg-white border border-[#E5E0D8] px-2 py-0.5 rounded capitalize">
                    {item.category.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  {onToggleLearning && item.status !== 'demonstrated' && (
                    <button
                      type="button"
                      onClick={() => onToggleLearning(item.name)}
                      className="text-[11px] text-[#8C6D1F] hover:text-[#705615] font-semibold underline cursor-pointer"
                    >
                      {item.status === 'learning' ? 'Unmark Learning' : 'Mark as Learning'}
                    </button>
                  )}
                </div>
              </div>

              {/* Evidence or Status Context */}
              <div className="text-xs space-y-1.5">
                {item.evidence ? (
                  <p className="text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                    <strong>Evidence: </strong>
                    {item.evidence}
                  </p>
                ) : item.status === 'student-reported' ? (
                  <p className="text-blue-900 bg-blue-50/50 p-2 rounded-lg border border-blue-200">
                    <strong>Reported: </strong>
                    Listed in skills section, but lacks explicit project bullet verification.
                  </p>
                ) : null}

                {/* Recommended Next Action */}
                <div className="flex items-start gap-1.5 text-xs text-[#555555] pt-1">
                  <ArrowRight className="w-3.5 h-3.5 text-[#8C6D1F] shrink-0 mt-0.5" />
                  <span>
                    <strong>Next action: </strong>
                    {item.recommendedNextAction}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-xs text-[#777777] bg-[#FAF9F5] rounded-2xl border border-dashed border-[#E5E0D8]">
            No skills match your selected filter criteria.
          </div>
        )}
      </div>

      {/* Factual Integrity Footer */}
      <div className="pt-3 border-t border-[#F0ECE3] text-[11px] text-[#777777] italic">
        Factual Guard: Missing skills are never automatically injected into your resume draft. They serve as personal roadmap goals for genuine skill acquisition.
      </div>
    </div>
  );
}
