/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 5: Client-Side Career Intelligence Service
 * Coordinates deterministic skill gap evaluation, server-side roadmap generation,
 * Firestore and local persistence, task status updates, and interactive career AI chat.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.ts';
import { ResumeData } from '../types/resume.ts';
import { StudentProfile } from '../types/profile.ts';
import { ResumeSetupData } from '../types/resumeSetup.ts';
import {
  CareerPlan,
  CareerPlanGenerationInput,
  RoadmapTaskStatus,
  ProjectStatus,
  CareerChatMessage,
  RoadmapTask,
  RoadmapStageId,
} from '../types/careerIntelligence.ts';
import { analyzeCareerReadiness } from './careerIntelligenceScorer.ts';

const STORAGE_PREFIX = 'profile_career_plan_';

function getPlanDocId(targetRole: string): string {
  return targetRole.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'default_plan';
}

/**
 * Loads a previously saved career plan from Firestore or localStorage.
 */
export async function getSavedCareerPlan(
  userId: string | undefined,
  targetRole: string
): Promise<CareerPlan | null> {
  const planId = getPlanDocId(targetRole);

  // 1. Try Firestore if authenticated
  if (db && userId) {
    try {
      const planDocRef = doc(db, 'users', userId, 'careerIntelligence', planId);
      const snap = await getDoc(planDocRef);
      if (snap.exists()) {
        return snap.data() as CareerPlan;
      }
    } catch (err) {
      console.warn('[CareerService] Firestore read error, checking local storage:', err);
    }
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${planId}`);
    if (raw) {
      return JSON.parse(raw) as CareerPlan;
    }
  } catch (err) {
    console.warn('[CareerService] LocalStorage read error:', err);
  }

  return null;
}

/**
 * Persists career plan to Firestore and localStorage.
 */
export async function saveCareerPlan(
  userId: string | undefined,
  plan: CareerPlan
): Promise<void> {
  const planId = getPlanDocId(plan.targetRole);

  // Always cache locally
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${planId}`, JSON.stringify(plan));
  } catch (err) {
    console.warn('[CareerService] LocalStorage save warning:', err);
  }

  // Sync to Firestore if authenticated
  if (db && userId) {
    try {
      const planDocRef = doc(db, 'users', userId, 'careerIntelligence', planId);
      await setDoc(
        planDocRef,
        {
          ...plan,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[CareerService] Firestore sync warning:', err);
    }
  }
}

/**
 * Generates a brand new or refreshed Career Plan:
 * Deterministic skill gaps + Server AI 6-stage roadmap + Proposed projects + Certifications.
 */
export async function generateNewCareerPlan(
  userId: string | undefined,
  targetRole: string,
  resumeData: ResumeData,
  profile?: StudentProfile,
  setupData?: ResumeSetupData | null,
  hoursPerWeek: number = 10
): Promise<CareerPlan> {
  // 1. Deterministic skill analysis
  const { skillGaps, readiness } = analyzeCareerReadiness(targetRole, resumeData, profile);

  // 2. Format input for server AI roadmap generator
  const input: CareerPlanGenerationInput = {
    targetRole,
    purpose: setupData?.purpose || 'fresher',
    academicYear: setupData?.profileContext?.academicYear || '3rd Year',
    graduationYear: setupData?.profileContext?.graduationYear || profile?.graduationYear || '2026',
    degree: setupData?.profileContext?.degree || resumeData.education?.[0]?.degree || 'B.Tech',
    major: setupData?.profileContext?.major || profile?.major || resumeData.education?.[0]?.fieldOfStudy || 'Computer Science',
    collegeOrUniversity: setupData?.profileContext?.collegeOrUniversity || profile?.collegeOrUniversity,
    existingSkills: {
      technical: resumeData.skills?.technical || [],
      soft: resumeData.skills?.soft || [],
      tools: resumeData.skills?.tools || [],
    },
    projectsSummary: (resumeData.projects || []).map((p) => ({
      title: p.title,
      techStack: p.techStack || [],
      description: p.description || '',
      bullets: p.bullets || [],
    })),
    experienceSummary: (resumeData.experience || []).map((e) => ({
      company: e.company,
      position: e.position,
      description: e.description,
    })),
    coursework: resumeData.coursework || [],
    certifications: (resumeData.certifications || []).map((c) => c.name),
    jobDescriptionText: setupData?.jobDescription?.text,
    hoursPerWeek,
  };

  // 3. Request server-side AI generation
  const res = await fetch('/api/career/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let errDetail = 'Failed to generate career plan.';
    try {
      const errJson = await res.json();
      if (errJson.error) errDetail = errJson.error;
    } catch {
      errDetail = `Server returned status ${res.status}`;
    }
    throw new Error(errDetail);
  }

  const aiData = await res.json();

  const planId = getPlanDocId(targetRole);
  const now = new Date().toISOString();

  const careerPlan: CareerPlan = {
    id: planId,
    userId,
    targetRole,
    targetRoleCategory: setupData?.targetRole?.category || 'software',
    purpose: setupData?.purpose || 'fresher',
    academicYear: input.academicYear,
    graduationYear: input.graduationYear,
    degree: input.degree,
    major: input.major,
    hoursPerWeek,
    generatedAt: now,
    updatedAt: now,
    readiness,
    skillGaps,
    roadmapStages: aiData.roadmapStages || [],
    recommendedProjects: aiData.recommendedProjects || [],
    recommendedCertifications: aiData.recommendedCertifications || [],
  };

  await saveCareerPlan(userId, careerPlan);
  return careerPlan;
}

/**
 * Updates a roadmap task's status (not-started, in-progress, completed).
 */
export async function updateTaskStatus(
  userId: string | undefined,
  plan: CareerPlan,
  taskId: string,
  newStatus: RoadmapTaskStatus,
  notes?: string
): Promise<CareerPlan> {
  const updatedStages = plan.roadmapStages.map((stage) => ({
    ...stage,
    tasks: stage.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          studentNotes: notes !== undefined ? notes : task.studentNotes,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return task;
    }),
  }));

  const updatedPlan: CareerPlan = {
    ...plan,
    roadmapStages: updatedStages,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Updates a recommended project's student status.
 */
export async function updateProjectStatus(
  userId: string | undefined,
  plan: CareerPlan,
  projectId: string,
  status: ProjectStatus,
  links?: { githubUrl?: string; liveUrl?: string; studentNotes?: string }
): Promise<CareerPlan> {
  const updatedProjects = plan.recommendedProjects.map((p) => {
    if (p.id === projectId) {
      return {
        ...p,
        status,
        githubUrl: links?.githubUrl !== undefined ? links.githubUrl : p.githubUrl,
        liveUrl: links?.liveUrl !== undefined ? links.liveUrl : p.liveUrl,
        studentNotes: links?.studentNotes !== undefined ? links.studentNotes : p.studentNotes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      };
    }
    return p;
  });

  const updatedPlan: CareerPlan = {
    ...plan,
    recommendedProjects: updatedProjects,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Toggles a milestone within a project.
 */
export async function toggleProjectMilestone(
  userId: string | undefined,
  plan: CareerPlan,
  projectId: string,
  milestoneId: string
): Promise<CareerPlan> {
  const updatedProjects = plan.recommendedProjects.map((p) => {
    if (p.id === projectId) {
      const updatedMilestones = p.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      return { ...p, milestones: updatedMilestones };
    }
    return p;
  });

  const updatedPlan: CareerPlan = {
    ...plan,
    recommendedProjects: updatedProjects,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Updates a certification's status (recommended, pursuing, completed).
 */
export async function updateCertificationStatus(
  userId: string | undefined,
  plan: CareerPlan,
  certId: string,
  status: 'recommended' | 'pursuing' | 'completed'
): Promise<CareerPlan> {
  const updatedCerts = plan.recommendedCertifications.map((c) =>
    c.id === certId ? { ...c, status, verifiedByUser: status === 'completed' } : c
  );

  const updatedPlan: CareerPlan = {
    ...plan,
    recommendedCertifications: updatedCerts,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Allows the student to add a custom roadmap task.
 */
export async function addCustomRoadmapTask(
  userId: string | undefined,
  plan: CareerPlan,
  stageId: RoadmapStageId,
  title: string,
  objective: string
): Promise<CareerPlan> {
  const newTask: RoadmapTask = {
    id: `custom_task_${Date.now()}`,
    stageId,
    title,
    objective,
    whyItMatters: 'Student-defined milestone toward career readiness.',
    suggestedTopics: [],
    practicalExercises: [],
    estimatedDuration: '1-2 weeks (est.)',
    completionCriteria: 'Complete self-directed practice and verify output.',
    status: 'in-progress',
  };

  const updatedStages = plan.roadmapStages.map((stage) => {
    if (stage.id === stageId) {
      return { ...stage, tasks: [...stage.tasks, newTask] };
    }
    return stage;
  });

  const updatedPlan: CareerPlan = {
    ...plan,
    roadmapStages: updatedStages,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Deletes a roadmap task.
 */
export async function deleteRoadmapTask(
  userId: string | undefined,
  plan: CareerPlan,
  taskId: string
): Promise<CareerPlan> {
  const updatedStages = plan.roadmapStages.map((stage) => ({
    ...stage,
    tasks: stage.tasks.filter((t) => t.id !== taskId),
  }));

  const updatedPlan: CareerPlan = {
    ...plan,
    roadmapStages: updatedStages,
    updatedAt: new Date().toISOString(),
  };

  await saveCareerPlan(userId, updatedPlan);
  return updatedPlan;
}

/**
 * Sends a query to the AI Career Assistant endpoint.
 */
export async function askCareerAssistant(
  question: string,
  history: CareerChatMessage[],
  careerPlan: CareerPlan,
  interviewMetrics?: any
): Promise<string> {
  const response = await fetch('/api/career/assistant-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history, careerPlan, interviewMetrics }),
  });

  if (!response.ok) {
    let err = 'Failed to get answer from Career Assistant.';
    try {
      const j = await response.json();
      if (j.error) err = j.error;
    } catch {}
    throw new Error(err);
  }

  const data = await response.json();
  return data.reply;
}
