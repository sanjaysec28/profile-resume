/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Suggested Resume Sections & Structural Ordering View
 * Explains section prioritization, recruiter scanning behavior, and optional sections rationale.
 */

import React from 'react';
import { SectionRecommendation } from '../../../../types/recommendations.ts';
import {
  Layers,
  ArrowUpDown,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface SectionsAdviceViewProps {
  sections: SectionRecommendation[];
}

export function SectionsAdviceView({ sections }: SectionsAdviceViewProps) {
  const sorted = [...sections].sort((a, b) => a.suggestedOrder - b.suggestedOrder);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#171513]" />
          <h3 className="text-base sm:text-lg font-bold text-[#171513]">
            Recommended Section Ordering & Architecture
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
          ATS parsers and campus placement recruiters evaluate resumes in a predictable 6-second scan pattern. Here is the optimal section sequence for your candidate profile:
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((section, idx) => {
          return (
            <div
              key={section.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                {/* Order Badge */}
                <div className="w-9 h-9 rounded-xl bg-[#171513] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-[#171513]">
                      {section.title}
                    </h4>
                    {section.isOptional ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF4E5] text-[#8C6D1F] border border-[#EADAB8]">
                        Optional Section
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Core Section
                      </span>
                    )}
                    <span className="text-xs text-[#8A8275] capitalize">
                      Priority: {section.importance}
                    </span>
                  </div>

                  <p className="text-xs text-[#524E48] leading-relaxed">
                    {section.explanation}
                  </p>

                  {section.contentTips && (
                    <p className="text-[11px] text-[#7A7368] pt-1">
                      <strong className="text-[#171513]">Writing Tip:</strong> {section.contentTips}
                    </p>
                  )}
                </div>
              </div>

              {/* Recruiter impact box */}
              {section.whyItMatters && (
                <div className="md:w-64 shrink-0 p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE] text-[11px] text-[#625D56]">
                  <strong className="text-[#171513] block mb-0.5">Recruiter Focus:</strong>
                  {section.whyItMatters}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
