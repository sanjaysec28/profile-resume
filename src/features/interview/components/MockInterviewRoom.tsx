/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Mock Interview Room
 * Interactive interview simulation supporting text & voice answers, instant AI evaluation,
 * and comprehensive performance reports.
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  ArrowRight,
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  StopCircle,
  FileText,
  Clock,
  Target,
} from 'lucide-react';
import {
  InterviewSession,
  InterviewCategory,
  QuestionDifficulty,
  InterviewQuestion,
  EvaluatedAnswer,
  QuestionGenerationInput,
} from '../../../types/interviewIntelligence.ts';
import {
  requestInterviewQuestions,
  requestAnswerEvaluation,
  calculateSessionSummary,
  saveInterviewSession,
} from '../../../lib/interviewIntelligenceService.ts';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.ts';

interface MockInterviewRoomProps {
  userId?: string;
  targetRole: string;
  initialCategory?: string;
  academicYear?: string;
  degree?: string;
  verifiedSkills?: string[];
  missingSkills?: string[];
  projectsSummary?: {
    title: string;
    techStack: string[];
    description: string;
    bullets?: string[];
  }[];
  activeSession?: InterviewSession | null;
  onSessionComplete?: (session: InterviewSession) => void;
  onExit?: () => void;
}

export const MockInterviewRoom: React.FC<MockInterviewRoomProps> = ({
  userId,
  targetRole,
  initialCategory = 'technical-fundamentals',
  academicYear,
  degree,
  verifiedSkills = [],
  missingSkills = [],
  projectsSummary = [],
  activeSession = null,
  onSessionComplete,
  onExit,
}) => {
  // Setup configuration state
  const [selectedRole, setSelectedRole] = useState(targetRole || 'Software Engineer');
  const [selectedCategory, setSelectedCategory] = useState<InterviewCategory>(
    (initialCategory as InterviewCategory) || 'technical-fundamentals'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty>('medium');
  const [selectedLength, setSelectedLength] = useState<number>(5);
  const [targetedGaps, setTargetedGaps] = useState<string[]>(missingSkills);

  // Sync targetedGaps when missingSkills prop changes
  useEffect(() => {
    if (missingSkills && missingSkills.length > 0) {
      setTargetedGaps((prev) => Array.from(new Set([...prev, ...missingSkills])));
    }
  }, [missingSkills]);

  // Active session state
  const [session, setSession] = useState<InterviewSession | null>(activeSession);
  const [currentIndex, setCurrentIndex] = useState<number>(activeSession?.currentQuestionIndex || 0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Answer state
  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);
  const [isConfirmingExit, setIsConfirmingExit] = useState<boolean>(false);

  // Speech Recognition hook
  const {
    isSupported: isVoiceSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    errorMessage: speechError,
  } = useSpeechRecognition();

  // Sync speech transcript into current textAnswer
  useEffect(() => {
    if (transcript) {
      setTextAnswer(transcript);
    }
  }, [transcript]);

  // When changing question index, populate any existing answer
  useEffect(() => {
    if (session && session.questions[currentIndex]) {
      const qId = session.questions[currentIndex].id;
      const existing = session.answers[qId];
      if (existing) {
        setTextAnswer(existing.studentAnswer);
        setAnswerMode(existing.answerMode);
      } else {
        setTextAnswer('');
        resetTranscript();
      }
      setShowHint(false);
      setShowModelAnswer(false);
    }
  }, [currentIndex, session]);

  // Start new mock interview
  const handleStartInterview = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const input: QuestionGenerationInput = {
        targetRole: selectedRole,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        count: selectedLength,
        academicYear,
        degree,
        verifiedSkills,
        missingSkills: targetedGaps,
        projectsSummary,
      };

      const questions = await requestInterviewQuestions(input);

      if (!questions || questions.length === 0) {
        throw new Error('No interview questions could be generated. Please try again.');
      }

      const newSession: InterviewSession = {
        id: `mock_session_${Date.now()}`,
        userId,
        targetRole: selectedRole,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        questionCount: questions.length,
        questions,
        answers: {},
        currentQuestionIndex: 0,
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      };

      setSession(newSession);
      setCurrentIndex(0);
      await saveInterviewSession(userId, newSession);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    if (!currentQ) return;

    if (!textAnswer.trim()) {
      setErrorMessage('Please type or speak an answer before submitting for evaluation.');
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const evaluation = await requestAnswerEvaluation(
        currentQ,
        textAnswer.trim(),
        answerMode,
        session.targetRole
      );

      const updatedAnswers = {
        ...session.answers,
        [currentQ.id]: evaluation,
      };

      const updatedSession: InterviewSession = {
        ...session,
        answers: updatedAnswers,
      };

      setSession(updatedSession);
      await saveInterviewSession(userId, updatedSession);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Complete interview and generate performance report
  const handleFinishInterview = async () => {
    if (!session) return;

    const summary = calculateSessionSummary(session);
    const completedSession: InterviewSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
      performanceSummary: summary,
    };

    setSession(completedSession);
    await saveInterviewSession(userId, completedSession);

    if (onSessionComplete) {
      onSessionComplete(completedSession);
    }
  };

  // Toggle voice recording
  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setAnswerMode('voice');
      startListening();
    }
  };

  // 1. Configuration Screen (if no active session or status is configuring)
  if (!session || session.status === 'configuring') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
        <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010]">
              <Bot className="w-3.5 h-3.5" />
              <span>Configure AI Mock Interview</span>
            </div>
            {onExit && (
              <button
                onClick={onExit}
                className="text-xs text-[#666666] hover:text-[#101010] font-medium cursor-pointer"
              >
                Back to Overview
              </button>
            )}
          </div>

          <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
            Personalized Placement Mock Interview
          </h2>
          <p className="text-sm text-[#666666] mt-1.5 leading-relaxed">
            Select your interview focus. The AI engine will tailor realistic campus and entry-level placement questions grounded in your technical profile.
          </p>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-6 mt-6">
            {/* Target Role Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                Target Role
              </label>
              <input
                type="text"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-sm font-medium text-[#101010] focus:outline-none focus:border-[#101010]"
                placeholder="e.g. Full Stack Developer, Data Scientist, Frontend Engineer"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                Interview Domain
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'technical-fundamentals', label: 'Technical Fundamentals', desc: 'OS, networks, concurrency' },
                  { id: 'dsa', label: 'Data Structures & Algorithms', desc: 'Problem solving & complexities' },
                  { id: 'resume-focused', label: 'Resume-Based Defense', desc: 'Grounded in your projects' },
                  { id: 'frameworks-technologies', label: 'Frameworks & Tools', desc: 'React, Node, APIs' },
                  { id: 'database-sql', label: 'Database & SQL', desc: 'Schema, queries, indexing' },
                  { id: 'hr-behavioral', label: 'HR & Behavioral', desc: 'STAR stories & culture fit' },
                  { id: 'system-design', label: 'System Design Basics', desc: 'Scalability & architecture' },
                  { id: 'internship-placement', label: 'Internship / Placement', desc: 'Onboarding & problem solving' },
                  { id: 'mixed-comprehensive', label: 'Mixed Comprehensive', desc: 'Full-round simulation' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as InterviewCategory)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#101010] text-[#F8F5EE] border-[#101010] shadow-xs'
                        : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                    }`}
                  >
                    <div className="text-xs font-bold leading-snug">{cat.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        selectedCategory === cat.id ? 'text-[#D0CBC0]' : 'text-[#888888]'
                      }`}
                    >
                      {cat.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Career Roadmap Skill Gaps Integration */}
            {targetedGaps.length > 0 && (
              <div className="p-3.5 bg-[#FAF5EC] border border-[#E8DEC8] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#8C6D1F]" />
                    <span className="text-xs font-bold text-[#101010]">
                      Target Identified Skill Gaps from Career Roadmap
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777777]">
                    {targetedGaps.length} selected for questions
                  </span>
                </div>
                <p className="text-[11px] text-[#777777]">
                  Questions will probe these competencies to help you measure improvement and bridge readiness gaps.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {targetedGaps.map((gap) => (
                    <span
                      key={gap}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F]"
                    >
                      <span>{gap}</span>
                      <button
                        type="button"
                        onClick={() => setTargetedGaps((prev) => prev.filter((g) => g !== gap))}
                        className="hover:text-rose-600 transition-colors ml-0.5 text-xs font-bold cursor-pointer"
                        title="Remove from this session"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Difficulty & Length Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as QuestionDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border capitalize transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                          : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-2">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSelectedLength(count)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedLength === count
                          ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                          : 'bg-white text-[#101010] border-[#E5E0D8] hover:border-[#101010]/40'
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 border-t border-[#E8E2D7] flex items-center justify-between">
              <span className="text-xs text-[#888888]">
                Estimated duration: ~{selectedLength * 3} minutes
              </span>
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={isGenerating || !selectedRole.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#101010] text-[#F8F5EE] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Generating Interview...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Begin Interview Simulation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Completed Session View: Performance Report
  if (session.status === 'completed') {
    const summary = session.performanceSummary || calculateSessionSummary(session);
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Top Card: Score & Feedback */}
        <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D7]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mock Interview Completed</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#101010] tracking-tight">
                Interview Performance Report
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] mt-1">
                Target Role: <strong>{session.targetRole}</strong> | Domain:{' '}
                <strong className="capitalize">{session.category.replace('-', ' ')}</strong>
              </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 text-center min-w-[140px] shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
                Qualitative Score
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#101010] mt-1">
                {summary.overallScore}
                <span className="text-sm font-normal text-[#888888]">/100</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1">
                {summary.qualitativeLabel}
              </div>
            </div>
          </div>

          {/* Strengths & Weak Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-[#333333] leading-relaxed">
                {summary.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[#EAE5DC] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span>Recommended Areas to Polish</span>
              </div>
              <ul className="space-y-2 text-xs text-[#333333] leading-relaxed">
                {summary.weakAreas.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/70 border border-[#E8E2D7] rounded-xl text-xs text-[#666666] leading-relaxed">
            <strong>Actionable Recommendations:</strong> {summary.recommendations.join(' ')}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#E8E2D7]">
            <button
              onClick={() => {
                setSession(null);
                setCurrentIndex(0);
              }}
              className="px-5 py-2.5 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-xl hover:bg-[#262626] transition-all cursor-pointer shadow-sm"
            >
              Start New Mock Interview
            </button>
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-2.5 bg-white border border-[#E5E0D8] text-[#101010] text-xs font-semibold rounded-xl hover:bg-[#F5F2EB] transition-all cursor-pointer"
              >
                Return to Interview Overview
              </button>
            )}
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#101010]">Question-by-Question Review</h3>
          <div className="space-y-4">
            {session.questions.map((q, idx) => {
              const ans = session.answers[q.id];
              return (
                <div
                  key={q.id}
                  className="bg-white border border-[#E5E0D8] rounded-xl p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#888888]">Q{idx + 1}</span>
                      <span className="text-xs font-semibold text-[#101010]">{q.topic}</span>
                    </div>
                    {ans ? (
                      <span className="px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-full text-xs font-bold text-[#101010]">
                        Score: {ans.score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-[#888888]">Unanswered</span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-[#101010]">{q.question}</p>

                  {ans && (
                    <div className="mt-3 pt-3 border-t border-[#F0ECE1] space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-[#666666]">Your Answer: </span>
                        <span className="text-[#101010] italic">"{ans.studentAnswer}"</span>
                      </div>
                      <div className="bg-[#FAF9F5] p-3 rounded-lg space-y-1">
                        <div className="font-semibold text-emerald-800">
                          Strengths: {ans.whatWasDoneWell.join(' ')}
                        </div>
                        <div className="font-semibold text-amber-800">
                          Next improvement: {ans.improvementSuggestions.join(' ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Interview Question Flow
  const currentQuestion: InterviewQuestion | undefined = session.questions[currentIndex];
  const currentEvaluation: EvaluatedAnswer | undefined = currentQuestion
    ? session.answers[currentQuestion.id]
    : undefined;
  const isLastQuestion = currentIndex === session.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Session Progress Bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <span className="text-xs px-2.5 py-0.5 bg-[#FAF9F5] border border-[#E8E2D7] rounded-full text-[#101010] font-medium capitalize">
            {session.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfirmingExit(true)}
            className="text-xs text-[#666666] hover:text-red-600 font-medium px-2 py-1 rounded transition-colors cursor-pointer"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 px-1">
        {session.questions.map((q, idx) => {
          const isAnswered = Boolean(session.answers[q.id]);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#101010]'
                  : isAnswered
                  ? 'bg-emerald-600'
                  : 'bg-[#E5E0D8]'
              }`}
              title={`Question ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                  {currentQuestion.topic}
                </span>
                {currentQuestion.isResumeDerived && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#F0ECE1] text-[#101010] rounded-full">
                    From Resume
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#101010] leading-snug">
                {currentQuestion.question}
              </h3>
            </div>
          </div>

          {/* Why interviewers ask this */}
          <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs text-[#666666] leading-relaxed">
            <strong className="text-[#101010]">Why interviewers ask this: </strong>
            {currentQuestion.whyAsked}
          </div>

          {/* Expandable Hint */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex items-center gap-1.5 text-xs text-[#666666] hover:text-[#101010] font-medium cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide hint' : 'Need a hint?'}</span>
                {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showHint && (
                <div className="mt-2 p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed">
                  {currentQuestion.hints.join(' ')}
                </div>
              )}
            </div>
          )}

          {/* Student Answer Box */}
          <div className="space-y-3 pt-3 border-t border-[#F0ECE1]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Your Response
              </span>

              <div className="flex items-center gap-2">
                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                        : 'bg-white text-[#101010] border-[#E5E0D8] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <StopCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Listening (Stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-[#101010]" />
                        <span>Voice Answer</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAnswerMode('text')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    answerMode === 'text' && !isListening
                      ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                      : 'bg-white text-[#666666] border-[#E5E0D8] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
              </div>
            </div>

            {/* Voice status or fallback banner */}
            {speechError && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                {speechError}
              </div>
            )}

            {isListening && (
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Recording in progress. Speak clearly...</span>
              </div>
            )}

            <textarea
              rows={5}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your response here or click 'Voice Answer' to speak. Explain concepts step-by-step, including trade-offs and practical examples..."
              className="w-full p-4 bg-white border border-[#E5E0D8] rounded-xl text-sm text-[#101010] focus:outline-none focus:border-[#101010] leading-relaxed resize-y"
            />

            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span>{textAnswer.split(/\s+/).filter(Boolean).length} words</span>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isEvaluating || !textAnswer.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evaluation Results Card (shows after submission) */}
          {currentEvaluation && (
            <div className="mt-6 p-5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#101010]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                    AI Qualitative Evaluation
                  </span>
                </div>
                <span className="px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-bold text-[#101010]">
                  Score: {currentEvaluation.score}/100
                </span>
              </div>

              {/* Strengths & Missing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                  <div className="font-bold text-emerald-800">What went well:</div>
                  <ul className="space-y-1 text-[#333333]">
                    {currentEvaluation.whatWasDoneWell.map((w, idx) => (
                      <li key={idx}>• {w}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white border border-[#E8E2D7] rounded-lg space-y-1">
                  <div className="font-bold text-amber-800">What was missing:</div>
                  <ul className="space-y-1 text-[#333333]">
                    {currentEvaluation.whatWasMissing.map((m, idx) => (
                      <li key={idx}>• {m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div className="text-xs text-[#444444] space-y-1">
                <strong className="text-[#101010]">Improvement Suggestion: </strong>
                {currentEvaluation.improvementSuggestions.join(' ')}
              </div>

              {/* Stronger Model Answer */}
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
                    {currentEvaluation.exampleStrongerAnswer}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-all disabled:opacity-40 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            onClick={handleFinishInterview}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finish & View Performance Report</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, session.questions.length - 1))}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* End Interview Confirmation Modal */}
      {isConfirmingExit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-[#101010]">End Mock Interview?</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Are you sure you want to exit? Your answered questions will be saved, and you can view your partial performance report.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingExit(false)}
                className="px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Continue Mock
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingExit(false);
                  handleFinishInterview();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                End & View Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
