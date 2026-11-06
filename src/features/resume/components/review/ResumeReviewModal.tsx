/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 4: AI Final Resume Review & Quality Assurance Dashboard
 * Fullscreen review workspace with deterministic scoring, 5-category audit,
 * verified suggestion approvals, and pre-export checklist.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ResumeData } from '../../../../types/resume.ts';
import { ResumeSetupData } from '../../../../types/resumeSetup.ts';
import { ResumeRecommendationsData } from '../../../../types/recommendations.ts';
import {
  FinalResumeReviewReport,
  ReviewSuggestion,
  ReviewStatus,
} from '../../../../types/resumeReview.ts';
import {
  runResumeQualityReview,
  getLatestResumeReview,
  updateSuggestionStatus,
  applySuggestionToResume,
} from '../../../../lib/resumeReviewService.ts';
import { computeResumeContentFingerprint } from '../../../../lib/resumeReviewScorer.ts';
import { ScoreCard } from './ScoreCard.tsx';
import { SuggestionCard } from './SuggestionCard.tsx';
import { CategoryReviewSection } from './CategoryReviewSection.tsx';
import { PreExportChecklistCard } from './PreExportChecklistCard.tsx';
import { lockBodyScroll, unlockBodyScroll } from '../../../../lib/scrollLock.ts';
import {
  X,
  ScanSearch,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';

interface ResumeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
  resumeSetup?: ResumeSetupData | null;
  recommendations?: ResumeRecommendationsData | null;
  userId?: string;
  onProceedToExport: () => void;
  onJumpToStep: (stepId: number) => void;
}

export function ResumeReviewModal({
  isOpen,
  onClose,
  resumeData,
  onResumeDataChange,
  resumeSetup,
  recommendations,
  userId,
  onProceedToExport,
  onJumpToStep,
}: ResumeReviewModalProps) {
  const [report, setReport] = useState<FinalResumeReviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'audit' | 'checklist'>('overview');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'pending'>('pending');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const resumeId = resumeSetup?.id || 'default_resume';

  // Check if content has changed since the report was generated
  const isContentOutdated = Boolean(
    report && report.resumeContentHash !== computeResumeContentFingerprint(resumeData)
  );

  // Load existing cached review or prompt initial review
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    let isMounted = true;
    getLatestResumeReview(userId, resumeId, resumeData)
      .then((existing) => {
        if (!isMounted) return;
        if (existing) {
          setReport(existing);
        } else {
          // Auto-trigger first review if none exists
          handleRunReview();
        }
      })
      .catch((err) => {
        console.warn('Error reading cached review:', err);
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
      isMounted = false;
    };
  }, [isOpen, resumeId]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRunReview = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const newReport = await runResumeQualityReview(
        resumeId,
        userId,
        resumeData,
        resumeSetup || null,
        recommendations || null
      );
      setReport(newReport);
      showToast('AI Quality Review completed with deterministic scores.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestion: ReviewSuggestion, confirmedText: string) => {
    if (!report) return;

    // 1. Apply to ResumeData
    const updatedResume = applySuggestionToResume(resumeData, suggestion, confirmedText);
    onResumeDataChange(updatedResume);

    // 2. Update suggestion status in report
    const updatedReport = await updateSuggestionStatus(
      userId,
      report,
      suggestion.id,
      'applied',
      confirmedText
    );
    // Mark fingerprint updated so it stays fresh
    updatedReport.resumeContentHash = computeResumeContentFingerprint(updatedResume);
    setReport(updatedReport);

    showToast(`Applied improvement to ${suggestion.section.replace('_', ' ')}!`);
  };

  const handleDismissSuggestion = async (suggestion: ReviewSuggestion) => {
    if (!report) return;
    const updatedReport = await updateSuggestionStatus(
      userId,
      report,
      suggestion.id,
      'dismissed'
    );
    setReport(updatedReport);
    showToast('Suggestion dismissed.');
  };

  const handleUpdateSuggestionText = async (suggestion: ReviewSuggestion, newText: string) => {
    if (!report) return;
    const updatedReport = await updateSuggestionStatus(
      userId,
      report,
      suggestion.id,
      'suggested',
      newText
    );
    setReport(updatedReport);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Filter suggestions
  const suggestions = report?.suggestions || [];
  const filteredSuggestions = suggestions.filter((s) => {
    if (suggestionFilter === 'pending') return s.status === 'suggested';
    if (suggestionFilter === 'all') return true;
    return s.priority === suggestionFilter;
  });

  const pendingCount = suggestions.filter((s) => s.status === 'suggested').length;
  const appliedCount = suggestions.filter((s) => s.status === 'applied').length;

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'ready-for-export':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready for Final Export
          </span>
        );
      case 'improvements-available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Improvements Available
          </span>
        );
      case 'review-completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review Completed
          </span>
        );
      case 'not-reviewed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#666666] bg-[#EFECE6] border border-[#DDD]">
            Not Reviewed
          </span>
        );
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 transition-opacity cursor-pointer"
        style={{ backgroundColor: 'rgba(16, 16, 16, 0.65)' }}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-5xl bg-[#FAF9F5] border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col min-h-0 max-h-[92vh] z-10">
        
        {/* TOP HEADER */}
        <div className="shrink-0 flex items-center justify-between px-5 sm:px-7 py-4 bg-white border-b border-[#E5E0D8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F]">
              <ScanSearch className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#101010]">
                  AI Final Resume Review & QA
                </h3>
                {report && getStatusBadge(report.reviewStatus)}
              </div>
              <p className="text-xs text-[#777777]">
                Target Role: <strong className="text-[#101010]">{report?.targetRole || resumeSetup?.targetRole.title || 'Software Engineer'}</strong>
                {report?.hasJobDescription && ' • Job Description Matching Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunReview}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF5EC] hover:bg-[#F2EBDC] border border-[#E8DEC8] text-xs font-semibold text-[#8C6D1F] transition-colors cursor-pointer"
              title="Rerun complete review"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Re-run Review'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#777777] hover:text-[#101010] hover:bg-[#F0ECE3] transition-colors cursor-pointer"
              aria-label="Close review modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* OUTDATED CONTENT BANNER (Shown if content changed after review) */}
        {isContentOutdated && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Resume content modified: </strong>
                Your edits changed the resume draft since this review. Re-run review to refresh scores and suggestions.
              </span>
            </div>
            <button
              type="button"
              onClick={handleRunReview}
              disabled={isLoading}
              className="shrink-0 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] cursor-pointer"
            >
              Update Review Now
            </button>
          </div>
        )}

        {/* TOAST MESSAGE */}
        {successToast && (
          <div className="shrink-0 bg-emerald-600 text-white px-5 py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* COMPLEMENTARY TOOL GUIDANCE BANNER */}
        <div className="shrink-0 bg-[#F4F1EA] border-b border-[#E5E0D8] px-5 sm:px-7 py-2.5 flex items-center justify-between gap-3 text-[11px] text-[#555555]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#8C6D1F] shrink-0" />
            <span>
              <strong className="text-[#101010]">Complementary Evaluation: </strong>
              The <strong>ATS Checker</strong> verifies machine-readability, formatting syntax, and keyword presence. This <strong>Resume Quality Review</strong> assesses human recruiter impression, storytelling, and entry-level impact.
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="shrink-0 px-5 sm:px-7 bg-white border-b border-[#E5E0D8] flex items-center justify-between overflow-x-auto scrollbar-none">
          <div className="flex gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#101010] text-[#101010] font-bold'
                  : 'border-transparent text-[#666666] hover:text-[#101010]'
              }`}
            >
              Overview & Scores
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('suggestions')}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'suggestions'
                  ? 'border-[#101010] text-[#101010] font-bold'
                  : 'border-transparent text-[#666666] hover:text-[#101010]'
              }`}
            >
              <span>Improvement Suggestions</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FAF5EC] text-[#8C6D1F] border border-[#E8DEC8]">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-[#101010] text-[#101010] font-bold'
                  : 'border-transparent text-[#666666] hover:text-[#101010]'
              }`}
            >
              5-Category Audit
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'border-[#101010] text-[#101010] font-bold'
                  : 'border-transparent text-[#666666] hover:text-[#101010]'
              }`}
            >
              <span>Pre-Export Checklist</span>
              {report?.preExportChecklist && !report.preExportChecklist.allCriticalPassed && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 py-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToExport();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#101010] hover:bg-[#252525] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <span>Final Preview & Export</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-[#8C6D1F] animate-spin mb-4" />
              <h4 className="text-base font-bold text-[#101010] mb-1">
                Auditing Resume Draft with AI & Deterministic Rules...
              </h4>
              <p className="text-xs text-[#777777] max-w-md">
                Checking action-verb strength, measurable outcomes, target role relevance, ATS
                formatting parsability, and comparing with job requirements.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900">Review Request Failed</h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
              <button
                type="button"
                onClick={handleRunReview}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : report ? (
            <div className="space-y-6">
              
              {/* TAB 1: OVERVIEW & SCORES */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Deterministic Score Cards */}
                  <ScoreCard
                    scores={report.scores}
                    hasJobDescription={report.hasJobDescription}
                    targetRole={report.targetRole}
                  />

                  {/* High Priority Suggestion Highlight */}
                  {pendingCount > 0 && (
                    <div className="bg-[#FAF5EC] border border-[#E8DEC8] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ScanSearch className="w-4 h-4 text-amber-500" />
                          <h4 className="text-sm font-bold text-[#101010]">
                            Actionable Improvements ({pendingCount} pending)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('suggestions')}
                          className="text-xs font-bold text-[#8C6D1F] hover:text-[#705615] flex items-center gap-1 cursor-pointer"
                        >
                          <span>View all {suggestions.length} suggestions</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {suggestions
                          .filter((s) => s.status === 'suggested')
                          .slice(0, 2)
                          .map((sug) => (
                            <SuggestionCard
                              key={sug.id}
                              suggestion={sug}
                              onApply={handleApplySuggestion}
                              onDismiss={handleDismissSuggestion}
                              onUpdateText={handleUpdateSuggestionText}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Pre-Export Readiness Summary */}
                  <PreExportChecklistCard
                    checklist={report.preExportChecklist}
                    onJumpToStep={(step) => {
                      onClose();
                      onJumpToStep(step);
                    }}
                    onProceedToExport={() => {
                      onClose();
                      onProceedToExport();
                    }}
                  />
                </div>
              )}

              {/* TAB 2: ACTIONABLE SUGGESTIONS */}
              {activeTab === 'suggestions' && (
                <div className="space-y-4">
                  {/* Suggestion Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                      <button
                        type="button"
                        onClick={() => setSuggestionFilter('pending')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                          suggestionFilter === 'pending'
                            ? 'bg-[#101010] text-white'
                            : 'bg-white border border-[#E5E0D8] text-[#555555]'
                        }`}
                      >
                        Pending ({pendingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestionFilter('high')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                          suggestionFilter === 'high'
                            ? 'bg-rose-700 text-white'
                            : 'bg-white border border-[#E5E0D8] text-[#555555]'
                        }`}
                      >
                        High Priority
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestionFilter('medium')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                          suggestionFilter === 'medium'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-[#E5E0D8] text-[#555555]'
                        }`}
                      >
                        Medium Priority
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestionFilter('all')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
                          suggestionFilter === 'all'
                            ? 'bg-[#101010] text-white'
                            : 'bg-white border border-[#E5E0D8] text-[#555555]'
                        }`}
                      >
                        All ({suggestions.length})
                      </button>
                    </div>

                    <div className="text-xs text-[#777777]">
                      {appliedCount} applied • {suggestions.filter((s) => s.status === 'dismissed').length} dismissed
                    </div>
                  </div>

                  {/* Suggestion List */}
                  {filteredSuggestions.length > 0 ? (
                    <div className="space-y-3.5">
                      {filteredSuggestions.map((sug) => (
                        <SuggestionCard
                          key={sug.id}
                          suggestion={sug}
                          onApply={handleApplySuggestion}
                          onDismiss={handleDismissSuggestion}
                          onUpdateText={handleUpdateSuggestionText}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white rounded-2xl border border-[#E5E0D8] p-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-[#101010] mb-1">
                        No Suggestions in this Filter
                      </h4>
                      <p className="text-xs text-[#777777]">
                        All suggestions for this category have been applied or dismissed.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: 5-CATEGORY AUDIT */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <CategoryReviewSection report={report} />
                </div>
              )}

              {/* TAB 4: PRE-EXPORT CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-4">
                  <PreExportChecklistCard
                    checklist={report.preExportChecklist}
                    onJumpToStep={(step) => {
                      onClose();
                      onJumpToStep(step);
                    }}
                    onProceedToExport={() => {
                      onClose();
                      onProceedToExport();
                    }}
                  />
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="shrink-0 px-5 sm:px-7 py-3 bg-white border-t border-[#E5E0D8] flex items-center justify-between text-xs text-[#777777]">
          <span>ProFile Quality Assurance Engine • Evidence-Based & Explainable</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-[#E5E0D8] text-[#101010] hover:bg-[#FAF9F5] font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToExport();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#101010] hover:bg-[#252525] text-white font-semibold cursor-pointer shadow-2xs"
            >
              <span>Proceed to Export</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
