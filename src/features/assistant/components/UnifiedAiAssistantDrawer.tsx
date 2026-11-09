/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.1: Unified AI Assistant UI Drawer & Floating Trigger
 * Centralized platform-wide assistant with cross-module context chips,
 * conversation management, action approval cards, and transparent safety disclosures.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  FileText,
  TrendingUp,
  FolderGit2,
  Target,
  Clock,
  Layers,
} from 'lucide-react';
import { useUnifiedAssistant } from '../UnifiedAssistantContext.tsx';
import { ActiveAppModule, CrossModuleAction } from '../../../types/unifiedAssistant.ts';

const MODULE_DISPLAY_NAMES: Record<ActiveAppModule, string> = {
  dashboard: 'Dashboard',
  resume_builder: 'Resume Builder',
  ats_checker: 'ATS Scanner',
  resume_review: 'Resume Review',
  career_roadmap: 'Career Roadmap',
  job_discovery: 'Job Discovery',
  application_tracker: 'Application Tracker',
  interview_prep: 'Interview Prep',
};

const MODULE_QUICK_PROMPTS: Record<ActiveAppModule, string[]> = {
  dashboard: [
    'Review my career goals and recent progress milestones',
    'Check for profile contradictions or missing skills',
    'Review my placement readiness across the 5 dimensions',
    'What is my top priority milestone right now?',
  ],
  resume_builder: [
    'How can I improve my project bullet points with metrics?',
    'Review my summary statement for impact',
    'Ensure zero conversational AI text or placeholders remain',
  ],
  ats_checker: [
    'Why is my keyword match score low for this role?',
    'What critical missing keywords should I incorporate?',
    'Explain how ATS software parses my project headings',
  ],
  resume_review: [
    'Review my active career goals and check for profile contradictions',
    'What are the most urgent fixes before PDF export?',
    'Audit my resume against engineering placement standards',
  ],
  career_roadmap: [
    'Recommend my next technical learning milestone',
    'How do I bridge the gap in database indexing?',
    'Connect missing skills to my existing projects',
  ],
  job_discovery: [
    'Evaluate my eligibility for this opening',
    'What is the difference between required and preferred qualifications?',
    'Suggest how to tailor my resume for this job',
  ],
  application_tracker: [
    'Draft a polite recruiter follow-up email (7 days post-apply)',
    'What should I prepare for an upcoming technical assessment?',
    'How do I handle an application stage transition?',
  ],
  interview_prep: [
    'Quiz me on PostgreSQL B-Tree indexes and sequential scans',
    'Give me a behavioral question using the STAR method',
    'Help me defend the architecture of my flagship project',
  ],
};

export const UnifiedAiAssistantDrawer: React.FC = () => {
  const {
    isOpen,
    openAssistant,
    closeAssistant,
    activeModule,
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
  } = useUnifiedAssistant();

  const [inputVal, setInputVal] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeConversation?.messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    const text = inputVal;
    setInputVal('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameText(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (renameText.trim()) {
      await renameConversationById(id, renameText.trim());
    }
    setRenamingId(null);
  };

  const quickPrompts = MODULE_QUICK_PROMPTS[activeModule] || MODULE_QUICK_PROMPTS.dashboard;

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Visible on all views) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => openAssistant()}
          className="fixed bottom-6 right-6 z-40 bg-[#101010] text-[#F8F5EE] px-4 py-3 rounded-2xl shadow-xl hover:bg-[#262626] transition-all cursor-pointer flex items-center gap-2.5 group border border-stone-800"
          aria-label="Open ProFile AI Assistant"
        >
          <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5 text-stone-200" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">ProFile AI</p>
            <p className="text-[10px] text-stone-400 font-medium leading-tight">
              {MODULE_DISPLAY_NAMES[activeModule]}
            </p>
          </div>
        </button>
      )}

      {/* 2. UNIFIED ASSISTANT SLIDE-OVER DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-[#FAF9F5] border-l border-[#E5E0D8] w-full max-w-lg h-full flex flex-col shadow-2xl relative">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#E5E0D8] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-[#101010]">ProFile AI Assistant</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-full text-[#666666] font-semibold">
                      {MODULE_DISPLAY_NAMES[activeModule]}
                    </span>
                    {currentContext?.studentGoalsSnapshot?.targetRole && (
                      <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-amber-800 font-semibold truncate max-w-[150px]">
                        Target: {currentContext.studentGoalsSnapshot.targetRole}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#888888] truncate max-w-[220px]">
                    {activeConversation?.title || 'New Conversation'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    isHistoryOpen
                      ? 'bg-[#101010] text-white border-[#101010]'
                      : 'bg-white border-[#E5E0D8] text-[#666666] hover:bg-[#FAF9F5]'
                  }`}
                  title="Conversation History"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">History</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    startNewConversation();
                    setIsHistoryOpen(false);
                  }}
                  className="p-2 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  title="Start New Conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={closeAssistant}
                  className="p-2 text-[#888888] hover:text-[#101010] rounded-xl hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation History Dropdown / Panel */}
            {isHistoryOpen && (
              <div className="bg-white border-b border-[#E5E0D8] p-4 max-h-60 overflow-y-auto space-y-2 animate-fadeIn z-10 shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
                  <span className="text-xs font-bold text-[#101010]">Saved Conversations</span>
                  <button
                    type="button"
                    onClick={() => startNewConversation()}
                    className="text-xs text-[#101010] font-semibold hover:underline cursor-pointer"
                  >
                    + New Thread
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <p className="text-xs text-[#888888] py-2 text-center">No conversation history yet.</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        conv.id === activeConversation?.id
                          ? 'bg-[#FAF9F5] border-[#101010]'
                          : 'bg-white border-[#E5E0D8] hover:border-[#CCCCCC]'
                      }`}
                    >
                      {renamingId === conv.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            className="text-xs bg-[#FAF9F5] border border-[#E5E0D8] rounded-md px-2 py-1 flex-1 text-[#101010]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(conv.id)}
                            className="text-[11px] font-bold text-[#101010] px-2 py-0.5 bg-stone-200 rounded cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            selectConversation(conv.id);
                            setIsHistoryOpen(false);
                          }}
                          className="text-left flex-1 truncate cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-[#101010] truncate">{conv.title}</p>
                          <span className="text-[10px] text-[#888888]">
                            {new Date(conv.updatedAt).toLocaleDateString()} • {conv.messages.length} messages
                          </span>
                        </button>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {renamingId !== conv.id && (
                          <button
                            type="button"
                            onClick={() => startRename(conv.id, conv.title)}
                            className="p-1 text-[#888888] hover:text-[#101010] cursor-pointer"
                            title="Rename"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteConversationById(conv.id)}
                          className="p-1 text-[#888888] hover:text-[#ef4444] cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeConversation?.messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isSystem = msg.role === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <p className="text-[11px] text-[#888888] bg-white border border-[#E5E0D8] rounded-full px-3 py-1 inline-block">
                        {msg.content}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#101010] text-[#F8F5EE] rounded-tr-xs shadow-xs'
                          : 'bg-white border border-[#E5E0D8] text-[#101010] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {/* Markdown-like Paragraph Rendering */}
                      <div className="whitespace-pre-wrap space-y-2">{msg.content}</div>

                      {/* Verified Data Disclosures */}
                      {!isUser && msg.verifiedDataDisclosures && msg.verifiedDataDisclosures.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#E5E0D8]/60 space-y-1">
                          {msg.verifiedDataDisclosures.map((d, idx) => (
                            <p key={idx} className="text-[10px] text-[#22c55e] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#22c55e]" />
                              <span>{d}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* AI Suggestions Disclosures */}
                      {!isUser && msg.aiSuggestionsDisclosures && msg.aiSuggestionsDisclosures.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {msg.aiSuggestionsDisclosures.map((d, idx) => (
                            <p key={idx} className="text-[10px] text-[#888888] italic">
                              • {d}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Fallback Mode Label */}
                      {!isUser && msg.isFallback && (
                        <div className="mt-2 text-[10px] text-[#888888] bg-[#FAF9F5] border border-[#E5E0D8] rounded-md px-2 py-0.5 inline-block">
                          Mode: Deterministic Guidance Engine
                        </div>
                      )}
                    </div>

                    {/* Prepared Cross-Module Action Card (With Mandatory Approval Safeguard) */}
                    {!isUser && msg.action && (
                      <div className="mt-2.5 max-w-[88%] w-full bg-white border-2 border-[#101010] rounded-2xl p-4 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#101010]" />
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#101010]">
                            Proposed Action (Requires Approval)
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#101010]">{msg.action.title}</h4>
                        <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
                          {msg.action.description}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-[#E5E0D8] flex items-center justify-between gap-2">
                          {msg.action.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => dismissAction(msg.action!.id)}
                                className="px-3 py-1.5 bg-white border border-[#E5E0D8] text-[#888888] rounded-xl text-xs font-medium hover:bg-[#FAF9F5] cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                onClick={() => approveAndExecuteAction(msg.action!)}
                                className="px-4 py-1.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-bold hover:bg-[#262626] cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <span>Approve & Execute</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : msg.action.status === 'approved' ? (
                            <span className="text-xs font-bold text-[#22c55e] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                              <span>Action Approved & Executed</span>
                            </span>
                          ) : (
                            <span className="text-xs text-[#888888] italic">Action Dismissed</span>
                          )}
                        </div>
                      </div>
                    )}

                    <span className="text-[9px] text-[#888888] mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-[#888888] bg-white border border-[#E5E0D8] rounded-2xl p-3 max-w-[180px] shadow-xs animate-pulse">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-[#101010]" />
                  <span>Analyzing context...</span>
                </div>
              )}

              {/* Error Message & Retry */}
              {errorMessage && (
                <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl text-xs text-[#b91c1c] flex items-center justify-between gap-2">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={retryLastMessage}
                    className="font-bold underline cursor-pointer hover:text-[#7f1d1d]"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Context Quick-Prompt Chips */}
            <div className="p-3 bg-white border-t border-[#E5E0D8] overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-max">
                <span className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider mr-1">
                  Quick Prompts:
                </span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="px-2.5 py-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-lg text-[11px] text-[#101010] hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#E5E0D8] flex items-end gap-2">
              <textarea
                rows={2}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask anything about ${MODULE_DISPLAY_NAMES[activeModule]}...`}
                className="flex-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs sm:text-sm text-[#101010] focus:outline-hidden resize-none"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="p-3 bg-[#101010] text-[#F8F5EE] rounded-xl hover:bg-[#262626] transition-colors cursor-pointer disabled:opacity-40"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
