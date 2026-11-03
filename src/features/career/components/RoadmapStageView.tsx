/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — 6-Stage Personalized Learning Roadmap Component
 * Interactive timeline with completion toggles, practical exercises,
 * estimated durations, verified resource links, and custom task additions.
 */

import { useState } from 'react';
import {
  RoadmapStage,
  RoadmapTask,
  RoadmapTaskStatus,
  RoadmapStageId,
} from '../../../types/careerIntelligence.ts';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface RoadmapStageViewProps {
  stages: RoadmapStage[];
  onUpdateTaskStatus: (taskId: string, status: RoadmapTaskStatus, notes?: string) => void;
  onAddTask: (stageId: RoadmapStageId, title: string, objective: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function RoadmapStageView({
  stages,
  onUpdateTaskStatus,
  onAddTask,
  onDeleteTask,
}: RoadmapStageViewProps) {
  const [activeStageId, setActiveStageId] = useState<string>(stages[0]?.id || 'foundation');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customObjective, setCustomObjective] = useState('');

  const currentStage = stages.find((s) => s.id === activeStageId) || stages[0];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddTask(
      activeStageId as RoadmapStageId,
      customTitle.trim(),
      customObjective.trim() || 'Self-directed milestone'
    );
    setCustomTitle('');
    setCustomObjective('');
    setIsAddingTask(false);
  };

  // Overall progress calculation across all stages
  const allTasks = stages.flatMap((s) => s.tasks);
  const completedCount = allTasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = allTasks.filter((t) => t.status === 'in-progress').length;
  const progressPercent = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-5 sm:p-7 shadow-2xs space-y-6">
      
      {/* Top Header with Overall Completion Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE3]">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#101010]">
            Personalized Learning Roadmap (6 Stages)
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Structured step-by-step curriculum from fundamentals to portfolio and interview prep.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl px-4 py-2 shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#777777] block">
              Roadmap Progress
            </span>
            <span className="text-xs font-bold text-[#101010]">
              {completedCount} of {allTasks.length} tasks completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-16 bg-[#E5E0D8] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#101010] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6-Stage Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {stages.map((stage, idx) => {
          const stageCompleted = stage.tasks.length > 0 && stage.tasks.every((t) => t.status === 'completed');
          const stageInProgress = stage.tasks.some((t) => t.status === 'in-progress');
          const isActive = stage.id === activeStageId;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setActiveStageId(stage.id);
                setIsAddingTask(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#101010] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#666666] hover:bg-[#F0ECE3] hover:text-[#101010] border border-[#E5E0D8]'
              }`}
            >
              <span>{stage.title}</span>
              {stageCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : stageInProgress ? (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Active Stage Description */}
      {currentStage && (
        <div className="p-3.5 bg-[#FAF5EC] border border-[#E8DEC8] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#8C6D1F]">
          <div>
            <strong>Stage Focus: </strong>
            {currentStage.description}
          </div>
          <button
            type="button"
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] hover:bg-[#F2EBDC] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Task</span>
          </button>
        </div>
      )}

      {/* Add Custom Task Form */}
      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="p-4 bg-white border border-[#101010] rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-[#101010]">Add Custom Learning Task to {currentStage?.title}</h4>
          <div className="space-y-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Build a microservices event bus with RabbitMQ"
              className="w-full text-xs p-2.5 rounded-lg border border-[#D5CFC5] bg-white outline-none focus:ring-1 focus:ring-[#101010]"
              required
            />
            <input
              type="text"
              value={customObjective}
              onChange={(e) => setCustomObjective(e.target.value)}
              placeholder="Objective (e.g. Master asynchronous message brokering for backend)"
              className="w-full text-xs p-2.5 rounded-lg border border-[#D5CFC5] bg-white outline-none focus:ring-1 focus:ring-[#101010]"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#666666] hover:bg-[#FAF9F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#101010] text-white hover:bg-[#252525] cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Tasks in Current Stage */}
      <div className="space-y-3">
        {currentStage?.tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;

          return (
            <div
              key={task.id}
              className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                task.status === 'completed'
                  ? 'bg-[#F4F9F5] border-[#CDE5D2]'
                  : task.status === 'in-progress'
                  ? 'bg-[#FAF8F5] border-[#E8DEC8]'
                  : 'bg-white border-[#E5E0D8]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next: RoadmapTaskStatus =
                        task.status === 'not-started'
                          ? 'in-progress'
                          : task.status === 'in-progress'
                          ? 'completed'
                          : 'not-started';
                      onUpdateTaskStatus(task.id, next);
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border cursor-pointer transition-colors ${
                      task.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-700 text-white'
                        : task.status === 'in-progress'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-white border-[#D5CFC5] text-transparent hover:border-[#101010]'
                    }`}
                    title="Click to toggle status"
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {task.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold text-[#101010] ${task.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                        {task.title}
                      </h4>
                      <span className="text-[10px] font-mono text-[#888888] flex items-center gap-1 bg-white border border-[#E5E0D8] px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-[#777777]" />
                        {task.estimatedDuration}
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-0.5">{task.objective}</p>
                  </div>
                </div>

                {/* Right Actions: Status Dropdown & Expand */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as RoadmapTaskStatus)}
                    className="text-xs font-semibold p-1.5 rounded-lg border border-[#E5E0D8] bg-white text-[#101010] cursor-pointer"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="p-1.5 rounded-lg hover:bg-[#FAF9F5] text-[#777777] cursor-pointer"
                    title={isExpanded ? 'Collapse' : 'Expand details'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-[#888888] hover:text-rose-600 cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded Task Details */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-[#F0ECE3] space-y-3 text-xs">
                  {/* Why It Matters */}
                  <div className="p-2.5 bg-[#FAF9F5] rounded-xl border border-[#F0ECE3] text-[#555555]">
                    <strong className="text-[#101010] block mb-0.5">Why it matters for this role:</strong>
                    {task.whyItMatters}
                  </div>

                  {/* Suggested Topics & Practical Exercises */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {task.suggestedTopics && task.suggestedTopics.length > 0 && (
                      <div className="p-3 bg-white border border-[#EAE5DC] rounded-xl">
                        <strong className="text-[#101010] block mb-1">Topics to Cover:</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-[#555555]">
                          {task.suggestedTopics.map((top, idx) => (
                            <li key={idx}>{top}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.practicalExercises && task.practicalExercises.length > 0 && (
                      <div className="p-3 bg-white border border-[#EAE5DC] rounded-xl">
                        <strong className="text-[#101010] block mb-1">Practical Exercises:</strong>
                        <ul className="list-disc list-inside space-y-0.5 text-[#555555]">
                          {task.practicalExercises.map((ex, idx) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Completion Criteria */}
                  <div className="text-[11px] text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                    <strong>Completion Criteria: </strong>
                    {task.completionCriteria}
                  </div>

                  {/* Verified Resources */}
                  {task.suggestedResources && task.suggestedResources.length > 0 && (
                    <div>
                      <strong className="text-[#101010] block mb-1.5">Learning Resources:</strong>
                      <div className="flex flex-wrap gap-2">
                        {task.suggestedResources.map((res, idx) => (
                          <a
                            key={idx}
                            href={res.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors"
                          >
                            <BookOpen className="w-3 h-3 text-[#8C6D1F]" />
                            <span>{res.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#888888]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
