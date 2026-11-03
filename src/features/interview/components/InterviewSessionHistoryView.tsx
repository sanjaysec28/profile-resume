/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Past Interview Sessions History View
 * Allows students to review past mock performance, inspect question feedback, and manage history.
 */

import React, { useState } from 'react';
import {
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { InterviewSession } from '../../../types/interviewIntelligence.ts';
import { deleteInterviewSession } from '../../../lib/interviewIntelligenceService.ts';

interface InterviewSessionHistoryViewProps {
  userId?: string;
  sessions: InterviewSession[];
  onSessionsUpdated: (updated: InterviewSession[]) => void;
  onBack: () => void;
}

export const InterviewSessionHistoryView: React.FC<InterviewSessionHistoryViewProps> = ({
  userId,
  sessions,
  onSessionsUpdated,
  onBack,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string) => {
    await deleteInterviewSession(userId, sessionId);
    const updated = sessions.filter((s) => s.id !== sessionId);
    onSessionsUpdated(updated);
    setDeletingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
        <span className="text-xs text-[#888888]">{sessions.length} total sessions recorded</span>
      </div>

      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Session Records</span>
        </div>
        <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
          Mock Interview History
        </h2>
        <p className="text-sm text-[#666666] mt-1 max-w-xl leading-relaxed">
          Inspect performance trajectories across your technical and behavioral rehearsals.
          Review what was done well and revision topics identified by the AI evaluator.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-xs text-[#888888] space-y-2">
          <Clock className="w-8 h-8 text-[#CCCCCC] mx-auto stroke-[1.5]" />
          <div className="font-semibold text-sm text-[#101010]">No recorded interview sessions</div>
          <p>Take your first mock interview to track your response quality over time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const isExpanded = s.id === expandedSessionId;
            const score = s.performanceSummary?.overallScore ?? 0;
            const label = s.performanceSummary?.qualitativeLabel || 'Completed';
            const answersCount = Object.keys(s.answers || {}).length;

            return (
              <div
                key={s.id}
                className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden shadow-xs transition-all"
              >
                <div
                  onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF9F5]/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101010] capitalize">
                        {s.targetRole}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-full text-[#666666] capitalize">
                        {s.category.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#888888]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.startedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{answersCount}/{s.questions.length} questions answered</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#101010]">
                        {score}
                        <span className="text-xs font-normal text-[#888888]">/100</span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">{label}</div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(s.id);
                      }}
                      className="p-1.5 text-[#888888] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-[#888888]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-[#F0ECE1] bg-[#FAF9F5]/40 space-y-4">
                    {s.performanceSummary && (
                      <div className="mt-4 p-4 bg-white border border-[#EAE5DC] rounded-xl text-xs space-y-2">
                        <div className="font-bold text-[#101010]">Summary Feedback:</div>
                        <p className="text-[#555555] leading-relaxed">
                          {s.performanceSummary.qualitativeFeedback}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                        Question Breakdown
                      </div>
                      {s.questions.map((q, idx) => {
                        const ans = s.answers[q.id];
                        return (
                          <div
                            key={q.id}
                            className="p-3.5 bg-white border border-[#E8E2D7] rounded-xl text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-[#101010]">
                                Q{idx + 1}: {q.question}
                              </span>
                              {ans && (
                                <span className="text-emerald-700 font-bold">
                                  {ans.score}/100
                                </span>
                              )}
                            </div>
                            {ans && (
                              <p className="text-[#666666] italic leading-relaxed">
                                "{ans.studentAnswer}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-[#101010]">Delete Interview Record?</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              This will permanently remove this mock interview attempt from your history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
