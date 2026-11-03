/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard | Step 3: Job Description (Optional)
 * Multiline textarea with character counter, clipboard paste helper,
 * and option to proceed with or without JD.
 */

import React from 'react';
import { JobDescriptionData } from '../../../../types/resumeSetup.ts';
import {
  FileText,
  ClipboardPaste,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ScanSearch,
} from 'lucide-react';

interface Step3JobDescriptionProps {
  jobDescription: JobDescriptionData;
  onChange: (jd: JobDescriptionData) => void;
  onContinueWithoutJD: () => void;
}

const MAX_CHAR_COUNT = 5000;

export function Step3JobDescription({
  jobDescription,
  onChange,
  onContinueWithoutJD,
}: Step3JobDescriptionProps) {
  const currentText = jobDescription.text || '';
  const charCount = currentText.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange({
      text: val,
      charCount: val.length,
      provided: val.trim().length > 0,
      companyName: jobDescription.companyName,
      jobTitle: jobDescription.jobTitle,
    });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange({
          text,
          charCount: text.length,
          provided: text.trim().length > 0,
          companyName: jobDescription.companyName,
          jobTitle: jobDescription.jobTitle,
        });
      }
    } catch {
      // In case clipboard permissions are blocked in iframe
    }
  };

  const handleClear = () => {
    onChange({
      text: '',
      charCount: 0,
      provided: false,
    });
  };

  const handleLoadSampleJD = () => {
    const sample = `About the Role:
We are seeking a motivated Developer Intern to join our engineering team.

Responsibilities:
- Build, test, and ship responsive front-end and full-stack web applications.
- Collaborate with designers and backend engineers to integrate RESTful APIs.
- Write clean, maintainable, and well-tested TypeScript and React components.
- Optimize web app performance and ensure cross-browser compatibility.

Requirements:
- Enrolled in B.Tech/B.S. in Computer Science or related degree.
- Familiarity with modern JavaScript/TypeScript, React, Tailwind CSS, and Git.
- Solid understanding of data structures, algorithms, and web fundamentals.
- Strong communication and collaborative problem-solving skills.`;

    onChange({
      text: sample,
      charCount: sample.length,
      provided: true,
      companyName: 'Tech Innovations Inc.',
      jobTitle: 'Software Engineer Intern',
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-xs font-semibold text-[#625D56] uppercase tracking-wider mb-2">
          Step 3 of 5 • Job Matching
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight">
            Target Job Description
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4E5] border border-[#EADAB8] text-[#8C6D1F] text-xs font-semibold w-fit">
            <ScanSearch className="w-3.5 h-3.5" />
            Optional Step
          </span>
        </div>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D56] max-w-2xl">
          Paste the job posting you want to apply for. Providing a job description enables ProFile to tailor keyword matching and ATS scoring accurately. You can also skip this step!
        </p>
      </div>

      {/* Editor Box */}
      <div className="rounded-2xl border border-[#E2DDD5] bg-white p-5 shadow-xs space-y-4">
        {/* Top Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EBE1] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7A7368]" />
            <span className="text-xs font-semibold text-[#171513] uppercase tracking-wider">
              Paste Posting Text
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F2EB] hover:bg-[#EAE5DC] text-xs font-semibold text-[#171513] transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste from Clipboard
            </button>
            <button
              type="button"
              onClick={handleLoadSampleJD}
              className="text-xs font-semibold text-[#7A7368] hover:text-[#171513] underline transition-colors cursor-pointer"
            >
              Load Sample
            </button>
            {currentText.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            rows={9}
            value={currentText}
            onChange={handleTextChange}
            placeholder="Paste role description, responsibilities, requirements, and required qualifications here..."
            className={`w-full p-4 rounded-xl border text-sm text-[#171513] placeholder-[#A39B8E] focus:outline-none focus:ring-2 transition-all resize-y ${
              isOverLimit
                ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                : 'border-[#E2DDD5] focus:ring-[#171513] bg-[#FAF8F5]'
            }`}
          />
        </div>

        {/* Footer info: Character counter & status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#625D56]">
            {jobDescription.provided ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Job description attached ({charCount} characters)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#8A8275]">
                <HelpCircle className="w-3.5 h-3.5" />
                No job description pasted yet (totally fine to proceed without one)
              </span>
            )}
          </div>

          <div
            className={`font-mono font-medium ${
              isOverLimit ? 'text-red-600 font-bold' : 'text-[#8A8275]'
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHAR_COUNT.toLocaleString()} chars
          </div>
        </div>
      </div>

      {/* Alternative Action Bar */}
      {!jobDescription.provided && (
        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EBE6DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#625D56]">
          <span>Don't have a job description right now? You can skip directly to the next step.</span>
          <button
            type="button"
            onClick={onContinueWithoutJD}
            className="px-4 py-2 rounded-xl bg-[#171513] text-white font-semibold hover:bg-[#2A2724] transition-colors whitespace-nowrap cursor-pointer"
          >
            Skip & Continue
          </button>
        </div>
      )}
    </div>
  );
}
