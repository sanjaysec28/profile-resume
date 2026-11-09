/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Student Quick Setup & Onboarding Form (Compact Single-Screen Card)
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { StudentProfile, AvatarType } from '../../types/profile';
import { UserProfileDocument } from '../../lib/userService';
import { Logo } from '../ui/Logo';
import { CheckCircle2, User as UserIcon, GraduationCap, Calendar, Sparkles, LogOut } from 'lucide-react';

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
  const fullNameParts = (userProfile?.displayName || profile.fullName || user?.displayName || '').trim().split(/\s+/);
  const initialFirstName = fullNameParts[0] || '';
  const initialLastName = fullNameParts.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [gender, setGender] = useState<'Male' | 'Female'>(
    profile.avatar === 'girl' ? 'Female' : 'Male'
  );
  const [collegeName, setCollegeName] = useState(profile.collegeOrUniversity || userProfile?.collegeOrUniversity || '');
  const [academicYear, setAcademicYear] = useState(profile.graduationYear || userProfile?.graduationYear || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Onboarding Diagnostics] 1. CONTINUE_CLICKED');
    setError(null);

    console.log('[Onboarding Diagnostics] 2. VALIDATION_STARTED');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first and last name.');
      return;
    }
    if (!collegeName.trim()) {
      setError('Please enter your college name.');
      return;
    }
    if (!academicYear || academicYear === '') {
      setError('Please select your academic year.');
      return;
    }
    console.log('[Onboarding Diagnostics] 3. VALIDATION_PASSED');

    console.log('[Onboarding Diagnostics] 4. AUTH_USER_CHECKED: uid=', user?.uid);
    if (!user) {
      setError('User is not authenticated. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const full = `${firstName.trim()} ${lastName.trim()}`;
      const avatarType: AvatarType = gender === 'Female' ? 'girl' : 'boy';

      const updated: StudentProfile = {
        ...profile,
        fullName: full,
        email: user?.email || profile.email,
        collegeOrUniversity: collegeName.trim(),
        graduationYear: academicYear,
        avatar: avatarType,
        avatarUrl: user?.photoURL || profile.avatarUrl,
      };

      console.log('[Onboarding Diagnostics] 5. FIRESTORE_WRITE_STARTED');
      await onComplete(updated);
      console.log('[Onboarding Diagnostics] 6. FIRESTORE_WRITE_SUCCEEDED');
    } catch (err: any) {
      console.error('[StudentQuickSetup] Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4ED] text-[#101010] flex flex-col justify-between selection:bg-[#101010] selection:text-[#F8F5EE] animate-page-enter">
      {/* Top brand header */}
      <header className="w-full max-w-4xl mx-auto px-6 pt-6 flex items-center justify-between">
        <Logo size="md" />
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#777777] hover:text-[#101010] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
      </header>

      {/* Main Single-Screen Centered Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[500px] bg-white rounded-[24px] sm:rounded-[28px] border border-[#E5E0D8] shadow-xl p-6 sm:p-8 relative overflow-hidden">
          
          {/* Decorative small soft circular bubble in upper-right corner */}
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#FAF5EC] border border-[#EFE9DE] pointer-events-none opacity-80" />

          {/* Heading & Supporting Text */}
          <div className="mb-6 relative z-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5EC] border border-[#E5E0D8] text-[#8C6D1F] text-[11px] font-semibold mb-2">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Welcome to ProFile</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#101010]">
              Set up your profile
            </h1>
            <p className="text-xs sm:text-sm text-[#777777] mt-1">
              Just a few details to personalize your ProFile experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* First Name & Last Name (Side by side on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625D56] mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sanjay"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625D56] mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                />
              </div>
            </div>

            {/* Gender Selection (Two equal-width selectable options) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625D56] mb-1.5">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    gender === 'Male'
                      ? 'border-[#101010] bg-[#FAF5EC] text-[#101010] shadow-2xs ring-1 ring-[#101010]'
                      : 'border-[#E5E0D8] bg-[#F9F8F5] text-[#555555] hover:border-[#D1C9BE]'
                  }`}
                >
                  <span>Male</span>
                  {gender === 'Male' && <CheckCircle2 className="w-4 h-4 text-[#101010]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    gender === 'Female'
                      ? 'border-[#101010] bg-[#FAF5EC] text-[#101010] shadow-2xs ring-1 ring-[#101010]'
                      : 'border-[#E5E0D8] bg-[#F9F8F5] text-[#555555] hover:border-[#D1C9BE]'
                  }`}
                >
                  <span>Female</span>
                  {gender === 'Female' && <CheckCircle2 className="w-4 h-4 text-[#101010]" />}
                </button>
              </div>
            </div>

            {/* College Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625D56] mb-1">
                College Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. Saveetha Engineering College"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                />
              </div>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#625D56] mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F9F8F5] border border-[#E5E0D8] text-[#101010] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#101010]"
                >
                  <option value="" disabled>Select academic year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                {error}
              </div>
            )}

            {/* Full-width Continue Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#101010] hover:bg-[#252525] text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Saving profile...</span>
                ) : (
                  <span>Continue to Dashboard</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="py-4 text-center text-[11px] text-[#888888]">
        ProFile Career Intelligence Platform &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
