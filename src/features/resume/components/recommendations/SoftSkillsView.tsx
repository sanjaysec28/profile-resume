/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Soft Skills Recommendations View
 * Role-targeted soft skills with contextual demonstration guidance for students.
 */

import React from 'react';
import {
  SoftSkillRecommendation,
  BaseRecommendation,
} from '../../../../types/recommendations.ts';
import {
  Check,
  X,
  Edit3,
  RotateCcw,
  Users,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

interface SoftSkillsViewProps {
  skills: SoftSkillRecommendation[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onReset: (id: string) => void;
  onEdit: (item: BaseRecommendation) => void;
}

export function SoftSkillsView({
  skills,
  onApprove,
  onDismiss,
  onReset,
  onEdit,
}: SoftSkillsViewProps) {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#171513]" />
          <h3 className="text-base sm:text-lg font-bold text-[#171513]">
            Target-Role Professional & Soft Skills
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
          Behavioral capabilities evaluated during technical team interviews and hiring manager evaluations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => {
          const isApproved = skill.status === 'approved';
          const isDismissed = skill.status === 'dismissed';
          const isPresent = skill.isAlreadyPresent || skill.status === 'applied';

          return (
            <div
              key={skill.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isPresent
                  ? 'bg-[#F2F7F2] border-emerald-200'
                  : isApproved
                  ? 'bg-[#FAF7F0] border-[#171513] ring-1 ring-[#171513] shadow-xs'
                  : isDismissed
                  ? 'bg-[#F8F6F2] border-[#E8E2D7] opacity-60'
                  : 'bg-white border-[#E5E0D8] hover:border-[#D0C9BD] shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h4 className="text-base font-bold text-[#171513]">
                      {skill.title}
                    </h4>
                    <span className="text-[11px] font-medium text-[#8A8275] capitalize">
                      Priority: <strong className="text-[#171513]">{skill.importance}</strong>
                    </span>
                  </div>

                  {isPresent ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      In Resume
                    </span>
                  ) : isApproved ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#171513] text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Approved
                    </span>
                  ) : isDismissed ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E8E2D7] text-[#7A7368] shrink-0">
                      Dismissed
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#7A7368] shrink-0">
                      Suggested
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#524E48] leading-relaxed mb-3">
                  {skill.explanation}
                </p>

                {/* Demonstration Context */}
                {skill.demonstrationContext && (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE] text-xs text-[#625D56] mb-3 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-[#8C6D1F] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#171513] block mb-0.5">How to Prove This:</strong>
                      {skill.demonstrationContext}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => onEdit(skill)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>

                <div className="flex items-center gap-1.5">
                  {isApproved || isDismissed ? (
                    <button
                      type="button"
                      onClick={() => onReset(skill.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#7A7368] hover:text-[#171513] hover:bg-[#EFECE6] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Undo
                    </button>
                  ) : isPresent ? (
                    <span className="text-[11px] text-emerald-700 font-medium">Verified Active</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onDismiss(skill.id)}
                        className="p-1.5 rounded-lg text-[#8A8275] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onApprove(skill.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-colors cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
