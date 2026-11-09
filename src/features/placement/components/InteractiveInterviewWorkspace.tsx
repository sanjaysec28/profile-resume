/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.3: Interactive Interview Preparation, Project Defense & Analytics
 * Supports 6 interview types, 6-dimension evaluation rubric, Web Speech dictation with typing fallback,
 * dedicated Project Defense drills, genuine session analytics, and student approval safeguards.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  FolderGit2,
  Award,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  CheckSquare,
} from 'lucide-react';
import {
  InterviewQuestion,
  InterviewSession,
  EvaluatedAnswer,
  AnswerRubricScore,
  QuestionDifficulty,
} from '../../../types/interviewIntelligence.ts';
import {
  D63InterviewType,
  D63InterviewDifficulty,
  ProjectDefenseQuestion,
} from '../../../types/careerReadiness.ts';
import { PlacementStudentContext } from '../../../types/placementIntelligence.ts';
import { ResumeData } from '../../../types/resume.ts';
import {
  saveInterviewSession,
  loadInterviewSessions,
  requestInterviewQuestions,
  requestAnswerEvaluation,
} from '../../../lib/interviewIntelligenceService.ts';
import { generateProjectDefenseQuestions } from '../../../lib/careerReadinessEngine.ts';

interface InteractiveInterviewWorkspaceProps {
  userId?: string;
  studentContext: PlacementStudentContext;
  resumeData?: ResumeData | null;
  initialInterviewType?: D63InterviewType;
  initialProjectTitle?: string;
  onNavigateToReadiness?: () => void;
}

export const InteractiveInterviewWorkspace: React.FC<InteractiveInterviewWorkspaceProps> = ({
  userId,
  studentContext,
  resumeData,
  initialInterviewType,
  initialProjectTitle,
  onNavigateToReadiness,
}) => {
  // Navigation tabs within Interview Intelligence
  const [activeTab, setActiveTab] = useState<'simulator' | 'project_defense' | 'analytics'>(
    initialInterviewType === 'project_defense' ? 'project_defense' : 'simulator'
  );

  // Configuration state
  const [selectedRole, setSelectedRole] = useState<string>(
    studentContext.targetRole || 'Full Stack Engineer'
  );
  const [selectedType, setSelectedType] = useState<D63InterviewType>(
    initialInterviewType || 'technical'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty>('medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(3);

  // Active Session State
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [studentAnswerText, setStudentAnswerText] = useState<string>('');
  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluatedAnswer | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [savedTakeaways, setSavedTakeaways] = useState<Record<string, boolean>>({});

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Project Defense state
  const projectsList = useMemo(() => {
    return studentContext.projects || [];
  }, [studentContext]);
  const [selectedDefenseProjectIndex, setSelectedDefenseProjectIndex] = useState<number>(0);
  const [defenseQuestions, setDefenseQuestions] = useState<ProjectDefenseQuestion[]>([]);
  const [currentDefenseIndex, setCurrentDefenseIndex] = useState<number>(0);

  // Past Sessions & Genuine Analytics
  const [completedSessions, setCompletedSessions] = useState<InterviewSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  // Speech Recognition Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setStudentAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setAnswerMode('voice');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Load completed sessions
  useEffect(() => {
    let isMounted = true;
    async function fetchSessions() {
      setIsLoadingHistory(true);
      try {
        const sessions = await loadInterviewSessions(userId);
        if (isMounted) setCompletedSessions(sessions.filter((s) => s.status === 'completed'));
      } catch (err) {
        console.warn('Failed to load past interview sessions:', err);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    }
    fetchSessions();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Start standard mock interview
  const handleStartMockInterview = async () => {
    setIsGeneratingQuestions(true);
    setCurrentEvaluation(null);
    setStudentAnswerText('');
    setShowHint(false);

    try {
      // Map D63InterviewType to InterviewCategory
      const categoryMap: Record<D63InterviewType, any> = {
        technical: 'technical-fundamentals',
        behavioral: 'hr-behavioral',
        project_defense: 'projects-experience',
        resume_based: 'resume-focused',
        role_specific: 'frameworks-technologies',
        dsa_problem_solving: 'dsa',
      };

      const questions = await requestInterviewQuestions({
        targetRole: selectedRole,
        category: categoryMap[selectedType] || 'technical-fundamentals',
        difficulty: selectedDifficulty,
        count: selectedQuestionCount,
        verifiedSkills: studentContext.technicalSkills,
        missingSkills: [],
        academicYear: studentContext.academicYear,
        degree: studentContext.degree,
        projectsSummary: studentContext.projects.map((p) => ({
          title: p.title,
          techStack: p.techStack,
          description: p.description,
        })),
      });

      const newSession: InterviewSession = {
        id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        targetRole: selectedRole,
        category: categoryMap[selectedType],
        difficulty: selectedDifficulty,
        questionCount: questions.length,
        questions,
        answers: {},
        currentQuestionIndex: 0,
        status: 'in-progress',
        startedAt: new Date().toISOString(),
      };

      setCurrentSession(newSession);
      setCurrentQuestionIndex(0);
      await saveInterviewSession(userId, newSession);
    } catch (err) {
      console.error('Failed to generate interview questions:', err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Submit and evaluate answer
  const handleSubmitAnswer = async () => {
    if (!currentSession || !studentAnswerText.trim() || isEvaluating) return;
    const currentQ = currentSession.questions[currentQuestionIndex];
    if (!currentQ) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsEvaluating(true);
    try {
      const evaluation = await requestAnswerEvaluation(
        currentQ,
        studentAnswerText.trim(),
        answerMode,
        selectedRole
      );

      const updatedAnswers = {
        ...currentSession.answers,
        [currentQ.id]: evaluation,
      };

      const isLastQuestion = currentQuestionIndex >= currentSession.questions.length - 1;
      let performanceSummary = currentSession.performanceSummary;

      if (isLastQuestion) {
        const allEvals = Object.values(updatedAnswers);
        const avgScore = Math.round(
          allEvals.reduce((sum, e) => sum + e.score, 0) / Math.max(allEvals.length, 1)
        );
        const allStrengths = Array.from(new Set(allEvals.flatMap((e) => e.whatWasDoneWell))).slice(0, 4);
        const allWeakAreas = Array.from(new Set(allEvals.flatMap((e) => e.whatWasMissing))).slice(0, 4);
        const allRecs = Array.from(new Set(allEvals.flatMap((e) => e.improvementSuggestions))).slice(0, 4);

        performanceSummary = {
          overallScore: avgScore,
          qualitativeLabel:
            avgScore >= 85 ? 'Interview Ready' : avgScore >= 70 ? 'Solid Preparation' : avgScore >= 50 ? 'Developing' : 'Needs Practice',
          strengths: allStrengths,
          weakAreas: allWeakAreas,
          recommendations: allRecs,
          qualitativeFeedback: `Session completed for ${selectedRole}. Maintained consistent engagement across ${allEvals.length} evaluated questions.`,
        };
      }

      const updatedSession: InterviewSession = {
        ...currentSession,
        answers: updatedAnswers,
        status: isLastQuestion ? 'completed' : 'in-progress',
        completedAt: isLastQuestion ? new Date().toISOString() : undefined,
        performanceSummary,
      };

      setCurrentSession(updatedSession);
      setCurrentEvaluation(evaluation);
      await saveInterviewSession(userId, updatedSession);

      if (isLastQuestion) {
        setCompletedSessions((prev) => [updatedSession, ...prev.filter((s) => s.id !== updatedSession.id)]);
      }
    } catch (err) {
      console.error('Failed to evaluate interview answer:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Next question
  const handleNextQuestion = () => {
    if (!currentSession) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < currentSession.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setCurrentEvaluation(null);
      setStudentAnswerText('');
      setShowHint(false);
    }
  };

  // Reset / new session
  const handleResetSession = () => {
    setCurrentSession(null);
    setCurrentEvaluation(null);
    setStudentAnswerText('');
    setCurrentQuestionIndex(0);
    setShowHint(false);
  };

  // Initialize Project Defense Drill
  const handleStartProjectDefense = () => {
    const proj = projectsList[selectedDefenseProjectIndex];
    if (!proj) return;
    const questions = generateProjectDefenseQuestions(proj.title, proj.techStack, proj.description);
    setDefenseQuestions(questions);
    setCurrentDefenseIndex(0);
    setCurrentEvaluation(null);
    setStudentAnswerText('');
    setShowHint(false);
  };

  // Analytics Calculations (Genuine - zero fake data)
  const analyticsSummary = useMemo(() => {
    const total = completedSessions.length;
    if (total === 0) return null;

    const scores = completedSessions
      .map((s) => s.performanceSummary?.overallScore)
      .filter((sc): sc is number => typeof sc === 'number');

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const typeCounts: Record<string, number> = {};
    completedSessions.forEach((s) => {
      const cat = s.category || 'other';
      typeCounts[cat] = (typeCounts[cat] || 0) + 1;
    });

    const recurringStrengths = Array.from(
      new Set(completedSessions.flatMap((s) => s.performanceSummary?.strengths || []))
    ).slice(0, 5);

    const recurringGaps = Array.from(
      new Set(completedSessions.flatMap((s) => s.performanceSummary?.weakAreas || []))
    ).slice(0, 5);

    return {
      totalSessions: total,
      averageScore: avgScore,
      typeCounts,
      recurringStrengths,
      recurringGaps,
      recentSessions: completedSessions.slice(0, 5),
    };
  }, [completedSessions]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Sub-Tabs Navigation */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#101010]" />
              <span>Interview Intelligence Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101010]">
              Interview Preparation & Project Defense
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              Interactive technical, behavioral, and project defense simulation with multi-dimensional rubric feedback.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('simulator');
                handleResetSession();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                  : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
              }`}
            >
              Mock Interview Simulator
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('project_defense');
                handleStartProjectDefense();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'project_defense'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                  : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
              }`}
            >
              Project Defense Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                  : 'bg-white border border-[#E5E0D8] text-[#666666] hover:text-[#101010]'
              }`}
            >
              Analytics & History ({completedSessions.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MOCK INTERVIEW SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {!currentSession ? (
            /* CONFIGURATION PANEL */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-bold text-[#101010]">Configure Your Mock Interview</h3>
              <p className="text-xs text-[#666666]">
                Questions are synthesized strictly from your target role, verified skills, and documented projects.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1.5">Target Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-sm text-[#101010] font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="Frontend Engineer">Frontend Engineer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="AI / Machine Learning Engineer">AI / Machine Learning Engineer</option>
                    <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101010] mb-1.5">Interview Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: 'technical', label: 'Technical Core', desc: 'Algorithms & Architecture' },
                        { id: 'behavioral', label: 'Behavioral HR', desc: 'STAR Methodology' },
                        { id: 'project_defense', label: 'Project Defense', desc: 'Trade-offs & Tech Stack' },
                        { id: 'resume_based', label: 'Resume-Based', desc: 'Bullets & Experience' },
                        { id: 'role_specific', label: 'Role-Specific', desc: 'Frameworks & Systems' },
                        { id: 'dsa_problem_solving', label: 'DSA & Coding', desc: 'Data Structures' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedType === t.id
                            ? 'bg-[#101010] text-[#F8F5EE] border-[#101010] shadow-xs'
                            : 'bg-[#FAF9F5] border-[#E5E0D8] text-[#101010] hover:bg-white'
                        }`}
                      >
                        <p className="text-xs font-bold">{t.label}</p>
                        <p className={`text-[10px] mt-1 ${selectedType === t.id ? 'text-[#CCCCCC]' : 'text-[#888888]'}`}>
                          {t.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101010] mb-1.5">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value as QuestionDifficulty)}
                      className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-sm text-[#101010] font-medium focus:outline-hidden cursor-pointer"
                    >
                      <option value="easy">Entry / Internship Level</option>
                      <option value="medium">Campus Placement Standard</option>
                      <option value="hard">Advanced Junior Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101010] mb-1.5">Questions</label>
                    <select
                      value={selectedQuestionCount}
                      onChange={(e) => setSelectedQuestionCount(Number(e.target.value))}
                      className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-sm text-[#101010] font-medium focus:outline-hidden cursor-pointer"
                    >
                      <option value={3}>3 Questions (Quick Drill)</option>
                      <option value={5}>5 Questions (Standard Mock)</option>
                      <option value={10}>10 Questions (Comprehensive)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingQuestions}
                onClick={handleStartMockInterview}
                className="w-full py-3 bg-[#101010] text-[#F8F5EE] rounded-xl text-sm font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGeneratingQuestions ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Interview Questions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate & Begin Interview</span>
                  </>
                )}
              </button>
            </div>
          ) : currentSession.status === 'completed' ? (
            /* FINAL PERFORMANCE SUMMARY */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Award className="w-7 h-7 text-[#101010]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#101010]">Mock Interview Performance Summary</h3>
                <p className="text-xs sm:text-sm text-[#666666]">
                  Role: {currentSession.targetRole} • {currentSession.questions.length} Questions Evaluated
                </p>
                <div className="inline-block mt-3 px-4 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-lg font-extrabold">
                  {currentSession.performanceSummary?.overallScore}% Overall Score
                </div>
                <p className="text-xs text-[#888888] font-medium mt-1">
                  Qualitative Status: {currentSession.performanceSummary?.qualitativeLabel}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E0D8]">
                <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4">
                  <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                    <span>Observed Strengths</span>
                  </span>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#666666]">
                    {currentSession.performanceSummary?.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#101010]">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4">
                  <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                    <span>Growth Areas</span>
                  </span>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#666666]">
                    {currentSession.performanceSummary?.weakAreas.map((gap, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#101010]">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Advisory Disclaimer */}
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs text-[#666666] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#888888] shrink-0 mt-0.5" />
                <span>
                  <strong>Advisory Evaluation:</strong> This performance summary is an automated qualitative assessment to guide practice and does not represent an actual hiring decision.
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="px-5 py-2.5 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-xs font-semibold hover:bg-[#F5F2EB] transition-all cursor-pointer"
                >
                  Start Another Session
                </button>
                <button
                  type="button"
                  onClick={onNavigateToReadiness}
                  className="px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
                >
                  Back to Career Readiness
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUESTION VIEW */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
              {/* Question Header & Progress */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-[#101010] text-[#F8F5EE] text-xs font-bold rounded-lg">
                    Question {currentQuestionIndex + 1} of {currentSession.questions.length}
                  </span>
                  <span className="text-xs text-[#888888] font-medium capitalize">
                    {currentSession.questions[currentQuestionIndex]?.category.replace('-', ' ')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetSession}
                  className="text-xs text-[#888888] hover:text-[#101010] transition-colors cursor-pointer"
                >
                  Exit Session
                </button>
              </div>

              {/* The Question Card */}
              <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-5 space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-[#101010] leading-snug">
                  {currentSession.questions[currentQuestionIndex]?.question}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666]">
                  <span>
                    <strong className="text-[#101010]">Why Asked:</strong> {currentSession.questions[currentQuestionIndex]?.whyAsked}
                  </span>
                </div>

                {/* Optional Hint Toggle */}
                {currentSession.questions[currentQuestionIndex]?.hints && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs font-medium text-[#101010] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#888888]" />
                      <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                    {showHint && (
                      <p className="text-xs text-[#666666] mt-1 pl-4 border-l-2 border-[#101010] italic">
                        {currentSession.questions[currentQuestionIndex]?.hints?.[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Student Answer Input Box */}
              {!currentEvaluation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#101010]">Your Answer</label>
                    <div className="flex items-center gap-3 text-xs text-[#888888]">
                      <span>{studentAnswerText.split(/\s+/).filter(Boolean).length} words</span>
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceRecording}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            isListening
                              ? 'bg-[#ef4444] text-white border-[#ef4444] animate-pulse'
                              : 'bg-white border-[#E5E0D8] text-[#101010] hover:bg-[#FAF9F5]'
                          }`}
                        >
                          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span>{isListening ? 'Stop Listening' : 'Dictate Voice'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={studentAnswerText}
                    onChange={(e) => {
                      setStudentAnswerText(e.target.value);
                      if (answerMode !== 'text') setAnswerMode('text');
                    }}
                    placeholder="Type your response here. For behavioral questions, consider using the STAR framework (Situation, Task, Action, Result). For technical questions, explain the mechanism and trade-offs..."
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4 text-sm text-[#101010] focus:outline-hidden leading-relaxed"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={!studentAnswerText.trim() || isEvaluating}
                      onClick={handleSubmitAnswer}
                      className="px-6 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {isEvaluating ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Evaluating Response...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit for Rubric Evaluation</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* EVALUATION RESULT VIEW */
                <div className="space-y-5 animate-fadeIn">
                  {/* Score & Rubric Breakdown Header */}
                  <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#888888] font-medium">Question Score</span>
                        <p className="text-2xl font-black text-[#101010]">{currentEvaluation.score}%</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2.5 py-1 bg-white border border-[#E5E0D8] rounded-full text-[#666666] font-medium">
                          Answer Mode: {currentEvaluation.answerMode}
                        </span>
                      </div>
                    </div>

                    {/* 6-Dimension Rubric Breakdown */}
                    {currentEvaluation.rubric && (
                      <div className="pt-3 border-t border-[#E5E0D8] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Technical</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.technicalCorrectness} / 10</p>
                        </div>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Clarity</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.clarity} / 10</p>
                        </div>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Structure</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.structure} / 10</p>
                        </div>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Approach</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.problemSolvingApproach} / 10</p>
                        </div>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Communication</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.communication} / 10</p>
                        </div>
                        <div className="bg-white border border-[#E5E0D8] rounded-lg p-2 text-center">
                          <span className="text-[10px] text-[#888888]">Relevance</span>
                          <p className="font-bold text-[#101010]">{currentEvaluation.rubric.relevance} / 10</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* What Was Done Well & Missing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
                      <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>Done Well</span>
                      </span>
                      <ul className="space-y-1 text-xs text-[#666666]">
                        {currentEvaluation.whatWasDoneWell.map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-[#101010]">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-[#E5E0D8] rounded-xl p-4">
                      <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
                        <span>Key Points Missing</span>
                      </span>
                      <ul className="space-y-1 text-xs text-[#666666]">
                        {currentEvaluation.whatWasMissing.map((m, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-[#101010]">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggested Improved Answer (Model Response) */}
                  <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#101010]" />
                      <span>Model Answer Reference</span>
                    </span>
                    <p className="text-xs text-[#444444] leading-relaxed italic bg-white p-3 rounded-lg border border-[#E5E0D8]">
                      "{currentEvaluation.exampleStrongerAnswer}"
                    </p>
                  </div>

                  {/* Student Approval Safeguard Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSavedTakeaways((prev) => ({
                          ...prev,
                          [currentSession.questions[currentQuestionIndex].id]: true,
                        }))
                      }
                      disabled={savedTakeaways[currentSession.questions[currentQuestionIndex].id]}
                      className="px-3.5 py-1.5 bg-white border border-[#E5E0D8] text-[#101010] rounded-lg text-xs font-medium hover:bg-[#FAF9F5] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {savedTakeaways[currentSession.questions[currentQuestionIndex].id] ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                          <span>Approved & Saved Takeaway</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-[#888888]" />
                          <span>Approve & Save Key Points</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>
                        {currentQuestionIndex >= currentSession.questions.length - 1
                          ? 'Finish & View Summary'
                          : 'Next Question'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECT DEFENSE MODE */}
      {activeTab === 'project_defense' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
              <div>
                <h3 className="text-lg font-bold text-[#101010]">Project Defense Drill</h3>
                <p className="text-xs text-[#666666] mt-1">
                  Master explaining your own projects: architecture, database choices, debugging, and trade-offs.
                </p>
              </div>

              {projectsList.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="defense-project-select" className="text-xs text-[#888888] font-medium">Project:</label>
                  <select
                    id="defense-project-select"
                    value={selectedDefenseProjectIndex}
                    onChange={(e) => {
                      setSelectedDefenseProjectIndex(Number(e.target.value));
                      const proj = projectsList[Number(e.target.value)];
                      if (proj) {
                        setDefenseQuestions(generateProjectDefenseQuestions(proj.title, proj.techStack, proj.description));
                        setCurrentDefenseIndex(0);
                        setCurrentEvaluation(null);
                        setStudentAnswerText('');
                      }
                    }}
                    className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#101010] focus:outline-hidden cursor-pointer"
                  >
                    {projectsList.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {projectsList.length === 0 ? (
              <div className="text-center py-12">
                <FolderGit2 className="w-12 h-12 text-[#888888] mx-auto mb-3" />
                <h4 className="text-sm font-bold text-[#101010]">No Documented Projects Found</h4>
                <p className="text-xs text-[#666666] mt-1 max-w-sm mx-auto">
                  Add at least one project with a defined tech stack to your profile or resume to activate Project Defense Mode.
                </p>
              </div>
            ) : defenseQuestions.length === 0 ? (
              <div className="text-center py-8">
                <button
                  type="button"
                  onClick={handleStartProjectDefense}
                  className="px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
                >
                  Start Project Defense Questions
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Question progress and card */}
                <div className="flex items-center justify-between text-xs text-[#888888]">
                  <span>
                    Defense Topic {currentDefenseIndex + 1} of {defenseQuestions.length}:{' '}
                    <strong className="text-[#101010]">
                      {defenseQuestions[currentDefenseIndex]?.topicTitle}
                    </strong>
                  </span>
                  <span>Project: {projectsList[selectedDefenseProjectIndex]?.title}</span>
                </div>

                <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-5 space-y-3">
                  <h4 className="text-base font-bold text-[#101010]">
                    {defenseQuestions[currentDefenseIndex]?.question}
                  </h4>
                  <p className="text-xs text-[#666666]">
                    <strong>Why Interviewers Ask:</strong> {defenseQuestions[currentDefenseIndex]?.whyAsked}
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-[#101010]">Evaluation Criteria:</span>
                    <ul className="mt-1 space-y-1 text-xs text-[#666666]">
                      {defenseQuestions[currentDefenseIndex]?.evaluationCriteria.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#101010]">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Input Area */}
                {!currentEvaluation ? (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={studentAnswerText}
                      onChange={(e) => setStudentAnswerText(e.target.value)}
                      placeholder="Explain your architectural and engineering choices clearly..."
                      className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-3.5 text-xs text-[#101010] focus:outline-hidden"
                    />

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#888888]">
                        {studentAnswerText.split(/\s+/).filter(Boolean).length} words
                      </span>
                      <button
                        type="button"
                        disabled={!studentAnswerText.trim() || isEvaluating}
                        onClick={async () => {
                          setIsEvaluating(true);
                          const curQ = defenseQuestions[currentDefenseIndex];
                          try {
                            const res = await requestAnswerEvaluation(
                              {
                                id: curQ.id,
                                question: curQ.question,
                                category: 'projects-experience',
                                difficulty: 'medium',
                                whyAsked: curQ.whyAsked,
                                topic: curQ.topicTitle,
                                evaluationCriteria: curQ.evaluationCriteria,
                              },
                              studentAnswerText.trim(),
                              'text',
                              selectedRole
                            );
                            setCurrentEvaluation(res);
                          } catch (err) {
                            console.error('Failed to evaluate project defense answer:', err);
                          } finally {
                            setIsEvaluating(false);
                          }
                        }}
                        className="px-5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isEvaluating ? 'Evaluating...' : 'Evaluate Defense'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#101010]">Evaluation Score</span>
                        <span className="text-lg font-black text-[#101010]">{currentEvaluation.score}%</span>
                      </div>
                      <p className="text-xs text-[#666666] leading-relaxed">
                        {currentEvaluation.improvementSuggestions[0]}
                      </p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const next = currentDefenseIndex + 1;
                          if (next < defenseQuestions.length) {
                            setCurrentDefenseIndex(next);
                            setCurrentEvaluation(null);
                            setStudentAnswerText('');
                          } else {
                            setActiveTab('analytics');
                          }
                        }}
                        className="px-5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
                      >
                        {currentDefenseIndex < defenseQuestions.length - 1 ? 'Next Defense Topic' : 'Finish Drill'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GENUINE INTERVIEW PROGRESS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {!analyticsSummary ? (
            /* EMPTY GENUINE STATE */
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
              <BarChart3 className="w-10 h-10 text-[#888888] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#101010]">No Completed Interview Sessions Yet</h3>
              <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                Complete at least one mock interview or project defense drill to record genuine question evaluations, strengths, and areas for improvement.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="mt-5 px-5 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
              >
                Start First Mock Interview
              </button>
            </div>
          ) : (
            /* GENUINE ANALYTICS DASHBOARD */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs">
                  <span className="text-xs text-[#888888] font-medium">Total Sessions Completed</span>
                  <p className="text-2xl font-bold text-[#101010] mt-1">{analyticsSummary.totalSessions}</p>
                </div>
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs">
                  <span className="text-xs text-[#888888] font-medium">Average Performance Score</span>
                  <p className="text-2xl font-bold text-[#101010] mt-1">{analyticsSummary.averageScore}%</p>
                </div>
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs">
                  <span className="text-xs text-[#888888] font-medium">Primary Interview Category</span>
                  <p className="text-sm font-bold text-[#101010] mt-2 capitalize">
                    {Object.keys(analyticsSummary.typeCounts)[0]?.replace('-', ' ') || 'Technical'}
                  </p>
                </div>
              </div>

              {/* Progress Over Time (Only when >= 2 sessions) */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs">
                <h3 className="text-sm font-bold text-[#101010] mb-2">Performance History Over Time</h3>
                {completedSessions.length < 2 ? (
                  <div className="p-6 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-center">
                    <p className="text-xs text-[#666666]">
                      Complete at least <strong>2 interview sessions</strong> to unlock genuine chronological trend tracking.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E0D8]">
                    {completedSessions.map((session, idx) => (
                      <div key={session.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#101010]">
                            {session.targetRole} •{' '}
                            <span className="font-normal capitalize">{session.category.replace('-', ' ')}</span>
                          </p>
                          <span className="text-[11px] text-[#888888]">
                            {new Date(session.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-[#101010]">
                            {session.performanceSummary?.overallScore ?? 'N/A'}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
