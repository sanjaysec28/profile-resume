/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: DSA & Coding Practice Workspace
 * Covers 10 standard DSA domains with learning objectives, complexity criteria,
 * and student progress tracking.
 */

import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  BookOpen,
} from 'lucide-react';
import { DsaTopic, DsaTopicId } from '../../../types/interviewIntelligence.ts';
import { saveDsaTopics } from '../../../lib/interviewIntelligenceService.ts';

interface DsaPracticeWorkspaceProps {
  userId?: string;
  topics: DsaTopic[];
  onTopicsUpdated: (updated: DsaTopic[]) => void;
  onStartDsaMock?: () => void;
}

export const DsaPracticeWorkspace: React.FC<DsaPracticeWorkspaceProps> = ({
  userId,
  topics,
  onTopicsUpdated,
  onStartDsaMock,
}) => {
  const [activeTopicId, setActiveTopicId] = useState<DsaTopicId>('arrays-strings');
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];
  const completedCount = topics.filter((t) => t.status === 'completed').length;
  const progressPercent = Math.round((completedCount / Math.max(topics.length, 1)) * 100);

  const handleUpdateTopicStatus = async (topicId: DsaTopicId, newStatus: 'not-started' | 'in-progress' | 'completed') => {
    const updated = topics.map((t) => (t.id === topicId ? { ...t, status: newStatus } : t));
    onTopicsUpdated(updated);
    await saveDsaTopics(userId, updated);
  };

  const handleToggleProblemStatus = async (topicId: DsaTopicId, problemId: string) => {
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        const updatedProblems = t.problems.map((p) => {
          if (p.id === problemId) {
            const nextStatus = p.status === 'completed' ? 'not-started' : 'completed';
            return { ...p, status: nextStatus as any };
          }
          return p;
        });

        // If all problems are completed, mark topic completed
        const allDone = updatedProblems.every((p) => p.status === 'completed');
        const anyDone = updatedProblems.some((p) => p.status === 'completed' || p.status === 'in-progress');
        const topicStatus = allDone ? 'completed' : anyDone ? 'in-progress' : t.status;

        return { ...t, problems: updatedProblems, status: topicStatus };
      }
      return t;
    });

    onTopicsUpdated(updated);
    await saveDsaTopics(userId, updated);
  };

  const toggleHint = (problemId: string) => {
    setOpenHints((prev) => ({
      ...prev,
      [problemId]: !prev[problemId],
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
              <Code2 className="w-3.5 h-3.5" />
              <span>DSA & Placement Coding</span>
            </div>
            <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
              Data Structures & Algorithms Preparation
            </h2>
            <p className="text-sm text-[#666666] mt-1 max-w-xl leading-relaxed">
              Master the 10 foundational data structures tested in campus technical rounds.
              Track your conceptual mastery, optimal time complexities, and practice core patterns.
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 text-center min-w-[130px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
              Topic Mastery
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-0.5">
              {completedCount}
              <span className="text-xs font-normal text-[#888888]">/{topics.length}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              {progressPercent}% Complete
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-[#EFECE6] h-2 rounded-full mt-6 overflow-hidden">
          <div
            className="bg-[#101010] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 10 DSA Topics List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
            Core Topics ({topics.length})
          </h3>

          {topics.map((t) => {
            const isSelected = t.id === activeTopicId;
            const completedProblems = t.problems.filter((p) => p.status === 'completed').length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTopicId(t.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#101010] text-[#F8F5EE] border-[#101010] shadow-xs'
                    : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{t.title}</div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isSelected ? 'text-[#D0CBC0]' : 'text-[#888888]'
                    }`}
                  >
                    {completedProblems}/{t.problems.length} problems
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    t.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : t.status === 'in-progress'
                      ? 'bg-amber-600 text-white'
                      : isSelected
                      ? 'bg-white/20 text-[#F8F5EE]'
                      : 'bg-[#F0ECE1] text-[#666666]'
                  }`}
                >
                  {t.status.replace('-', ' ')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Active Topic Detail & Practice Problems */}
        <div className="lg:col-span-2 space-y-6">
          {activeTopic && (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
              {/* Active Topic Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D7]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                    Difficulty: {activeTopic.difficulty}
                  </span>
                  <h3 className="text-xl font-bold text-[#101010] mt-0.5">
                    {activeTopic.title}
                  </h3>
                  <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                    {activeTopic.overview}
                  </p>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['not-started', 'in-progress', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateTopicStatus(activeTopic.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        activeTopic.status === st
                          ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                          : 'bg-white text-[#666666] border-[#E5E0D8] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Key Placement Learning Objectives</span>
                </div>
                <ul className="space-y-1 text-xs text-[#444444] leading-relaxed">
                  {activeTopic.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#101010] font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Practice Problems List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Practice Problems ({activeTopic.problems.length})
                </h4>

                <div className="space-y-3">
                  {activeTopic.problems.map((prob) => {
                    const isDone = prob.status === 'completed';
                    const showH = Boolean(openHints[prob.id]);
                    return (
                      <div
                        key={prob.id}
                        className={`p-4 sm:p-5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-white border-[#E5E0D8]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  prob.difficulty === 'easy'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : prob.difficulty === 'medium'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {prob.difficulty}
                              </span>
                              <h5 className="text-sm font-bold text-[#101010]">
                                {prob.title}
                              </h5>
                            </div>
                            <p className="text-xs text-[#666666] leading-relaxed pt-1">
                              {prob.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleProblemStatus(activeTopic.id, prob.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-[#666666] border-[#E5E0D8] hover:border-[#101010]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                          </button>
                        </div>

                        {/* Complexity Requirements */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#F0ECE1] text-[11px] text-[#555555]">
                          <span>
                            <strong>Target Time:</strong> {prob.expectedTimeComplexity}
                          </span>
                          <span className="text-[#CCCCCC]">|</span>
                          <span>
                            <strong>Target Space:</strong> {prob.expectedSpaceComplexity}
                          </span>
                        </div>

                        {/* Hints Accordion */}
                        {prob.hints && prob.hints.length > 0 && (
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => toggleHint(prob.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#101010] font-medium cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3" />
                              <span>{showH ? 'Hide hint' : 'Show hint'}</span>
                              {showH ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {showH && (
                              <div className="mt-1.5 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900 leading-relaxed">
                                {prob.hints.join(' ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
