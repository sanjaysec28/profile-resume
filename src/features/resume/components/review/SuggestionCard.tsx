/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Actionable Suggestion Card
 * Strict review item with evidence quote, editable improvement,
 * placeholder verification guard, and approval actions.
 */

import { useState } from 'react';
import { ReviewSuggestion, ReviewSuggestionStatus } from '../../../../types/resumeReview.ts';
import {
  Check,
  Edit2,
  X,
  AlertTriangle,
  ScanSearch,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Tag,
  Clock,
} from 'lucide-react';

interface SuggestionCardProps {
  suggestion: ReviewSuggestion;
  onApply: (suggestion: ReviewSuggestion, confirmedText: string) => void;
  onDismiss: (suggestion: ReviewSuggestion) => void;
  onUpdateText: (suggestion: ReviewSuggestion, newText: string) => void;
}

export function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  onUpdateText,
}: SuggestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion.recommendedImprovement);
  const [placeholderWarning, setPlaceholderWarning] = useState<string | null>(null);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const hasUnfilledPlaceholders = (text: string) => {
    return /\[[^\]]+\]/.test(text);
  };

  const handleApplyClick = () => {
    // If text still contains bracket placeholders like [X%], warn the user
    if (hasUnfilledPlaceholders(editedText)) {
      setPlaceholderWarning(
        'Please replace bracket placeholders (e.g. [X%]) with your verified numbers or delete them before applying.'
      );
      setIsEditing(true);
      return;
    }
    setPlaceholderWarning(null);
    onApply(suggestion, editedText);
  };

  const handleSaveEdit = () => {
    onUpdateText(suggestion, editedText);
    setIsEditing(false);
  };

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all ${
        suggestion.status === 'applied'
          ? 'bg-[#F2F8F4] border-[#C8E4D1] opacity-80'
          : suggestion.status === 'dismissed'
          ? 'bg-[#F9F9F8] border-[#E8E6E2] opacity-60'
          : 'bg-white border-[#E5E0D8] shadow-2xs hover:border-[#D5CFC5]'
      }`}
    >
      {/* Top Header: Section + Priority + Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(
              suggestion.priority
            )}`}
          >
            {suggestion.priority} priority
          </span>
          <span className="text-xs font-semibold text-[#555555] bg-[#FAF5EC] border border-[#E8DEC8] px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#8C6D1F]" />
            <span className="capitalize">{suggestion.section.replace('_', ' ')}</span>
          </span>
        </div>

        {suggestion.status === 'applied' && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            Applied
          </span>
        )}

        {suggestion.status === 'dismissed' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#888888] bg-[#EFECE6] px-2.5 py-0.5 rounded-full">
            Dismissed
          </span>
        )}
      </div>

      {/* Suggestion Title */}
      <h4 className="text-sm sm:text-base font-bold text-[#101010] mb-1.5 leading-snug">
        {suggestion.title}
      </h4>

      {/* Why It Matters */}
      <p className="text-xs text-[#555555] mb-3 leading-relaxed flex items-start gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-[#8C6D1F] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#333333]">Why it matters: </strong>
          {suggestion.whyItMatters}
        </span>
      </p>

      {/* Evidence from Actual Resume */}
      {suggestion.evidence && (
        <div className="mb-3 p-2.5 bg-[#FAF9F5] border-l-2 border-[#8C6D1F] rounded-r-xl text-xs text-[#555555]">
          <span className="font-semibold text-[#101010] block text-[11px] uppercase tracking-wider mb-0.5">
            Evidence from your resume:
          </span>
          <blockquote className="italic font-serif text-[#333333]">
            "{suggestion.evidence}"
          </blockquote>
        </div>
      )}

      {/* Recommended Improvement */}
      <div className="mb-3 p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
            <ScanSearch className="w-3.5 h-3.5 text-amber-500" />
            Recommended Improvement:
          </span>
          {!isEditing && suggestion.status === 'suggested' && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-[#8C6D1F] hover:text-[#705615] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit text</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editedText}
              onChange={(e) => {
                setEditedText(e.target.value);
                if (placeholderWarning && !hasUnfilledPlaceholders(e.target.value)) {
                  setPlaceholderWarning(null);
                }
              }}
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-[#D5CFC5] bg-white text-[#101010] focus:ring-1 focus:ring-[#101010] outline-none"
              placeholder="Refine this suggestion with your real information..."
            />
            {placeholderWarning && (
              <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {placeholderWarning}
              </p>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditedText(suggestion.recommendedImprovement);
                  setIsEditing(false);
                  setPlaceholderWarning(null);
                }}
                className="px-2.5 py-1 text-xs rounded-md text-[#666666] hover:bg-[#EFECE6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs rounded-md bg-[#101010] text-white font-medium hover:bg-[#252525] cursor-pointer"
              >
                Save Edits
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-[#222222] whitespace-pre-line leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-[#EAE5DC]">
              {editedText}
            </p>
            {hasUnfilledPlaceholders(editedText) && suggestion.status === 'suggested' && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Contains placeholders (e.g. <code>[X%]</code>). Click <strong>Edit text</strong> to supply your verified metrics.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expected Benefit */}
      <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100 mb-3.5">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          <strong>Expected benefit: </strong>
          {suggestion.expectedBenefit}
        </span>
      </div>

      {/* Action Buttons */}
      {suggestion.status === 'suggested' && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0ECE3]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#101010] text-white hover:bg-[#252525] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Suggestion</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-[#101010] hover:bg-[#FAF9F5] text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-[#777777]" />
              <span>Edit Suggestion</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(suggestion)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#888888] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      )}

      {/* If already applied or dismissed, offer undo/reapply */}
      {suggestion.status !== 'suggested' && (
        <div className="flex items-center justify-end pt-2 border-t border-[#F0ECE3]">
          <button
            type="button"
            onClick={() => onUpdateText(suggestion, suggestion.recommendedImprovement)}
            className="text-[11px] text-[#777777] hover:text-[#101010] underline cursor-pointer"
          >
            Reset suggestion state
          </button>
        </div>
      )}
    </div>
  );
}
