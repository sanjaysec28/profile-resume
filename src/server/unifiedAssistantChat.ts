/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side Unified AI Assistant Chat Engine
 * Handles context-aware cross-module conversations, action synthesis,
 * truthfulness invariants, and deterministic fallback mode.
 */

import {
  UnifiedChatApiRequest,
  UnifiedChatApiResponse,
  CrossModuleAction,
  ModuleContextPayload,
} from '../types/unifiedAssistant.ts';
import { generateContentWithFallback, GEMINI_GENERATION_MODELS } from './geminiConfig.ts';

export async function processUnifiedAssistantChat(
  input: UnifiedChatApiRequest
): Promise<UnifiedChatApiResponse> {
  const { message, context = {} as any, history = [] } = input || {};
  const activeModule = context?.activeModule || 'dashboard';
  const role = context?.targetRole || 'Full Stack Engineer';

  // Extract minimal relevant context summary
  const contextNotes: string[] = [];
  contextNotes.push(`Current Active Platform Module: "${activeModule}"`);
  contextNotes.push(`Student Target Role: "${role}"`);

  if (context.resumeSnapshot) {
    const r = context.resumeSnapshot;
    contextNotes.push(
      `Resume Snapshot: Sections=${r.sectionsCount || 0}, Top Skills=[${(r.topTechnicalSkills || []).slice(0, 5).join(', ')}], Projects=[${(r.topProjectTitles || []).join(', ')}]`
    );
  }

  if (context.atsSnapshot) {
    const a = context.atsSnapshot;
    contextNotes.push(
      `ATS Checker Snapshot: Overall Score=${a.overallScore ?? 'N/A'}, Missing Keywords=[${(a.missingKeywords || []).slice(0, 5).join(', ')}]`
    );
  }

  if (context.roadmapSnapshot) {
    const rm = context.roadmapSnapshot;
    contextNotes.push(
      `Roadmap Snapshot: Milestones=${rm.completedMilestones || 0}/${rm.totalMilestones || 0} completed, Active Target="${rm.inProgressTitle || 'Foundation'}"`
    );
  }

  if (context.jobSnapshot) {
    const j = context.jobSnapshot;
    contextNotes.push(
      `Selected Job Snapshot: Role="${j.title}", Company="${j.company}", Match Score=${j.matchScore ?? 'N/A'}%, Eligibility="${j.eligibilityStatus || 'Unknown'}"`
    );
  }

  if (context.applicationSnapshot) {
    const app = context.applicationSnapshot;
    contextNotes.push(
      `Application Snapshot: Company="${app.company}", Role="${app.role}", Stage="${app.currentStage}", Next Follow-up="${app.nextFollowUpDate || 'None'}"`
    );
  }

  if (context.interviewSnapshot) {
    const int = context.interviewSnapshot;
    contextNotes.push(
      `Interview Prep Snapshot: Completed Sessions=${int.completedSessionsCount || 0}, Average Score=${int.averageScore ?? 'N/A'}%`
    );
  }

  if (context.studentGoalsSnapshot) {
    const g = context.studentGoalsSnapshot;
    contextNotes.push(
      `Student Career Goals: Primary Goal="${g.primaryCareerGoal || 'Secure target role'}", Target Role="${g.targetRole || role}", Preferred Industries=[${(g.preferredIndustries || []).join(', ')}], Locations=[${(g.preferredLocations || []).join(', ')}], Work Preference="${g.workPreference || 'any'}", Target Date="${g.targetCompletionDate || 'N/A'}"`
    );
    if (g.shortTermLearningGoals && g.shortTermLearningGoals.length > 0) {
      contextNotes.push(`Short-Term Learning Goals: ${g.shortTermLearningGoals.join('; ')}`);
    }
    if (g.placementPrepGoals && g.placementPrepGoals.length > 0) {
      contextNotes.push(`Placement Preparation Goals: ${g.placementPrepGoals.join('; ')}`);
    }
  }

  if (context.recentProgressEvents && context.recentProgressEvents.length > 0) {
    const evts = context.recentProgressEvents.slice(0, 4).map((e: any) => `[${e.type}] ${e.title}`);
    contextNotes.push(`Recent Progress Milestones: ${evts.join(', ')}`);
  }

  if (context.detectedContradictions && context.detectedContradictions.length > 0) {
    contextNotes.push(`Identified Profile Gaps & Contradictions: ${context.detectedContradictions.join(' | ')}`);
  }

  const prompt = `
You are the ProFile Unified Senior AI Assistant & Placement Director.
You provide intelligent, actionable, student-focused placement guidance across the entire ProFile platform.

### CURRENT STUDENT MODULE CONTEXT & INTELLIGENCE:
${contextNotes.join('\n')}

### CONVERSATION HISTORY (Previous turns):
${history.slice(-4).map((h) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content}`).join('\n')}

### STUDENT MESSAGE:
"""${message}"""

### STRICT GROUNDING & SAFETY INVARIANTS:
1. NEVER invent student qualifications, numerical metrics (e.g., claiming they improved latency by 45% when not in their data), fake companies, or recruiter names.
2. Ingest the student's career goals and recent progress milestones to provide personalized guidance.
3. If the student has identified profile gaps or contradictions, constructively point them out when relevant, offering practical next steps.
4. Avoid asking for information already provided in the student profile context.
5. If student mentions needing resume edits, interview practice, ATS check, or roadmap milestones, you may propose a structured cross-module action in JSON.
6. Every proposed action MUST have "requiresApproval": true. Never claim an action has already altered their data.
7. Distinguish verified student data from AI recommendations clearly in disclosures.
8. Provide practical, high-value engineering advice calibrated for college students and freshers.

### REQUIRED JSON OUTPUT FORMAT:
Return a valid JSON object matching:
{
  "reply": "Clear, markdown-formatted response addressing the student inquiry directly...",
  "verifiedDataDisclosures": ["Referencing documented project: Campus Hub", "Referencing verified skill: TypeScript"],
  "aiSuggestionsDisclosures": ["Recommending Redis caching as an architectural upgrade"],
  "action": null | {
    "type": "open_resume_builder" | "open_ats_checker" | "suggest_roadmap_milestone" | "prepare_application_draft" | "start_mock_interview" | "prepare_project_defense",
    "title": "Short button-friendly action title",
    "description": "Clear explanation of what this action will do",
    "payload": { ...relevant parameters... },
    "requiresApproval": true
  }
}
`;

  try {
    const { text } = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.3,
      models: GEMINI_GENERATION_MODELS,
      operationName: 'Unified Assistant Chat',
    });

    const cleaned = text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    let preparedAction: CrossModuleAction | undefined = undefined;
    if (parsed.action && parsed.action.type && parsed.action.title) {
      preparedAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: parsed.action.type,
        title: parsed.action.title,
        description: parsed.action.description || 'Review and apply this cross-module recommendation.',
        payload: parsed.action.payload || {},
        requiresApproval: true,
        status: 'pending',
      };
    }

    return {
      reply: parsed.reply || 'Here is the relevant placement guidance for your request.',
      action: preparedAction,
      isFallback: false,
      generationSource: 'gemini',
      verifiedDataDisclosures: Array.isArray(parsed.verifiedDataDisclosures) ? parsed.verifiedDataDisclosures : [],
      aiSuggestionsDisclosures: Array.isArray(parsed.aiSuggestionsDisclosures) ? parsed.aiSuggestionsDisclosures : [],
    };
  } catch (err) {
    console.warn('[Unified Assistant] AI generation fallback triggered:', err);
  }

  // Grounded Deterministic Fallback Mode
  return generateDeterministicFallbackResponse(message, context);
}

/**
 * Deterministic, offline-safe guidance generator when Gemini API is unconfigured.
 */
function generateDeterministicFallbackResponse(
  message: string,
  context: ModuleContextPayload
): UnifiedChatApiResponse {
  const lower = message.toLowerCase();
  const activeModule = context.activeModule;
  const role = context.targetRole || 'Full Stack Engineer';

  let reply = '';
  let action: CrossModuleAction | undefined = undefined;
  const verifiedDisclosures: string[] = [];
  const aiDisclosures: string[] = ['Generated via ProFile Deterministic Guidance Mode'];

  if (lower.includes('interview') || lower.includes('mock') || lower.includes('practice') || activeModule === 'interview_prep') {
    reply = `To prepare for **${role}** placement interviews, focus on a structured approach:
1. **Technical Fundamentals**: Review core concepts, time/space complexity, and API architectures.
2. **Behavioral STAR Stories**: Prepare 2-3 structured stories (Situation, Task, Action, Result) highlighting problem solving and collaboration.
3. **Project Defense**: Be ready to defend every technology and architectural choice in your documented projects.`;

    action = {
      id: `act_mock_${Date.now()}`,
      type: 'start_mock_interview',
      title: `Start Mock Interview for ${role}`,
      description: `Launch a 5-question diagnostic mock interview tailored to ${role} competencies.`,
      payload: { targetRole: role, interviewType: 'technical' },
      requiresApproval: true,
      status: 'pending',
    };
  } else if (lower.includes('resume') || lower.includes('bullet') || lower.includes('cv') || activeModule === 'resume_builder') {
    reply = `For a high-impact **${role}** resume:
- **Action Verbs & Metrics**: Start every bullet with strong verbs (e.g. *Architected, Engineered, Optimized*) followed by quantified outcomes (*e.g., 35% latency reduction*).
- **Technology Alignment**: Ensure core technologies like TypeScript, databases, and version control are explicitly listed with proof in projects.
- **Section Cleanliness**: Ensure zero bracketed placeholders and zero conversational headers remain.`;

    action = {
      id: `act_resume_${Date.now()}`,
      type: 'open_resume_builder',
      title: 'Open Resume Builder (Projects Section)',
      description: 'Navigate to your resume projects to audit metrics and action verbs.',
      payload: { section: 'projects' },
      requiresApproval: true,
      status: 'pending',
    };
  } else if (lower.includes('ats') || lower.includes('score') || activeModule === 'ats_checker') {
    reply = `Your **ATS Compatibility** evaluates how well your resume matches standard employer parsers:
- **Keywords**: Ensure exact technical terms from job descriptions are present in your skills and project bullets.
- **Section Headings**: Use standard headings (*Experience, Education, Projects, Technical Skills*).
- **Format Integrity**: Keep formatting single-column or clean two-column with readable typography.`;

    action = {
      id: `act_ats_${Date.now()}`,
      type: 'open_ats_checker',
      title: 'Open ATS Checker Report',
      description: 'Review keyword frequency and identified parsing opportunities.',
      payload: {},
      requiresApproval: true,
      status: 'pending',
    };
  } else if (lower.includes('roadmap') || lower.includes('skill') || lower.includes('learn') || activeModule === 'career_roadmap') {
    reply = `Recommended learning progression for **${role}**:
1. **Core Language & Types**: Deepen strict TypeScript and asynchronous concurrency.
2. **Database & Scale**: Practice indexing, query tuning, and caching patterns.
3. **System Architecture**: Study RESTful design, authentication middleware, and automated unit testing.`;

    action = {
      id: `act_roadmap_${Date.now()}`,
      type: 'suggest_roadmap_milestone',
      title: `Add Roadmap Milestone: Database Optimization & Indexing`,
      description: `Add a 1-week milestone to your career roadmap for query optimization and performance testing.`,
      payload: {
        title: 'Database Optimization & Indexing Drill',
        category: 'technical_skills',
        priority: 'high',
        estimatedDuration: '1 week',
      },
      requiresApproval: true,
      status: 'pending',
    };
  } else if (lower.includes('apply') || lower.includes('job') || lower.includes('follow') || activeModule === 'application_tracker') {
    reply = `Application pipeline management best practices:
- **Timely Follow-ups**: Follow up with recruiters 7–10 days after submitting your application on the official career portal.
- **Tailored Resumes**: Match approved keywords to the specific requirements of the opening.
- **Stage Milestones**: Track your application milestones (Preparing $\\rightarrow$ Applied $\\rightarrow$ Assessment $\\rightarrow$ Interview) systematically.`;

    action = {
      id: `act_app_${Date.now()}`,
      type: 'prepare_application_draft',
      title: 'Prepare Follow-Up Email Template',
      description: 'Generate a polite recruiter follow-up message calibrated for 7-10 days post-submission.',
      payload: {},
      requiresApproval: true,
      status: 'pending',
    };
  } else if (lower.includes('goal') || lower.includes('objective') || lower.includes('target role')) {
    const goals = context.studentGoalsSnapshot;
    reply = `### Active Career Goals & Personalization Profile:
- **Target Role**: ${goals?.targetRole || role}
- **Primary Career Goal**: ${goals?.primaryCareerGoal || 'Secure a high-impact engineering placement.'}
- **Preferred Industries**: ${(goals?.preferredIndustries || []).join(', ') || 'Technology & Engineering'}
- **Preferred Locations**: ${(goals?.preferredLocations || []).join(', ') || 'Flexible / Remote'}
- **Target Date**: ${goals?.targetCompletionDate || 'Upcoming placement season'}

**Next Recommended Action**: Continue executing your short-term learning goals and rehearsing mock interviews aligned with ${goals?.targetRole || role}.`;

    action = {
      id: `act_goal_${Date.now()}`,
      type: 'suggest_roadmap_milestone',
      title: `Align Roadmap with ${goals?.targetRole || role} Goals`,
      description: `Review and adjust milestone deadlines to meet your target completion date (${goals?.targetCompletionDate || '2026'}).`,
      payload: { targetRole: goals?.targetRole || role },
      requiresApproval: true,
      status: 'pending',
    };
  } else {
    const goals = context.studentGoalsSnapshot;
    const goalSummary = goals?.primaryCareerGoal ? `\n\n*Aligned with your goal: "${goals.primaryCareerGoal}"*` : '';
    reply = `Welcome to ProFile AI Assistant. I have active context from **${activeModule.replace('_', ' ')}** targeting **${role}**${goalSummary}.
You can ask me to:
- Audit and improve your resume bullets with quantified impact.
- Review your active career goals and check for profile contradictions.
- Explain ATS keywords and fix identified resume formatting gaps.
- Recommend career roadmap milestones and missing skill drills.
- Practice realistic mock interviews with rubric evaluations.
- Rehearse project defense explanations for your documented projects.`;
  }

  if (context.resumeSnapshot?.topProjectTitles && context.resumeSnapshot.topProjectTitles.length > 0) {
    verifiedDisclosures.push(`Verified Project: "${context.resumeSnapshot.topProjectTitles[0]}"`);
  }

  if (context.studentGoalsSnapshot?.primaryCareerGoal) {
    verifiedDisclosures.push(`Active Student Goal: "${context.studentGoalsSnapshot.primaryCareerGoal}"`);
  }

  if (context.recentProgressEvents && context.recentProgressEvents.length > 0) {
    verifiedDisclosures.push(`Recent Milestone: "${context.recentProgressEvents[0].title}"`);
  }

  if (context.detectedContradictions && context.detectedContradictions.length > 0 && (lower.includes('gap') || lower.includes('readiness') || lower.includes('audit'))) {
    aiDisclosures.push(`Identified Gap: ${context.detectedContradictions[0]}`);
  }

  return {
    reply,
    action,
    isFallback: true,
    generationSource: 'deterministic-fallback',
    verifiedDataDisclosures: verifiedDisclosures,
    aiSuggestionsDisclosures: aiDisclosures,
  };
}
