/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 5: Career Intelligence & Personalized Learning Roadmap
 * Main workspace orchestrating readiness analytics, 6-stage roadmap,
 * project recommendations, certification tracking, and AI career guidance.
 */

import { useState, useEffect } from 'react';
import { ResumeData } from '../../types/resume.ts';
import { StudentProfile } from '../../types/profile.ts';
import { ResumeSetupData } from '../../types/resumeSetup.ts';
import { AppView } from '../../types/navigation.ts';
import {
  CareerPlan,
  RoadmapTaskStatus,
  ProjectStatus,
  RoadmapStageId,
  SkillStatus,
  SkillGapItem,
  SkillCategory,
} from '../../types/careerIntelligence.ts';
import { InterviewDashboardMetrics } from '../../types/interviewIntelligence.ts';
import {
  loadInterviewSessions,
  loadDsaTopics,
  loadHrQuestions,
  computeDashboardMetrics,
} from '../../lib/interviewIntelligenceService.ts';
import {
  getSavedCareerPlan,
  generateNewCareerPlan,
  updateTaskStatus,
  updateProjectStatus,
  toggleProjectMilestone,
  updateCertificationStatus,
  addCustomRoadmapTask,
  deleteRoadmapTask,
} from '../../lib/careerIntelligenceService.ts';
import { CareerReadinessCard } from './components/CareerReadinessCard.tsx';
import { SkillGapMatrix } from './components/SkillGapMatrix.tsx';
import { RoadmapStageView } from './components/RoadmapStageView.tsx';
import { ProjectRecommendationCard } from './components/ProjectRecommendationCard.tsx';
import { CertificationCard } from './components/CertificationCard.tsx';
import { CareerAiAssistantPanel } from './components/CareerAiAssistantPanel.tsx';
import {
  Compass,
  RefreshCw,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  BookOpen,
  FolderGit2,
  Award,
  Bot,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface CareerIntelligenceWorkspaceProps {
  user?: any;
  profile: StudentProfile;
  resumeData: ResumeData;
  resumeSetup?: ResumeSetupData | null;
  onNavigate: (view: AppView) => void;
  onNavigateToInterview?: (context?: { tab?: string; category?: string; topic?: string; targetedSkillGaps?: string[] }) => void;
  onSignOut?: () => void;
}

export function CareerIntelligenceWorkspace({
  user,
  profile,
  resumeData,
  resumeSetup,
  onNavigate,
  onNavigateToInterview,
  onSignOut,
}: CareerIntelligenceWorkspaceProps) {
  const targetRole =
    resumeSetup?.targetRole?.title ||
    profile.targetRole ||
    resumeData.personalInfo?.professionalTitle ||
    'Full Stack Engineer';

  const [careerPlan, setCareerPlan] = useState<CareerPlan | null>(null);
  const [interviewMetrics, setInterviewMetrics] = useState<InterviewDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'readiness' | 'gaps' | 'roadmap' | 'projects' | 'certifications' | 'chat'
  >('readiness');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load interview metrics to connect simulation progress with career readiness
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      loadInterviewSessions(user?.uid),
      loadDsaTopics(user?.uid),
      loadHrQuestions(user?.uid),
    ])
      .then(([savedSessions, savedDsa, savedHr]) => {
        if (!isMounted) return;
        const metrics = computeDashboardMetrics(savedSessions, savedDsa, savedHr, targetRole);
        setInterviewMetrics(metrics);
      })
      .catch((err) => {
        console.warn('Failed to load interview metrics for career workspace:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid, targetRole]);

  // Load existing plan or generate initial plan
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getSavedCareerPlan(user?.uid, targetRole)
      .then((existing) => {
        if (!isMounted) return;
        if (existing) {
          setCareerPlan(existing);
          setIsLoading(false);
        } else {
          // Generate new plan
          handleGeneratePlan();
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Error loading plan:', err);
          handleGeneratePlan();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetRole, user?.uid]);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const plan = await generateNewCareerPlan(
        user?.uid,
        targetRole,
        resumeData,
        profile,
        resumeSetup,
        10
      );
      setCareerPlan(plan);
      showToast('Generated personalized learning roadmap & skill analysis.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    status: RoadmapTaskStatus,
    notes?: string
  ) => {
    if (!careerPlan) return;
    const updated = await updateTaskStatus(user?.uid, careerPlan, taskId, status, notes);
    setCareerPlan(updated);
    showToast(`Task marked as ${status.replace('-', ' ')}!`);
  };

  const handleAddCustomTask = async (
    stageId: RoadmapStageId,
    title: string,
    objective: string
  ) => {
    if (!careerPlan) return;
    const updated = await addCustomRoadmapTask(user?.uid, careerPlan, stageId, title, objective);
    setCareerPlan(updated);
    showToast('Custom learning milestone added!');
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!careerPlan) return;
    const updated = await deleteRoadmapTask(user?.uid, careerPlan, taskId);
    setCareerPlan(updated);
    showToast('Task removed from roadmap.');
  };

  const handleUpdateProject = async (
    projectId: string,
    status: ProjectStatus,
    links?: { githubUrl?: string; liveUrl?: string; studentNotes?: string }
  ) => {
    if (!careerPlan) return;
    const updated = await updateProjectStatus(user?.uid, careerPlan, projectId, status, links);
    setCareerPlan(updated);
    showToast(`Project marked as ${status}!`);
  };

  const handleToggleMilestone = async (projectId: string, milestoneId: string) => {
    if (!careerPlan) return;
    const updated = await toggleProjectMilestone(user?.uid, careerPlan, projectId, milestoneId);
    setCareerPlan(updated);
  };

  const handleUpdateCertification = async (
    certId: string,
    status: 'recommended' | 'pursuing' | 'completed'
  ) => {
    if (!careerPlan) return;
    const updated = await updateCertificationStatus(user?.uid, careerPlan, certId, status);
    setCareerPlan(updated);
    showToast(`Certification updated to ${status}!`);
  };

  // Toggle skill learning status
  const handleToggleLearningSkill = (skillName: string) => {
    if (!careerPlan) return;
    const updatedGaps: SkillGapItem[] = careerPlan.skillGaps.map((g) => {
      if (g.name.toLowerCase() === skillName.toLowerCase()) {
        const nextStatus: SkillStatus = g.status === 'learning' ? 'missing' : 'learning';
        return { ...g, status: nextStatus };
      }
      return g;
    });
    setCareerPlan({ ...careerPlan, skillGaps: updatedGaps });
    showToast(`Updated learning status for ${skillName}`);
  };

  // Handle practicing a specific skill gap in Interview Hub
  const handlePracticeSkillGap = (skillName: string, category: SkillCategory) => {
    let tab = 'mock';
    let mockCategory = 'technical-fundamentals';
    const catStr = category as string;
    const nameLower = skillName.toLowerCase();

    if (
      category === 'core-cs' ||
      catStr === 'dsa' ||
      nameLower.includes('dsa') ||
      nameLower.includes('algorithm') ||
      nameLower.includes('data structure')
    ) {
      tab = 'dsa';
      mockCategory = 'dsa';
    } else if (category === 'soft-skills') {
      tab = 'hr';
      mockCategory = 'behavioral-hr';
    } else if (
      category === 'system-design' ||
      nameLower.includes('system design') ||
      nameLower.includes('architecture')
    ) {
      tab = 'mock';
      mockCategory = 'system-design';
    } else if (
      category === 'databases-storage' ||
      nameLower.includes('sql') ||
      nameLower.includes('database')
    ) {
      tab = 'mock';
      mockCategory = 'database-sql';
    }

    if (onNavigateToInterview) {
      onNavigateToInterview({
        tab,
        category: mockCategory,
        topic: skillName,
        targetedSkillGaps: [skillName],
      });
    } else {
      onNavigate('interview-prep');
    }
  };

  const allTasks = careerPlan?.roadmapStages.flatMap((s) => s.tasks) || [];
  const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;
  const plannedProjectsCount = (careerPlan?.recommendedProjects || []).filter(
    (p) => p.status === 'in-progress' || p.status === 'planned' || p.status === 'completed'
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 select-none">
      {/* Top Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="w-9 h-9 rounded-xl bg-white border border-[#E5E0D8] hover:bg-[#FAF9F5] flex items-center justify-center text-[#101010] shadow-2xs transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D1F] bg-[#FAF5EC] border border-[#E8DEC8] px-2 py-0.5 rounded-md">
                  Roadmap Engine
                </span>
                <span className="text-xs text-[#777777]">
                  Personalized Roadmap
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#101010] tracking-tight">
                Career Intelligence & Roadmap
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('resume-builder')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer"
            >
              <span>Back to Resume</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101010] hover:bg-[#252525] text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Regenerating...' : 'Refresh Roadmap'}</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Overview Bar */}
        {careerPlan && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F] shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777] block">
                  Readiness Index
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#101010] font-mono">
                  {careerPlan.readiness.overallReadinessScore}/100
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777] block">
                  Tasks Completed
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#101010] font-mono">
                  {completedTasksCount}/{allTasks.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777] block">
                  Active Projects
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#101010] font-mono">
                  {plannedProjectsCount}/3
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#777777] block">
                  Target Role
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#101010] truncate max-w-[130px] block">
                  {careerPlan.targetRole}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white border border-[#E5E0D8] rounded-2xl p-1.5 text-xs font-semibold scrollbar-none shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('readiness')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'readiness'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#8C6D1F]" />
            <span>Overview & Readiness</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gaps')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gaps'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Skill Gap Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'roadmap'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>6-Stage Roadmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Proposed Projects</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'certifications'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Certifications & Courses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#101010] text-white font-bold'
                : 'text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-teal-600" />
            <span>AI Career Assistant</span>
          </button>
        </div>

        {/* Dynamic Workspace Body */}
        {isLoading ? (
          <div className="py-24 bg-white rounded-[28px] border border-[#E5E0D8] flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-10 h-10 text-[#8C6D1F] animate-spin mb-4" />
            <h3 className="text-base font-bold text-[#101010] mb-1">
              Analyzing Student Profile & Architecting Roadmap...
            </h3>
            <p className="text-xs text-[#777777] max-w-md">
              Comparing your verified skills with industry requirements for <strong>{targetRole}</strong>,
              structuring practical exercises, and selecting proposed project ideas.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-[28px] text-center space-y-3">
            <h3 className="text-sm font-bold text-rose-900">Career Analysis Could Not Be Completed</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
            <button
              type="button"
              onClick={handleGeneratePlan}
              className="px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : careerPlan ? (
          <div>
            {/* TAB 1: READINESS OVERVIEW */}
            {activeTab === 'readiness' && (
              <div className="space-y-6">
                <CareerReadinessCard
                  readiness={careerPlan.readiness}
                  targetRole={careerPlan.targetRole}
                  academicYear={careerPlan.academicYear}
                  graduationYear={careerPlan.graduationYear}
                  degree={careerPlan.degree}
                  major={careerPlan.major}
                  interviewMetrics={interviewMetrics}
                  onNavigateToInterview={() =>
                    onNavigateToInterview ? onNavigateToInterview() : onNavigate('interview-prep')
                  }
                />

                {/* Quick Transition to Roadmap */}
                <div className="bg-[#FAF5EC] border border-[#E8DEC8] rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#101010]">Ready to start learning?</h4>
                    <p className="text-xs text-[#777777] mt-0.5">
                      Check your 6-stage structured curriculum and start checking off skills.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('roadmap')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101010] text-white text-xs font-semibold hover:bg-[#252525] cursor-pointer shrink-0"
                  >
                    <span>View Learning Roadmap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SKILL GAP MATRIX */}
            {activeTab === 'gaps' && (
              <SkillGapMatrix
                skillGaps={careerPlan.skillGaps}
                onToggleLearning={handleToggleLearningSkill}
                onPracticeSkillGap={handlePracticeSkillGap}
              />
            )}

            {/* TAB 3: 6-STAGE ROADMAP */}
            {activeTab === 'roadmap' && (
              <RoadmapStageView
                stages={careerPlan.roadmapStages}
                onUpdateTaskStatus={handleUpdateTask}
                onAddTask={handleAddCustomTask}
                onDeleteTask={handleDeleteTask}
                onNavigateToInterviewPrep={(ctx) =>
                  onNavigateToInterview ? onNavigateToInterview(ctx) : onNavigate('interview-prep')
                }
              />
            )}

            {/* TAB 4: PROPOSED PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#101010]">
                      Proposed Practical Projects
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Curated project ideas targeting missing competencies for {careerPlan.targetRole}.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#8C6D1F] bg-[#FAF5EC] border border-[#E8DEC8] px-3 py-1 rounded-full">
                    {careerPlan.recommendedProjects.length} Project Ideas
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {careerPlan.recommendedProjects.map((proj) => (
                    <ProjectRecommendationCard
                      key={proj.id}
                      project={proj}
                      onUpdateStatus={handleUpdateProject}
                      onToggleMilestone={handleToggleMilestone}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: CERTIFICATIONS */}
            {activeTab === 'certifications' && (
              <div className="space-y-4">
                <div className="p-4 bg-white border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#101010]">
                      Recommended Certifications & Courses
                    </h3>
                    <p className="text-xs text-[#777777]">
                      Industry-verified credentials from official course platforms.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {careerPlan.recommendedCertifications.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      onUpdateStatus={handleUpdateCertification}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: AI CAREER ASSISTANT */}
            {activeTab === 'chat' && (
              <CareerAiAssistantPanel
                careerPlan={careerPlan}
                interviewMetrics={interviewMetrics}
              />
            )}
          </div>
        ) : null}

      {/* Subtle Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101010] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
