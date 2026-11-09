/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Student Quick Setup & Onboarding Form
 * Polished onboarding card inspired by admission-form references:
 * - Rounded white form card with spacious vertical layout
 * - Prepopulated first and last name from Google account
 * - Gender-based mascot selection (Boy / Girl using approved WebP assets)
 * - College, academic year, course, and target role inputs
 * - Firestore persistence and seamless navigation to dashboard
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { StudentProfile, AvatarType } from '../../types/profile';
import { UserProfileDocument } from '../../lib/userService';
import { Logo } from '../ui/Logo';
import { FadeImage } from '../ui/FadeImage';
import { GraduationCap, User as UserIcon, BookOpen, Target, Sparkles, LogOut, CheckCircle2 } from 'lucide-react';

interface StudentQuickSetupPageProps {
  user: User | null;
  userProfile: UserProfileDocument | null;
  profile: StudentProfile;
  onComplete: (updated: StudentProfile) => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
}

export function StudentQuickSetupPage({
  user,
  userProfile,
  profile,
  onComplete,
  onSignOut,
}: StudentQuickSetupPageProps) {
  // Split initial full name into first and last name
  const fullNameParts = (userProfile?.displayName || profile.fullName || user?.displayName || '').trim().split(/\s+/);
  const initialFirstName = fullNameParts[0] || '';
  const initialLastName = fullNameParts.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatar, setAvatar] = useState<AvatarType>(profile.avatar === 'girl' ? 'girl' : 'boy');
  const [college, setCollege] = useState(profile.collegeOrUniversity || userProfile?.collegeOrUniversity || '');
  const [academicYear, setAcademicYear] = useState(profile.graduationYear || userProfile?.graduationYear || 'Junior / 3rd Year');
  const [major, setMajor] = useState(profile.major || userProfile?.major || '');
  const [targetRole, setTargetRole] = useState(profile.targetRole || userProfile?.targetRole || 'Software Engineer');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }
    if (!college.trim()) {
      setError('Please enter your college or university name.');
      return;
    }
    if (!major.trim()) {
      setError('Please enter your course or department (e.g., Computer Science).');
      return;
    }

    setIsSubmitting(true);
    try {
      const full = `${firstName.trim()} ${lastName.trim()}`;
      const updated: StudentProfile = {
        ...profile,
        fullName: full,
        email: user?.email || profile.email,
        collegeOrUniversity: college.trim(),
        major: major.trim(),
        graduationYear: academicYear,
        targetRole: targetRole.trim(),
        avatar: avatar,
        avatarUrl: user?.photoURL || profile.avatarUrl,
      };

      await onComplete(updated);
    } catch (err: any) {
      console.error('[StudentQuickSetup] Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4ED] text-[#101010] flex flex-col justify-between selection:bg-[#101010] selection:text-[#F8F5EE] animate-page-enter">
      {/* Top brand header */}
      <header className="w-full max-w-5xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        <Logo size="md" />
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#777777] hover:text-[#101010] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        )}
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-2xl bg-white rounded-[28px] border border-[#E5E0D8] shadow-xl p-8 sm:p-12 relative overflow-hidden">
          
          {/* Decorative corner ambient bubble */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#FAF5EC] border border-[#EFE9DE] pointer-events-none opacity-80" />

          {/* Heading */}
          <div className="mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5EC] border border-[#E5E0D8] text-[#8C6D1F] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Student Onboarding</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#101010]">
              Complete Your Student Profile
            </h1>
            <p className="text-sm text-[#625D56] mt-1.5">
              Welcome to ProFile! Let's set up your academic profile to tailor your resume, ATS checks, and career roadmap.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* First and Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Chen"
                  className="w-full px-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                />
              </div>
            </div>

            {/* Mascot / Avatar Selection (Boy vs Girl) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-2">
                Choose Your Avatar Mascot <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Boy Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAvatar('boy')}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAvatar('boy')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    avatar === 'boy'
                      ? 'border-[#101010] bg-[#FAF5EC] shadow-md ring-2 ring-[#101010]/10'
                      : 'border-[#E5E0D8] bg-[#F9F8F5] hover:border-[#D1C9BE]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E5E0D8] shadow-xs">
                    <FadeImage
                      src="/images/boy-card.webp"
                      fallbackSrc="/images/boy-card.webp"
                      alt="Boy Mascot"
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-[#101010]">Mascot A</div>
                    <div className="text-[11px] text-[#777777]">Male student profile</div>
                  </div>
                  {avatar === 'boy' && <CheckCircle2 className="w-5 h-5 text-[#101010] shrink-0" />}
                </div>

                {/* Girl Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setAvatar('girl')}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAvatar('girl')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    avatar === 'girl'
                      ? 'border-[#101010] bg-[#FAF5EC] shadow-md ring-2 ring-[#101010]/10'
                      : 'border-[#E5E0D8] bg-[#F9F8F5] hover:border-[#D1C9BE]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0 border border-[#E5E0D8] shadow-xs">
                    <FadeImage
                      src="/images/girl-card.webp"
                      fallbackSrc="/images/girl-card.webp"
                      alt="Girl Mascot"
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-bold text-[#101010]">Mascot B</div>
                    <div className="text-[11px] text-[#777777]">Female student profile</div>
                  </div>
                  {avatar === 'girl' && <CheckCircle2 className="w-5 h-5 text-[#101010] shrink-0" />}
                </div>
              </div>
            </div>

            {/* College or University */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                College or University <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford University, MIT, UC Berkeley"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                />
              </div>
            </div>

            {/* Academic Year and Course / Major */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                  Academic Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                >
                  <option value="Freshman / 1st Year">Freshman / 1st Year</option>
                  <option value="Sophomore / 2nd Year">Sophomore / 2nd Year</option>
                  <option value="Junior / 3rd Year">Junior / 3rd Year</option>
                  <option value="Senior / 4th Year">Senior / 4th Year</option>
                  <option value="Graduate / Master's">Graduate / Master's</option>
                  <option value="PhD Candidate">PhD Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                  Course / Major <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                  />
                </div>
              </div>
            </div>

            {/* Target Career Role */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                Target Career Role <span className="text-xs font-normal text-[#888888]">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#999999]">
                  <Target className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer, AI/ML Researcher, Full Stack Developer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-[#101010] hover:bg-[#252525] text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Saving your profile...</span>
                ) : (
                  <span>Complete Setup &amp; Continue to Dashboard</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-6 text-center text-xs text-[#888888]">
        ProFile Career Intelligence Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
