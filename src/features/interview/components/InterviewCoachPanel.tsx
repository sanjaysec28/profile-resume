/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 6: AI Interview Coach & Mentor Panel
 * Interactive conversational mentor for technical drills, answer breakdowns, and placement guidance.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Bot,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { InterviewCoachMessage } from '../../../types/interviewIntelligence.ts';
import { askInterviewCoach } from '../../../lib/interviewIntelligenceService.ts';

interface InterviewCoachPanelProps {
  targetRole: string;
  academicYear?: string;
  degree?: string;
  verifiedSkills?: string[];
  weakTopics?: string[];
  recentMockScore?: number;
  resumeProjects?: string[];
}

export const InterviewCoachPanel: React.FC<InterviewCoachPanelProps> = ({
  targetRole,
  academicYear,
  degree,
  verifiedSkills = [],
  weakTopics = [],
  recentMockScore,
  resumeProjects = [],
}) => {
  const [messages, setMessages] = useState<InterviewCoachMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **ProFile AI Interview Coach**. I am calibrated for your target role as **${targetRole}**.\n\nYou can ask me to:\n- Conduct a rapid technical drill on any language, framework, or SQL concept\n- Help you articulate your resume projects and architectural decisions\n- Rehearse STAR-format answers for behavioral rounds\n- Break down tricky DSA patterns\n\nWhat would you like to practice today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    `Run a 3-question technical drill for ${targetRole}`,
    'How should I explain my primary project architecture to an interviewer?',
    'Give me 3 tough SQL and database index questions',
    'Help me polish my STAR answer for "Tell me about a challenging bug"',
    'What are the most common fresher interview traps?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: InterviewCoachMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await askInterviewCoach(text, messages, {
        targetRole,
        academicYear,
        degree,
        verifiedSkills,
        weakTopics,
        recentMockScore,
        resumeProjects,
      });

      const assistantMsg: InterviewCoachMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const fallbackMsg: InterviewCoachMessage = {
        id: `asst_err_${Date.now()}`,
        role: 'assistant',
        content: `I ran into an issue connecting to the coach service: ${errMsg}. Please try asking your question again in a moment.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
          <Bot className="w-3.5 h-3.5" />
          <span>Conversational Interview Coach</span>
        </div>
        <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
          AI Interview Mentor & Drill Partner
        </h2>
        <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
          Ask questions, get personalized drill prompts, and learn how to communicate complex technical concepts
          cleanly to hiring managers.
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Lightbulb className="w-4 h-4 text-[#888888] shrink-0" />
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-full text-xs text-[#101010] font-medium hover:border-[#101010] hover:bg-[#FAF9F5] transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Messages List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#101010] text-[#F8F5EE]'
                      : 'bg-[#FAF9F5] border border-[#E5E0D8] text-[#101010]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#101010] text-[#F8F5EE] rounded-tr-none'
                      : 'bg-[#FAF9F5] border border-[#E8E2D7] text-[#101010] rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  <div>{msg.content}</div>

                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-[#E8E2D7]/60 flex items-center justify-between text-[11px] text-[#888888]">
                      <span>ProFile Placement Coach</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 hover:text-[#101010] transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-[#E5E0D8] text-[#101010] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 bg-[#FAF9F5] border border-[#E8E2D7] rounded-2xl rounded-tl-none text-xs text-[#666666] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#101010] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#101010] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#101010] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-medium">Coach is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[#E8E2D7] bg-[#FAF9F5]/60 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask a technical question, request a drill, or test an answer for ${targetRole}...`}
            className="flex-1 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
