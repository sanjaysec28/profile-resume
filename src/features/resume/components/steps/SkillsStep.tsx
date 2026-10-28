/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ResumeData } from '../../../../types/resume.ts';
import { COMMON_TECHNICAL_SKILLS, COMMON_SOFT_SKILLS } from '../../constants.ts';
import { X, Plus } from 'lucide-react';

interface SkillsStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function SkillsStep({ data, onChange }: SkillsStepProps) {
  const [activeTab, setActiveTab] = useState<'technical' | 'soft'>('technical');
  const [newSkill, setNewSkill] = useState('');

  const currentSkills = activeTab === 'technical' ? data.skills.technical : data.skills.soft;
  const suggestedSkills = activeTab === 'technical' ? COMMON_TECHNICAL_SKILLS : COMMON_SOFT_SKILLS;

  const handleAddSkill = (skillToAdd?: string) => {
    const trimmed = (skillToAdd || newSkill).trim();
    if (!trimmed) return;

    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill('');
      return;
    }

    onChange((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [activeTab]: [...prev.skills[activeTab], trimmed],
      },
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [activeTab]: prev.skills[activeTab].filter((s) => s !== skillToRemove),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Segmented Tab Bar matching reference */}
      <div className="inline-flex p-1 bg-[#EAE5DC] rounded-xl border border-[#DDD5C7]">
        <button
          type="button"
          onClick={() => setActiveTab('technical')}
          className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'technical'
              ? 'bg-[#101010] text-white shadow-xs'
              : 'text-[#555555] hover:text-[#101010]'
          }`}
        >
          Technical Skills
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('soft')}
          className={`px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'soft'
              ? 'bg-[#101010] text-white shadow-xs'
              : 'text-[#555555] hover:text-[#101010]'
          }`}
        >
          Soft Skills
        </button>
      </div>

      {/* Input + Add Button */}
      <div className="flex gap-2.5">
        <input
          type="text"
          value={newSkill}
          placeholder={
            activeTab === 'technical'
              ? 'Add a skill (e.g. Python, React, MongoDB)...'
              : 'Add a soft skill (e.g. Problem Solving, Leadership)...'
          }
          className="flex-1 h-11 px-4 bg-white text-[#101010] text-sm placeholder:text-[#A3A3A3] border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#101010] focus:ring-1 focus:ring-[#101010]"
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSkill();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleAddSkill()}
          className="h-11 px-5 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Active Skill Tags with X button */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] min-h-[100px]">
        {currentSkills.length === 0 ? (
          <p className="text-xs text-[#A3A3A3] italic py-2">
            No {activeTab} skills added yet. Type a skill or pick from suggestions below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E0D8CB] text-xs font-medium text-[#101010] shadow-2xs"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-600 text-[#777777] transition-colors cursor-pointer ml-0.5"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Skills Section */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#101010] block">Suggested Skills</label>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills
            .filter((s) => !currentSkills.includes(s))
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddSkill(suggestion)}
                className="px-2.5 py-1 text-xs rounded-lg bg-white/70 hover:bg-white text-[#555555] hover:text-[#101010] border border-[#E5E0D8] hover:border-[#C5BDAF] transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{suggestion}</span>
                <span className="text-[#A3A3A3] text-[10px]">+</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
