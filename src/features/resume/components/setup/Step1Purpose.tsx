/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard | Step 1: Resume Purpose Selection
 * High-craft selectable purpose cards with clear career intent.
 */

import React from 'react';
import {
  ResumePurposeId,
  RESUME_PURPOSE_OPTIONS,
} from '../../../../types/resumeSetup.ts';
import {
  GraduationCap,
  Briefcase,
  Building2,
  Code2,
  BookOpen,
  Palette,
  Check,
} from 'lucide-react';

interface Step1PurposeProps {
  selectedPurpose: ResumePurposeId;
  onSelect: (purpose: ResumePurposeId) => void;
}

const PURPOSE_ICONS: Record<ResumePurposeId, React.ComponentType<{ className?: string }>> = {
  'fresher': GraduationCap,
  'internship': Briefcase,
  'campus-placement': Building2,
  'technical-job': Code2,
  'academic': BookOpen,
  'creative': Palette,
};

export function Step1Purpose({ selectedPurpose, onSelect }: Step1PurposeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-xs font-semibold text-[#625D56] uppercase tracking-wider mb-2">
          Step 1 of 5 • Intent Alignment
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight">
          What is the primary purpose of this resume?
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D56] max-w-2xl">
          Selecting your goal configures the AI resume engine to prioritize the right sections, formatting hierarchy, and industry expectations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RESUME_PURPOSE_OPTIONS.map((option) => {
          const isSelected = selectedPurpose === option.id;
          const Icon = PURPOSE_ICONS[option.id];

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`relative flex flex-col p-5 rounded-2xl text-left transition-all duration-200 border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171513] ${
                isSelected
                  ? 'bg-white border-[#171513] shadow-md ring-1 ring-[#171513]'
                  : 'bg-white/80 hover:bg-white border-[#E6E1D8] hover:border-[#CFC8BC] shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#171513] text-white'
                      : 'bg-[#F4F1EA] text-[#625D56]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  {option.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-[#171513]/10 text-[#171513]'
                          : 'bg-[#ECE8E0] text-[#787168]'
                      }`}
                    >
                      {option.badge}
                    </span>
                  )}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#171513] border-[#171513] text-white'
                        : 'border-[#D8D2C5] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#171513] leading-snug">
                  {option.title}
                </h3>
                <span className="text-xs font-medium text-[#8A8275] block mt-0.5">
                  {option.tagline}
                </span>
                <p className="text-xs text-[#625D56] mt-2 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
