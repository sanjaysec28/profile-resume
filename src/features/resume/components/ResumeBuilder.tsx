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
import { ResumeData } from '../../../types/resume.ts';
import { INITIAL_RESUME_DATA } from '../constants.ts';
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
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Bookmark,
  CheckCircle2,
  Eye,
  Loader2,
} from 'lucide-react';
import { exportResumeToPdf } from '../utils/pdfExport.ts';
import { Logo } from '../../../components/ui/Logo.tsx';
import { SocialFooter } from '../../../components/layout/SocialFooter.tsx';

interface ResumeBuilderProps {
  onBackToDashboard: () => void;
  studentName?: string;
  initialData?: ResumeData;
  onResumeDataChange?: (data: ResumeData) => void;
}

export function ResumeBuilder({
  onBackToDashboard,
  studentName = '',
  initialData,
  onResumeDataChange,
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
      {/* GLOBAL BUILDER TOP BAR */}
      <header className="sticky top-0 z-30 w-full bg-[#F8F5EE]/90 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Left Brand & Return */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex items-center cursor-pointer transition-opacity hover:opacity-90"
              aria-label="ProFile Home"
            >
              <Logo size="md" />
            </button>

            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#777777] hover:text-[#101010] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Right User & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile preview toggle */}
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-medium text-[#101010]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            {/* Save Draft */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#E5E0D8] text-xs font-semibold text-[#101010] shadow-2xs transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#777777]" />
              <span>Save Draft</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer ${
                isExportingPdf
                  ? 'bg-[#333333] opacity-90 cursor-wait'
                  : 'bg-[#101010] hover:bg-[#252525]'
              }`}
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">{exportProgressText || 'Exporting...'}</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>

            {/* Student profile icon (rendered only when genuine user exists) */}
            {studentName ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E0D8]">
                <div className="w-8 h-8 rounded-full bg-[#1C1C1C] text-white flex items-center justify-center text-xs font-bold ring-1 ring-[#E5E0D8]">
                  {studentName[0].toUpperCase()}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-[#101010]">
                  {studentName}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* MOBILE STEP PROGRESS BAR (Visible on small screens) */}
      <div className="lg:hidden bg-[#F0ECE3] border-b border-[#E5E0D8] px-4 py-2.5 overflow-x-auto flex items-center gap-2 scrollbar-none">
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

      {/* MAIN 3-PANEL WORKSPACE */}
      <main className="flex-1 w-full max-w-[1520px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* PANEL 1: LEFT SIDEBAR (Width: approx 190–220px / 2 columns on lg) */}
          <div className="hidden lg:block lg:col-span-2 xl:col-span-2 sticky top-24">
            <ResumeSidebar
              activeStep={activeStep}
              onStepSelect={(id) => {
                setActiveStep(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
                    <PersonalInfoStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 2 && (
                    <EducationStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 3 && (
                    <SkillsStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 4 && (
                    <ProjectsStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 5 && (
                    <ExperienceStep data={resumeData} onChange={setResumeData} />
                  )}
                  {activeStep === 6 && (
                    <CertificationsStep data={resumeData} onChange={setResumeData} />
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
                    <button
                      type="button"
                      onClick={() => setIsFinalPreviewOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] hover:bg-[#252525] text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Generate Preview</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
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
      {isMobilePreviewOpen && (
        <div className="fixed inset-0 z-50 bg-[#101010]/70 backdrop-blur-xs flex flex-col p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 flex flex-col h-full max-h-[95vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <h3 className="font-bold text-sm text-[#101010]">Live Resume Preview</h3>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="text-xs font-bold p-1 text-[#777777]"
              >
                Close ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-3">
              <ResumeLivePreview data={resumeData} />
            </div>
          </div>
        </div>
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
