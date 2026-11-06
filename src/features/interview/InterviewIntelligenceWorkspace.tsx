/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Interview Intelligence Workspace
 * Main container uniting AI Mock Interviews, Resume Defense, DSA Practice,
 * HR Training, AI Interview Coaching, and History Tracking.
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  LayoutDashboard,
  Mic,
  FileText,
  Code2,
  Users,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  InterviewSession,
  DsaTopic,
  HrPracticeQuestion,
  InterviewDashboardMetrics,
} from '../../types/interviewIntelligence.ts';
import {
  loadInterviewSessions,
  loadDsaTopics,
  loadHrQuestions,
  computeDashboardMetrics,
} from '../../lib/interviewIntelligenceService.ts';
import { InterviewDashboardOverview } from './components/InterviewDashboardOverview.tsx';
import { MockInterviewRoom } from './components/MockInterviewRoom.tsx';
import { ResumeQuestionsPanel } from './components/ResumeQuestionsPanel.tsx';
import { DsaPracticeWorkspace } from './components/DsaPracticeWorkspace.tsx';
import { HrPracticeWorkspace } from './components/HrPracticeWorkspace.tsx';
import { InterviewCoachPanel } from './components/InterviewCoachPanel.tsx';
import { InterviewSessionHistoryView } from './components/InterviewSessionHistoryView.tsx';
import { StudentProfile } from '../../types/profile.ts';
import { ResumeData } from '../../types/resume.ts';
import { ResumeSetupData } from '../../types/resumeSetup.ts';
import { CareerPlan } from '../../types/careerIntelligence.ts';
import { getSavedCareerPlan } from '../../lib/careerIntelligenceService.ts';
import { INITIAL_DSA_TOPICS, CORE_HR_QUESTIONS } from '../../lib/interviewPrepData.ts';

export type InterviewTab = 'overview' | 'mock' | 'resume-questions' | 'dsa' | 'hr' | 'coach' | 'history';

export interface InterviewNavContext {
  tab?: InterviewTab | string;
  category?: string;
  topic?: string;
  targetedSkillGaps?: string[];
}

interface InterviewIntelligenceWorkspaceProps {
  userId?: string;
  profile?: StudentProfile | null;
  resumeData?: ResumeData | null;
  setupData?: ResumeSetupData | null;
  careerPlan?: CareerPlan | null;
  initialTab?: InterviewTab | string;
  initialMockCategory?: string;
  initialTargetedGaps?: string[];
  initialTopic?: string;
  onNavigateBack?: () => void;
  onClearNavContext?: () => void;
}

export const InterviewIntelligenceWorkspace: React.FC<InterviewIntelligenceWorkspaceProps> = ({
  userId,
  profile,
  resumeData,
  setupData,
  careerPlan,
  initialTab,
  initialMockCategory: propInitialMockCategory,
  initialTargetedGaps,
  onNavigateBack,
  onClearNavContext,
}) => {
  const [activeTab, setActiveTab] = useState<InterviewTab>(
    (initialTab as InterviewTab) || 'overview'
  );
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [dsaTopics, setDsaTopics] = useState<DsaTopic[]>(INITIAL_DSA_TOPICS);
  const [hrQuestions, setHrQuestions] = useState<HrPracticeQuestion[]>(CORE_HR_QUESTIONS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialMockCategory, setInitialMockCategory] = useState<string>(
    propInitialMockCategory || 'technical-fundamentals'
  );
  const [resolvedCareerPlan, setResolvedCareerPlan] = useState<CareerPlan | null>(
    careerPlan || null
  );

  // Derive target role and student profile context safely
  const targetRole =
    (typeof setupData?.targetRole === 'object' && setupData.targetRole?.title)
      ? setupData.targetRole.title
      : (typeof setupData?.targetRole === 'string' && setupData.targetRole)
      ? setupData.targetRole
      : profile?.targetRole ||
        'Software Engineer';

  const academicYear =
    setupData?.profileContext?.academicYear ||
    '3rd Year';

  const degree =
    setupData?.profileContext?.degree ||
    resumeData?.education?.[0]?.degree ||
    'B.Tech';

  const verifiedSkills = resumeData?.skills?.technical || [];

  const projectsSummary = (resumeData?.projects || []).map((p) => ({
    title: p.title,
    techStack: p.techStack || [],
    description: p.description || '',
    bullets: p.bullets || [],
  }));

  // Synchronize incoming navigation context changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as InterviewTab);
    }
    if (propInitialMockCategory) {
      setInitialMockCategory(propInitialMockCategory);
    }
  }, [initialTab, propInitialMockCategory]);

  // Load career plan if not passed as prop to synchronize skill gaps & weak topics
  useEffect(() => {
    if (careerPlan) {
      setResolvedCareerPlan(careerPlan);
    } else if (userId && targetRole) {
      getSavedCareerPlan(userId, targetRole)
        .then((plan) => {
          if (plan) setResolvedCareerPlan(plan);
        })
        .catch((err) => {
          console.warn('Could not load career plan for interview workspace:', err);
        });
    }
  }, [careerPlan, userId, targetRole]);

  // Derive verified skills, missing skills, and weak topics from career roadmap & resume
  const missingSkillsFromPlan = (resolvedCareerPlan?.skillGaps || [])
    .filter((g) => g.status === 'missing' || g.status === 'learning')
    .map((g) => g.name);

  const effectiveMissingSkills = Array.from(
    new Set([...(initialTargetedGaps || []), ...missingSkillsFromPlan])
  );

  const effectiveWeakTopics =
    effectiveMissingSkills.length > 0
      ? effectiveMissingSkills.slice(0, 8)
      : ['System Design', 'Dynamic Programming', 'SQL Indexing'];

  // Load persistence data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [savedSessions, savedDsa, savedHr] = await Promise.all([
          loadInterviewSessions(userId),
          loadDsaTopics(userId),
          loadHrQuestions(userId),
        ]);
        setSessions(savedSessions);
        if (savedDsa && savedDsa.length > 0) setDsaTopics(savedDsa);
        if (savedHr && savedHr.length > 0) setHrQuestions(savedHr);
      } catch (err) {
        console.warn('Failed to load interview intelligence data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userId]);

  // Compute dashboard metrics
  const metrics: InterviewDashboardMetrics = computeDashboardMetrics(
    sessions,
    dsaTopics,
    hrQuestions,
    targetRole
  );

  const handleStartMockFromOverview = (category?: string) => {
    if (category) setInitialMockCategory(category);
    setActiveTab('mock');
  };

  const tabs: { id: InterviewTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'mock', label: 'AI Mock Interview', icon: Mic },
    { id: 'resume-questions', label: 'Resume Defense', icon: FileText },
    { id: 'dsa', label: 'DSA & Coding', icon: Code2 },
    { id: 'hr', label: 'HR & Behavioral', icon: Users },
    { id: 'coach', label: 'AI Coach', icon: Bot },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5EE] py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#888888]">
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="inline-flex items-center gap-1 hover:text-[#101010] transition-colors cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-[#CCCCCC]" />
            <span className="font-semibold text-[#101010]">Interview Intelligence</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Placement Training System</span>
          </div>
        </div>

        {/* Floating Pill Tab Navigation */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-2xl p-1.5 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                      : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'history' && sessions.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#666666]'
                      }`}
                    >
                      {sessions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Router */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-[#888888] bg-white border border-[#E5E0D8] rounded-2xl">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-3" />
            Loading your interview readiness workspace...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <InterviewDashboardOverview
                metrics={metrics}
                onStartMock={handleStartMockFromOverview}
                onNavigateTab={(tab) => {
                  if (tab === 'mock') setActiveTab('mock');
                  else if (tab === 'resume-questions') setActiveTab('resume-questions');
                  else if (tab === 'dsa') setActiveTab('dsa');
                  else if (tab === 'hr') setActiveTab('hr');
                  else if (tab === 'coach') setActiveTab('coach');
                }}
                onSelectPastSession={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'mock' && (
              <MockInterviewRoom
                userId={userId}
                targetRole={targetRole}
                initialCategory={initialMockCategory}
                academicYear={academicYear}
                degree={degree}
                verifiedSkills={verifiedSkills}
                missingSkills={effectiveMissingSkills}
                projectsSummary={projectsSummary}
                onSessionComplete={(completed) => {
                  setSessions((prev) => [completed, ...prev.filter((s) => s.id !== completed.id)]);
                }}
                onExit={() => {
                  if (onClearNavContext) onClearNavContext();
                  setActiveTab('overview');
                }}
              />
            )}

            {activeTab === 'resume-questions' && (
              <ResumeQuestionsPanel
                targetRole={targetRole}
                projectsSummary={projectsSummary}
                verifiedSkills={verifiedSkills}
                onStartFullMock={() => {
                  setInitialMockCategory('resume-focused');
                  setActiveTab('mock');
                }}
              />
            )}

            {activeTab === 'dsa' && (
              <DsaPracticeWorkspace
                userId={userId}
                topics={dsaTopics}
                onTopicsUpdated={(updated) => setDsaTopics(updated)}
                onStartDsaMock={() => {
                  setInitialMockCategory('dsa');
                  setActiveTab('mock');
                }}
              />
            )}

            {activeTab === 'hr' && (
              <HrPracticeWorkspace
                userId={userId}
                targetRole={targetRole}
                questions={hrQuestions}
                onQuestionsUpdated={(updated) => setHrQuestions(updated)}
              />
            )}

            {activeTab === 'coach' && (
              <InterviewCoachPanel
                targetRole={targetRole}
                academicYear={academicYear}
                degree={degree}
                verifiedSkills={verifiedSkills}
                weakTopics={effectiveWeakTopics}
                recentMockScore={metrics.averageMockScore || undefined}
                resumeProjects={projectsSummary.map((p) => p.title)}
              />
            )}

            {activeTab === 'history' && (
              <InterviewSessionHistoryView
                userId={userId}
                sessions={sessions}
                onSessionsUpdated={(updated) => setSessions(updated)}
                onBack={() => setActiveTab('overview')}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
