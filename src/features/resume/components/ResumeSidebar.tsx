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
  { id: 6, key: 'certifications', title: 'Certifications', description: 'Add your certifications, courses or achievements.' },
  { id: 7, key: 'preview', title: 'Preview', description: 'Select a resume template that matches your style.' },
];

interface ResumeSidebarProps {
  activeStep: number;
  onStepSelect: (stepId: number) => void;
  className?: string;
}

export function ResumeSidebar({ activeStep, onStepSelect, className = '' }: ResumeSidebarProps) {
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
