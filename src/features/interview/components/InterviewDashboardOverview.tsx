/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Interview Dashboard Overview
 * Displays readiness metrics, DSA/HR progress, and recommended next activities.
 */

import React from 'react';
import {
  Bot,
  Brain,
  Target,
  Code2,
  Users,
  Mic,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { InterviewDashboardMetrics, InterviewSession } from '../../../types/interviewIntelligence.ts';

interface InterviewDashboardOverviewProps {
  metrics: InterviewDashboardMetrics;
  onStartMock: (category?: string) => void;
  onNavigateTab: (tab: 'mock' | 'resume-questions' | 'dsa' | 'hr' | 'coach') => void;
  onSelectPastSession?: (session: InterviewSession) => void;
}

export const InterviewDashboardOverview: React.FC<InterviewDashboardOverviewProps> = ({
  metrics,
  onStartMock,
  onNavigateTab,
  onSelectPastSession,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Banner: Target Role & Readiness Summary */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#E8E2D7]/40 to-transparent pointer-events-none rounded-full -mr-16 -mt-16" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-3 shadow-xs">
              <Target className="w-3.5 h-3.5 text-[#101010]" />
              <span>Target Role: {metrics.targetRole || 'Software Engineer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#101010] tracking-tight">
              Placement & Interview Readiness
            </h2>
            <p className="text-sm sm:text-base text-[#666666] mt-2 leading-relaxed">
              Prepare for campus placements and technical rounds with realistic AI mock interviews,
              resume-grounded defenses, and DSA practice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartMock()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#101010] text-[#F8F5EE] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-all shadow-sm cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>Start AI Mock Interview</span>
            </button>
            <button
              onClick={() => onNavigateTab('resume-questions')}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-sm font-semibold hover:bg-[#F5F2EB] transition-all cursor-pointer"
            >
              <span>Resume Defense Drill</span>
              <ArrowRight className="w-4 h-4 text-[#888888]" />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-[#E8E2D7]">
          {/* Card 1: Technical Readiness */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Technical Readiness</span>
              <Code2 className="w-4 h-4 text-[#101010]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#101010]">
                {metrics.technicalReadinessPercent}%
              </span>
              <span className="text-[11px] text-[#888888]">qualitative</span>
            </div>
            <div className="w-full bg-[#EFECE6] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#101010] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.technicalReadinessPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: HR Readiness */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>HR & Behavioral</span>
              <Users className="w-4 h-4 text-[#101010]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#101010]">
                {metrics.hrReadinessPercent}%
              </span>
              <span className="text-[11px] text-[#888888]">practice</span>
            </div>
            <div className="w-full bg-[#EFECE6] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#101010] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.hrReadinessPercent}%` }}
              />
            </div>
          </div>

          {/* Card 3: DSA Topics */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>DSA Mastery</span>
              <Award className="w-4 h-4 text-[#101010]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#101010]">
                {metrics.dsaTopicsCompletedCount}
                <span className="text-sm font-normal text-[#888888]">/{metrics.dsaTotalTopics}</span>
              </span>
              <span className="text-[11px] text-[#888888]">topics</span>
            </div>
            <div className="w-full bg-[#EFECE6] h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-[#101010] h-full rounded-full transition-all duration-500"
                style={{ width: `${(metrics.dsaTopicsCompletedCount / metrics.dsaTotalTopics) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 4: Mock Attempts */}
          <div className="bg-white/80 backdrop-blur-xs border border-[#EAE5DC] rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-[#666666] font-medium mb-1">
              <span>Mock Sessions</span>
              <Mic className="w-4 h-4 text-[#101010]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#101010]">
                {metrics.totalSessionsCompleted}
              </span>
              {metrics.averageMockScore > 0 ? (
                <span className="text-xs font-semibold text-[#101010]">
                  (Avg: {metrics.averageMockScore}%)
                </span>
              ) : (
                <span className="text-[11px] text-[#888888]">0 attempts</span>
              )}
            </div>
            <p className="text-[11px] text-[#888888] mt-2">
              {metrics.communicationPracticeCount} spoken / behavioral responses
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recommended Activities & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Recommended Activities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#101010]" />
              <h3 className="text-base font-bold text-[#101010]">
                Recommended Placement Activities
              </h3>
            </div>
            <span className="text-xs text-[#888888]">Grounded in your profile</span>
          </div>

          <div className="space-y-3">
            {metrics.recommendedActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white border border-[#E5E0D8] rounded-xl p-4 sm:p-5 hover:border-[#101010]/30 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        act.priority === 'high'
                          ? 'bg-[#101010] text-[#F8F5EE]'
                          : 'bg-[#F0ECE1] text-[#666666]'
                      }`}
                    >
                      {act.priority} priority
                    </span>
                    <span className="text-xs text-[#888888] capitalize">
                      {act.category.replace('-', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#101010]">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    {act.reason}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (act.category === 'dsa') onNavigateTab('dsa');
                    else if (act.category === 'hr') onNavigateTab('hr');
                    else if (act.category === 'resume-focused') onNavigateTab('resume-questions');
                    else onStartMock(act.category);
                  }}
                  className="shrink-0 self-start sm:self-center px-4 py-2 bg-[#F8F5EE] border border-[#E5E0D8] text-[#101010] text-xs font-semibold rounded-lg hover:bg-[#101010] hover:text-[#F8F5EE] hover:border-[#101010] transition-all cursor-pointer whitespace-nowrap"
                >
                  {act.actionLabel}
                </button>
              </div>
            ))}
          </div>

          {/* Quick Category Launchers */}
          <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4 sm:p-5 mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
              Explore Practice Domains
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => onStartMock('technical-fundamentals')}
                className="p-3 bg-white border border-[#E5E0D8] rounded-lg text-left hover:border-[#101010] transition-all cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-[#101010] mb-1.5" />
                <div className="text-xs font-semibold text-[#101010]">Tech Basics</div>
                <div className="text-[11px] text-[#888888]">OS, Networks, Langs</div>
              </button>
              <button
                onClick={() => onNavigateTab('dsa')}
                className="p-3 bg-white border border-[#E5E0D8] rounded-lg text-left hover:border-[#101010] transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#101010] mb-1.5" />
                <div className="text-xs font-semibold text-[#101010]">DSA Catalog</div>
                <div className="text-[11px] text-[#888888]">10 core topics</div>
              </button>
              <button
                onClick={() => onNavigateTab('hr')}
                className="p-3 bg-white border border-[#E5E0D8] rounded-lg text-left hover:border-[#101010] transition-all cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#101010] mb-1.5" />
                <div className="text-xs font-semibold text-[#101010]">HR & Behavioral</div>
                <div className="text-[11px] text-[#888888]">STAR framework</div>
              </button>
              <button
                onClick={() => onNavigateTab('coach')}
                className="p-3 bg-white border border-[#E5E0D8] rounded-lg text-left hover:border-[#101010] transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#101010] mb-1.5" />
                <div className="text-xs font-semibold text-[#101010]">AI Coach</div>
                <div className="text-[11px] text-[#888888]">Q&A Mentoring</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Mock Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#101010]" />
              <h3 className="text-base font-bold text-[#101010]">Recent Mock Attempts</h3>
            </div>
          </div>

          {metrics.recentSessions.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-6 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-[#888888] mx-auto stroke-[1.5]" />
              <div className="text-sm font-semibold text-[#101010]">No mock sessions yet</div>
              <p className="text-xs text-[#666666] leading-relaxed">
                Take a 5-question mock interview to test your responses and generate your first qualitative evaluation report.
              </p>
              <button
                onClick={() => onStartMock()}
                className="px-4 py-2 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-lg hover:bg-[#262626] transition-all cursor-pointer"
              >
                Start Diagnostic Mock
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentSessions.map((s) => {
                const score = s.performanceSummary?.overallScore ?? 0;
                const label = s.performanceSummary?.qualitativeLabel || 'Completed';
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectPastSession && onSelectPastSession(s)}
                    className="bg-white border border-[#E5E0D8] rounded-xl p-4 hover:border-[#101010] transition-all shadow-xs cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#101010] capitalize">
                        {s.category.replace('-', ' ')}
                      </span>
                      <span className="text-[#888888]">
                        {new Date(s.startedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[#101010]">
                          {score}
                          <span className="text-xs font-normal text-[#888888]">/100</span>
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-full text-[#666666] font-medium">
                          {label}
                        </span>
                      </div>
                      <span className="text-xs text-[#888888]">
                        {Object.keys(s.answers || {}).length} answered
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-[#FAF9F5] border border-[#E8E2D7] rounded-xl p-3.5 text-xs text-[#666666] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#888888] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Evaluation Note:</strong> All interview scores represent qualitative AI feedback
              designed to guide skill reinforcement, not deterministic hiring probabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
