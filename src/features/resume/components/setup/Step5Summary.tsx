/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard | Step 5: Setup Summary and Confirmation
 * Review card highlighting Purpose, Role, Job Description, and Student Context
 * with inline edit shortcuts and Confirm & Continue button.
 */

import React from 'react';
import {
  ResumeSetupData,
  RESUME_PURPOSE_OPTIONS,
} from '../../../../types/resumeSetup.ts';
import {
  CheckCircle2,
  Edit3,
  Briefcase,
  GraduationCap,
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  Brain,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Step5SummaryProps {
  setup: ResumeSetupData;
  onEditStep: (stepNumber: number) => void;
  onConfirmAndContinue: () => void;
  isSaving: boolean;
}

export function Step5Summary({
  setup,
  onEditStep,
  onConfirmAndContinue,
  isSaving,
}: Step5SummaryProps) {
  const selectedPurposeMeta =
    RESUME_PURPOSE_OPTIONS.find((p) => p.id === setup.purpose) ||
    RESUME_PURPOSE_OPTIONS[0];

  const jdProvided = setup.jobDescription?.provided && setup.jobDescription.text.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-xs font-semibold text-[#625D56] uppercase tracking-wider mb-2">
          Step 5 of 5 • Review & Launch
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight">
          Review Your Resume Setup Configuration
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D56] max-w-2xl">
          Everything is configured. Review your resume purpose, targeted role, job description, and academic context before entering the Resume Builder workspace.
        </p>
      </div>

      {/* Grid of 4 Review Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Resume Purpose */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171513] uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-[#7A7368]" />
                1. Resume Purpose
              </div>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#171513]">
                  {selectedPurposeMeta.title}
                </span>
                {selectedPurposeMeta.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2EFE8] text-[#171513]">
                    {selectedPurposeMeta.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A8275]">
                {selectedPurposeMeta.tagline}
              </p>
              <p className="text-xs text-[#625D56] pt-1">
                {selectedPurposeMeta.description}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Target Role */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171513] uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-[#7A7368]" />
                2. Target Role
              </div>
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#171513]">
                  {setup.targetRole.title || 'General Engineering Role'}
                </span>
                {setup.targetRole.isCustom && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF4E5] text-[#8C6D1F]">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A8275] capitalize">
                Category: {setup.targetRole.category.replace('-', ' ')}
              </p>
              <p className="text-xs text-[#625D56] pt-1">
                Your resume header, summary prompt, and technical skill clusters will be tailored for this title.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Target Job Description */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171513] uppercase tracking-wider">
                <FileText className="w-4 h-4 text-[#7A7368]" />
                3. Job Description
              </div>
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>

            {jdProvided ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Target posting attached ({setup.jobDescription.charCount} characters)
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE7DE] text-xs font-mono text-[#625D56] line-clamp-3">
                  {setup.jobDescription.text}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-sm font-semibold text-[#8A8275] block">
                  None Provided (Skipped)
                </span>
                <p className="text-xs text-[#8A8275]">
                  Using generalized industry standards for {setup.targetRole.title}. You can always paste a job description later.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 4: Student Profile Context */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171513] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#7A7368]" />
                4. Student Context
              </div>
              <button
                type="button"
                onClick={() => onEditStep(4)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8A8275]">Student Name:</span>
                <span className="font-semibold text-[#171513]">
                  {setup.profileContext.fullName || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8275]">Google Account:</span>
                <span className="font-semibold text-[#171513] truncate max-w-[180px]">
                  {setup.profileContext.email || 'Verified user'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8275]">Institution:</span>
                <span className="font-semibold text-[#171513] truncate max-w-[180px]">
                  {setup.profileContext.collegeOrUniversity || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8275]">Degree & Major:</span>
                <span className="font-semibold text-[#171513] truncate max-w-[180px]">
                  {setup.profileContext.major
                    ? `${setup.profileContext.degree || ''} (${setup.profileContext.major})`
                    : 'Engineering / CS'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8A8275]">Graduation Year:</span>
                <span className="font-semibold text-[#171513]">
                  {setup.profileContext.graduationYear || '2026'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Continue Card */}
      <div className="p-6 rounded-2xl bg-[#171513] text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-[#A0988A]">
            <Brain className="w-4 h-4 text-[#D8B96E]" />
            Ready to Build Your Resume
          </div>
          <h3 className="text-lg sm:text-xl font-bold">
            Proceed with this Setup Configuration
          </h3>
          <p className="text-xs text-[#C5BEB3] max-w-lg">
            This setup will be saved to your authenticated account and will seed your resume draft with your targeted role and verified details.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirmAndContinue}
          disabled={isSaving}
          className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-[#171513] font-bold text-sm hover:bg-[#F3EFE6] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Configuration...
            </>
          ) : (
            <>
              Confirm & Continue to Resume Builder
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
