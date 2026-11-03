/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Job Description Keywords Breakdown View
 * Categorizes keywords into Matched vs. Missing with contextual placement examples.
 */

import React from 'react';
import { KeywordRecommendation } from '../../../../types/recommendations.ts';
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  ArrowRight,
} from 'lucide-react';

interface KeywordsViewProps {
  keywords: KeywordRecommendation[];
  hasJobDescription: boolean;
}

export function KeywordsView({ keywords, hasJobDescription }: KeywordsViewProps) {
  const matched = keywords.filter((k) => k.isMatchedInResume);
  const missing = keywords.filter((k) => !k.isMatchedInResume);

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#171513]" />
          <h3 className="text-base sm:text-lg font-bold text-[#171513]">
            ATS Keyword Alignment & Extraction
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
          {hasJobDescription
            ? 'Key terms extracted directly from your target job description to match ATS parser frequency filters.'
            : 'Standard industry keywords commonly filtered by ATS screeners for this target role.'}
        </p>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Matched Keywords
            </span>
            <span className="text-2xl font-bold text-emerald-950">
              {matched.length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Missing / Gap Keywords
            </span>
            <span className="text-2xl font-bold text-amber-950">
              {missing.length}
            </span>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
      </div>

      {/* Missing Keywords List (Actionable) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#171513]">
          Priority Keywords to Naturally Incorporate:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className={`p-4 rounded-2xl border transition-all ${
                kw.isMatchedInResume
                  ? 'bg-white border-[#E5E0D8]'
                  : 'bg-white border-amber-300 ring-1 ring-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-sm font-bold text-[#171513]">
                  "{kw.keyword || kw.title}"
                </span>
                {kw.isMatchedInResume ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    Matched in Resume
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 shrink-0">
                    Missing
                  </span>
                )}
              </div>

              <p className="text-xs text-[#524E48] leading-relaxed mb-2">
                {kw.explanation}
              </p>

              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE] text-xs text-[#625D56] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#171513]">
                  <span>Best Section:</span>
                  <span className="uppercase tracking-wider px-1.5 py-0.5 bg-[#EFECE6] rounded-md font-mono text-[10px]">
                    {kw.suggestedSection || 'skills'}
                  </span>
                </div>
                {kw.placementExample && (
                  <p className="text-[11px] italic text-[#7A7368]">
                    "{kw.placementExample}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
