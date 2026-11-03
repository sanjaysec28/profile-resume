/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Edit Recommendation Modal
 * Accessible modal allowing students to refine skill names, descriptions, or notes
 * before approving a recommendation.
 */

import React, { useState } from 'react';
import { BaseRecommendation } from '../../../../types/recommendations.ts';
import { X, Check, Edit3 } from 'lucide-react';

interface EditRecommendationModalProps {
  item: BaseRecommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: BaseRecommendation) => void;
}

export function EditRecommendationModal({
  item,
  isOpen,
  onClose,
  onSave,
}: EditRecommendationModalProps) {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title);
  const [explanation, setExplanation] = useState(item.explanation);
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...item,
      title: title.trim(),
      explanation: explanation.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#171513]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E5E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] z-10 animate-page-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFECE6] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171513] text-white flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#171513]">
                Edit Recommendation
              </h3>
              <p className="text-xs text-[#7A7368]">
                Customize this suggestion to match your genuine background
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EFECE6] text-[#7A7368] hover:text-[#171513] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#171513]">
              Title / Skill Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] text-sm text-[#171513] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#171513]">
              Explanation / Context
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] text-sm text-[#171513] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#171513]">
              Personal Notes or Portfolio Link (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Completed during Database Systems course project"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CFC4] bg-[#FAF8F5] text-sm text-[#171513] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D5CFC4] text-xs font-semibold text-[#171513] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
