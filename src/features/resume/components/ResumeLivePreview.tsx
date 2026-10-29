/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Pixel-Accurate Live A4 Resume Preview Document
 * Supports all 10 distinct professional templates:
 * 1. Modern — Clean typography, strong section hierarchy, subtle dividers
 * 2. Classic — Traditional professional serif layout, conservative typography, ATS standard
 * 3. Minimal — Pure, generous whitespace, restrained typography, single-column
 * 4. Professional — Structured business layout, boxed contact summary, disciplined spacing
 * 5. Creative — Dark charcoal header banner, visual pill badges, cream borders
 * 6. Technical — Code-inspired terminal layout, DEV badge, monospace labels, tools arsenal
 * 7. Academic — Education-first serif structure, research projects, publications, honors
 * 8. Compact — High-density 1-page fit, space-efficient padding and typography
 * 9. Executive — Achievement-focused, uppercase bold title, Executive Profile, experience first
 * 10. Contemporary Sidebar — 2-column split with distinct skills/contact sidebar and main column
 */

import React from 'react';
import { ResumeData, ResumeTemplateId } from '../../../types/resume.ts';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
  Code,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';

interface ResumeLivePreviewProps {
  data: ResumeData;
  scale?: number;
  className?: string;
  isPrintMode?: boolean;
  id?: string;
}

export function ResumeLivePreview({
  data,
  scale = 1,
  className = '',
  isPrintMode = false,
  id = 'resume-a4-document',
}: ResumeLivePreviewProps) {
  const {
    personalInfo,
    education,
    experience,
    projects,
    skills,
    certifications,
    templateId = 'modern',
  } = data;

  // Normalize legacy template aliases for backward compatibility
  const activeTemplate: ResumeTemplateId =
    templateId === 'minimal-cream'
      ? 'minimal'
      : templateId === 'executive-mono'
      ? 'executive'
      : templateId === 'modern-student'
      ? 'modern'
      : templateId === 'technical-clean'
      ? 'technical'
      : templateId;

  // Helper: Format external links to safe absolute URLs
  const toSafeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '#';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  // Shared Project Links Component with readable labels and clean wrapping
  const ProjectLinks = ({
    liveUrl,
    repoUrl,
    legacyLink,
    className: extraClass = '',
  }: {
    liveUrl?: string;
    repoUrl?: string;
    legacyLink?: string;
    className?: string;
  }) => {
    const cleanLive = liveUrl?.trim();
    const cleanRepo = repoUrl?.trim();
    const cleanLegacy = legacyLink?.trim();

    const hasLive = Boolean(cleanLive);
    const hasRepo = Boolean(cleanRepo);
    const hasLegacy = Boolean(!hasLive && !hasRepo && cleanLegacy);

    if (!hasLive && !hasRepo && !hasLegacy) return null;

    return (
      <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] ${extraClass}`}>
        {hasLive && (
          <a
            href={toSafeUrl(cleanLive!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:text-[#555555] underline decoration-[#A3A3A3] underline-offset-2 transition-colors whitespace-nowrap group"
            title={cleanLive}
          >
            <Globe className="w-3 h-3 shrink-0 text-[#555555] group-hover:text-[#101010]" />
            <span>Live Demo</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-[#A3A3A3]" />
          </a>
        )}

        {hasLive && (hasRepo || hasLegacy) && (
          <span className="text-[#A3A3A3] text-xs select-none">·</span>
        )}

        {(hasRepo || hasLegacy) && (
          <a
            href={toSafeUrl(hasRepo ? cleanRepo! : cleanLegacy!)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:text-[#555555] underline decoration-[#A3A3A3] underline-offset-2 transition-colors whitespace-nowrap group"
            title={hasRepo ? cleanRepo : cleanLegacy}
          >
            <Github className="w-3 h-3 shrink-0 text-[#555555] group-hover:text-[#101010]" />
            <span>Source Code</span>
            <Code className="w-2.5 h-2.5 shrink-0 text-[#A3A3A3]" />
          </a>
        )}
      </div>
    );
  };

  // Shared Contact Items Component with sanitized fields and natural wrapping
  const ContactItems = ({
    layout = 'horizontal',
    iconColor = '#777777',
    className: extraClass = '',
    align = 'left',
  }: {
    layout?: 'horizontal' | 'vertical' | 'grid';
    iconColor?: string;
    className?: string;
    align?: 'left' | 'right' | 'center';
  }) => {
    const email = personalInfo.email?.trim();
    const phone = personalInfo.phone?.trim();
    const location = personalInfo.location?.trim();
    const linkedin = personalInfo.linkedin?.trim();
    const github = personalInfo.github?.trim();
    const website = personalInfo.website?.trim();

    const hasAny = Boolean(email || phone || location || linkedin || github || website);
    if (!hasAny) return null;

    return (
      <div
        className={
          layout === 'vertical'
            ? `flex flex-col space-y-1.5 text-[11px] min-w-0 ${
                align === 'right' ? 'items-end text-right' : 'items-start text-left'
              } ${extraClass}`
            : layout === 'grid'
            ? `grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] min-w-0 ${extraClass}`
            : `flex flex-wrap items-center ${
                align === 'center'
                  ? 'justify-center text-center'
                  : align === 'right'
                  ? 'justify-end text-right'
                  : 'justify-start text-left'
              } gap-x-3.5 gap-y-1.5 text-[11px] min-w-0 ${extraClass}`
        }
      >
        {email && (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-start gap-1.5 text-[#333333] hover:text-[#101010] hover:underline min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
          >
            <Mail className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="break-words [overflow-wrap:anywhere]">{email}</span>
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="inline-flex items-start gap-1.5 text-[#333333] hover:text-[#101010] min-w-0 max-w-full whitespace-nowrap"
          >
            <Phone className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="whitespace-nowrap">{phone}</span>
          </a>
        )}
        {location && (
          <span className="inline-flex items-start gap-1.5 text-[#333333] min-w-0 max-w-full">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="break-words">{location}</span>
          </span>
        )}
        {linkedin && (
          <a
            href={toSafeUrl(linkedin)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-1.5 text-[#333333] hover:text-[#101010] hover:underline min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
          >
            <Linkedin className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="break-words [overflow-wrap:anywhere]">
              {linkedin
                .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/, 'in/')
                .replace(/\/$/, '')}
            </span>
          </a>
        )}
        {github && (
          <a
            href={toSafeUrl(github)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-1.5 text-[#333333] hover:text-[#101010] hover:underline min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
          >
            <Github className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="break-words [overflow-wrap:anywhere]">
              {github.replace(/^https?:\/\/(www\.)?github\.com\//, 'github/').replace(/\/$/, '')}
            </span>
          </a>
        )}
        {website && (
          <a
            href={toSafeUrl(website)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-1.5 text-[#333333] hover:text-[#101010] hover:underline min-w-0 max-w-full break-words [overflow-wrap:anywhere]"
          >
            <Globe className="w-3 h-3 shrink-0 mt-0.5" style={{ color: iconColor }} />
            <span className="break-words [overflow-wrap:anywhere]">
              {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </span>
          </a>
        )}
      </div>
    );
  };

  // Master A4 sheet dimensions matching true print geometry
  const baseA4Style: React.CSSProperties = {
    width: '100%',
    maxWidth: '794px',
    minHeight: '1123px', // Standard 297mm height at 96 DPI
    padding: '36px 42px',
    boxShadow: isPrintMode ? 'none' : '0 4px 24px rgba(16, 16, 16, 0.08)',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top center',
    backgroundColor: '#FFFFFF',
    color: '#101010',
    boxSizing: 'border-box',
  };

  /* =========================================================================
   * TEMPLATE 10: CONTEMPORARY SIDEBAR (Two-Column Layout)
   * ========================================================================= */
  if (activeTemplate === 'contemporary-sidebar') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 ${
          isPrintMode ? 'w-full shadow-none p-0' : 'w-full rounded-2xl'
        } ${className}`}
        style={{ ...baseA4Style, padding: 0 }}
      >
        <div className="grid grid-cols-12 min-h-[1123px] items-stretch">
          {/* Left Dark / Tinted Sidebar (4 cols = ~33%) */}
          <div className="col-span-4 bg-[#F5F2EB] p-6 border-r border-[#E5E0D8] space-y-5 flex flex-col justify-start">
            <div className="resume-entry break-inside-avoid">
              {personalInfo.photoUrl && (
                <div className="flex justify-center mb-3">
                  <img
                    src={personalInfo.photoUrl}
                    alt={personalInfo.fullName}
                    className="w-20 h-20 rounded-full object-cover aspect-square border-2 border-[#D4D1CA] shadow-2xs shrink-0"
                  />
                </div>
              )}
              <h1 className="text-xl font-extrabold tracking-tight text-[#101010] uppercase break-words">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-xs font-semibold text-[#555555] mt-1 break-words">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>

            {/* Sidebar Contact */}
            <div className="pt-2 border-t border-[#E0D8CB] resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                Contact &amp; Links
              </h2>
              <ContactItems layout="vertical" iconColor="#101010" />
            </div>

            {/* Sidebar Skills */}
            {((skills.technical && skills.technical.length > 0) ||
              (skills.soft && skills.soft.length > 0)) && (
              <div className="pt-2 border-t border-[#E0D8CB] resume-section break-inside-avoid">
                <h2 className="resume-section-header break-after-avoid text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                  Skills
                </h2>
                <div className="space-y-3">
                  {skills.technical && skills.technical.length > 0 && (
                    <div className="resume-entry break-inside-avoid">
                      <span className="text-[10px] font-bold text-[#555555] uppercase block mb-1">
                        Technical
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skills.technical.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#101010] rounded border border-[#E0D8CB] break-words"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.soft && skills.soft.length > 0 && (
                    <div className="resume-entry break-inside-avoid">
                      <span className="text-[10px] font-bold text-[#555555] uppercase block mb-1">
                        Soft Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skills.soft.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#555555] rounded border border-[#E0D8CB] break-words"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sidebar Certifications */}
            {certifications && certifications.length > 0 && (
              <div className="pt-2 border-t border-[#E0D8CB] resume-section break-inside-avoid">
                <h2 className="resume-section-header break-after-avoid text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                  Certifications
                </h2>
                <div className="space-y-2">
                  {certifications.map((c) => (
                    <div key={c.id} className="text-[11px] resume-entry break-inside-avoid">
                      <div className="font-semibold text-[#101010] break-words">
                        {c.credentialUrl ? (
                          <a
                            href={toSafeUrl(c.credentialUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-[#101010]"
                          >
                            {c.name}
                          </a>
                        ) : (
                          c.name
                        )}
                      </div>
                      <div className="text-[10px] text-[#777777] break-words">
                        {c.issuer} {c.issueDate && `· ${c.issueDate}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Main Body (8 cols = ~67%) */}
          <div className="col-span-8 p-7 space-y-5">
            {/* Professional Summary */}
            {personalInfo.summary?.trim() && (
              <div className="resume-section break-inside-avoid">
                <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                  About Me
                </h2>
                <p className="text-xs text-[#333333] leading-relaxed break-words">
                  {personalInfo.summary}
                </p>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div className="resume-section">
                <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Education
                </h2>
                <div className="space-y-2.5">
                  {education.map((edu) => (
                    <div key={edu.id} className="text-xs resume-entry break-inside-avoid">
                      <div className="flex justify-between items-baseline font-bold text-[#101010]">
                        <span className="break-words min-w-0">{edu.institution}</span>
                        <span className="text-[11px] font-medium text-[#777777] shrink-0 ml-2">
                          {edu.startDate} {edu.startDate && edu.endDate && '–'} {edu.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#555555] text-[11px] mt-0.5">
                        <span className="break-words min-w-0">
                          {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                        </span>
                        {edu.scoreOrGpa && (
                          <span className="font-semibold text-[#101010] shrink-0 ml-2">
                            Score: {edu.scoreOrGpa}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
              <div className="resume-section">
                <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div key={proj.id} className="text-xs resume-entry break-inside-avoid">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold text-[#101010]">
                        <span className="break-words min-w-0">{proj.title}</span>
                        <ProjectLinks
                          liveUrl={proj.liveUrl}
                          repoUrl={proj.repoUrl}
                          legacyLink={proj.link}
                        />
                      </div>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="text-[11px] text-[#777777] italic mt-0.5 break-words">
                          {proj.techStack.join(', ')}
                        </div>
                      )}
                      {proj.description && (
                        <p className="text-xs text-[#333333] mt-1 leading-relaxed break-words">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
              <div className="resume-section">
                <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Experience
                </h2>
                <div className="space-y-3">
                  {experience.map((exp) => (
                    <div key={exp.id} className="text-xs resume-entry break-inside-avoid">
                      <div className="flex justify-between items-baseline font-bold text-[#101010]">
                        <span className="break-words min-w-0">
                          {exp.position} — <span className="text-[#555555]">{exp.company}</span>
                        </span>
                        <span className="text-[11px] font-medium text-[#777777] shrink-0 ml-2">
                          {exp.startDate} {exp.startDate && exp.endDate && '–'} {exp.endDate}
                        </span>
                      </div>
                      {exp.location && (
                        <div className="text-[11px] text-[#777777]">{exp.location}</div>
                      )}
                      {exp.description && (
                        <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed break-words">
                          {exp.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 2: CLASSIC (Serif, ATS-Standard & Traditional Layout)
   * ========================================================================= */
  if (activeTemplate === 'classic') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        }}
      >
        {/* Centered Classic Header */}
        <div className="text-center pb-3 border-b-2 border-[#101010] space-y-1.5 resume-section break-inside-avoid">
          {personalInfo.photoUrl && (
            <div className="flex justify-center mb-2">
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-16 h-16 rounded-full object-cover aspect-square border border-[#101010] shrink-0"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#101010] break-words">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs italic text-[#555555] break-words">
            {personalInfo.professionalTitle || 'Target Career Title'}
          </p>
          <div className="flex justify-center pt-0.5">
            <ContactItems layout="horizontal" iconColor="#101010" align="center" />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 pt-3 text-xs leading-relaxed">
          {personalInfo.summary?.trim() && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Summary
              </h2>
              <p className="text-[#333333] break-words">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold">
                      <span className="break-words min-w-0">{edu.institution}</span>
                      <span className="shrink-0 ml-2">{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between text-[11px] italic text-[#444444]">
                      <span className="break-words min-w-0">
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </span>
                      {edu.scoreOrGpa && (
                        <span className="shrink-0 ml-2">GPA / Score: {edu.scoreOrGpa}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Skills &amp; Competencies
              </h2>
              <div className="space-y-1 text-xs">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Technical Skills: </span>
                    <span>{skills.technical.join(', ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Core Competencies: </span>
                    <span>{skills.soft.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Key Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="text-[11px] italic text-[#555555] break-words">
                        Tools: {proj.techStack.join(', ')}
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Professional Experience
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold">
                      <span className="break-words min-w-0">
                        {exp.position}, {exp.company}
                      </span>
                      <span className="shrink-0 ml-2">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Certifications
              </h2>
              <div className="space-y-1">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between resume-entry break-inside-avoid">
                    <span className="break-words min-w-0">
                      {c.credentialUrl ? (
                        <a
                          href={toSafeUrl(c.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#101010]"
                        >
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                      {c.issuer && ` — ${c.issuer}`}
                    </span>
                    <span className="text-[11px] text-[#555555] shrink-0 ml-2">{c.issueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 6: TECHNICAL (Developer & ML Systems Focus)
   * ========================================================================= */
  if (activeTemplate === 'technical') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Terminal Header */}
        <div className="pb-3 border-b-2 border-[#101010] flex items-start justify-between gap-4 resume-section break-inside-avoid">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-14 h-14 rounded-lg object-cover aspect-square border border-[#101010] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2 py-0.5 bg-[#101010] text-[#F8F5EE] rounded font-bold shrink-0">
                  DEV
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#101010] break-words">
                  {personalInfo.fullName || 'Candidate Name'}
                </h1>
              </div>
              <p className="text-xs font-mono font-medium text-[#555555] mt-1 break-words">
                $ role: {personalInfo.professionalTitle || 'Software Engineer'}
              </p>
            </div>
          </div>

          <div className="shrink-0 max-w-[45%]">
            <ContactItems layout="vertical" iconColor="#101010" align="right" />
          </div>
        </div>

        {/* Technical Sections */}
        <div className="space-y-3.5 pt-3 text-xs">
          {/* Skills Front and Center */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E5E0D8] resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-mono font-bold uppercase tracking-wider text-[#101010] mb-2 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Technical Arsenal</span>
              </h2>
              <div className="space-y-1.5">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.technical.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] px-2 py-0.5 bg-white border border-[#DDD5C7] rounded font-medium text-[#101010] break-words"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="text-[11px] text-[#555555] pt-1 break-words">
                    <span className="font-semibold text-[#101010]">Practices: </span>
                    {skills.soft.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Projects &amp; Open Source</span>
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl border border-[#EFEAE0] bg-white resume-entry break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold text-xs text-[#101010]">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="font-mono text-[11px] text-[#777777] mt-0.5 break-words">
                        [{proj.techStack.join(' | ')}]
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-1 leading-relaxed break-words">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Work Experience</span>
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between items-baseline font-bold text-xs text-[#101010]">
                      <span className="break-words min-w-0">
                        {exp.position} · <span className="font-medium text-[#555555]">{exp.company}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[#777777] shrink-0 ml-2">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line leading-relaxed break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#101010] break-words">{edu.institution}</div>
                      <div className="text-[11px] text-[#555555] break-words">
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono shrink-0 ml-2">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && (
                        <div className="font-semibold text-[#101010]">GPA: {edu.scoreOrGpa}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Credentials</span>
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {certifications.map((c) => (
                  <div key={c.id} className="resume-entry break-inside-avoid">
                    <span className="font-semibold text-[#101010] break-words">
                      {c.credentialUrl ? (
                        <a
                          href={toSafeUrl(c.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#101010]"
                        >
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                    </span>
                    <span className="text-[#777777] text-[11px] ml-1">
                      ({c.issuer}, {c.issueDate})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 7: ACADEMIC (Education-First & Research Structure)
   * ========================================================================= */
  if (activeTemplate === 'academic') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-serif ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          fontFamily: 'Cambria, Georgia, serif',
        }}
      >
        <div className="text-center pb-3 border-b border-[#444444] space-y-1 resume-section break-inside-avoid">
          {personalInfo.photoUrl && (
            <div className="flex justify-center mb-2">
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-16 h-16 rounded-full object-cover aspect-square border border-[#444444] shrink-0"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-[#101010] break-words">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs italic text-[#555555] break-words">
            {personalInfo.professionalTitle || 'Academic Researcher / Student'}
          </p>
          <div className="flex justify-center pt-0.5">
            <ContactItems layout="horizontal" iconColor="#444444" align="center" />
          </div>
        </div>

        <div className="space-y-4 pt-3 text-xs leading-relaxed">
          {/* Education FIRST */}
          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Academic Background &amp; Education
              </h2>
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold">
                      <span className="break-words min-w-0">{edu.institution}</span>
                      <span className="shrink-0 ml-2">{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between italic text-[11px]">
                      <span className="break-words min-w-0">
                        {edu.degree} in {edu.fieldOfStudy}
                      </span>
                      {edu.scoreOrGpa && (
                        <span className="font-semibold shrink-0 ml-2">Academic Score: {edu.scoreOrGpa}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research & Academic Projects */}
          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Research &amp; Course Projects
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="text-[11px] italic text-[#555555] break-words">
                        Methodology &amp; Tools: {proj.techStack.join(', ')}
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Scholarly &amp; Technical Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Scientific &amp; Technical: </span>
                    <span>{skills.technical.join(', ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Communication &amp; Leadership: </span>
                    <span>{skills.soft.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Appointments &amp; Internships
              </h2>
              <div className="space-y-2">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold">
                      <span className="break-words min-w-0">
                        {exp.position}, {exp.company}
                      </span>
                      <span className="shrink-0 ml-2">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-1.5">
                Honors &amp; Certifications
              </h2>
              <div className="space-y-1">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between resume-entry break-inside-avoid">
                    <span className="break-words min-w-0">
                      {c.name} — {c.issuer}
                    </span>
                    <span className="shrink-0 ml-2">{c.issueDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 8: COMPACT (High-Density 1-Page Layout)
   * ========================================================================= */
  if (activeTemplate === 'compact') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          padding: '24px 28px',
        }}
      >
        {/* Compact Header */}
        <div className="pb-2 border-b border-[#101010] flex items-center justify-between gap-3 resume-section break-inside-avoid">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-12 h-12 rounded-full object-cover aspect-square border border-[#101010] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black uppercase tracking-tight text-[#101010] break-words">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <span className="text-[11px] font-semibold text-[#555555] break-words block">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </span>
            </div>
          </div>
          <div className="shrink-0 max-w-[48%]">
            <ContactItems layout="horizontal" iconColor="#101010" align="right" />
          </div>
        </div>

        {/* High Density Content */}
        <div className="space-y-2.5 pt-2 text-[11px] leading-tight">
          {personalInfo.summary?.trim() && (
            <p className="text-[#333333] italic border-b border-[#F0ECE3] pb-1.5 break-words resume-section break-inside-avoid">
              {personalInfo.summary}
            </p>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Education
              </h2>
              <div className="space-y-1">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold break-words">{edu.institution}</span> ·{' '}
                      <span className="break-words">{edu.degree} in {edu.fieldOfStudy}</span>
                    </div>
                    <div className="font-semibold text-[#555555] shrink-0 ml-2">
                      {edu.scoreOrGpa && `CGPA: ${edu.scoreOrGpa} | `}{edu.startDate}–{edu.endDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Skills
              </h2>
              <div className="space-y-0.5">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Tech: </span>
                    <span>{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Soft: </span>
                    <span>{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Projects
              </h2>
              <div className="space-y-1.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold">
                      <span className="break-words min-w-0">
                        {proj.title}
                        {proj.techStack && proj.techStack.length > 0 && (
                          <span className="font-normal text-[10px] text-[#777777] ml-2">
                            ({proj.techStack.join(', ')})
                          </span>
                        )}
                      </span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.description && (
                      <p className="text-[#333333] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Experience
              </h2>
              <div className="space-y-1.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold">
                      <span className="break-words min-w-0">{exp.position} — {exp.company}</span>
                      <span className="text-[#777777] font-normal shrink-0 ml-2">{exp.startDate}–{exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-[#333333] mt-0.5 whitespace-pre-line break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Certifications
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {certifications.map((c) => (
                  <span key={c.id} className="resume-entry break-inside-avoid">
                    <span className="font-semibold">{c.name}</span> ({c.issuer})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 5: CREATIVE (Visual Accents & Distinctive Headings)
   * ========================================================================= */
  if (activeTemplate === 'creative') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Creative Top Dark Banner */}
        <div className="bg-[#1C1C1C] text-white p-5 rounded-xl mb-4 flex items-start justify-between gap-4 resume-section break-inside-avoid">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-16 h-16 rounded-xl object-cover aspect-square border-2 border-[rgba(255,255,255,0.3)] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black uppercase tracking-wider break-words text-white">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-xs font-medium text-[#E5E0D8] mt-0.5 break-words">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>
          </div>
          <div className="text-xs space-y-1 shrink-0 max-w-[45%] text-right text-[#E5E0D8]">
            {personalInfo.email && <div className="break-words [overflow-wrap:anywhere]">{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
          </div>
        </div>

        {/* Links strip */}
        <div className="flex flex-wrap gap-4 pb-3 border-b border-[#E5E0D8] text-xs resume-section break-inside-avoid">
          {personalInfo.linkedin && (
            <a
              href={toSafeUrl(personalInfo.linkedin)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:underline"
            >
              <Linkedin className="w-3 h-3 text-[#101010]" />
              <span>LinkedIn</span>
            </a>
          )}
          {personalInfo.github && (
            <a
              href={toSafeUrl(personalInfo.github)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:underline"
            >
              <Github className="w-3 h-3 text-[#101010]" />
              <span>GitHub</span>
            </a>
          )}
          {personalInfo.website && (
            <a
              href={toSafeUrl(personalInfo.website)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:underline"
            >
              <Globe className="w-3 h-3 text-[#101010]" />
              <span>Portfolio</span>
            </a>
          )}
        </div>

        {/* Creative Body */}
        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary?.trim() && (
            <div className="p-3 bg-[#F8F5EE] rounded-xl border-l-4 border-[#101010] resume-section break-inside-avoid">
              <p className="leading-relaxed text-[#242424] break-words">{personalInfo.summary}</p>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#101010] break-words">{edu.institution}</span>
                      <div className="text-[11px] text-[#555555] break-words">
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-[#777777] shrink-0 ml-2">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && (
                        <div className="font-semibold text-[#101010]">Score: {edu.scoreOrGpa}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects with Pill Badges */}
          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Featured Projects
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3 bg-[#FAF9F6] border border-[#E5E0D8] rounded-xl resume-entry break-inside-avoid"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold text-xs text-[#101010]">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-1">
                        {proj.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.2 bg-white text-[10px] font-medium border border-[#E0D8CB] rounded break-words"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-1 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Core Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Leadership &amp; Collaboration: </span>
                    <span className="text-[#333333]">{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Experience
              </h2>
              <div className="space-y-2">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="break-words min-w-0">
                        {exp.position} · {exp.company}
                      </span>
                      <span className="text-[11px] text-[#777777] shrink-0 ml-2">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 9: EXECUTIVE (Achievement & Impact Hierarchy)
   * ========================================================================= */
  if (activeTemplate === 'executive') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        <div className="pb-4 border-b-2 border-[#101010] resume-section break-inside-avoid">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {personalInfo.photoUrl && (
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-16 h-16 rounded-lg object-cover aspect-square border border-[#101010] shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight uppercase text-[#101010] break-words">
                  {personalInfo.fullName || 'Candidate Name'}
                </h1>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#777777] mt-0.5 break-words">
                  {personalInfo.professionalTitle || 'Target Career Title'}
                </p>
              </div>
            </div>
            <div className="shrink-0 max-w-[45%]">
              <ContactItems layout="vertical" iconColor="#101010" align="right" />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary?.trim() && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-widest text-[#101010] mb-1">
                Executive Profile
              </h2>
              <p className="text-[#333333] leading-relaxed break-words">{personalInfo.summary}</p>
            </div>
          )}

          {/* Experience First for Executive */}
          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Professional Experience &amp; Leadership
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold text-xs text-[#101010]">
                      <span className="break-words min-w-0">
                        {exp.position} | <span className="font-semibold text-[#555555]">{exp.company}</span>
                      </span>
                      <span className="text-[11px] text-[#777777] shrink-0 ml-2">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Initiatives &amp; Key Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold text-xs">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Education &amp; Credentials
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#101010] break-words">{edu.institution}</div>
                      <div className="text-[11px] text-[#555555] break-words">
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-[#777777] shrink-0 ml-2">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && (
                        <div className="font-semibold text-[#101010]">GPA: {edu.scoreOrGpa}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-1.5">
                Expertise &amp; Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Functional &amp; Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Strategic &amp; Leadership: </span>
                    <span className="text-[#333333]">{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 4: PROFESSIONAL (Structured Business Hierarchy)
   * ========================================================================= */
  if (activeTemplate === 'professional') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Header with boxed contact summary */}
        <div className="pb-3 border-b-2 border-[#101010] resume-section break-inside-avoid">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {personalInfo.photoUrl && (
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-14 h-14 rounded-full object-cover aspect-square border border-[#E5E0D8] shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-[#101010] break-words">
                  {personalInfo.fullName || 'Candidate Name'}
                </h1>
                <p className="text-xs font-semibold text-[#555555] mt-0.5 break-words">
                  {personalInfo.professionalTitle || 'Target Career Title'}
                </p>
              </div>
            </div>
            <div className="shrink-0 max-w-[48%]">
              <ContactItems layout="grid" iconColor="#101010" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary?.trim() && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1">
                Executive Summary
              </h2>
              <p className="text-[#333333] leading-relaxed break-words">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#101010] break-words">{edu.institution}</span>
                      <div className="text-[11px] text-[#555555] break-words">
                        {edu.degree} in {edu.fieldOfStudy}
                      </div>
                    </div>
                    <div className="text-right text-[11px] shrink-0 ml-2">
                      <div className="text-[#777777]">{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && (
                        <div className="font-semibold text-[#101010]">Score: {edu.scoreOrGpa}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Work History &amp; Internships
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-bold text-xs text-[#101010]">
                      <span className="break-words min-w-0">
                        {exp.position} — <span className="font-medium text-[#555555]">{exp.company}</span>
                      </span>
                      <span className="text-[11px] text-[#777777] shrink-0 ml-2">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed break-words">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-bold text-xs">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1.5">
                Core Competencies
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="break-words">
                    <span className="font-bold">Professional: </span>
                    <span className="text-[#333333]">{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 3: MINIMAL (Pure, Generous Whitespace, Single-Column)
   * ========================================================================= */
  if (activeTemplate === 'minimal') {
    return (
      <div
        id={id}
        className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        <div className="flex items-start justify-between gap-4 pb-4 resume-section break-inside-avoid">
          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-2xl font-light tracking-tight text-[#101010] break-words">
              {personalInfo.fullName || 'Candidate Name'}
            </h1>
            <p className="text-xs text-[#777777] font-medium tracking-wide break-words">
              {personalInfo.professionalTitle || 'Target Career Title'}
            </p>
            <div className="pt-1">
              <ContactItems layout="horizontal" iconColor="#777777" />
            </div>
          </div>
          {personalInfo.photoUrl && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName}
              className="w-16 h-16 rounded-xl object-cover aspect-square border border-[#E5E0D8] shrink-0"
            />
          )}
        </div>

        <div className="space-y-5 pt-3 text-xs leading-relaxed">
          {personalInfo.summary?.trim() && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-1.5">
                Summary
              </h2>
              <p className="text-[#333333] max-w-2xl break-words">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline resume-entry break-inside-avoid">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[#101010] break-words">{edu.institution}</span>
                      <span className="text-[#777777] text-[11px] ml-2 break-words">
                        — {edu.degree} in {edu.fieldOfStudy}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#777777] font-mono shrink-0 ml-2">
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Selected Work
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="resume-entry break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 font-medium text-[#101010]">
                      <span className="break-words min-w-0">{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.description && (
                      <p className="text-[#444444] mt-0.5 break-words">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div className="resume-section">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Experience
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between font-medium">
                      <span className="break-words min-w-0">
                        {exp.position}, {exp.company}
                      </span>
                      <span className="text-[11px] text-[#777777] font-mono shrink-0 ml-2">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-[#444444] mt-0.5 break-words">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-1.5">
                Skills
              </h2>
              <div className="text-xs text-[#333333] break-words">
                {[...(skills.technical || []), ...(skills.soft || [])].join('  /  ')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
   * TEMPLATE 1: MODERN (Default — Balanced Single-Column with Subtle Dividers)
   * ========================================================================= */
  return (
    <div
      id={id}
      className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 font-sans ${
        isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
      } ${className}`}
      style={baseA4Style}
    >
      {/* Modern Header */}
      <div className="pb-4 border-b border-[#E5E0D8] resume-section break-inside-avoid">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-14 h-14 rounded-full object-cover aspect-square border border-[#E5E0D8] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101010] uppercase break-words">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-sm font-semibold text-[#555555] mt-0.5 break-words">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>
          </div>
          <div className="shrink-0 max-w-[45%]">
            <ContactItems layout="vertical" iconColor="#777777" align="right" />
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary?.trim() && (
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE3] resume-entry break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[10px] font-bold tracking-wider uppercase text-[#777777] mb-1">
              Professional Summary
            </h2>
            <p className="text-xs text-[#333333] leading-relaxed break-words">
              {personalInfo.summary}
            </p>
          </div>
        )}
      </div>

      {/* Modern Body */}
      <div className="space-y-4 pt-3.5 text-xs">
        {/* Education */}
        {education && education.length > 0 && (
          <div className="resume-section">
            <h2 className="resume-section-header break-after-avoid text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex justify-between items-center">
              <span>Education</span>
            </h2>
            <div className="space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id} className="resume-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline font-bold text-[#101010]">
                    <span className="break-words min-w-0">{edu.institution || 'University / School'}</span>
                    <span className="text-[11px] font-medium text-[#777777] shrink-0 ml-2">
                      {edu.startDate} {edu.startDate && edu.endDate && '–'} {edu.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#555555] text-[11px] mt-0.5">
                    <span className="break-words min-w-0">
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </span>
                    {edu.scoreOrGpa && (
                      <span className="font-semibold text-[#101010] shrink-0 ml-2">
                        CGPA / Score: {edu.scoreOrGpa}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {((skills.technical && skills.technical.length > 0) ||
          (skills.soft && skills.soft.length > 0)) && (
          <div className="resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Skills
            </h2>
            <div className="space-y-1.5">
              {skills.technical && skills.technical.length > 0 && (
                <div className="break-words">
                  <span className="font-bold text-[#101010] mr-2">Technical:</span>
                  <span className="text-[#333333] leading-relaxed">
                    {skills.technical.join(' · ')}
                  </span>
                </div>
              )}
              {skills.soft && skills.soft.length > 0 && (
                <div className="break-words">
                  <span className="font-bold text-[#101010] mr-2">Soft Skills:</span>
                  <span className="text-[#333333] leading-relaxed">
                    {skills.soft.join(' · ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <div className="resume-section">
            <h2 className="resume-section-header break-after-avoid text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="resume-entry break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="font-bold text-[#101010] break-words min-w-0">
                      {proj.title || 'Project Title'}
                    </span>
                    <ProjectLinks
                      liveUrl={proj.liveUrl}
                      repoUrl={proj.repoUrl}
                      legacyLink={proj.link}
                    />
                  </div>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="text-[11px] text-[#777777] italic mt-0.5 break-words">
                      Technologies: {proj.techStack.join(', ')}
                    </div>
                  )}
                  {proj.description && (
                    <p className="text-xs text-[#333333] mt-1 leading-relaxed break-words">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <div className="resume-section">
            <h2 className="resume-section-header break-after-avoid text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Experience &amp; Internships
            </h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id} className="resume-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline font-bold text-[#101010]">
                    <span className="break-words min-w-0">
                      {exp.position} — <span className="text-[#555555]">{exp.company}</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#777777] shrink-0 ml-2">
                      {exp.startDate} {exp.startDate && exp.endDate && '–'} {exp.endDate}
                    </span>
                  </div>
                  {exp.location && (
                    <div className="text-[11px] text-[#777777]">{exp.location}</div>
                  )}
                  {exp.description && (
                    <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed break-words">
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <div className="resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Certifications &amp; Courses
            </h2>
            <div className="space-y-1.5">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline resume-entry break-inside-avoid">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-[#101010] break-words">
                      {cert.credentialUrl ? (
                        <a
                          href={toSafeUrl(cert.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#101010]"
                        >
                          {cert.name}
                        </a>
                      ) : (
                        cert.name
                      )}
                    </span>
                    {cert.issuer && (
                      <span className="text-[#777777] ml-1.5 break-words">· {cert.issuer}</span>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-[11px] text-[#777777] shrink-0 ml-2">{cert.issueDate}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
