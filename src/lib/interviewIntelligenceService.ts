/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: Interview Intelligence Service
 * Handles Firestore & LocalStorage persistence, API communication,
 * session management, metrics aggregation, and DSA/HR progress tracking.
 */

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  InterviewSession,
  EvaluatedAnswer,
  InterviewQuestion,
  InterviewDashboardMetrics,
  DsaTopic,
  HrPracticeQuestion,
  InterviewPerformanceSummary,
  QuestionGenerationInput,
  InterviewCoachMessage,
} from '../types/interviewIntelligence.ts';
import { INITIAL_DSA_TOPICS, CORE_HR_QUESTIONS } from './interviewPrepData.ts';

const SESSIONS_LOCAL_STORAGE_PREFIX = 'profile_interview_sessions_';
const DSA_LOCAL_STORAGE_PREFIX = 'profile_dsa_topics_';
const HR_LOCAL_STORAGE_PREFIX = 'profile_hr_questions_';

/**
 * Saves an interview session to Firestore and LocalStorage.
 */
export async function saveInterviewSession(
  userId: string | undefined,
  session: InterviewSession
): Promise<void> {
  const key = `${SESSIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    const existing: InterviewSession[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((s) => s.id !== session.id);
    filtered.unshift(session);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 30)));
  } catch (err) {
    console.warn('[InterviewService] LocalStorage save warning:', err);
  }

  if (userId && db) {
    try {
      const sessionRef = doc(db, 'users', userId, 'interviewSessions', session.id);
      await setDoc(sessionRef, {
        ...session,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[InterviewService] Firestore save error (falling back to LocalStorage):', err);
    }
  }
}

/**
 * Loads all saved interview sessions for a student.
 */
export async function loadInterviewSessions(userId: string | undefined): Promise<InterviewSession[]> {
  const key = `${SESSIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localSessions: InterviewSession[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      localSessions = JSON.parse(raw);
    }
  } catch {}

  if (userId && db) {
    try {
      const colRef = collection(db, 'users', userId, 'interviewSessions');
      const q = query(colRef, orderBy('startedAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firestoreSessions = snap.docs.map((d) => d.data() as InterviewSession);
        // Merge with local fallback
        const sessionMap = new Map<string, InterviewSession>();
        firestoreSessions.forEach((s) => sessionMap.set(s.id, s));
        localSessions.forEach((s) => {
          if (!sessionMap.has(s.id)) sessionMap.set(s.id, s);
        });
        return Array.from(sessionMap.values()).sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
      }
    } catch (err) {
      console.warn('[InterviewService] Firestore load error, using local fallback:', err);
    }
  }

  return localSessions;
}

/**
 * Deletes an interview session by ID.
 */
export async function deleteInterviewSession(
  userId: string | undefined,
  sessionId: string
): Promise<void> {
  const key = `${SESSIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const existing: InterviewSession[] = JSON.parse(raw);
      const filtered = existing.filter((s) => s.id !== sessionId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch {}

  if (userId && db) {
    try {
      const sessionRef = doc(db, 'users', userId, 'interviewSessions', sessionId);
      await deleteDoc(sessionRef);
    } catch (err) {
      console.warn('[InterviewService] Firestore delete error:', err);
    }
  }
}

/**
 * Loads DSA topics with student completion status.
 */
export async function loadDsaTopics(userId: string | undefined): Promise<DsaTopic[]> {
  const key = `${DSA_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'interviewProgress', 'dsa_progress');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().topics) {
        const topics = snap.data().topics as DsaTopic[];
        localStorage.setItem(key, JSON.stringify(topics));
        return topics;
      }
    } catch (err) {
      console.warn('[InterviewService] Firestore DSA progress load warning:', err);
    }
  }

  return INITIAL_DSA_TOPICS;
}

/**
 * Saves DSA topics progress.
 */
export async function saveDsaTopics(
  userId: string | undefined,
  topics: DsaTopic[]
): Promise<void> {
  const key = `${DSA_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(topics));
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'interviewProgress', 'dsa_progress');
      await setDoc(docRef, {
        topics,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[InterviewService] Firestore DSA progress save warning:', err);
    }
  }
}

/**
 * Loads HR practice questions with student saved answers.
 */
export async function loadHrQuestions(userId: string | undefined): Promise<HrPracticeQuestion[]> {
  const key = `${HR_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'interviewProgress', 'hr_progress');
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().questions) {
        const questions = snap.data().questions as HrPracticeQuestion[];
        localStorage.setItem(key, JSON.stringify(questions));
        return questions;
      }
    } catch (err) {
      console.warn('[InterviewService] Firestore HR progress load warning:', err);
    }
  }

  return CORE_HR_QUESTIONS;
}

/**
 * Saves HR practice questions.
 */
export async function saveHrQuestions(
  userId: string | undefined,
  questions: HrPracticeQuestion[]
): Promise<void> {
  const key = `${HR_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(questions));
  } catch {}

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'interviewProgress', 'hr_progress');
      await setDoc(docRef, {
        questions,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[InterviewService] Firestore HR progress save warning:', err);
    }
  }
}

/**
 * Calls server API to generate interview questions.
 */
export async function requestInterviewQuestions(
  input: QuestionGenerationInput
): Promise<InterviewQuestion[]> {
  const response = await fetch('/api/interview/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let msg = 'Failed to generate interview questions.';
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.questions || [];
}

/**
 * Calls server API to evaluate an individual answer.
 */
export async function requestAnswerEvaluation(
  question: InterviewQuestion,
  studentAnswer: string,
  answerMode: 'text' | 'voice',
  targetRole: string
): Promise<EvaluatedAnswer> {
  const response = await fetch('/api/interview/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      studentAnswer,
      answerMode,
      targetRole,
    }),
  });

  if (!response.ok) {
    let msg = 'Failed to evaluate answer.';
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.evaluation;
}

/**
 * Calls server API to chat with the AI Interview Coach.
 */
export async function askInterviewCoach(
  message: string,
  history: InterviewCoachMessage[],
  context: {
    targetRole?: string;
    academicYear?: string;
    degree?: string;
    verifiedSkills?: string[];
    weakTopics?: string[];
    recentMockScore?: number;
    resumeProjects?: string[];
  }
): Promise<string> {
  const response = await fetch('/api/interview/coach-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      context,
    }),
  });

  if (!response.ok) {
    let msg = 'Failed to communicate with Interview Coach.';
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return data.reply;
}

/**
 * Calculates deterministic interview dashboard readiness metrics based on real attempts.
 */
export function computeDashboardMetrics(
  sessions: InterviewSession[],
  dsaTopics: DsaTopic[],
  hrQuestions: HrPracticeQuestion[],
  targetRole: string
): InterviewDashboardMetrics {
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const scores = completedSessions
    .map((s) => s.performanceSummary?.overallScore)
    .filter((score): score is number => typeof score === 'number');

  const averageMockScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Technical readiness from technical mock answers + DSA completion rate
  const completedDsaCount = dsaTopics.filter((t) => t.status === 'completed').length;
  const dsaPercent = Math.round((completedDsaCount / Math.max(dsaTopics.length, 1)) * 100);

  const techSessions = completedSessions.filter((s) => s.category !== 'hr-behavioral');
  const techScores = techSessions
    .map((s) => s.performanceSummary?.overallScore)
    .filter((score): score is number => typeof score === 'number');
  const avgTechScore = techScores.length > 0 ? techScores.reduce((a, b) => a + b, 0) / techScores.length : 0;

  // Weighted technical readiness: 60% mock answers, 40% DSA topic coverage
  const technicalReadinessPercent =
    techScores.length > 0
      ? Math.round(avgTechScore * 0.6 + dsaPercent * 0.4)
      : Math.round(dsaPercent * 0.5);

  // HR readiness: HR questions completed + HR mock interview score
  const answeredHrCount = hrQuestions.filter((q) => q.status === 'completed' || Boolean(q.lastAnswer)).length;
  const hrCoverage = Math.round((answeredHrCount / Math.max(hrQuestions.length, 1)) * 100);
  const hrSessions = completedSessions.filter((s) => s.category === 'hr-behavioral');
  const hrScores = hrSessions
    .map((s) => s.performanceSummary?.overallScore)
    .filter((score): score is number => typeof score === 'number');
  const avgHrScore = hrScores.length > 0 ? hrScores.reduce((a, b) => a + b, 0) / hrScores.length : 0;

  const hrReadinessPercent =
    hrScores.length > 0
      ? Math.round(avgHrScore * 0.6 + hrCoverage * 0.4)
      : Math.round(hrCoverage * 0.7);

  // Communication practice count (voice + HR answers)
  let commCount = answeredHrCount;
  completedSessions.forEach((s) => {
    Object.values(s.answers || {}).forEach((ans) => {
      if (ans.answerMode === 'voice') commCount++;
    });
  });

  // Recommended activities based on student data
  const recommendedActivities = [];

  if (completedDsaCount < 3) {
    recommendedActivities.push({
      id: 'rec_dsa_foundation',
      title: 'Complete Core DSA: Arrays & Two-Pointer Problems',
      category: 'dsa' as const,
      reason: 'Standard screening hurdle for campus technical placement rounds.',
      priority: 'high' as const,
      actionLabel: 'Practice Arrays & Strings',
    });
  }

  if (answeredHrCount < 3) {
    recommendedActivities.push({
      id: 'rec_hr_story',
      title: 'Rehearse "Tell Me About Yourself" & STAR Pitch',
      category: 'hr' as const,
      reason: 'First impression question asked in 95% of campus interviews.',
      priority: 'high' as const,
      actionLabel: 'Rehearse HR Questions',
    });
  }

  if (completedSessions.length === 0) {
    recommendedActivities.push({
      id: 'rec_mock_first',
      title: `Take a 5-Question Diagnostic Mock for ${targetRole}`,
      category: 'technical-fundamentals' as const,
      reason: 'Establish a realistic baseline of conceptual and explanation clarity.',
      priority: 'high' as const,
      actionLabel: 'Start First Mock',
    });
  } else {
    recommendedActivities.push({
      id: 'rec_mock_resume',
      title: 'Run a Resume-Focused Project Defense Drill',
      category: 'resume-focused' as const,
      reason: 'Interviewers scrutinize project choices, trade-offs, and architecture.',
      priority: 'medium' as const,
      actionLabel: 'Practice Resume Questions',
    });
  }

  return {
    targetRole,
    totalSessionsCompleted: completedSessions.length,
    averageMockScore,
    technicalReadinessPercent: Math.min(Math.max(technicalReadinessPercent, 0), 100),
    hrReadinessPercent: Math.min(Math.max(hrReadinessPercent, 0), 100),
    communicationPracticeCount: commCount,
    dsaTopicsCompletedCount: completedDsaCount,
    dsaTotalTopics: dsaTopics.length,
    recentSessions: completedSessions.slice(0, 5),
    recommendedActivities,
  };
}

/**
 * Computes an overall qualitative performance summary for a completed session.
 */
export function calculateSessionSummary(session: InterviewSession): InterviewPerformanceSummary {
  const evaluatedAnswers = Object.values(session.answers || {});
  if (evaluatedAnswers.length === 0) {
    return {
      overallScore: 0,
      qualitativeLabel: 'Needs Practice',
      strengths: ['Started mock interview attempt.'],
      weakAreas: ['No answers were evaluated.'],
      recommendations: ['Attempt to answer every question to receive feedback.'],
      qualitativeFeedback: 'Interview finished without submitted answers.',
    };
  }

  const scores = evaluatedAnswers.map((a) => a.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let qualitativeLabel: 'Needs Practice' | 'Developing' | 'Solid Preparation' | 'Interview Ready' = 'Needs Practice';
  if (avg >= 85) qualitativeLabel = 'Interview Ready';
  else if (avg >= 70) qualitativeLabel = 'Solid Preparation';
  else if (avg >= 50) qualitativeLabel = 'Developing';

  const strengthsSet = new Set<string>();
  const weakSet = new Set<string>();
  const recSet = new Set<string>();

  evaluatedAnswers.forEach((a) => {
    (a.whatWasDoneWell || []).slice(0, 2).forEach((s) => strengthsSet.add(s));
    (a.whatWasMissing || []).slice(0, 2).forEach((w) => weakSet.add(w));
    (a.improvementSuggestions || []).slice(0, 2).forEach((r) => recSet.add(r));
  });

  return {
    overallScore: avg,
    qualitativeLabel,
    strengths: Array.from(strengthsSet).slice(0, 4),
    weakAreas: Array.from(weakSet).slice(0, 4),
    recommendations: Array.from(recSet).slice(0, 4),
    qualitativeFeedback: `Overall average response score was ${avg}/100 (${qualitativeLabel}). Based on ${evaluatedAnswers.length} questions attempted.`,
  };
}
