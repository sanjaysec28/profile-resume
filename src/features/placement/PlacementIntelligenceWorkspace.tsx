/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Placement Intelligence Workspace
 * Top-level container coordinating genuine job discovery, deterministic eligibility,
 * resume skill matching, full-lifecycle application tracking, and AI application assistance.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Briefcase,
  Bookmark,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import {
  VerifiedJobOpportunity,
  ApplicationRecord,
  JobResumeMatchAnalysis,
  EligibilityAssessment,
  PlacementAnalytics,
} from '../../types/placementIntelligence.ts';
import { StudentProfile } from '../../types/profile.ts';
import { ResumeData } from '../../types/resume.ts';
import { ResumeSetupData } from '../../types/resumeSetup.ts';
import { CareerPlan } from '../../types/careerIntelligence.ts';
import { InterviewDashboardMetrics } from '../../types/interviewIntelligence.ts';
import { VERIFIED_JOB_OPPORTUNITIES } from '../../lib/verifiedJobCatalog.ts';
import {
  buildPlacementContext,
  calculateJobResumeMatch,
  evaluateJobEligibility,
} from '../../lib/placementScorer.ts';
import {
  loadSavedJobs,
  saveJobOpportunity,
  removeSavedJob,
  loadApplications,
  saveApplication,
  calculatePlacementAnalytics,
} from '../../lib/placementIntelligenceService.ts';
import { getSavedCareerPlan } from '../../lib/careerIntelligenceService.ts';
import {
  loadInterviewSessions,
  loadDsaTopics,
  loadHrQuestions,
  computeDashboardMetrics,
} from '../../lib/interviewIntelligenceService.ts';
import { PlacementDashboardOverview } from './components/PlacementDashboardOverview.tsx';
import { JobDiscoveryWorkspace } from './components/JobDiscoveryWorkspace.tsx';
import { ApplicationTrackerWorkspace } from './components/ApplicationTrackerWorkspace.tsx';
import { JobDetailModal } from './components/JobDetailModal.tsx';
import { AiApplicationAssistantModal } from './components/AiApplicationAssistantModal.tsx';
import { AddApplicationModal } from './components/AddApplicationModal.tsx';

type PlacementTab = 'dashboard' | 'discovery' | 'tracker' | 'saved';

interface PlacementIntelligenceWorkspaceProps {
  userId?: string;
  profile?: StudentProfile | null;
  resumeData?: ResumeData | null;
  setupData?: ResumeSetupData | null;
  careerPlan?: CareerPlan | null;
  interviewMetrics?: InterviewDashboardMetrics | null;
  onNavigateBack?: () => void;
  onNavigateToCareer?: () => void;
  onStartInterviewPrep?: (targetRole: string) => void;
}

export const PlacementIntelligenceWorkspace: React.FC<PlacementIntelligenceWorkspaceProps> = ({
  userId,
  profile,
  resumeData,
  setupData,
  careerPlan,
  interviewMetrics,
  onNavigateBack,
  onNavigateToCareer,
  onStartInterviewPrep,
}) => {
  const [activeTab, setActiveTab] = useState<PlacementTab>('dashboard');
  const [savedJobs, setSavedJobs] = useState<VerifiedJobOpportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedCareerPlan, setLoadedCareerPlan] = useState<CareerPlan | null>(careerPlan || null);
  const [loadedInterviewMetrics, setLoadedInterviewMetrics] = useState<InterviewDashboardMetrics | null>(interviewMetrics || null);

  // Modal states
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<VerifiedJobOpportunity | null>(null);
  const [selectedJobForDraft, setSelectedJobForDraft] = useState<VerifiedJobOpportunity | null>(null);
  const [editingApplication, setEditingApplication] = useState<ApplicationRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student placement context derived from profile, resume, and setup
  const studentContext = useMemo(() => {
    return buildPlacementContext(profile, resumeData, setupData);
  }, [profile, resumeData, setupData]);

  // Load persistence data on mount
  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const [loadedSaved, loadedApps] = await Promise.all([
          loadSavedJobs(userId),
          loadApplications(userId),
        ]);
        setSavedJobs(loadedSaved);
        setApplications(loadedApps);
      } catch (err) {
        console.warn('Failed to load placement persistence:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [userId]);

  // Load career roadmap plan if not provided via props
  useEffect(() => {
    if (careerPlan) {
      setLoadedCareerPlan(careerPlan);
    } else if (userId && studentContext.targetRole) {
      getSavedCareerPlan(userId, studentContext.targetRole)
        .then((plan) => {
          if (plan) setLoadedCareerPlan(plan);
        })
        .catch(() => {});
    }
  }, [userId, studentContext.targetRole, careerPlan]);

  // Load interview metrics if not provided via props
  useEffect(() => {
    if (interviewMetrics) {
      setLoadedInterviewMetrics(interviewMetrics);
    } else if (userId) {
      Promise.all([
        loadInterviewSessions(userId),
        loadDsaTopics(userId),
        loadHrQuestions(userId),
      ])
        .then(([sessions, dsa, hr]) => {
          setLoadedInterviewMetrics(computeDashboardMetrics(sessions, dsa, hr, studentContext.targetRole));
        })
        .catch(() => {});
    }
  }, [userId, interviewMetrics]);

  // Compute deterministic matches and eligibility for all verified opportunities
  const { matchMap, eligibilityMap } = useMemo(() => {
    const matches: Record<string, JobResumeMatchAnalysis> = {};
    const eligibilities: Record<string, EligibilityAssessment> = {};

    VERIFIED_JOB_OPPORTUNITIES.forEach((job) => {
      matches[job.id] = calculateJobResumeMatch(job, studentContext);
      eligibilities[job.id] = evaluateJobEligibility(job, studentContext);
    });

    return { matchMap: matches, eligibilityMap: eligibilities };
  }, [studentContext]);

  // Compute analytics
  const analytics: PlacementAnalytics = useMemo(() => {
    return calculatePlacementAnalytics(applications, savedJobs);
  }, [applications, savedJobs]);

  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((j) => j.id));
  }, [savedJobs]);

  const trackedJobIds = useMemo(() => {
    return new Set(applications.map((a) => a.jobId).filter((id): id is string => Boolean(id)));
  }, [applications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save / Unsave job handler
  const handleToggleSaveJob = async (job: VerifiedJobOpportunity) => {
    const isCurrentlySaved = savedJobIds.has(job.id);
    if (isCurrentlySaved) {
      await removeSavedJob(userId, job.id);
      setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
      showToast(`Removed "${job.title}" from saved opportunities.`);
    } else {
      await saveJobOpportunity(userId, job);
      setSavedJobs((prev) => [job, ...prev]);
      showToast(`Saved "${job.title}" at ${job.company}.`);
    }
  };

  // Convert discovered job into an application record with duplicate prevention
  const handleTrackDiscoveredJob = (job: VerifiedJobOpportunity) => {
    const existingApp = applications.find((a) => a.jobId === job.id);
    if (existingApp) {
      showToast(`"${job.title}" at ${job.company} is already tracked in your pipeline.`);
      setEditingApplication(existingApp);
      setIsAddModalOpen(true);
      return;
    }

    const match = matchMap[job.id];
    const eligibility = eligibilityMap[job.id];

    const newApp: ApplicationRecord = {
      id: `app_from_${job.id}_${Date.now()}`,
      userId,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      companyWebsite: job.companyWebsite,
      location: job.location,
      workEnvironment: job.workEnvironment,
      jobType: job.jobType,
      jobUrl: job.originalUrl,
      sourceName: job.sourceName,
      status: 'preparing',
      matchScore: match?.matchScore,
      eligibilityStatus: eligibility?.overallStatus,
      eligibilitySummary: eligibility?.summary,
      deadline: job.applicationDeadline,
      notes: `Discovered on ProFile. Match score: ${match?.matchScore || 0}%.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingApplication(newApp);
    setIsAddModalOpen(true);
  };

  const recommendedJobsList = useMemo(() => {
    return VERIFIED_JOB_OPPORTUNITIES.map((job) => ({
      job,
      match: matchMap[job.id],
      eligibility: eligibilityMap[job.id],
    })).sort((a, b) => (b.match?.matchScore || 0) - (a.match?.matchScore || 0));
  }, [matchMap, eligibilityMap]);

  const tabs: { id: PlacementTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'discovery', label: 'Job Discovery', icon: Compass },
    { id: 'tracker', label: 'Application Tracker', icon: Briefcase },
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark },
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
            <span className="font-semibold text-[#101010]">Placement Intelligence</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Employer Directory</span>
          </div>
        </div>

        {/* Floating Pill Tabs */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-2xl p-1.5 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              let badgeCount: number | null = null;
              if (tab.id === 'tracker' && applications.length > 0) badgeCount = applications.length;
              if (tab.id === 'saved' && savedJobs.length > 0) badgeCount = savedJobs.length;

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
                  {badgeCount !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#666666]'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-xl text-center shadow-lg animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Tab Router */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-[#888888] bg-white border border-[#E5E0D8] rounded-2xl">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-3" />
            Loading placement intelligence data...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <PlacementDashboardOverview
                targetRole={studentContext.targetRole}
                analytics={analytics}
                recommendedJobs={recommendedJobsList}
                careerPlan={careerPlan || loadedCareerPlan}
                interviewMetrics={interviewMetrics || loadedInterviewMetrics}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onNavigateToCareer={onNavigateToCareer}
                onSelectJob={(job) => setSelectedJobForDetail(job)}
                onOpenAddApplication={() => {
                  setEditingApplication(null);
                  setIsAddModalOpen(true);
                }}
              />
            )}

            {activeTab === 'discovery' && (
              <JobDiscoveryWorkspace
                opportunities={VERIFIED_JOB_OPPORTUNITIES}
                matchMap={matchMap}
                eligibilityMap={eligibilityMap}
                savedJobIds={savedJobIds}
                trackedJobIds={trackedJobIds}
                onToggleSaveJob={handleToggleSaveJob}
                onSelectJob={(job) => setSelectedJobForDetail(job)}
                onPrepareApplication={(job) => setSelectedJobForDraft(job)}
                onTrackJob={handleTrackDiscoveredJob}
                onAddManualJob={() => {
                  setEditingApplication(null);
                  setIsAddModalOpen(true);
                }}
              />
            )}

            {activeTab === 'tracker' && (
              <ApplicationTrackerWorkspace
                userId={userId}
                applications={applications}
                onApplicationsUpdated={(updated) => setApplications(updated)}
                onOpenAddModal={() => {
                  setEditingApplication(null);
                  setIsAddModalOpen(true);
                }}
                onEditApplication={(app) => {
                  setEditingApplication(app);
                  setIsAddModalOpen(true);
                }}
              />
            )}

            {activeTab === 'saved' && (
              <JobDiscoveryWorkspace
                opportunities={savedJobs}
                matchMap={matchMap}
                eligibilityMap={eligibilityMap}
                savedJobIds={savedJobIds}
                trackedJobIds={trackedJobIds}
                onToggleSaveJob={handleToggleSaveJob}
                onSelectJob={(job) => setSelectedJobForDetail(job)}
                onPrepareApplication={(job) => setSelectedJobForDraft(job)}
                onTrackJob={handleTrackDiscoveredJob}
                onAddManualJob={() => {
                  setEditingApplication(null);
                  setIsAddModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Modal 1: Job Details & Eligibility Breakdown */}
      {selectedJobForDetail && (
        <JobDetailModal
          job={selectedJobForDetail}
          match={matchMap[selectedJobForDetail.id] || null}
          eligibility={eligibilityMap[selectedJobForDetail.id] || null}
          isSaved={savedJobIds.has(selectedJobForDetail.id)}
          onClose={() => setSelectedJobForDetail(null)}
          onToggleSave={handleToggleSaveJob}
          onTrackApplication={handleTrackDiscoveredJob}
          onPrepareDraft={(j) => setSelectedJobForDraft(j)}
          onStartInterviewPrep={onStartInterviewPrep}
        />
      )}

      {/* Modal 2: AI Application Assistant (Cover letter, Application Email & Recruiter Outreach) */}
      {selectedJobForDraft && (
        <AiApplicationAssistantModal
          job={selectedJobForDraft}
          studentContext={{
            studentName: profile?.fullName || 'Student',
            targetRole: studentContext.targetRole,
            degree: studentContext.degree,
            major: studentContext.major,
            academicYear: studentContext.academicYear,
            graduationYear: studentContext.graduationYear,
            collegeOrUniversity: profile?.collegeOrUniversity,
            verifiedSkills: studentContext.technicalSkills,
            projects: studentContext.projects,
          }}
          userId={userId}
          onClose={() => setSelectedJobForDraft(null)}
          onDraftApproved={(draft) => {
            if (draft.jobId) {
              const existing = applications.find((a) => a.jobId === draft.jobId);
              if (existing) {
                const updated: ApplicationRecord = {
                  ...existing,
                  coverLetterDraftId: draft.id,
                  coverLetterSnippet: draft.tailoredCoverLetter?.slice(0, 200),
                  updatedAt: new Date().toISOString(),
                };
                saveApplication(userId, updated)
                  .then(() => {
                    setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                  })
                  .catch((err) => console.warn('Failed to link draft to application:', err));
              }
            }
            showToast('Application draft approved and saved to your pipeline.');
          }}
        />
      )}

      {/* Modal 3: Add / Edit Application Record */}
      {isAddModalOpen && (
        <AddApplicationModal
          userId={userId}
          initialData={editingApplication}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingApplication(null);
          }}
          onSaved={(savedRecord) => {
            setApplications((prev) => {
              const filtered = prev.filter((a) => a.id !== savedRecord.id);
              return [savedRecord, ...filtered];
            });
            showToast(`Tracked application for ${savedRecord.company}.`);
          }}
        />
      )}
    </div>
  );
};
