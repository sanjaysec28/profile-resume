/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Placement Dashboard Overview
 * Displays placement analytics, active application pipeline, upcoming interviews,
 * and top recommended opportunities.
 */

import React from 'react';
import {
  Briefcase,
  Compass,
  Calendar,
  CheckCircle2,
  Clock,
  BrainCircuit,
  ArrowRight,
  Bookmark,
  Building,
  Target,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  VerifiedJobOpportunity,
  ApplicationRecord,
  PlacementAnalytics,
} from '../../../types/placementIntelligence.ts';
import { JobResumeMatchAnalysis, EligibilityAssessment } from '../../../types/placementIntelligence.ts';

interface PlacementDashboardOverviewProps {
  targetRole: string;
  analytics: PlacementAnalytics;
  recommendedJobs: {
    job: VerifiedJobOpportunity;
    match: JobResumeMatchAnalysis;
    eligibility: EligibilityAssessment;
  }[];
  onNavigateTab: (tab: 'discovery' | 'tracker' | 'saved') => void;
  onSelectJob: (job: VerifiedJobOpportunity) => void;
  onOpenAddApplication: () => void;
}

export const PlacementDashboardOverview: React.FC<PlacementDashboardOverviewProps> = ({
  targetRole,
  analytics,
  recommendedJobs,
  onNavigateTab,
  onSelectJob,
  onOpenAddApplication,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-3 shadow-xs">
              <Target className="w-3.5 h-3.5 text-[#101010]" />
              <span>Target Role: {targetRole || 'Software Engineer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#101010] tracking-tight">
              Placement Intelligence & Job Tracker
            </h2>
            <p className="text-sm sm:text-base text-[#666666] mt-2 leading-relaxed">
              Discover genuine fresher and internship openings, evaluate your eligibility with deterministic criteria,
              and manage your applications from submission to offer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('discovery')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#101010] text-[#F8F5EE] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-all shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Discover Genuine Openings</span>
            </button>
            <button
              onClick={onOpenAddApplication}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-sm font-semibold hover:bg-[#F5F2EB] transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#888888]" />
              <span>Track Application</span>
            </button>
          </div>
        </div>

        {/* 4 Analytics Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-[#E8E2D7]">
          {/* Metric 1: Saved Jobs */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Saved Opportunities</span>
              <Bookmark className="w-4 h-4 text-[#101010]" />
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-1">
              {analytics.totalOpportunitiesSaved}
            </div>
            <p className="text-[11px] text-[#888888] mt-1.5">
              Verified employer listings
            </p>
          </div>

          {/* Metric 2: Active Pipeline */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Active Pipeline</span>
              <Briefcase className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-1">
              {analytics.activeApplicationsCount}
            </div>
            <p className="text-[11px] text-[#888888] mt-1.5">
              Applied, assessment, or interview
            </p>
          </div>

          {/* Metric 3: Interviews Scheduled */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Interviews Scheduled</span>
              <Calendar className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-1">
              {analytics.interviewsScheduledCount}
            </div>
            <p className="text-[11px] text-[#888888] mt-1.5">
              Active interview stages
            </p>
          </div>

          {/* Metric 4: Offers Received */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Offers Received</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-1">
              {analytics.offersReceivedCount}
            </div>
            <p className="text-[11px] text-[#888888] mt-1.5">
              Final outcomes confirmed
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recommended Openings & Application Status Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Top Recommended Opportunities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#101010]" />
              <h3 className="text-base font-bold text-[#101010]">
                Recommended Opportunities for You
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('discovery')}
              className="text-xs text-[#101010] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all openings</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendedJobs.slice(0, 3).map(({ job, match, eligibility }) => (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="bg-white border border-[#E5E0D8] rounded-xl p-5 hover:border-[#101010]/40 transition-all shadow-xs cursor-pointer space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101010]">{job.company}</span>
                      <span className="text-[11px] text-[#888888]">• {job.location}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#101010] mt-0.5">{job.title}</h4>
                  </div>

                  {/* Match & Eligibility Badges */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="px-2.5 py-1 bg-[#FAF9F5] border border-[#E8E2D7] rounded-full text-xs font-bold text-[#101010]">
                      {match.matchScore}% Match
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        eligibility.overallStatus === 'appears-eligible'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : eligibility.overallStatus === 'potentially-eligible'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {eligibility.overallStatus === 'appears-eligible'
                        ? 'Eligible'
                        : eligibility.overallStatus === 'potentially-eligible'
                        ? 'Check Info'
                        : 'Review Req.'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0ECE1] text-xs text-[#666666]">
                  <div className="flex items-center gap-2">
                    <span className="capitalize px-2 py-0.5 bg-[#FAF9F5] rounded text-[11px] font-medium text-[#555555]">
                      {job.workEnvironment}
                    </span>
                    <span className="capitalize px-2 py-0.5 bg-[#FAF9F5] rounded text-[11px] font-medium text-[#555555]">
                      {job.jobType}
                    </span>
                    {job.salaryOrStipend && (
                      <span className="text-emerald-700 font-semibold text-[11px]">
                        {job.salaryOrStipend.split('(')[0].trim()}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-[#888888]">
                    Source: {job.sourceName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Application Pipeline & Upcoming Reminders */}
        <div className="space-y-6">
          {/* Pipeline Distribution */}
          <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Application Pipeline
              </h4>
              <button
                onClick={() => onNavigateTab('tracker')}
                className="text-xs text-[#101010] font-semibold hover:underline cursor-pointer"
              >
                Open Tracker
              </button>
            </div>

            {analytics.totalApplications === 0 ? (
              <div className="p-4 text-center text-xs text-[#888888] space-y-2">
                <Briefcase className="w-6 h-6 text-[#CCCCCC] mx-auto" />
                <p>No applications tracked yet. Discovered opportunities can be saved directly to your pipeline.</p>
                <button
                  onClick={onOpenAddApplication}
                  className="px-3 py-1.5 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-lg hover:bg-[#262626] cursor-pointer"
                >
                  Track First Job
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: 'Preparing', count: analytics.statusDistribution.preparing, color: 'bg-amber-500' },
                  { label: 'Applied', count: analytics.statusDistribution.applied, color: 'bg-blue-500' },
                  { label: 'Assessment', count: analytics.statusDistribution.assessment, color: 'bg-indigo-500' },
                  { label: 'Interview', count: analytics.statusDistribution.interview, color: 'bg-purple-500' },
                  { label: 'Offer', count: analytics.statusDistribution.offer, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#666666] font-medium">{item.label}</span>
                      <span className="font-bold text-[#101010]">{item.count}</span>
                    </div>
                    <div className="w-full bg-[#EFECE6] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all`}
                        style={{
                          width: `${(item.count / Math.max(analytics.totalApplications, 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Interviews & Follow-ups */}
          <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#101010]" />
              <span>Upcoming Actions & Deadlines</span>
            </h4>

            {analytics.upcomingInterviews.length === 0 && analytics.upcomingFollowUps.length === 0 ? (
              <p className="text-xs text-[#888888] leading-relaxed">
                No scheduled interviews or follow-up reminders due in the immediate pipeline.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.upcomingInterviews.slice(0, 2).map((app) => (
                  <div key={app.id} className="p-3 bg-white border border-[#EAE5DC] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#101010]">
                      <span>{app.company}</span>
                      <span className="text-purple-700 font-bold">Interview</span>
                    </div>
                    <div className="text-[#666666]">{app.jobTitle} • {app.interviewDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
