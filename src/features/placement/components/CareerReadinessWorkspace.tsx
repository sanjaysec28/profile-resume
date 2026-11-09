/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.3: Career Readiness, Skill Gap & Career Roadmap Workspace
 * Displays 5 separate readiness indicators (zero fake guarantees), 4-state role skill gaps,
 * practical learning sequences, project connections, and interactive milestone management.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  Compass,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  FileText,
  Code2,
  FolderGit2,
  MessageSquare,
  Briefcase,
  Target,
  ArrowRight,
} from 'lucide-react';
import {
  CareerReadinessIndicators,
  RoleSkillGapAnalysis,
  CareerRoadmap,
  CareerRoadmapMilestone,
  ClassifiedSkillItem,
  MilestoneCategory,
  MilestoneStatus,
  MilestonePriority,
} from '../../../types/careerReadiness.ts';
import {
  calculateCareerReadinessIndicators,
  analyzeRoleSkillGaps,
  loadCareerRoadmap,
  saveCareerRoadmap,
} from '../../../lib/careerReadinessEngine.ts';
import { PlacementStudentContext, ApplicationRecord } from '../../../types/placementIntelligence.ts';
import { ResumeData } from '../../../types/resume.ts';
import { InterviewSession } from '../../../types/interviewIntelligence.ts';

interface CareerReadinessWorkspaceProps {
  userId?: string;
  studentContext: PlacementStudentContext;
  resumeData?: ResumeData | null;
  applications?: ApplicationRecord[];
  interviewSessions?: InterviewSession[];
  onStartInterviewPrep?: (context?: { targetRole?: string; type?: string; projectTitle?: string }) => void;
  onNavigateToDiscovery?: () => void;
  onNavigateToTracker?: () => void;
}

export const CareerReadinessWorkspace: React.FC<CareerReadinessWorkspaceProps> = ({
  userId,
  studentContext,
  resumeData,
  applications = [],
  interviewSessions = [],
  onStartInterviewPrep,
  onNavigateToDiscovery,
  onNavigateToTracker,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>(
    studentContext.targetRole || 'Full Stack Engineer'
  );
  const [activeSubTab, setActiveSubTab] = useState<'readiness' | 'skill_gaps' | 'roadmap'>('readiness');

  // Skill gap filtering
  const [skillFilter, setSkillFilter] = useState<'all' | 'demonstrated' | 'partially_demonstrated' | 'missing' | 'unverified'>('all');

  // Roadmap filtering
  const [roadmapCategoryFilter, setRoadmapCategoryFilter] = useState<string>('all');
  const [roadmapStatusFilter, setRoadmapStatusFilter] = useState<string>('all');

  // Roadmap State & Persistence
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(true);

  // Modal State for adding/editing milestone
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<CareerRoadmapMilestone | null>(null);
  const [milestoneFormData, setMilestoneFormData] = useState<{
    title: string;
    description: string;
    category: MilestoneCategory;
    priority: MilestonePriority;
    estimatedDuration: string;
    completionCriteria: string;
    optionalDeadline: string;
  }>({
    title: '',
    description: '',
    category: 'short_term',
    priority: 'medium',
    estimatedDuration: '1 week',
    completionCriteria: '',
    optionalDeadline: '',
  });

  // Calculate 5 separate readiness indicators
  const readinessIndicators: CareerReadinessIndicators = useMemo(() => {
    return calculateCareerReadinessIndicators(
      { ...studentContext, targetRole: selectedRole },
      resumeData,
      applications,
      interviewSessions
    );
  }, [studentContext, selectedRole, resumeData, applications, interviewSessions]);

  // Calculate 4-state role skill gaps
  const skillGapAnalysis: RoleSkillGapAnalysis = useMemo(() => {
    return analyzeRoleSkillGaps(selectedRole, studentContext);
  }, [selectedRole, studentContext]);

  // Load roadmap on mount or when role changes
  useEffect(() => {
    let isMounted = true;
    async function fetchRoadmap() {
      setIsLoadingRoadmap(true);
      try {
        const loaded = await loadCareerRoadmap(userId, selectedRole, skillGapAnalysis);
        if (isMounted) setRoadmap(loaded);
      } catch (err) {
        console.warn('Failed to load career roadmap:', err);
      } finally {
        if (isMounted) setIsLoadingRoadmap(false);
      }
    }
    fetchRoadmap();
    return () => {
      isMounted = false;
    };
  }, [userId, selectedRole, skillGapAnalysis]);

  // Handle milestone status toggle
  const handleToggleMilestone = async (milestoneId: string) => {
    if (!roadmap) return;
    const updatedMilestones = roadmap.milestones.map((m) => {
      if (m.id === milestoneId) {
        const nextStatus: MilestoneStatus =
          m.status === 'completed' ? 'not_started' : m.status === 'in_progress' ? 'completed' : 'in_progress';
        return {
          ...m,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return m;
    });

    const updatedRoadmap: CareerRoadmap = {
      ...roadmap,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    };
    setRoadmap(updatedRoadmap);
    await saveCareerRoadmap(userId, updatedRoadmap);
  };

  // Handle milestone deletion
  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!roadmap) return;
    const updatedMilestones = roadmap.milestones.filter((m) => m.id !== milestoneId);
    const updatedRoadmap: CareerRoadmap = {
      ...roadmap,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    };
    setRoadmap(updatedRoadmap);
    await saveCareerRoadmap(userId, updatedRoadmap);
  };

  // Open milestone modal (create or edit)
  const openMilestoneModal = (milestone?: CareerRoadmapMilestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setMilestoneFormData({
        title: milestone.title,
        description: milestone.description,
        category: milestone.category,
        priority: milestone.priority,
        estimatedDuration: milestone.estimatedDuration,
        completionCriteria: milestone.completionCriteria,
        optionalDeadline: milestone.optionalDeadline || '',
      });
    } else {
      setEditingMilestone(null);
      setMilestoneFormData({
        title: '',
        description: '',
        category: 'short_term',
        priority: 'medium',
        estimatedDuration: '1 week',
        completionCriteria: '',
        optionalDeadline: '',
      });
    }
    setIsMilestoneModalOpen(true);
  };

  // Save milestone from modal
  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmap || !milestoneFormData.title.trim()) return;

    let updatedMilestones: CareerRoadmapMilestone[];

    if (editingMilestone) {
      updatedMilestones = roadmap.milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              title: milestoneFormData.title.trim(),
              description: milestoneFormData.description.trim(),
              category: milestoneFormData.category,
              priority: milestoneFormData.priority,
              estimatedDuration: milestoneFormData.estimatedDuration.trim() || '1 week',
              completionCriteria: milestoneFormData.completionCriteria.trim(),
              optionalDeadline: milestoneFormData.optionalDeadline || undefined,
            }
          : m
      );
    } else {
      const newMilestone: CareerRoadmapMilestone = {
        id: `ms_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: milestoneFormData.title.trim(),
        description: milestoneFormData.description.trim(),
        category: milestoneFormData.category,
        priority: milestoneFormData.priority,
        estimatedDuration: milestoneFormData.estimatedDuration.trim() || '1 week',
        status: 'not_started',
        completionCriteria: milestoneFormData.completionCriteria.trim() || 'Complete practical implementation.',
        optionalDeadline: milestoneFormData.optionalDeadline || undefined,
        isCustom: true,
        orderIndex: roadmap.milestones.length + 1,
      };
      updatedMilestones = [...roadmap.milestones, newMilestone];
    }

    const updatedRoadmap: CareerRoadmap = {
      ...roadmap,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
    };
    setRoadmap(updatedRoadmap);
    await saveCareerRoadmap(userId, updatedRoadmap);
    setIsMilestoneModalOpen(false);
  };

  // Filtered skills
  const filteredSkills = useMemo(() => {
    if (skillFilter === 'all') return skillGapAnalysis.classifiedSkills;
    return skillGapAnalysis.classifiedSkills.filter((s) => s.classification === skillFilter);
  }, [skillGapAnalysis, skillFilter]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    if (!roadmap) return [];
    return roadmap.milestones.filter((m) => {
      const matchCat = roadmapCategoryFilter === 'all' || m.category === roadmapCategoryFilter;
      const matchStatus = roadmapStatusFilter === 'all' || m.status === roadmapStatusFilter;
      return matchCat && matchStatus;
    });
  }, [roadmap, roadmapCategoryFilter, roadmapStatusFilter]);

  // Completed milestones calculation
  const roadmapStats = useMemo(() => {
    if (!roadmap) return { total: 0, completed: 0, percent: 0 };
    const total = roadmap.milestones.length;
    const completed = roadmap.milestones.filter((m) => m.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [roadmap]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Target Role & Header Bar */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-3">
              <Compass className="w-3.5 h-3.5 text-[#101010]" />
              <span>Career Readiness Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#101010] tracking-tight">
              Placement Preparation & Career Roadmap
            </h1>
            <p className="text-sm text-[#666666] mt-2 max-w-2xl leading-relaxed">
              Diagnostic readiness evaluations across five distinct dimensions, four-state role skill gaps,
              and structured career milestones to navigate campus placements and internships.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-[#E5E0D8] rounded-xl px-3 py-2">
              <Target className="w-4 h-4 text-[#888888]" />
              <label htmlFor="target-role-select" className="text-xs text-[#888888] font-medium whitespace-nowrap">
                Role:
              </label>
              <select
                id="target-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent text-sm font-semibold text-[#101010] focus:outline-hidden cursor-pointer"
              >
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
                <option value="AI / Machine Learning Engineer">AI / Machine Learning Engineer</option>
                <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => onStartInterviewPrep?.({ targetRole: selectedRole })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Start Mock Interview</span>
            </button>
          </div>
        </div>

        {/* Invariant Anti-Guarantee Notice */}
        <div className="mt-6 pt-6 border-t border-[#E5E0D8]/60 flex items-start gap-3 bg-white/60 rounded-xl p-3.5">
          <ShieldAlert className="w-4 h-4 text-[#666666] shrink-0 mt-0.5" />
          <p className="text-xs text-[#666666] leading-relaxed">
            <strong className="text-[#101010]">Transparency Invariant:</strong> {readinessIndicators.disclaimer}
          </p>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('readiness')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'readiness'
                ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
            }`}
          >
            5 Readiness Indicators
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('skill_gaps')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'skill_gaps'
                ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
            }`}
          >
            Skill Gap Matrix ({skillGapAnalysis.classifiedSkills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('roadmap')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'roadmap'
                ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
            }`}
          >
            Career Roadmap ({roadmapStats.completed}/{roadmapStats.total})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 5 SEPARATE READINESS INDICATORS */}
      {activeSubTab === 'readiness' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Resume Readiness */}
            <ReadinessCard
              icon={FileText}
              title={readinessIndicators.resumeReadiness.title}
              score={readinessIndicators.resumeReadiness.score}
              level={readinessIndicators.resumeReadiness.level}
              summary={readinessIndicators.resumeReadiness.summary}
              metricsBreakdown={readinessIndicators.resumeReadiness.metricsBreakdown}
              diagnosticNotes={readinessIndicators.resumeReadiness.diagnosticNotes}
            />

            {/* 2. Technical Skill Readiness */}
            <ReadinessCard
              icon={Code2}
              title={readinessIndicators.technicalSkillReadiness.title}
              score={readinessIndicators.technicalSkillReadiness.score}
              level={readinessIndicators.technicalSkillReadiness.level}
              summary={readinessIndicators.technicalSkillReadiness.summary}
              metricsBreakdown={readinessIndicators.technicalSkillReadiness.metricsBreakdown}
              diagnosticNotes={readinessIndicators.technicalSkillReadiness.diagnosticNotes}
              actionLabel="View Skill Gaps"
              onAction={() => setActiveSubTab('skill_gaps')}
            />

            {/* 3. Project Explanation Readiness */}
            <ReadinessCard
              icon={FolderGit2}
              title={readinessIndicators.projectExplanationReadiness.title}
              score={readinessIndicators.projectExplanationReadiness.score}
              level={readinessIndicators.projectExplanationReadiness.level}
              summary={readinessIndicators.projectExplanationReadiness.summary}
              metricsBreakdown={readinessIndicators.projectExplanationReadiness.metricsBreakdown}
              diagnosticNotes={readinessIndicators.projectExplanationReadiness.diagnosticNotes}
              actionLabel="Practice Project Defense"
              onAction={() => onStartInterviewPrep?.({ type: 'project_defense', targetRole: selectedRole })}
            />

            {/* 4. Interview Readiness */}
            <ReadinessCard
              icon={MessageSquare}
              title={readinessIndicators.interviewReadiness.title}
              score={readinessIndicators.interviewReadiness.score}
              level={readinessIndicators.interviewReadiness.level}
              summary={readinessIndicators.interviewReadiness.summary}
              metricsBreakdown={readinessIndicators.interviewReadiness.metricsBreakdown}
              diagnosticNotes={readinessIndicators.interviewReadiness.diagnosticNotes}
              actionLabel="Take Mock Interview"
              onAction={() => onStartInterviewPrep?.({ targetRole: selectedRole })}
            />

            {/* 5. Application Activity */}
            <ReadinessCard
              icon={Briefcase}
              title={readinessIndicators.applicationActivity.title}
              score={readinessIndicators.applicationActivity.score}
              level={readinessIndicators.applicationActivity.level}
              summary={readinessIndicators.applicationActivity.summary}
              metricsBreakdown={readinessIndicators.applicationActivity.metricsBreakdown}
              diagnosticNotes={readinessIndicators.applicationActivity.diagnosticNotes}
              actionLabel="Open Pipeline Kanban"
              onAction={onNavigateToTracker}
            />

            {/* Recommended Next Milestone Card */}
            <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#666666] mb-3">
                  <Sparkles className="w-4 h-4 text-[#101010]" />
                  <span>Actionable Step</span>
                </div>
                <h3 className="text-lg font-bold text-[#101010]">Personalized Next Action</h3>
                <p className="text-xs text-[#666666] mt-2 leading-relaxed">
                  Based on your diagnostic evaluations, start by tackling high-priority gaps in your career roadmap.
                </p>
                <div className="mt-4 p-3 bg-white rounded-xl border border-[#E5E0D8]">
                  <p className="text-xs font-medium text-[#101010]">
                    {roadmap?.milestones.find((m) => m.status === 'in_progress')?.title ||
                      roadmap?.milestones[0]?.title ||
                      'Review role benchmarks and align keywords.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('roadmap')}
                className="mt-6 w-full py-2.5 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-xs font-semibold hover:bg-[#F5F2EB] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Open Roadmap Milestones</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ROLE-BASED SKILL GAP ANALYSIS */}
      {activeSubTab === 'skill_gaps' && (
        <div className="space-y-6">
          {/* Summary metrics header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <span className="text-xs text-[#888888] font-medium">Demonstrated</span>
              <p className="text-2xl font-bold text-[#101010] mt-1">{skillGapAnalysis.demonstratedCount}</p>
              <span className="text-[11px] text-[#22c55e] font-medium mt-1 inline-block">Verified with projects</span>
            </div>
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <span className="text-xs text-[#888888] font-medium">Partially Demonstrated</span>
              <p className="text-2xl font-bold text-[#101010] mt-1">{skillGapAnalysis.partiallyDemonstratedCount}</p>
              <span className="text-[11px] text-[#3b82f6] font-medium mt-1 inline-block">Coursework / Basic usage</span>
            </div>
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <span className="text-xs text-[#888888] font-medium">Missing Core</span>
              <p className="text-2xl font-bold text-[#101010] mt-1">{skillGapAnalysis.missingCount}</p>
              <span className="text-[11px] text-[#ef4444] font-medium mt-1 inline-block">Study priority</span>
            </div>
            <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <span className="text-xs text-[#888888] font-medium">Unverified Mention</span>
              <p className="text-2xl font-bold text-[#101010] mt-1">{skillGapAnalysis.unverifiedCount}</p>
              <span className="text-[11px] text-[#888888] font-medium mt-1 inline-block">Needs project evidence</span>
            </div>
          </div>

          {/* Practical Learning Sequence Card */}
          <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-[#101010]" />
              <h3 className="text-sm font-bold text-[#101010]">Recommended Practical Learning Sequence</h3>
            </div>
            <p className="text-xs text-[#666666] mb-4">
              Prioritized execution order: master essential missing fundamentals before advancing to optional tools.
            </p>
            <div className="flex flex-wrap gap-2">
              {skillGapAnalysis.learningSequence.slice(0, 6).map((skill, idx) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#101010] shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-[#101010] text-[#F8F5EE] text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span>{skill.name}</span>
                  <span className="text-[10px] text-[#888888] capitalize">({skill.importance})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Project Integration Opportunities */}
          {skillGapAnalysis.projectOpportunities.length > 0 && (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <FolderGit2 className="w-4 h-4 text-[#101010]" />
                <h3 className="text-sm font-bold text-[#101010]">Connect Missing Skills to Your Projects</h3>
              </div>
              <p className="text-xs text-[#666666] mb-4">
                Rather than building new projects from scratch, integrate missing competencies directly into your existing documented projects:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skillGapAnalysis.projectOpportunities.map((opp, idx) => (
                  <div key={idx} className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#101010]">{opp.projectTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white border border-[#E5E0D8] rounded-full text-[#666666]">
                        +{opp.skillsToAdd.join(', ')}
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-2 leading-relaxed">{opp.suggestedEnhancement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#888888] font-medium mr-2">Filter state:</span>
            {(['all', 'demonstrated', 'partially_demonstrated', 'missing', 'unverified'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSkillFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  skillFilter === filter
                    ? 'bg-[#101010] text-[#F8F5EE]'
                    : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
                }`}
              >
                {filter === 'all'
                  ? 'All Skills'
                  : filter === 'demonstrated'
                  ? 'Demonstrated'
                  : filter === 'partially_demonstrated'
                  ? 'Partially Demonstrated'
                  : filter === 'missing'
                  ? 'Missing'
                  : 'Unverified'}
              </button>
            ))}
          </div>

          {/* Skill List */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-[#E5E0D8]">
              {filteredSkills.map((skill) => (
                <div key={skill.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF9F5]/60 transition-colors">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#101010]">{skill.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          skill.importance === 'essential'
                            ? 'bg-[#101010] text-[#F8F5EE]'
                            : skill.importance === 'important'
                            ? 'bg-[#FAF9F5] border border-[#E5E0D8] text-[#101010]'
                            : 'bg-white border border-[#E5E0D8] text-[#888888]'
                        }`}
                      >
                        {skill.importance}
                      </span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          skill.classification === 'demonstrated'
                            ? 'bg-[#22c55e]/10 text-[#15803d]'
                            : skill.classification === 'partially_demonstrated'
                            ? 'bg-[#3b82f6]/10 text-[#1d4ed8]'
                            : skill.classification === 'missing'
                            ? 'bg-[#ef4444]/10 text-[#b91c1c]'
                            : 'bg-[#6b7280]/10 text-[#374151]'
                        }`}
                      >
                        {skill.classification.replace('_', ' ')}
                      </span>
                    </div>

                    {skill.evidence && (
                      <p className="text-xs text-[#22c55e] font-medium mt-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{skill.evidence}</span>
                      </p>
                    )}

                    <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                      <strong className="text-[#101010]">Next Action:</strong> {skill.learningAction}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openMilestoneModal({
                          id: '',
                          title: `Practice & Implement: ${skill.name}`,
                          description: skill.learningAction,
                          category: 'technical_skills',
                          priority: skill.importance === 'essential' ? 'high' : 'medium',
                          estimatedDuration: '1 week',
                          status: 'not_started',
                          completionCriteria: `Build a code demonstration or practical test utilizing ${skill.name}.`,
                          orderIndex: 99,
                        })
                      }
                      className="px-3 py-1.5 bg-white border border-[#E5E0D8] text-[#101010] rounded-lg text-xs font-medium hover:bg-[#F5F2EB] transition-all cursor-pointer whitespace-nowrap"
                    >
                      + Add to Roadmap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CAREER ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Roadmap Header & Progress Bar */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#101010]">Career Preparation Roadmap</h3>
                <p className="text-xs text-[#666666] mt-1">
                  {roadmapStats.completed} of {roadmapStats.total} milestones completed ({roadmapStats.percent}%)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openMilestoneModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#101010] h-full transition-all duration-500 rounded-full"
                style={{ width: `${roadmapStats.percent}%` }}
              />
            </div>
          </div>

          {/* Category & Status Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#888888] font-medium mr-1">Category:</span>
              <select
                aria-label="Filter milestones by category"
                value={roadmapCategoryFilter}
                onChange={(e) => setRoadmapCategoryFilter(e.target.value)}
                className="bg-white border border-[#E5E0D8] text-xs font-medium text-[#101010] rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="short_term">Short Term</option>
                <option value="technical_skills">Technical Skills</option>
                <option value="dsa_problem_solving">DSA & Problem Solving</option>
                <option value="project_development">Project Development</option>
                <option value="resume_improvement">Resume Improvement</option>
                <option value="interview_prep">Interview Prep</option>
                <option value="application_targets">Application Targets</option>
              </select>

              <span className="text-xs text-[#888888] font-medium ml-2 mr-1">Status:</span>
              <select
                aria-label="Filter milestones by status"
                value={roadmapStatusFilter}
                onChange={(e) => setRoadmapStatusFilter(e.target.value)}
                className="bg-white border border-[#E5E0D8] text-xs font-medium text-[#101010] rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Milestones List */}
          {isLoadingRoadmap ? (
            <div className="p-12 text-center text-xs text-[#888888]">Loading career roadmap...</div>
          ) : filteredMilestones.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
              <p className="text-sm font-semibold text-[#101010]">No milestones found matching filters</p>
              <button
                type="button"
                onClick={() => {
                  setRoadmapCategoryFilter('all');
                  setRoadmapStatusFilter('all');
                }}
                className="mt-3 text-xs text-[#101010] underline cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`border rounded-2xl p-5 transition-all ${
                    milestone.status === 'completed'
                      ? 'bg-[#FAF9F5] border-[#E5E0D8] opacity-80'
                      : milestone.status === 'in_progress'
                      ? 'bg-white border-[#101010] shadow-xs'
                      : 'bg-white border-[#E5E0D8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(milestone.id)}
                        className="mt-0.5 text-[#101010] hover:text-[#666666] transition-colors cursor-pointer"
                      >
                        {milestone.status === 'completed' ? (
                          <CheckSquare className="w-5 h-5 text-[#22c55e]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#888888]" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-sm font-bold ${
                              milestone.status === 'completed'
                                ? 'line-through text-[#888888]'
                                : 'text-[#101010]'
                            }`}
                          >
                            {milestone.title}
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                              milestone.priority === 'high'
                                ? 'bg-[#ef4444]/10 text-[#b91c1c]'
                                : milestone.priority === 'medium'
                                ? 'bg-[#FAF9F5] border border-[#E5E0D8] text-[#101010]'
                                : 'bg-white border border-[#E5E0D8] text-[#888888]'
                            }`}
                          >
                            {milestone.priority}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-full text-[#666666]">
                            {milestone.category.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-[#666666] mt-2 leading-relaxed">{milestone.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#888888]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Duration: {milestone.estimatedDuration}</span>
                          </span>
                          {milestone.optionalDeadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Target: {milestone.optionalDeadline}</span>
                            </span>
                          )}
                          <span className="text-[#101010] font-medium">
                            Criteria: {milestone.completionCriteria}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openMilestoneModal(milestone)}
                        className="p-1.5 text-[#888888] hover:text-[#101010] rounded-lg hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                        title="Edit milestone"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="p-1.5 text-[#888888] hover:text-[#ef4444] rounded-lg hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MILESTONE MODAL */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl w-full max-w-lg p-6 shadow-xl relative">
            <h3 className="text-lg font-bold text-[#101010]">
              {editingMilestone ? 'Edit Milestone' : 'Add Career Milestone'}
            </h3>
            <form onSubmit={handleSaveMilestone} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#101010] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={milestoneFormData.title}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, title: e.target.value })}
                  placeholder="e.g. Master Docker containerization"
                  className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101010] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={milestoneFormData.description}
                  onChange={(e) => setMilestoneFormData({ ...milestoneFormData, description: e.target.value })}
                  placeholder="Outline what needs to be learned or implemented..."
                  className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1">Category</label>
                  <select
                    value={milestoneFormData.category}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, category: e.target.value as MilestoneCategory })
                    }
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                  >
                    <option value="short_term">Short Term</option>
                    <option value="technical_skills">Technical Skills</option>
                    <option value="dsa_problem_solving">DSA Problem Solving</option>
                    <option value="project_development">Project Development</option>
                    <option value="resume_improvement">Resume Improvement</option>
                    <option value="interview_prep">Interview Prep</option>
                    <option value="application_targets">Application Targets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1">Priority</label>
                  <select
                    value={milestoneFormData.priority}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, priority: e.target.value as MilestonePriority })
                    }
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    value={milestoneFormData.estimatedDuration}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, estimatedDuration: e.target.value })
                    }
                    placeholder="e.g. 1 week"
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={milestoneFormData.optionalDeadline}
                    onChange={(e) =>
                      setMilestoneFormData({ ...milestoneFormData, optionalDeadline: e.target.value })
                    }
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101010] mb-1">Completion Criteria</label>
                <input
                  type="text"
                  value={milestoneFormData.completionCriteria}
                  onChange={(e) =>
                    setMilestoneFormData({ ...milestoneFormData, completionCriteria: e.target.value })
                  }
                  placeholder="e.g. Verified working container running on port 3000"
                  className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm text-[#101010] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#666666] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-colors cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ReadinessCardProps {
  icon: React.ElementType;
  title: string;
  score: number;
  level: 'low' | 'moderate' | 'strong' | 'exceptional';
  summary: string;
  metricsBreakdown: Record<string, number | string>;
  diagnosticNotes: string[];
  actionLabel?: string;
  onAction?: () => void;
}

const ReadinessCard: React.FC<ReadinessCardProps> = ({
  icon: Icon,
  title,
  score,
  level,
  summary,
  metricsBreakdown,
  diagnosticNotes,
  actionLabel,
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#101010]/40 transition-colors">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E5E0D8] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#101010]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101010]">{title}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                  level === 'exceptional'
                    ? 'bg-[#22c55e]/10 text-[#15803d]'
                    : level === 'strong'
                    ? 'bg-[#101010] text-[#F8F5EE]'
                    : level === 'moderate'
                    ? 'bg-[#FAF9F5] border border-[#E5E0D8] text-[#101010]'
                    : 'bg-[#ef4444]/10 text-[#b91c1c]'
                }`}
              >
                {level}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-extrabold text-[#101010]">{score}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-[#FAF9F5] rounded-full h-2 overflow-hidden border border-[#E5E0D8]/60">
          <div
            className="bg-[#101010] h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Summary text */}
        <p className="text-xs text-[#666666] mt-3 leading-relaxed">{summary}</p>

        {/* Expandable Breakdown */}
        <div className="mt-4 pt-4 border-t border-[#E5E0D8]/60">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-xs font-semibold text-[#101010] hover:text-[#666666] transition-colors cursor-pointer"
          >
            <span>Diagnostic Breakdown</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 text-xs animate-fadeIn">
              <div className="bg-[#FAF9F5] rounded-xl p-3 space-y-1.5 border border-[#E5E0D8]">
                {Object.entries(metricsBreakdown).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-[11px]">
                    <span className="text-[#666666]">{key}</span>
                    <span className="font-semibold text-[#101010]">{val}</span>
                  </div>
                ))}
              </div>

              {diagnosticNotes.length > 0 && (
                <div className="space-y-1 pt-1">
                  {diagnosticNotes.map((note, idx) => (
                    <p key={idx} className="text-[11px] text-[#666666] flex items-start gap-1.5">
                      <span className="text-[#101010]">•</span>
                      <span>{note}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 w-full py-2 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-xs font-semibold hover:bg-[#F5F2EB] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
