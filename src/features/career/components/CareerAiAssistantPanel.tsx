/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Career Assistant Q&A Panel
 * Context-aware engineering mentor answering role-specific questions
 * without false placement guarantees.
 */

import { useState } from 'react';
import {
  CareerPlan,
  CareerChatMessage,
} from '../../../types/careerIntelligence.ts';
import { askCareerAssistant } from '../../../lib/careerIntelligenceService.ts';
import { InterviewDashboardMetrics } from '../../../types/interviewIntelligence.ts';
import {
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface CareerAiAssistantPanelProps {
  careerPlan: CareerPlan;
  interviewMetrics?: InterviewDashboardMetrics | null;
}

const SUGGESTED_QUESTIONS = [
  'What should I learn next to improve my readiness score?',
  'Suggest a project architecture using my current skills.',
  'How can I prepare for technical interviews for this role?',
  'Which topics should I prioritize before campus placements?',
];

export function CareerAiAssistantPanel({ careerPlan, interviewMetrics }: CareerAiAssistantPanelProps) {
  const [messages, setMessages] = useState<CareerChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your ProFile Career Intelligence Mentor. I have reviewed your current profile for the role of **${careerPlan.targetRole}**. I can help you prioritize next skills, plan projects, or get ready for technical interviews. What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuery).trim();
    if (!q || isLoading) return;

    const userMsg: CareerChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await askCareerAssistant(q, messages, careerPlan, interviewMetrics);
      const assistantMsg: CareerChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg: CareerChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an issue connecting to the AI career service. Please try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-5 sm:p-6 shadow-2xs flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE3] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F]">
            <Bot className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#101010]">AI Career Mentor</h4>
            <p className="text-[11px] text-[#777777]">
              Context: {careerPlan.targetRole} • {careerPlan.readiness.readinessLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 border-b border-[#F0ECE3]">
        <Lightbulb className="w-3.5 h-3.5 text-[#8C6D1F] shrink-0 ml-1" />
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#FAF9F5] hover:bg-[#F2ECE1] border border-[#E5E0D8] text-[#555555] hover:text-[#101010] transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F] shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#101010] text-white rounded-tr-none'
                  : 'bg-[#FAF9F5] border border-[#E5E0D8] text-[#222222] rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line font-sans">{m.content}</div>
              <span
                className={`text-[9px] block text-right mt-1 ${
                  m.role === 'user' ? 'text-neutral-400' : 'text-[#888888]'
                }`}
              >
                {m.timestamp}
              </span>
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#101010] text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#777777] bg-[#FAF9F5] p-3 rounded-2xl max-w-xs border border-[#E5E0D8]">
            <Loader2 className="w-4 h-4 text-[#8C6D1F] animate-spin shrink-0" />
            <span>Consulting Career Intelligence model...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="pt-3 border-t border-[#F0ECE3] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${careerPlan.targetRole} roadmap, projects, or interviews...`}
          className="flex-1 text-xs p-2.5 rounded-xl border border-[#D5CFC5] bg-[#FAF9F5] text-[#101010] outline-none focus:ring-1 focus:ring-[#101010]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#101010] text-white text-xs font-semibold hover:bg-[#252525] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
}
