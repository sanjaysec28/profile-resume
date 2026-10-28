/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Live A4 Resume Preview Document
 * Supports all 10 distinct professional templates:
 * 1. Modern
 * 2. Classic
 * 3. Minimal
 * 4. Professional
 * 5. Creative
 * 6. Technical
 * 7. Academic
 * 8. Compact
 * 9. Executive
 * 10. Contemporary Sidebar
 */

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
} from 'lucide-react';

interface ResumeLivePreviewProps {
  data: ResumeData;
  scale?: number;
  className?: string;
  isPrintMode?: boolean;
}

export function ResumeLivePreview({
  data,
  scale = 1,
  className = '',
  isPrintMode = false,
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

  // Normalize legacy template aliases
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

  // Reusable Project Links Component with readable labels
  const ProjectLinks = ({
    liveUrl,
    repoUrl,
    legacyLink,
  }: {
    liveUrl?: string;
    repoUrl?: string;
    legacyLink?: string;
  }) => {
    const hasLive = Boolean(liveUrl && liveUrl.trim());
    const hasRepo = Boolean(repoUrl && repoUrl.trim());
    const hasLegacy = Boolean(!hasLive && !hasRepo && legacyLink && legacyLink.trim());

    if (!hasLive && !hasRepo && !hasLegacy) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {hasLive && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#101010] hover:text-[#555555] underline decoration-[#A3A3A3] underline-offset-2 transition-colors group"
            title={liveUrl}
          >
            <Globe className="w-3 h-3 text-[#555555] group-hover:text-[#101010]" />
            <span>Live Demo</span>
            <ExternalLink className="w-2.5 h-2.5 text-[#A3A3A3]" />
          </a>
        )}

        {hasLive && (hasRepo || hasLegacy) && (
          <span className="text-[#A3A3A3] text-xs">·</span>
        )}

        {(hasRepo || hasLegacy) && (
          <a
            href={hasRepo ? repoUrl : legacyLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#101010] hover:text-[#555555] underline decoration-[#A3A3A3] underline-offset-2 transition-colors group"
            title={hasRepo ? repoUrl : legacyLink}
          >
            <Github className="w-3 h-3 text-[#555555] group-hover:text-[#101010]" />
            <span>Source Code</span>
            <Code className="w-2.5 h-2.5 text-[#A3A3A3]" />
          </a>
        )}
      </div>
    );
  };

  // Contact list items
  const ContactItems = ({
    layout = 'horizontal',
    iconColor = '#777777',
  }: {
    layout?: 'horizontal' | 'vertical' | 'grid';
    iconColor?: string;
  }) => (
    <div
      className={
        layout === 'vertical'
          ? 'space-y-1.5 text-[11px]'
          : layout === 'grid'
          ? 'grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]'
          : 'flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]'
      }
    >
      {personalInfo.email && (
        <a
          href={`mailto:${personalInfo.email}`}
          className="inline-flex items-center gap-1.5 text-[#333333] hover:text-[#101010] hover:underline"
        >
          <Mail className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.email}</span>
        </a>
      )}
      {personalInfo.phone && (
        <span className="inline-flex items-center gap-1.5 text-[#333333]">
          <Phone className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.phone}</span>
        </span>
      )}
      {personalInfo.location && (
        <span className="inline-flex items-center gap-1.5 text-[#333333]">
          <MapPin className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.location}</span>
        </span>
      )}
      {personalInfo.linkedin && (
        <a
          href={personalInfo.linkedin}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[#333333] hover:text-[#101010] hover:underline"
        >
          <Linkedin className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'in/')}</span>
        </a>
      )}
      {personalInfo.github && (
        <a
          href={personalInfo.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[#333333] hover:text-[#101010] hover:underline"
        >
          <Github className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'github/')}</span>
        </a>
      )}
      {personalInfo.website && (
        <a
          href={personalInfo.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[#333333] hover:text-[#101010] hover:underline"
        >
          <Globe className="w-3 h-3" style={{ color: iconColor }} />
          <span>{personalInfo.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
        </a>
      )}
    </div>
  );

  // Common styles for A4 sheet
  const baseA4Style = {
    minHeight: isPrintMode ? '297mm' : '740px',
    padding: isPrintMode ? '14mm 18mm' : '28px 32px',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top center',
  };

  /* =========================================================================
   * TEMPLATE 10: CONTEMPORARY SIDEBAR (Two-Column Layout)
   * ========================================================================= */
  if (activeTemplate === 'contemporary-sidebar') {
    return (
      <div
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 ${
          isPrintMode ? 'w-full shadow-none p-0' : 'w-full rounded-2xl'
        } ${className}`}
        style={{ ...baseA4Style, padding: 0 }}
      >
        <div className="grid grid-cols-12 min-h-full">
          {/* Left Dark / Tinted Sidebar (4 cols) */}
          <div className="col-span-4 bg-[#F5F2EB] p-5 sm:p-6 border-r border-[#E5E0D8] space-y-5">
            <div>
              {personalInfo.photoUrl && (
                <div className="flex justify-center mb-3">
                  <img
                    src={personalInfo.photoUrl}
                    alt={personalInfo.fullName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#101010]/20 shadow-xs"
                  />
                </div>
              )}
              <h1 className="text-xl font-extrabold tracking-tight text-[#101010] uppercase">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-xs font-semibold text-[#555555] mt-1">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>

            {/* Sidebar Contact */}
            <div className="pt-2 border-t border-[#E0D8CB]">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                Contact &amp; Links
              </h2>
              <ContactItems layout="vertical" iconColor="#101010" />
            </div>

            {/* Sidebar Skills */}
            {((skills.technical && skills.technical.length > 0) ||
              (skills.soft && skills.soft.length > 0)) && (
              <div className="pt-2 border-t border-[#E0D8CB]">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                  Skills
                </h2>
                <div className="space-y-3">
                  {skills.technical && skills.technical.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#555555] uppercase block mb-1">
                        Technical
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skills.technical.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#101010] rounded border border-[#E0D8CB]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skills.soft && skills.soft.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#555555] uppercase block mb-1">
                        Soft Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {skills.soft.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white text-[10px] font-medium text-[#555555] rounded border border-[#E0D8CB]"
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
              <div className="pt-2 border-t border-[#E0D8CB]">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#101010] mb-2">
                  Certifications
                </h2>
                <div className="space-y-2">
                  {certifications.map((c) => (
                    <div key={c.id} className="text-[11px]">
                      <div className="font-semibold text-[#101010]">{c.name}</div>
                      <div className="text-[10px] text-[#777777]">{c.issuer} · {c.issueDate}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Main Body (8 cols) */}
          <div className="col-span-8 p-6 sm:p-7 space-y-5">
            {/* Professional Summary */}
            {personalInfo.summary && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                  About Me
                </h2>
                <p className="text-xs text-[#333333] leading-relaxed">
                  {personalInfo.summary}
                </p>
              </div>
            )}

            {/* Education */}
            {education && education.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Education
                </h2>
                <div className="space-y-2.5">
                  {education.map((edu) => (
                    <div key={edu.id} className="text-xs">
                      <div className="flex justify-between font-bold text-[#101010]">
                        <span>{edu.institution}</span>
                        <span className="text-[11px] font-medium text-[#777777]">
                          {edu.startDate} – {edu.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#555555] text-[11px] mt-0.5">
                        <span>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                        {edu.scoreOrGpa && (
                          <span className="font-semibold text-[#101010]">Score: {edu.scoreOrGpa}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {projects && projects.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((proj) => (
                    <div key={proj.id} className="text-xs">
                      <div className="flex justify-between items-baseline font-bold text-[#101010]">
                        <span>{proj.title}</span>
                      </div>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="text-[11px] text-[#777777] italic mt-0.5">
                          {proj.techStack.join(', ')}
                        </div>
                      )}
                      {proj.description && (
                        <p className="text-xs text-[#333333] mt-1 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experience && experience.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5">
                  Experience
                </h2>
                <div className="space-y-3">
                  {experience.map((exp) => (
                    <div key={exp.id} className="text-xs">
                      <div className="flex justify-between font-bold text-[#101010]">
                        <span>{exp.position} — <span className="text-[#555555]">{exp.company}</span></span>
                        <span className="text-[11px] font-medium text-[#777777]">{exp.startDate} – {exp.endDate}</span>
                      </div>
                      {exp.location && <div className="text-[11px] text-[#777777]">{exp.location}</div>}
                      {exp.description && (
                        <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed">
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
   * TEMPLATE 2: CLASSIC (Serif, Academic & ATS-Standard Layout)
   * ========================================================================= */
  if (activeTemplate === 'classic') {
    return (
      <div
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        }}
      >
        {/* Centered Classic Header */}
        <div className="text-center pb-3 border-b-2 border-[#101010] space-y-1.5">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#101010]">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs italic text-[#555555]">
            {personalInfo.professionalTitle || 'Target Career Title'}
          </p>
          <div className="flex justify-center pt-0.5">
            <ContactItems layout="horizontal" iconColor="#101010" />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 pt-3 text-xs leading-relaxed">
          {personalInfo.summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Summary
              </h2>
              <p className="text-[#333333]">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between font-bold">
                      <span>{edu.institution}</span>
                      <span>{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between text-[11px] italic text-[#444444]">
                      <span>{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</span>
                      {edu.scoreOrGpa && <span>GPA / Score: {edu.scoreOrGpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Skills &amp; Competencies
              </h2>
              <div className="space-y-1 text-xs">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Technical Skills: </span>
                    <span>{skills.technical.join(', ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
                    <span className="font-bold">Core Competencies: </span>
                    <span>{skills.soft.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Key Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between font-bold">
                      <span>{proj.title}</span>
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="text-[11px] italic text-[#555555]">
                        Tools: {proj.techStack.join(', ')}
                      </div>
                    )}
                    {proj.description && <p className="text-xs text-[#333333] mt-0.5">{proj.description}</p>}
                    <ProjectLinks
                      liveUrl={proj.liveUrl}
                      repoUrl={proj.repoUrl}
                      legacyLink={proj.link}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Professional Experience
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold">
                      <span>{exp.position}, {exp.company}</span>
                      <span>{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#101010] border-b border-[#333333] pb-0.5 mb-1.5">
                Certifications
              </h2>
              <div className="space-y-1">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name} {c.issuer && `— ${c.issuer}`}</span>
                    <span className="text-[11px] text-[#555555]">{c.issueDate}</span>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Terminal / Code-Inspired Clean Header */}
        <div className="pb-3 border-b-2 border-[#101010] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-[#101010] text-[#F8F5EE] rounded font-bold">
                DEV
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#101010]">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
            </div>
            <p className="text-xs font-mono font-medium text-[#555555] mt-1">
              $ role: {personalInfo.professionalTitle || 'Software Engineer'}
            </p>
          </div>

          <ContactItems layout="vertical" iconColor="#101010" />
        </div>

        {/* Technical Sections */}
        <div className="space-y-3.5 pt-3 text-xs">
          {/* Skills Front and Center */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div className="p-3 bg-[#F8F8F6] rounded-xl border border-[#E5E0D8]">
              <h2 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#101010] mb-2 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Technical Arsenal</span>
              </h2>
              <div className="space-y-1.5">
                {skills.technical && skills.technical.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.technical.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] px-2 py-0.5 bg-white border border-[#DDD5C7] rounded font-medium text-[#101010]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div className="text-[11px] text-[#555555] pt-1">
                    <span className="font-semibold text-[#101010]">Practices: </span>
                    {skills.soft.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects with Prominent Code / Live Links */}
          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Projects &amp; Open Source</span>
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-3 rounded-xl border border-[#EFEAE0] bg-white">
                    <div className="flex justify-between items-baseline font-bold text-xs text-[#101010]">
                      <span>{proj.title}</span>
                      <ProjectLinks
                        liveUrl={proj.liveUrl}
                        repoUrl={proj.repoUrl}
                        legacyLink={proj.link}
                      />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="font-mono text-[11px] text-[#777777] mt-0.5">
                        [{proj.techStack.join(' | ')}]
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-xs text-[#333333] mt-1 leading-relaxed">
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
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Work Experience</span>
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold text-xs text-[#101010]">
                      <span>{exp.position} · <span className="font-medium text-[#555555]">{exp.company}</span></span>
                      <span className="font-mono text-[11px] text-[#777777]">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line leading-relaxed">
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
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#101010]">{edu.institution}</div>
                      <div className="text-[11px] text-[#555555]">{edu.degree} in {edu.fieldOfStudy}</div>
                    </div>
                    <div className="text-right text-[11px] font-mono">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && <div className="font-semibold text-[#101010]">GPA: {edu.scoreOrGpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Credentials</span>
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {certifications.map((c) => (
                  <div key={c.id}>
                    <span className="font-semibold text-[#101010]">{c.name}</span>
                    <span className="text-[#777777] text-[11px] ml-1">({c.issuer}, {c.issueDate})</span>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-serif ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          fontFamily: 'Cambria, Georgia, serif',
        }}
      >
        <div className="text-center pb-3 border-b border-[#444444] space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#101010]">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs italic text-[#555555]">
            {personalInfo.professionalTitle || 'Academic Researcher / Student'}
          </p>
          <div className="flex justify-center pt-0.5">
            <ContactItems layout="horizontal" iconColor="#444444" />
          </div>
        </div>

        <div className="space-y-4 pt-3 text-xs leading-relaxed">
          {/* Education FIRST */}
          {education && education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Academic Background &amp; Education
              </h2>
              <div className="space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between font-bold">
                      <span>{edu.institution}</span>
                      <span>{edu.startDate} – {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between italic text-[11px]">
                      <span>{edu.degree} in {edu.fieldOfStudy}</span>
                      {edu.scoreOrGpa && <span className="font-semibold">Academic Score: {edu.scoreOrGpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research & Academic Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Research &amp; Course Projects
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between font-bold">
                      <span>{proj.title}</span>
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="text-[11px] italic text-[#555555]">
                        Methodology &amp; Tools: {proj.techStack.join(', ')}
                      </div>
                    )}
                    {proj.description && <p className="text-xs text-[#333333] mt-0.5">{proj.description}</p>}
                    <ProjectLinks
                      liveUrl={proj.liveUrl}
                      repoUrl={proj.repoUrl}
                      legacyLink={proj.link}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical and Scholarly Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Scholarly &amp; Technical Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Scientific &amp; Technical: </span>
                    <span>{skills.technical.join(', ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
                    <span className="font-bold">Communication &amp; Leadership: </span>
                    <span>{skills.soft.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-2">
                Appointments &amp; Internships
              </h2>
              <div className="space-y-2">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold">
                      <span>{exp.position}, {exp.company}</span>
                      <span>{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line">
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
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] border-b border-[#666666] pb-0.5 mb-1.5">
                Honors &amp; Certifications
              </h2>
              <div className="space-y-1">
                {certifications.map((c) => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.name} — {c.issuer}</span>
                    <span>{c.issueDate}</span>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={{
          ...baseA4Style,
          padding: isPrintMode ? '10mm 14mm' : '20px 24px',
        }}
      >
        {/* Compact Header */}
        <div className="pb-2 border-b border-[#101010] flex justify-between items-baseline">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-[#101010]">
              {personalInfo.fullName || 'Candidate Name'}
            </h1>
            <span className="text-[11px] font-semibold text-[#555555]">
              {personalInfo.professionalTitle || 'Target Career Title'}
            </span>
          </div>
          <div className="text-right">
            <ContactItems layout="horizontal" iconColor="#101010" />
          </div>
        </div>

        {/* High Density Content */}
        <div className="space-y-2.5 pt-2 text-[11px] leading-tight">
          {personalInfo.summary && (
            <p className="text-[#333333] italic border-b border-[#F0ECE3] pb-1.5">
              {personalInfo.summary}
            </p>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2 className="font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Education
              </h2>
              <div className="space-y-1">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between">
                    <div>
                      <span className="font-bold">{edu.institution}</span> ·{' '}
                      <span>{edu.degree} in {edu.fieldOfStudy}</span>
                    </div>
                    <div className="font-semibold text-[#555555]">
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
            <div>
              <h2 className="font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Skills
              </h2>
              <div className="space-y-0.5">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Tech: </span>
                    <span>{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
                    <span className="font-bold">Soft: </span>
                    <span>{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h2 className="font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Projects
              </h2>
              <div className="space-y-1.5">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline font-bold">
                      <span>
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
                      <p className="text-[#333333] mt-0.5">{proj.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2 className="font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Experience
              </h2>
              <div className="space-y-1.5">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold">
                      <span>{exp.position} — {exp.company}</span>
                      <span className="text-[#777777] font-normal">{exp.startDate}–{exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-[#333333] mt-0.5 whitespace-pre-line">
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
            <div>
              <h2 className="font-bold uppercase tracking-wider text-[#101010] border-b border-[#E5E0D8] pb-0.5 mb-1">
                Certifications
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {certifications.map((c) => (
                  <span key={c.id}>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Creative Top Banner */}
        <div className="bg-[#1C1C1C] text-white p-5 rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white/20 shrink-0 shadow-sm"
              />
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-xs font-medium text-[#E5E0D8] mt-0.5">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>
          </div>
          <div className="text-xs space-y-1">
            {personalInfo.email && <div>{personalInfo.email}</div>}
            {personalInfo.phone && <div>{personalInfo.phone}</div>}
            {personalInfo.location && <div>{personalInfo.location}</div>}
          </div>
        </div>

        {/* Links strip */}
        <div className="flex flex-wrap gap-3 pb-3 border-b border-[#E5E0D8] text-xs">
          {personalInfo.linkedin && (
            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="underline font-medium text-[#101010]">
              LinkedIn
            </a>
          )}
          {personalInfo.github && (
            <a href={personalInfo.github} target="_blank" rel="noreferrer" className="underline font-medium text-[#101010]">
              GitHub
            </a>
          )}
          {personalInfo.website && (
            <a href={personalInfo.website} target="_blank" rel="noreferrer" className="underline font-medium text-[#101010]">
              Portfolio
            </a>
          )}
        </div>

        {/* Creative Body */}
        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary && (
            <div className="p-3 bg-[#F8F5EE] rounded-xl border-l-4 border-[#101010]">
              <p className="leading-relaxed text-[#242424]">{personalInfo.summary}</p>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-[#101010]">{edu.institution}</span>
                      <div className="text-[11px] text-[#555555]">{edu.degree} in {edu.fieldOfStudy}</div>
                    </div>
                    <div className="text-right text-[11px] text-[#777777]">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && <div className="font-semibold text-[#101010]">Score: {edu.scoreOrGpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects with Pill Badges */}
          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Featured Projects
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-3 bg-[#FAF9F6] border border-[#E5E0D8] rounded-xl">
                    <div className="flex justify-between items-baseline font-bold text-xs text-[#101010]">
                      <span>{proj.title}</span>
                      <ProjectLinks liveUrl={proj.liveUrl} repoUrl={proj.repoUrl} legacyLink={proj.link} />
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-1">
                        {proj.techStack.map((tech) => (
                          <span key={tech} className="px-1.5 py-0.2 bg-white text-[10px] font-medium border border-[#E0D8CB] rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p className="text-xs text-[#333333] mt-1">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Core Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
                    <span className="font-bold">Leadership &amp; Collaboration: </span>
                    <span className="text-[#333333]">{skills.soft.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#101010] pb-1 border-b-2 border-[#101010] mb-2">
                Experience
              </h2>
              <div className="space-y-2">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold text-xs">
                      <span>{exp.position} · {exp.company}</span>
                      <span className="text-[11px] text-[#777777]">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-0.5 whitespace-pre-line">{exp.description}</div>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        <div className="pb-4 border-b-2 border-[#101010]">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
              {personalInfo.photoUrl && (
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-16 h-16 rounded-lg object-cover border border-[#101010] shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight uppercase text-[#101010]">
                  {personalInfo.fullName || 'Candidate Name'}
                </h1>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#777777] mt-0.5">
                  {personalInfo.professionalTitle || 'Target Career Title'}
                </p>
              </div>
            </div>
            <ContactItems layout="vertical" iconColor="#101010" />
          </div>
        </div>

        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#101010] mb-1">
                Executive Profile
              </h2>
              <p className="text-[#333333] leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {/* Experience First for Executive */}
          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Professional Experience &amp; Leadership
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold text-xs text-[#101010]">
                      <span>{exp.position} | <span className="font-semibold text-[#555555]">{exp.company}</span></span>
                      <span className="text-[11px] text-[#777777]">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed">
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
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Initiatives &amp; Key Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between font-bold text-xs">
                      <span>{proj.title}</span>
                      <ProjectLinks liveUrl={proj.liveUrl} repoUrl={proj.repoUrl} legacyLink={proj.link} />
                    </div>
                    {proj.description && <p className="text-xs text-[#333333] mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-2">
                Education &amp; Credentials
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#101010]">{edu.institution}</div>
                      <div className="text-[11px] text-[#555555]">{edu.degree} in {edu.fieldOfStudy}</div>
                    </div>
                    <div className="text-right text-[11px] text-[#777777]">
                      <div>{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && <div className="font-semibold text-[#101010]">GPA: {edu.scoreOrGpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#101010] pb-1 border-b border-[#D1C9BE] mb-1.5">
                Expertise &amp; Capabilities
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Functional &amp; Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        {/* Header with boxed contact summary */}
        <div className="pb-3 border-b-2 border-[#101010]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3.5">
              {personalInfo.photoUrl && (
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName}
                  className="w-14 h-14 rounded-full object-cover border border-[#E5E0D8] shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#101010]">
                  {personalInfo.fullName || 'Candidate Name'}
                </h1>
                <p className="text-xs font-semibold text-[#555555]">
                  {personalInfo.professionalTitle || 'Target Career Title'}
                </p>
              </div>
            </div>
            <ContactItems layout="grid" iconColor="#101010" />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 pt-3.5 text-xs">
          {personalInfo.summary && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1">
                Executive Summary
              </h2>
              <p className="text-[#333333] leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-[#101010]">{edu.institution}</span>
                      <div className="text-[11px] text-[#555555]">{edu.degree} in {edu.fieldOfStudy}</div>
                    </div>
                    <div className="text-right text-[11px]">
                      <div className="text-[#777777]">{edu.startDate} – {edu.endDate}</div>
                      {edu.scoreOrGpa && <div className="font-semibold text-[#101010]">Score: {edu.scoreOrGpa}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Work History &amp; Internships
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold text-xs text-[#101010]">
                      <span>{exp.position} — <span className="font-medium text-[#555555]">{exp.company}</span></span>
                      <span className="text-[11px] text-[#777777]">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && (
                      <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
                Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between font-bold text-xs">
                      <span>{proj.title}</span>
                      <ProjectLinks liveUrl={proj.liveUrl} repoUrl={proj.repoUrl} legacyLink={proj.link} />
                    </div>
                    {proj.description && <p className="text-xs text-[#333333] mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#101010] pb-1 border-b border-[#E5E0D8] mb-1.5">
                Core Competencies
              </h2>
              <div className="space-y-1">
                {skills.technical && skills.technical.length > 0 && (
                  <div>
                    <span className="font-bold">Technical: </span>
                    <span className="text-[#333333]">{skills.technical.join(' · ')}</span>
                  </div>
                )}
                {skills.soft && skills.soft.length > 0 && (
                  <div>
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
        id="resume-a4-document"
        className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
          isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
        } ${className}`}
        style={baseA4Style}
      >
        <div className="space-y-1 pb-4">
          <h1 className="text-2xl font-light tracking-tight text-[#101010]">
            {personalInfo.fullName || 'Candidate Name'}
          </h1>
          <p className="text-xs text-[#777777] font-medium tracking-wide">
            {personalInfo.professionalTitle || 'Target Career Title'}
          </p>
          <div className="pt-1">
            <ContactItems layout="horizontal" iconColor="#777777" />
          </div>
        </div>

        <div className="space-y-5 pt-3 text-xs leading-relaxed">
          {personalInfo.summary && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-1.5">
                Summary
              </h2>
              <p className="text-[#333333] max-w-2xl">{personalInfo.summary}</p>
            </div>
          )}

          {education && education.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Education
              </h2>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-medium text-[#101010]">{edu.institution}</span>
                      <span className="text-[#777777] text-[11px] ml-2">— {edu.degree} in {edu.fieldOfStudy}</span>
                    </div>
                    <span className="text-[11px] text-[#777777] font-mono">{edu.startDate} – {edu.endDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Selected Work
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline font-medium text-[#101010]">
                      <span>{proj.title}</span>
                      <ProjectLinks liveUrl={proj.liveUrl} repoUrl={proj.repoUrl} legacyLink={proj.link} />
                    </div>
                    {proj.description && <p className="text-[#444444] mt-0.5">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-2">
                Experience
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-medium">
                      <span>{exp.position}, {exp.company}</span>
                      <span className="text-[11px] text-[#777777] font-mono">{exp.startDate} – {exp.endDate}</span>
                    </div>
                    {exp.description && <p className="text-[#444444] mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {((skills.technical && skills.technical.length > 0) ||
            (skills.soft && skills.soft.length > 0)) && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#777777] mb-1.5">
                Skills
              </h2>
              <div className="text-xs text-[#333333]">
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
      id="resume-a4-document"
      className={`bg-white text-[#101010] shadow-md transition-all duration-200 font-sans ${
        isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
      } ${className}`}
      style={baseA4Style}
    >
      {/* Modern Header */}
      <div className="pb-4 border-b border-[#E5E0D8]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName}
                className="w-14 h-14 rounded-full object-cover border border-[#E5E0D8] shrink-0 shadow-2xs"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101010] uppercase">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p className="text-sm font-semibold text-[#555555] mt-0.5">
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>
          </div>
          <ContactItems layout="vertical" iconColor="#777777" />
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div className="mt-3 pt-2.5 border-t border-[#F0ECE3]">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-[#777777] mb-1">
              Professional Summary
            </h2>
            <p className="text-xs text-[#333333] leading-relaxed">
              {personalInfo.summary}
            </p>
          </div>
        )}
      </div>

      {/* Modern Body */}
      <div className="space-y-4 pt-3.5 text-xs">
        {/* Education */}
        {education && education.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2 flex justify-between items-center">
              <span>Education</span>
            </h2>
            <div className="space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline font-bold text-[#101010]">
                    <span>{edu.institution || 'University / School'}</span>
                    <span className="text-[11px] font-medium text-[#777777]">
                      {edu.startDate} {edu.startDate && edu.endDate && '–'} {edu.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#555555] text-[11px] mt-0.5">
                    <span>
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </span>
                    {edu.scoreOrGpa && (
                      <span className="font-semibold text-[#101010]">
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
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Skills
            </h2>
            <div className="space-y-1.5">
              {skills.technical && skills.technical.length > 0 && (
                <div>
                  <span className="font-bold text-[#101010] mr-2">Technical:</span>
                  <span className="text-[#333333] leading-relaxed">
                    {skills.technical.join(' · ')}
                  </span>
                </div>
              )}
              {skills.soft && skills.soft.length > 0 && (
                <div>
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
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[#101010]">{proj.title || 'Project Title'}</span>
                    <ProjectLinks
                      liveUrl={proj.liveUrl}
                      repoUrl={proj.repoUrl}
                      legacyLink={proj.link}
                    />
                  </div>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="text-[11px] text-[#777777] italic mt-0.5">
                      Technologies: {proj.techStack.join(', ')}
                    </div>
                  )}
                  {proj.description && (
                    <p className="text-xs text-[#333333] mt-1 leading-relaxed">
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
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Experience &amp; Internships
            </h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline font-bold text-[#101010]">
                    <span>
                      {exp.position} — <span className="text-[#555555]">{exp.company}</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#777777]">
                      {exp.startDate} {exp.startDate && exp.endDate && '–'} {exp.endDate}
                    </span>
                  </div>
                  {exp.location && (
                    <div className="text-[11px] text-[#777777]">{exp.location}</div>
                  )}
                  {exp.description && (
                    <div className="text-xs text-[#333333] mt-1 whitespace-pre-line leading-relaxed">
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
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-[#101010] pb-1 border-b border-[#E5E0D8] mb-2">
              Certifications &amp; Courses
            </h2>
            <div className="space-y-1.5">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-[#101010]">{cert.name}</span>
                    {cert.issuer && (
                      <span className="text-[#777777] ml-1.5">· {cert.issuer}</span>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-[11px] text-[#777777]">{cert.issueDate}</span>
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
