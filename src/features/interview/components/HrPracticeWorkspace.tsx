/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: HR & Behavioral Communication Workspace
 * Features STAR framework rehearsal, spoken answer recording, and instant AI evaluation.
 */

import React, { useState } from 'react';
import {
  Users,
  Mic,
  StopCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Brain,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { HrPracticeQuestion, InterviewQuestion } from '../../../types/interviewIntelligence.ts';
import { saveHrQuestions, requestAnswerEvaluation } from '../../../lib/interviewIntelligenceService.ts';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.ts';

interface HrPracticeWorkspaceProps {
  userId?: string;
  targetRole: string;
  questions: HrPracticeQuestion[];
  onQuestionsUpdated: (updated: HrPracticeQuestion[]) => void;
}

export const HrPracticeWorkspace: React.FC<HrPracticeWorkspaceProps> = ({
  userId,
  targetRole,
  questions,
  onQuestionsUpdated,
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0]?.id || 'hr_1');
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [showSample, setShowSample] = useState<boolean>(false);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId) || questions[0];

  // Speech Recognition hook
  const {
    isSupported: isVoiceSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    errorMessage: speechError,
  } = useSpeechRecognition();

  // If transcript changes, sync
  React.useEffect(() => {
    if (transcript) {
      setStudentAnswer(transcript);
    }
  }, [transcript]);

  // When changing active question, load previous answer if any
  React.useEffect(() => {
    if (activeQuestion) {
      setStudentAnswer(activeQuestion.lastAnswer || '');
      setShowSample(false);
    }
  }, [activeQuestionId]);

  const handleEvaluateAnswer = async () => {
    if (!activeQuestion || !studentAnswer.trim()) return;

    if (isListening) stopListening();

    setIsEvaluating(true);
    try {
      const pseudoQuestion: InterviewQuestion = {
        id: activeQuestion.id,
        question: activeQuestion.question,
        category: 'hr-behavioral',
        difficulty: 'easy',
        whyAsked: activeQuestion.purpose,
        topic: 'HR & Behavioral Fit',
        evaluationCriteria: activeQuestion.keyPointsToCover,
      };

      const evaluation = await requestAnswerEvaluation(
        pseudoQuestion,
        studentAnswer.trim(),
        isListening ? 'voice' : 'text',
        targetRole
      );

      const updated = questions.map((q) => {
        if (q.id === activeQuestion.id) {
          return {
            ...q,
            status: 'completed' as const,
            lastAnswer: studentAnswer.trim(),
            lastEvaluation: evaluation,
          };
        }
        return q;
      });

      onQuestionsUpdated(updated);
      await saveHrQuestions(userId, updated);
    } catch (err) {
      console.warn('HR evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const completedCount = questions.filter((q) => q.status === 'completed').length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>HR & Communication Mastery</span>
            </div>
            <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
              Behavioral & Culture Fit Training
            </h2>
            <p className="text-sm text-[#666666] mt-1 max-w-xl leading-relaxed">
              Practice delivering structured, authentic behavioral answers using the STAR method
              (Situation, Task, Action, Result). Practice spoken or typed responses with instant qualitative critique.
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 text-center min-w-[130px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
              Completed Drills
            </div>
            <div className="text-2xl font-bold text-[#101010] mt-0.5">
              {completedCount}
              <span className="text-xs font-normal text-[#888888]">/{questions.length}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              {Math.round((completedCount / Math.max(questions.length, 1)) * 100)}% Rehearsed
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions Selector */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
            Core HR Questions ({questions.length})
          </h3>

          {questions.map((q, idx) => {
            const isSelected = q.id === activeQuestionId;
            const isDone = q.status === 'completed';
            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#101010] text-[#F8F5EE] border-[#101010] shadow-xs'
                    : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Question {idx + 1}
                  </span>
                  {isDone && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-700 text-white">
                      Done {q.lastEvaluation ? `(${q.lastEvaluation.score})` : ''}
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

        {/* Right: Active Rehearsal Room */}
        <div className="lg:col-span-2 space-y-6">
          {activeQuestion && (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                  Behavioral Question
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#101010] mt-1 leading-snug">
                  {activeQuestion.question}
                </h3>
              </div>

              {/* STAR Guidance Card */}
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>STAR Framework & Rationale</span>
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {activeQuestion.starFrameworkGuidance}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="font-bold text-[#101010]">Key points to cover:</span>
                    <ul className="mt-1 space-y-0.5 text-[#555555]">
                      {activeQuestion.keyPointsToCover.map((k, i) => (
                        <li key={i}>• {k}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-amber-800">Pitfalls to avoid:</span>
                    <ul className="mt-1 space-y-0.5 text-amber-900/80">
                      {activeQuestion.pitfallsToAvoid.map((p, i) => (
                        <li key={i}>• {p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sample Structure Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSample(!showSample)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#101010] font-semibold underline cursor-pointer"
                >
                  <span>{showSample ? 'Hide Sample Answer' : 'View Sample Answer Structure'}</span>
                  {showSample ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showSample && (
                  <div className="mt-2 p-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#444444] leading-relaxed italic">
                    {activeQuestion.sampleStructure}
                  </div>
                )}
              </div>

              {/* Rehearsal Input Form */}
              <div className="space-y-3 pt-2 border-t border-[#F0ECE1]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Your Response
                  </span>

                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={() => (isListening ? stopListening() : startListening())}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isListening
                          ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                          : 'bg-white text-[#101010] border-[#E5E0D8] hover:bg-[#FAF9F5]'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <StopCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Stop Speaking</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Record Voice Answer</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {speechError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    {speechError}
                  </div>
                )}

                <textarea
                  rows={5}
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Draft or speak your behavioral response using the STAR method..."
                  className="w-full p-4 bg-white border border-[#E5E0D8] rounded-xl text-sm text-[#101010] focus:outline-none focus:border-[#101010] leading-relaxed resize-y"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#888888]">
                    {studentAnswer.split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={handleEvaluateAnswer}
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
                        <span>Critique Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Evaluation Feedback */}
              {activeQuestion.lastEvaluation && (
                <div className="mt-6 p-5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                      Communication Critique
                    </span>
                    <span className="px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-bold text-[#101010]">
                      Score: {activeQuestion.lastEvaluation.score}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                      <div className="font-bold text-emerald-800">Strong communication:</div>
                      <ul className="space-y-1 text-[#333333]">
                        {activeQuestion.lastEvaluation.whatWasDoneWell.map((w, idx) => (
                          <li key={idx}>• {w}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                      <div className="font-bold text-amber-800">Omitted elements:</div>
                      <ul className="space-y-1 text-[#333333]">
                        {activeQuestion.lastEvaluation.whatWasMissing.map((m, idx) => (
                          <li key={idx}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="text-xs text-[#444444] leading-relaxed">
                    <strong className="text-[#101010]">Coaching advice: </strong>
                    {activeQuestion.lastEvaluation.improvementSuggestions.join(' ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
