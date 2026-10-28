/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ResumeData, ResumeTemplateId } from '../../../../types/resume.ts';
import { RESUME_TEMPLATES_CATALOG, ResumeTemplateInfo } from '../../constants.ts';
import { Check, Sparkles, ShieldCheck, Eye } from 'lucide-react';

interface TemplateSelectStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
  onGeneratePreview: () => void;
}

export function TemplateSelectStep({
  data,
  onChange,
  onGeneratePreview,
}: TemplateSelectStepProps) {
  const [filter, setFilter] = useState<'all' | 'ats-first' | 'visual-first'>('all');
  const currentTemplate = data.templateId || 'modern';

  const handleSelect = (id: ResumeTemplateId) => {
    onChange((prev) => ({
      ...prev,
      templateId: id,
    }));
  };

  const filteredTemplates = RESUME_TEMPLATES_CATALOG.filter((t) => {
    if (filter === 'ats-first') return t.category === 'ats-first';
    if (filter === 'visual-first') return t.category === 'visual-first';
    return true;
  });

  const activeTemplateInfo =
    RESUME_TEMPLATES_CATALOG.find((t) => t.id === currentTemplate) ||
    RESUME_TEMPLATES_CATALOG[0];

  return (
    <div className="space-y-6">
      {/* Category Filter Pills & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E0D8]">
        <div>
          <h3 className="text-base font-bold text-[#101010]">
            Choose from 10 Professional Resume Layouts
          </h3>
          <p className="text-xs text-[#777777] mt-0.5">
            Every template is precision-crafted for A4 single-page and multi-page printing with high ATS parse rates.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EAE5DC]/60 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#101010] shadow-xs'
                : 'text-[#777777] hover:text-[#101010]'
            }`}
          >
            All ({RESUME_TEMPLATES_CATALOG.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ats-first')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'ats-first'
                ? 'bg-white text-[#101010] shadow-xs'
                : 'text-[#777777] hover:text-[#101010]'
            }`}
          >
            ATS-First (95%+)
          </button>
          <button
            type="button"
            onClick={() => setFilter('visual-first')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filter === 'visual-first'
                ? 'bg-white text-[#101010] shadow-xs'
                : 'text-[#777777] hover:text-[#101010]'
            }`}
          >
            Visual & Creative
          </button>
        </div>
      </div>

      {/* Templates 10-Item Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {filteredTemplates.map((tpl) => {
          const isSelected =
            currentTemplate === tpl.id ||
            (currentTemplate === 'minimal-cream' && tpl.id === 'modern') ||
            (currentTemplate === 'executive-mono' && tpl.id === 'classic');

          return (
            <div
              key={tpl.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(tpl.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(tpl.id);
                }
              }}
              className={`group relative flex flex-col p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-left ${
                isSelected
                  ? 'bg-white border-[#101010] shadow-md ring-2 ring-[#101010] -translate-y-1'
                  : 'bg-[#F8F8F6] border-[#E5E0D8] hover:border-[#B8B0A2] hover:bg-white hover:shadow-xs'
              }`}
            >
              {/* Top Badges: ATS Score & Selected Status */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#F0ECE1] text-[#242424]">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#101010]" />
                  {tpl.atsScore} ATS
                </span>
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-[#101010] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-[#888888] group-hover:text-[#101010]">
                    Select
                  </span>
                )}
              </div>

              {/* Realistic Template Layout Thumbnail */}
              <TemplateMiniatureThumbnail template={tpl} />

              {/* Title & Tagline */}
              <div className="mt-2.5 w-full">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#101010] truncate">
                    {tpl.name}
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-[#EAE5DC] text-[#444444] shrink-0">
                    {tpl.badge}
                  </span>
                </div>
                <span className="text-[10px] text-[#777777] block mt-0.5 line-clamp-1">
                  {tpl.tagline}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Template Details Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-bold text-[#101010]">
              Active Template: {activeTemplateInfo.name}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#101010] text-white">
              {activeTemplateInfo.badge}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#EBF5EE] text-[#1E5631] border border-[#CDE5D2]">
              ATS Score: {activeTemplateInfo.atsScore} Match
            </span>
          </div>
          <p className="text-xs text-[#666666] max-w-2xl">
            {activeTemplateInfo.description}
          </p>
          <p className="text-[11px] text-[#888888]">
            <span className="font-semibold text-[#101010]">Ideal For:</span> {activeTemplateInfo.recommendedFor}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGeneratePreview}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Generate Full Preview →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * High-fidelity miniature visual representation of each template's unique layout
 */
function TemplateMiniatureThumbnail({ template }: { template: ResumeTemplateInfo }) {
  const { id } = template;

  return (
    <div className="w-full aspect-[1/1.33] bg-white rounded-lg border border-[#E8E3DA] p-2 flex flex-col justify-between overflow-hidden shadow-2xs group-hover:shadow-xs transition-shadow relative">
      {/* 1. Contemporary Sidebar (Split 2-Column) */}
      {id === 'contemporary-sidebar' && (
        <div className="w-full h-full flex gap-1.5">
          <div className="w-1/3 bg-[#F0ECE4] -m-2 p-2 flex flex-col justify-between border-r border-[#E5E0D8]">
            <div className="space-y-1">
              <div className="w-5 h-5 rounded-full bg-[#101010]/20 mx-auto" />
              <div className="h-1 w-full bg-[#101010] rounded-xs mt-1" />
              <div className="h-0.5 w-3/4 bg-[#888888] rounded-xs" />
              <div className="pt-1 space-y-0.5">
                <div className="h-0.5 w-full bg-[#B8B0A2] rounded-xs" />
                <div className="h-0.5 w-4/5 bg-[#B8B0A2] rounded-xs" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-8 bg-[#333333] rounded-xs" />
              <div className="h-0.5 w-full bg-[#C5BDAF] rounded-xs" />
              <div className="h-0.5 w-2/3 bg-[#C5BDAF] rounded-xs" />
            </div>
          </div>
          <div className="w-2/3 pl-1 flex flex-col justify-between py-0.5">
            <div className="space-y-1">
              <div className="h-1 w-10 bg-[#101010] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
              <div className="h-0.5 w-5/6 bg-[#E0D8CB] rounded-xs" />
            </div>
            <div className="space-y-1">
              <div className="h-1 w-12 bg-[#101010] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
              <div className="h-0.5 w-4/5 bg-[#E0D8CB] rounded-xs" />
            </div>
            <div className="space-y-1">
              <div className="h-1 w-8 bg-[#101010] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Creative (Dark Bold Header Banner) */}
      {id === 'creative' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="bg-[#1C1C1C] -mx-2 -mt-2 p-1.5 flex items-center justify-between mb-1.5">
            <div className="space-y-0.5">
              <div className="h-1.5 w-10 bg-white rounded-xs" />
              <div className="h-0.5 w-7 bg-white/60 rounded-xs" />
            </div>
            <div className="h-1 w-5 bg-white/40 rounded-xs" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex gap-1">
              <span className="h-1 w-6 bg-[#101010] rounded-xs" />
              <span className="h-1 flex-1 bg-[#F0ECE1] rounded-xs" />
            </div>
            <div className="h-0.5 w-full bg-[#E5E0D8] rounded-xs" />
            <div className="h-0.5 w-4/5 bg-[#EAE5DC] rounded-xs" />
            <div className="flex gap-1 pt-1">
              <div className="h-1.5 w-5 bg-[#E5E0D8] rounded-full" />
              <div className="h-1.5 w-6 bg-[#E5E0D8] rounded-full" />
              <div className="h-1.5 w-5 bg-[#E5E0D8] rounded-full" />
            </div>
          </div>
          <div className="pt-1 border-t border-[#F0ECE1] flex justify-between">
            <div className="h-0.5 w-8 bg-[#C5BDAF] rounded-xs" />
            <div className="h-0.5 w-4 bg-[#C5BDAF] rounded-xs" />
          </div>
        </div>
      )}

      {/* 3. Technical (Dev terminal tags, Monospace chips) */}
      {id === 'technical' && (
        <div className="w-full h-full flex flex-col justify-between font-mono">
          <div className="border-b border-[#101010]/20 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#101010]" />
              <div className="h-1 w-12 bg-[#101010] rounded-xs" />
            </div>
            <div className="h-1 w-6 bg-[#777777] rounded-xs" />
          </div>
          <div className="space-y-1.5 py-1">
            <div className="bg-[#F5F2EB] p-1 rounded-xs space-y-0.5">
              <div className="h-1 w-14 bg-[#101010] rounded-xs" />
              <div className="flex gap-1">
                <div className="h-1 w-4 bg-[#D1C8BA] rounded-xs" />
                <div className="h-1 w-4 bg-[#D1C8BA] rounded-xs" />
                <div className="h-1 w-4 bg-[#D1C8BA] rounded-xs" />
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-10 bg-[#333333] rounded-xs" />
              <div className="h-0.5 w-full bg-[#E0D8CB] rounded-xs" />
              <div className="h-0.5 w-3/4 bg-[#E0D8CB] rounded-xs" />
            </div>
          </div>
          <div className="flex items-center gap-1 pt-1 border-t border-[#EAE5DC]">
            <div className="h-1 w-3 bg-[#101010] rounded-xs" />
            <div className="h-0.5 w-10 bg-[#A3A3A3] rounded-xs" />
          </div>
        </div>
      )}

      {/* 4. Classic (Centered header, traditional divider) */}
      {id === 'classic' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="text-center space-y-0.5 pb-1 border-b border-[#101010]/20">
            <div className="h-1.5 w-14 bg-[#101010] rounded-xs mx-auto" />
            <div className="h-0.5 w-18 bg-[#777777] rounded-xs mx-auto" />
            <div className="h-0.5 w-12 bg-[#A3A3A3] rounded-xs mx-auto" />
          </div>
          <div className="space-y-1.5 py-1">
            <div className="space-y-0.5">
              <div className="h-1 w-10 bg-[#333333] rounded-xs border-b border-[#E5E0D8]" />
              <div className="h-0.5 w-full bg-[#C5BDAF] rounded-xs" />
              <div className="h-0.5 w-4/5 bg-[#D1C8BA] rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-12 bg-[#333333] rounded-xs border-b border-[#E5E0D8]" />
              <div className="h-0.5 w-full bg-[#C5BDAF] rounded-xs" />
              <div className="h-0.5 w-3/4 bg-[#D1C8BA] rounded-xs" />
            </div>
          </div>
          <div className="pt-1 border-t border-[#E5E0D8] text-center">
            <div className="h-0.5 w-8 bg-[#A3A3A3] rounded-xs mx-auto" />
          </div>
        </div>
      )}

      {/* 5. Minimal (Generous whitespace, ultra-light layout) */}
      {id === 'minimal' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="space-y-1">
            <div className="h-1.5 w-10 bg-[#101010] rounded-xs" />
            <div className="h-0.5 w-14 bg-[#A3A3A3] rounded-xs" />
          </div>
          <div className="space-y-2 py-1">
            <div className="space-y-0.5">
              <div className="h-0.5 w-6 bg-[#777777] rounded-xs tracking-wider" />
              <div className="h-0.5 w-full bg-[#E5E0D8] rounded-xs" />
              <div className="h-0.5 w-4/5 bg-[#EAE5DC] rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-0.5 w-6 bg-[#777777] rounded-xs" />
              <div className="h-0.5 w-full bg-[#E5E0D8] rounded-xs" />
              <div className="h-0.5 w-3/4 bg-[#EAE5DC] rounded-xs" />
            </div>
          </div>
          <div className="h-0.5 w-6 bg-[#C5BDAF] rounded-xs" />
        </div>
      )}

      {/* 6. Professional (Structured contact grid & corporate hierarchy) */}
      {id === 'professional' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="border-b-2 border-[#101010] pb-1">
            <div className="h-2 w-16 bg-[#101010] rounded-xs" />
            <div className="grid grid-cols-2 gap-1 mt-1">
              <div className="h-0.5 w-full bg-[#888888] rounded-xs" />
              <div className="h-0.5 w-full bg-[#888888] rounded-xs" />
            </div>
          </div>
          <div className="space-y-1 py-1">
            <div className="h-1 w-12 bg-[#222222] rounded-xs" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            <div className="h-0.5 w-5/6 bg-[#E0D8CB] rounded-xs" />
            <div className="h-1 w-10 bg-[#222222] rounded-xs mt-1" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
          </div>
          <div className="h-0.5 w-10 bg-[#888888] rounded-xs" />
        </div>
      )}

      {/* 7. Academic (Education-first & research block) */}
      {id === 'academic' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="text-center pb-1 border-b border-[#101010]/20">
            <div className="h-1.5 w-12 bg-[#101010] rounded-xs mx-auto" />
            <div className="h-0.5 w-16 bg-[#777777] rounded-xs mx-auto mt-0.5" />
          </div>
          <div className="space-y-1.5 py-0.5">
            <div className="bg-[#FAF8F5] p-1 border border-[#E5E0D8] rounded-xs space-y-0.5">
              <div className="h-1 w-14 bg-[#101010] rounded-xs font-bold" />
              <div className="h-0.5 w-full bg-[#888888] rounded-xs" />
              <div className="h-0.5 w-4/5 bg-[#B8B0A2] rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-10 bg-[#333333] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            </div>
          </div>
          <div className="h-0.5 w-8 bg-[#A3A3A3] rounded-xs" />
        </div>
      )}

      {/* 8. Compact (High density, tight margins for 1-page fit) */}
      {id === 'compact' && (
        <div className="w-full h-full flex flex-col justify-between text-[6px]">
          <div className="flex items-center justify-between pb-0.5 border-b border-[#101010]">
            <div className="h-1.5 w-10 bg-[#101010] rounded-xs" />
            <div className="h-0.5 w-8 bg-[#666666] rounded-xs" />
          </div>
          <div className="space-y-0.5 py-0.5">
            <div className="h-0.5 w-8 bg-[#333333] rounded-xs" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            <div className="h-0.5 w-7 bg-[#333333] rounded-xs mt-0.5" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            <div className="h-0.5 w-3/4 bg-[#D1C8BA] rounded-xs" />
            <div className="h-0.5 w-8 bg-[#333333] rounded-xs mt-0.5" />
            <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
          </div>
          <div className="h-0.5 w-full bg-[#E5E0D8] rounded-xs" />
        </div>
      )}

      {/* 9. Executive (Uppercase tracking, thick accent bar) */}
      {id === 'executive' && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="border-t-2 border-[#101010] pt-1">
            <div className="h-1.5 w-14 bg-[#101010] rounded-xs" />
            <div className="h-0.5 w-8 bg-[#777777] rounded-xs mt-0.5" />
          </div>
          <div className="space-y-1.5 py-1">
            <div className="space-y-0.5">
              <div className="h-1 w-12 bg-[#101010] rounded-xs" />
              <div className="h-0.5 w-full bg-[#C5BDAF] rounded-xs" />
              <div className="h-0.5 w-5/6 bg-[#D1C8BA] rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-10 bg-[#101010] rounded-xs" />
              <div className="h-0.5 w-full bg-[#C5BDAF] rounded-xs" />
            </div>
          </div>
          <div className="h-0.5 w-10 bg-[#333333] rounded-xs" />
        </div>
      )}

      {/* 10. Modern (Default clean sans, hairline divider) */}
      {(id === 'modern' || (![
        'contemporary-sidebar',
        'creative',
        'technical',
        'classic',
        'minimal',
        'professional',
        'academic',
        'compact',
        'executive',
      ].includes(id))) && (
        <div className="w-full h-full flex flex-col justify-between">
          <div className="space-y-0.5">
            <div className="h-1.5 w-12 bg-[#101010] rounded-xs" />
            <div className="h-0.5 w-8 bg-[#777777] rounded-xs" />
            <div className="h-0.5 w-full bg-[#E5E0D8] my-0.5" />
          </div>
          <div className="space-y-1 py-1">
            <div className="space-y-0.5">
              <div className="h-1 w-10 bg-[#333333] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
              <div className="h-0.5 w-4/5 bg-[#E0D8CB] rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-8 bg-[#333333] rounded-xs" />
              <div className="h-0.5 w-full bg-[#D1C8BA] rounded-xs" />
            </div>
          </div>
          <div className="flex justify-between pt-1 border-t border-[#F0ECE1]">
            <div className="h-0.5 w-6 bg-[#C5BDAF] rounded-xs" />
            <div className="h-0.5 w-4 bg-[#C5BDAF] rounded-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
