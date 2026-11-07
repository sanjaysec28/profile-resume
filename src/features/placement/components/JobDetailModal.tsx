/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Job Detail Workspace Modal
 * Displays full role requirements, deterministic eligibility assessment,
 * resume match evidence, and application preparation shortcuts.
 */

import React from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  PenLine,
  Building,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Layers,
  Award,
} from 'lucide-react';
import {
  VerifiedJobOpportunity,
  JobResumeMatchAnalysis,
  EligibilityAssessment,
} from '../../../types/placementIntelligence.ts';

interface JobDetailModalProps {
  job: VerifiedJobOpportunity | null;
  match: JobResumeMatchAnalysis | null;
  eligibility: EligibilityAssessment | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (job: VerifiedJobOpportunity) => void;
  onTrackApplication: (job: VerifiedJobOpportunity) => void;
  onPrepareDraft: (job: VerifiedJobOpportunity) => void;
  onStartInterviewPrep?: (targetRole: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  match,
  eligibility,
  isSaved,
  onClose,
  onToggleSave,
  onTrackApplication,
  onPrepareDraft,
  onStartInterviewPrep,
}) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E2D7] bg-[#FAF9F5] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#101010]">{job.company}</span>
              {job.companyWebsite && (
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#888888] hover:text-[#101010] flex items-center gap-0.5 underline"
                >
                  <span>Official site</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101010] leading-snug">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666] pt-1">
              <span>{job.location}</span>
              <span>•</span>
              <span className="capitalize">{job.workEnvironment}</span>
              <span>•</span>
              <span className="capitalize">{job.jobType}</span>
              {job.salaryOrStipend && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700">{job.salaryOrStipend}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(job)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                  : 'bg-white text-[#666666] border-[#E5E0D8] hover:border-[#101010]'
              }`}
              title={isSaved ? 'Unsave' : 'Save'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#888888] hover:text-[#101010] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* Section 1: Deterministic Eligibility & Match Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Eligibility Card */}
            {eligibility && (
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#101010]" />
                      <span>Eligibility Assessment</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        eligibility.overallStatus === 'appears-eligible'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : eligibility.overallStatus === 'potentially-eligible'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : eligibility.overallStatus === 'likely-not-eligible'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    >
                      {eligibility.overallStatus.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-[#555555] leading-relaxed">
                    {eligibility.summary}
                  </p>
                </div>

                {/* Criteria breakdown */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D7]">
                  {eligibility.criteria.map((c, idx) => (
                    <div key={idx} className="text-[11px] leading-snug bg-white/70 p-2 rounded-lg border border-[#EFECE6]">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#101010]">{c.field}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            c.status === 'met'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'unmet'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[#666666] text-[10px] mt-0.5">
                        <span className="font-medium text-[#444444]">Student Profile: </span>
                        {c.studentValue}
                      </div>
                      {c.notes && (
                        <div className="text-[#888888] text-[10px] mt-0.5 italic">
                          {c.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Match Card with 5-Category Breakdown */}
            {match && (
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#101010]" />
                      <span>Deterministic Match Score</span>
                    </span>
                    <span className="px-3 py-1 bg-[#101010] text-[#F8F5EE] rounded-full text-xs font-extrabold tracking-wide">
                      {match.matchScore}% Match
                    </span>
                  </div>

                  {/* 5-Category Breakdown Meters */}
                  {match.categoryBreakdown && (
                    <div className="space-y-2 pt-1 border-t border-[#E8E2D7]">
                      <div className="text-[10px] uppercase font-bold text-[#888888] tracking-wider">
                        5-Category Score Breakdown
                      </div>
                      {Object.values(match.categoryBreakdown).map((cat) => (
                        <div key={cat.category} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-[#222222]">{cat.title}</span>
                            <span className="font-bold text-[#101010]">
                              {cat.score} / {cat.maxScore} pts
                            </span>
                          </div>
                          {/* Progress bar meter */}
                          <div className="h-1.5 w-full bg-[#E8E2D7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#101010] rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-[#777777] truncate">
                            {cat.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Missing Skills Indicators */}
                  {match.missingRequiredSkills.length > 0 && (
                    <div className="pt-2 border-t border-[#E8E2D7]">
                      <span className="text-[11px] font-bold text-amber-900 block mb-1">
                        Missing Required Skills ({match.missingRequiredSkills.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {match.missingRequiredSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded text-[11px] font-medium border border-amber-200"
                          >
                            + {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Required Skills */}
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                      Matched Skills ({match.matchedRequiredSkills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {match.matchedRequiredSkills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-emerald-50 text-emerald-900 rounded text-[11px] font-medium border border-emerald-200"
                        >
                          {s} ✓
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advisory Disclaimer */}
                <div className="pt-3 border-t border-[#E8E2D7] text-[10px] text-[#888888] leading-tight italic">
                  {match.disclaimer}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Complete Description */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
              Role Overview
            </h4>
            <p className="text-xs sm:text-sm text-[#333333] leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Section 3: Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Key Responsibilities
              </h4>
              <ul className="space-y-1.5 text-xs text-[#444444] leading-relaxed">
                {job.responsibilities.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#101010] font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 4: Required Qualifications */}
          {job.requiredQualifications && job.requiredQualifications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Required Qualifications
              </h4>
              <ul className="space-y-1.5 text-xs text-[#444444] leading-relaxed">
                {job.requiredQualifications.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#101010] font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: Source & Verification Timestamp */}
          <div className="p-3 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs text-[#666666] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  job.sourceType === 'official-career-page'
                    ? 'bg-emerald-100 text-emerald-800'
                    : job.sourceType === 'trusted-job-feed'
                    ? 'bg-blue-100 text-blue-800'
                    : job.sourceType === 'student-added'
                    ? 'bg-stone-200 text-stone-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {job.sourceType.replace(/-/g, ' ')}
              </span>
              <span>
                <strong>Source:</strong> {job.sourceName}
              </span>
            </div>
            <span className="text-[#888888]">
              Verified: {new Date(job.verifiedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E8E2D7] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onTrackApplication(job);
                onClose();
              }}
              className="px-4 py-2 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] hover:bg-[#EFECE6] transition-all cursor-pointer"
            >
              Add to Tracker
            </button>
            <button
              type="button"
              onClick={() => {
                onPrepareDraft(job);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-2xs"
            >
              <PenLine className="w-3.5 h-3.5 text-amber-500" />
              <span>Prepare AI Draft</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={job.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
