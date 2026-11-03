/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Technical Skills Recommendations View
 * Categorized into Essential, Supporting, and Beginner-level skills.
 * Provides granular approve, dismiss, and edit controls with bulk selection.
 */

import React from 'react';
import {
  TechnicalSkillRecommendation,
  BaseRecommendation,
} from '../../../../types/recommendations.ts';
import {
  Check,
  X,
  Edit3,
  RotateCcw,
  BrainCircuit,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  Code,
} from 'lucide-react';

interface TechnicalSkillsViewProps {
  skills: TechnicalSkillRecommendation[];
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  onReset: (id: string) => void;
  onEdit: (item: BaseRecommendation) => void;
  onApproveAllEssential: () => void;
}

export function TechnicalSkillsView({
  skills,
  onApprove,
  onDismiss,
  onReset,
  onEdit,
  onApproveAllEssential,
}: TechnicalSkillsViewProps) {
  const essentialSkills = skills.filter((s) => s.category === 'essential');
  const supportingSkills = skills.filter((s) => s.category === 'supporting');
  const beginnerSkills = skills.filter((s) => s.category === 'beginner');

  const pendingEssentialCount = essentialSkills.filter(
    (s) => s.status === 'suggested' && !s.isAlreadyPresent
  ).length;

  const renderSkillCard = (skill: TechnicalSkillRecommendation) => {
    const isApproved = skill.status === 'approved';
    const isDismissed = skill.status === 'dismissed';
    const isPresent = skill.isAlreadyPresent || skill.status === 'applied';

    return (
      <div
        key={skill.id}
        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
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
          {/* Header row: title and status badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-[#171513]">
                  {skill.title}
                </h4>
                {skill.proficiencyLevel && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#625D56] uppercase tracking-wider">
                    {skill.proficiencyLevel}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#8A8275] block mt-0.5">
                Importance: <strong className="text-[#171513] capitalize">{skill.importance}</strong>
              </span>
            </div>

            {/* Status Pill */}
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

          {/* Explanation */}
          <p className="text-xs text-[#524E48] leading-relaxed mb-2">
            {skill.explanation}
          </p>

          {/* Why it matters */}
          {skill.whyItMatters && (
            <p className="text-[11px] text-[#787168] bg-[#F7F4EE] p-2 rounded-xl mb-3 border border-[#EFECE6]">
              <strong className="text-[#171513]">Impact:</strong> {skill.whyItMatters}
            </p>
          )}

          {/* Related Tech Stack */}
          {skill.relatedTechStack && skill.relatedTechStack.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {skill.relatedTechStack.map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#ECE7DE] text-[#625D56]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
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
                  title="Dismiss this recommendation"
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
  };

  return (
    <div className="space-y-8">
      {/* Category 1: Essential Skills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E0D8]">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#171513]" />
              <h3 className="text-base font-bold text-[#171513]">
                Essential Technical Skills
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                Must-Have for Role
              </span>
            </div>
            <p className="text-xs text-[#7A7368] mt-0.5">
              Core competencies required by recruiters and ATS screening algorithms for this role.
            </p>
          </div>

          {pendingEssentialCount > 0 && (
            <button
              type="button"
              onClick={onApproveAllEssential}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Approve All Essential ({pendingEssentialCount})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {essentialSkills.map(renderSkillCard)}
        </div>
      </div>

      {/* Category 2: Supporting Skills */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#7A7368]" />
            <h3 className="text-base font-bold text-[#171513]">
              Important Supporting Skills
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF4E5] text-[#8C6D1F] font-semibold border border-[#EADAB8]">
              Competitive Advantage
            </span>
          </div>
          <p className="text-xs text-[#7A7368] mt-0.5">
            Secondary tools and frameworks that distinguish strong student candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {supportingSkills.map(renderSkillCard)}
        </div>
      </div>

      {/* Category 3: Beginner-Friendly / Foundational Skills */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#7A7368]" />
            <h3 className="text-base font-bold text-[#171513]">
              Foundational & Academic-Level Skills
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#625D56] font-semibold">
              Accessible
            </span>
          </div>
          <p className="text-xs text-[#7A7368] mt-0.5">
            Fundamental tools suitable for your current college academic standing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {beginnerSkills.map(renderSkillCard)}
        </div>
      </div>
    </div>
  );
}
