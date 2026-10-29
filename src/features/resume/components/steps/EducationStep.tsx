/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData, ResumeEducation } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Plus, Trash2 } from 'lucide-react';

interface EducationStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function EducationStep({ data, onChange }: EducationStepProps) {
  const educationList = data.education;

  const handleAddEducation = () => {
    const newEntry: ResumeEducation = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      scoreOrGpa: '',
      type: 'college',
    };
    onChange((prev) => ({
      ...prev,
      education: [...prev.education, newEntry],
    }));
  };

  const handleRemoveEducation = (id: string) => {
    onChange((prev) => ({
      ...prev,
      education: prev.education.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateItem = (id: string, field: keyof ResumeEducation, value: string) => {
    onChange((prev) => ({
      ...prev,
      education: prev.education.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Add Button matching reference */}
      <div>
        <button
          type="button"
          onClick={handleAddEducation}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Education</span>
        </button>
      </div>

      {/* Education Cards */}
      <div className="space-y-5">
        {educationList.map((edu, idx) => {
          const cardTitle =
            edu.degree && edu.fieldOfStudy
              ? `${edu.degree} (${edu.fieldOfStudy})`
              : edu.degree || edu.institution || `Education Record #${idx + 1}`;

          return (
            <div
              key={edu.id}
              className="p-5 sm:p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-4 shadow-2xs"
            >
              {/* Card Header with trash icon */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
                <h4 className="text-sm sm:text-base font-bold text-[#101010]">
                  {cardTitle}
                </h4>
                {educationList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(edu.id)}
                    className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                    aria-label="Remove education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid 1: Institution & Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Institution / School Name"
                  placeholder="e.g. State University"
                  value={edu.institution}
                  onChange={(e) => handleUpdateItem(edu.id, 'institution', e.target.value)}
                />
                <Input
                  label="Degree / Examination"
                  placeholder="e.g. Bachelor of Science"
                  value={edu.degree}
                  onChange={(e) => handleUpdateItem(edu.id, 'degree', e.target.value)}
                />
              </div>

              {/* Grid 2: Branch/Major, Start Year, End Year, Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <Input
                    label="Branch / Major"
                    placeholder="e.g. AI & Data Science"
                    value={edu.fieldOfStudy}
                    onChange={(e) => handleUpdateItem(edu.id, 'fieldOfStudy', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Start Year"
                    placeholder="e.g. 2024"
                    value={edu.startDate}
                    onChange={(e) => handleUpdateItem(edu.id, 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="End Year"
                    placeholder="e.g. 2028"
                    value={edu.endDate}
                    onChange={(e) => handleUpdateItem(edu.id, 'endDate', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="CGPA / Percentage"
                    placeholder="e.g. 8.2 / 92%"
                    value={edu.scoreOrGpa || ''}
                    onChange={(e) => handleUpdateItem(edu.id, 'scoreOrGpa', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
