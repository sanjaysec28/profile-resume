/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.1: Unified AI Assistant React Context & State Management
 * Connects all platform modules, tracks conversation history, and handles action approvals.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveAppModule,
  ModuleContextPayload,
  UnifiedConversation,
  UnifiedChatMessage,
  CrossModuleAction,
} from '../../types/unifiedAssistant.ts';
import {
  loadUnifiedConversations,
  saveUnifiedConversation,
  deleteUnifiedConversation,
  renameUnifiedConversation,
  requestUnifiedAssistantChat,
  createNewConversation,
} from '../../lib/unifiedAssistantService.ts';

interface UnifiedAssistantContextType {
  isOpen: boolean;
  openAssistant: (options?: {
    prompt?: string;
    module?: ActiveAppModule;
    context?: Partial<ModuleContextPayload>;
  }) => void;
  closeAssistant: () => void;
  activeModule: ActiveAppModule;
  setActiveModule: (mod: ActiveAppModule) => void;
  setModuleContext: (ctx: Partial<ModuleContextPayload>) => void;
  currentContext: ModuleContextPayload;
  conversations: UnifiedConversation[];
  activeConversation: UnifiedConversation | null;
  selectConversation: (id: string) => void;
  startNewConversation: (module?: ActiveAppModule) => void;
  deleteConversationById: (id: string) => Promise<void>;
  renameConversationById: (id: string, newTitle: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  approveAndExecuteAction: (action: CrossModuleAction) => Promise<void>;
  dismissAction: (actionId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  retryLastMessage: () => Promise<void>;
}

const UnifiedAssistantContext = createContext<UnifiedAssistantContextType | undefined>(undefined);

interface UnifiedAssistantProviderProps {
  userId?: string;
  initialModule?: ActiveAppModule;
  activeContext?: Partial<ModuleContextPayload>;
  children: React.ReactNode;
  onExecuteCrossModuleAction?: (action: CrossModuleAction) => void;
}

export const UnifiedAssistantProvider: React.FC<UnifiedAssistantProviderProps> = ({
  userId,
  initialModule = 'dashboard',
  activeContext,
  children,
  onExecuteCrossModuleAction,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<ActiveAppModule>(initialModule);
  const [currentContext, setCurrentContext] = useState<ModuleContextPayload>({
    activeModule: initialModule,
    ...activeContext,
  });

  // Keep active module in sync if prop changes
  useEffect(() => {
    if (initialModule && initialModule !== activeModule) {
      setActiveModule(initialModule);
      setCurrentContext((prev) => ({
        ...prev,
        activeModule: initialModule,
      }));
    }
  }, [initialModule]);

  // Keep context in sync if activeContext prop updates
  useEffect(() => {
    if (activeContext) {
      setCurrentContext((prev) => ({
        ...prev,
        ...activeContext,
        activeModule: activeContext.activeModule || prev.activeModule,
      }));
      if (activeContext.activeModule && activeContext.activeModule !== activeModule) {
        setActiveModule(activeContext.activeModule);
      }
    }
  }, [activeContext]);

  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);

  // Load conversations on mount or user change
  useEffect(() => {
    let isMounted = true;
    async function initConversations() {
      try {
        const loaded = await loadUnifiedConversations(userId);
        if (isMounted) {
          setConversations(loaded);
          if (loaded.length > 0 && !activeConversationId) {
            setActiveConversationId(loaded[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load unified conversations:', err);
      }
    }
    initConversations();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const setModuleContext = useCallback((ctx: Partial<ModuleContextPayload>) => {
    setCurrentContext((prev) => ({
      ...prev,
      ...ctx,
      activeModule: ctx.activeModule || prev.activeModule,
    }));
    if (ctx.activeModule) {
      setActiveModule(ctx.activeModule);
    }
  }, []);

  const startNewConversation = useCallback(
    (mod?: ActiveAppModule) => {
      const targetMod = mod || activeModule;
      const fresh = createNewConversation(userId, targetMod);
      setConversations((prev) => [fresh, ...prev]);
      setActiveConversationId(fresh.id);
      saveUnifiedConversation(userId, fresh);
    },
    [userId, activeModule]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setErrorMessage(null);
  }, []);

  const deleteConversationById = useCallback(
    async (id: string) => {
      await deleteUnifiedConversation(userId, id);
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (activeConversationId === id) {
          setActiveConversationId(filtered[0]?.id || null);
        }
        return filtered;
      });
    },
    [userId, activeConversationId]
  );

  const renameConversationById = useCallback(
    async (id: string, newTitle: string) => {
      const updated = await renameUnifiedConversation(userId, id, newTitle);
      if (updated) {
        setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    },
    [userId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setErrorMessage(null);
      setLastUserMessage(text.trim());

      let conv = activeConversation;
      if (!conv) {
        conv = createNewConversation(userId, activeModule);
        setConversations((prev) => [conv!, ...prev]);
        setActiveConversationId(conv.id);
      }

      const userMsg: UnifiedChatMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
        activeModule,
      };

      const intermediateConv: UnifiedConversation = {
        ...conv,
        updatedAt: new Date().toISOString(),
        lastActiveModule: activeModule,
        messages: [...conv.messages, userMsg],
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === intermediateConv.id ? intermediateConv : c))
      );
      await saveUnifiedConversation(userId, intermediateConv);

      setIsLoading(true);
      try {
        const historyForApi = intermediateConv.messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        const response = await requestUnifiedAssistantChat({
          message: text.trim(),
          conversationId: intermediateConv.id,
          history: historyForApi,
          context: {
            ...currentContext,
            activeModule,
          },
        });

        const assistantMsg: UnifiedChatMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          timestamp: new Date().toISOString(),
          activeModule,
          action: response.action,
          isFallback: response.isFallback,
          generationSource: response.generationSource,
          verifiedDataDisclosures: response.verifiedDataDisclosures,
          aiSuggestionsDisclosures: response.aiSuggestionsDisclosures,
        };

        const finalizedConv: UnifiedConversation = {
          ...intermediateConv,
          updatedAt: new Date().toISOString(),
          messages: [...intermediateConv.messages, assistantMsg],
        };

        setConversations((prev) =>
          prev.map((c) => (c.id === finalizedConv.id ? finalizedConv : c))
        );
        await saveUnifiedConversation(userId, finalizedConv);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to reach AI assistant.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversation, userId, activeModule, currentContext, isLoading]
  );

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage) {
      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  const approveAndExecuteAction = useCallback(
    async (action: CrossModuleAction) => {
      if (!activeConversation) return;

      const updatedAction: CrossModuleAction = {
        ...action,
        status: 'approved',
        executedAt: new Date().toISOString(),
      };

      const updatedMessages = activeConversation.messages.map((m) =>
        m.action?.id === action.id ? { ...m, action: updatedAction } : m
      );

      const updatedConv: UnifiedConversation = {
        ...activeConversation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
      await saveUnifiedConversation(userId, updatedConv);

      if (onExecuteCrossModuleAction) {
        onExecuteCrossModuleAction(updatedAction);
      }
    },
    [activeConversation, userId, onExecuteCrossModuleAction]
  );

  const dismissAction = useCallback(
    (actionId: string) => {
      if (!activeConversation) return;

      const updatedMessages = activeConversation.messages.map((m) =>
        m.action?.id === actionId
          ? { ...m, action: { ...m.action, status: 'dismissed' as const } }
          : m
      );

      const updatedConv: UnifiedConversation = {
        ...activeConversation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
      saveUnifiedConversation(userId, updatedConv);
    },
    [activeConversation, userId]
  );

  const openAssistant = useCallback(
    (options?: {
      prompt?: string;
      module?: ActiveAppModule;
      context?: Partial<ModuleContextPayload>;
    }) => {
      if (options?.module) {
        setActiveModule(options.module);
      }
      if (options?.context) {
        setModuleContext(options.context);
      }
      setIsOpen(true);
      if (options?.prompt) {
        setTimeout(() => {
          sendMessage(options.prompt!);
        }, 100);
      }
    },
    [setModuleContext, sendMessage]
  );

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <UnifiedAssistantContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        activeModule,
        setActiveModule,
        setModuleContext,
        currentContext,
        conversations,
        activeConversation,
        selectConversation,
        startNewConversation,
        deleteConversationById,
        renameConversationById,
        sendMessage,
        approveAndExecuteAction,
        dismissAction,
        isLoading,
        errorMessage,
        retryLastMessage,
      }}
    >
      {children}
    </UnifiedAssistantContext.Provider>
  );
};

export function useUnifiedAssistant(): UnifiedAssistantContextType {
  const context = useContext(UnifiedAssistantContext);
  if (!context) {
    throw new Error('useUnifiedAssistant must be used within a UnifiedAssistantProvider');
  }
  return context;
}
