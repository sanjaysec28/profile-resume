/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Projects Recommendations View
 * Clearly segregates:
 * 1. Evaluation & Optimization of Existing Student Projects
 * 2. Suggested Project Ideas for Future Portfolio Growth (Unverified)
 */

import React from 'react';
import {
  ExistingProjectRecommendation,
  ProjectIdeaRecommendation,
} from '../../../../types/recommendations.ts';
import {
  FolderGit2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProjectsAdviceViewProps {
  existingProjectAdvice: ExistingProjectRecommendation[];
  suggestedProjectIdeas: ProjectIdeaRecommendation[];
}

export function ProjectsAdviceView({
  existingProjectAdvice,
  suggestedProjectIdeas,
}: ProjectsAdviceViewProps) {
  return (
    <div className="space-y-10">
      {/* SECTION 1: EXISTING STUDENT PROJECTS EVALUATION */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#171513]" />
            <h3 className="text-base sm:text-lg font-bold text-[#171513]">
              Evaluation of Your Existing Projects
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
            How your currently listed builds align with employer expectations for this target role.
          </p>
        </div>

        {existingProjectAdvice.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E0D8] text-center text-xs text-[#7A7368]">
            No projects detected in your current resume draft yet. Use the project ideas below to build compelling portfolio work!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingProjectAdvice.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-base font-bold text-[#171513]">
                      {proj.title}
                    </h4>
                    {typeof proj.relevanceScore === 'number' && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          proj.relevanceScore >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.relevanceScore >= 60
                            ? 'bg-[#FAF4E5] text-[#8C6D1F]'
                            : 'bg-[#EFECE6] text-[#625D56]'
                        }`}
                      >
                        {proj.relevanceScore}% Role Match
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#524E48] leading-relaxed mb-3">
                    {proj.explanation}
                  </p>

                  {proj.whyItMatters && (
                    <p className="text-[11px] text-[#787168] bg-[#F7F4EE] p-2.5 rounded-xl border border-[#EFECE6] mb-3">
                      <strong className="text-[#171513]">Why Highlight:</strong> {proj.whyItMatters}
                    </p>
                  )}

                  {proj.bulletImprovementTips && proj.bulletImprovementTips.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#F0EBE1]">
                      <span className="text-[11px] font-bold text-[#171513] uppercase tracking-wider block">
                        Actionable Bullet Point Improvements:
                      </span>
                      <ul className="space-y-1 text-xs text-[#625D56]">
                        {proj.bulletImprovementTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-[#171513] shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: SUGGESTED PROJECT IDEAS (UNVERIFIED) */}
      <div className="space-y-4">
        {/* Strict Honesty Notice Banner */}
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm mb-0.5">
              Strict Verification Notice: Project Ideas for Future Building
            </strong>
            The projects listed below are conceptual suggestions to strengthen your skillset. ProFile prohibits listing unfinished ideas as completed work on your resume. Build and deploy them first!
          </div>
        </div>

        <div className="pb-2 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#8C6D1F]" />
            <h3 className="text-base sm:text-lg font-bold text-[#171513]">
              Suggested Project Ideas to Build
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
            High-impact ideas tailored to fill portfolio gaps for {suggestedProjectIdeas[0]?.whyItMatters ? 'your target role' : 'your profile'}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedProjectIdeas.map((idea) => (
            <div
              key={idea.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-base font-bold text-[#171513]">
                    {idea.title}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF4E5] text-[#8C6D1F] border border-[#EADAB8] shrink-0">
                    {idea.complexity || 'Intermediate'}
                  </span>
                </div>

                <p className="text-xs text-[#524E48] leading-relaxed mb-3">
                  {idea.explanation}
                </p>

                {/* Tech Stack */}
                {idea.techStack && idea.techStack.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {idea.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#ECE7DE] text-[#625D56]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Sample Deliverables */}
                {idea.sampleDeliverables && idea.sampleDeliverables.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#F0EBE1] text-xs text-[#625D56]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#171513] block">
                      Recommended Deliverables:
                    </span>
                    {idea.sampleDeliverables.map((deliv, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-[#7A7368]" />
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[#EFECE6] text-[10px] text-[#A0988A] italic">
                {idea.disclaimer || 'Suggested idea for future build; do not mark as completed until built'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
