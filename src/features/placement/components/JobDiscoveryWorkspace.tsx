/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Real Job & Internship Discovery Workspace
 * Filterable discovery engine displaying verified opportunities from employer portals.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  PenLine,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import {
  VerifiedJobOpportunity,
  JobResumeMatchAnalysis,
  EligibilityAssessment,
} from '../../../types/placementIntelligence.ts';

interface JobDiscoveryWorkspaceProps {
  opportunities: VerifiedJobOpportunity[];
  matchMap: Record<string, JobResumeMatchAnalysis>;
  eligibilityMap: Record<string, EligibilityAssessment>;
  savedJobIds: Set<string>;
  trackedJobIds?: Set<string>;
  onToggleSaveJob: (job: VerifiedJobOpportunity) => void;
  onSelectJob: (job: VerifiedJobOpportunity) => void;
  onPrepareApplication: (job: VerifiedJobOpportunity) => void;
  onTrackJob?: (job: VerifiedJobOpportunity) => void;
  onAddManualJob?: () => void;
}

export const JobDiscoveryWorkspace: React.FC<JobDiscoveryWorkspaceProps> = ({
  opportunities,
  matchMap,
  eligibilityMap,
  savedJobIds,
  trackedJobIds = new Set(),
  onToggleSaveJob,
  onSelectJob,
  onPrepareApplication,
  onTrackJob,
  onAddManualJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState<'all' | 'internship' | 'full-time'>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [fresherOnly, setFresherOnly] = useState<boolean>(false);
  const [onlyEligible, setOnlyEligible] = useState<boolean>(false);

  // Filter logic
  const filteredJobs = useMemo(() => {
    return opportunities.filter((job) => {
      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Job Type
      if (selectedJobType !== 'all' && job.jobType !== selectedJobType) {
        return false;
      }

      // Work Environment
      if (selectedEnvironment !== 'all' && job.workEnvironment !== selectedEnvironment) {
        return false;
      }

      // Fresher / Intern only
      if (fresherOnly && job.experienceLevel !== 'fresher' && job.experienceLevel !== 'intern') {
        return false;
      }

      // Eligibility
      if (onlyEligible) {
        const elig = eligibilityMap[job.id];
        if (elig && elig.overallStatus === 'likely-not-eligible') {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, searchQuery, selectedJobType, selectedEnvironment, fresherOnly, onlyEligible, eligibilityMap]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Verified Opportunities & Intelligent Matching</span>
          </div>
          <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
            Genuine Job & Internship Discovery
          </h2>
          <p className="text-sm text-[#666666] max-w-2xl leading-relaxed">
            Explore authentic entry-level and campus internship opportunities. Every role is evaluated with an explainable 5-category match score and rigorous 4-state eligibility check.
          </p>
        </div>

        {onAddManualJob && (
          <button
            type="button"
            onClick={onAddManualJob}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span>+ Track Off-Campus Job</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company (e.g. Google, Stripe), skills (e.g. React, Python), or location..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Job Type Filter */}
            <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E2D7]">
              {(['all', 'internship', 'full-time'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedJobType(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedJobType === t
                      ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                      : 'text-[#666666] hover:text-[#101010]'
                  }`}
                >
                  {t === 'all' ? 'All Roles' : t}
                </button>
              ))}
            </div>

            {/* Environment Filter */}
            <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#E8E2D7]">
              {(['all', 'remote', 'hybrid', 'onsite'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setSelectedEnvironment(env)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedEnvironment === env
                      ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                      : 'text-[#666666] hover:text-[#101010]'
                  }`}
                >
                  {env === 'all' ? 'Any Location' : env}
                </button>
              ))}
            </div>

            {/* Checkbox Toggles */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium text-[#101010] cursor-pointer">
              <input
                type="checkbox"
                checked={fresherOnly}
                onChange={(e) => setFresherOnly(e.target.checked)}
                className="rounded accent-[#101010]"
              />
              <span>Freshers & Interns Only</span>
            </label>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl text-xs font-medium text-[#101010] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyEligible}
                onChange={(e) => setOnlyEligible(e.target.checked)}
                className="rounded accent-[#101010]"
              />
              <span>Eligible for Me</span>
            </label>
          </div>

          <span className="text-xs text-[#888888]">
            Showing {filteredJobs.length} opportunities
          </span>
        </div>
      </div>

      {/* Opportunities Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-xs text-[#888888] space-y-2">
          <Briefcase className="w-8 h-8 text-[#CCCCCC] mx-auto stroke-[1.5]" />
          <div className="font-semibold text-sm text-[#101010]">No opportunities match your filter criteria</div>
          <p>Try clearing some filters or searching for broader keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJobs.map((job) => {
            const match = matchMap[job.id];
            const eligibility = eligibilityMap[job.id];
            const isSaved = savedJobIds.has(job.id);

            return (
              <div
                key={job.id}
                className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 hover:border-[#101010]/50 transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                {/* Header: Company & Title */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#101010]">{job.company}</span>
                        <span className="text-[11px] text-[#888888]">• {job.location}</span>
                      </div>
                      <h3
                        onClick={() => onSelectJob(job)}
                        className="text-base font-bold text-[#101010] mt-0.5 hover:underline cursor-pointer leading-snug"
                      >
                        {job.title}
                      </h3>
                    </div>

                    {/* Action buttons: Track and Save */}
                    <div className="flex items-center gap-1.5">
                      {trackedJobIds.has(job.id) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 border border-stone-300 rounded-lg text-[11px] font-semibold text-[#101010]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Tracked</span>
                        </span>
                      ) : onTrackJob ? (
                        <button
                          type="button"
                          onClick={() => onTrackJob(job)}
                          className="px-2.5 py-1.5 bg-[#FAF9F5] border border-[#E5E0D8] hover:border-[#101010] rounded-lg text-[11px] font-semibold text-[#101010] transition-all cursor-pointer"
                          title="Track in Application Tracker"
                        >
                          + Track
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onToggleSaveJob(job)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                            : 'bg-[#FAF9F5] text-[#666666] border-[#E5E0D8] hover:border-[#101010]'
                        }`}
                        title={isSaved ? 'Unsave Job' : 'Save Job'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Badges: Match, Eligibility, Source, Work Environment */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {match && (
                      <span className="px-2.5 py-0.5 bg-[#101010] text-[#F8F5EE] rounded-full text-xs font-bold tracking-wide">
                        {match.matchScore}% Match
                      </span>
                    )}

                    {eligibility && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          eligibility.overallStatus === 'appears-eligible'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : eligibility.overallStatus === 'potentially-eligible'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : eligibility.overallStatus === 'likely-not-eligible'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {eligibility.overallStatus === 'appears-eligible'
                          ? 'Appears Eligible'
                          : eligibility.overallStatus === 'potentially-eligible'
                          ? 'Potentially Eligible'
                          : eligibility.overallStatus === 'likely-not-eligible'
                          ? 'Likely Not Eligible'
                          : 'Eligibility Unknown'}
                      </span>
                    )}

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        job.sourceType === 'official-career-page'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : job.sourceType === 'trusted-job-feed'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : job.sourceType === 'student-added'
                          ? 'bg-stone-100 text-stone-800 border border-stone-300'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {job.sourceType === 'official-career-page'
                        ? 'Official Portal'
                        : job.sourceType === 'trusted-job-feed'
                        ? 'Verified Feed'
                        : job.sourceType === 'student-added'
                        ? 'Student Added'
                        : 'Verified'}
                    </span>

                    <span className="capitalize text-[11px] px-2 py-0.5 bg-[#FAF9F5] rounded text-[#666666] font-medium border border-[#EAE5DC]">
                      {job.workEnvironment}
                    </span>
                    <span className="capitalize text-[11px] px-2 py-0.5 bg-[#FAF9F5] rounded text-[#666666] font-medium border border-[#EAE5DC]">
                      {job.jobType}
                    </span>
                  </div>

                  {/* Short excerpt */}
                  <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed pt-1">
                    {job.description}
                  </p>

                  {/* Skills tags: Matched and Missing */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((sk) => {
                        const isMatched = match?.matchedRequiredSkills.includes(sk);
                        return (
                          <span
                            key={sk}
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {sk} {isMatched ? '✓' : '(Missing)'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer with Salary, Source, and Actions */}
                <div className="pt-3 border-t border-[#F0ECE1] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#666666]">
                    {job.salaryOrStipend ? (
                      <span className="font-semibold text-emerald-700 text-xs">
                        {job.salaryOrStipend.split('(')[0].trim()}
                      </span>
                    ) : (
                      <span className="text-[#888888] text-[11px]">Salary not published</span>
                    )}
                    <span className="text-[11px] text-[#888888] truncate max-w-[180px]">
                      {job.sourceName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectJob(job)}
                      className="px-3 py-1.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#EFECE6] transition-all cursor-pointer"
                    >
                      View Details & Match
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPrepareApplication(job)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-all cursor-pointer shadow-2xs"
                      >
                        <PenLine className="w-3.5 h-3.5 text-amber-500" />
                        <span>Prepare AI Draft</span>
                      </button>

                      <a
                        href={job.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#101010] text-[#F8F5EE] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
