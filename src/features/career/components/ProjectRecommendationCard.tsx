/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Project Recommendation Card
 * Interactive proposed project card with difficulty tags, milestones,
 * student status tracking (planned/in-progress/completed), and link recording.
 */

import { useState } from 'react';
import {
  RecommendedProject,
  ProjectStatus,
  ProjectDifficulty,
} from '../../../types/careerIntelligence.ts';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Github,
  Globe,
  Tag,
  ListTodo,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface ProjectRecommendationCardProps {
  project: RecommendedProject;
  onUpdateStatus: (
    projectId: string,
    status: ProjectStatus,
    links?: { githubUrl?: string; liveUrl?: string; studentNotes?: string }
  ) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
}

export function ProjectRecommendationCard({
  project,
  onUpdateStatus,
  onToggleMilestone,
}: ProjectRecommendationCardProps) {
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || '');
  const [liveUrl, setLiveUrl] = useState(project.liveUrl || '');
  const [notes, setNotes] = useState(project.studentNotes || '');

  const getDifficultyBadge = (difficulty: ProjectDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            Beginner Project
          </span>
        );
      case 'intermediate':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            Intermediate Build
          </span>
        );
      case 'advanced':
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
            Advanced Capstone
          </span>
        );
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-100/70 border border-blue-300 px-2.5 py-0.5 rounded-full">
            Planned
          </span>
        );
      case 'proposed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#666666] bg-[#FAF9F5] border border-[#E5E0D8] px-2.5 py-0.5 rounded-full">
            Proposed Idea
          </span>
        );
    }
  };

  const handleSaveLinks = () => {
    onUpdateStatus(project.id, project.status, {
      githubUrl: githubUrl.trim(),
      liveUrl: liveUrl.trim(),
      studentNotes: notes.trim(),
    });
    setIsEditingLinks(false);
  };

  const completedMilestones = project.milestones.filter((m) => m.completed).length;

  return (
    <div
      className={`border rounded-[24px] p-5 sm:p-6 transition-all ${
        project.status === 'completed'
          ? 'bg-[#F2F8F4] border-[#C8E4D1]'
          : project.status === 'in-progress'
          ? 'bg-[#FAF8F5] border-[#E8DEC8]'
          : 'bg-white border-[#E5E0D8] shadow-2xs'
      }`}
    >
      {/* Top Banner: Status + Difficulty + Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0ECE3]">
        <div className="flex items-center gap-2">
          {getDifficultyBadge(project.difficulty)}
          <span className="text-[10px] text-[#8C6D1F] bg-[#FAF5EC] border border-[#E8DEC8] px-2 py-0.5 rounded font-medium">
            Proposed Idea
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(project.status)}
          <select
            value={project.status}
            onChange={(e) =>
              onUpdateStatus(project.id, e.target.value as ProjectStatus, {
                githubUrl,
                liveUrl,
                studentNotes: notes,
              })
            }
            className="text-xs font-semibold p-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#101010] cursor-pointer"
          >
            <option value="proposed">Proposed</option>
            <option value="planned">Mark Planned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Verified Completed</option>
          </select>
        </div>
      </div>

      {/* Title & Problem Statement */}
      <div className="mt-3.5 space-y-1.5">
        <h4 className="text-base sm:text-lg font-bold text-[#101010] flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-[#8C6D1F] shrink-0" />
          <span>{project.title}</span>
        </h4>
        <p className="text-xs text-[#555555] leading-relaxed">
          {project.problemStatement}
        </p>
      </div>

      {/* Suggested Tech Stack */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-[#101010] mr-1">Tech Stack:</span>
        {project.suggestedTechStack.map((tech, i) => (
          <span
            key={i}
            className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E0D8] text-[#333333]"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Main Features & Learning Outcomes */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3]">
          <strong className="text-[#101010] block mb-1">Key Features to Build:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-[#555555]">
            {project.mainFeatures.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3]">
          <strong className="text-[#101010] block mb-1">Expected Learning Outcomes:</strong>
          <ul className="list-disc list-inside space-y-0.5 text-[#555555]">
            {project.expectedLearningOutcomes.map((out, i) => (
              <li key={i}>{out}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Role Relevance */}
      <div className="mt-3 text-xs text-[#8C6D1F] bg-[#FAF5EC] p-3 rounded-xl border border-[#E8DEC8]">
        <strong>Target-Role Relevance: </strong>
        {project.targetRoleRelevance}
      </div>

      {/* Interactive Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#F0ECE3] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#101010] flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-[#777777]" />
              Implementation Milestones ({completedMilestones}/{project.milestones.length})
            </span>
            <span className="text-[11px] text-[#777777]">
              Check off milestones as you build
            </span>
          </div>

          <div className="space-y-1.5">
            {project.milestones.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  m.completed
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 line-through'
                    : 'bg-white border-[#E5E0D8] text-[#444444] hover:bg-[#FAF9F5]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={m.completed}
                  onChange={() => onToggleMilestone(project.id, m.id)}
                  className="rounded border-[#D5CFC5] text-[#101010] focus:ring-0 cursor-pointer"
                />
                <span>{m.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Recorded Links (GitHub / Demo) */}
      <div className="mt-4 pt-3 border-t border-[#F0ECE3]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-[#101010]">Project Repositories & Live Demos:</span>
          {!isEditingLinks && (
            <button
              type="button"
              onClick={() => setIsEditingLinks(true)}
              className="text-xs font-semibold text-[#8C6D1F] hover:text-[#705615] underline cursor-pointer"
            >
              {project.githubUrl || project.liveUrl ? 'Update Links' : '+ Add Repo / Demo Link'}
            </button>
          )}
        </div>

        {isEditingLinks ? (
          <div className="p-3 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-[#777777] shrink-0" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project-repo"
                className="w-full text-xs p-2 rounded-lg border border-[#D5CFC5] bg-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#777777] shrink-0" />
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://my-live-demo.vercel.app"
                className="w-full text-xs p-2 rounded-lg border border-[#D5CFC5] bg-white outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingLinks(false)}
                className="px-2.5 py-1 text-xs rounded-md text-[#666666] hover:bg-[#EFECE6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLinks}
                className="px-3 py-1 text-xs rounded-md bg-[#101010] text-white font-medium hover:bg-[#252525] cursor-pointer"
              >
                Save Links
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-semibold text-[#101010] hover:bg-[#FAF9F5]"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </a>
            ) : (
              <span className="text-[#888888] text-[11px] italic">No GitHub URL added yet.</span>
            )}

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] font-semibold text-[#101010] hover:bg-[#FAF9F5]"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Demo</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Strict Anti-Hallucination Guard */}
      <div className="mt-3 text-[11px] text-[#777777] italic">
        Integrity Guarantee: This project will never be automatically added to your resume as completed work without your explicit manual action.
      </div>
    </div>
  );
}
