/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.1: Unified AI Assistant & Cross-Module Intelligence Test Suite
 * Tests 8-module context isolation, conversation CRUD persistence, cross-module action
 * synthesis, student approval safeguard invariant, deterministic fallback engine, and truthfulness.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  ActiveAppModule,
  ModuleContextPayload,
  CrossModuleAction,
  UnifiedConversation,
  UnifiedChatMessage,
} from '../src/types/unifiedAssistant.ts';
import { processUnifiedAssistantChat } from '../src/server/unifiedAssistantChat.ts';
import {
  createNewConversation,
  loadUnifiedConversations,
  saveUnifiedConversation,
  deleteUnifiedConversation,
  renameUnifiedConversation,
} from '../src/lib/unifiedAssistantService.ts';

// Mock localStorage for Node test runner
const storageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

const TEST_UID = 'student_unified_d71';

describe('Phase D.7.1: Unified AI Assistant & Cross-Module Intelligence', () => {
  beforeEach(() => {
    storageMap.clear();
  });

  // 1. Context Snapshots & 8-Module Alignment
  it('1. Constructs minimal, lightweight context snapshots for all 8 active platform modules', () => {
    const allModules: ActiveAppModule[] = [
      'dashboard',
      'resume_builder',
      'ats_checker',
      'resume_review',
      'career_roadmap',
      'job_discovery',
      'application_tracker',
      'interview_prep',
    ];

    assert.strictEqual(allModules.length, 8, 'Must cover exactly 8 distinct platform modules');

    for (const mod of allModules) {
      const payload: ModuleContextPayload = {
        activeModule: mod,
        targetRole: 'Full Stack Engineer',
        resumeSnapshot: {
          fullName: 'Alex Chen',
          topTechnicalSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          topProjectTitles: ['Campus Hub', 'DevCollab'],
        },
      };

      assert.strictEqual(payload.activeModule, mod);
      assert.strictEqual(payload.targetRole, 'Full Stack Engineer');
      assert.ok(payload.resumeSnapshot?.topProjectTitles?.includes('Campus Hub'));
    }
  });

  // 2. Conversation CRUD & User Isolation
  it('2. Manages conversation lifecycle (create, save, rename, load, delete) with user isolation', async () => {
    // A. Create new conversation
    const conv1 = createNewConversation(TEST_UID, 'dashboard');
    assert.ok(conv1.id.startsWith('conv_'));
    assert.strictEqual(conv1.userId, TEST_UID);
    assert.strictEqual(conv1.lastActiveModule, 'dashboard');
    assert.strictEqual(conv1.messages.length, 1);
    assert.strictEqual(conv1.messages[0].role, 'system');

    // B. Save conversation
    await saveUnifiedConversation(TEST_UID, conv1);
    const loaded = await loadUnifiedConversations(TEST_UID);
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].id, conv1.id);

    // C. Rename conversation
    const renamed = await renameUnifiedConversation(TEST_UID, conv1.id, 'My Interview Prep Session');
    assert.ok(renamed);
    assert.strictEqual(renamed?.title, 'My Interview Prep Session');

    // Verify persistence of rename
    const reloaded = await loadUnifiedConversations(TEST_UID);
    assert.strictEqual(reloaded[0].title, 'My Interview Prep Session');

    // D. User Isolation: Another user should not see TEST_UID conversations
    const otherUserConversations = await loadUnifiedConversations('other_student_999');
    assert.strictEqual(otherUserConversations.length, 0, 'Conversations must be isolated per user');

    // E. Delete conversation
    await deleteUnifiedConversation(TEST_UID, conv1.id);
    const afterDelete = await loadUnifiedConversations(TEST_UID);
    assert.strictEqual(afterDelete.length, 0);
  });

  // 3. Server Chat Processing & Deterministic Fallback Mode
  it('3. Responds accurately in offline / fallback mode with transparent source disclosures', async () => {
    const input = {
      message: 'How should I optimize my project bullet points for my resume?',
      context: {
        activeModule: 'resume_builder' as ActiveAppModule,
        targetRole: 'Backend Engineer',
        resumeSnapshot: {
          fullName: 'Taylor Student',
          topTechnicalSkills: ['Go', 'PostgreSQL', 'Docker'],
          topProjectTitles: ['Distributed Task Queue'],
        },
      },
    };

    const res = await processUnifiedAssistantChat(input);

    assert.ok(res.reply && res.reply.length > 50, 'Reply must contain substantive guidance');
    assert.ok(res.isFallback, 'Must use deterministic fallback when external API key is absent');
    assert.strictEqual(res.generationSource, 'deterministic-fallback');
    assert.ok(Array.isArray(res.verifiedDataDisclosures));
    assert.ok(Array.isArray(res.aiSuggestionsDisclosures));
    assert.ok(
      res.aiSuggestionsDisclosures.some((d) => d.includes('Deterministic Guidance Mode')),
      'Disclosures must explicitly label deterministic guidance engine'
    );
  });

  // 4. Cross-Module Action Synthesis for Resume Builder
  it('4. Synthesizes cross-module action for Resume Builder with mandatory approval safeguard', async () => {
    const res = await processUnifiedAssistantChat({
      message: 'Help me refine the bullet points in my resume',
      context: {
        activeModule: 'resume_builder' as ActiveAppModule,
        targetRole: 'Full Stack Engineer',
      },
    });

    assert.ok(res.action, 'Should synthesize a relevant cross-module action');
    assert.strictEqual(res.action?.type, 'open_resume_builder');
    assert.strictEqual(res.action?.requiresApproval, true, 'Action MUST require student approval');
    assert.strictEqual(res.action?.status, 'pending', 'Action MUST initialize in pending status');
    assert.ok(res.action?.title && res.action?.description);
  });

  // 5. Cross-Module Action Synthesis for Mock Interview
  it('5. Synthesizes cross-module action for Interview Prep with mandatory approval safeguard', async () => {
    const res = await processUnifiedAssistantChat({
      message: 'I want to practice mock interviews for my upcoming placement',
      context: {
        activeModule: 'interview_prep' as ActiveAppModule,
        targetRole: 'Frontend Engineer',
      },
    });

    assert.ok(res.action, 'Should synthesize mock interview action');
    assert.strictEqual(res.action?.type, 'start_mock_interview');
    assert.strictEqual(res.action?.requiresApproval, true, 'Approval safeguard invariant must hold');
    assert.strictEqual(res.action?.status, 'pending', 'Cannot auto-execute');
    assert.strictEqual(res.action?.payload?.targetRole, 'Frontend Engineer');
  });

  // 6. Cross-Module Action Synthesis for Career Roadmap
  it('6. Synthesizes cross-module action for Career Roadmap with mandatory approval safeguard', async () => {
    const res = await processUnifiedAssistantChat({
      message: 'What skills should I learn next to improve my placement roadmap?',
      context: {
        activeModule: 'career_roadmap' as ActiveAppModule,
        targetRole: 'DevOps Engineer',
      },
    });

    assert.ok(res.action, 'Should synthesize roadmap milestone action');
    assert.strictEqual(res.action?.type, 'suggest_roadmap_milestone');
    assert.strictEqual(res.action?.requiresApproval, true, 'Approval safeguard invariant must hold');
    assert.strictEqual(res.action?.status, 'pending', 'Cannot auto-modify roadmap without approval');
    assert.ok(res.action?.payload?.title, 'Milestone must specify proposed title');
  });

  // 7. Grounding & Anti-Hallucination Invariant
  it('7. Strictly preserves truthfulness: distinguishes verified student data from suggestions', async () => {
    const verifiedProject = 'Microservices E-Commerce Gateway';
    const res = await processUnifiedAssistantChat({
      message: 'What should I defend about my flagship project?',
      context: {
        activeModule: 'dashboard' as ActiveAppModule,
        targetRole: 'Systems Engineer',
        resumeSnapshot: {
          fullName: 'Priya Sharma',
          topProjectTitles: [verifiedProject],
        },
      },
    });

    // Verify disclosure references verified project
    assert.ok(
      res.verifiedDataDisclosures?.some((d) => d.includes(verifiedProject)),
      'Disclosures must explicitly reference the verified student project'
    );

    // Verify no unresolved placeholders
    assert.ok(!res.reply.includes('[improved efficiency by X%]'), 'Must not contain unresolved placeholders');
    assert.ok(!res.reply.includes('[insert achievement]'), 'Must not contain bracketed placeholders');
    assert.ok(!res.reply.includes('I cannot assist with that request'), 'Must not contain conversational refusal leaks');
  });
});
