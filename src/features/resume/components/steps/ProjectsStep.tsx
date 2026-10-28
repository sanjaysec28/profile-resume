/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ResumeData, ResumeProject } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Textarea } from '../../../../components/ui/Textarea.tsx';
import { Plus, Trash2, FolderGit2, Globe, Github } from 'lucide-react';

interface ProjectsStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function ProjectsStep({ data, onChange }: ProjectsStepProps) {
  const projects = data.projects;

  const handleAddProject = () => {
    const newProj: ResumeProject = {
      id: `proj-${Date.now()}`,
      title: '',
      description: '',
      techStack: [],
      liveUrl: '',
      repoUrl: '',
      link: '',
      bullets: [],
    };
    onChange((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  };

  const handleRemoveProject = (id: string) => {
    onChange((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleUpdateProject = (id: string, field: keyof ResumeProject, value: any) => {
    onChange((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        // Maintain backward compatibility for link field
        if (field === 'liveUrl' || field === 'repoUrl') {
          updated.link = updated.liveUrl || updated.repoUrl || p.link || '';
        }
        return updated;
      }),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Add Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAddProject}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Project</span>
        </button>
        <span className="text-xs text-[#777777]">
          Separate live links and source code repos
        </span>
      </div>

      {/* Projects List */}
      <div className="space-y-5">
        {projects.map((proj, idx) => (
          <div
            key={proj.id}
            className="p-5 sm:p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-4 shadow-2xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#101010]" />
                <h4 className="text-sm sm:text-base font-bold text-[#101010]">
                  {proj.title || `Project #${idx + 1}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProject(proj.id)}
                className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                aria-label="Remove project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <Input
              label="Project Title"
              placeholder="e.g. ResilientX"
              value={proj.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleUpdateProject(proj.id, 'title', e.target.value)
              }
            />

            {/* Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-[#101010]">Description</label>
                <span className="text-[11px] text-[#A3A3A3]">
                  {proj.description.length}/300
                </span>
              </div>
              <Textarea
                rows={3}
                maxLength={300}
                placeholder="Briefly describe what this project does and key achievements..."
                value={proj.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleUpdateProject(proj.id, 'description', e.target.value)
                }
              />
            </div>

            {/* Technologies Used */}
            <Input
              label="Technologies Used"
              placeholder="e.g. React, Node.js, Python, Gemini AI"
              value={proj.techStack.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const arr = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
                handleUpdateProject(proj.id, 'techStack', arr);
              }}
              helperText="Separate multiple technologies with commas"
            />

            {/* Separate Project URLs: Live Demo & Repository */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <Input
                  label="Live Project URL"
                  leftIcon={<Globe className="w-4 h-4 text-[#777777]" />}
                  placeholder="https://your-project.example"
                  value={proj.liveUrl || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleUpdateProject(proj.id, 'liveUrl', e.target.value)
                  }
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    if (e.target.value) {
                      handleUpdateProject(proj.id, 'liveUrl', normalizeUrl(e.target.value));
                    }
                  }}
                  helperText="Appears as 'Live Demo' in the resume"
                />
              </div>

              <div>
                <Input
                  label="GitHub / Repository URL"
                  leftIcon={<Github className="w-4 h-4 text-[#777777]" />}
                  placeholder="https://github.com/username/project"
                  value={proj.repoUrl || (proj.link && !proj.liveUrl ? proj.link : '')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleUpdateProject(proj.id, 'repoUrl', e.target.value)
                  }
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    if (e.target.value) {
                      handleUpdateProject(proj.id, 'repoUrl', normalizeUrl(e.target.value));
                    }
                  }}
                  helperText="Appears as 'Source Code' in the resume"
                />
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
            <p className="text-xs sm:text-sm text-[#777777] mb-3">
              No projects added yet. Highlight course projects, hackathons, or open-source work.
            </p>
            <button
              type="button"
              onClick={handleAddProject}
              className="px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-xl hover:bg-[#252525] transition-colors"
            >
              Add First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
