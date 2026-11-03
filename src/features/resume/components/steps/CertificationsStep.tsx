/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Certifications, Leadership, Achievements & Coursework Step
 * Allows students to add, edit, and AI-enhance:
 * 1. Professional Certifications
 * 2. Achievements & Honors
 * 3. Positions of Responsibility (Leadership)
 * 4. Relevant Coursework
 */

import React, { useState } from 'react';
import { ResumeData, ResumeCertification, ResumeLeadership } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Textarea } from '../../../../components/ui/Textarea.tsx';
import { Plus, Trash2, Award, Trophy, Users, BookOpen, X } from 'lucide-react';
import { AiInlineTrigger } from '../assistant/AiInlineTrigger.tsx';
import { ContentAssistantAction, ContentAssistantSection } from '../../../../types/assistant.ts';

interface CertificationsStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
  onOpenAssistant?: (
    section: ContentAssistantSection,
    action?: ContentAssistantAction,
    content?: string | string[],
    context?: any
  ) => void;
}

type SubSectionTab = 'certifications' | 'achievements' | 'leadership' | 'coursework';

export function CertificationsStep({ data, onChange, onOpenAssistant }: CertificationsStepProps) {
  const [activeTab, setActiveTab] = useState<SubSectionTab>('certifications');
  const [newAchievement, setNewAchievement] = useState('');
  const [newCourse, setNewCourse] = useState('');

  const certifications = data.certifications || [];
  const achievements = data.achievements || [];
  const positions = data.positionsOfResponsibility || [];
  const coursework = data.coursework || [];

  // ================= CERTIFICATIONS =================
  const handleAddCertification = () => {
    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    };
    onChange((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }));
  };

  const handleRemoveCertification = (id: string) => {
    onChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((c) => c.id !== id),
    }));
  };

  const handleUpdateCertification = (id: string, field: keyof ResumeCertification, value: string) => {
    onChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  // ================= ACHIEVEMENTS =================
  const handleAddAchievement = (textToAdd?: string) => {
    const trimmed = (textToAdd || newAchievement).trim();
    if (!trimmed) return;
    onChange((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), trimmed],
    }));
    setNewAchievement('');
  };

  const handleRemoveAchievement = (index: number) => {
    onChange((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }));
  };

  // ================= POSITIONS OF RESPONSIBILITY =================
  const handleAddPosition = () => {
    const newPos: ResumeLeadership = {
      id: `pos-${Date.now()}`,
      role: '',
      organization: '',
      duration: '',
      description: '',
      bullets: [],
    };
    onChange((prev) => ({
      ...prev,
      positionsOfResponsibility: [...(prev.positionsOfResponsibility || []), newPos],
    }));
  };

  const handleRemovePosition = (id: string) => {
    onChange((prev) => ({
      ...prev,
      positionsOfResponsibility: (prev.positionsOfResponsibility || []).filter((p) => p.id !== id),
    }));
  };

  const handleUpdatePosition = (id: string, field: keyof ResumeLeadership, value: any) => {
    onChange((prev) => ({
      ...prev,
      positionsOfResponsibility: (prev.positionsOfResponsibility || []).map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  // ================= COURSEWORK =================
  const handleAddCourse = (courseToAdd?: string) => {
    const trimmed = (courseToAdd || newCourse).trim();
    if (!trimmed) return;
    if (coursework.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setNewCourse('');
      return;
    }
    onChange((prev) => ({
      ...prev,
      coursework: [...(prev.coursework || []), trimmed],
    }));
    setNewCourse('');
  };

  const handleRemoveCourse = (courseToRemove: string) => {
    onChange((prev) => ({
      ...prev,
      coursework: (prev.coursework || []).filter((c) => c !== courseToRemove),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sub-Section Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
        <div className="inline-flex p-1 bg-[#EAE5DC] rounded-xl border border-[#DDD5C7] overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('certifications')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'certifications'
                ? 'bg-[#101010] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#101010]'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certifications ({certifications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'achievements'
                ? 'bg-[#101010] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#101010]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Achievements ({achievements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leadership')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leadership'
                ? 'bg-[#101010] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#101010]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Leadership ({positions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coursework')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'coursework'
                ? 'bg-[#101010] text-white shadow-xs'
                : 'text-[#555555] hover:text-[#101010]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Coursework ({coursework.length})</span>
          </button>
        </div>

        {onOpenAssistant && (
          <AiInlineTrigger
            section={
              activeTab === 'certifications'
                ? 'certifications'
                : activeTab === 'achievements'
                ? 'achievements'
                : activeTab === 'leadership'
                ? 'positions_of_responsibility'
                : 'coursework'
            }
            label={`AI ${
              activeTab === 'certifications'
                ? 'Certifications'
                : activeTab === 'achievements'
                ? 'Achievements'
                : activeTab === 'leadership'
                ? 'Leadership'
                : 'Coursework'
            }`}
            onOpenAssistant={(sec, act) => {
              if (activeTab === 'certifications') {
                onOpenAssistant(sec, act, certifications.map((c) => c.name).join(', '));
              } else if (activeTab === 'achievements') {
                onOpenAssistant(sec, act, achievements.join('\n'));
              } else if (activeTab === 'leadership') {
                onOpenAssistant(sec, act, positions.map((p) => `${p.role}: ${p.description}`).join('\n'));
              } else {
                onOpenAssistant(sec, act, coursework.join(', '));
              }
            }}
          />
        )}
      </div>

      {/* ================= TAB 1: CERTIFICATIONS ================= */}
      {activeTab === 'certifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddCertification}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </button>
            <span className="text-xs text-[#777777]">Optional section</span>
          </div>

          <div className="space-y-4">
            {certifications.map((cert, idx) => (
              <div
                key={cert.id}
                className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-4 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#101010]" />
                    <h4 className="text-sm font-bold text-[#101010]">
                      {cert.name || `Certification #${idx + 1}`}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(cert.id)}
                    className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                    aria-label="Remove certification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Input
                  label="Certification Name"
                  placeholder="e.g. AWS Certified Cloud Practitioner / Meta Frontend Developer"
                  value={cert.name}
                  onChange={(e) => handleUpdateCertification(cert.id, 'name', e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Input
                      label="Issuing Organization"
                      placeholder="e.g. Amazon Web Services / Coursera"
                      value={cert.issuer}
                      onChange={(e) => handleUpdateCertification(cert.id, 'issuer', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Issue Date"
                      placeholder="e.g. May 2026"
                      value={cert.issueDate}
                      onChange={(e) => handleUpdateCertification(cert.id, 'issueDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Credential Link / ID"
                      placeholder="e.g. https://credly.com/..."
                      value={cert.credentialUrl || ''}
                      onChange={(e) => handleUpdateCertification(cert.id, 'credentialUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {certifications.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
                <p className="text-xs sm:text-sm text-[#777777] mb-3">
                  No certifications added yet. Industry certifications validate hands-on specialization.
                </p>
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-xl hover:bg-[#252525] transition-colors"
                >
                  Add First Certification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: ACHIEVEMENTS & AWARDS ================= */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAchievement();
                }
              }}
              placeholder="e.g. Top 5 Finalist at National Hackathon 2026 out of 400+ teams"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD5C7] bg-white focus:outline-none focus:border-[#101010]"
            />
            <button
              type="button"
              onClick={() => handleAddAchievement()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#101010] hover:bg-[#252525] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Achievement</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {achievements.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-[#E5E0D8] flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs text-[#171513] font-medium leading-relaxed">
                    {item}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAchievement(idx)}
                  className="p-1 rounded text-[#777777] hover:text-red-600 hover:bg-[#FAF9F5] transition-colors shrink-0"
                  aria-label="Remove achievement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {achievements.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
                <p className="text-xs sm:text-sm text-[#777777]">
                  No achievements listed. Add hackathon placements, academic scholarships, coding contest ranks, or publication honors.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: POSITIONS OF RESPONSIBILITY ================= */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddPosition}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Leadership Role</span>
            </button>
            <span className="text-xs text-[#777777]">Student clubs &amp; initiatives</span>
          </div>

          <div className="space-y-4">
            {positions.map((pos, idx) => (
              <div
                key={pos.id}
                className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-3.5 shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#101010]" />
                    <h4 className="text-sm font-bold text-[#101010]">
                      {pos.role || `Leadership Position #${idx + 1}`}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePosition(pos.id)}
                    className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                    aria-label="Remove role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <Input
                      label="Position / Role"
                      placeholder="e.g. Lead Organizer / Vice President"
                      value={pos.role}
                      onChange={(e) => handleUpdatePosition(pos.id, 'role', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      label="Club / Organization"
                      placeholder="e.g. Google Developer Student Club"
                      value={pos.organization}
                      onChange={(e) => handleUpdatePosition(pos.id, 'organization', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      label="Duration / Term"
                      placeholder="e.g. 2025 – 2026"
                      value={pos.duration || ''}
                      onChange={(e) => handleUpdatePosition(pos.id, 'duration', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[#101010]">
                      Key Contributions &amp; Impact
                    </label>
                    {onOpenAssistant && (
                      <AiInlineTrigger
                        section="positions_of_responsibility"
                        compact
                        label="AI Polish"
                        onOpenAssistant={(sec, act) =>
                          onOpenAssistant(
                            sec,
                            act,
                            pos.bullets?.length ? pos.bullets.join('\n') : pos.description,
                            {
                              itemId: pos.id,
                              itemTitle: `${pos.role} at ${pos.organization}`,
                            }
                          )
                        }
                      />
                    )}
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Led a team of 15 student volunteers, coordinated 4 tech hackathons with 600+ participants."
                    value={pos.description}
                    onChange={(e) => handleUpdatePosition(pos.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}

            {positions.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
                <p className="text-xs sm:text-sm text-[#777777] mb-3">
                  No leadership roles added yet. Student club leads, event coordinators, and open-source maintainers stand out to recruiters.
                </p>
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-xl hover:bg-[#252525] transition-colors"
                >
                  Add First Leadership Role
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: RELEVANT COURSEWORK ================= */}
      {activeTab === 'coursework' && (
        <div className="space-y-4">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCourse();
                }
              }}
              placeholder="e.g. Data Structures & Algorithms, Operating Systems, Database Management"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#DDD5C7] bg-white focus:outline-none focus:border-[#101010]"
            />
            <button
              type="button"
              onClick={() => handleAddCourse()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#101010] hover:bg-[#252525] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] min-h-[120px]">
            <div className="flex flex-wrap gap-2">
              {coursework.map((course) => (
                <span
                  key={course}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FAF6EE] text-[#171513] border border-[#E5DEC9]"
                >
                  <span>{course}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(course)}
                    className="p-0.5 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {coursework.length === 0 && (
              <div className="text-center py-6 text-xs text-[#888888]">
                No courses added yet. Add relevant undergraduate courses that prove academic grounding for your target role.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
