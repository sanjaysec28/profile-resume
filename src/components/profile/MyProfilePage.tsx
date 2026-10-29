/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 9: Premium My Profile Management Page
 * Reusable, responsive profile workspace synchronized with ResumeData & StudentProfile.
 */

import { useState } from 'react';
import { StudentProfile, AvatarType } from '../../types/profile.ts';
import {
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeCertification,
} from '../../types/resume.ts';
import { RESUME_TEMPLATES_CATALOG } from '../../features/resume/constants.ts';
import { exportResumeToPdf } from '../../features/resume/utils/pdfExport.ts';
import { FinalPreviewModal } from '../../features/resume/components/FinalPreviewModal.tsx';
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
  Download,
  Eye,
  Camera,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Code,
  ArrowRight,
  Check,
  X,
  LogOut,
  Loader2,
} from 'lucide-react';
import {
  uploadProfileImageToCloudinary,
  validateImageFile,
  checkCloudinaryConfig,
} from '../../lib/cloudinary.ts';

interface MyProfilePageProps {
  profile: StudentProfile;
  resumeData: ResumeData;
  onUpdateProfile: (updated: StudentProfile) => void;
  onUpdateResumeData: (updater: (prev: ResumeData) => ResumeData) => void;
  onNavigateToBuilder: () => void;
  onNavigateToAts: () => void;
  onSignOut?: () => void;
}

export function MyProfilePage({
  profile,
  resumeData,
  onUpdateProfile,
  onUpdateResumeData,
  onNavigateToBuilder,
  onNavigateToAts,
  onSignOut,
}: MyProfilePageProps) {
  // Modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sub-entity editing modals
  const [editingEducation, setEditingEducation] = useState<ResumeEducation | null>(null);
  const [isAddEduOpen, setIsAddEduOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<ResumeProject | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);

  const [editingExperience, setEditingExperience] = useState<ResumeExperience | null>(null);
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);

  const [editingCert, setEditingCert] = useState<ResumeCertification | null>(null);
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);

  // Inline quick skill addition state
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillType, setSkillType] = useState<'technical' | 'soft'>('technical');

  // Export progress and feedback
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Derive genuine stats from saved resume & profile data
  const totalProjects = resumeData.projects?.length || 0;
  const totalSkills =
    (resumeData.skills?.technical?.length || 0) + (resumeData.skills?.soft?.length || 0);
  const totalCertifications = resumeData.certifications?.length || 0;

  // Active template info
  const activeTemplate =
    RESUME_TEMPLATES_CATALOG.find((t) => t.id === resumeData.templateId) ||
    RESUME_TEMPLATES_CATALOG[0];

  // Helper: safe URL
  const toSafeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return '#';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  // Direct PDF Download Handler
  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportNotice('Generating PDF...');

    const result = await exportResumeToPdf({
      elementId: 'resume-a4-document',
      fullName: resumeData.personalInfo.fullName || profile.fullName,
      onProgress: (_step, msg) => setExportNotice(msg),
    });

    setIsExporting(false);
    if (result.success) {
      setExportNotice(`Downloaded: ${result.filename}`);
      setTimeout(() => setExportNotice(null), 4000);
    } else {
      setExportNotice(`Export failed: ${result.error || 'Please try again'}`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    onUpdateResumeData((prev) => {
      const currentList = prev.skills[skillType] || [];
      if (currentList.includes(trimmed)) return prev;
      return {
        ...prev,
        skills: {
          ...prev.skills,
          [skillType]: [...currentList, trimmed],
        },
      };
    });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string, type: 'technical' | 'soft') => {
    onUpdateResumeData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [type]: (prev.skills[type] || []).filter((s) => s !== skill),
      },
    }));
  };

  // Profile Save Handler (syncs both StudentProfile and resumeData.personalInfo)
  const handleSaveProfileForm = (formData: Partial<StudentProfile>) => {
    const updatedProfile: StudentProfile = {
      ...profile,
      ...formData,
    };
    onUpdateProfile(updatedProfile);

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
        photoUrl: updatedProfile.avatarUrl || prev.personalInfo.photoUrl,
      },
    }));

    setIsEditProfileOpen(false);
  };

  // Quick Photo / Avatar selection
  const handleSelectAvatarType = (avatar: AvatarType, customUrl?: string) => {
    const updated = {
      ...profile,
      avatar,
      avatarUrl: customUrl || (avatar !== 'custom' ? undefined : profile.avatarUrl),
    };
    onUpdateProfile(updated);

    onUpdateResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        photoUrl: updated.avatarUrl,
      },
    }));

    setIsPhotoPickerOpen(false);
  };

  // Custom photo upload via Cloudinary with validation and local preview fallback
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setExportNotice(validation.error || 'Invalid photo file.');
      setTimeout(() => setExportNotice(null), 4000);
      return;
    }

    setIsUploadingPhoto(true);
    const cloudinaryConfig = checkCloudinaryConfig();

    if (cloudinaryConfig.isConfigured) {
      setExportNotice('Uploading photo to Cloudinary...');
      try {
        const uploadResult = await uploadProfileImageToCloudinary(file);
        handleSelectAvatarType('custom', uploadResult.secureUrl);
        setExportNotice('Profile photo uploaded and saved successfully!');
        setTimeout(() => setExportNotice(null), 4000);
      } catch (err: any) {
        console.error('[ProFile Cloudinary Upload Error]:', err);
        setExportNotice(`Photo upload failed: ${err.message || 'Please check Cloudinary settings'}`);
        setTimeout(() => setExportNotice(null), 5000);
      } finally {
        setIsUploadingPhoto(false);
      }
    } else {
      // Local fallback if Cloudinary credentials are not configured yet
      setExportNotice('Setting local preview (Cloudinary upload preset pending in .env)...');
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          handleSelectAvatarType('custom', result);
        }
        setIsUploadingPhoto(false);
      };
      reader.onerror = () => setIsUploadingPhoto(false);
      reader.readAsDataURL(file);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 select-none">
      {/* Toast Notification Banner if exporting */}
      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101010] text-[#F8F5EE] px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-[#F8F5EE]" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* =========================================================================
       * SECTION A: PROFILE HERO CARD
       * ========================================================================= */}
      <div className="relative bg-white border border-[#E5E0D8] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10 text-center md:text-left">
          {/* Avatar / Photo with quick edit badge */}
          <div className="relative shrink-0 group">
            {profile.avatar === 'custom' && profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
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
              onClick={() => setIsPhotoPickerOpen(true)}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#101010] hover:bg-[#252525] text-white shadow-md transition-all cursor-pointer"
              title="Change Photo or 3D Avatar"
              aria-label="Change Photo or 3D Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Bio and Title */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101010] break-words">
                {profile.fullName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F5EE] text-[#101010] border border-[#E5E0D8] rounded-full text-xs font-semibold self-center md:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Student</span>
              </span>
            </div>

            <p className="text-sm sm:text-base font-semibold text-[#555555] break-words">
              {profile.targetRole || 'Software Engineering & AI Student'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-[#777777] pt-1">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#101010]" />
                <span>{profile.collegeOrUniversity}</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#101010]" />
                <span>{profile.location || 'Chennai, Tamil Nadu'}</span>
              </span>
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
      </div>

      {/* =========================================================================
       * SECTION B: PROFILE STATISTICS (Derived from Real Saved Data)
       * ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5">
        <div className="p-5 sm:p-6 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Total Projects
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#101010]">
            {totalProjects}
          </div>
          <span className="text-[11px] text-[#A3A3A3] block">
            {totalProjects === 1 ? '1 active project' : `${totalProjects} portfolio items`}
          </span>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Skills Mastered
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#101010]">
            {totalSkills}
          </div>
          <span className="text-[11px] text-[#A3A3A3] block">
            Technical &amp; soft skills
          </span>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Certifications
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#101010]">
            {totalCertifications}
          </div>
          <span className="text-[11px] text-[#A3A3A3] block">Verified credentials</span>
        </div>

        <div className="p-5 sm:p-6 bg-white border border-[#E5E0D8] rounded-2xl sm:rounded-3xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Latest ATS Match
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 flex items-center gap-1.5">
            <span>{activeTemplate.atsScore}</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-[#A3A3A3] block">
            Layout: {activeTemplate.name}
          </span>
        </div>
      </div>

      {/* =========================================================================
       * SECTION J: QUICK ACTIONS SHORTCUT BAR
       * ========================================================================= */}
      <div className="p-4 bg-[#F8F8F6] border border-[#E5E0D8] rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-[#101010] uppercase tracking-wider pl-2 whitespace-nowrap hidden sm:inline">
          Quick Actions:
        </span>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            Edit Personal Info
          </button>
          <button
            type="button"
            onClick={() => setIsAddProjectOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            + Add Project
          </button>
          <button
            type="button"
            onClick={() => setIsAddExpOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            + Add Experience
          </button>
          <button
            type="button"
            onClick={() => setIsAddEduOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            + Add Education
          </button>
          <button
            type="button"
            onClick={() => setIsAddCertOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D8] text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors cursor-pointer"
          >
            + Add Certification
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Personal Info, Education, Experience, Projects */}
        <div className="lg:col-span-8 space-y-8">
          {/* =========================================================================
           * SECTION C: PERSONAL INFORMATION CARD
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-[#101010]" />
                <h2 className="text-lg font-bold text-[#101010]">Personal Information</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit Details
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div>
                <span className="text-[#A3A3A3] font-medium block">Full Name</span>
                <span className="text-sm font-semibold text-[#101010] mt-0.5 block break-words">
                  {profile.fullName}
                </span>
              </div>

              <div>
                <span className="text-[#A3A3A3] font-medium block">Email Address</span>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-sm font-semibold text-[#101010] hover:underline mt-0.5 block break-all"
                >
                  {profile.email}
                </a>
              </div>

              {profile.phone && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">Phone Number</span>
                  <span className="text-sm font-semibold text-[#101010] mt-0.5 block">
                    {profile.phone}
                  </span>
                </div>
              )}

              {profile.location && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">Location</span>
                  <span className="text-sm font-semibold text-[#101010] mt-0.5 block">
                    {profile.location}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[#A3A3A3] font-medium block">College / University</span>
                <span className="text-sm font-semibold text-[#101010] mt-0.5 block break-words">
                  {profile.collegeOrUniversity}
                </span>
              </div>

              <div>
                <span className="text-[#A3A3A3] font-medium block">Major &amp; Degree</span>
                <span className="text-sm font-semibold text-[#101010] mt-0.5 block break-words">
                  {profile.major}
                </span>
              </div>

              {profile.graduationYear && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">Graduation Year</span>
                  <span className="text-sm font-semibold text-[#101010] mt-0.5 block">
                    Class of {profile.graduationYear}
                  </span>
                </div>
              )}

              {profile.gpa && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">CGPA / Score</span>
                  <span className="text-sm font-semibold text-[#101010] mt-0.5 block">
                    {profile.gpa}
                  </span>
                </div>
              )}

              {profile.socialLinks?.linkedin && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">LinkedIn</span>
                  <a
                    href={toSafeUrl(profile.socialLinks.linkedin)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#101010] hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#0077B5]" />
                    <span>{profile.socialLinks.linkedin}</span>
                  </a>
                </div>
              )}

              {profile.socialLinks?.github && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">GitHub</span>
                  <a
                    href={toSafeUrl(profile.socialLinks.github)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#101010] hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                  >
                    <Github className="w-3.5 h-3.5 text-[#101010]" />
                    <span>{profile.socialLinks.github}</span>
                  </a>
                </div>
              )}

              {profile.socialLinks?.portfolio && (
                <div>
                  <span className="text-[#A3A3A3] font-medium block">Portfolio / Website</span>
                  <a
                    href={toSafeUrl(profile.socialLinks.portfolio)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#101010] hover:underline inline-flex items-center gap-1 mt-0.5 break-all"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#101010]" />
                    <span>{profile.socialLinks.portfolio}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
           * SECTION D: EDUCATION
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#101010]" />
                <h2 className="text-lg font-bold text-[#101010]">Education</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddEduOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </Button>
            </div>

            <div className="space-y-4">
              {resumeData.education && resumeData.education.length > 0 ? (
                resumeData.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#101010] break-words">
                          {edu.institution}
                        </h3>
                        <span className="text-xs font-semibold text-[#777777]">
                          ({edu.startDate} – {edu.endDate})
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#555555] font-medium break-words">
                        {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                      </p>
                      {edu.scoreOrGpa && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-white border border-[#E5E0D8] text-[11px] font-semibold text-[#101010]">
                          CGPA / Score: {edu.scoreOrGpa}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingEducation(edu)}
                        className="p-1.5 rounded-lg text-[#777777] hover:text-[#101010] hover:bg-white transition-colors cursor-pointer"
                        title="Edit education"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateResumeData((prev) => ({
                            ...prev,
                            education: prev.education.filter((e) => e.id !== edu.id),
                          }));
                        }}
                        className="p-1.5 rounded-lg text-[#777777] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                        title="Delete education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#777777]">
                  No education records added yet. Click &quot;Add Record&quot; to add your college or schooling.
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
           * SECTION F: PROJECTS
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#101010]" />
                <h2 className="text-lg font-bold text-[#101010]">Key Projects</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddProjectOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </Button>
            </div>

            <div className="space-y-4">
              {resumeData.projects && resumeData.projects.length > 0 ? (
                resumeData.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-[#101010] break-words">
                          {proj.title}
                        </h3>
                        {proj.techStack && proj.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {proj.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="px-2 py-0.5 rounded-md bg-white border border-[#E0D8CB] text-[11px] font-medium text-[#101010]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingProject(proj)}
                          className="p-1.5 rounded-lg text-[#777777] hover:text-[#101010] hover:bg-white transition-colors cursor-pointer"
                          title="Edit project"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateResumeData((prev) => ({
                              ...prev,
                              projects: prev.projects.filter((p) => p.id !== proj.id),
                            }));
                          }}
                          className="p-1.5 rounded-lg text-[#777777] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {proj.description && (
                      <p className="text-xs sm:text-sm text-[#333333] leading-relaxed break-words">
                        {proj.description}
                      </p>
                    )}

                    {/* Project links */}
                    {(proj.liveUrl || proj.repoUrl || proj.link) && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-[#EAE5DC] text-xs">
                        {proj.liveUrl && (
                          <a
                            href={toSafeUrl(proj.liveUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#555555]" />
                            <span>Live Demo</span>
                            <ExternalLink className="w-3 h-3 text-[#A3A3A3]" />
                          </a>
                        )}
                        {(proj.repoUrl || proj.link) && (
                          <a
                            href={toSafeUrl(proj.repoUrl || proj.link!)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#101010] hover:underline"
                          >
                            <Github className="w-3.5 h-3.5 text-[#555555]" />
                            <span>Source Code</span>
                            <Code className="w-3 h-3 text-[#A3A3A3]" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#777777]">
                  No projects added yet. Click &quot;Add Project&quot; to showcase your software or academic work.
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
           * SECTION G: WORK EXPERIENCE & INTERNSHIPS
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-[#101010]" />
                <h2 className="text-lg font-bold text-[#101010]">Experience &amp; Internships</h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddExpOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </Button>
            </div>

            <div className="space-y-4">
              {resumeData.experience && resumeData.experience.length > 0 ? (
                resumeData.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-[#101010] break-words">
                            {exp.position}
                          </h3>
                          <span className="text-xs font-semibold text-[#555555]">
                            — {exp.company}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#777777] mt-0.5">
                          <span>{exp.startDate} – {exp.endDate}</span>
                          {exp.location && <span>· {exp.location}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingExperience(exp)}
                          className="p-1.5 rounded-lg text-[#777777] hover:text-[#101010] hover:bg-white transition-colors cursor-pointer"
                          title="Edit experience"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateResumeData((prev) => ({
                              ...prev,
                              experience: prev.experience.filter((e) => e.id !== exp.id),
                            }));
                          }}
                          className="p-1.5 rounded-lg text-[#777777] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                          title="Delete experience"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-xs sm:text-sm text-[#333333] mt-2 whitespace-pre-line leading-relaxed break-words">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-[#777777] bg-[#FAF9F5] rounded-2xl border border-dashed border-[#E5E0D8] p-6">
                  No work experience or internships added yet. If you have practical projects or club roles, add them here!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Resume & Export Status, Skills, Certifications */}
        <div className="lg:col-span-4 space-y-8">
          {/* =========================================================================
           * SECTION I: RESUME & EXPORT STATUS CARD
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">Active Resume</h3>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#EBF5EE] text-[#1E5631] border border-[#CDE5D2]">
                {activeTemplate.atsScore} ATS
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#777777]">
                <span>Selected Layout:</span>
                <span className="font-semibold text-[#101010]">{activeTemplate.name}</span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Category:</span>
                <span className="font-medium text-[#101010]">
                  {activeTemplate.category === 'ats-first' ? 'ATS-Optimized' : 'Visual First'}
                </span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Paper Size:</span>
                <span className="font-medium text-[#101010]">Standard A4 Portrait</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setIsResumePreviewOpen(true)}
                className="gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview A4 Resume</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting PDF...' : 'Download PDF'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={onNavigateToBuilder}
                className="gap-2 text-[#777777] hover:text-[#101010]"
              >
                <span>Open in Resume Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* =========================================================================
           * SECTION E: SKILLS MANAGEMENT
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">Skills Arsenal</h3>
              </div>
              <span className="text-xs text-[#777777] font-semibold">{totalSkills} Total</span>
            </div>

            {/* Quick Skill Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={skillType}
                  onChange={(e) => setSkillType(e.target.value as 'technical' | 'soft')}
                  className="bg-[#F8F8F6] border border-[#E5E0D8] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#101010] focus:outline-none cursor-pointer"
                >
                  <option value="technical">Technical</option>
                  <option value="soft">Soft Skill</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add skill (e.g. PyTorch)..."
                    className="w-full bg-[#F8F8F6] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-xs text-[#101010] focus:outline-none focus:border-[#101010]"
                  />
                </div>

                <Button variant="primary" size="sm" onClick={handleAddSkill}>
                  Add
                </Button>
              </div>
            </div>

            {/* Technical Skills List */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block">
                Technical ({resumeData.skills?.technical?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resumeData.skills?.technical && resumeData.skills.technical.length > 0 ? (
                  resumeData.skills.technical.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F8F8F6] border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#101010] group"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill, 'technical')}
                        className="text-[#A3A3A3] hover:text-[#101010] cursor-pointer"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#777777] italic">No technical skills added yet.</span>
                )}
              </div>
            </div>

            {/* Soft Skills List */}
            <div className="space-y-2 pt-2 border-t border-[#F0ECE3]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] block">
                Soft Skills ({resumeData.skills?.soft?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resumeData.skills?.soft && resumeData.skills.soft.length > 0 ? (
                  resumeData.skills.soft.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#555555] group"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill, 'soft')}
                        className="text-[#A3A3A3] hover:text-[#101010] cursor-pointer"
                        title={`Remove ${skill}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#777777] italic">No soft skills added yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
           * SECTION H: CERTIFICATIONS & CREDENTIALS
           * ========================================================================= */}
          <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#101010]" />
                <h3 className="font-bold text-sm text-[#101010]">Certifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCertOpen(true)}
                className="text-xs text-[#101010] font-semibold hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {resumeData.certifications && resumeData.certifications.length > 0 ? (
                resumeData.certifications.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-bold text-[#101010] break-words">
                        {c.credentialUrl ? (
                          <a
                            href={toSafeUrl(c.credentialUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-[#101010] inline-flex items-center gap-1"
                          >
                            <span>{c.name}</span>
                            <ExternalLink className="w-3 h-3 text-[#A3A3A3]" />
                          </a>
                        ) : (
                          c.name
                        )}
                      </div>
                      <div className="text-[11px] text-[#777777]">
                        {c.issuer} {c.issueDate && `· ${c.issueDate}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingCert(c)}
                        className="p-1 rounded text-[#777777] hover:text-[#101010] cursor-pointer"
                        title="Edit certification"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateResumeData((prev) => ({
                            ...prev,
                            certifications: (prev.certifications || []).filter(
                              (item) => item.id !== c.id
                            ),
                          }));
                        }}
                        className="p-1 rounded text-[#777777] hover:text-rose-600 cursor-pointer"
                        title="Delete certification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#777777]">
                  No certifications listed. Add courses from Coursera, Google, or AWS!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * MODAL 1: EDIT PROFILE DIALOG
       * ========================================================================= */}
      {isEditProfileOpen && (
        <EditProfileModal
          initialProfile={profile}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleSaveProfileForm}
        />
      )}

      {/* =========================================================================
       * MODAL 2: PHOTO & 3D AVATAR PICKER DIALOG
       * ========================================================================= */}
      {isPhotoPickerOpen && (
        <Dialog
          isOpen={isPhotoPickerOpen}
          onClose={() => setIsPhotoPickerOpen(false)}
          title="Select Profile Avatar or Photo"
          description="Choose a faceless 3D student avatar or upload your own professional resume photo."
        >
          <div className="space-y-6 pt-2">
            {/* 3D Avatars Options */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block mb-3">
                Faceless 3D Clay Avatars
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('boy')}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-pointer ${
                    profile.avatar === 'boy'
                      ? 'bg-white border-[#101010] shadow-sm ring-2 ring-[#101010]'
                      : 'bg-[#F8F8F6] border-[#E5E0D8] hover:border-[#B8B0A2]'
                  }`}
                >
                  <Avatar type="boy" size="xl" bordered={false} className="mb-2" />
                  <span className="text-xs font-bold text-[#101010]">Student (Boy)</span>
                  <span className="text-[10px] text-[#777777]">Monochrome Clay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAvatarType('girl')}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center cursor-pointer ${
                    profile.avatar === 'girl'
                      ? 'bg-white border-[#101010] shadow-sm ring-2 ring-[#101010]'
                      : 'bg-[#F8F8F6] border-[#E5E0D8] hover:border-[#B8B0A2]'
                  }`}
                >
                  <Avatar type="girl" size="xl" bordered={false} className="mb-2" />
                  <span className="text-xs font-bold text-[#101010]">Student (Girl)</span>
                  <span className="text-[10px] text-[#777777]">Monochrome Clay</span>
                </button>
              </div>
            </div>

            {/* Custom Photo Upload */}
            <div className="pt-4 border-t border-[#E5E0D8]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block mb-2">
                Or Upload Custom Resume Photo
              </span>
              <div className="flex items-center gap-4">
                <label className={`flex-1 border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${
                  isUploadingPhoto
                    ? 'border-[#101010] bg-[#FAF9F5] cursor-wait'
                    : 'border-[#DDD5C7] hover:border-[#101010] cursor-pointer'
                }`}>
                  {isUploadingPhoto ? (
                    <div className="flex flex-col items-center justify-center py-1">
                      <Loader2 className="w-5 h-5 mx-auto mb-1 animate-spin text-[#101010]" />
                      <span className="text-xs font-semibold text-[#101010] block">
                        Uploading to Cloudinary...
                      </span>
                      <span className="text-[10px] text-[#777777] block mt-0.5">
                        Please wait
                      </span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mx-auto mb-1 text-[#777777]" />
                      <span className="text-xs font-semibold text-[#101010] block">
                        Choose image file
                      </span>
                      <span className="text-[10px] text-[#A3A3A3] block mt-0.5">
                        JPG, PNG, or WEBP up to 5MB
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                {profile.avatar === 'custom' && profile.avatarUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectAvatarType('boy')}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* =========================================================================
       * MODAL 3: FINAL RESUME PREVIEW MODAL
       * ========================================================================= */}
      {isResumePreviewOpen && (
        <FinalPreviewModal
          data={resumeData}
          isOpen={isResumePreviewOpen}
          onClose={() => setIsResumePreviewOpen(false)}
          onEditSection={() => {
            setIsResumePreviewOpen(false);
            onNavigateToBuilder();
          }}
          onSelectTemplate={(tplId) => {
            onUpdateResumeData((prev) => ({ ...prev, templateId: tplId }));
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 4: ADD / EDIT EDUCATION
       * ========================================================================= */}
      {(isAddEduOpen || editingEducation) && (
        <EducationDialog
          initialData={editingEducation}
          isOpen={isAddEduOpen || Boolean(editingEducation)}
          onClose={() => {
            setIsAddEduOpen(false);
            setEditingEducation(null);
          }}
          onSave={(item) => {
            onUpdateResumeData((prev) => {
              if (editingEducation) {
                return {
                  ...prev,
                  education: prev.education.map((e) => (e.id === item.id ? item : e)),
                };
              }
              return {
                ...prev,
                education: [...prev.education, item],
              };
            });
            setIsAddEduOpen(false);
            setEditingEducation(null);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 5: ADD / EDIT PROJECT
       * ========================================================================= */}
      {(isAddProjectOpen || editingProject) && (
        <ProjectDialog
          initialData={editingProject}
          isOpen={isAddProjectOpen || Boolean(editingProject)}
          onClose={() => {
            setIsAddProjectOpen(false);
            setEditingProject(null);
          }}
          onSave={(item) => {
            onUpdateResumeData((prev) => {
              if (editingProject) {
                return {
                  ...prev,
                  projects: prev.projects.map((p) => (p.id === item.id ? item : p)),
                };
              }
              return {
                ...prev,
                projects: [...prev.projects, item],
              };
            });
            setIsAddProjectOpen(false);
            setEditingProject(null);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 6: ADD / EDIT EXPERIENCE
       * ========================================================================= */}
      {(isAddExpOpen || editingExperience) && (
        <ExperienceDialog
          initialData={editingExperience}
          isOpen={isAddExpOpen || Boolean(editingExperience)}
          onClose={() => {
            setIsAddExpOpen(false);
            setEditingExperience(null);
          }}
          onSave={(item) => {
            onUpdateResumeData((prev) => {
              if (editingExperience) {
                return {
                  ...prev,
                  experience: prev.experience.map((e) => (e.id === item.id ? item : e)),
                };
              }
              return {
                ...prev,
                experience: [...prev.experience, item],
              };
            });
            setIsAddExpOpen(false);
            setEditingExperience(null);
          }}
        />
      )}

      {/* =========================================================================
       * MODAL 7: ADD / EDIT CERTIFICATION
       * ========================================================================= */}
      {(isAddCertOpen || editingCert) && (
        <CertificationDialog
          initialData={editingCert}
          isOpen={isAddCertOpen || Boolean(editingCert)}
          onClose={() => {
            setIsAddCertOpen(false);
            setEditingCert(null);
          }}
          onSave={(item) => {
            onUpdateResumeData((prev) => {
              const currentList = prev.certifications || [];
              if (editingCert) {
                return {
                  ...prev,
                  certifications: currentList.map((c) => (c.id === item.id ? item : c)),
                };
              }
              return {
                ...prev,
                certifications: [...currentList, item],
              };
            });
            setIsAddCertOpen(false);
            setEditingCert(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================================
 * SUB-COMPONENT: EDIT PROFILE MODAL
 * ========================================================================= */
function EditProfileModal({
  initialProfile,
  isOpen,
  onClose,
  onSave,
}: {
  initialProfile: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<StudentProfile>) => void;
}) {
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [email, setEmail] = useState(initialProfile.email);
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [targetRole, setTargetRole] = useState(initialProfile.targetRole || '');
  const [collegeOrUniversity, setCollegeOrUniversity] = useState(
    initialProfile.collegeOrUniversity
  );
  const [major, setMajor] = useState(initialProfile.major);
  const [graduationYear, setGraduationYear] = useState(initialProfile.graduationYear);
  const [gpa, setGpa] = useState(initialProfile.gpa || '');
  const [linkedin, setLinkedin] = useState(initialProfile.socialLinks?.linkedin || '');
  const [github, setGithub] = useState(initialProfile.socialLinks?.github || '');
  const [portfolio, setPortfolio] = useState(initialProfile.socialLinks?.portfolio || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      fullName,
      email,
      phone,
      location,
      targetRole,
      collegeOrUniversity,
      major,
      graduationYear,
      gpa,
      socialLinks: {
        linkedin,
        github,
        portfolio,
      },
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Student Information"
      description="Update your credentials and personal contact details."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Full Name *"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Chennai, Tamil Nadu"
          />
        </div>

        <div className="pt-2 border-t border-[#E5E0D8] grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Professional Title / Target Role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="AI & Data Science Student"
          />
          <Input
            label="College / University *"
            value={collegeOrUniversity}
            onChange={(e) => setCollegeOrUniversity(e.target.value)}
            required
          />
          <Input
            label="Degree & Major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="B.Tech Artificial Intelligence"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Grad Year"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="2028"
            />
            <Input
              label="GPA / Score"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              placeholder="8.5 CGPA"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E0D8] space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#777777] block">
            Online Profiles &amp; Portfolio
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Input
              label="LinkedIn URL"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              label="GitHub URL"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/..."
            />
            <Input
              label="Website / Portfolio"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* =========================================================================
 * SUB-COMPONENT: EDUCATION DIALOG
 * ========================================================================= */
function EducationDialog({
  initialData,
  isOpen,
  onClose,
  onSave,
}: {
  initialData: ResumeEducation | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ResumeEducation) => void;
}) {
  const [institution, setInstitution] = useState(initialData?.institution || '');
  const [degree, setDegree] = useState(initialData?.degree || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [scoreOrGpa, setScoreOrGpa] = useState(initialData?.scoreOrGpa || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || `edu-${Date.now()}`,
      institution,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      scoreOrGpa,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Education' : 'Add Education Record'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Institution / University Name *"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Degree *"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="e.g. B.Tech / High School"
            required
          />
          <Input
            label="Branch / Field of Study"
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.target.value)}
            placeholder="Computer Science"
          />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Input
            label="Start Year"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="2024"
          />
          <Input
            label="End Year"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="2028"
          />
          <Input
            label="Score / CGPA"
            value={scoreOrGpa}
            onChange={(e) => setScoreOrGpa(e.target.value)}
            placeholder="8.5"
          />
        </div>
        <div className="pt-4 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Record
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* =========================================================================
 * SUB-COMPONENT: PROJECT DIALOG
 * ========================================================================= */
function ProjectDialog({
  initialData,
  isOpen,
  onClose,
  onSave,
}: {
  initialData: ResumeProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ResumeProject) => void;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [techStackText, setTechStackText] = useState(
    initialData?.techStack ? initialData.techStack.join(', ') : ''
  );
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || '');
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || initialData?.link || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const techStack = techStackText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: initialData?.id || `proj-${Date.now()}`,
      title,
      description,
      techStack,
      liveUrl,
      repoUrl,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Project' : 'Add Project'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Project Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. ResilientX AI"
          required
        />
        <Input
          label="Technologies Used (comma separated)"
          value={techStackText}
          onChange={(e) => setTechStackText(e.target.value)}
          placeholder="React, TypeScript, Python, Gemini"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you built, key features, and measurable impact..."
          rows={3}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Live Demo URL"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="GitHub Repository URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
        <div className="pt-4 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Project
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* =========================================================================
 * SUB-COMPONENT: EXPERIENCE DIALOG
 * ========================================================================= */
function ExperienceDialog({
  initialData,
  isOpen,
  onClose,
  onSave,
}: {
  initialData: ResumeExperience | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ResumeExperience) => void;
}) {
  const [position, setPosition] = useState(initialData?.position || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || `exp-${Date.now()}`,
      position,
      company,
      location,
      startDate,
      endDate,
      description,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Experience' : 'Add Experience / Internship'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Job / Role Title *"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Software Engineering Intern"
            required
          />
          <Input
            label="Company / Organization *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Paytm / Google"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <Input
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Jun 2026"
          />
          <Input
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Aug 2026 / Present"
          />
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bengaluru"
          />
        </div>
        <Textarea
          label="Responsibilities & Achievements"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your contributions and impact..."
          rows={3}
        />
        <div className="pt-4 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Experience
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* =========================================================================
 * SUB-COMPONENT: CERTIFICATION DIALOG
 * ========================================================================= */
function CertificationDialog({
  initialData,
  isOpen,
  onClose,
  onSave,
}: {
  initialData: ResumeCertification | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ResumeCertification) => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [issuer, setIssuer] = useState(initialData?.issuer || '');
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || '');
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id || `cert-${Date.now()}`,
      name,
      issuer,
      issueDate,
      credentialUrl,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Certification' : 'Add Certification'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Certification Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Google AI Essentials"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Issuer *"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g. Google / Coursera"
            required
          />
          <Input
            label="Issue Date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            placeholder="May 2026"
          />
        </div>
        <Input
          label="Credential URL"
          value={credentialUrl}
          onChange={(e) => setCredentialUrl(e.target.value)}
          placeholder="https://coursera.org/verify/..."
        />
        <div className="pt-4 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Certification
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
