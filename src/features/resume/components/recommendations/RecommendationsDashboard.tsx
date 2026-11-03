/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Assistant | Recommendations Dashboard (Phase 2)
 * Comprehensive, evidence-based recommendations interface with
 * 6 dedicated category workspaces, mandatory student approval,
 * bulk actions, and seamless resume draft synchronization.
 */

import React, { useState, useEffect } from 'react';
import {
  ResumeRecommendationsData,
  BaseRecommendation,
  TechnicalSkillRecommendation,
  SoftSkillRecommendation,
} from '../../../../types/recommendations.ts';
import { ResumeSetupData } from '../../../../types/resumeSetup.ts';
import { ResumeData } from '../../../../types/resume.ts';
import { StudentProfile, AvatarType } from '../../../../types/profile.ts';
import { User } from 'firebase/auth';
import {
  fetchAIRecommendations,
  saveRecommendationsState,
  getCachedRecommendations,
} from '../../../../lib/recommendationsService.ts';
import { TechnicalSkillsView } from './TechnicalSkillsView.tsx';
import { SoftSkillsView } from './SoftSkillsView.tsx';
import { SectionsAdviceView } from './SectionsAdviceView.tsx';
import { ProjectsAdviceView } from './ProjectsAdviceView.tsx';
import { KeywordsView } from './KeywordsView.tsx';
import { CertificationsAdviceView } from './CertificationsAdviceView.tsx';
import { EditRecommendationModal } from './EditRecommendationModal.tsx';
import { ApplyApprovedModal } from './ApplyApprovedModal.tsx';
import { Navbar } from '../../../../components/layout/Navbar.tsx';
import { SocialFooter } from '../../../../components/layout/SocialFooter.tsx';
import { AppView } from '../../../../types/navigation.ts';
import {
  BrainCircuit,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Code,
  Users,
  Layers,
  FolderGit2,
  Tag,
  Award,
  ShieldCheck,
  Check,
  Loader2,
} from 'lucide-react';

export interface RecommendationsDashboardProps {
  user: User | null;
  profile: StudentProfile;
  userAvatar?: AvatarType;
  userName?: string;
  setup: ResumeSetupData;
  resumeData: ResumeData;
  onSignOut?: () => void;
  onNavigate: (view: AppView) => void;
  onBackToSetup: () => void;
  onContinueToBuilder: () => void;
  onApplyApprovedToResume: (selectedTech: string[], selectedSoft: string[]) => void;
}

type TabKey = 'technical' | 'soft' | 'sections' | 'projects' | 'keywords' | 'certifications';

export function RecommendationsDashboard({
  user,
  profile,
  userAvatar = 'boy',
  userName = '',
  setup,
  resumeData,
  onSignOut,
  onNavigate,
  onBackToSetup,
  onContinueToBuilder,
  onApplyApprovedToResume,
}: RecommendationsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('technical');
  const [recommendations, setRecommendations] = useState<ResumeRecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<BaseRecommendation | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Build input payload for AI generation
  const buildGenerationInput = () => ({
    targetRole: setup.targetRole.title,
    purpose: setup.purpose,
    jobDescriptionText: setup.jobDescription?.text || '',
    department: setup.profileContext.major || profile.major || 'Computer Science',
    degree: setup.profileContext.degree || 'Bachelor of Technology',
    academicYear: setup.profileContext.academicYear || 'Final Year',
    graduationYear: setup.profileContext.graduationYear || profile.graduationYear || '2026',
    existingSkills: {
      technical: resumeData.skills?.technical || [],
      soft: resumeData.skills?.soft || [],
    },
    existingProjects: (resumeData.projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      techStack: p.techStack || [],
      description: p.description || '',
    })),
    existingExperience: (resumeData.experience || []).map((e) => ({
      company: e.company,
      position: e.position,
      description: e.description,
    })),
    existingEducation: (resumeData.education || []).map((ed) => ({
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
    })),
  });

  // Load cached recommendations or generate initially
  useEffect(() => {
    let isMounted = true;

    async function loadOrGenerate() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Check local cache / Firestore
        const cached = await getCachedRecommendations(setup.id, user?.uid);
        if (cached && isMounted && cached.targetRole === setup.targetRole.title) {
          setRecommendations(cached);
          setIsLoading(false);
          return;
        }

        // 2. Generate with real server-side Gemini AI
        const input = buildGenerationInput();
        const fresh = await fetchAIRecommendations(setup.id, user?.uid, input);
        if (isMounted) {
          setRecommendations(fresh);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrGenerate();
    return () => {
      isMounted = false;
    };
  }, [setup.id, user?.uid]);

  // Handle regeneration
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setErrorMessage(null);

    try {
      const input = buildGenerationInput();
      const fresh = await fetchAIRecommendations(setup.id, user?.uid, input);
      setRecommendations(fresh);
      showToast('Fresh recommendations generated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Technical skills mutations
  const handleApproveTech = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: recommendations.technicalSkills.map((s) =>
        s.id === id ? { ...s, status: 'approved' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  const handleDismissTech = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: recommendations.technicalSkills.map((s) =>
        s.id === id ? { ...s, status: 'dismissed' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  const handleResetTech = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: recommendations.technicalSkills.map((s) =>
        s.id === id ? { ...s, status: 'suggested' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  const handleApproveAllEssential = () => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: recommendations.technicalSkills.map((s) =>
        s.category === 'essential' && s.status === 'suggested' && !s.isAlreadyPresent
          ? { ...s, status: 'approved' }
          : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
    showToast('All essential skills marked approved for your review!');
  };

  // Soft skills mutations
  const handleApproveSoft = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      softSkills: recommendations.softSkills.map((s) =>
        s.id === id ? { ...s, status: 'approved' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  const handleDismissSoft = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      softSkills: recommendations.softSkills.map((s) =>
        s.id === id ? { ...s, status: 'dismissed' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  const handleResetSoft = (id: string) => {
    if (!recommendations) return;
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      softSkills: recommendations.softSkills.map((s) =>
        s.id === id ? { ...s, status: 'suggested' } : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
  };

  // Edit item handler
  const handleSaveEditedItem = (updatedItem: BaseRecommendation) => {
    if (!recommendations) return;
    let nextTech = recommendations.technicalSkills;
    let nextSoft = recommendations.softSkills;

    if (nextTech.some((s) => s.id === updatedItem.id)) {
      nextTech = nextTech.map((s) =>
        s.id === updatedItem.id ? { ...s, ...updatedItem, status: 'approved' } : s
      );
    } else if (nextSoft.some((s) => s.id === updatedItem.id)) {
      nextSoft = nextSoft.map((s) =>
        s.id === updatedItem.id ? { ...s, ...updatedItem, status: 'approved' } : s
      );
    }

    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: nextTech,
      softSkills: nextSoft,
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
    showToast(`Updated and approved "${updatedItem.title}"`);
  };

  // Apply approved items
  const handleApplyApproved = (selectedTechIds: string[], selectedSoftIds: string[]) => {
    if (!recommendations) return;

    const techToAdd = recommendations.technicalSkills
      .filter((s) => selectedTechIds.includes(s.id))
      .map((s) => s.title);

    const softToAdd = recommendations.softSkills
      .filter((s) => selectedSoftIds.includes(s.id))
      .map((s) => s.title);

    onApplyApprovedToResume(techToAdd, softToAdd);

    // Update local statuses to 'applied'
    const updated: ResumeRecommendationsData = {
      ...recommendations,
      technicalSkills: recommendations.technicalSkills.map((s) =>
        selectedTechIds.includes(s.id)
          ? { ...s, status: 'applied', isAlreadyPresent: true }
          : s
      ),
      softSkills: recommendations.softSkills.map((s) =>
        selectedSoftIds.includes(s.id)
          ? { ...s, status: 'applied', isAlreadyPresent: true }
          : s
      ),
    };
    setRecommendations(updated);
    saveRecommendationsState(updated);
    showToast(`Successfully applied ${techToAdd.length + softToAdd.length} items to your resume draft!`);
  };

  // Stats calculation
  const approvedTechCount = recommendations?.technicalSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  ).length || 0;
  const approvedSoftCount = recommendations?.softSkills.filter(
    (s) => s.status === 'approved' && !s.isAlreadyPresent
  ).length || 0;
  const totalApprovedPending = approvedTechCount + approvedSoftCount;

  const presentSkillsCount =
    (recommendations?.technicalSkills.filter((s) => s.isAlreadyPresent).length || 0) +
    (recommendations?.softSkills.filter((s) => s.isAlreadyPresent).length || 0);

  const missingKeywordsCount =
    recommendations?.keywords.filter((k) => !k.isMatchedInResume).length || 0;

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#171513] flex flex-col font-sans">
      <Navbar
        currentView="resume-recommendations"
        onNavigate={onNavigate}
        userAvatar={userAvatar}
        userName={userName}
        onSignOut={onSignOut}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBackToSetup}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#625D56] hover:text-[#171513] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Setup Wizard
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isLoading || isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#171513] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate AI Analysis</span>
            </button>

            <button
              type="button"
              onClick={onContinueToBuilder}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-xs"
            >
              <span>Continue to Resume Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 shadow-xs mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5EC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] uppercase tracking-wider mb-2">
                <BrainCircuit className="w-3.5 h-3.5" />
                Phase 2 • Intelligent Resume Recommendations
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171513] tracking-tight">
                Recommendations for {setup.targetRole.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
                Targeting <strong className="text-[#171513] capitalize">{setup.purpose.replace('-', ' ')}</strong> applications • Academic background in {setup.profileContext.major || 'Computer Science'}
              </p>
            </div>

            {totalApprovedPending > 0 && (
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-md self-start md:self-auto shrink-0 hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Apply {totalApprovedPending} Approved Item{totalApprovedPending === 1 ? '' : 's'} to Resume</span>
              </button>
            )}
          </div>

          {/* AI Executive Summary Rationale */}
          {recommendations?.summaryRationale && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE7DE] text-xs text-[#524E48] leading-relaxed flex items-start gap-3">
              <BrainCircuit className="w-4 h-4 text-[#8C6D1F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#171513] block mb-0.5">Strategy Summary:</strong>
                {recommendations.summaryRationale}
              </div>
            </div>
          )}

          {/* Verification Notice */}
          <div className="p-3.5 rounded-2xl bg-[#F6F4EE] border border-[#E8E2D7] text-xs text-[#625D56] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Student Approval Is Mandatory:</strong> Items are recommendations only. You decide what gets added to your resume.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#8A8275] hidden sm:inline-block">
              Zero Fake Claims Policy
            </span>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[11px] font-semibold text-[#7A7368] uppercase tracking-wider block">
                Total Recommended
              </span>
              <span className="text-xl font-bold text-[#171513]">
                {(recommendations?.technicalSkills.length || 0) + (recommendations?.softSkills.length || 0)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[11px] font-semibold text-[#7A7368] uppercase tracking-wider block">
                Approved by You
              </span>
              <span className="text-xl font-bold text-[#171513]">
                {totalApprovedPending}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[11px] font-semibold text-[#7A7368] uppercase tracking-wider block">
                Already in Resume
              </span>
              <span className="text-xl font-bold text-emerald-700">
                {presentSkillsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[11px] font-semibold text-[#7A7368] uppercase tracking-wider block">
                Keyword Gaps
              </span>
              <span className="text-xl font-bold text-amber-700">
                {missingKeywordsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'technical'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Technical Skills ({recommendations?.technicalSkills.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('soft')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'soft'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Soft Skills ({recommendations?.softSkills.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sections Advice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Projects & Ideas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keywords')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'keywords'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>JD Keywords ({recommendations?.keywords.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'certifications'
                ? 'bg-[#171513] text-white shadow-xs'
                : 'bg-white text-[#625D56] hover:bg-[#F3EFE6] border border-[#E5E0D8]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certifications</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center space-y-4 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#171513] animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-[#171513]">
                Analyzing Candidate Profile & Role Requirements...
              </h3>
              <p className="text-xs text-[#7A7368] mt-1 max-w-md mx-auto">
                Running Gemini AI recommendation engine against your target role, degree, coursework, and job description.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="bg-red-50 rounded-3xl border border-red-200 p-8 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-red-950">
                AI Recommendation Engine Notice
              </h3>
              <p className="text-xs text-red-700 mt-1 max-w-lg mx-auto">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-5 py-2.5 rounded-full bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-colors cursor-pointer"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Content Workspace */}
        {!isLoading && !errorMessage && recommendations && (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 shadow-xs">
            {activeTab === 'technical' && (
              <TechnicalSkillsView
                skills={recommendations.technicalSkills}
                onApprove={handleApproveTech}
                onDismiss={handleDismissTech}
                onReset={handleResetTech}
                onEdit={(item) => setEditingItem(item)}
                onApproveAllEssential={handleApproveAllEssential}
              />
            )}

            {activeTab === 'soft' && (
              <SoftSkillsView
                skills={recommendations.softSkills}
                onApprove={handleApproveSoft}
                onDismiss={handleDismissSoft}
                onReset={handleResetSoft}
                onEdit={(item) => setEditingItem(item)}
              />
            )}

            {activeTab === 'sections' && (
              <SectionsAdviceView sections={recommendations.sections} />
            )}

            {activeTab === 'projects' && (
              <ProjectsAdviceView
                existingProjectAdvice={recommendations.existingProjectAdvice}
                suggestedProjectIdeas={recommendations.suggestedProjectIdeas}
              />
            )}

            {activeTab === 'keywords' && (
              <KeywordsView
                keywords={recommendations.keywords}
                hasJobDescription={recommendations.sourceJobDescriptionProvided}
              />
            )}

            {activeTab === 'certifications' && (
              <CertificationsAdviceView
                certifications={recommendations.certifications}
              />
            )}
          </div>
        )}

        {/* Bottom Floating Bar when items are approved */}
        {totalApprovedPending > 0 && (
          <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 z-40">
            <div className="bg-[#171513] text-white px-5 py-3.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-4 animate-page-enter">
              <div className="flex items-center gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{totalApprovedPending}</strong> approved item{totalApprovedPending === 1 ? '' : 's'} ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="px-4 py-1.5 rounded-full bg-white text-[#171513] text-xs font-bold hover:bg-[#F3EFE6] transition-colors cursor-pointer"
              >
                Apply to Resume Draft
              </button>
            </div>
          </div>
        )}
      </main>

      <SocialFooter />

      {/* Edit Modal */}
      <EditRecommendationModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditedItem}
      />

      {/* Apply Approved Modal */}
      {recommendations && (
        <ApplyApprovedModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          recommendations={recommendations}
          onApply={handleApplyApproved}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#171513] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-page-enter">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
