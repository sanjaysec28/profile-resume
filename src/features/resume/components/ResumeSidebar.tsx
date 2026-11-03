/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dark Left Sidebar Navigation for Resume Builder
 * 7 numbered steps with cream active pill and clean interaction.
 */

export interface StepItem {
  id: number;
  key: string;
  title: string;
  description: string;
}

export const RESUME_STEPS: StepItem[] = [
  { id: 1, key: 'personal', title: 'Personal Info', description: "Let's start with your basic details." },
  { id: 2, key: 'education', title: 'Education', description: 'Add your academic details.' },
  { id: 3, key: 'skills', title: 'Skills', description: 'Add your technical and soft skills.' },
  { id: 4, key: 'projects', title: 'Projects', description: 'Add your best projects.' },
  { id: 5, key: 'experience', title: 'Experience', description: 'Add your work experience or internships.' },
  { id: 6, key: 'certifications', title: 'Credentials & More', description: 'Certifications, achievements, leadership & coursework.' },
  { id: 7, key: 'preview', title: 'Preview & Template', description: 'Select a resume template that matches your style.' },
];

interface ResumeSidebarProps {
  activeStep: number;
  onStepSelect: (stepId: number) => void;
  className?: string;
  onOpenSectionManager?: () => void;
  onOpenContentAssistant?: () => void;
  onOpenReview?: () => void;
  reviewStatus?: string;
  onNavigateToCareer?: () => void;
  onNavigateToInterview?: () => void;
  onNavigateToPlacement?: () => void;
}

export function ResumeSidebar({
  activeStep,
  onStepSelect,
  className = '',
  onOpenSectionManager,
  onOpenContentAssistant,
  onOpenReview,
  reviewStatus,
  onNavigateToCareer,
  onNavigateToInterview,
  onNavigateToPlacement,
}: ResumeSidebarProps) {
  return (
    <aside
      className={`w-full lg:w-[210px] xl:w-[220px] shrink-0 bg-[#1C1C1C] text-white rounded-[26px] p-3 sm:p-4 flex flex-col justify-between shadow-md ${className}`}
      aria-label="Resume Sections"
    >
      <div className="space-y-1.5 sm:space-y-2">
        {RESUME_STEPS.map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(step.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 text-left cursor-pointer ${
                isActive
                  ? 'bg-[#F8F5EE] text-[#101010] font-semibold shadow-xs'
                  : 'text-[#A3A3A3] hover:text-white hover:bg-[#282828]'
              }`}
            >
              {/* Number circle badge */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#101010] text-[#F8F5EE]'
                    : isCompleted
                    ? 'bg-[#2E2E2E] text-[#F8F5EE]'
                    : 'bg-[#292929] text-[#777777]'
                }`}
              >
                {step.id}
              </div>

              {/* Step label */}
              <span className="text-xs sm:text-[13px] tracking-tight truncate">
                {step.title}
              </span>
            </button>
          );
        })}

        {/* Phase 3 & 4 Tools: Review, Section Manager & AI Assistant */}
        <div className="pt-3 border-t border-[#2C2C2C] space-y-1">
          {onOpenReview && (
            <button
              type="button"
              onClick={onOpenReview}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold text-amber-400 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Review My Resume</span>
              </div>
              {reviewStatus && reviewStatus !== 'not-reviewed' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200">
                  {reviewStatus === 'ready-for-export' ? '✓ Ready' : 'QA'}
                </span>
              )}
            </button>
          )}

          {onNavigateToCareer && (
            <button
              type="button"
              onClick={onNavigateToCareer}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-blue-300 hover:text-blue-200 hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="truncate">Career Roadmap</span>
            </button>
          )}

          {onNavigateToInterview && (
            <button
              type="button"
              onClick={onNavigateToInterview}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-emerald-300 hover:text-emerald-200 hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate">Interview Prep</span>
            </button>
          )}

          {onNavigateToPlacement && (
            <button
              type="button"
              onClick={onNavigateToPlacement}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-indigo-300 hover:text-indigo-200 hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="truncate">Jobs & Placement</span>
            </button>
          )}

          {onOpenContentAssistant && (
            <button
              type="button"
              onClick={onOpenContentAssistant}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#D4AF37] hover:text-amber-200 hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="truncate">AI Content Assistant</span>
            </button>
          )}

          {onOpenSectionManager && (
            <button
              type="button"
              onClick={onOpenSectionManager}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#A3A3A3] hover:text-white hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <span className="text-[11px] uppercase tracking-wider">⚙ Manage Sections</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtle bottom brand status */}
      <div className="pt-4 border-t border-[#2C2C2C] px-3 mt-4 hidden lg:block">
        <span className="text-[10px] text-[#777777] uppercase tracking-wider block">
          ProFile Studio
        </span>
        <span className="text-[11px] text-[#A3A3A3] font-medium block mt-0.5">
          Step {activeStep} of 7
        </span>
      </div>
    </aside>
  );
}
