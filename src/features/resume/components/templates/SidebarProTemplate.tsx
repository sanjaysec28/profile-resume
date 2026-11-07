/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Template 06: Sidebar Pro
 * Professional two-column layout with high-contrast tinted sidebar.
 * Coloured left sidebar containing profile photo, name, role, contact info and skill tags.
 * Clean white right content area containing summary, projects, experience and education.
 * WCAG AAA compliant contrast: pure white text and crisp borders on dark sidebar background.
 */

import React from 'react';
import { ResumeData } from '../../../../types/resume.ts';

export interface TemplateRenderProps {
  id?: string;
  data: ResumeData;
  accentColor: string;
  sidebarBg: string;
  baseA4Style: React.CSSProperties;
  className?: string;
  isPrintMode?: boolean;
  shouldRenderPhoto?: boolean;
  toSafeUrl: (url: string) => string;
  ProjectLinks: React.ComponentType<{
    liveUrl?: string;
    repoUrl?: string;
    legacyLink?: string;
    className?: string;
    linkColor?: string;
  }>;
  ContactItems: React.ComponentType<{
    layout?: 'horizontal' | 'vertical' | 'grid';
    className?: string;
    align?: 'left' | 'center' | 'right';
    textColor?: string;
    iconColor?: string;
  }>;
  renderAdditionalSections: (headingClass?: string) => React.ReactNode;
}

export function SidebarProTemplate({
  id = 'resume-a4-document',
  data,
  accentColor,
  sidebarBg,
  baseA4Style,
  className = '',
  isPrintMode = false,
  shouldRenderPhoto = false,
  toSafeUrl,
  ProjectLinks,
  ContactItems,
  renderAdditionalSections,
}: TemplateRenderProps) {
  const {
    personalInfo,
    education,
    experience,
    projects,
    skills,
    certifications,
    customHeadings = {},
    sectionVisibility = {},
  } = data;

  const showEducation = education && education.length > 0 && sectionVisibility['education'] !== false;
  const showExperience = experience && experience.length > 0 && sectionVisibility['experience'] !== false;
  const showProjects = projects && projects.length > 0 && sectionVisibility['projects'] !== false;
  const showSkills = skills && (skills.technical.length > 0 || skills.soft.length > 0 || (skills.tools && skills.tools.length > 0)) && sectionVisibility['skills'] !== false;
  const showCertifications = certifications && certifications.length > 0 && sectionVisibility['certifications'] !== false;
  const showSummary = personalInfo.summary?.trim() && sectionVisibility['summary'] !== false;

  return (
    <div
      id={id}
      className={`resume-a4-root bg-white text-[#101010] transition-all duration-200 ${
        isPrintMode ? 'w-full shadow-none p-0' : 'w-full rounded-2xl'
      } ${className}`}
      style={{ ...baseA4Style, padding: 0 }}
    >
      <div className="grid grid-cols-12 min-h-[1123px] items-stretch">
        {/* LEFT COLOURED SIDEBAR (4 columns = ~33% width) */}
        <div
          className="col-span-4 p-6 sm:p-7 text-white flex flex-col justify-start space-y-5 border-r border-black/10"
          style={{ backgroundColor: sidebarBg }}
        >
          {/* Identity & Profile Photo */}
          <div className="resume-entry break-inside-avoid text-center">
            {shouldRenderPhoto && personalInfo.photoUrl && (
              <div className="flex justify-center mb-3">
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName || 'Candidate Photo'}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/80 shadow-md"
                  style={{ width: '80px', height: '80px', minWidth: '80px', minHeight: '80px' }}
                />
              </div>
            )}
            <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight uppercase text-[#FFFFFF] break-words leading-tight">
              {personalInfo.fullName || 'Candidate Name'}
            </h1>
            <p className="text-[15px] font-semibold text-[#FFFFFF] uppercase tracking-wider mt-1.5 break-words">
              {personalInfo.professionalTitle || 'Target Career Title'}
            </p>
          </div>

          {/* Contact Details */}
          <div className="pt-3 border-t border-white/30 resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[14px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-2.5 pb-1 border-b border-white/20">
              Contact Details
            </h2>
            <ContactItems layout="vertical" textColor="text-[#FFFFFF]" align="left" />
          </div>

          {/* Skill Tags in Sidebar */}
          {showSkills && (
            <div className="pt-3 border-t border-white/30 resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[14px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-3 pb-1 border-b border-white/20">
                {customHeadings['skills'] || 'Skills & Expertise'}
              </h2>

              {/* Technical Skills */}
              {skills.technical && skills.technical.length > 0 && (
                <div className="mb-3.5">
                  <span className="text-[12px] font-bold text-[#FFFFFF] uppercase tracking-wider block mb-1.5">
                    Technical Proficiencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.technical.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-white/25 border border-white/40 text-[#FFFFFF] text-[12.5px] font-semibold px-2.5 py-1 rounded-md inline-block break-words shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools & Frameworks */}
              {skills.tools && skills.tools.length > 0 && (
                <div className="mb-3.5">
                  <span className="text-[12px] font-bold text-[#FFFFFF] uppercase tracking-wider block mb-1.5">
                    Tools & Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="bg-white/20 border border-white/35 text-[#FFFFFF] text-[12.5px] font-medium px-2.5 py-1 rounded-md inline-block break-words"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {skills.soft && skills.soft.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-[#FFFFFF] uppercase tracking-wider block mb-1.5">
                    Soft Skills & Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.soft.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-white/20 border border-white/35 text-[#FFFFFF] text-[12.5px] font-medium px-2.5 py-1 rounded-md inline-block break-words"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Certifications in Sidebar if present */}
          {showCertifications && (
            <div className="pt-3 border-t border-white/30 resume-section break-inside-avoid">
              <h2 className="resume-section-header break-after-avoid text-[14px] font-bold uppercase tracking-wider text-[#FFFFFF] mb-2.5 pb-1 border-b border-white/20">
                {customHeadings['certifications'] || 'Certifications'}
              </h2>
              <div className="space-y-2.5 text-[13px]">
                {certifications.map((cert) => (
                  <div key={cert.id} className="resume-entry break-inside-avoid">
                    <div className="font-bold text-[#FFFFFF] leading-tight break-words">
                      {cert.credentialUrl ? (
                        <a
                          href={toSafeUrl(cert.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-white/70 hover:opacity-85 text-[#FFFFFF]"
                        >
                          {cert.name}
                        </a>
                      ) : (
                        cert.name
                      )}
                    </div>
                    {cert.issuer && (
                      <div className="text-white/90 text-[12px] mt-0.5">{cert.issuer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT WHITE CONTENT CANVAS (8 columns = ~67% width) */}
        <div className="col-span-8 p-6 sm:p-8 bg-white flex flex-col justify-start space-y-5 text-[#101010]">
          {/* Summary */}
          {showSummary && (
            <div className="resume-section break-inside-avoid">
              <h2
                className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1 mb-2.5 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {customHeadings['summary'] || 'Professional Summary'}
              </h2>
              <p className="text-[14px] text-[#2A2A2A] leading-relaxed break-words">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {showExperience && (
            <div className="resume-section">
              <h2
                className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {customHeadings['experience'] || 'Work Experience'}
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => {
                  const hasDesc = Boolean(exp.description && exp.description.trim());
                  const expBullets = (exp.bullets || [])
                    .map((b) => (typeof b === 'string' ? b.trim() : ''))
                    .filter((b) => b.length > 0 && (!hasDesc || b !== exp.description?.trim()));

                  return (
                    <div key={exp.id} className="resume-entry break-inside-avoid">
                      <div className="flex justify-between items-baseline font-bold text-[#101010]">
                        <span className="text-[16px] font-bold text-[#101010] break-words">
                          {exp.position}
                        </span>
                        <span className="text-[13px] font-normal text-[#666666] shrink-0 ml-2">
                          {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold mt-0.5 text-[14px]" style={{ color: accentColor }}>
                        <span>{exp.company}</span>
                        {exp.location && (
                          <span className="text-[#777777] font-normal text-[13px]">· {exp.location}</span>
                        )}
                        {exp.employmentType && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F5F5F5] text-[#555555] border border-[#E5E0D8]">
                            {exp.employmentType}
                          </span>
                        )}
                      </div>
                      {hasDesc && (
                        <p className="text-[14px] text-[#333333] mt-1.5 leading-relaxed break-words whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                      {expBullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-[14px] text-[#333333]">
                          {expBullets.map((bullet, idx) => (
                            <li key={idx} className="break-words pl-0.5 leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Projects */}
          {showProjects && (
            <div className="resume-section">
              <h2
                className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {customHeadings['projects'] || 'Featured Projects'}
              </h2>
              <div className="space-y-4">
                {projects.map((proj) => {
                  const hasDesc = Boolean(proj.description && proj.description.trim());
                  const projBullets = (proj.bullets || [])
                    .map((b) => (typeof b === 'string' ? b.trim() : ''))
                    .filter((b) => b.length > 0 && (!hasDesc || b !== proj.description?.trim()));

                  return (
                    <div key={proj.id} className="resume-entry break-inside-avoid">
                      <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                        <span className="text-[16px] font-bold text-[#101010] break-words">
                          {proj.title}
                          {proj.role && (
                            <span className="text-[14px] font-normal text-[#555555] ml-2">({proj.role})</span>
                          )}
                        </span>
                        <ProjectLinks
                          liveUrl={proj.liveUrl}
                          repoUrl={proj.repoUrl}
                          legacyLink={proj.link}
                          linkColor={accentColor}
                        />
                      </div>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {proj.techStack.map((tech, i) => (
                            <span
                              key={i}
                              className="text-[12.5px] font-medium px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E5E0D8] text-[#444444]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {hasDesc && (
                        <p className="text-[14px] text-[#333333] mt-1.5 leading-relaxed break-words whitespace-pre-line">
                          {proj.description}
                        </p>
                      )}
                      {projBullets.length > 0 && (
                        <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-[14px] text-[#333333]">
                          {projBullets.map((bullet, idx) => (
                            <li key={idx} className="break-words pl-0.5 leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {showEducation && (
            <div className="resume-section">
              <h2
                className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1 mb-3 border-b-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                {customHeadings['education'] || 'Education'}
              </h2>
              <div className="space-y-3.5">
                {education.map((edu) => (
                  <div key={edu.id} className="resume-entry break-inside-avoid">
                    <div className="flex justify-between items-baseline font-bold text-[#101010]">
                      <span className="text-[16px] font-bold text-[#101010] break-words">
                        {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}
                      </span>
                      <span className="text-[13px] font-normal text-[#666666] shrink-0 ml-2">
                        {edu.startDate} – {edu.isCurrent ? 'Present' : edu.endDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[14px] text-[#555555] mt-0.5">
                      <span className="font-semibold" style={{ color: accentColor }}>{edu.institution}</span>
                      {edu.scoreOrGpa && (
                        <span className="text-[13px] font-semibold text-[#101010] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E0D8]">
                          GPA: {edu.scoreOrGpa}
                        </span>
                      )}
                    </div>
                    {edu.highlights && edu.highlights.length > 0 && (
                      <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-[14px] text-[#444444]">
                        {edu.highlights.map((h, i) => (
                          <li key={i} className="break-words pl-0.5">
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Sections */}
          {renderAdditionalSections(
            `text-[15px] font-bold uppercase tracking-wider pb-1 mb-2.5 border-b-2`
          )}
        </div>
      </div>
    </div>
  );
}
