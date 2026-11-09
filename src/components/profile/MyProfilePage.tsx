/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Complete My Profile Page Redesign & Functional Rebuild
 * Warm cream, white, charcoal aesthetic with 8 distinct functional sections.
 * Clean modal dialogs with pinned headers/footers, independent scrolling, and background lock.
 */

import React, { useState } from 'react';
import { StudentProfile, AvatarType } from '../../types/profile.ts';
import {
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeCertification,
} from '../../types/resume.ts';
import {
  COMMON_TECHNICAL_SKILLS,
  COMMON_SOFT_SKILLS,
} from '../../features/resume/constants.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Avatar } from '../ui/Avatar.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Textarea } from '../ui/Textarea.tsx';
import { Dialog } from '../ui/Dialog.tsx';
import {
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Code,
  LogOut,
  Copy,
  Check,
  Upload,
  BrainCircuit,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  uploadProfileImageToCloudinary,
  validateImageFile,
  checkCloudinaryConfig,
} from '../../lib/cloudinary.ts';
import { PersonalizationGoalsCard } from '../../features/personalization/index.ts';
import {
  StudentCareerGoals,
  DEFAULT_CAREER_GOALS,
  StudentIntelligenceProfile,
} from '../../types/personalization.ts';
import { loadStudentCareerGoals } from '../../lib/studentPersonalizationService.ts';

interface MyProfilePageProps {
  profile: StudentProfile;
  resumeData: ResumeData;
  onUpdateProfile: (updated: StudentProfile) => Promise<void> | void;
  onUpdateResumeData: (updater: (prev: ResumeData) => ResumeData) => void;
  onNavigateToBuilder: () => void;
  onNavigateToAts: () => void;
  onSignOut?: () => void;
  goals?: StudentCareerGoals;
  onUpdateGoals?: (updated: StudentCareerGoals) => void;
  intelligence?: StudentIntelligenceProfile;
}

export function MyProfilePage({
  profile,
  resumeData,
  onUpdateProfile,
  onUpdateResumeData,
  onNavigateToBuilder,
  onNavigateToAts,
  onSignOut,
  goals,
  onUpdateGoals,
  intelligence,
}: MyProfilePageProps) {
  const { user, isConfigured } = useAuth();

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persistent student goals state
  const [currentGoals, setCurrentGoals] = useState<StudentCareerGoals>(goals || DEFAULT_CAREER_GOALS);

  React.useEffect(() => {
    if (goals) {
      setCurrentGoals(goals);
    } else {
      loadStudentCareerGoals(user?.uid, {
        targetRole: profile.targetRole,
        location: profile.location,
      }).then((loaded) => setCurrentGoals(loaded));
    }
  }, [goals, user?.uid, profile.targetRole, profile.location]);

  const handleGoalsUpdated = (updated: StudentCareerGoals) => {
    setCurrentGoals(updated);
    if (onUpdateGoals) {
      onUpdateGoals(updated);
    }
    showToast('Career goals and personalization preferences updated!');
  };

  // Dialog states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAvatarPhotoOpen, setIsAvatarPhotoOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);

  // Sub-entity editing modals
  const [eduModal, setEduModal] = useState<{ isOpen: boolean; item: ResumeEducation | null }>({
    isOpen: false,
    item: null,
  });
  const [projectModal, setProjectModal] = useState<{ isOpen: boolean; item: ResumeProject | null }>({
    isOpen: false,
    item: null,
  });
  const [expModal, setExpModal] = useState<{ isOpen: boolean; item: ResumeExperience | null }>({
    isOpen: false,
    item: null,
  });
  const [certModal, setCertModal] = useState<{ isOpen: boolean; item: ResumeCertification | null }>({
    isOpen: false,
    item: null,
  });

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'education' | 'project' | 'experience' | 'certification';
    id: string;
    title: string;
  }>({
    isOpen: false,
    type: 'education',
    id: '',
    title: '',
  });

  // Quick skills addition bar state
  const [newSkillText, setNewSkillText] = useState('');
  const [skillCategory, setSkillCategory] = useState<'technical' | 'soft'>('technical');

  // UID copy feedback
  const [copiedUid, setCopiedUid] = useState(false);

  // Helper: safe external URL
  const toSafeUrl = (url?: string) => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  // Copy UID handler
  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid).then(() => {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    });
  };

  // Quick skill add
  const handleAddQuickSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;

    onUpdateResumeData((prev) => {
      const currentList = prev.skills?.[skillCategory] || [];
      if (currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillCategory]: [...currentList, trimmed],
        },
      };
    });
    setNewSkillText('');
    showToast(`Added "${trimmed}" to ${skillCategory} skills`);
  };

  const handleRemoveSkill = (skill: string, type: 'technical' | 'soft') => {
    onUpdateResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: (prev.skills?.[type] || []).filter((s) => s !== skill),
      },
    }));
    showToast(`Removed "${skill}"`);
  };

  // Delete entity executor
  const handleConfirmDelete = () => {
    const { type, id } = deleteConfirm;
    if (type === 'education') {
      onUpdateResumeData((prev) => ({
        ...prev,
        education: (prev.education || []).filter((e) => e.id !== id),
      }));
      showToast('Education record deleted');
    } else if (type === 'project') {
      onUpdateResumeData((prev) => ({
        ...prev,
        projects: (prev.projects || []).filter((p) => p.id !== id),
      }));
      showToast('Project deleted');
    } else if (type === 'experience') {
      onUpdateResumeData((prev) => ({
        ...prev,
        experience: (prev.experience || []).filter((e) => e.id !== id),
      }));
      showToast('Experience record deleted');
    } else if (type === 'certification') {
      onUpdateResumeData((prev) => ({
        ...prev,
        certifications: (prev.certifications || []).filter((c) => c.id !== id),
      }));
      showToast('Certification deleted');
    }
    setDeleteConfirm({ isOpen: false, type: 'education', id: '', title: '' });
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#101010] text-[#FAF8F5] rounded-xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
       * 1. PROFILE HEADER
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Avatar / Photo with change overlay */}
          <div className="relative shrink-0 group">
            {profile.avatar === 'custom' && profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || 'User Photo'}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-3 border-[#E5E0D8] shadow-sm"
              />
            ) : (
              <Avatar
                type={profile.avatar}
                size="2xl"
                className="w-24 h-24 sm:w-28 sm:h-28 border-3 border-[#E5E0D8] shadow-sm"
              />
            )}
            <button
              type="button"
              onClick={() => setIsAvatarPhotoOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#101010] hover:bg-[#252525] text-white shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Change Photo or 3D Avatar"
              aria-label="Change Photo or 3D Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Bio and Title */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101010] break-words">
                {profile.fullName || user?.displayName || 'ProFile User'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F5EE] text-[#101010] border border-[#E5E0D8] rounded-full text-xs font-semibold self-center md:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Verified</span>
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-[#555555] break-words">
              {profile.targetRole || 'Target role not specified'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-[#777777] pt-1">
              {profile.collegeOrUniversity ? (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#101010]" />
                  <span>{profile.collegeOrUniversity}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#A3A3A3]">
                  <GraduationCap className="w-4 h-4 text-[#A3A3A3]" />
                  <span>University not added</span>
                </span>
              )}

              <span>·</span>

              {profile.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#101010]" />
                  <span>{profile.location}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[#A3A3A3]">
                  <MapPin className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span>Location not added</span>
                </span>
              )}

              {profile.gpa && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-[#101010]">GPA: {profile.gpa}</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0 self-center md:self-start">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsEditProfileOpen(true)}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onNavigateToBuilder}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Resume Builder</span>
            </Button>
            {onSignOut && (
              <Button
                variant="ghost"
                size="md"
                onClick={onSignOut}
                className="gap-2 text-[#777777] hover:text-[#101010] hover:bg-[#F2ECE0]"
                title="Sign out of ProFile"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. PERSONAL INFORMATION
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                Personal & Academic Details
              </h2>
              <p className="text-xs text-[#777777]">
                Contact details, university profile, and external links
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditProfileOpen(true)}
            className="gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Full Name
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.fullName || user?.displayName || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Email Address
            </span>
            <p className="font-semibold text-[#101010] break-all">
              {profile.email || user?.email || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Phone Number
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.phone || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Location
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.location || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              College / University
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.collegeOrUniversity || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Major / Degree
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.major || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Graduation Year
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.graduationYear || '—'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Grade / GPA
            </span>
            <p className="font-semibold text-[#101010]">
              {profile.gpa || '—'}
            </p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="border-t border-[#E5E0D8] pt-5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Professional Summary / Bio
          </span>
          {profile.bio ? (
            <p className="text-sm text-[#333333] leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8]">
              {profile.bio}
            </p>
          ) : (
            <p className="text-xs text-[#999999] italic">
              No summary provided yet. Click "Edit" to add a bio that will sync to your resume overview.
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="border-t border-[#E5E0D8] pt-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block mb-3">
            Portfolio & Social Links
          </span>
          <div className="flex flex-wrap gap-3">
            {profile.socialLinks?.linkedin ? (
              <a
                href={toSafeUrl(profile.socialLinks.linkedin)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-[#777777]" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs text-[#999999]">
                <Linkedin className="w-3.5 h-3.5 opacity-40" />
                <span>LinkedIn not added</span>
              </span>
            )}

            {profile.socialLinks?.github ? (
              <a
                href={toSafeUrl(profile.socialLinks.github)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-[#777777]" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs text-[#999999]">
                <Github className="w-3.5 h-3.5 opacity-40" />
                <span>GitHub not added</span>
              </span>
            )}

            {profile.socialLinks?.portfolio ? (
              <a
                href={toSafeUrl(profile.socialLinks.portfolio)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Portfolio Website</span>
                <ExternalLink className="w-3 h-3 text-[#777777]" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs text-[#999999]">
                <Globe className="w-3.5 h-3.5 opacity-40" />
                <span>Portfolio not added</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. CAREER GOALS & PERSONALIZATION INTELLIGENCE (Phase D.7.2)
       * ========================================================================= */}
      <PersonalizationGoalsCard
        userId={user?.uid}
        goals={currentGoals}
        intelligence={intelligence}
        onGoalsUpdated={handleGoalsUpdated}
      />

      {/* =========================================================================
       * 3. EDUCATION
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                  Education
                </h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#777777]">
                  {(resumeData.education || []).length}
                </span>
              </div>
              <p className="text-xs text-[#777777]">
                Degrees, universities, colleges, and academic milestones
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setEduModal({ isOpen: true, item: null })}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Education</span>
          </Button>
        </div>

        {/* Education Records List */}
        {(resumeData.education || []).length > 0 ? (
          <div className="divide-y divide-[#E5E0D8]">
            {resumeData.education.map((edu) => (
              <div
                key={edu.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="text-base font-bold text-[#101010]">
                    {edu.institution || 'Educational Institution'}
                  </h3>
                  <p className="text-sm font-semibold text-[#555555]">
                    {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#777777]">
                    <span>
                      {edu.startDate} – {edu.isCurrent ? 'Present' : edu.endDate || 'Present'}
                    </span>
                    {edu.scoreOrGpa && (
                      <>
                        <span>·</span>
                        <span className="font-medium text-[#101010]">GPA / Score: {edu.scoreOrGpa}</span>
                      </>
                    )}
                  </div>
                  {edu.highlights && edu.highlights.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-[#666666] pt-1.5 space-y-0.5">
                      {edu.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => setEduModal({ isOpen: true, item: edu })}
                    className="p-2 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                    title="Edit Education"
                    aria-label="Edit Education"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'education',
                        id: edu.id,
                        title: edu.institution || 'this education record',
                      })
                    }
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Education"
                    aria-label="Delete Education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF8F5] space-y-2">
            <GraduationCap className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <p className="text-sm font-semibold text-[#101010]">No education records added yet</p>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Add your college or university degree to showcase your academic background on your resume.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEduModal({ isOpen: true, item: null })}
              className="mt-2 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your Degree</span>
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
       * 4. SKILLS
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                  Skills & Proficiencies
                </h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#777777]">
                  {((resumeData.skills?.technical || []).length) + ((resumeData.skills?.soft || []).length)}
                </span>
              </div>
              <p className="text-xs text-[#777777]">
                Technical abilities, frameworks, tools, and soft skills
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSkillsModalOpen(true)}
            className="gap-1.5"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Manage Skills</span>
          </Button>
        </div>

        {/* Quick Add Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl">
          <div className="inline-flex rounded-xl bg-white border border-[#E5E0D8] p-1 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setSkillCategory('technical')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                skillCategory === 'technical'
                  ? 'bg-[#101010] text-white shadow-xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              Technical
            </button>
            <button
              type="button"
              onClick={() => setSkillCategory('soft')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                skillCategory === 'soft'
                  ? 'bg-[#101010] text-white shadow-xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              Soft Skills
            </button>
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newSkillText}
              onChange={(e) => setNewSkillText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddQuickSkill();
                }
              }}
              placeholder={`Add ${skillCategory === 'technical' ? 'technical skill (e.g. React, Python, Docker)' : 'soft skill (e.g. Leadership, Problem Solving)'}...`}
              className="flex-1 h-9 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#101010]"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddQuickSkill}
              className="h-9 px-4 shrink-0"
              disabled={!newSkillText.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Skills Tag Clouds */}
        <div className="space-y-5">
          {/* Technical Skills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Technical Skills ({(resumeData.skills?.technical || []).length})
              </span>
            </div>
            {(resumeData.skills?.technical || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.technical.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#101010] rounded-xl text-xs font-medium text-[#101010] transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill, 'technical')}
                      className="text-[#999999] hover:text-red-500 rounded-full p-0.5 cursor-pointer"
                      title={`Remove ${skill}`}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#999999] italic">No technical skills added yet.</p>
            )}
          </div>

          {/* Soft Skills */}
          <div className="space-y-2 border-t border-[#E5E0D8] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Soft Skills ({(resumeData.skills?.soft || []).length})
              </span>
            </div>
            {(resumeData.skills?.soft || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.soft.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#101010] rounded-xl text-xs font-medium text-[#101010] transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill, 'soft')}
                      className="text-[#999999] hover:text-red-500 rounded-full p-0.5 cursor-pointer"
                      title={`Remove ${skill}`}
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#999999] italic">No soft skills added yet.</p>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="border-t border-[#E5E0D8] pt-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block">
              Suggested Skills (Click to add)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...COMMON_TECHNICAL_SKILLS.slice(0, 8), ...COMMON_SOFT_SKILLS.slice(0, 4)]
                .filter(
                  (s) =>
                    !(resumeData.skills?.technical || []).includes(s) &&
                    !(resumeData.skills?.soft || []).includes(s)
                )
                .slice(0, 8)
                .map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => {
                      const isTech = COMMON_TECHNICAL_SKILLS.includes(suggested);
                      const cat = isTech ? 'technical' : 'soft';
                      onUpdateResumeData((prev) => ({
                        ...prev,
                        skills: {
                          ...prev.skills,
                          [cat]: [...(prev.skills?.[cat] || []), suggested],
                        },
                      }));
                      showToast(`Added ${suggested}`);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-lg text-[11px] font-medium text-[#555555] hover:text-[#101010] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{suggested}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 5. PROJECTS
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                  Projects & Portfolio
                </h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#777777]">
                  {(resumeData.projects || []).length}
                </span>
              </div>
              <p className="text-xs text-[#777777]">
                Technical projects, web applications, open source, and hackathons
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setProjectModal({ isOpen: true, item: null })}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </Button>
        </div>

        {/* Project Records List */}
        {(resumeData.projects || []).length > 0 ? (
          <div className="divide-y divide-[#E5E0D8]">
            {resumeData.projects.map((proj) => (
              <div
                key={proj.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#101010]">
                      {proj.title}
                    </h3>
                    {proj.role && (
                      <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-[11px] font-semibold text-[#666666]">
                        {proj.role}
                      </span>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs sm:text-sm text-[#444444] leading-relaxed whitespace-pre-line">
                      {proj.description}
                    </p>
                  )}

                  {/* Tech stack chips */}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-[11px] font-medium text-[#101010]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    {proj.liveUrl && (
                      <a
                        href={toSafeUrl(proj.liveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#101010] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a
                        href={toSafeUrl(proj.repoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#101010] hover:underline"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Repository</span>
                      </a>
                    )}
                    {!proj.liveUrl && !proj.repoUrl && proj.link && (
                      <a
                        href={toSafeUrl(proj.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#101010] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Project Link</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => setProjectModal({ isOpen: true, item: proj })}
                    className="p-2 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                    title="Edit Project"
                    aria-label="Edit Project"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'project',
                        id: proj.id,
                        title: proj.title || 'this project',
                      })
                    }
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Project"
                    aria-label="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF8F5] space-y-2">
            <Layers className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <p className="text-sm font-semibold text-[#101010]">No projects added yet</p>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Showcase software projects, web apps, or research to prove your skills to recruiters.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setProjectModal({ isOpen: true, item: null })}
              className="mt-2 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Project</span>
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
       * 6. EXPERIENCE AND INTERNSHIPS
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                  Experience & Internships
                </h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#777777]">
                  {(resumeData.experience || []).length}
                </span>
              </div>
              <p className="text-xs text-[#777777]">
                Work history, summer internships, research assistantships, and freelancing
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setExpModal({ isOpen: true, item: null })}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
          </Button>
        </div>

        {/* Experience Records List */}
        {(resumeData.experience || []).length > 0 ? (
          <div className="divide-y divide-[#E5E0D8]">
            {resumeData.experience.map((exp) => (
              <div
                key={exp.id}
                className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#101010]">
                      {exp.position}
                    </h3>
                    <span className="text-sm font-semibold text-[#555555]">
                      @ {exp.company}
                    </span>
                    {exp.employmentType && (
                      <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-[11px] font-semibold text-[#666666]">
                        {exp.employmentType}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#777777]">
                    <span>
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    </span>
                    {exp.location && (
                      <>
                        <span>·</span>
                        <span>{exp.location}</span>
                      </>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-xs sm:text-sm text-[#444444] leading-relaxed whitespace-pre-line pt-1">
                      {exp.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => setExpModal({ isOpen: true, item: exp })}
                    className="p-2 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                    title="Edit Experience"
                    aria-label="Edit Experience"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'experience',
                        id: exp.id,
                        title: `${exp.position} at ${exp.company}`,
                      })
                    }
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Experience"
                    aria-label="Delete Experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF8F5] space-y-2">
            <Briefcase className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <p className="text-sm font-semibold text-[#101010]">No experience records added yet</p>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Add your internships, part-time jobs, campus leadership roles, or freelancing.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpModal({ isOpen: true, item: null })}
              className="mt-2 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Experience</span>
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
       * 7. CERTIFICATIONS
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                  Certifications & Licenses
                </h2>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#777777]">
                  {(resumeData.certifications || []).length}
                </span>
              </div>
              <p className="text-xs text-[#777777]">
                Industry credentials, cloud certifications, and verified courses
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCertModal({ isOpen: true, item: null })}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Certification</span>
          </Button>
        </div>

        {/* Certifications Records List */}
        {(resumeData.certifications || []).length > 0 ? (
          <div className="divide-y divide-[#E5E0D8]">
            {resumeData.certifications?.map((cert) => (
              <div
                key={cert.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="text-base font-bold text-[#101010]">
                    {cert.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#777777]">
                    <span className="font-semibold text-[#555555]">{cert.issuer}</span>
                    {cert.issueDate && (
                      <>
                        <span>·</span>
                        <span>Issued {cert.issueDate}</span>
                      </>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={toSafeUrl(cert.credentialUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#101010] hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Credential</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => setCertModal({ isOpen: true, item: cert })}
                    className="p-2 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                    title="Edit Certification"
                    aria-label="Edit Certification"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'certification',
                        id: cert.id,
                        title: cert.name || 'this certification',
                      })
                    }
                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Certification"
                    aria-label="Delete Certification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF8F5] space-y-2">
            <Award className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <p className="text-sm font-semibold text-[#101010]">No certifications added yet</p>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              Add AWS, Google Cloud, Coursera, or industry certificates to boost your resume score.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCertModal({ isOpen: true, item: null })}
              className="mt-2 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </Button>
          </div>
        )}
      </section>

      {/* =========================================================================
       * 8. ACCOUNT INFORMATION
       * ========================================================================= */}
      <section className="bg-white border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] border border-[#E5E0D8] flex items-center justify-center text-[#101010]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#101010]">
                Account & Authentication
              </h2>
              <p className="text-xs text-[#777777]">
                Identity provider, verified session credentials, and database synchronization
              </p>
            </div>
          </div>
          {onSignOut && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSignOut}
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          {/* Identity Provider */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Auth Provider
            </span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-bold text-[#101010]">Google Authentication</span>
            </div>
            <p className="text-xs text-[#777777]">
              Single Sign-On with verified credentials
            </p>
          </div>

          {/* Email Verification */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Email Verification
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-700">
                {user?.emailVerified ? 'Verified by Google' : 'Google Verified Session'}
              </span>
            </div>
            <p className="text-xs text-[#777777] break-all">
              {user?.email || profile.email || '—'}
            </p>
          </div>

          {/* Firestore Database Sync */}
          <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Database Sync
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="font-bold text-[#101010]">Firestore Cloud Connected</span>
            </div>
            <p className="text-xs text-[#777777]">
              Stored securely at <code className="text-[#101010] bg-white px-1 py-0.5 rounded border border-[#E5E0D8]">users/{'{uid}'}</code>
            </p>
          </div>
        </div>

        {/* UID Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl text-xs">
          <div className="min-w-0">
            <span className="font-bold text-[#777777] block uppercase tracking-wider text-[10px]">
              Firebase User Identifier (UID)
            </span>
            <span className="font-mono text-[#101010] break-all select-all font-medium">
              {user?.uid || 'Not available'}
            </span>
          </div>
          {user?.uid && (
            <button
              type="button"
              onClick={handleCopyUid}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-xl font-semibold text-[#101010] transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            >
              {copiedUid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy UID</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
       * MODAL 1: EDIT PROFILE DIALOG
       * ========================================================================= */}
      {isEditProfileOpen && (
        <EditProfileDialog
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profile={profile}
          onSave={async (updatedData) => {
            const updatedProfile: StudentProfile = {
              ...profile,
              ...updatedData,
              email: profile.email,
            };

            await onUpdateProfile(updatedProfile);

            // Sync shared fields to ResumeData
            onUpdateResumeData((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                fullName: updatedProfile.fullName,
                email: updatedProfile.email,
                phone: updatedProfile.phone || prev.personalInfo.phone,
                location: updatedProfile.location || prev.personalInfo.location,
                professionalTitle: updatedProfile.targetRole || prev.personalInfo.professionalTitle,
                linkedin: updatedProfile.socialLinks?.linkedin || prev.personalInfo.linkedin,
                github: updatedProfile.socialLinks?.github || prev.personalInfo.github,
                website: updatedProfile.socialLinks?.portfolio || prev.personalInfo.website,
                summary: updatedProfile.bio || prev.personalInfo.summary,
              },
            }));

            showToast('Profile saved and synced successfully');
            setIsEditProfileOpen(false);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 2: AVATAR & PHOTO PICKER DIALOG
       * ========================================================================= */}
      {isAvatarPhotoOpen && (
        <AvatarPhotoDialog
          isOpen={isAvatarPhotoOpen}
          onClose={() => setIsAvatarPhotoOpen(false)}
          profile={profile}
          onSaveAvatar={(avatarType, customUrl) => {
            const updated = {
              ...profile,
              avatar: avatarType,
              avatarUrl: customUrl || (avatarType !== 'custom' ? undefined : profile.avatarUrl),
            };
            onUpdateProfile(updated);

            onUpdateResumeData((prev) => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                photoUrl: updated.avatarUrl,
              },
            }));

            showToast('Profile photo updated');
            setIsAvatarPhotoOpen(false);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 3: EDUCATION DIALOG (ADD / EDIT)
       * ========================================================================= */}
      {eduModal.isOpen && (
        <EducationDialog
          isOpen={eduModal.isOpen}
          item={eduModal.item}
          onClose={() => setEduModal({ isOpen: false, item: null })}
          onSave={(savedEdu) => {
            onUpdateResumeData((prev) => {
              const currentList = prev.education || [];
              const exists = currentList.some((e) => e.id === savedEdu.id);
              return {
                ...prev,
                education: exists
                  ? currentList.map((e) => (e.id === savedEdu.id ? savedEdu : e))
                  : [...currentList, savedEdu],
              };
            });
            showToast(eduModal.item ? 'Education updated' : 'Education added');
            setEduModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 4: PROJECT DIALOG (ADD / EDIT)
       * ========================================================================= */}
      {projectModal.isOpen && (
        <ProjectDialog
          isOpen={projectModal.isOpen}
          item={projectModal.item}
          onClose={() => setProjectModal({ isOpen: false, item: null })}
          onSave={(savedProject) => {
            onUpdateResumeData((prev) => {
              const currentList = prev.projects || [];
              const exists = currentList.some((p) => p.id === savedProject.id);
              return {
                ...prev,
                projects: exists
                  ? currentList.map((p) => (p.id === savedProject.id ? savedProject : p))
                  : [...currentList, savedProject],
              };
            });
            showToast(projectModal.item ? 'Project updated' : 'Project added');
            setProjectModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 5: EXPERIENCE DIALOG (ADD / EDIT)
       * ========================================================================= */}
      {expModal.isOpen && (
        <ExperienceDialog
          isOpen={expModal.isOpen}
          item={expModal.item}
          onClose={() => setExpModal({ isOpen: false, item: null })}
          onSave={(savedExp) => {
            onUpdateResumeData((prev) => {
              const currentList = prev.experience || [];
              const exists = currentList.some((e) => e.id === savedExp.id);
              return {
                ...prev,
                experience: exists
                  ? currentList.map((e) => (e.id === savedExp.id ? savedExp : e))
                  : [...currentList, savedExp],
              };
            });
            showToast(expModal.item ? 'Experience updated' : 'Experience added');
            setExpModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 6: CERTIFICATION DIALOG (ADD / EDIT)
       * ========================================================================= */}
      {certModal.isOpen && (
        <CertificationDialog
          isOpen={certModal.isOpen}
          item={certModal.item}
          onClose={() => setCertModal({ isOpen: false, item: null })}
          onSave={(savedCert) => {
            onUpdateResumeData((prev) => {
              const currentList = prev.certifications || [];
              const exists = currentList.some((c) => c.id === savedCert.id);
              return {
                ...prev,
                certifications: exists
                  ? currentList.map((c) => (c.id === savedCert.id ? savedCert : c))
                  : [...currentList, savedCert],
              };
            });
            showToast(certModal.item ? 'Certification updated' : 'Certification added');
            setCertModal({ isOpen: false, item: null });
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 7: SKILLS MANAGEMENT DIALOG
       * ========================================================================= */}
      {isSkillsModalOpen && (
        <SkillsManagementDialog
          isOpen={isSkillsModalOpen}
          onClose={() => setIsSkillsModalOpen(false)}
          skills={resumeData.skills || { technical: [], soft: [] }}
          onSaveSkills={(updatedSkills) => {
            onUpdateResumeData((prev) => ({
              ...prev,
              skills: updatedSkills,
            }));
            showToast('Skills updated successfully');
            setIsSkillsModalOpen(false);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 8: DELETE CONFIRMATION DIALOG
       * ========================================================================= */}
      {deleteConfirm.isOpen && (
        <Dialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, type: 'education', id: '', title: '' })}
          title="Confirm Deletion"
          description={`Are you sure you want to delete ${deleteConfirm.title}? This action cannot be undone.`}
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteConfirm({ isOpen: false, type: 'education', id: '', title: '' })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          }
        >
          <div className="py-2 text-xs text-[#777777]">
            This record will be permanently removed from your active profile and draft resume.
          </div>
        </Dialog>
      )}
    </div>
  );
}

// =============================================================================
// SUB-DIALOG 1: EDIT PROFILE DIALOG
// =============================================================================
function EditProfileDialog({
  isOpen,
  onClose,
  profile,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (data: Partial<StudentProfile>) => Promise<void> | void;
}) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    targetRole: profile.targetRole || '',
    phone: profile.phone || '',
    location: profile.location || '',
    collegeOrUniversity: profile.collegeOrUniversity || '',
    major: profile.major || '',
    graduationYear: profile.graduationYear || '',
    gpa: profile.gpa || '',
    bio: profile.bio || '',
    linkedin: profile.socialLinks?.linkedin || '',
    github: profile.socialLinks?.github || '',
    portfolio: profile.socialLinks?.portfolio || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        fullName: formData.fullName.trim(),
        targetRole: formData.targetRole.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        collegeOrUniversity: formData.collegeOrUniversity.trim(),
        major: formData.major.trim(),
        graduationYear: formData.graduationYear.trim(),
        gpa: formData.gpa.trim(),
        bio: formData.bio.trim(),
        socialLinks: {
          linkedin: formData.linkedin.trim(),
          github: formData.github.trim(),
          portfolio: formData.portfolio.trim(),
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your contact, academic, and professional details. Changes are saved to Firestore."
      maxWidth="lg"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
          >
            Save Profile
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={formData.fullName}
            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="e.g. Alex Chen"
            required
          />

          <Input
            label="Professional Title / Target Role"
            value={formData.targetRole}
            onChange={(e) => setFormData((prev) => ({ ...prev, targetRole: e.target.value }))}
            placeholder="e.g. Full Stack Software Engineer"
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. +1 (555) 019-2834"
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. San Francisco, CA"
          />

          <Input
            label="College / University"
            value={formData.collegeOrUniversity}
            onChange={(e) => setFormData((prev) => ({ ...prev, collegeOrUniversity: e.target.value }))}
            placeholder="e.g. University of California, Berkeley"
          />

          <Input
            label="Major / Field of Study"
            value={formData.major}
            onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
            placeholder="e.g. Computer Science & AI"
          />

          <Input
            label="Graduation Year"
            value={formData.graduationYear}
            onChange={(e) => setFormData((prev) => ({ ...prev, graduationYear: e.target.value }))}
            placeholder="e.g. 2026"
          />

          <Input
            label="GPA / Grade"
            value={formData.gpa}
            onChange={(e) => setFormData((prev) => ({ ...prev, gpa: e.target.value }))}
            placeholder="e.g. 3.85 / 4.0"
          />
        </div>

        <Textarea
          label="Professional Summary / Bio"
          value={formData.bio}
          onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          placeholder="Brief 2-3 sentence overview of your technical background, passion, and career aspirations..."
          rows={3}
        />

        <div className="space-y-3 pt-2 border-t border-[#E5E0D8]">
          <span className="text-xs font-bold text-[#101010] uppercase tracking-wider block">
            Social & Portfolio Links
          </span>
          <div className="space-y-3">
            <Input
              label="LinkedIn URL"
              value={formData.linkedin}
              onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/username"
              leftIcon={<Linkedin className="w-4 h-4 text-[#777777]" />}
            />
            <Input
              label="GitHub URL"
              value={formData.github}
              onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
              placeholder="https://github.com/username"
              leftIcon={<Github className="w-4 h-4 text-[#777777]" />}
            />
            <Input
              label="Portfolio / Personal Website"
              value={formData.portfolio}
              onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
              placeholder="https://yourportfolio.dev"
              leftIcon={<Globe className="w-4 h-4 text-[#777777]" />}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 2: AVATAR & PHOTO PICKER DIALOG
// =============================================================================
function AvatarPhotoDialog({
  isOpen,
  onClose,
  profile,
  onSaveAvatar,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveAvatar: (avatar: AvatarType, customUrl?: string) => void;
}) {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(profile.avatar);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | undefined>(profile.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid image file');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const isConfigured = checkCloudinaryConfig();
      if (isConfigured) {
        const uploadResult = await uploadProfileImageToCloudinary(file);
        setCustomPhotoUrl(uploadResult.secureUrl);
        setSelectedAvatar('custom');
      } else {
        // Fallback to local Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          setCustomPhotoUrl(url);
          setSelectedAvatar('custom');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed. Using local preview.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onSaveAvatar(selectedAvatar, customPhotoUrl);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Avatar & Photo"
      description="Choose a 3D avatar character or upload your custom profile picture."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isUploading}
          >
            Save Choice
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 3D Avatars */}
        <div>
          <span className="text-xs font-bold text-[#101010] uppercase tracking-wider block mb-3">
            3D Student Avatars
          </span>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedAvatar('boy')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                selectedAvatar === 'boy'
                  ? 'border-[#101010] bg-white shadow-md'
                  : 'border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#101010]/40'
              }`}
            >
              <Avatar type="boy" size="xl" />
              <div className="text-center">
                <span className="text-xs font-bold text-[#101010] block">Student (Boy)</span>
                <span className="text-[11px] text-[#777777]">ProFile 3D Character</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAvatar('girl')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                selectedAvatar === 'girl'
                  ? 'border-[#101010] bg-white shadow-md'
                  : 'border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#101010]/40'
              }`}
            >
              <Avatar type="girl" size="xl" />
              <div className="text-center">
                <span className="text-xs font-bold text-[#101010] block">Student (Girl)</span>
                <span className="text-[11px] text-[#777777]">ProFile 3D Character</span>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Photo Upload */}
        <div className="border-t border-[#E5E0D8] pt-5">
          <span className="text-xs font-bold text-[#101010] uppercase tracking-wider block mb-3">
            Or Upload Custom Photo
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl">
            {customPhotoUrl ? (
              <img
                src={customPhotoUrl}
                alt="Uploaded Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#101010] shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center text-[#777777] shrink-0">
                <Camera className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 text-center sm:text-left space-y-1">
              <label
                htmlFor="photo-upload-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] cursor-pointer transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Choose Image File'}</span>
              </label>
              <input
                id="photo-upload-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <p className="text-[11px] text-[#777777]">
                Supports PNG, JPG, or WebP up to 5MB.
              </p>
            </div>

            {customPhotoUrl && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAvatar('custom');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  selectedAvatar === 'custom'
                    ? 'bg-[#101010] text-white'
                    : 'bg-white border border-[#E5E0D8] text-[#101010]'
                }`}
              >
                {selectedAvatar === 'custom' ? 'Selected' : 'Use Photo'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 3: EDUCATION DIALOG (ADD / EDIT)
// =============================================================================
function EducationDialog({
  isOpen,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: ResumeEducation | null;
  onClose: () => void;
  onSave: (edu: ResumeEducation) => void;
}) {
  const [formData, setFormData] = useState<ResumeEducation>(
    item || {
      id: `edu_${Date.now()}`,
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      scoreOrGpa: '',
      highlights: [],
    }
  );

  const [highlightsText, setHighlightsText] = useState(
    (item?.highlights || []).join('\n')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institution.trim()) return;

    const highlights = highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      ...formData,
      institution: formData.institution.trim(),
      degree: formData.degree.trim(),
      fieldOfStudy: formData.fieldOfStudy.trim(),
      startDate: formData.startDate.trim(),
      endDate: formData.isCurrent ? '' : formData.endDate.trim(),
      scoreOrGpa: formData.scoreOrGpa?.trim(),
      highlights,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Education' : 'Add Education'}
      description="Provide your institution name, degree, and study duration."
      maxWidth="md"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {item ? 'Save Changes' : 'Add Record'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Institution / University *"
          value={formData.institution}
          onChange={(e) => setFormData((prev) => ({ ...prev, institution: e.target.value }))}
          placeholder="e.g. University of California, Berkeley"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Degree *"
            value={formData.degree}
            onChange={(e) => setFormData((prev) => ({ ...prev, degree: e.target.value }))}
            placeholder="e.g. Bachelor of Science"
            required
          />

          <Input
            label="Field of Study"
            value={formData.fieldOfStudy}
            onChange={(e) => setFormData((prev) => ({ ...prev, fieldOfStudy: e.target.value }))}
            placeholder="e.g. Computer Science"
          />

          <Input
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            placeholder="e.g. Aug 2022"
          />

          <Input
            label="End Date / Expected"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            placeholder="e.g. May 2026"
            disabled={formData.isCurrent}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isCurrentEdu"
            type="checkbox"
            checked={formData.isCurrent || false}
            onChange={(e) => setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E5E0D8] text-[#101010] focus:ring-[#101010]"
          />
          <label htmlFor="isCurrentEdu" className="text-xs text-[#555555]">
            I am currently studying here
          </label>
        </div>

        <Input
          label="GPA / Grade"
          value={formData.scoreOrGpa || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, scoreOrGpa: e.target.value }))}
          placeholder="e.g. 3.90 / 4.0"
        />

        <Textarea
          label="Key Coursework & Academic Highlights (one per line)"
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
          placeholder="Data Structures & Algorithms&#10;Dean's Honors List 2024"
          rows={3}
        />
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 4: PROJECT DIALOG (ADD / EDIT)
// =============================================================================
function ProjectDialog({
  isOpen,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: ResumeProject | null;
  onClose: () => void;
  onSave: (proj: ResumeProject) => void;
}) {
  const [formData, setFormData] = useState<ResumeProject>(
    item || {
      id: `proj_${Date.now()}`,
      title: '',
      role: '',
      techStack: [],
      liveUrl: '',
      repoUrl: '',
      description: '',
    }
  );

  const [techStackInput, setTechStackInput] = useState(
    (item?.techStack || []).join(', ')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      ...formData,
      title: formData.title.trim(),
      role: formData.role?.trim(),
      techStack,
      liveUrl: formData.liveUrl?.trim(),
      repoUrl: formData.repoUrl?.trim(),
      description: formData.description.trim(),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Project' : 'Add Project'}
      description="Highlight projects you created with tools, live demo, and source code."
      maxWidth="md"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {item ? 'Save Changes' : 'Add Project'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Project Title *"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. AI-Powered Resume Builder"
          required
        />

        <Input
          label="Your Role (Optional)"
          value={formData.role || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
          placeholder="e.g. Lead Full-Stack Engineer"
        />

        <Input
          label="Technologies & Tools (comma separated)"
          value={techStackInput}
          onChange={(e) => setTechStackInput(e.target.value)}
          placeholder="React, TypeScript, Tailwind CSS, Firebase"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Live Demo URL"
            value={formData.liveUrl || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, liveUrl: e.target.value }))}
            placeholder="https://myproject.app"
            leftIcon={<ExternalLink className="w-4 h-4 text-[#777777]" />}
          />

          <Input
            label="GitHub Repository URL"
            value={formData.repoUrl || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, repoUrl: e.target.value }))}
            placeholder="https://github.com/user/project"
            leftIcon={<Github className="w-4 h-4 text-[#777777]" />}
          />
        </div>

        <Textarea
          label="Project Description & Achievements"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what the project does, key technical challenges you solved, and impact..."
          rows={4}
          required
        />
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 5: EXPERIENCE DIALOG (ADD / EDIT)
// =============================================================================
function ExperienceDialog({
  isOpen,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: ResumeExperience | null;
  onClose: () => void;
  onSave: (exp: ResumeExperience) => void;
}) {
  const [formData, setFormData] = useState<ResumeExperience>(
    item || {
      id: `exp_${Date.now()}`,
      company: '',
      position: '',
      location: '',
      employmentType: 'Internship',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.position.trim()) return;

    onSave({
      ...formData,
      company: formData.company.trim(),
      position: formData.position.trim(),
      location: formData.location?.trim(),
      startDate: formData.startDate.trim(),
      endDate: formData.isCurrent ? '' : formData.endDate.trim(),
      description: formData.description?.trim(),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Experience' : 'Add Experience'}
      description="Add your internship, job, or research assistantship details."
      maxWidth="md"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {item ? 'Save Changes' : 'Add Experience'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Position / Job Title *"
            value={formData.position}
            onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
            placeholder="e.g. Software Engineering Intern"
            required
          />

          <Input
            label="Company / Organization *"
            value={formData.company}
            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
            placeholder="e.g. Google"
            required
          />

          <div>
            <label className="text-xs font-medium text-[#101010] tracking-tight block mb-1.5">
              Employment Type
            </label>
            <select
              value={formData.employmentType || 'Internship'}
              onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value }))}
              className="w-full h-11 px-3.5 bg-white text-[#101010] text-sm border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#101010]"
            >
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Research">Research Assistant</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          <Input
            label="Location"
            value={formData.location || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Mountain View, CA (Hybrid)"
          />

          <Input
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            placeholder="e.g. Jun 2024"
          />

          <Input
            label="End Date"
            value={formData.endDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
            placeholder="e.g. Aug 2024"
            disabled={formData.isCurrent}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isCurrentExp"
            type="checkbox"
            checked={formData.isCurrent || false}
            onChange={(e) => setFormData((prev) => ({ ...prev, isCurrent: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E5E0D8] text-[#101010] focus:ring-[#101010]"
          />
          <label htmlFor="isCurrentExp" className="text-xs text-[#555555]">
            I currently work here
          </label>
        </div>

        <Textarea
          label="Key Responsibilities & Impact"
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Built REST APIs reducing latency by 20%...&#10;Collaborated with cross-functional team on production deployment..."
          rows={4}
        />
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 6: CERTIFICATION DIALOG (ADD / EDIT)
// =============================================================================
function CertificationDialog({
  isOpen,
  item,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  item: ResumeCertification | null;
  onClose: () => void;
  onSave: (cert: ResumeCertification) => void;
}) {
  const [formData, setFormData] = useState<ResumeCertification>(
    item || {
      id: `cert_${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.issuer.trim()) return;

    onSave({
      ...formData,
      name: formData.name.trim(),
      issuer: formData.issuer.trim(),
      issueDate: formData.issueDate.trim(),
      credentialUrl: formData.credentialUrl?.trim(),
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Certification' : 'Add Certification'}
      description="Add verified credentials, course completions, and licenses."
      maxWidth="md"
      onSubmit={handleSubmit}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md">
            {item ? 'Save Changes' : 'Add Certification'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Certification Name *"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. AWS Certified Solutions Architect"
          required
        />

        <Input
          label="Issuing Organization *"
          value={formData.issuer}
          onChange={(e) => setFormData((prev) => ({ ...prev, issuer: e.target.value }))}
          placeholder="e.g. Amazon Web Services"
          required
        />

        <Input
          label="Issue Date"
          value={formData.issueDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
          placeholder="e.g. Oct 2024"
        />

        <Input
          label="Credential URL / Verification Link"
          value={formData.credentialUrl || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, credentialUrl: e.target.value }))}
          placeholder="https://credly.com/your-badge"
          leftIcon={<ExternalLink className="w-4 h-4 text-[#777777]" />}
        />
      </div>
    </Dialog>
  );
}

// =============================================================================
// SUB-DIALOG 7: SKILLS MANAGEMENT DIALOG
// =============================================================================
function SkillsManagementDialog({
  isOpen,
  onClose,
  skills,
  onSaveSkills,
}: {
  isOpen: boolean;
  onClose: () => void;
  skills: { technical: string[]; soft: string[] };
  onSaveSkills: (updated: { technical: string[]; soft: string[] }) => void;
}) {
  const [technical, setTechnical] = useState<string[]>(skills.technical || []);
  const [soft, setSoft] = useState<string[]>(skills.soft || []);
  const [activeTab, setActiveTab] = useState<'technical' | 'soft'>('technical');
  const [inputVal, setInputVal] = useState('');

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (activeTab === 'technical') {
      if (!technical.includes(trimmed)) {
        setTechnical([...technical, trimmed]);
      }
    } else {
      if (!soft.includes(trimmed)) {
        setSoft([...soft, trimmed]);
      }
    }
    setInputVal('');
  };

  const handleRemove = (skill: string) => {
    if (activeTab === 'technical') {
      setTechnical(technical.filter((s) => s !== skill));
    } else {
      setSoft(soft.filter((s) => s !== skill));
    }
  };

  const handleSave = () => {
    onSaveSkills({ technical, soft });
  };

  const activeList = activeTab === 'technical' ? technical : soft;
  const suggestions = (
    activeTab === 'technical' ? COMMON_TECHNICAL_SKILLS : COMMON_SOFT_SKILLS
  ).filter((s) => !activeList.includes(s));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Skills"
      description="Add, organize, and prune your technical abilities and soft skills."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave}>
            Save Skills
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Tab switch */}
        <div className="flex p-1 bg-[#F8F5EE] border border-[#E5E0D8] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'technical'
                ? 'bg-white text-[#101010] shadow-xs'
                : 'text-[#777777] hover:text-[#101010]'
            }`}
          >
            Technical Skills ({technical.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('soft')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'soft'
                ? 'bg-white text-[#101010] shadow-xs'
                : 'text-[#777777] hover:text-[#101010]'
            }`}
          >
            Soft Skills ({soft.length})
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={`Add ${activeTab === 'technical' ? 'a language, framework, or tool' : 'a soft skill'}...`}
            className="flex-1 h-10 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#101010]"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!inputVal.trim()}
            className="h-10 px-4"
          >
            Add
          </Button>
        </div>

        {/* Active tags */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Active {activeTab === 'technical' ? 'Technical' : 'Soft'} Skills
          </span>
          {activeList.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl">
              {activeList.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5E0D8] rounded-lg text-xs font-medium text-[#101010]"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(skill)}
                    className="text-[#999999] hover:text-red-500 rounded-full p-0.5 cursor-pointer"
                    title={`Remove ${skill}`}
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-center text-xs text-[#999999]">
              No {activeTab} skills added yet. Use the field above or click suggestions below.
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2 border-t border-[#E5E0D8] pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block">
              Popular Suggestions (Click to add)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (activeTab === 'technical') {
                      setTechnical([...technical, item]);
                    } else {
                      setSoft([...soft, item]);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F2ECE0] border border-[#E5E0D8] rounded-lg text-[11px] font-medium text-[#555555] hover:text-[#101010] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
