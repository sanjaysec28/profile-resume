/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — PDF Export QA Test Harness
 * Renders test cases into real DOM and allows headless or manual trigger of exportResumeToPdf.
 */

import { useState, useEffect } from 'react';
import { ResumeLivePreview } from '../components/ResumeLivePreview.tsx';
import { exportResumeToPdf, PdfExportResult } from '../utils/pdfExport.ts';
import { ALL_TEST_CASES } from './testCases.ts';
import { ResumeData } from '../../../types/resume.ts';

declare global {
  interface Window {
    __PRO_FILE_QA__?: {
      runExport: (caseKey: keyof typeof ALL_TEST_CASES) => Promise<PdfExportResult>;
      setCase: (caseKey: keyof typeof ALL_TEST_CASES) => void;
      getAvailableCases: () => string[];
    };
  }
}

export function PdfQaTestHarness() {
  const [selectedCaseKey, setSelectedCaseKey] = useState<keyof typeof ALL_TEST_CASES>('case_a');
  const [status, setStatus] = useState<string>('Ready');
  const [lastResult, setLastResult] = useState<PdfExportResult | null>(null);

  const activeData: ResumeData = ALL_TEST_CASES[selectedCaseKey];

  const handleExecuteExport = async (caseKey?: keyof typeof ALL_TEST_CASES): Promise<PdfExportResult> => {
    const key = caseKey || selectedCaseKey;
    const targetData = ALL_TEST_CASES[key];
    setSelectedCaseKey(key);
    setStatus(`Exporting ${key}...`);

    // Give browser brief tick to re-render DOM
    await new Promise((resolve) => setTimeout(resolve, 80));

    const result = await exportResumeToPdf({
      elementId: 'qa-test-resume-document',
      fullName: targetData.personalInfo.fullName,
      autoDownload: false, // Don't trigger browser save dialog during automated tests
      onProgress: (_step, msg) => {
        setStatus(msg);
      },
    });

    setLastResult(result);
    setStatus(result.success ? `Done (${result.totalPages} pages)` : `Failed: ${result.error}`);
    return result;
  };

  useEffect(() => {
    window.__PRO_FILE_QA__ = {
      runExport: handleExecuteExport,
      setCase: (k) => setSelectedCaseKey(k),
      getAvailableCases: () => Object.keys(ALL_TEST_CASES),
    };
  }, [selectedCaseKey]);

  return (
    <div className="min-h-screen bg-[#F4EFE6] p-4 text-[#101010] font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* QA Control Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg font-bold">ProFile — PDF QA Test Harness</h1>
            <p className="text-xs text-[#777777]">
              Current Case: <strong className="text-[#101010]">{activeData.title}</strong> ({activeData.templateId})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCaseKey}
              onChange={(e) => setSelectedCaseKey(e.target.value as keyof typeof ALL_TEST_CASES)}
              className="text-xs bg-[#FAF8F5] border border-[#D5CFBF] rounded-xl px-3 py-2 font-semibold"
            >
              {Object.entries(ALL_TEST_CASES).map(([key, data]) => (
                <option key={key} value={key}>
                  {key.toUpperCase()}: {data.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleExecuteExport()}
              className="px-4 py-2 bg-[#101010] text-white rounded-xl text-xs font-semibold hover:bg-[#252525] cursor-pointer"
            >
              Run Export Test
            </button>
          </div>
        </div>

        {/* Status display */}
        <div className="text-xs font-mono bg-white px-4 py-2 rounded-xl border border-[#E5E0D8] flex items-center justify-between">
          <span>Status: <strong>{status}</strong></span>
          {lastResult && (
            <span>
              Last Result: {lastResult.success ? `Success (${lastResult.totalPages} pages, ${lastResult.filename})` : `Error: ${lastResult.error}`}
            </span>
          )}
        </div>

        {/* Document Rendering Frame */}
        <div className="flex justify-center bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-sm overflow-x-auto">
          <ResumeLivePreview
            id="qa-test-resume-document"
            data={activeData}
            scale={1}
          />
        </div>
      </div>
    </div>
  );
}
