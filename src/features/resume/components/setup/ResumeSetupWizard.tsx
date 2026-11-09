/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard (Phase 1)
 * 5-Step Setup Workflow:
 * 1. Resume Purpose Selection
 * 2. Target Role Selection (searchable + custom)
 * 3. Job Description (Optional)
 * 4. Student Profile Context (Google Account + Academic details)
 * 5. Setup Summary & Confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  ResumeSetupData,
  ResumePurposeId,
  TargetRole,
  JobDescriptionData,
  StudentProfileContext,
} from '../../../../types/resumeSetup.ts';
import { StudentProfile, AvatarType } from '../../../../types/profile.ts';
import { User } from 'firebase/auth';
import {
  createInitialResumeSetup,
  saveResumeSetup,
  getActiveResumeSetup,
} from '../../../../lib/resumeSetupService.ts';
import { Step1Purpose } from './Step1Purpose.tsx';
import { Step2TargetRole } from './Step2TargetRole.tsx';
import { Step3JobDescription } from './Step3JobDescription.tsx';
import { Step4ProfileContext } from './Step4ProfileContext.tsx';
import { Step5Summary } from './Step5Summary.tsx';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Brain,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../../../../components/layout/Navbar.tsx';
import { SocialFooter } from '../../../../components/layout/SocialFooter.tsx';
import { AppView } from '../../../../types/navigation.ts';

export interface ResumeSetupWizardProps {
  user: User | null;
  profile: StudentProfile;
  userAvatar?: AvatarType;
  userName?: string;
  onSignOut?: () => void;
  onNavigate: (view: AppView) => void;
  onBackToDashboard: () => void;
  onComplete: (setup: ResumeSetupData) => void;
}

const WIZARD_STEPS = [
  { step: 1, label: 'Purpose', description: 'Career Goal' },
  { step: 2, label: 'Target Role', description: 'Desired Title' },
  { step: 3, label: 'Job Description', description: 'Optional Posting' },
  { step: 4, label: 'Student Context', description: 'Verified Profile' },
  { step: 5, label: 'Review & Launch', description: 'Summary' },
];

export function ResumeSetupWizard({
  user,
  profile,
  userAvatar = 'boy',
  userName = '',
  onSignOut,
  onNavigate,
  onBackToDashboard,
  onComplete,
}: ResumeSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [setupData, setSetupData] = useState<ResumeSetupData>(() =>
    createInitialResumeSetup(user, profile)
  );

  // Load existing setup on mount if available
  useEffect(() => {
    let isMounted = true;
    async function loadActive() {
      const active = await getActiveResumeSetup(user?.uid);
      if (active && isMounted) {
        // Keep updated user info from Google session
        setSetupData((prev) => ({
          ...active,
          profileContext: {
            ...active.profileContext,
            fullName: user?.displayName || profile.fullName || active.profileContext.fullName,
            email: user?.email || profile.email || active.profileContext.email,
            photoUrl: user?.photoURL || profile.avatarUrl || active.profileContext.photoUrl,
            collegeOrUniversity:
              active.profileContext.collegeOrUniversity || profile.collegeOrUniversity || '',
            major: active.profileContext.major || profile.major || '',
            graduationYear:
              active.profileContext.graduationYear || profile.graduationYear || '',
          },
        }));
      }
    }
    loadActive();
    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  // Persist draft progress as user moves through wizard
  const persistCurrentDraft = async (data: ResumeSetupData) => {
    try {
      await saveResumeSetup(data);
    } catch (err) {
      console.warn('Auto-save draft failed:', err);
    }
  };

  // Step 1: Purpose handler
  const handleSelectPurpose = (purpose: ResumePurposeId) => {
    const updated = {
      ...setupData,
      purpose,
      updatedAt: new Date().toISOString(),
    };
    setSetupData(updated);
    persistCurrentDraft(updated);
  };

  // Step 2: Target Role handler
  const handleSelectRole = (targetRole: TargetRole) => {
    const updated = {
      ...setupData,
      targetRole,
      updatedAt: new Date().toISOString(),
    };
    setSetupData(updated);
    persistCurrentDraft(updated);
  };

  // Step 3: Job Description handler
  const handleJobDescriptionChange = (jobDescription: JobDescriptionData) => {
    const updated = {
      ...setupData,
      jobDescription,
      updatedAt: new Date().toISOString(),
    };
    setSetupData(updated);
    persistCurrentDraft(updated);
  };

  // Step 4: Profile Context handler
  const handleProfileContextChange = (profileContext: StudentProfileContext) => {
    const updated = {
      ...setupData,
      profileContext,
      updatedAt: new Date().toISOString(),
    };
    setSetupData(updated);
    persistCurrentDraft(updated);
  };

  // Final Confirmation
  const handleFinalConfirm = async () => {
    setIsSaving(true);
    const finalSetup: ResumeSetupData = {
      ...setupData,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveResumeSetup(finalSetup);
    } catch (err) {
      console.error('Failed to save final setup:', err);
    } finally {
      setIsSaving(false);
      onComplete(finalSetup);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleFinalConfirm();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBackToDashboard();
    }
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#171513] flex flex-col font-sans">
      {/* Shared Floating Navbar */}
      <Navbar
        currentView="resume-setup"
        onNavigate={onNavigate}
        userAvatar={userAvatar}
        userName={userName}
        userPhotoUrl={user?.photoURL}
        user={user}
        onSignOut={onSignOut}
      />

      {/* Main Wizard Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        {/* Top Breadcrumb & Step Navigation Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#625D56] hover:text-[#171513] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              {currentStep === 1 ? 'Back to Dashboard' : 'Previous Step'}
            </button>

            <div className="flex items-center gap-2 text-xs text-[#8A8275]">
              <Brain className="w-3.5 h-3.5 text-[#D8B96E]" />
              <span>AI Resume Assistant • Setup Wizard</span>
            </div>
          </div>

          {/* Stepper Progress Card */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-3 sm:p-4 shadow-xs">
            {/* Step Indicators */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-3">
              {WIZARD_STEPS.map((stepMeta) => {
                const isCurrent = currentStep === stepMeta.step;
                const isCompleted = currentStep > stepMeta.step;

                return (
                  <button
                    key={stepMeta.step}
                    type="button"
                    onClick={() => {
                      // Allow jumping directly to previously completed steps or current
                      if (stepMeta.step <= currentStep) {
                        setCurrentStep(stepMeta.step);
                      }
                    }}
                    disabled={stepMeta.step > currentStep}
                    className={`flex flex-col items-center sm:items-start text-left p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed ${
                      isCurrent
                        ? 'bg-[#FAF7F2] border border-[#E0D8CB]'
                        : isCompleted
                        ? 'hover:bg-[#FAF8F5]'
                        : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-[#171513] text-white'
                            : isCurrent
                            ? 'bg-[#171513] text-white ring-2 ring-[#E0D8CB]'
                            : 'bg-[#ECE8E0] text-[#787168]'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : (
                          stepMeta.step
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold hidden sm:inline-block truncate ${
                          isCurrent
                            ? 'text-[#171513]'
                            : isCompleted
                            ? 'text-[#3E3A35]'
                            : 'text-[#8A8275]'
                        }`}
                      >
                        {stepMeta.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8A8275] hidden md:block mt-0.5 truncate pl-8">
                      {stepMeta.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Visual Thin Progress Bar */}
            <div className="w-full bg-[#EFECE6] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#171513] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div className="mb-10 animate-page-enter">
          {currentStep === 1 && (
            <Step1Purpose
              selectedPurpose={setupData.purpose}
              onSelect={handleSelectPurpose}
            />
          )}

          {currentStep === 2 && (
            <Step2TargetRole
              selectedRole={setupData.targetRole}
              onSelectRole={handleSelectRole}
            />
          )}

          {currentStep === 3 && (
            <Step3JobDescription
              jobDescription={setupData.jobDescription}
              onChange={handleJobDescriptionChange}
              onContinueWithoutJD={handleNext}
            />
          )}

          {currentStep === 4 && (
            <Step4ProfileContext
              context={setupData.profileContext}
              onChange={handleProfileContextChange}
            />
          )}

          {currentStep === 5 && (
            <Step5Summary
              setup={setupData}
              onEditStep={(stepNum) => setCurrentStep(stepNum)}
              onConfirmAndContinue={handleFinalConfirm}
              isSaving={isSaving}
            />
          )}
        </div>

        {/* Bottom Wizard Navigation Controls (Steps 1 through 4) */}
        {currentStep < 5 && (
          <div className="flex items-center justify-between pt-6 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 rounded-full border border-[#D5CFC4] bg-white text-xs sm:text-sm font-semibold text-[#171513] hover:bg-[#F5F2EB] transition-colors cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? 'Cancel & Return to Dashboard' : 'Back'}
            </button>

            <div className="flex items-center gap-3">
              {currentStep === 3 && !setupData.jobDescription.provided && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs sm:text-sm font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
                >
                  Skip for Now
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-full bg-[#171513] text-white text-xs sm:text-sm font-bold hover:bg-[#2A2724] transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:translate-x-0.5"
              >
                Continue to Step {currentStep + 1}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Social Footer */}
      <SocialFooter />
    </div>
  );
}
