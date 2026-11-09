/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.2: Student Personalization & Context Intelligence Service
 * Aggregates unified student intelligence from existing records, manages persistent career goals,
 * detects incremental progress events, identifies profile contradictions, and produces tailored recommendations.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.ts';
import { cleanFirestoreData } from './placementIntelligenceService.ts';
import {
  StudentCareerGoals,
  DEFAULT_CAREER_GOALS,
  StudentIntelligenceProfile,
  ProgressEvent,
  PersonalizedRecommendation,
} from '../types/personalization.ts';
import { StudentProfile } from '../types/profile.ts';
import { ResumeData } from '../types/resume.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';
import { ApplicationRecord } from '../types/placementIntelligence.ts';
import { InterviewSession } from '../types/interviewIntelligence.ts';
import { CareerRoadmap } from '../types/careerReadiness.ts';

const GOALS_LOCAL_STORAGE_PREFIX = 'profile_student_goals_';
const EVENTS_LOCAL_STORAGE_PREFIX = 'profile_student_progress_events_';

/**
 * 1. PERSISTENT GOALS CRUD
 * Loads persistent student career goals from Firestore or local storage.
 */
export async function loadStudentCareerGoals(
  userId: string | undefined,
  fallbackContext?: { targetRole?: string; location?: string }
): Promise<StudentCareerGoals> {
  const key = `${GOALS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localGoals: StudentCareerGoals | null = null;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      localGoals = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Personalization] LocalStorage load error:', err);
  }

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'personalization', 'goals');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remote = snap.data() as StudentCareerGoals;
        // Keep local storage fresh
        try {
          localStorage.setItem(key, JSON.stringify(remote));
        } catch {}
        return remote;
      }
    } catch (err) {
      console.warn('[Personalization] Firestore load error, using local fallback:', err);
    }
  }

  if (localGoals && localGoals.primaryCareerGoal) {
    return localGoals;
  }

  // Generate sensible defaults using student context if provided
  const initial: StudentCareerGoals = {
    ...DEFAULT_CAREER_GOALS,
    targetRole: fallbackContext?.targetRole || DEFAULT_CAREER_GOALS.targetRole,
    preferredLocations: fallbackContext?.location
      ? [fallbackContext.location, 'Remote']
      : DEFAULT_CAREER_GOALS.preferredLocations,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {}

  return initial;
}

/**
 * Saves student career goals to Firestore and LocalStorage.
 */
export async function saveStudentCareerGoals(
  userId: string | undefined,
  goals: StudentCareerGoals
): Promise<void> {
  const updatedGoals: StudentCareerGoals = {
    ...goals,
    updatedAt: new Date().toISOString(),
  };

  const key = `${GOALS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(updatedGoals));
  } catch (err) {
    console.warn('[Personalization] LocalStorage save error:', err);
  }

  if (userId && db) {
    try {
      const cleaned = cleanFirestoreData(updatedGoals);
      const docRef = doc(db, 'users', userId, 'personalization', 'goals');
      await setDoc(docRef, cleaned, { merge: true });
    } catch (err) {
      console.warn('[Personalization] Firestore save error (offline mode):', err);
    }
  }
}

/**
 * 2. PROGRESS EVENTS MANAGEMENT
 * Loads recorded progress events for the student.
 */
export function loadRecordedProgressEvents(userId: string | undefined): ProgressEvent[] {
  const key = `${EVENTS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Saves progress events safely.
 */
export function saveRecordedProgressEvents(
  userId: string | undefined,
  events: ProgressEvent[]
): void {
  const key = `${EVENTS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(events.slice(-50)));
  } catch {}
}

/**
 * 3. PROGRESS CHANGE DETECTION
 * Detects incremental additions without creating duplicates.
 */
export function detectProgressChanges(
  existingEvents: ProgressEvent[],
  snapshot: {
    projects?: { title: string }[];
    skills?: string[];
    completedMilestoneTitles?: string[];
    completedInterviewsCount?: number;
    applicationStages?: { id: string; company: string; stage: string }[];
    latestAtsScore?: number;
  }
): ProgressEvent[] {
  const eventIds = new Set(existingEvents.map((e) => e.id));
  const newEvents: ProgressEvent[] = [];

  // Project events
  if (snapshot.projects) {
    for (const proj of snapshot.projects) {
      const id = `pe_proj_${proj.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      if (!eventIds.has(id)) {
        newEvents.push({
          id,
          type: 'project_added',
          title: `Project Documented: ${proj.title}`,
          description: `Documented full technical architecture and metrics for ${proj.title}.`,
          timestamp: new Date().toISOString(),
          metadata: { projectTitle: proj.title },
        });
        eventIds.add(id);
      }
    }
  }

  // Milestone events
  if (snapshot.completedMilestoneTitles) {
    for (const title of snapshot.completedMilestoneTitles) {
      const id = `pe_ms_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      if (!eventIds.has(id)) {
        newEvents.push({
          id,
          type: 'milestone_completed',
          title: `Roadmap Milestone Achieved: ${title}`,
          description: `Successfully completed curriculum milestone "${title}".`,
          timestamp: new Date().toISOString(),
          metadata: { milestoneTitle: title },
        });
        eventIds.add(id);
      }
    }
  }

  // Application stage events
  if (snapshot.applicationStages) {
    for (const app of snapshot.applicationStages) {
      if (app.stage === 'interview' || app.stage === 'offer') {
        const id = `pe_app_${app.id}_${app.stage}`;
        if (!eventIds.has(id)) {
          newEvents.push({
            id,
            type: 'application_stage_changed',
            title: `Application Milestone: ${app.company} (${app.stage.toUpperCase()})`,
            description: `Application with ${app.company} progressed to ${app.stage} stage.`,
            timestamp: new Date().toISOString(),
            metadata: { applicationId: app.id, company: app.company, stage: app.stage },
          });
          eventIds.add(id);
        }
      }
    }
  }

  // Mock interview events
  if (snapshot.completedInterviewsCount && snapshot.completedInterviewsCount > 0) {
    const id = `pe_mock_${snapshot.completedInterviewsCount}`;
    if (!eventIds.has(id)) {
      newEvents.push({
        id,
        type: 'mock_interview_completed',
        title: `Mock Interview ${snapshot.completedInterviewsCount} Completed`,
        description: `Conducted full placement rehearsal with rubric evaluations.`,
        timestamp: new Date().toISOString(),
        metadata: { sessionCount: snapshot.completedInterviewsCount },
      });
      eventIds.add(id);
    }
  }

  return [...newEvents, ...existingEvents].slice(0, 50);
}

/**
 * 4. CONTRADICTION & GAP DETECTOR
 * Analyzes whether student target roles conflict with verified capabilities or academic timeline.
 */
export function detectProfileContradictions(data: {
  targetRole: string;
  degree?: string;
  graduationYear?: string;
  academicYear?: string;
  technicalSkills?: string[];
  projects?: { title: string; techStack: string[] }[];
  gpa?: string;
}): string[] {
  const issues: string[] = [];
  const roleLower = (data.targetRole || '').toLowerCase();
  const skills = (data.technicalSkills || []).map((s) => s.toLowerCase());
  const skillText = skills.join(' ');

  // 1. Role vs Core Technology Gaps
  if (roleLower.includes('frontend') || roleLower.includes('web')) {
    const hasCore = skills.some((s) => s.includes('react') || s.includes('vue') || s.includes('javascript') || s.includes('typescript') || s.includes('html'));
    if (!hasCore && skills.length > 0) {
      issues.push(`Target role is "${data.targetRole}", but no core web technologies (React, TypeScript, JavaScript) are verified in your skills list.`);
    }
  }

  if (roleLower.includes('backend') || roleLower.includes('cloud')) {
    const hasBackend = skills.some((s) => s.includes('node') || s.includes('express') || s.includes('python') || s.includes('java') || s.includes('go') || s.includes('sql') || s.includes('postgres'));
    if (!hasBackend && skills.length > 0) {
      issues.push(`Target role is "${data.targetRole}", but no server-side or database technologies (Node.js, Python, PostgreSQL, Java) are listed.`);
    }
  }

  if (roleLower.includes('devops') || roleLower.includes('sre') || roleLower.includes('infrastructure')) {
    const hasDevOps = skills.some((s) => s.includes('docker') || s.includes('kubernetes') || s.includes('ci/cd') || s.includes('linux') || s.includes('aws'));
    if (!hasDevOps && skills.length > 0) {
      issues.push(`Target role is "${data.targetRole}", but infrastructure tools (Docker, Linux, CI/CD, Cloud) are currently missing from verified skills.`);
    }
  }

  if (roleLower.includes('machine learning') || roleLower.includes('data science') || roleLower.includes('ai engineer')) {
    const hasData = skills.some((s) => s.includes('python') || s.includes('pytorch') || s.includes('tensorflow') || s.includes('pandas') || s.includes('sql'));
    if (!hasData && skills.length > 0) {
      issues.push(`Target role is "${data.targetRole}", but essential data engineering tools (Python, PyTorch, SQL) are not verified.`);
    }
  }

  // 2. Academic Timeline Check
  if (data.academicYear && data.graduationYear) {
    const currentYear = new Date().getFullYear();
    const gradYearNum = parseInt(data.graduationYear, 10);
    if (!isNaN(gradYearNum)) {
      if (gradYearNum < currentYear && (data.academicYear.includes('1st') || data.academicYear.includes('2nd') || data.academicYear.includes('3rd') || data.academicYear.includes('4th'))) {
        issues.push(`Academic Year is set to "${data.academicYear}", but Graduation Year is in the past (${data.graduationYear}). Please verify graduation date.`);
      }
    }
  }

  // 3. Project Tech Stack Alignment
  if (data.projects && data.projects.length > 0) {
    for (const p of data.projects) {
      const unlisted = (p.techStack || []).filter((tech) => {
        const t = tech.toLowerCase();
        return !skills.some((s) => s.includes(t) || t.includes(s));
      });
      if (unlisted.length > 2) {
        issues.push(`Project "${p.title}" relies on technologies (${unlisted.slice(0, 2).join(', ')}) that are not in your top verified skills.`);
        break;
      }
    }
  }

  // 4. Missing GPA when required
  if (!data.gpa || data.gpa.trim() === '') {
    issues.push('CGPA / Percentage is not provided. Many campus placements require confirmed CGPA cutoffs (e.g. >= 7.0 or >= 60%).');
  }

  return issues;
}

/**
 * 5. UNIFIED STUDENT INTELLIGENCE BUILDER
 * Consolidates all existing records into a unified context layer without duplicating data.
 */
export function buildUnifiedStudentIntelligence(params: {
  profile?: StudentProfile | null;
  resumeData?: ResumeData | null;
  setupData?: ResumeSetupData | null;
  applications?: ApplicationRecord[];
  interviewSessions?: InterviewSession[];
  roadmap?: CareerRoadmap | null;
  latestAtsScore?: number;
  latestAtsMissingKeywords?: string[];
  goals?: StudentCareerGoals;
  existingEvents?: ProgressEvent[];
}): StudentIntelligenceProfile {
  const {
    profile,
    resumeData,
    setupData,
    applications = [],
    interviewSessions = [],
    roadmap,
    latestAtsScore,
    latestAtsMissingKeywords = [],
    goals = DEFAULT_CAREER_GOALS,
    existingEvents = [],
  } = params || {};

  // Academic extraction
  const academic = {
    degree:
      setupData?.profileContext?.degree ||
      (profile as any)?.degree ||
      resumeData?.education?.[0]?.degree ||
      '',
    major:
      setupData?.profileContext?.major ||
      profile?.major ||
      resumeData?.education?.[0]?.fieldOfStudy ||
      '',
    graduationYear:
      setupData?.profileContext?.graduationYear ||
      profile?.graduationYear ||
      resumeData?.education?.[0]?.endDate ||
      '',
    academicYear:
      setupData?.profileContext?.academicYear ||
      (profile as any)?.academicYear ||
      '',
    gpa:
      profile?.gpa ||
      resumeData?.education?.[0]?.scoreOrGpa ||
      undefined,
    collegeOrUniversity:
      profile?.collegeOrUniversity ||
      resumeData?.education?.[0]?.institution ||
      '',
  };

  // Technical and soft skills
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];

  if (Array.isArray(resumeData?.skills)) {
    resumeData.skills.forEach((s) => {
      const name = typeof s === 'string' ? s : (s as any).name;
      if (name) technicalSkills.push(name);
    });
  } else if (resumeData?.skills && typeof resumeData.skills === 'object') {
    (resumeData.skills.technical || []).forEach((s) => technicalSkills.push(s));
    (resumeData.skills.soft || []).forEach((s) => softSkills.push(s));
  }

  // Projects
  const projects = (resumeData?.projects || []).map((p) => {
    const allText = [p.description || '', ...(p.bullets || [])].join(' ');
    const hasMetrics = /\d+(%|ms|s|x|k|m|\+)/i.test(allText);
    return {
      title: p.title,
      techStack: p.techStack || [],
      hasMetrics,
      repoUrl: p.repoUrl || p.liveUrl || p.link,
    };
  });

  // Resume completeness
  let completenessScore = 20;
  if (resumeData?.personalInfo?.summary && resumeData.personalInfo.summary.length > 50) completenessScore += 20;
  if (technicalSkills.length >= 4) completenessScore += 20;
  if (projects.length >= 2) completenessScore += 25;
  if ((resumeData?.experience?.length || 0) > 0) completenessScore += 15;
  completenessScore = Math.min(100, completenessScore);

  // Application Pipeline
  const inProgress = applications.filter((a) =>
    ['preparing', 'applied', 'assessment', 'interview'].includes(a.status)
  ).length;
  const interviews = applications.filter((a) => a.status === 'interview').length;
  const offers = applications.filter((a) => a.status === 'offer').length;

  const now = new Date().getTime();
  const upcomingDeadlinesCount = applications.filter((a) => {
    if (!a.deadline) return false;
    const d = new Date(a.deadline).getTime();
    return d > now && d - now < 7 * 86400000;
  }).length;

  // Roadmap
  const completedMilestones = (roadmap?.milestones || []).filter((m) => m.status === 'completed');
  const inProgressMilestone = (roadmap?.milestones || []).find((m) => m.status === 'in_progress');

  // Interview Sessions
  const completedSessions = interviewSessions.filter((s) => s.status === 'completed');
  const avgScore = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((acc, s) => acc + (s.performanceSummary?.overallScore || (s as any).score || 0), 0) /
          completedSessions.length
      )
    : undefined;

  // Detect incremental progress changes
  const recentEvents = detectProgressChanges(existingEvents, {
    projects: projects.map((p) => ({ title: p.title })),
    completedMilestoneTitles: completedMilestones.map((m) => m.title),
    completedInterviewsCount: completedSessions.length,
    applicationStages: applications.map((a) => ({ id: a.id, company: a.company, stage: a.status })),
    latestAtsScore,
  });

  // Detect contradictions or gaps
  const contradictionsOrGaps = detectProfileContradictions({
    targetRole: goals?.targetRole || profile?.targetRole || 'Full Stack Engineer',
    degree: academic.degree,
    graduationYear: academic.graduationYear,
    academicYear: academic.academicYear,
    technicalSkills,
    projects,
    gpa: academic.gpa,
  });

  return {
    academic,
    verifiedSkills: {
      technical: technicalSkills,
      soft: softSkills,
    },
    projects,
    resume: {
      completenessScore,
      lastSaved: resumeData?.updatedAt,
      summaryPresent: Boolean(resumeData?.personalInfo?.summary),
      sectionsCount: [
        technicalSkills.length > 0,
        projects.length > 0,
        (resumeData?.education?.length || 0) > 0,
        (resumeData?.experience?.length || 0) > 0,
      ].filter(Boolean).length,
    },
    ats: {
      latestScore: latestAtsScore,
      topMissingKeywords: latestAtsMissingKeywords.slice(0, 6),
      scanCount: latestAtsScore !== undefined ? 1 : 0,
    },
    pipeline: {
      totalApplications: applications.length,
      inProgress,
      interviews,
      offers,
      upcomingDeadlinesCount,
    },
    roadmap: {
      totalMilestones: roadmap?.milestones?.length || 0,
      completedCount: completedMilestones.length,
      currentFocus: inProgressMilestone?.title,
    },
    interview: {
      completedSessions: completedSessions.length,
      averageScore: avgScore,
      recentCategory: completedSessions[0]?.category,
      topIdentifiedGaps: completedSessions[0]?.performanceSummary?.weakAreas || [],
    },
    goals,
    recentEvents,
    contradictionsOrGaps,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 6. CONTEXT-AWARE PERSONALIZED RECOMMENDATIONS GENERATOR
 * Generates tailored recommendations across platform modules.
 */
export function generatePersonalizedRecommendations(
  intelligence: StudentIntelligenceProfile
): PersonalizedRecommendation[] {
  const recs: PersonalizedRecommendation[] = [];
  const { goals, resume, ats, pipeline, roadmap, interview, projects, verifiedSkills } = intelligence;

  // 1. Resume recommendations
  const unquantifiedProject = projects.find((p) => !p.hasMetrics);
  if (unquantifiedProject) {
    recs.push({
      id: `rec_res_metric_${unquantifiedProject.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category: 'resume',
      title: `Quantify Impact in "${unquantifiedProject.title}"`,
      reason: `Project descriptions with numerical metrics (latency, user count, throughput) receive 40% higher recruiter engagement.`,
      priority: 'high',
      actionType: 'open_resume_builder',
      actionPayload: { section: 'projects', projectTitle: unquantifiedProject.title },
    });
  }

  if (!resume.summaryPresent) {
    recs.push({
      id: 'rec_res_summary',
      category: 'resume',
      title: `Draft Role-Targeted Summary for ${goals.targetRole}`,
      reason: `Targeting "${goals.targetRole}" without an introductory summary reduces profile punch for hiring managers.`,
      priority: 'medium',
      actionType: 'open_resume_builder',
      actionPayload: { section: 'personalInfo' },
    });
  }

  // 2. ATS recommendations
  if (ats.latestScore !== undefined && ats.latestScore < 75 && ats.topMissingKeywords && ats.topMissingKeywords.length > 0) {
    recs.push({
      id: 'rec_ats_keywords',
      category: 'ats',
      title: `Incorporate Missing Keywords: ${ats.topMissingKeywords.slice(0, 3).join(', ')}`,
      reason: `ATS score is currently ${ats.latestScore}%. Adding verified keywords to project bullets will improve parse compatibility.`,
      priority: 'high',
      actionType: 'open_ats_checker',
    });
  }

  // 3. Learning goals & Roadmap recommendations
  if (goals.shortTermLearningGoals && goals.shortTermLearningGoals.length > 0) {
    const topGoal = goals.shortTermLearningGoals[0];
    recs.push({
      id: 'rec_goal_learn',
      category: 'roadmap',
      title: `Goal Progress: ${topGoal}`,
      reason: `Aligned with your primary career goal: "${goals.primaryCareerGoal}".`,
      priority: 'medium',
      actionType: 'suggest_roadmap_milestone',
      actionPayload: { title: topGoal },
    });
  }

  // 4. Interview preparation recommendations
  if (interview.completedSessions < 3) {
    recs.push({
      id: 'rec_int_sessions',
      category: 'interview',
      title: `Practice Role Mock Interview (${interview.completedSessions}/3 Completed)`,
      reason: `Students who complete at least 3 mock interviews achieve significantly higher placement confidence.`,
      priority: 'high',
      actionType: 'start_mock_interview',
      actionPayload: { targetRole: goals.targetRole },
    });
  }

  // 5. Application recommendations
  if (pipeline.totalApplications === 0) {
    recs.push({
      id: 'rec_app_start',
      category: 'application',
      title: `Discover & Save Verified ${goals.targetRole} Openings`,
      reason: `Your application pipeline has 0 logged submissions. Explore verified fresher and internship opportunities.`,
      priority: 'high',
      actionType: 'prepare_application_draft',
    });
  }

  return recs;
}
