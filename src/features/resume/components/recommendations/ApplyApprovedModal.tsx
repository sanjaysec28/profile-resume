/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Apply Approved Recommendations Modal
 * Confirms with the student which approved skills and items should be written
 * into their active resume draft.
 */

import React, { useState } from 'react';
import {
  ResumeRecommendationsData,
  TechnicalSkillRecommendation,
  SoftSkillRecommendation,
} from '../../../../types/recommendations.ts';
import {
  CheckCircle2,
  X,
  Code,
  Users,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ApplyApprovedModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: ResumeRecommendationsData;
  onApply: (selectedTechIds: string[], selectedSoftIds: string[]) => void;
}

export function ApplyApprovedModal({
  isOpen,
  onClose,
  recommendations,
  onApply,
}: ApplyApprovedModalProps) {
  if (!isOpen) return null;

  const approvedTech = recommendations.technicalSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  );
  const approvedSoft = recommendations.softSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  );

  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(
    approvedTech.map((s) => s.id)
  );
  const [selectedSoftIds, setSelectedSoftIds] = useState<string[]>(
    approvedSoft.map((s) => s.id)
  );

  const toggleTech = (id: string) => {
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSoft = (id: string) => {
    setSelectedSoftIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalSelected = selectedTechIds.length + selectedSoftIds.length;

  const handleConfirm = () => {
    onApply(selectedTechIds, selectedSoftIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-[#171513]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#E5E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] z-10 animate-page-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFECE6] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171513] text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171513]">
                Apply Approved Recommendations
              </h3>
              <p className="text-xs text-[#7A7368]">
                Review the items to add to your resume draft
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EFECE6] text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="p-3.5 rounded-2xl bg-[#F8F6F1] border border-[#EAE4D8] text-xs text-[#625D56] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#8C6D1F] shrink-0 mt-0.5" />
            <div>
              Only apply skills and items that you genuinely know and can discuss in an interview. You can uncheck any skill below.
            </div>
          </div>

          {/* Technical Skills List */}
          {approvedTech.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#171513] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  Approved Technical Skills ({approvedTech.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {approvedTech.map((skill) => {
                  const isChecked = selectedTechIds.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTech(skill.id)}
                          className="w-4 h-4 rounded text-[#171513] focus:ring-[#171513]"
                        />
                        <span className="font-semibold text-[#171513]">
                          {skill.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#8A8275] bg-[#EFECE6] px-2 py-0.5 rounded-md">
                        {skill.category}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Soft Skills List */}
          {approvedSoft.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#171513] uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Approved Soft Skills ({approvedSoft.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {approvedSoft.map((skill) => {
                  const isChecked = selectedSoftIds.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:bg-white transition-colors cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSoft(skill.id)}
                          className="w-4 h-4 rounded text-[#171513] focus:ring-[#171513]"
                        />
                        <span className="font-semibold text-[#171513]">
                          {skill.title}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#8A8275] bg-[#EFECE6] px-2 py-0.5 rounded-md">
                        {skill.importance}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {approvedTech.length === 0 && approvedSoft.length === 0 && (
            <div className="p-8 text-center text-xs text-[#7A7368]">
              No newly approved skills to add yet. Approve skills in the recommendations dashboard first!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EFECE6] bg-[#FAF8F5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D5CFC4] text-xs font-semibold text-[#171513] hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={totalSelected === 0}
            className="px-5 py-2.5 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Apply {totalSelected} Item{totalSelected === 1 ? '' : 's'} to Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
