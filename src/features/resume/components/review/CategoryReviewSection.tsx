/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — 5-Category Detailed Review Section
 * Displays structured audit findings across Content Quality, Role Suitability,
 * Job Description Matching, Completeness, and ATS Readability.
 */

import { useState } from 'react';
import { FinalResumeReviewReport } from '../../../../types/resumeReview.ts';
import {
  FileText,
  Target,
  Briefcase,
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ScanSearch,
} from 'lucide-react';

interface CategoryReviewSectionProps {
  report: FinalResumeReviewReport;
}

export function CategoryReviewSection({ report }: CategoryReviewSectionProps) {
  const [activeCategory, setActiveCategory] = useState<
    'content' | 'role' | 'jd' | 'completeness' | 'ats'
  >('content');

  const getRatingBadge = (rating: 'strong' | 'good' | 'needs-work') => {
    switch (rating) {
      case 'strong':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Strong
          </span>
        );
      case 'good':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Good
          </span>
        );
      case 'needs-work':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Needs Polish
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-2xs">
      {/* Category Navigation Bar */}
      <div className="flex border-b border-[#E5E0D8] bg-[#FAF9F5] overflow-x-auto scrollbar-none text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveCategory('content')}
          className={`px-4 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'content'
              ? 'border-[#101010] text-[#101010] bg-white font-bold'
              : 'border-transparent text-[#666666] hover:text-[#101010]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#8C6D1F]" />
          <span>A. Content Quality</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('role')}
          className={`px-4 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'role'
              ? 'border-[#101010] text-[#101010] bg-white font-bold'
              : 'border-transparent text-[#666666] hover:text-[#101010]'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-blue-600" />
          <span>B. Target Role Suitability</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('jd')}
          className={`px-4 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'jd'
              ? 'border-[#101010] text-[#101010] bg-white font-bold'
              : 'border-transparent text-[#666666] hover:text-[#101010]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
          <span>C. JD Matching {report.hasJobDescription ? '(Active)' : '(Role-Based)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('completeness')}
          className={`px-4 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'completeness'
              ? 'border-[#101010] text-[#101010] bg-white font-bold'
              : 'border-transparent text-[#666666] hover:text-[#101010]'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
          <span>D. Completeness</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('ats')}
          className={`px-4 py-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeCategory === 'ats'
              ? 'border-[#101010] text-[#101010] bg-white font-bold'
              : 'border-transparent text-[#666666] hover:text-[#101010]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>E. ATS Readability</span>
        </button>
      </div>

      {/* Category Content Panels */}
      <div className="p-4 sm:p-6">
        {/* CATEGORY A: CONTENT QUALITY */}
        {activeCategory === 'content' && (
          <div className="space-y-4">
            <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#101010]">Professional Summary Quality</span>
                {getRatingBadge(report.contentQuality.summaryQuality.rating)}
              </div>
              <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                {report.contentQuality.summaryQuality.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#101010]">Strength of Project Descriptions</span>
                {getRatingBadge(report.contentQuality.projectDescriptions.rating)}
              </div>
              <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                {report.contentQuality.projectDescriptions.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#101010]">Action Verbs & Bullet-Point Quality</span>
                {getRatingBadge(report.contentQuality.actionVerbsQuality.rating)}
              </div>
              <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                {report.contentQuality.actionVerbsQuality.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#101010]">Measurable Outcomes & Metric Density</span>
                {getRatingBadge(report.contentQuality.measurableOutcomes.rating)}
              </div>
              <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                {report.contentQuality.measurableOutcomes.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-[#101010]">Grammar, Clarity & Readability</span>
                {getRatingBadge(report.contentQuality.grammarAndClarity.rating)}
              </div>
              <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                {report.contentQuality.grammarAndClarity.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CATEGORY B: TARGET ROLE SUITABILITY */}
        {activeCategory === 'role' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF5EC] border border-[#E8DEC8] rounded-xl text-xs text-[#8C6D1F]">
              Evaluated against requirements for <strong>{report.targetRole}</strong> ({report.purpose}).
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#101010]">Technical Skills Relevance</span>
                  {getRatingBadge(report.roleSuitability.technicalRelevance.rating)}
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {report.roleSuitability.technicalRelevance.notes}
                </p>
              </div>

              <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#101010]">Project Relevance</span>
                  {getRatingBadge(report.roleSuitability.projectRelevance.rating)}
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {report.roleSuitability.projectRelevance.notes}
                </p>
              </div>

              <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#101010]">Relevant Coursework</span>
                  {getRatingBadge(report.roleSuitability.courseworkRelevance.rating)}
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {report.roleSuitability.courseworkRelevance.notes}
                </p>
              </div>

              <div className="border border-[#F0ECE3] rounded-xl p-4 bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#101010]">Experience & Internship Relevance</span>
                  {getRatingBadge(report.roleSuitability.experienceRelevance.rating)}
                </div>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {report.roleSuitability.experienceRelevance.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY C: JOB DESCRIPTION MATCHING */}
        {activeCategory === 'jd' && (
          <div>
            {report.hasJobDescription && report.jdMatching ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE3]">
                  <div>
                    <h4 className="font-bold text-sm text-[#101010]">
                      {report.jobTitle || report.targetRole}
                      {report.companyName ? ` at ${report.companyName}` : ''}
                    </h4>
                    <p className="text-xs text-[#777777]">Parsed JD skills comparison</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matching Required Skills */}
                  <div className="p-3.5 border border-emerald-200 bg-emerald-50/40 rounded-xl">
                    <span className="text-xs font-bold text-emerald-800 block mb-2">
                      Matching Required Skills ({report.jdMatching.matchingRequiredSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.jdMatching.matchingRequiredSkills.length > 0 ? (
                        report.jdMatching.matchingRequiredSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium"
                          >
                            ✓ {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#777777]">None detected</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Required Skills */}
                  <div className="p-3.5 border border-rose-200 bg-rose-50/40 rounded-xl">
                    <span className="text-xs font-bold text-rose-800 block mb-2">
                      Missing Required Skills ({report.jdMatching.missingRequiredSkills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.jdMatching.missingRequiredSkills.length > 0 ? (
                        report.jdMatching.missingRequiredSkills.map((sk, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-medium"
                          >
                            + {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">All core skills present!</span>
                      )}
                    </div>
                  </div>

                  {/* Matching Keywords */}
                  <div className="p-3.5 border border-[#E5E0D8] bg-[#FAF9F5] rounded-xl">
                    <span className="text-xs font-bold text-[#101010] block mb-2">
                      Matching Role Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.jdMatching.matchingKeywords || []).map((kw, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[#333333]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div className="p-3.5 border border-[#E5E0D8] bg-[#FAF9F5] rounded-xl">
                    <span className="text-xs font-bold text-[#101010] block mb-2">
                      Missing Keywords to Consider
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(report.jdMatching.missingKeywords || []).map((kw, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Highlighted Evidence */}
                {report.jdMatching.highlightedEvidence && report.jdMatching.highlightedEvidence.length > 0 && (
                  <div className="p-3.5 border border-[#E5E0D8] bg-[#FAF9F5] rounded-xl">
                    <span className="text-xs font-bold text-[#101010] block mb-2">
                      Evidence from Your Resume Aligning with JD:
                    </span>
                    <ul className="text-xs text-[#555555] space-y-1 list-disc list-inside">
                      {report.jdMatching.highlightedEvidence.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-[#FAF9F5] rounded-xl border border-dashed border-[#E5E0D8]">
                <Target className="w-8 h-8 text-[#8C6D1F] mx-auto mb-2 opacity-70" />
                <h4 className="text-sm font-bold text-[#101010] mb-1">
                  Role-Based Evaluation Mode Active
                </h4>
                <p className="text-xs text-[#666666] max-w-md mx-auto mb-3">
                  No specific job description was attached during setup. We are evaluating your resume
                  against general industry benchmarks for <strong>{report.targetRole}</strong>.
                </p>
                <p className="text-[11px] text-[#888888]">
                  Tip: You can attach a specific job description in Step 1 (Setup) at any time to unlock
                  exact keyword matching.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CATEGORY D: RESUME COMPLETENESS */}
        {activeCategory === 'completeness' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <ScanSearch className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Student & Fresher Rule Enforced: </strong>
                Students and freshers are evaluated on academic achievements, engineering projects, and
                coursework—never penalized for lacking full-time corporate employment.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              {[
                { label: 'Contact Information', ok: report.completeness.hasContact, req: true },
                { label: 'Professional Summary', ok: report.completeness.hasSummary, req: false },
                { label: 'Education History', ok: report.completeness.hasEducation, req: true },
                { label: 'Technical Skills', ok: report.completeness.hasSkills, req: true },
                { label: 'Engineering Projects', ok: report.completeness.hasProjects, req: true },
                {
                  label: 'Experience & Internships',
                  ok: report.completeness.hasExperience || report.completeness.isFresherAppropriate,
                  note: report.completeness.isFresherAppropriate ? 'Optional for freshers' : undefined,
                  req: false,
                },
                { label: 'Certifications', ok: report.completeness.hasCertifications, req: false },
                { label: 'Achievements & Awards', ok: report.completeness.hasAchievements, req: false },
                { label: 'Relevant Coursework', ok: report.completeness.hasCoursework, req: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    item.ok
                      ? 'bg-emerald-50/40 border-emerald-200 text-[#101010]'
                      : 'bg-[#FAF9F5] border-[#E5E0D8] text-[#777777]'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{item.label}</span>
                    {item.note && <span className="text-[10px] text-[#777777]">{item.note}</span>}
                  </div>
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : item.req ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-[#999999]">Optional</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY E: ATS READABILITY */}
        {activeCategory === 'ats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 border border-[#F0ECE3] bg-[#FAF9F5] rounded-xl">
                <span className="font-bold text-[#101010] block mb-1">Standard Section Headings</span>
                <p className="text-[#555555]">
                  {report.atsReadability.standardHeadingsUsed
                    ? '✓ Using standard headings (Education, Skills, Experience, Projects) recognizable by ATS parsers.'
                    : '⚠ Non-standard heading detected.'}
                </p>
              </div>

              <div className="p-3.5 border border-[#F0ECE3] bg-[#FAF9F5] rounded-xl">
                <span className="font-bold text-[#101010] block mb-1">Contact Parsability</span>
                <p className="text-[#555555]">
                  {report.atsReadability.contactParsable
                    ? '✓ Email, phone number, and location formatted in header block for accurate parsing.'
                    : '⚠ Missing critical contact info.'}
                </p>
              </div>

              <div className="p-3.5 border border-[#F0ECE3] bg-[#FAF9F5] rounded-xl">
                <span className="font-bold text-[#101010] block mb-1">Formatting & Column Risk</span>
                <p className="text-[#555555]">
                  Risk level: <strong className="capitalize">{report.atsReadability.formattingRisk}</strong>.
                  Standard clean document layout avoids table parsing confusion.
                </p>
              </div>

              <div className="p-3.5 border border-[#F0ECE3] bg-[#FAF9F5] rounded-xl">
                <span className="font-bold text-[#101010] block mb-1">Text Overflow & Layout Fit</span>
                <p className="text-[#555555]">
                  {report.atsReadability.overflowRisk === 'none'
                    ? '✓ Document word count is well-proportioned for 1-2 standard pages.'
                    : '⚠ Content may exceed optimal single-page density.'}
                </p>
              </div>
            </div>

            {report.atsReadability.unresolvedPlaceholders &&
              report.atsReadability.unresolvedPlaceholders.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Unresolved Bracketed Placeholders Detected:
                  </div>
                  <p className="mb-1.5">
                    Your resume currently contains placeholder markers:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {report.atsReadability.unresolvedPlaceholders.map((ph, idx) => (
                      <code key={idx} className="bg-white px-2 py-0.5 rounded border border-amber-200 font-mono text-[11px]">
                        {ph}
                      </code>
                    ))}
                  </div>
                </div>
              )}

            <div className="text-[11px] text-[#777777] italic">
              Notice: We do not claim universal compatibility with every proprietary ATS vendor. All ATS
              readability recommendations adhere to open parsing standards (Text extraction, ISO heading hierarchy, and UTF-8 typography).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
