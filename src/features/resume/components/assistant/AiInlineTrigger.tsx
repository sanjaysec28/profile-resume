/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Inline AI Assistant Trigger Button
 * A clean, compact trigger button embedded next to input fields and section headers
 * to launch the AI content assistant with pre-populated context.
 */

import React, { useState } from 'react';
import { FilePenLine, ChevronDown } from 'lucide-react';
import { ContentAssistantAction, ContentAssistantSection } from '../../../../types/assistant.ts';

interface AiInlineTriggerProps {
  section: ContentAssistantSection;
  onOpenAssistant: (section: ContentAssistantSection, action: ContentAssistantAction) => void;
  className?: string;
  compact?: boolean;
  label?: string;
}

export function AiInlineTrigger({
  section,
  onOpenAssistant,
  className = '',
  compact = false,
  label = 'AI Assist',
}: AiInlineTriggerProps) {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  const quickActions: { action: ContentAssistantAction; label: string }[] = [
    { action: 'generate', label: 'Generate Draft' },
    { action: 'improve', label: 'Improve & Polish' },
    { action: 'concise', label: 'Make Concise' },
    { action: 'ats_keywords', label: 'Boost ATS Keywords' },
    { action: 'role_target', label: 'Tailor for Role' },
    { action: 'fix_grammar', label: 'Fix Grammar' },
  ];

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="inline-flex items-center rounded-xl bg-white border border-[#DDD5C7] shadow-2xs hover:border-[#101010] transition-colors overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenAssistant(section, 'improve')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer ${
            compact ? 'text-[11px] px-2 py-0.5' : ''
          }`}
          title="Open AI Content Assistant"
        >
          <FilePenLine className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{label}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className="px-1.5 py-1 text-[#666666] hover:text-[#101010] hover:bg-[#FAF9F5] border-l border-[#DDD5C7] transition-colors cursor-pointer"
          aria-label="More AI options"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {isOpenMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpenMenu(false)}
          />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#E5E0D8] py-1 z-50 text-left animate-page-enter">
            <div className="px-3 py-1 text-[10px] font-bold text-[#888888] uppercase tracking-wider border-b border-[#F0EBE1]">
              AI Writing Actions
            </div>
            {quickActions.map((qa) => (
              <button
                key={qa.action}
                type="button"
                onClick={() => {
                  setIsOpenMenu(false);
                  onOpenAssistant(section, qa.action);
                }}
                className="w-full px-3 py-1.5 text-xs text-[#171513] hover:bg-[#FAF5EC] hover:text-[#8C6D1F] text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{qa.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
