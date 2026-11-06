/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 3: AI Resume Content Assistant Modal
 * Allows students to generate, polish, condense, role-align, and ATS-optimize
 * content across all 10 resume sections with strict anti-hallucination controls,
 * staged editing, and explicit acceptance.
 */

import React, { useState, useEffect } from 'react';
import {
  PenLine,
  X,
  Check,
  RotateCw,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  FileText,
  Briefcase,
  Code2,
  GraduationCap,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ContentAssistantAction,
  ContentAssistantSection,
  ContentAssistantRequest,
  ContentAssistantResponse,
} from '../../../../types/assistant.ts';
import { ResumeData, ResumeProject, ResumeExperience, ResumeLeadership } from '../../../../types/resume.ts';
import { ResumeSetupData } from '../../../../types/resumeSetup.ts';
import { ResumeRecommendationsData } from '../../../../types/recommendations.ts';
import {
  fetchAIContentAssistance,
  buildCandidateAssistantContext,
  ASSISTANT_ACTIONS,
  cacheStagedDraft,
  getStagedDraft,
  clearStagedDraft,
} from '../../../../lib/contentAssistantService.ts';

export interface AtsFindingContext {
  findingTitle: string;
  findingDescription: string;
  suggestedImprovement?: string;
  missingKeywords?: string[];
  evidenceOrMissing?: string;
  priority?: string;
}

interface AiContentAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  resumeSetup?: ResumeSetupData | null;
  recommendations?: ResumeRecommendationsData | null;
  initialSection?: ContentAssistantSection;
  initialAction?: ContentAssistantAction;
  initialContent?: string | string[];
  itemContext?: {
    itemId?: string;
    itemTitle?: string;
    itemTechStack?: string[];
  };
  atsFindingContext?: AtsFindingContext;
  onApplyContent: (result: {
    section: ContentAssistantSection;
    text: string;
    bulletPoints?: string[];
    itemId?: string;
  }) => void;
}

const SECTION_OPTIONS: { id: ContentAssistantSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'summary', label: 'Professional Summary', icon: FileText },
  { id: 'technical_skills', label: 'Technical Skills', icon: Code2 },
  { id: 'soft_skills', label: 'Soft Skills', icon: Layers },
  { id: 'projects', label: 'Projects', icon: Code2 },
  { id: 'experience', label: 'Experience / Internships', icon: Briefcase },
  { id: 'education', label: 'Education & Highlights', icon: GraduationCap },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements & Awards', icon: Award },
  { id: 'positions_of_responsibility', label: 'Positions of Responsibility', icon: Briefcase },
  { id: 'coursework', label: 'Relevant Coursework', icon: GraduationCap },
];

export function AiContentAssistantModal({
  isOpen,
  onClose,
  resumeData,
  resumeSetup,
  recommendations,
  initialSection = 'summary',
  initialAction = 'generate',
  initialContent = '',
  itemContext,
  atsFindingContext,
  onApplyContent,
}: AiContentAssistantModalProps) {
  const [selectedSection, setSelectedSection] = useState<ContentAssistantSection>(initialSection);
  const [selectedAction, setSelectedAction] = useState<ContentAssistantAction>(initialAction);
  const [customInstructions, setCustomInstructions] = useState('');
  const [itemTitle, setItemTitle] = useState(itemContext?.itemTitle || '');
  const [itemTechStack, setItemTechStack] = useState(itemContext?.itemTechStack?.join(', ') || '');

  // Content staging state
  const [originalText, setOriginalText] = useState('');
  const [editedGeneratedText, setEditedGeneratedText] = useState('');
  const [generatedResult, setGeneratedResult] = useState<ContentAssistantResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnacceptedChanges, setHasUnacceptedChanges] = useState(false);

  // Sync initial parameters when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedSection(initialSection);
      setSelectedAction(atsFindingContext ? 'ats_keywords' : initialAction);
      setItemTitle(itemContext?.itemTitle || '');
      setItemTechStack(itemContext?.itemTechStack?.join(', ') || '');

      if (atsFindingContext) {
        let instructions = '';
        if (atsFindingContext.suggestedImprovement) {
          instructions = atsFindingContext.suggestedImprovement;
        }
        if (atsFindingContext.missingKeywords && atsFindingContext.missingKeywords.length > 0) {
          instructions += (instructions ? ' ' : '') + `Incorporate keywords: ${atsFindingContext.missingKeywords.join(', ')}.`;
        }
        setCustomInstructions(instructions);
      } else {
        setCustomInstructions('');
      }

      let initialOriginal = '';
      if (typeof initialContent === 'string' && initialContent.trim().length > 0) {
        initialOriginal = initialContent.trim();
      } else if (Array.isArray(initialContent) && initialContent.length > 0) {
        initialOriginal = initialContent.join('\n');
      } else {
        initialOriginal = extractCurrentSectionText(initialSection, resumeData, itemContext?.itemId);
      }
      setOriginalText(initialOriginal);

      // Check if there was a cached staged draft
      const draftKey = `${initialSection}_${itemContext?.itemId || 'default'}`;
      const cached = getStagedDraft(draftKey);
      if (cached && cached.original === initialOriginal) {
        setEditedGeneratedText(cached.generated);
        setGeneratedResult({
          generatedText: cached.generated,
          explanation: cached.explanation || 'Restored from previous unsaved session.',
          placeholdersUsed: [],
          atsScoreImpactNote: 'Restored staged draft.',
          actionApplied: initialAction,
        });
        setHasUnacceptedChanges(true);
      } else {
        setEditedGeneratedText('');
        setGeneratedResult(null);
        setHasUnacceptedChanges(false);
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialSection, initialAction, initialContent, itemContext]);

  if (!isOpen) return null;

  // Extract text from current resume data
  function extractCurrentSectionText(
    section: ContentAssistantSection,
    data: ResumeData,
    itemId?: string
  ): string {
    switch (section) {
      case 'summary':
        return data.personalInfo.summary || '';
      case 'technical_skills':
        return data.skills.technical.join(', ');
      case 'soft_skills':
        return data.skills.soft.join(', ');
      case 'projects': {
        if (itemId) {
          const p = data.projects.find((proj) => proj.id === itemId);
          if (p) {
            return p.bullets?.length ? p.bullets.join('\n') : p.description;
          }
        }
        return data.projects.map((p) => `${p.title}: ${p.description}`).join('\n\n');
      }
      case 'experience': {
        if (itemId) {
          const exp = data.experience.find((e) => e.id === itemId);
          if (exp) {
            return exp.bullets?.length ? exp.bullets.join('\n') : exp.description || '';
          }
        }
        return data.experience.map((e) => `${e.position} at ${e.company}: ${e.description || ''}`).join('\n\n');
      }
      case 'education': {
        return data.education.map((e) => `${e.degree} in ${e.fieldOfStudy} from ${e.institution}`).join('\n');
      }
      case 'certifications': {
        return (data.certifications || []).map((c) => `${c.name} (${c.issuer})`).join('\n');
      }
      case 'achievements': {
        return (data.achievements || []).join('\n');
      }
      case 'positions_of_responsibility': {
        if (itemId) {
          const pos = (data.positionsOfResponsibility || []).find((p) => p.id === itemId);
          if (pos) {
            return pos.bullets?.length ? pos.bullets.join('\n') : pos.description;
          }
        }
        return (data.positionsOfResponsibility || []).map((p) => `${p.role} at ${p.organization}: ${p.description}`).join('\n');
      }
      case 'coursework': {
        return (data.coursework || []).join(', ');
      }
      default:
        return '';
    }
  }

  // Handle section switch inside modal
  const handleSectionSelect = (newSection: ContentAssistantSection) => {
    setSelectedSection(newSection);
    const text = extractCurrentSectionText(newSection, resumeData);
    setOriginalText(text);
    setEditedGeneratedText('');
    setGeneratedResult(null);
    setHasUnacceptedChanges(false);
  };

  // Generate / Run AI action
  const handleExecuteAssistant = async (actionToRun = selectedAction) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const baseContext = buildCandidateAssistantContext(resumeSetup, recommendations);

      const request: ContentAssistantRequest = {
        section: selectedSection,
        action: actionToRun,
        currentContent: originalText || undefined,
        targetRole: baseContext.targetRole || 'Software Engineer Intern',
        purpose: baseContext.purpose || 'internship',
        degree: baseContext.degree,
        department: baseContext.department,
        academicYear: baseContext.academicYear,
        jobDescriptionText: baseContext.jobDescriptionText,
        approvedRecommendations: baseContext.approvedRecommendations,
        additionalInstructions: customInstructions.trim() || undefined,
        itemTitle: itemTitle.trim() || undefined,
        itemTechStack: itemTechStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const response = await fetchAIContentAssistance(request);
      setGeneratedResult(response);

      // Prefer bullet points joined by newline if available, or generated text
      const outputText = response.bulletPoints?.length
        ? response.bulletPoints.map((b) => (b.startsWith('•') || b.startsWith('-') ? b : `• ${b}`)).join('\n')
        : response.generatedText;

      setEditedGeneratedText(outputText);
      setHasUnacceptedChanges(true);

      // Cache staged draft
      const draftKey = `${selectedSection}_${itemContext?.itemId || 'default'}`;
      cacheStagedDraft(draftKey, {
        original: originalText,
        generated: outputText,
        explanation: response.explanation,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Accept and apply staged result to resume
  const handleAcceptAndApply = () => {
    if (!editedGeneratedText.trim()) return;

    // Check if bullets were generated
    let bullets: string[] | undefined = undefined;
    if (
      selectedSection === 'projects' ||
      selectedSection === 'experience' ||
      selectedSection === 'positions_of_responsibility' ||
      selectedSection === 'achievements'
    ) {
      const lines = editedGeneratedText
        .split('\n')
        .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean);
      if (lines.length > 1) {
        bullets = lines;
      }
    }

    onApplyContent({
      section: selectedSection,
      text: editedGeneratedText.trim(),
      bulletPoints: bullets,
      itemId: itemContext?.itemId,
    });

    // Clear staged draft cache
    const draftKey = `${selectedSection}_${itemContext?.itemId || 'default'}`;
    clearStagedDraft(draftKey);
    setHasUnacceptedChanges(false);
    onClose();
  };

  // Discard staged changes
  const handleDiscard = () => {
    const draftKey = `${selectedSection}_${itemContext?.itemId || 'default'}`;
    clearStagedDraft(draftKey);
    setEditedGeneratedText('');
    setGeneratedResult(null);
    setHasUnacceptedChanges(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-page-enter"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171513] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  ProFile AI Resume Content Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-[#E0D8CB] border border-white/10">
                  Phase 3
                </span>
              </div>
              <p className="text-xs text-[#A8A196]">
                Targeting <strong className="text-white">{resumeSetup?.targetRole.title || 'Software Engineer Intern'}</strong> • Anti-hallucination verified
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A8A196] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 pt-3.5 pb-2 bg-[#F2EDE4] border-b border-[#E2DBD0] overflow-x-auto scrollbar-none flex gap-1.5 shrink-0">
          {SECTION_OPTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => handleSectionSelect(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#171513] text-white shadow-2xs'
                    : 'text-[#655F55] hover:text-[#171513] hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ATS Finding Context Banner */}
          {atsFindingContext && (
            <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#E8DEC8] text-xs space-y-2 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#101010] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Targeting ATS Finding: {atsFindingContext.findingTitle}</span>
                </span>
                {atsFindingContext.priority && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      atsFindingContext.priority === 'high'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {atsFindingContext.priority.toUpperCase()} PRIORITY
                  </span>
                )}
              </div>
              <p className="text-[#666666] leading-relaxed">
                {atsFindingContext.findingDescription}
              </p>
              {atsFindingContext.missingKeywords && atsFindingContext.missingKeywords.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[#8C6D1F]">Keywords to Weave in:</span>
                  {atsFindingContext.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white text-[#101010] border border-[#E8DEC8] text-[10px] font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Selector Grid */}
          <div>
            <label className="text-xs font-bold text-[#171513] uppercase tracking-wider block mb-2">
              Select AI Writing Action
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASSISTANT_ACTIONS.map((item) => {
                const isSelected = selectedAction === item.action;
                return (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => setSelectedAction(item.action)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#171513] text-white border-[#171513] shadow-xs'
                        : 'bg-white hover:bg-[#F6F3EC] border-[#E5E0D8] text-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#171513]'}`}>
                        {item.label}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#EAE5DC] text-[#6A645A]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-tight line-clamp-2 ${isSelected ? 'text-[#D0C9BE]' : 'text-[#777777]'}`}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context specifics for items (Projects/Experience) */}
          {(selectedSection === 'projects' ||
            selectedSection === 'experience' ||
            selectedSection === 'positions_of_responsibility') && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E0D8] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#171513]">
                <Briefcase className="w-3.5 h-3.5 text-[#8C6D1F]" />
                <span>Item Context (Helps AI stay strictly accurate)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#666666] block mb-1">
                    {selectedSection === 'projects'
                      ? 'Project Title / Topic'
                      : selectedSection === 'experience'
                      ? 'Role & Company Name'
                      : 'Position & Organization'}
                  </label>
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g. Distributed Task Scheduler or Web Intern at Acme"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] focus:outline-none focus:border-[#171513]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#666666] block mb-1">
                    Technologies / Tools Used
                  </label>
                  <input
                    type="text"
                    value={itemTechStack}
                    onChange={(e) => setItemTechStack(e.target.value)}
                    placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#D5CEC2] bg-[#FAF8F5] focus:outline-none focus:border-[#171513]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional custom instruction input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Optional: Add specific instruction (e.g. 'Emphasize state management', 'Highlight metric outcomes')"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-2xl border border-[#D5CEC2] bg-white focus:outline-none focus:border-[#171513]"
            />
            <button
              type="button"
              onClick={() => handleExecuteAssistant(selectedAction)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <PenLine className="w-3.5 h-3.5 text-amber-300" />
                  <span>Run Assistant</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong>AI Generation Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Staging & Comparison Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original / Current Resume Content */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DE] mb-2.5">
                <span className="text-xs font-bold text-[#655F55] uppercase tracking-wider">
                  Current Resume Draft
                </span>
                <span className="text-[10px] text-[#888888]">
                  {originalText.length} characters
                </span>
              </div>
              <div className="flex-1 min-h-[160px] text-xs text-[#444444] whitespace-pre-wrap leading-relaxed bg-[#FAF9F5] p-3 rounded-xl border border-[#EFECE5] font-sans">
                {originalText.trim() ? (
                  originalText
                ) : (
                  <span className="text-[#999999] italic">
                    [This section is currently empty in your resume draft]
                  </span>
                )}
              </div>
            </div>

            {/* Right: AI Generated Staged Proposal (Editable) */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#171513] flex flex-col shadow-xs relative">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE7DE] mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#171513] uppercase tracking-wider">
                    AI Suggested Draft
                  </span>
                  {hasUnacceptedChanges && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                      Unsaved Draft
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#666666]">
                  Editable by you
                </span>
              </div>

              <textarea
                rows={7}
                value={editedGeneratedText}
                onChange={(e) => {
                  setEditedGeneratedText(e.target.value);
                  setHasUnacceptedChanges(true);
                }}
                placeholder={
                  isLoading
                    ? 'AI is crafting your tailored content...'
                    : 'Click "Run Assistant" above to generate or improve this section.'
                }
                className="flex-1 min-h-[160px] w-full text-xs text-[#171513] leading-relaxed p-3 rounded-xl border border-[#D5CEC2] bg-[#FAFDF8] focus:outline-none focus:border-[#171513] font-sans resize-y"
              />

              {/* Detected placeholders chip row */}
              {generatedResult?.placeholdersUsed && generatedResult.placeholdersUsed.length > 0 && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Verify placeholders: </span>
                    <span>Replace bracketed placeholders with true values: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {generatedResult.placeholdersUsed.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] font-bold border border-amber-300"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Explanation & ATS Note */}
              {generatedResult?.explanation && (
                <div className="mt-2.5 text-[11px] text-[#655F55] bg-[#FAF8F5] p-2.5 rounded-xl border border-[#ECE7DE] space-y-1">
                  <div>
                    <strong className="text-[#171513]">Rationale: </strong>
                    {generatedResult.explanation}
                  </div>
                  {generatedResult.atsScoreImpactNote && (
                    <div className="text-[#8C6D1F]">
                      <strong>ATS Alignment: </strong>
                      {generatedResult.atsScoreImpactNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Anti-Hallucination & Factual Guarantee Card */}
          <div className="p-3.5 rounded-2xl bg-[#F4F1EA] border border-[#DDD6C9] flex items-center justify-between gap-3 text-xs text-[#524E48]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Strict Student Control:</strong> Content is never saved to your resume until you click <em>"Accept &amp; Apply"</em>. Never make false claims or state unverified qualifications.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-[#F2EDE4] border-t border-[#E2DBD0] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-4 py-2 rounded-xl border border-[#D5CEC2] bg-white text-xs font-semibold text-[#524E48] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            Discard &amp; Close
          </button>

          <div className="flex items-center gap-2">
            {hasUnacceptedChanges && (
              <button
                type="button"
                onClick={() => handleExecuteAssistant('regenerate')}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC2] text-xs font-semibold text-[#171513] hover:bg-[#FAF9F5] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate (Different Angle)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAcceptAndApply}
              disabled={!editedGeneratedText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#171513] text-white text-xs font-bold hover:bg-[#2A2724] transition-all cursor-pointer shadow-sm disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Accept &amp; Apply to Resume</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
