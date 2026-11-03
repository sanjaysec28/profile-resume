/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 3: Resume Section Management Modal
 * Allows students to:
 * - Add and remove optional sections
 * - Reorder sections (Move up / down)
 * - Edit custom section headings
 * - Reset to role-recommended order based on Phase 1 setup and Phase 2 recommendations
 */

import React, { useState } from 'react';
import {
  Layers,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_RESUME_SECTIONS, SectionConfigItem, ContentAssistantSection } from '../../../../types/assistant.ts';
import { ResumeData } from '../../../../types/resume.ts';
import { ResumeSetupData } from '../../../../types/resumeSetup.ts';
import { ResumeRecommendationsData } from '../../../../types/recommendations.ts';

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  resumeSetup?: ResumeSetupData | null;
  recommendations?: ResumeRecommendationsData | null;
  onSaveSectionConfig: (config: {
    sectionOrder: string[];
    sectionVisibility: Record<string, boolean>;
    customHeadings: Record<string, string>;
  }) => void;
}

export function SectionManagerModal({
  isOpen,
  onClose,
  resumeData,
  resumeSetup,
  recommendations,
  onSaveSectionConfig,
}: SectionManagerModalProps) {
  // Initialize current order, visibility, and headings
  const [sections, setSections] = useState<SectionConfigItem[]>(() => {
    const existingOrder = resumeData.sectionOrder;
    const visibility = resumeData.sectionVisibility || {};
    const headings = resumeData.customHeadings || {};

    let list: SectionConfigItem[] = [];

    if (existingOrder && existingOrder.length > 0) {
      // Build order from stored order
      for (const id of existingOrder) {
        const found = DEFAULT_RESUME_SECTIONS.find((s) => s.id === id);
        if (found) {
          list.push({
            ...found,
            defaultHeading: headings[id] || found.defaultHeading,
            isVisible: visibility[id] !== undefined ? visibility[id] : found.isVisible,
          });
        }
      }
      // Add any missing default sections
      for (const def of DEFAULT_RESUME_SECTIONS) {
        if (!list.some((s) => s.id === def.id)) {
          list.push({
            ...def,
            defaultHeading: headings[def.id] || def.defaultHeading,
            isVisible: visibility[def.id] !== undefined ? visibility[def.id] : def.isVisible,
          });
        }
      }
    } else {
      list = DEFAULT_RESUME_SECTIONS.map((def) => ({
        ...def,
        defaultHeading: headings[def.id] || def.defaultHeading,
        isVisible: visibility[def.id] !== undefined ? visibility[def.id] : def.isVisible,
      }));
    }

    return list;
  });

  const [editingHeadingId, setEditingHeadingId] = useState<string | null>(null);
  const [tempHeadingText, setTempHeadingText] = useState('');

  if (!isOpen) return null;

  // Move section up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...sections];
    const item = next[index];
    next[index] = next[index - 1];
    next[index - 1] = item;
    setSections(next);
  };

  // Move section down
  const handleMoveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const next = [...sections];
    const item = next[index];
    next[index] = next[index + 1];
    next[index + 1] = item;
    setSections(next);
  };

  // Toggle optional section visibility
  const handleToggleVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === id) {
          // If mandatory core, keep visible
          if (!sec.isOptional) return sec;
          return { ...sec, isVisible: !sec.isVisible };
        }
        return sec;
      })
    );
  };

  // Start editing heading
  const handleStartEditHeading = (sec: SectionConfigItem) => {
    setEditingHeadingId(sec.id);
    setTempHeadingText(sec.defaultHeading);
  };

  // Save edited heading
  const handleSaveHeading = (id: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === id ? { ...sec, defaultHeading: tempHeadingText.trim() || sec.title } : sec
      )
    );
    setEditingHeadingId(null);
  };

  // Reset to recommended order based on purpose & recommendations
  const handleResetToRecommended = () => {
    const isInternOrFresher =
      resumeSetup?.purpose === 'fresher' || resumeSetup?.purpose === 'campus-placement';

    let recommendedOrderIds: ContentAssistantSection[] = [];
    if (isInternOrFresher) {
      // Students/Interns: Education and Projects prioritized over Experience
      recommendedOrderIds = [
        'summary',
        'education',
        'technical_skills',
        'projects',
        'experience',
        'soft_skills',
        'certifications',
        'achievements',
        'positions_of_responsibility',
        'coursework',
      ];
    } else {
      // Full-time: Experience and Projects first
      recommendedOrderIds = [
        'summary',
        'technical_skills',
        'experience',
        'projects',
        'education',
        'soft_skills',
        'certifications',
        'achievements',
        'positions_of_responsibility',
        'coursework',
      ];
    }

    const reordered: SectionConfigItem[] = [];
    for (const id of recommendedOrderIds) {
      const match = sections.find((s) => s.id === id);
      if (match) {
        reordered.push({ ...match, isVisible: true });
      }
    }
    setSections(reordered);
  };

  // Commit changes to parent
  const handleApplyConfig = () => {
    const sectionOrder = sections.map((s) => s.id);
    const sectionVisibility: Record<string, boolean> = {};
    const customHeadings: Record<string, string> = {};

    for (const sec of sections) {
      sectionVisibility[sec.id] = sec.isVisible;
      customHeadings[sec.id] = sec.defaultHeading;
    }

    onSaveSectionConfig({
      sectionOrder,
      sectionVisibility,
      customHeadings,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-page-enter"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171513] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Resume Section Management
              </h3>
              <p className="text-xs text-[#A8A196]">
                Reorder, rename headings, and toggle optional sections
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A8A196] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Section Manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header / Reset Button */}
        <div className="px-6 py-3 bg-[#F2EDE4] border-b border-[#E2DBD0] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#655F55]">
            Targeting: <strong className="text-[#171513]">{resumeSetup?.targetRole.title || 'Target Role'}</strong>
          </div>
          <button
            type="button"
            onClick={handleResetToRecommended}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#D5CEC2] text-xs font-semibold text-[#171513] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8C6D1F]" />
            <span>Reset to AI-Recommended Order</span>
          </button>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {sections.map((sec, idx) => {
            const isEditing = editingHeadingId === sec.id;
            const isFirst = idx === 0;
            const isLast = idx === sections.length - 1;

            return (
              <div
                key={sec.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  sec.isVisible
                    ? 'bg-white border-[#E0D8CB] shadow-2xs'
                    : 'bg-[#F0ECE4]/60 border-dashed border-[#D5CEC2] opacity-70'
                }`}
              >
                {/* Drag / Index order indicator & Section Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-full bg-[#171513] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempHeadingText}
                          onChange={(e) => setTempHeadingText(e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-[#171513] bg-white focus:outline-none flex-1 font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHeading(sec.id);
                            if (e.key === 'Escape') setEditingHeadingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveHeading(sec.id)}
                          className="p-1 rounded-lg bg-[#171513] text-white hover:bg-[#2A2724]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171513] truncate">
                          {sec.defaultHeading}
                        </span>
                        {sec.defaultHeading !== sec.title && (
                          <span className="text-[10px] text-[#888888] italic">
                            ({sec.title})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEditHeading(sec)}
                          className="p-1 rounded text-[#888888] hover:text-[#171513] transition-colors"
                          title="Rename Section Heading"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#777777]">
                        {sec.isOptional ? 'Optional Section' : 'Core Section (Recommended)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls: Visibility Toggle & Order Shift */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {sec.isOptional && (
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(sec.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                        sec.isVisible
                          ? 'bg-[#FAF5EC] text-[#8C6D1F] border border-[#E8DEC8]'
                          : 'bg-[#EAE5DC] text-[#777777] border border-[#DDD5C7]'
                      }`}
                      title={sec.isVisible ? 'Hide Section from Resume' : 'Show Section on Resume'}
                    >
                      {sec.isVisible ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Reorder Buttons */}
                  <div className="inline-flex items-center rounded-xl border border-[#D5CEC2] overflow-hidden bg-white">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveUp(idx)}
                      className="p-1 text-[#666666] hover:text-[#171513] hover:bg-[#FAF9F5] disabled:opacity-25 transition-colors cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-[#D5CEC2]" />
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveDown(idx)}
                      className="p-1 text-[#666666] hover:text-[#171513] hover:bg-[#FAF9F5] disabled:opacity-25 transition-colors cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F2EDE4] border-t border-[#E2DBD0] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D5CEC2] bg-white text-xs font-semibold text-[#524E48] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyConfig}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Apply Section Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
