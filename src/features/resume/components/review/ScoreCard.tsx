/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Deterministic Review Score Cards
 * Displays General Resume Quality, Job Description Match, and ATS Readability scores
 * with strict explainability and mathematical factor breakdowns.
 */

import { useState } from 'react';
import { ScoresBreakdown, ScoreFactor } from '../../../../types/resumeReview.ts';
import { ShieldCheck, Target, FileText, Info, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ScoreCardProps {
  scores: ScoresBreakdown;
  hasJobDescription: boolean;
  targetRole: string;
}

export function ScoreCard({ scores, hasJobDescription, targetRole }: ScoreCardProps) {
  const [expandedSection, setExpandedSection] = useState<'general' | 'jd' | 'ats' | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getMeterColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-600';
    if (score >= 70) return 'bg-blue-600';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const renderFactorRow = (factor: ScoreFactor, idx: number) => (
    <div key={idx} className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-[#F0ECE3] last:border-0">
      <div className="flex items-start gap-2">
        {factor.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
        {factor.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
        {factor.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />}
        <div>
          <span className="font-semibold text-[#101010]">{factor.factor}</span>
          <p className="text-[#666666] text-[11px] mt-0.5">{factor.note}</p>
        </div>
      </div>
      <span className="font-mono font-medium text-[#101010] shrink-0 text-[11px]">
        {factor.score}/{factor.max} pts
      </span>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. General Resume Quality */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs hover:border-[#D5CFC5] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F]">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#101010]">General Quality</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getScoreColor(scores.generalQualityScore)}`}>
              {scores.generalQualityScore}/100
            </span>
          </div>

          <div className="w-full bg-[#EFEBE4] h-2 rounded-full overflow-hidden my-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(scores.generalQualityScore)}`}
              style={{ width: `${Math.min(100, Math.max(5, scores.generalQualityScore))}%` }}
            />
          </div>

          <p className="text-[11px] text-[#777777] line-clamp-1">
            Section density, action verbs, metrics & formatting.
          </p>

          <button
            type="button"
            onClick={() => setExpandedSection(expandedSection === 'general' ? null : 'general')}
            className="mt-3 flex items-center justify-between w-full text-[11px] font-semibold text-[#8C6D1F] hover:text-[#705615] pt-2 border-t border-[#F0ECE3] cursor-pointer"
          >
            <span>{expandedSection === 'general' ? 'Hide Factor Breakdown' : 'View Contributing Factors'}</span>
            {expandedSection === 'general' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expandedSection === 'general' && (
            <div className="mt-2.5 pt-2 border-t border-[#F0ECE3] space-y-1">
              {scores.generalQualityFactors.map(renderFactorRow)}
            </div>
          )}
        </div>

        {/* 2. Job Description Match */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs hover:border-[#D5CFC5] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF4FF] border border-[#D0E1FD] flex items-center justify-center text-blue-700">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#101010]">Job Description Match</span>
              </div>
            </div>
            {hasJobDescription && scores.jobMatchScore !== null ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getScoreColor(scores.jobMatchScore)}`}>
                {scores.jobMatchScore}/100
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F0ECE3] text-[#777777] border border-[#E5E0D8]">
                Role-Aligned
              </span>
            )}
          </div>

          {hasJobDescription && scores.jobMatchScore !== null ? (
            <>
              <div className="w-full bg-[#EFEBE4] h-2 rounded-full overflow-hidden my-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getMeterColor(scores.jobMatchScore)}`}
                  style={{ width: `${Math.min(100, Math.max(5, scores.jobMatchScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-[#777777] line-clamp-1">
                Matches required skills and keywords in the target JD.
              </p>
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 'jd' ? null : 'jd')}
                className="mt-3 flex items-center justify-between w-full text-[11px] font-semibold text-blue-700 hover:text-blue-800 pt-2 border-t border-[#F0ECE3] cursor-pointer"
              >
                <span>{expandedSection === 'jd' ? 'Hide Factor Breakdown' : 'View Contributing Factors'}</span>
                {expandedSection === 'jd' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {expandedSection === 'jd' && scores.jobMatchFactors && (
                <div className="mt-2.5 pt-2 border-t border-[#F0ECE3] space-y-1">
                  {scores.jobMatchFactors.map(renderFactorRow)}
                </div>
              )}
            </>
          ) : (
            <div className="my-2.5 py-2 px-2.5 bg-[#FAF9F5] border border-dashed border-[#E5E0D8] rounded-xl text-[11px] text-[#777777]">
              <span>No JD attached. Evaluated against industry benchmarks for </span>
              <strong className="text-[#101010]">{targetRole}</strong>.
            </div>
          )}
        </div>

        {/* 3. ATS Readability */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs hover:border-[#D5CFC5] transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#101010]">ATS Readability</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${getScoreColor(scores.atsReadabilityScore)}`}>
              {scores.atsReadabilityScore}/100
            </span>
          </div>

          <div className="w-full bg-[#EFEBE4] h-2 rounded-full overflow-hidden my-2.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(scores.atsReadabilityScore)}`}
              style={{ width: `${Math.min(100, Math.max(5, scores.atsReadabilityScore))}%` }}
            />
          </div>

          <p className="text-[11px] text-[#777777] line-clamp-1">
            Standard headings, layout parsing & contact extraction.
          </p>

          <button
            type="button"
            onClick={() => setExpandedSection(expandedSection === 'ats' ? null : 'ats')}
            className="mt-3 flex items-center justify-between w-full text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-[#F0ECE3] cursor-pointer"
          >
            <span>{expandedSection === 'ats' ? 'Hide Factor Breakdown' : 'View Contributing Factors'}</span>
            {expandedSection === 'ats' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expandedSection === 'ats' && (
            <div className="mt-2.5 pt-2 border-t border-[#F0ECE3] space-y-1">
              {scores.atsReadabilityFactors.map(renderFactorRow)}
            </div>
          )}
        </div>
      </div>

      {/* Strict Calculation Basis Notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-[11px] text-[#777777]">
        <Info className="w-3.5 h-3.5 text-[#8C6D1F] shrink-0" />
        <span className="leading-tight">
          <strong>Deterministic Calculation Basis: </strong>
          {scores.calculationBasis}
        </span>
      </div>
    </div>
  );
}
