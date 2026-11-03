/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Real ATS Resume Scanner & Score Analysis Engine Workspace
 */

import React, { useState, useRef } from 'react';
import { ResumeData } from '../../../types/resume.ts';
import {
  FullAtsReport,
  ExtractedResumeText,
  AtsCompatibilityWarning,
} from '../types.ts';
import { extractResumeFromFile, extractResumeFromProFileData } from '../utils/textExtractor.ts';
import { parseJobDescription } from '../utils/jobDescriptionParser.ts';
import { evaluateResume } from '../utils/atsScoringEngine.ts';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Textarea } from '../../../components/ui/Textarea.tsx';
import { PageHeader } from '../../../components/layout/PageHeader.tsx';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ScanSearch,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  FileCheck,
  FileSpreadsheet,
  Building,
  Target,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AtsCheckerWorkspaceProps {
  resumeData: ResumeData;
  onNavigateToBuilder: () => void;
}

export function AtsCheckerWorkspace({
  resumeData,
  onNavigateToBuilder,
}: AtsCheckerWorkspaceProps) {
  // Input mode: active ProFile draft vs. uploaded file
  const [inputMode, setInputMode] = useState<'profile-draft' | 'file-upload'>('profile-draft');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Job description inputs
  const [jobDescription, setJobDescription] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [isJdExpanded, setIsJdExpanded] = useState(true);

  // Execution state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressMessage, setScanProgressMessage] = useState<string | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // Output report
  const [atsReport, setAtsReport] = useState<FullAtsReport | null>(null);
  const [checkedActionItems, setCheckedActionItems] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file drop / select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParsingError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setParsingError(null);
    }
  };

  // Run ATS analysis
  const handleRunAnalysis = async () => {
    setIsScanning(true);
    setParsingError(null);
    setScanProgressMessage('Initializing resume analysis engine...');

    try {
      let extracted: ExtractedResumeText;

      if (inputMode === 'file-upload') {
        if (!selectedFile) {
          throw new Error('Please select or drop a PDF or DOCX resume to analyze.');
        }
        setScanProgressMessage(`Reading ${selectedFile.name}...`);
        extracted = await extractResumeFromFile(selectedFile, (msg) => {
          setScanProgressMessage(msg);
        });
      } else {
        setScanProgressMessage('Parsing active ProFile resume draft records...');
        extracted = extractResumeFromProFileData(resumeData);
      }

      setScanProgressMessage('Parsing job description requirements & keywords...');
      const parsedJD = parseJobDescription(jobDescription, targetJobTitle, targetCompany);

      setScanProgressMessage('Evaluating ATS compatibility, keyword density & scoring...');
      const report = evaluateResume(extracted, parsedJD);

      // Brief delay to give user clear visual feedback of diagnostic completion
      await new Promise((res) => setTimeout(res, 350));

      setAtsReport(report);
      setCheckedActionItems({});
    } catch (err: any) {
      console.error('[ATS Analysis Error]:', err);
      setParsingError(err.message || 'An unexpected error occurred during resume parsing.');
    } finally {
      setIsScanning(false);
      setScanProgressMessage(null);
    }
  };

  const toggleActionItem = (id: string) => {
    setCheckedActionItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-8 select-none">
      <PageHeader
        title="ATS Resume Scanner & Score Checker"
        description="Deterministic resume parsing analysis with job description matching, verified keyword coverage, and evidence-based optimization recommendations."
        kicker="Deterministic ATS Diagnostic"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToBuilder}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Open Resume Builder</span>
          </Button>
        }
      />

      {/* =========================================================================
       * SECTION 1: INPUT WORKSPACE (Resume Source + Job Description)
       * ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Resume Input Selector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">1. Select Resume Source</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#777777]">
                {inputMode === 'profile-draft' ? 'ProFile Draft' : 'Custom Upload'}
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-1 bg-[#F5F2EB] rounded-2xl flex items-center gap-1 border border-[#E8E2D7]">
              <button
                type="button"
                onClick={() => setInputMode('profile-draft')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'profile-draft'
                    ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                    : 'text-[#666666] hover:text-[#101010] hover:bg-white/60'
                }`}
              >
                Active ProFile Draft
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file-upload')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  inputMode === 'file-upload'
                    ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                    : 'text-[#666666] hover:text-[#101010] hover:bg-white/60'
                }`}
              >
                Upload PDF / DOCX
              </button>
            </div>

            {inputMode === 'profile-draft' ? (
              <div className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#101010] flex items-center gap-1.5">
                      <ScanSearch className="w-4 h-4 text-[#101010]" />
                      <span>{resumeData.personalInfo?.fullName || 'Active Student Draft'}</span>
                    </h4>
                    <p className="text-[11px] text-[#777777] mt-0.5">
                      {resumeData.personalInfo?.professionalTitle || 'Software Engineer / Student'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E5631] text-[10px] font-bold">
                    Loaded
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#555555]">
                  <div className="p-2 rounded-xl bg-white border border-[#EBE6DC] text-center">
                    <span className="block font-bold text-[#101010]">{resumeData.education?.length || 0}</span>
                    <span className="text-[10px] text-[#777777]">Education</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#EBE6DC] text-center">
                    <span className="block font-bold text-[#101010]">{resumeData.projects?.length || 0}</span>
                    <span className="text-[10px] text-[#777777]">Projects</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#EBE6DC] text-center">
                    <span className="block font-bold text-[#101010]">
                      {(resumeData.skills?.technical?.length || 0) + (resumeData.skills?.soft?.length || 0)}
                    </span>
                    <span className="text-[10px] text-[#777777]">Skills</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#777777] leading-relaxed">
                  The ATS engine analyzes the genuine structured form data saved in your ProFile editor, verifying contact details, academic credentials, and project bullet points.
                </p>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-6 sm:p-8 rounded-2xl bg-[#F8F8F6] border-2 border-dashed border-[#DDD5C7] hover:border-[#101010] transition-colors flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#101010] break-all">{selectedFile.name}</p>
                    <p className="text-[11px] text-[#777777]">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to extract
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Click or drop new file to replace
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#101010]">Choose PDF or DOCX resume</p>
                    <p className="text-[11px] text-[#777777]">Drag and drop your file here, or browse files</p>
                    <p className="text-[10px] text-[#A3A3A3] pt-1">
                      Supports PDF (text layer &amp; OCR fallback) and Word (.docx)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Job Description Input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">2. Target Job Description</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJdExpanded(!isJdExpanded)}
                className="text-xs font-semibold text-[#777777] hover:text-[#101010] flex items-center gap-1 cursor-pointer"
              >
                <span>{jobDescription.trim() ? 'Configured' : 'Optional'}</span>
                {isJdExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isJdExpanded && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Target Job Title (Optional)"
                    placeholder="e.g. Full Stack Software Engineer"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                  />
                  <Input
                    label="Target Company (Optional)"
                    placeholder="e.g. Google, Stripe, Startup"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1">
                    Paste Job Description Text
                  </label>
                  <textarea
                    rows={5}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job posting text (qualifications, responsibilities, requirements). ProFile will compare required vs. preferred skills and missing keywords."
                    className="w-full rounded-2xl border border-[#DDD5C7] bg-[#FDFCFB] px-3.5 py-2.5 text-xs text-[#101010] placeholder:text-[#A3A3A3] focus:border-[#101010] focus:ring-1 focus:ring-[#101010] outline-hidden transition-all resize-y"
                  />
                  <p className="text-[11px] text-[#777777] mt-1">
                    {jobDescription.trim()
                      ? `Job description detected (${jobDescription.split(/\s+/).filter(Boolean).length} words). Evaluating role-specific ATS match.`
                      : 'Leave empty to run General Resume Quality benchmark analysis.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RUN ACTION BAR */}
      <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#101010] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#101010]" />
            <span>Ready for Real ATS Evaluation</span>
          </h4>
          <p className="text-xs text-[#777777] mt-0.5">
            {jobDescription.trim()
              ? 'Evaluating role-specific keyword matching, required skill coverage, and ATS formatting.'
              : 'Running general machine-readability, structure, and credential quality benchmarks.'}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleRunAnalysis}
          disabled={isScanning || (inputMode === 'file-upload' && !selectedFile)}
          className="gap-2 w-full sm:w-auto shadow-sm"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{scanProgressMessage || 'Analyzing Document...'}</span>
            </>
          ) : (
            <>
              <ScanSearch className="w-4 h-4" />
              <span>Run ATS Resume Analysis</span>
            </>
          )}
        </Button>
      </div>

      {/* Parsing Error Banner */}
      {parsingError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Resume Parsing Error:</span>
            <p className="leading-relaxed">{parsingError}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
       * SECTION 2: RESULTS DASHBOARD
       * ========================================================================= */}
      {atsReport && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-250">
          {/* Top Score Banner Card */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E5E0D8] shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E0D8]">
              {/* Left Score Gauge */}
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#101010] text-[#F8F5EE] flex flex-col items-center justify-center shrink-0 shadow-md">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {atsReport.overallScore}
                  </span>
                  <span className="text-[10px] font-semibold text-[#DDD5C7] uppercase tracking-wider">
                    Out of 100
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        atsReport.overallScore >= 80
                          ? 'bg-[#EBF5EE] text-[#1E5631]'
                          : atsReport.overallScore >= 60
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {atsReport.scoreLabel}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#555555] border border-[#E5E0D8]">
                      {atsReport.mode === 'job-specific' ? 'Job-Specific Match' : 'General Quality Analysis'}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-[#101010]">
                    {atsReport.jobTitle ? `${atsReport.jobTitle} Match Assessment` : 'Resume Parsability Assessment'}
                  </h3>
                  <p className="text-xs text-[#777777] max-w-xl leading-relaxed">
                    {atsReport.scoreExplanation}
                  </p>
                </div>
              </div>

              {/* Right Quick Summary Meta */}
              <div className="w-full md:w-auto p-4 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] text-xs space-y-1.5 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#777777]">Analyzed Document:</span>
                  <span className="font-bold text-[#101010] truncate max-w-[160px]">{atsReport.fileName || 'ProFile Draft'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#777777]">Evaluation Mode:</span>
                  <span className="font-semibold text-[#101010]">
                    {atsReport.mode === 'job-specific' ? 'Role Targeted' : 'General Quality'}
                  </span>
                </div>
                {atsReport.mode === 'job-specific' && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#777777]">Required Skills Match:</span>
                    <span className="font-bold text-[#1E5631]">
                      {atsReport.requiredSkillsMatch.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Official ProFile ATS Disclaimer Notice */}
            <div className="p-3.5 rounded-2xl bg-[#F8F5EE] border border-[#E5E0D8] text-[11px] text-[#666666] flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-[#101010] shrink-0 mt-0.5" />
              <p>
                <strong>Independent Evaluation:</strong> {atsReport.disclaimer}
              </p>
            </div>
          </div>

          {/* AI-Style Analysis Summary Card */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E5E0D8] shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E0D8]">
              <ScanSearch className="w-5 h-5 text-[#101010]" />
              <h3 className="font-bold text-sm text-[#101010]">Resume Analysis Summary &amp; Diagnostic</h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] text-xs text-[#333333] leading-relaxed">
              <p className="font-medium">{atsReport.summary.whyThisScore}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
              {/* Strongest Qualifications */}
              <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#101010] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strongest Qualifications</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#555555]">
                  {atsReport.summary.strongestQualifications.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Primary Missing Requirements */}
              <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#101010] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Top Missing Requirements</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#555555]">
                  {atsReport.summary.topMissingRequirements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top 3 Recommended Next Steps */}
              <div className="p-4 rounded-2xl bg-[#FBF9F5] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#101010] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#101010]" />
                  <span>Top Next Improvements</span>
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#555555]">
                  {atsReport.summary.topNextSteps.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-[#101010]">{idx + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Individual Category Score Breakdown */}
          <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E5E0D8] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">Evaluation Category Breakdown &amp; Weighted Scoring</h3>
              </div>
              <span className="text-xs text-[#777777] font-semibold">
                Transparent Weights
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {atsReport.categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#101010]">{cat.label}</span>
                    <span className="font-mono font-bold text-[#101010]">
                      {cat.earnedPoints} / {cat.maxPoints} pts
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#E5E0D8] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        cat.score >= 75
                          ? 'bg-emerald-600'
                          : cat.score >= 45
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, cat.score))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#666666] leading-relaxed">{cat.details}</p>

                  {cat.suggestions.length > 0 && cat.suggestions[0] && (
                    <div className="text-[11px] text-[#777777] pt-1 border-t border-[#EBE6DC] flex items-start gap-1.5">
                      <span className="font-bold text-[#101010] shrink-0">Tip:</span>
                      <span>{cat.suggestions[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills & Keyword Match Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Required Skills Match */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                <h4 className="font-bold text-xs text-[#101010] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Required Skills Found ({atsReport.requiredSkillsMatch.present.length})</span>
                </h4>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {atsReport.requiredSkillsMatch.percentage}% Match
                </span>
              </div>

              {atsReport.requiredSkillsMatch.present.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {atsReport.requiredSkillsMatch.present.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-[#EBF5EE] text-[#1E5631] text-[11px] font-semibold border border-emerald-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#777777]">No explicitly required skills matched.</p>
              )}

              {atsReport.requiredSkillsMatch.missing.length > 0 && (
                <div className="pt-3 border-t border-[#E5E0D8] space-y-2">
                  <span className="font-bold text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Missing Required Skills ({atsReport.requiredSkillsMatch.missing.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {atsReport.requiredSkillsMatch.missing.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Keyword Relevance */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                <h4 className="font-bold text-xs text-[#101010] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#101010]" />
                  <span>Job Keywords Indexed ({atsReport.matchedKeywords.length})</span>
                </h4>
                <span className="text-[11px] font-semibold text-[#777777]">
                  Frequency Count
                </span>
              </div>

              {atsReport.matchedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {atsReport.matchedKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#101010] text-[11px] font-semibold border border-[#E5E0D8] flex items-center gap-1"
                    >
                      <span>{kw.term}</span>
                      <span className="text-[10px] text-[#777777]">×{kw.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#777777]">No domain keywords indexed.</p>
              )}

              {atsReport.missingKeywords.length > 0 && (
                <div className="pt-3 border-t border-[#E5E0D8] space-y-2">
                  <span className="font-bold text-xs text-[#101010]">
                    Recommended Additional Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {atsReport.missingKeywords.slice(0, 8).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-white text-[#666666] text-[11px] border border-[#DDD5C7]"
                      >
                        {kw.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Parsing & Compatibility Warnings */}
          {atsReport.compatibilityWarnings.length > 0 && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E5E0D8] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E5E0D8]">
                <ShieldCheck className="w-5 h-5 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">ATS Compatibility &amp; Parsing Audit</h3>
              </div>

              <div className="space-y-3">
                {atsReport.compatibilityWarnings.map((w) => (
                  <div
                    key={w.id}
                    className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                      w.severity === 'error'
                        ? 'bg-red-50/60 border-red-200 text-red-900'
                        : w.severity === 'warning'
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-[#F8F8F6] border-[#E5E0D8] text-[#444444]'
                    }`}
                  >
                    {w.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    ) : w.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-[#101010] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <span className="font-bold">{w.title}</span>
                      <p className="leading-relaxed">{w.description}</p>
                      <p className="text-[11px] font-medium opacity-90">
                        <strong>Recommendation:</strong> {w.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritized Action Checklist */}
          {atsReport.actionChecklist.length > 0 && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E5E0D8] shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#101010]" />
                  <h3 className="font-bold text-sm text-[#101010]">Prioritized Optimization Checklist</h3>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToBuilder}
                  className="gap-1.5"
                >
                  <span>Apply in Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2.5">
                {atsReport.actionChecklist.map((item) => {
                  const isChecked = Boolean(checkedActionItems[item.id]);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleActionItem(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-[#F9F8F6] border-[#E5E0D8] opacity-60'
                          : 'bg-white border-[#E5E0D8] hover:border-[#101010]'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-[#101010] shrink-0 cursor-pointer"
                        aria-label="Toggle task"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-[#888888]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${isChecked ? 'line-through text-[#888888]' : 'text-[#101010]'}`}>
                            {item.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-[#1E5631] bg-[#EBF5EE] px-2 py-0.5 rounded-full">
                              {item.impact}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.priority === 'high'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {item.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#666666] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
