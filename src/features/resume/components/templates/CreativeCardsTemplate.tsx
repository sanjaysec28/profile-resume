/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Template 07: Creative Cards
 * Modern modular layout inspired by CVify.AI reference designs.
 * Warm cream page background with crisp white rounded section cards.
 * Distinct cards for header, summary, skills, projects, experience, education, and certifications.
 * Prevents empty card containers, maintains balanced A4 pagination, and enforces standardized typography.
 */

import React from 'react';
import { ResumeData } from '../../../../types/resume.ts';
import { TemplateRenderProps } from './SidebarProTemplate.tsx';

export function CreativeCardsTemplate({
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
    achievements,
    positionsOfResponsibility,
    coursework,
    customHeadings = {},
    sectionVisibility = {},
  } = data;

  const showEducation = education && education.length > 0 && sectionVisibility['education'] !== false;
  const showExperience = experience && experience.length > 0 && sectionVisibility['experience'] !== false;
  const showProjects = projects && projects.length > 0 && sectionVisibility['projects'] !== false;
  const showSkills = skills && (skills.technical.length > 0 || skills.soft.length > 0 || (skills.tools && skills.tools.length > 0)) && sectionVisibility['skills'] !== false;
  const showCertifications = certifications && certifications.length > 0 && sectionVisibility['certifications'] !== false;
  const showSummary = personalInfo.summary?.trim() && sectionVisibility['summary'] !== false;

  const showAchievements = achievements && achievements.length > 0 && sectionVisibility['achievements'] !== false;
  const showPositions = positionsOfResponsibility && positionsOfResponsibility.length > 0 && sectionVisibility['positions_of_responsibility'] !== false;
  const showCoursework = coursework && coursework.length > 0 && sectionVisibility['coursework'] !== false;

  return (
    <div
      id={id}
      className={`resume-a4-root text-[#101010] transition-all duration-200 ${
        isPrintMode ? 'w-full shadow-none' : 'w-full rounded-2xl'
      } ${className}`}
      style={{
        ...baseA4Style,
        backgroundColor: '#FAF8F5',
        padding: '30px 34px',
      }}
    >
      <div className="space-y-3.5">
        {/* CARD 1: HEADER & IDENTITY CARD */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs resume-card resume-section break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {shouldRenderPhoto && personalInfo.photoUrl && (
                <img
                  src={personalInfo.photoUrl}
                  alt={personalInfo.fullName || 'Candidate Photo'}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-xs"
                  style={{
                    width: '78px',
                    height: '78px',
                    minWidth: '78px',
                    minHeight: '78px',
                    border: `2px solid ${accentColor}`,
                  }}
                />
              )}
              <div className="min-w-0">
                <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-[#101010] break-words uppercase leading-tight">
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

            {/* Contact Details in Header */}
            <div className="shrink-0 max-w-full sm:max-w-[45%]">
              <ContactItems layout="vertical" align="right" textColor="text-[#444444]" />
            </div>
          </div>
        </div>

        {/* CARD 2: PROFESSIONAL SUMMARY (IF PRESENT) */}
        {showSummary && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-2.5 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['summary'] || 'Professional Summary'}</span>
            </h2>
            <p className="text-[14px] text-[#2A2A2A] leading-relaxed break-words">
              {personalInfo.summary}
            </p>
          </div>
        )}

        {/* CARD 3: SKILLS CARD */}
        {showSkills && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-3 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['skills'] || 'Skills & Expertise'}</span>
            </h2>

            <div className="space-y-3">
              {skills.technical && skills.technical.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-[#666666] uppercase tracking-wider block mb-1.5">
                    Technical Proficiencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.technical.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[12.5px] font-semibold inline-block break-words"
                        style={{
                          backgroundColor: `${accentColor}12`,
                          color: accentColor,
                          border: `1px solid ${accentColor}35`,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.tools && skills.tools.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-[#666666] uppercase tracking-wider block mb-1.5">
                    Tools & Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[12.5px] font-medium text-[#444444] bg-[#F7F5F0] border border-[#E5E0D8] inline-block break-words"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.soft && skills.soft.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-[#666666] uppercase tracking-wider block mb-1.5">
                    Soft Skills & Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.soft.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[12.5px] font-medium text-[#555555] bg-white border border-[#E5E0D8] inline-block break-words"
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

        {/* CARD 4: FEATURED PROJECTS */}
        {showProjects && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-3.5 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['projects'] || 'Featured Projects'}</span>
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
                              borderColor: `${accentColor}35`,
                              backgroundColor: `${accentColor}08`,
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

        {/* CARD 5: WORK EXPERIENCE */}
        {showExperience && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-3.5 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['experience'] || 'Work Experience'}</span>
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

        {/* CARD 6: EDUCATION */}
        {showEducation && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-3 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['education'] || 'Education'}</span>
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

        {/* CARD 7: CERTIFICATIONS (DEDICATED CARD, ONLY IF PRESENT) */}
        {showCertifications && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section break-inside-avoid">
            <h2 className="resume-section-header break-after-avoid text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 mb-3 pb-1.5 border-b border-[#F0ECE3]">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
              <span>{customHeadings['certifications'] || 'Verified Certifications'}</span>
            </h2>

            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id} className="flex justify-between items-baseline text-[14px] resume-entry break-inside-avoid">
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

        {/* CARD 8: ADDITIONAL SECTIONS (ACHIEVEMENTS / LEADERSHIP / COURSEWORK) */}
        {(showAchievements || showPositions || showCoursework) && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs resume-card resume-section break-inside-avoid">
            {renderAdditionalSections(
              `text-[15px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-2 pb-1.5 border-b border-[#F0ECE3] mb-3`
            )}
          </div>
        )}
      </div>
    </div>
  );
}
