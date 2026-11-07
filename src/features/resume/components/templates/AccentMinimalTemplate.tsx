/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Template 08: Accent Minimal
 * Clean white single-column layout inspired by CVify.AI reference designs.
 * Profile photo and identity header, coloured horizontal accent divider,
 * integrated section headings with accent indicators, compact skill tags, and ATS-optimized hierarchy.
 * Corrected education and skill alignment, removed detached floating lines and awkward badges.
 */

import React from 'react';
import { ResumeData } from '../../../../types/resume.ts';
import { TemplateRenderProps } from './SidebarProTemplate.tsx';

export function AccentMinimalTemplate({
  id = 'resume-a4-document',
  data,
  accentColor,
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
        isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
      } ${className}`}
      style={{
        ...baseA4Style,
        padding: '36px 42px',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* IDENTITY HEADER */}
      <div className="resume-section break-inside-avoid">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {shouldRenderPhoto && personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName || 'Candidate Photo'}
                className="w-20 h-20 rounded-full object-cover shrink-0 shadow-xs border"
                style={{
                  width: '76px',
                  height: '76px',
                  minWidth: '76px',
                  minHeight: '76px',
                  borderColor: `${accentColor}60`,
                }}
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight uppercase text-[#101010] break-words leading-tight">
                {personalInfo.fullName || 'Candidate Name'}
              </h1>
              <p
                className="text-[15px] font-semibold tracking-wider uppercase mt-1 break-words"
                style={{ color: accentColor }}
              >
                {personalInfo.professionalTitle || 'Target Career Title'}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="shrink-0 max-w-[50%] min-w-0">
            <ContactItems layout="vertical" align="right" textColor="text-[#555555]" />
          </div>
        </div>

        {/* COLOURED HORIZONTAL ACCENT DIVIDER */}
        <div
          className="h-1 w-full my-4 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        {/* Professional Summary */}
        {showSummary && (
          <div className="mb-4 resume-entry break-inside-avoid">
            <p className="text-[14px] text-[#2A2A2A] leading-relaxed break-words">
              {personalInfo.summary}
            </p>
          </div>
        )}
      </div>

      {/* MAIN BODY SECTIONS */}
      <div className="space-y-4 pt-1">
        {/* Technical & Soft Skills */}
        {showSkills && (
          <div className="resume-section break-inside-avoid">
            <h2
              className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5"
              style={{ borderColor: accentColor }}
            >
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[#101010]">{customHeadings['skills'] || 'Technical & Professional Skills'}</span>
            </h2>

            <div className="space-y-2.5">
              {skills.technical && skills.technical.length > 0 && (
                <div className="flex items-start gap-3 text-[14px]">
                  <span className="font-bold text-[#333333] shrink-0 min-w-[90px] text-[13px] uppercase tracking-wide">
                    Technical:
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {skills.technical.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[12.5px] font-medium border text-[#222222]"
                        style={{
                          borderColor: `${accentColor}40`,
                          backgroundColor: `${accentColor}08`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.tools && skills.tools.length > 0 && (
                <div className="flex items-start gap-3 text-[14px]">
                  <span className="font-bold text-[#333333] shrink-0 min-w-[90px] text-[13px] uppercase tracking-wide">
                    Tools & Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {skills.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[12.5px] font-medium border border-[#E5E0D8] bg-[#FAF8F5] text-[#444444]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.soft && skills.soft.length > 0 && (
                <div className="flex items-start gap-3 text-[14px]">
                  <span className="font-bold text-[#333333] shrink-0 min-w-[90px] text-[13px] uppercase tracking-wide">
                    Soft Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {skills.soft.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md text-[12.5px] font-medium border border-[#E5E0D8] bg-[#F5F2EB] text-[#555555]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Featured Projects */}
        {showProjects && (
          <div className="resume-section">
            <h2
              className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5"
              style={{ borderColor: accentColor }}
            >
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[#101010]">{customHeadings['projects'] || 'Featured Projects'}</span>
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
                          <span className="text-[14px] font-normal text-[#666666] ml-2">({proj.role})</span>
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
                            className="text-[12.5px] font-medium px-2 py-0.5 rounded-md border text-[#444444]"
                            style={{
                              borderColor: `${accentColor}30`,
                              backgroundColor: `${accentColor}06`,
                            }}
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

        {/* Work Experience */}
        {showExperience && (
          <div className="resume-section">
            <h2
              className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5"
              style={{ borderColor: accentColor }}
            >
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[#101010]">{customHeadings['experience'] || 'Work Experience'}</span>
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

        {/* Education */}
        {showEducation && (
          <div className="resume-section">
            <h2
              className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5"
              style={{ borderColor: accentColor }}
            >
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[#101010]">{customHeadings['education'] || 'Education'}</span>
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
                      <span className="text-[13px] font-semibold text-[#101010]">
                        GPA: {edu.scoreOrGpa}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {showCertifications && (
          <div className="resume-section break-inside-avoid">
            <h2
              className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5"
              style={{ borderColor: accentColor }}
            >
              <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: accentColor }} />
              <span className="text-[#101010]">{customHeadings['certifications'] || 'Certifications'}</span>
            </h2>

            <div className="space-y-2 text-[14px]">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline resume-entry break-inside-avoid">
                  <div>
                    <span className="font-semibold text-[#101010]">
                      {cert.credentialUrl ? (
                        <a
                          href={toSafeUrl(cert.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline font-semibold"
                          style={{ color: accentColor }}
                        >
                          {cert.name}
                        </a>
                      ) : (
                        cert.name
                      )}
                    </span>
                    {cert.issuer && <span className="text-[#666666] ml-2">· {cert.issuer}</span>}
                  </div>
                  {cert.issueDate && <span className="text-[13px] text-[#777777] ml-2 shrink-0">{cert.issueDate}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Sections */}
        {renderAdditionalSections(
          `text-[15px] font-bold uppercase tracking-wider pb-1.5 mb-3 border-b-2 flex items-center gap-2.5`
        )}
      </div>
    </div>
  );
}
