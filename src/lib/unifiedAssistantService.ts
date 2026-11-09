/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.1: Unified AI Assistant Client Service
 * Persistence in Firestore & LocalStorage, conversation lifecycle management,
 * API dispatch, and action approval execution.
 */

import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase.ts';
import {
  UnifiedConversation,
  UnifiedChatMessage,
  UnifiedChatApiRequest,
  UnifiedChatApiResponse,
  CrossModuleAction,
  ActiveAppModule,
  ModuleContextPayload,
} from '../types/unifiedAssistant.ts';
import { cleanFirestoreData } from './placementIntelligenceService.ts';

const CONVERSATIONS_LOCAL_STORAGE_PREFIX = 'profile_ai_conversations_';

/**
 * Loads all unified conversations for the student.
 */
export async function loadUnifiedConversations(userId: string | undefined): Promise<UnifiedConversation[]> {
  const key = `${CONVERSATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  let localList: UnifiedConversation[] = [];

  try {
    const raw = localStorage.getItem(key);
    if (raw) localList = JSON.parse(raw);
  } catch (err) {
    console.warn('[UnifiedAssistant] LocalStorage read warning:', err);
  }

  if (userId && db) {
    try {
      const colRef = collection(db, 'users', userId, 'aiConversations');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteList = snap.docs.map((d) => d.data() as UnifiedConversation);
        const map = new Map<string, UnifiedConversation>();
        remoteList.forEach((c) => map.set(c.id, c));
        localList.forEach((c) => {
          if (!map.has(c.id)) map.set(c.id, c);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    } catch (err) {
      console.warn('[UnifiedAssistant] Firestore read error, using local fallback:', err);
    }
  }

  return localList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Saves or updates a unified conversation in Firestore & LocalStorage.
 */
export async function saveUnifiedConversation(
  userId: string | undefined,
  conversation: UnifiedConversation
): Promise<void> {
  const key = `${CONVERSATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    const existing: UnifiedConversation[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((c) => c.id !== conversation.id);
    filtered.unshift(conversation);
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 30)));
  } catch (err) {
    console.warn('[UnifiedAssistant] LocalStorage save warning:', err);
  }

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'aiConversations', conversation.id);
      const cleaned = cleanFirestoreData(conversation);
      await setDoc(docRef, {
        ...cleaned,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[UnifiedAssistant] Firestore save error (offline mode):', err);
    }
  }
}

/**
 * Deletes a conversation by ID.
 */
export async function deleteUnifiedConversation(
  userId: string | undefined,
  conversationId: string
): Promise<void> {
  const key = `${CONVERSATIONS_LOCAL_STORAGE_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const existing: UnifiedConversation[] = JSON.parse(raw);
      const filtered = existing.filter((c) => c.id !== conversationId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('[UnifiedAssistant] LocalStorage delete warning:', err);
  }

  if (userId && db) {
    try {
      const docRef = doc(db, 'users', userId, 'aiConversations', conversationId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[UnifiedAssistant] Firestore delete error:', err);
    }
  }
}

/**
 * Renames a conversation title.
 */
export async function renameUnifiedConversation(
  userId: string | undefined,
  conversationId: string,
  newTitle: string
): Promise<UnifiedConversation | null> {
  const list = await loadUnifiedConversations(userId);
  const target = list.find((c) => c.id === conversationId);
  if (!target) return null;

  const updated: UnifiedConversation = {
    ...target,
    title: newTitle.trim() || target.title,
    updatedAt: new Date().toISOString(),
  };

  await saveUnifiedConversation(userId, updated);
  return updated;
}

/**
 * Calls server API to get AI response for unified chat.
 */
export async function requestUnifiedAssistantChat(
  request: UnifiedChatApiRequest
): Promise<UnifiedChatApiResponse> {
  const response = await fetch('/api/assistant/unified-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let msg = 'Failed to communicate with ProFile AI Assistant.';
    try {
      const err = await response.json();
      if (err.error) msg = err.error;
    } catch {}
    throw new Error(msg);
  }

  const data: UnifiedChatApiResponse = await response.json();
  return data;
}

/**
 * Creates a fresh blank conversation initialized with active module tag.
 */
export function createNewConversation(
  userId: string | undefined,
  activeModule: ActiveAppModule,
  title?: string
): UnifiedConversation {
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title || `Conversation (${activeModule.replace('_', ' ')})`,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveModule: activeModule,
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        role: 'system',
        content: `ProFile Unified Assistant connected. Active context: ${activeModule.replace('_', ' ')}. How can I assist with your preparation today?`,
        timestamp: new Date().toISOString(),
        activeModule,
      },
    ],
  };
}
