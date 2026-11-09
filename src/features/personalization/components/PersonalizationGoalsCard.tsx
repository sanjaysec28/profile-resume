/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.2: Student Personalization & Goals Overview Card
 * Renders verified student goals, target role, progress summary, and an edit trigger.
 */

import React, { useState } from 'react';
import {
  Compass,
  Target,
  Edit3,
  Calendar,
  Briefcase,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { StudentCareerGoals, StudentIntelligenceProfile } from '../../../types/personalization.ts';
import { StudentGoalsModal } from './StudentGoalsModal.tsx';

interface PersonalizationGoalsCardProps {
  userId?: string;
  goals: StudentCareerGoals;
  intelligence?: StudentIntelligenceProfile;
  onGoalsUpdated: (updated: StudentCareerGoals) => void;
  className?: string;
}

export const PersonalizationGoalsCard: React.FC<PersonalizationGoalsCardProps> = ({
  userId,
  goals,
  intelligence,
  onGoalsUpdated,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const contradictions = intelligence?.contradictionsOrGaps || [];

  return (
    <>
      <div
        className={`bg-white border border-[#E5E0D8] rounded-[24px] p-6 shadow-sm space-y-5 ${className}`}
      >
        {/* Header with Title & Edit Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Personalization Engine
                </span>
                <span className="text-xs text-[#777777]">Phase D.7.2</span>
              </div>
              <h3 className="text-base font-bold text-[#101010] mt-0.5">
                Career Goals &amp; Context Intelligence
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#E5E0D8] hover:bg-stone-200 text-xs font-semibold text-[#101010] transition-colors cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Goals</span>
          </button>
        </div>

        {/* Primary Goal Banner */}
        <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#101010] mb-1">
            <Target className="w-4 h-4 text-[#101010]" />
            <span>Primary Career Objective</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-[#101010] leading-relaxed">
            {goals.primaryCareerGoal || 'Define your primary career target'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#666666]">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-[#101010]" />
              <strong>Role:</strong> {goals.targetRole}
            </span>
            {goals.targetCompletionDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#101010]" />
                <strong>Target Date:</strong> {goals.targetCompletionDate}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#101010]" />
              <strong>Locations:</strong> {goals.preferredLocations.slice(0, 2).join(', ') || 'Flexible'}
            </span>
          </div>
        </div>

        {/* Short-Term Milestones */}
        {goals.shortTermLearningGoals && goals.shortTermLearningGoals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Active Learning Targets</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {goals.shortTermLearningGoals.slice(0, 4).map((g, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white border border-[#E5E0D8] text-xs text-[#101010] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contradiction Warning */}
        {contradictions.length > 0 && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Context Insight: </span>
              {contradictions[0]}
            </div>
          </div>
        )}
      </div>

      <StudentGoalsModal
        userId={userId}
        initialGoals={goals}
        contradictions={contradictions}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoalsUpdated={onGoalsUpdated}
      />
    </>
  );
};
