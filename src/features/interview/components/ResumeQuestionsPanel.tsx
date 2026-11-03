/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Resume-Based Interview Defense Panel
 * Generates and conducts defense drills directly grounded in the student's actual projects & skills.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  ArrowRight,
  Send,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { InterviewQuestion, EvaluatedAnswer } from '../../../types/interviewIntelligence.ts';
import { requestInterviewQuestions, requestAnswerEvaluation } from '../../../lib/interviewIntelligenceService.ts';

interface ResumeQuestionsPanelProps {
  targetRole: string;
  projectsSummary?: {
    title: string;
    techStack: string[];
    description: string;
    bullets?: string[];
  }[];
  verifiedSkills?: string[];
  onStartFullMock?: () => void;
}

export const ResumeQuestionsPanel: React.FC<ResumeQuestionsPanelProps> = ({
  targetRole,
  projectsSummary = [],
  verifiedSkills = [],
  onStartFullMock,
}) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Record<string, EvaluatedAnswer>>({});
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);

  // Generate resume-derived questions on load
  useEffect(() => {
    async function loadResumeQuestions() {
      setIsLoading(true);
      try {
        const qList = await requestInterviewQuestions({
          targetRole,
          category: 'resume-focused',
          difficulty: 'medium',
          count: 5,
          projectsSummary,
          verifiedSkills,
        });
        setQuestions(qList);
        if (qList.length > 0) {
          setActiveQuestionId(qList[0].id);
        }
      } catch (err) {
        console.warn('Failed to load resume questions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResumeQuestions();
  }, [targetRole, projectsSummary, verifiedSkills]);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);
  const activeEval = activeQuestionId ? evaluations[activeQuestionId] : undefined;

  const handleEvaluate = async () => {
    if (!activeQuestion || !studentAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const evaluation = await requestAnswerEvaluation(
        activeQuestion,
        studentAnswer.trim(),
        'text',
        targetRole
      );
      setEvaluations((prev) => ({
        ...prev,
        [activeQuestion.id]: evaluation,
      }));
    } catch (err) {
      console.warn('Answer evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>Resume-Grounded Defense</span>
        </div>
        <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
          Questions From Your Resume
        </h2>
        <p className="text-sm text-[#666666] mt-1.5 max-w-2xl leading-relaxed">
          Interviewers almost always ask deep questions about the projects, technologies, and achievements
          documented on your resume. Practice defending your architectural choices, debugging stories, and trade-offs.
        </p>
      </div>

      {/* Projects Reference Card */}
      {projectsSummary.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#666666]">
            <Layers className="w-4 h-4 text-[#101010]" />
            <span>Documented Projects Under Defense</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {projectsSummary.map((p, idx) => (
              <div key={idx} className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg space-y-1">
                <div className="text-xs font-bold text-[#101010]">{p.title}</div>
                <div className="text-[11px] text-[#666666] line-clamp-1">{p.techStack.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Defense Drill Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
            Defense Questions ({questions.length})
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#888888] bg-white border border-[#E5E0D8] rounded-xl">
              <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-2" />
              Generating questions from your resume...
            </div>
          ) : (
            <div className="space-y-2.5">
              {questions.map((q, idx) => {
                const isSelected = q.id === activeQuestionId;
                const isEvaluated = Boolean(evaluations[q.id]);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveQuestionId(q.id);
                      setStudentAnswer(evaluations[q.id]?.studentAnswer || '');
                      setShowModelAnswer(false);
                    }}
                    className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#101010] text-[#F8F5EE] border-[#101010] shadow-xs'
                        : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        Question {idx + 1}
                      </span>
                      {isEvaluated && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">
                          Score: {evaluations[q.id].score}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold line-clamp-2 leading-snug">
                      {q.question}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Drill & Practice Box */}
        <div className="lg:col-span-2">
          {activeQuestion ? (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#888888] mb-1.5">
                  {activeQuestion.topic}
                </div>
                <h3 className="text-lg font-bold text-[#101010] leading-snug">
                  {activeQuestion.question}
                </h3>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs text-[#666666] leading-relaxed">
                <strong className="text-[#101010]">Interviewer rationale: </strong>
                {activeQuestion.whyAsked}
              </div>

              {/* Student response form */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Your Project Defense
                </label>
                <textarea
                  rows={5}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Explain why you chose this design, how you implemented it, and what lessons or trade-offs you discovered..."
                  className="w-full p-4 bg-white border border-[#E5E0D8] rounded-xl text-sm text-[#101010] focus:outline-none focus:border-[#101010] leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#888888]">
                    {studentAnswer.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !studentAnswer.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Evaluate Defense</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Evaluation Feedback */}
              {activeEval && (
                <div className="mt-6 p-5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                      Defense Evaluation
                    </span>
                    <span className="px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-bold text-[#101010]">
                      Score: {activeEval.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                      <div className="font-bold text-emerald-800">What was persuasive:</div>
                      <ul className="space-y-1 text-[#333333]">
                        {activeEval.whatWasDoneWell.map((w, idx) => (
                          <li key={idx}>• {w}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                      <div className="font-bold text-amber-800">Missing context:</div>
                      <ul className="space-y-1 text-[#333333]">
                        {activeEval.whatWasMissing.map((m, idx) => (
                          <li key={idx}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-xs text-[#444444] leading-relaxed">
                    <strong className="text-[#101010]">Next adjustment: </strong>
                    {activeEval.improvementSuggestions.join(' ')}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setShowModelAnswer(!showModelAnswer)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#101010] font-semibold underline cursor-pointer"
                    >
                      <span>{showModelAnswer ? 'Hide Exemplary Answer' : 'View Exemplary Answer'}</span>
                      {showModelAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showModelAnswer && (
                      <div className="mt-2 p-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#333333] leading-relaxed whitespace-pre-line">
                        {activeEval.exampleStrongerAnswer}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-xs text-[#888888]">
              Select a question on the left to start rehearsing your resume defense.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
