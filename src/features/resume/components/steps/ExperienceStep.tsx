/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData, ResumeExperience } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Textarea } from '../../../../components/ui/Textarea.tsx';
import { Select } from '../../../../components/ui/Select.tsx';
import { Plus, Trash2, Briefcase } from 'lucide-react';

interface ExperienceStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function ExperienceStep({ data, onChange }: ExperienceStepProps) {
  const experiences = data.experience;

  const handleAddExperience = () => {
    const newExp: ResumeExperience = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      location: '',
      employmentType: 'Internship',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      bullets: [],
    };
    onChange((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  const handleRemoveExperience = (id: string) => {
    onChange((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ResumeExperience, value: any) => {
    onChange((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Add Button & Freshers note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddExperience}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Experience</span>
        </button>

        <span className="text-xs text-[#777777] bg-white/60 px-3 py-1 rounded-lg border border-[#E5E0D8]">
          Optional for freshers without prior work experience
        </span>
      </div>

      {/* Experience Cards */}
      <div className="space-y-5">
        {experiences.map((exp, idx) => (
          <div
            key={exp.id}
            className="p-5 sm:p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-4 shadow-2xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#101010]" />
                <h4 className="text-sm sm:text-base font-bold text-[#101010]">
                  {exp.company || `Experience #${idx + 1}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveExperience(exp.id)}
                className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                aria-label="Remove experience"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Row 1: Company & Job Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company or Organization"
                placeholder="e.g. Paytm"
                value={exp.company}
                onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
              />
              <Input
                label="Job Title or Role"
                placeholder="e.g. Onboarding Specialist Intern - PI Agents"
                value={exp.position}
                onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
              />
            </div>

            {/* Row 2: Type, Location, Start, End */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Select
                  label="Type"
                  value={exp.employmentType || 'Internship'}
                  onChange={(e) => handleUpdateExperience(exp.id, 'employmentType', e.target.value)}
                  options={[
                    { value: 'Internship', label: 'Internship' },
                    { value: 'Full-time', label: 'Full-time' },
                    { value: 'Part-time', label: 'Part-time' },
                    { value: 'Freelance', label: 'Freelance' },
                    { value: 'Fellowship', label: 'Fellowship' },
                  ]}
                />
              </div>
              <div>
                <Input
                  label="Location"
                  placeholder="e.g. Bengaluru & Noida"
                  value={exp.location || ''}
                  onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Start Date"
                  placeholder="e.g. Jun 2026"
                  value={exp.startDate}
                  onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="End Date"
                  placeholder={exp.isCurrent ? 'Present' : 'e.g. Aug 2026'}
                  disabled={exp.isCurrent}
                  value={exp.isCurrent ? 'Present' : exp.endDate}
                  onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#101010]">
                Description & Key Achievements
              </label>
              <Textarea
                rows={3}
                placeholder="• Worked on AI agents for customer onboarding&#10;• Collaborated with cross-functional teams&#10;• Gained experience in real-world product development"
                value={exp.description || ''}
                onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                helperText="Use bullet points (•) to highlight concrete contributions and impact"
              />
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
            <p className="text-xs sm:text-sm text-[#777777] mb-3">
              No professional experience listed. As a student, you can skip this section or include internships, research fellowships, or club leadership.
            </p>
            <button
              type="button"
              onClick={handleAddExperience}
              className="px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-xl hover:bg-[#252525] transition-colors"
            >
              Add First Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
