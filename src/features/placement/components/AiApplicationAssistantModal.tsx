/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: AI Application Assistant Modal
 * Generates tailored cover letters, recruiter outreach messages, and project rationales.
 * Requires student review and approval before saving; never overwrites original resume.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  PenLine,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  Send,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  VerifiedJobOpportunity,
  ApplicationDraft,
} from '../../../types/placementIntelligence.ts';
import {
  requestApplicationDraft,
  saveApplicationDraft,
  loadApplicationDraft,
} from '../../../lib/placementIntelligenceService.ts';

interface AiApplicationAssistantModalProps {
  job: VerifiedJobOpportunity | null;
  studentContext: {
    studentName?: string;
    targetRole: string;
    degree: string;
    major: string;
    academicYear: string;
    graduationYear: string;
    collegeOrUniversity?: string;
    verifiedSkills: string[];
    projects: {
      title: string;
      techStack: string[];
      description: string;
      bullets?: string[];
    }[];
  };
  userId?: string;
  onClose: () => void;
  onDraftApproved?: (draft: ApplicationDraft) => void;
}

export const AiApplicationAssistantModal: React.FC<AiApplicationAssistantModalProps> = ({
  job,
  studentContext,
  userId,
  onClose,
  onDraftApproved,
}) => {
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'cover-letter' | 'outreach' | 'qa' | 'projects'>('cover-letter');

  useEffect(() => {
    async function initDraft() {
      if (!job) return;
      setIsLoading(true);

      // Check if draft already exists
      const existing = await loadApplicationDraft(userId, job.id);
      if (existing) {
        setDraft(existing);
        setIsApproved(existing.isApprovedByStudent);
        setIsLoading(false);
        return;
      }

      try {
        const generated = await requestApplicationDraft(job, studentContext);
        setDraft(generated);
      } catch (err) {
        console.warn('Failed to generate draft:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initDraft();
  }, [job, userId]);

  if (!job) return null;

  const handleCopy = (sectionKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleApproveDraft = async () => {
    if (!draft) return;
    const updatedDraft: ApplicationDraft = {
      ...draft,
      isApprovedByStudent: true,
    };
    setDraft(updatedDraft);
    setIsApproved(true);
    await saveApplicationDraft(userId, updatedDraft);
    if (onDraftApproved) onDraftApproved(updatedDraft);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E2D7] bg-[#FAF9F5] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-1">
              <PenLine className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Application Preparation Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#101010] leading-snug">
              Tailor Application for {job.company}
            </h2>
            <p className="text-xs text-[#666666]">
              Target Role: <strong>{job.title}</strong> • Generated strictly from your verified profile and projects.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-[#101010] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 border-b border-[#E8E2D7] bg-white flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'cover-letter', label: 'Tailored Cover Letter', icon: FileText },
            { id: 'outreach', label: 'Recruiter Outreach', icon: Mail },
            { id: 'qa', label: 'Application Q&A', icon: HelpCircle },
            { id: 'projects', label: 'Highlighted Projects', icon: Layers },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#101010] text-[#101010]'
                    : 'border-transparent text-[#666666] hover:text-[#101010]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#888888] space-y-3">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto" />
              <p>Analyzing job requirements and drafting tailored application materials...</p>
            </div>
          ) : draft ? (
            <>
              {/* Approval status banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  isApproved
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isApproved ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {isApproved
                      ? 'Approved draft saved to your pipeline.'
                      : 'Review draft carefully. Nothing is applied or submitted until you confirm.'}
                  </span>
                </div>

                {!isApproved && (
                  <button
                    onClick={handleApproveDraft}
                    className="px-3 py-1 bg-[#101010] text-[#F8F5EE] rounded-lg text-xs font-semibold hover:bg-[#262626] cursor-pointer whitespace-nowrap"
                  >
                    Approve Draft
                  </button>
                )}
              </div>

              {/* TAB 1: COVER LETTER */}
              {activeTab === 'cover-letter' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                      Tailored Cover Letter
                    </span>
                    <button
                      onClick={() => handleCopy('cover', draft.tailoredCoverLetter || '')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#EAE5DC] cursor-pointer"
                    >
                      {copiedSection === 'cover' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'cover' ? 'Copied' : 'Copy Letter'}</span>
                    </button>
                  </div>

                  <div className="p-5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs sm:text-sm text-[#222222] whitespace-pre-line leading-relaxed font-serif">
                    {draft.tailoredCoverLetter}
                  </div>
                </div>
              )}

              {/* TAB 2: RECRUITER OUTREACH */}
              {activeTab === 'outreach' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                      LinkedIn / Email Outreach Note
                    </span>
                    <button
                      onClick={() => handleCopy('outreach', draft.recruiterOutreachMessage || '')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#EAE5DC] cursor-pointer"
                    >
                      {copiedSection === 'outreach' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSection === 'outreach' ? 'Copied' : 'Copy Message'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs sm:text-sm text-[#222222] whitespace-pre-line leading-relaxed">
                    {draft.recruiterOutreachMessage}
                  </div>
                </div>
              )}

              {/* TAB 3: APPLICATION Q&A */}
              {activeTab === 'qa' && (
                <div className="space-y-4 animate-fadeIn">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Prepared Application Form Answers
                  </span>

                  <div className="space-y-3">
                    {draft.commonQuestionsAnswers?.map((qa, idx) => (
                      <div key={idx} className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-[#101010]">{qa.question}</h4>
                          <button
                            onClick={() => handleCopy(`qa_${idx}`, qa.suggestedAnswer)}
                            className="p-1 text-[#888888] hover:text-[#101010] cursor-pointer"
                            title="Copy Answer"
                          >
                            {copiedSection === `qa_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#444444] leading-relaxed">
                          {qa.suggestedAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: HIGHLIGHTED PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4 animate-fadeIn">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Projects Most Relevant to {job.company}
                  </span>

                  <div className="space-y-3">
                    {draft.highlightedProjects?.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-1 text-xs">
                        <div className="font-bold text-[#101010] text-sm">{proj.title}</div>
                        <p className="text-[#555555] leading-relaxed">{proj.reason}</p>
                      </div>
                    ))}
                  </div>

                  {draft.missingInformationNoticed && draft.missingInformationNoticed.length > 0 && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                      <strong>Checklist Reminder: </strong>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {draft.missingInformationNoticed.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-xs text-[#888888] p-8">
              Unable to generate application draft at this time.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8E2D7] bg-[#FAF9F5] flex items-center justify-between">
          <span className="text-[11px] text-[#888888]">
            ProFile Application Assistant • Never fabricates experiences
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E5E0D8] text-[#101010] rounded-xl text-xs font-semibold hover:bg-stone-100 transition-all cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
