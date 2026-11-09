/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.2: Student Career Goals & Personalization Modal
 * Allows students to define primary goals, target roles, preferred industries/locations,
 * short-term learning goals, and privacy/personalization controls with Firestore persistence.
 */

import React, { useState } from 'react';
import {
  X,
  Target,
  Briefcase,
  MapPin,
  Calendar,
  Compass,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { StudentCareerGoals } from '../../../types/personalization.ts';
import { saveStudentCareerGoals } from '../../../lib/studentPersonalizationService.ts';

const POPULAR_INDUSTRIES = [
  'Software & Internet',
  'Fintech',
  'Cloud Infrastructure',
  'Developer Tools',
  'AI & Machine Learning',
  'E-Commerce',
  'Enterprise SaaS',
  'Cybersecurity',
  'EdTech',
  'HealthTech',
];

const POPULAR_LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Delhi NCR',
  'Mumbai',
  'Chennai',
  'Remote (Worldwide)',
];

interface StudentGoalsModalProps {
  userId?: string;
  initialGoals: StudentCareerGoals;
  contradictions?: string[];
  isOpen: boolean;
  onClose: () => void;
  onGoalsUpdated: (updated: StudentCareerGoals) => void;
}

export const StudentGoalsModal: React.FC<StudentGoalsModalProps> = ({
  userId,
  initialGoals,
  contradictions = [],
  isOpen,
  onClose,
  onGoalsUpdated,
}) => {
  const [goals, setGoals] = useState<StudentCareerGoals>(initialGoals);
  const [newLearningGoal, setNewLearningGoal] = useState<string>('');
  const [newPrepGoal, setNewPrepGoal] = useState<string>('');
  const [customIndustry, setCustomIndustry] = useState<string>('');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStudentCareerGoals(userId, goals);
      onGoalsUpdated(goals);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.warn('Failed to save student goals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIndustry = (ind: string) => {
    setGoals((prev) => {
      const exists = prev.preferredIndustries.includes(ind);
      return {
        ...prev,
        preferredIndustries: exists
          ? prev.preferredIndustries.filter((i) => i !== ind)
          : [...prev.preferredIndustries, ind],
      };
    });
  };

  const toggleLocation = (loc: string) => {
    setGoals((prev) => {
      const exists = prev.preferredLocations.includes(loc);
      return {
        ...prev,
        preferredLocations: exists
          ? prev.preferredLocations.filter((l) => l !== loc)
          : [...prev.preferredLocations, loc],
      };
    });
  };

  const addLearningGoal = () => {
    if (newLearningGoal.trim()) {
      setGoals((prev) => ({
        ...prev,
        shortTermLearningGoals: [...prev.shortTermLearningGoals, newLearningGoal.trim()],
      }));
      setNewLearningGoal('');
    }
  };

  const removeLearningGoal = (index: number) => {
    setGoals((prev) => ({
      ...prev,
      shortTermLearningGoals: prev.shortTermLearningGoals.filter((_, i) => i !== index),
    }));
  };

  const addPrepGoal = () => {
    if (newPrepGoal.trim()) {
      setGoals((prev) => ({
        ...prev,
        placementPrepGoals: [...prev.placementPrepGoals, newPrepGoal.trim()],
      }));
      setNewPrepGoal('');
    }
  };

  const removePrepGoal = (index: number) => {
    setGoals((prev) => ({
      ...prev,
      placementPrepGoals: prev.placementPrepGoals.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Pinned Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E5E0D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#101010]">
                Career Goals &amp; Personalization
              </h3>
              <p className="text-xs text-[#666666]">
                Manage target roles, industry focus, and AI context personalization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-[#101010] rounded-xl hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Contradiction / Gap Alert Banner */}
          {contradictions.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Identified Profile Gaps &amp; Opportunities</span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1 pl-6 list-disc">
                {contradictions.map((c, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Primary Career Objective */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
              <Target className="w-4 h-4 text-[#101010]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                Primary Career Objective
              </h4>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101010] mb-1.5">
                Primary Career Goal
              </label>
              <textarea
                rows={2}
                value={goals.primaryCareerGoal}
                onChange={(e) => setGoals({ ...goals, primaryCareerGoal: e.target.value })}
                placeholder="e.g. Secure a full-time software engineering role at a product-focused company"
                className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-3 text-xs sm:text-sm text-[#101010] focus:outline-hidden resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#101010] mb-1.5">
                  Target Job Role
                </label>
                <input
                  type="text"
                  value={goals.targetRole}
                  onChange={(e) => setGoals({ ...goals, targetRole: e.target.value })}
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs sm:text-sm text-[#101010] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#101010] mb-1.5">
                  Target Completion Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={goals.targetCompletionDate}
                    onChange={(e) => setGoals({ ...goals, targetCompletionDate: e.target.value })}
                    className="w-full bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl p-2.5 text-xs sm:text-sm text-[#101010] focus:outline-hidden"
                  />
                  <Calendar className="w-4 h-4 text-[#888888] absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#101010] mb-1.5">
                Work Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['any', 'remote', 'hybrid', 'onsite'] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setGoals({ ...goals, workPreference: pref })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      goals.workPreference === pref
                        ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                        : 'bg-[#FAF9F5] border-[#E5E0D8] text-[#666666] hover:bg-stone-200'
                    }`}
                  >
                    {pref === 'any' ? 'Flexible (Any)' : pref}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Preferred Industries & Locations */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
              <Briefcase className="w-4 h-4 text-[#101010]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                Industry &amp; Location Focus
              </h4>
            </div>

            {/* Industries */}
            <div>
              <label className="block text-xs font-semibold text-[#101010] mb-2">
                Preferred Industries ({goals.preferredIndustries.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_INDUSTRIES.map((ind) => {
                  const isSelected = goals.preferredIndustries.includes(ind);
                  return (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => toggleIndustry(ind)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#101010] text-white border-[#101010]'
                          : 'bg-[#FAF9F5] text-[#555555] border-[#E5E0D8] hover:bg-stone-200'
                      }`}
                    >
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locations */}
            <div>
              <label className="block text-xs font-semibold text-[#101010] mb-2">
                Preferred Work Locations ({goals.preferredLocations.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_LOCATIONS.map((loc) => {
                  const isSelected = goals.preferredLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#101010] text-white border-[#101010]'
                          : 'bg-[#FAF9F5] text-[#555555] border-[#E5E0D8] hover:bg-stone-200'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Short-Term Learning Goals */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
              <Sparkles className="w-4 h-4 text-[#101010]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                Short-Term Learning Milestones
              </h4>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newLearningGoal}
                onChange={(e) => setNewLearningGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLearningGoal();
                  }
                }}
                placeholder="e.g. Master PostgreSQL indexing and query optimization"
                className="flex-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#101010] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={addLearningGoal}
                className="px-3.5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#252525] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {goals.shortTermLearningGoals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs text-[#101010]"
                >
                  <span className="truncate pr-2">• {goal}</span>
                  <button
                    type="button"
                    onClick={() => removeLearningGoal(idx)}
                    className="text-[#888888] hover:text-[#ef4444] p-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Placement Preparation Goals */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
              <CheckCircle2 className="w-4 h-4 text-[#101010]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                Placement Preparation Goals
              </h4>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPrepGoal}
                onChange={(e) => setNewPrepGoal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPrepGoal();
                  }
                }}
                placeholder="e.g. Complete 5 mock interview sessions with rubric >=80%"
                className="flex-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#101010] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={addPrepGoal}
                className="px-3.5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#252525] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {goals.placementPrepGoals.map((goal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs text-[#101010]"
                >
                  <span className="truncate pr-2">✓ {goal}</span>
                  <button
                    type="button"
                    onClick={() => removePrepGoal(idx)}
                    className="text-[#888888] hover:text-[#ef4444] p-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Privacy & AI Personalization Preferences */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E0D8]">
              <ShieldCheck className="w-4 h-4 text-[#101010]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                Privacy &amp; AI Personalization Controls
              </h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={goals.preferences.enablePersonalizedRecommendations}
                  onChange={(e) =>
                    setGoals({
                      ...goals,
                      preferences: {
                        ...goals.preferences,
                        enablePersonalizedRecommendations: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded border-stone-300 text-[#101010] focus:ring-[#101010]"
                />
                <div>
                  <p className="text-xs font-bold text-[#101010]">
                    Enable Context-Aware Recommendations
                  </p>
                  <p className="text-[11px] text-[#666666]">
                    Tailor resume tips, job matches, and career roadmaps to your actual verified skills and goals.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={goals.preferences.shareGoalsWithAiAssistant}
                  onChange={(e) =>
                    setGoals({
                      ...goals,
                      preferences: {
                        ...goals.preferences,
                        shareGoalsWithAiAssistant: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded border-stone-300 text-[#101010] focus:ring-[#101010]"
                />
                <div>
                  <p className="text-xs font-bold text-[#101010]">
                    Share Career Goals with ProFile AI Assistant
                  </p>
                  <p className="text-[11px] text-[#666666]">
                    Allows the floating AI assistant to reference your target role and deadlines without re-asking.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Pinned Footer with Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E5E0D8] bg-white text-xs font-semibold text-[#666666] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#101010] text-[#F8F5EE] text-xs font-bold hover:bg-[#252525] transition-colors cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Goals Saved!</span>
                </>
              ) : (
                <span>{isSaving ? 'Saving...' : 'Save Goals & Preferences'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
