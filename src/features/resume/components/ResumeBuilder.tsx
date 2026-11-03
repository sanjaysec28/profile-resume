/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Complete Resume Builder (Phase 4)
 * 3-Panel Core Layout:
 * - Left Panel: Charcoal 7-step Sidebar
 * - Center Panel: Off-White Form Workspace
 * - Right Panel: Live A4 Resume Preview Document
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ResumeData, ResumeProject, ResumeExperience, ResumeLeadership } from '../../../types/resume.ts';
import { INITIAL_RESUME_DATA } from '../constants.ts';
import { lockBodyScroll, unlockBodyScroll } from '../../../lib/scrollLock.ts';
import { cn } from '../../../lib/utils.ts';
import { ResumeSidebar, RESUME_STEPS } from './ResumeSidebar.tsx';
import { ResumeLivePreview } from './ResumeLivePreview.tsx';
import { FinalPreviewModal } from './FinalPreviewModal.tsx';
import { PersonalInfoStep } from './steps/PersonalInfoStep.tsx';
import { EducationStep } from './steps/EducationStep.tsx';
import { SkillsStep } from './steps/SkillsStep.tsx';
import { ProjectsStep } from './steps/ProjectsStep.tsx';
import { ExperienceStep } from './steps/ExperienceStep.tsx';
import { CertificationsStep } from './steps/CertificationsStep.tsx';
import { TemplateSelectStep } from './steps/TemplateSelectStep.tsx';
import { AiContentAssistantModal } from './assistant/AiContentAssistantModal.tsx';
import { SectionManagerModal } from './assistant/SectionManagerModal.tsx';
import { ContentAssistantAction, ContentAssistantSection } from '../../../types/assistant.ts';
import { ResumeRecommendationsData } from '../../../types/recommendations.ts';
import { getCachedRecommendations } from '../../../lib/recommendationsService.ts';
import { ResumeReviewModal } from './review/ResumeReviewModal.tsx';
import { getLatestResumeReview, determineReviewStatus } from '../../../lib/resumeReviewService.ts';
import { ReviewStatus, FinalResumeReviewReport } from '../../../types/resumeReview.ts';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Bookmark,
  CheckCircle2,
  Eye,
  Loader2,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Compass,
  BrainCircuit,
  PenLine,
  FilePenLine,
  Brain,
} from 'lucide-react';
import { exportResumeToPdf } from '../utils/pdfExport.ts';
import { Logo } from '../../../components/ui/Logo.tsx';
import { SocialFooter } from '../../../components/layout/SocialFooter.tsx';
import { Navbar } from '../../../components/layout/Navbar.tsx';
import { AppView } from '../../../types/navigation.ts';
import { AvatarType } from '../../../types/profile.ts';
import { ResumeSetupData } from '../../../types/resumeSetup.ts';

interface ResumeBuilderProps {
  onBackToDashboard: () => void;
  onNavigate?: (view: AppView) => void;
  userAvatar?: AvatarType;
  userName?: string;
  onSignOut?: () => void;
  studentName?: string;
  initialData?: ResumeData;
  onResumeDataChange?: (data: ResumeData) => void;
  resumeSetup?: ResumeSetupData | null;
  recommendations?: ResumeRecommendationsData | null;
  onOpenSetupWizard?: () => void;
  onOpenRecommendations?: () => void;
}

export function ResumeBuilder({
  onBackToDashboard,
  onNavigate,
  userAvatar = 'boy',
  userName = '',
  onSignOut,
  studentName = '',
  initialData,
  onResumeDataChange,
  resumeSetup,
  recommendations,
  onOpenSetupWizard,
  onOpenRecommendations,
}: ResumeBuilderProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    if (initialData) return initialData;
    try {
      const saved = localStorage.getItem('profile_resume_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_RESUME_DATA;
  });

  const [isFinalPreviewOpen, setIsFinalPreviewOpen] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  // Phase 3: AI Resume Content Assistant & Section Management state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantSection, setAssistantSection] = useState<ContentAssistantSection>('summary');
  const [assistantAction, setAssistantAction] = useState<ContentAssistantAction>('improve');
  const [assistantContent, setAssistantContent] = useState<string | string[]>('');
  const [assistantItemContext, setAssistantItemContext] = useState<{
    itemId?: string;
    itemTitle?: string;
    itemTechStack?: string[];
  } | undefined>(undefined);

  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);
  const [cachedRecommendations, setCachedRecommendations] = useState<ResumeRecommendationsData | null>(
    recommendations || null
  );

  // Phase 4: AI Resume Final Review & Quality Assurance state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewReport, setReviewReport] = useState<FinalResumeReviewReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('not-reviewed');

  // Load review status and detect outdated review on resume updates
  useEffect(() => {
    const resumeId = resumeSetup?.id || 'default_resume';
    getLatestResumeReview(undefined, resumeId, resumeData).then((rep) => {
      if (rep) {
        setReviewReport(rep);
        setReviewStatus(determineReviewStatus(rep, resumeData));
      } else {
        setReviewStatus('not-reviewed');
      }
    });
  }, [resumeSetup?.id, resumeData]);

  const handleOpenReview = () => {
    // Check that the latest resume content is saved first (Phase 5 requirement)
    handleSaveDraft();
    setIsReviewModalOpen(true);
  };

  useEffect(() => {
    if (recommendations) {
      setCachedRecommendations(recommendations);
    } else if (resumeSetup?.id) {
      getCachedRecommendations(resumeSetup.id).then((cached) => {
        if (cached) setCachedRecommendations(cached);
      });
    }
  }, [recommendations, resumeSetup?.id]);

  const handleOpenAssistant = (
    section: ContentAssistantSection = 'summary',
    action: ContentAssistantAction = 'improve',
    content?: string | string[],
    context?: { itemId?: string; itemTitle?: string; itemTechStack?: string[] }
  ) => {
    setAssistantSection(section);
    setAssistantAction(action);
    setAssistantContent(content || '');
    setAssistantItemContext(context);
    setIsAssistantOpen(true);
  };

  const handleApplyAssistantContent = (result: {
    section: ContentAssistantSection;
    text: string;
    bulletPoints?: string[];
    itemId?: string;
  }) => {
    setResumeData((prev) => {
      switch (result.section) {
        case 'summary':
          return {
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              summary: result.text,
            },
          };
        case 'technical_skills': {
          const skillsList = result.text
            .split(/[\n,•]/)
            .map((s) => s.trim())
            .filter(Boolean);
          return {
            ...prev,
            skills: {
              ...prev.skills,
              technical: Array.from(new Set([...prev.skills.technical, ...skillsList])),
            },
          };
        }
        case 'soft_skills': {
          const skillsList = result.text
            .split(/[\n,•]/)
            .map((s) => s.trim())
            .filter(Boolean);
          return {
            ...prev,
            skills: {
              ...prev.skills,
              soft: Array.from(new Set([...prev.skills.soft, ...skillsList])),
            },
          };
        }
        case 'projects': {
          if (result.itemId) {
            return {
              ...prev,
              projects: prev.projects.map((p) =>
                p.id === result.itemId
                  ? {
                      ...p,
                      description: result.text,
                      bullets: result.bulletPoints || p.bullets,
                    }
                  : p
              ),
            };
          } else if (prev.projects.length > 0) {
            return {
              ...prev,
              projects: prev.projects.map((p, idx) =>
                idx === 0
                  ? { ...p, description: result.text, bullets: result.bulletPoints || p.bullets }
                  : p
              ),
            };
          } else {
            const newP: ResumeProject = {
              id: `proj-${Date.now()}`,
              title: 'Featured Project',
              description: result.text,
              bullets: result.bulletPoints,
              techStack: [],
            };
            return {
              ...prev,
              projects: [...prev.projects, newP],
            };
          }
        }
        case 'experience': {
          if (result.itemId) {
            return {
              ...prev,
              experience: prev.experience.map((e) =>
                e.id === result.itemId
                  ? {
                      ...e,
                      description: result.text,
                      bullets: result.bulletPoints || e.bullets,
                    }
                  : e
              ),
            };
          } else if (prev.experience.length > 0) {
            return {
              ...prev,
              experience: prev.experience.map((e, idx) =>
                idx === 0
                  ? { ...e, description: result.text, bullets: result.bulletPoints || e.bullets }
                  : e
              ),
            };
          } else {
            const newExp: ResumeExperience = {
              id: `exp-${Date.now()}`,
              company: 'Target Organization',
              position: resumeSetup?.targetRole.title || 'Intern',
              startDate: '',
              endDate: '',
              description: result.text,
              bullets: result.bulletPoints,
            };
            return {
              ...prev,
              experience: [...prev.experience, newExp],
            };
          }
        }
        case 'achievements': {
          const lines = result.bulletPoints && result.bulletPoints.length > 0
            ? result.bulletPoints
            : result.text.split('\n').map((l) => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
          return {
            ...prev,
            achievements: Array.from(new Set([...(prev.achievements || []), ...lines])),
          };
        }
        case 'positions_of_responsibility': {
          if (result.itemId) {
            return {
              ...prev,
              positionsOfResponsibility: (prev.positionsOfResponsibility || []).map((pos) =>
                pos.id === result.itemId
                  ? { ...pos, description: result.text, bullets: result.bulletPoints }
                  : pos
              ),
            };
          }
          const newPos: ResumeLeadership = {
            id: `pos-${Date.now()}`,
            role: 'Team Lead / Coordinator',
            organization: 'Campus / Student Chapter',
            description: result.text,
            bullets: result.bulletPoints,
          };
          return {
            ...prev,
            positionsOfResponsibility: [...(prev.positionsOfResponsibility || []), newPos],
          };
        }
        case 'coursework': {
          const courses = result.text
            .split(/[\n,•]/)
            .map((c) => c.trim())
            .filter(Boolean);
          return {
            ...prev,
            coursework: Array.from(new Set([...(prev.coursework || []), ...courses])),
          };
        }
        case 'certifications': {
          const certLines = result.text
            .split(/[\n,•]/)
            .map((c) => c.trim())
            .filter(Boolean);
          const newCerts = certLines.map((c, i) => ({
            id: `cert-${Date.now()}-${i}`,
            name: c,
            issuer: 'Industry Verified Organization',
            issueDate: '',
          }));
          return {
            ...prev,
            certifications: [...(prev.certifications || []), ...newCerts],
          };
        }
        default:
          return prev;
      }
    });
    showToast(`Applied AI content to ${result.section.replace('_', ' ')}!`);
  };

  const handleSaveSectionConfig = (config: {
    sectionOrder: string[];
    sectionVisibility: Record<string, boolean>;
    customHeadings: Record<string, string>;
  }) => {
    setResumeData((prev) => ({
      ...prev,
      sectionOrder: config.sectionOrder,
      sectionVisibility: config.sectionVisibility,
      customHeadings: config.customHeadings,
    }));
    showToast('Updated resume section ordering and visibility!');
  };

  // Sync to local storage
  const handleSaveDraft = () => {
    try {
      localStorage.setItem('profile_resume_draft', JSON.stringify(resumeData));
      onResumeDataChange?.(resumeData);
      showToast('Resume draft saved successfully!');
    } catch {
      showToast('Could not save draft to local storage.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-sync resume draft to localStorage and notify parent
  useEffect(() => {
    try {
      localStorage.setItem('profile_resume_draft', JSON.stringify(resumeData));
      onResumeDataChange?.(resumeData);
    } catch {
      // Ignore quota errors
    }
  }, [resumeData, onResumeDataChange]);

  // Lock background scroll when mobile preview is open
  useEffect(() => {
    if (!isMobilePreviewOpen) return;
    lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobilePreviewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobilePreviewOpen]);

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgressText('Preparing PDF export...');

    const targetElementId = isFinalPreviewOpen
      ? 'resume-final-preview-document'
      : 'resume-a4-document';

    const result = await exportResumeToPdf({
      elementId: targetElementId,
      fullName: resumeData.personalInfo.fullName,
      onProgress: (_step, msg) => {
        setExportProgressText(msg);
      },
    });

    setIsExportingPdf(false);
    setExportProgressText(null);

    if (result.success) {
      showToast(`Downloaded: ${result.filename}`);
    } else {
      showToast(`Export failed: ${result.error || 'Please try again'}`);
    }
  };

  const currentStepInfo = RESUME_STEPS.find((s) => s.id === activeStep) || RESUME_STEPS[0];

  const handleNext = () => {
    if (activeStep < 7) {
      setActiveStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFinalPreviewOpen(true);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeData]);

  return (
    <div className="min-h-screen w-full bg-[#F8F5EE] text-[#101010] flex flex-col font-sans select-none animate-page-enter">
      {/* FLOATING PILL NAVBAR MATCHING DASHBOARD & PROFILE */}
      <Navbar
        currentView="resume-builder"
        onNavigate={onNavigate || ((view) => {
          if (view === 'dashboard') onBackToDashboard();
        })}
        userAvatar={userAvatar}
        userName={userName || studentName}
        onSignOut={onSignOut}
        showAllNav={true}
      />

      {/* FLOATING BUILDER ACTION TOOLBAR (Structured two-row layout inside rounded white container) */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6 mb-6 sm:mb-7">
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-[0_4px_24px_rgba(16,16,16,0.05),0_1px_3px_rgba(16,16,16,0.02)] p-3 sm:p-4 flex flex-col gap-3 transition-all duration-200">
          
          {/* ROW 1: Navigation & Resume Setup (Exactly 3 items in order) */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 w-full pb-3 border-b border-[#F0ECE3]">
            {/* 1. Back to Dashboard */}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#444444] hover:text-[#101010] shadow-2xs transition-colors cursor-pointer select-none shrink-0"
              title="Return to Student Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-[#777777] shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] text-[#888888] font-normal uppercase tracking-wider block">Return</span>
                <span className="font-semibold text-xs text-[#101010] block">Dashboard</span>
              </div>
            </button>

            {/* 2. Target Role / Resume Purpose Indicator (Visually distinct informational card, not a button) */}
            <div className="inline-flex items-center gap-2.5 h-11 px-3.5 sm:px-4 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] text-xs shadow-2xs select-none min-w-0 flex-1 sm:flex-initial">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8C6D1F] font-bold uppercase tracking-wider block">Target Role</span>
                  {resumeSetup?.purpose && (
                    <>
                      <span className="text-[#D4CBBF] text-[10px]">•</span>
                      <span className="text-[10px] text-[#7A7368] capitalize truncate">{resumeSetup.purpose.replace('-', ' ')}</span>
                    </>
                  )}
                </div>
                <span className="font-semibold text-xs text-[#171513] block truncate max-w-[200px] sm:max-w-[320px]">
                  {resumeSetup?.targetRole?.title || 'Software Engineer'}
                </span>
              </div>
            </div>

            {/* 3. Edit Setup Action Card */}
            {onOpenSetupWizard && (
              <button
                type="button"
                onClick={onOpenSetupWizard}
                className="inline-flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer select-none shrink-0"
                title="Configure target role and resume purpose"
              >
                <Brain className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-[#888888] font-normal uppercase tracking-wider block">Configure</span>
                  <span className="font-semibold text-xs text-[#101010] block">{resumeSetup ? 'Edit Setup' : 'AI Setup'}</span>
                </div>
              </button>
            )}
          </div>

          {/* ROW 2: Resume Actions (Exactly 7 items in order) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5 w-full items-stretch">
            {/* 1. AI Recommendations */}
            <button
              type="button"
              onClick={onOpenRecommendations || onOpenSetupWizard}
              className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl bg-[#FAF5EC] hover:bg-[#F2EBDC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] shadow-2xs transition-colors cursor-pointer select-none"
              title="View approved and pending AI recommendations"
            >
              <BrainCircuit className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#A6832B] font-bold uppercase tracking-wider block">Smart Tips</span>
                <span className="font-semibold text-xs text-[#8C6D1F] block truncate">Recommendations</span>
              </div>
            </button>

            {/* 2. Review My Resume */}
            <button
              type="button"
              onClick={handleOpenReview}
              className="inline-flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-xl bg-[#101010] hover:bg-[#252525] text-white border border-[#2A2A2A] text-xs font-bold shadow-xs transition-all cursor-pointer select-none"
              title="Comprehensive AI Resume Review & Quality Audit"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#C5BFB5] font-normal uppercase tracking-wider block">Quality QA</span>
                  {reviewStatus === 'ready-for-export' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="Ready for Export" />
                  )}
                  {reviewStatus === 'improvements-available' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Improvements Available" />
                  )}
                </div>
                <span className="font-bold text-xs text-white block truncate">Review My Resume</span>
              </div>
            </button>

            {/* 3. Career Roadmap */}
            <button
              type="button"
              onClick={() => onNavigate?.('career-intelligence')}
              className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer select-none"
              title="Career Intelligence & Learning Roadmap"
            >
              <Compass className="w-4 h-4 text-[#8C6D1F] shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#888888] font-normal uppercase tracking-wider block">Growth</span>
                <span className="font-semibold text-xs text-[#101010] block truncate">Career Roadmap</span>
              </div>
            </button>

            {/* 4. AI Content Assistant */}
            <button
              type="button"
              onClick={() => handleOpenAssistant()}
              className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl bg-[#FAF5EC] hover:bg-[#F2EBDC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] shadow-2xs transition-colors cursor-pointer select-none"
              title="Launch AI Resume Content Assistant"
            >
              <PenLine className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#A6832B] font-bold uppercase tracking-wider block">AI Writer</span>
                <span className="font-semibold text-xs text-[#8C6D1F] block truncate">Content Assistant</span>
              </div>
            </button>

            {/* 5. Sections */}
            <button
              type="button"
              onClick={() => setIsSectionManagerOpen(true)}
              className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer select-none"
              title="Reorder and customize sections"
            >
              <Layers className="w-4 h-4 text-[#777777] shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#888888] font-normal uppercase tracking-wider block">Reorder</span>
                <span className="font-semibold text-xs text-[#101010] block truncate">Sections</span>
              </div>
            </button>

            {/* 6. Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 h-11 px-3 sm:px-3.5 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer select-none"
              title="Save current resume state"
            >
              <Bookmark className="w-4 h-4 text-[#777777] shrink-0" />
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#888888] font-normal uppercase tracking-wider block">Local/Cloud</span>
                <span className="font-semibold text-xs text-[#101010] block truncate">Save Draft</span>
              </div>
            </button>

            {/* 7. Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className={cn(
                'inline-flex items-center gap-2 h-11 px-3.5 sm:px-4 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs select-none border border-[#2A2A2A]',
                isExportingPdf
                  ? 'bg-[#333333] opacity-90 cursor-wait'
                  : 'bg-[#101010] hover:bg-[#252525]'
              )}
              title="Export professional PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              ) : (
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[10px] text-[#C5BFB5] font-normal uppercase tracking-wider block">
                  {isExportingPdf ? 'Exporting...' : 'Export Ready'}
                </span>
                <span className="font-bold text-xs text-white block truncate">Download PDF</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STEP PROGRESS BAR (Visible on small screens) */}
      <div className="lg:hidden bg-[#F0ECE3] border-b border-[#E5E0D8] px-4 py-2.5 overflow-x-auto flex items-center gap-2 scrollbar-none mb-3">
        {RESUME_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveStep(s.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeStep === s.id
                ? 'bg-[#101010] text-white'
                : 'text-[#777777] bg-white/70'
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      {/* MAIN 3-PANEL WORKSPACE (Positioned with precise 24-28px vertical gap below toolbar) */}
      <main className="flex-1 w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* PANEL 1: LEFT SIDEBAR (Width: approx 190–220px / 2 columns on lg) */}
          <div className="hidden lg:block lg:col-span-2 xl:col-span-2 sticky top-24">
            <ResumeSidebar
              activeStep={activeStep}
              onStepSelect={(id) => {
                setActiveStep(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSectionManager={() => setIsSectionManagerOpen(true)}
              onOpenContentAssistant={() => handleOpenAssistant()}
              onOpenReview={handleOpenReview}
              reviewStatus={reviewStatus}
              onNavigateToCareer={() => onNavigate?.('career-intelligence')}
              onNavigateToInterview={() => onNavigate?.('interview-prep')}
              onNavigateToPlacement={() => onNavigate?.('placement-intelligence')}
            />
          </div>

          {/* PANEL 2: CENTER FORM WORKSPACE (Width: approx 45% / 6 columns on lg, 6 columns on xl) */}
          <div className="lg:col-span-6 xl:col-span-6 w-full">
            <div className="bg-[#F8F8F6] border border-[#E5E0D8] rounded-[28px] p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[640px]">
              
              {/* Form Header with title and quick actions */}
              <div>
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8] mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#101010] tracking-tight">
                      {currentStepInfo.title === 'Preview'
                        ? 'Choose a Template'
                        : currentStepInfo.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#777777] mt-1">
                      {currentStepInfo.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAssistant(
                        activeStep === 1 ? 'summary' :
                        activeStep === 2 ? 'education' :
                        activeStep === 3 ? 'technical_skills' :
                        activeStep === 4 ? 'projects' :
                        activeStep === 5 ? 'experience' : 'certifications'
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] hover:bg-[#F2EBDC] shadow-2xs transition-colors cursor-pointer"
                    >
                      <FilePenLine className="w-3.5 h-3.5 text-amber-500" />
                      <span>Section AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] shadow-2xs transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#777777]" />
                      <span>Save Draft</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer ${
                        isExportingPdf
                          ? 'bg-[#333333] opacity-90 cursor-wait'
                          : 'bg-[#101010] hover:bg-[#252525]'
                      }`}
                    >
                      {isExportingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* DYNAMIC FORM STEP BODY */}
                <div className="pt-1 pb-8">
                  {activeStep === 1 && (
                    <PersonalInfoStep
                      data={resumeData}
                      onChange={setResumeData}
                      onOpenAssistant={handleOpenAssistant}
                    />
                  )}
                  {activeStep === 2 && (
                    <EducationStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 3 && (
                    <SkillsStep
                      data={resumeData}
                      onChange={setResumeData}
                      onOpenAssistant={handleOpenAssistant}
                    />
                  )}
                  {activeStep === 4 && (
                    <ProjectsStep
                      data={resumeData}
                      onChange={setResumeData}
                      onOpenAssistant={handleOpenAssistant}
                    />
                  )}
                  {activeStep === 5 && (
                    <ExperienceStep
                      data={resumeData}
                      onChange={setResumeData}
                      onOpenAssistant={handleOpenAssistant}
                    />
                  )}
                  {activeStep === 6 && (
                    <CertificationsStep
                      data={resumeData}
                      onChange={setResumeData}
                      onOpenAssistant={handleOpenAssistant}
                    />
                  )}
                  {activeStep === 7 && (
                    <TemplateSelectStep
                      data={resumeData}
                      onChange={setResumeData}
                      onGeneratePreview={() => setIsFinalPreviewOpen(true)}
                    />
                  )}
                </div>
              </div>

              {/* Form Footer Navigation Controls */}
              <div className="pt-5 border-t border-[#E5E0D8] flex items-center justify-between">
                <div>
                  {activeStep > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs sm:text-sm font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#A3A3A3]">
                    Step {activeStep} of 7
                  </span>

                  {activeStep < 7 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#252525] text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenReview}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] hover:bg-[#F2EBDC] text-xs sm:text-sm font-semibold text-[#8C6D1F] transition-colors cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        <span>Review My Resume</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFinalPreviewOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#252525] text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Generate Preview</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* PANEL 3: RIGHT LIVE RESUME PREVIEW (Width: approx 35% / 4 columns on lg, 4 columns on xl) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 sticky top-24">
            <div className="bg-[#F8F8F6] border border-[#E5E0D8] rounded-[28px] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#E5E0D8] mb-4">
                <span className="text-xs font-bold text-[#101010] uppercase tracking-wider">
                  Live Preview
                </span>
                <button
                  type="button"
                  onClick={() => setIsFinalPreviewOpen(true)}
                  className="text-xs text-[#777777] hover:text-[#101010] underline cursor-pointer"
                >
                  Expand view
                </button>
              </div>

              {/* The Live A4 Document Sheet */}
              <div className="overflow-y-auto max-h-[calc(100vh-200px)] rounded-xl p-1 bg-[#F4EFE6]/50 border border-[#EAE5DC]">
                <ResumeLivePreview data={resumeData} />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Social Footer */}
      <SocialFooter className="py-6" />

      {/* MOBILE PREVIEW MODAL */}
      {isMobilePreviewOpen && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
        >
          {/* Subtle charcoal overlay without blur */}
          <div
            onClick={() => setIsMobilePreviewOpen(false)}
            className="fixed inset-0 transition-opacity duration-150 cursor-pointer"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#E5E0D8] rounded-[24px] shadow-2xl overflow-hidden flex flex-col min-h-0 max-h-[92dvh] sm:max-h-[90dvh] z-10">
            {/* Pinned Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-white border-b border-[#E5E0D8]">
              <h3 className="font-bold text-sm sm:text-base text-[#101010]">Live Resume Preview</h3>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="p-1.5 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 p-4">
              <ResumeLivePreview data={resumeData} />
            </div>

            {/* Pinned Footer */}
            <div className="shrink-0 px-5 py-3 bg-white border-t border-[#E5E0D8] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#101010] text-white hover:bg-[#252525] transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULLSCREEN FINAL PREVIEW MODAL */}
      <FinalPreviewModal
        data={resumeData}
        isOpen={isFinalPreviewOpen}
        onClose={() => setIsFinalPreviewOpen(false)}
        onEditSection={(stepId) => {
          setActiveStep(stepId);
          setIsFinalPreviewOpen(false);
        }}
        onDownloadPdf={handleDownloadPdf}
        onSelectTemplate={(tplId) => {
          setResumeData((prev) => ({ ...prev, templateId: tplId }));
        }}
        onOpenReview={handleOpenReview}
      />

      {/* AI FINAL RESUME REVIEW & QUALITY ASSURANCE MODAL (PHASE 4) */}
      <ResumeReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        resumeData={resumeData}
        onResumeDataChange={(updated) => {
          setResumeData(updated);
          onResumeDataChange?.(updated);
        }}
        resumeSetup={resumeSetup}
        recommendations={cachedRecommendations}
        onProceedToExport={() => {
          setIsReviewModalOpen(false);
          setIsFinalPreviewOpen(true);
        }}
        onJumpToStep={(stepId) => {
          setIsReviewModalOpen(false);
          setActiveStep(stepId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* AI CONTENT ASSISTANT MODAL (PHASE 3) */}
      <AiContentAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        resumeData={resumeData}
        resumeSetup={resumeSetup}
        recommendations={cachedRecommendations}
        initialSection={assistantSection}
        initialAction={assistantAction}
        initialContent={assistantContent}
        itemContext={assistantItemContext}
        onApplyContent={handleApplyAssistantContent}
      />

      {/* SECTION MANAGEMENT MODAL (PHASE 3) */}
      <SectionManagerModal
        isOpen={isSectionManagerOpen}
        onClose={() => setIsSectionManagerOpen(false)}
        resumeData={resumeData}
        resumeSetup={resumeSetup}
        recommendations={cachedRecommendations}
        onSaveSectionConfig={handleSaveSectionConfig}
      />

      {/* SUBTLE STATUS TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101010] text-[#F8F5EE] px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
