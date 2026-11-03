/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Career Readiness Overview Card
 * Displays deterministic readiness score, sub-scores, verified vs reported counts,
 * and key strengths & missing competencies.
 */

import { CareerReadinessEvaluation } from '../../../types/careerIntelligence.ts';
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  Code,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface CareerReadinessCardProps {
  readiness: CareerReadinessEvaluation;
  targetRole: string;
  academicYear: string;
  graduationYear: string;
  degree: string;
  major: string;
}

export function CareerReadinessCard({
  readiness,
  targetRole,
  academicYear,
  graduationYear,
  degree,
  major,
}: CareerReadinessCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 55) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getMeterColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-600';
    if (score >= 55) return 'bg-blue-600';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-5 sm:p-7 shadow-2xs space-y-6">
      
      {/* Top Header: Candidate Role + Academic Year */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0ECE3]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D1F] bg-[#FAF5EC] border border-[#E8DEC8] px-2.5 py-0.5 rounded-full">
              Target Role Architecture
            </span>
            <span className="text-xs text-[#777777]">
              {academicYear} • Graduating {graduationYear}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#101010]">
            {targetRole}
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
            {degree} in {major}
          </p>
        </div>

        {/* Readiness Index Gauge */}
        <div className="flex items-center gap-3 bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-3 sm:p-4 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#777777] block">
              Readiness Index
            </span>
            <span className="text-xs font-bold text-[#101010]">
              {readiness.readinessLabel}
            </span>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border font-mono text-base font-extrabold ${getScoreColor(readiness.overallReadinessScore)}`}>
            {readiness.overallReadinessScore}/100
          </div>
        </div>
      </div>

      {/* Sub-Score Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Technical Coverage */}
        <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-[#101010]">
              <Code className="w-3.5 h-3.5 text-blue-600" />
              Technical Skill Coverage
            </span>
            <span className="font-mono text-[#555555]">{readiness.technicalCoverageScore}%</span>
          </div>
          <div className="w-full bg-[#EAE5DC] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(readiness.technicalCoverageScore)}`}
              style={{ width: `${Math.max(5, readiness.technicalCoverageScore)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#777777] mt-1 block">
            Essential & important role competencies matched
          </span>
        </div>

        {/* Project Evidence */}
        <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-[#101010]">
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
              Project Practical Evidence
            </span>
            <span className="font-mono text-[#555555]">{readiness.projectEvidenceScore}%</span>
          </div>
          <div className="w-full bg-[#EAE5DC] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(readiness.projectEvidenceScore)}`}
              style={{ width: `${Math.max(5, readiness.projectEvidenceScore)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#777777] mt-1 block">
            Skills demonstrated in built applications
          </span>
        </div>

        {/* Coursework & Foundations */}
        <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-[#101010]">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              Academic Foundations
            </span>
            <span className="font-mono text-[#555555]">{readiness.courseworkScore}%</span>
          </div>
          <div className="w-full bg-[#EAE5DC] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getMeterColor(readiness.courseworkScore)}`}
              style={{ width: `${Math.max(5, readiness.courseworkScore)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#777777] mt-1 block">
            Core CS coursework & degree alignment
          </span>
        </div>
      </div>

      {/* Verified vs Reported Counts Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
            Verified In Projects
          </span>
          <span className="text-xl font-mono font-bold text-emerald-900">
            {readiness.counts.demonstrated}
          </span>
        </div>

        <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">
            Student-Reported
          </span>
          <span className="text-xl font-mono font-bold text-blue-900">
            {readiness.counts.reported}
          </span>
        </div>

        <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
            Currently Learning
          </span>
          <span className="text-xl font-mono font-bold text-amber-900">
            {readiness.counts.learning}
          </span>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block">
            Missing Gaps
          </span>
          <span className="text-xl font-mono font-bold text-rose-900">
            {readiness.counts.missing}
          </span>
        </div>
      </div>

      {/* Strengths & Actionable Priorities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#F0ECE3]">
        {/* Strengths */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Demonstrated Strengths
          </span>
          <ul className="text-xs text-[#555555] space-y-1.5 list-disc list-inside bg-[#FAF9F5] p-3.5 rounded-xl border border-[#F0ECE3]">
            {readiness.strengths.length > 0 ? (
              readiness.strengths.map((str, i) => <li key={i}>{str}</li>)
            ) : (
              <li className="text-[#888888] italic">Add projects with tech stack tags to build verifiable evidence.</li>
            )}
          </ul>
        </div>

        {/* Priority Improvements */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#8C6D1F]" />
            Recommended Next Actions
          </span>
          <ul className="text-xs text-[#555555] space-y-1.5 list-disc list-inside bg-[#FAF5EC] p-3.5 rounded-xl border border-[#E8DEC8]">
            {readiness.priorityImprovements.length > 0 ? (
              readiness.priorityImprovements.map((pri, i) => <li key={i}>{pri}</li>)
            ) : (
              <li className="text-[#888888] italic">All essential core competencies currently demonstrated!</li>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
}
