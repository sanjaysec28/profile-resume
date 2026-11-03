/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard | Step 4: Student Profile Context
 * Displays verified Google Account name and email, academic credentials,
 * and allows completing or confirming missing student profile data.
 */

import React from 'react';
import { StudentProfileContext } from '../../../../types/resumeSetup.ts';
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  Building,
  BookOpen,
  Calendar,
  BrainCircuit,
  Award,
} from 'lucide-react';

interface Step4ProfileContextProps {
  context: StudentProfileContext;
  onChange: (updated: StudentProfileContext) => void;
}

export function Step4ProfileContext({
  context,
  onChange,
}: Step4ProfileContextProps) {
  const handleFieldChange = (field: keyof StudentProfileContext, value: string) => {
    onChange({
      ...context,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-xs font-semibold text-[#625D56] uppercase tracking-wider mb-2">
          Step 4 of 5 • Background Context
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight">
          Verify Your Academic & Profile Context
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D56] max-w-2xl">
          Review the profile details synchronized from your authenticated account. Confirm or fill in any missing information so your resume draft accurately reflects your background.
        </p>
      </div>

      {/* Verified Google Account Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {context.photoUrl ? (
            <img
              src={context.photoUrl}
              alt={context.fullName || 'User'}
              className="w-12 h-12 rounded-full border border-[#E0DAD0] object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#171513] text-white flex items-center justify-center font-bold text-lg shrink-0">
              {(context.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-[#171513] truncate">
                {context.fullName || 'Authenticated Student'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Google Verified
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#7A7368] mt-0.5 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{context.email || 'No verified email'}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#7A7368] bg-[#F7F4EE] px-3.5 py-2 rounded-xl border border-[#ECE7DE] max-w-xs">
          Identity verified through Google Firebase Auth. This name and email will be prefilled on your resume.
        </div>
      </div>

      {/* Academic Credentials Form Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E0D8] shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#F0EBE1]">
          <GraduationCap className="w-5 h-5 text-[#171513]" />
          <div>
            <h3 className="text-sm font-bold text-[#171513]">
              Academic & Institutional Information
            </h3>
            <p className="text-xs text-[#7A7368]">
              Ensure your college, major, and graduation year are up-to-date.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* College / University Name */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-[#7A7368]" />
              College / University Name
            </label>
            <input
              type="text"
              value={context.collegeOrUniversity}
              onChange={(e) => handleFieldChange('collegeOrUniversity', e.target.value)}
              placeholder="e.g. Stanford University / Indian Institute of Technology / UC Berkeley"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* Department / Major */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#7A7368]" />
              Department / Major
            </label>
            <input
              type="text"
              value={context.major}
              onChange={(e) => handleFieldChange('major', e.target.value)}
              placeholder="e.g. Computer Science and Engineering"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* Degree */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#7A7368]" />
              Degree
            </label>
            <input
              type="text"
              value={context.degree}
              onChange={(e) => handleFieldChange('degree', e.target.value)}
              placeholder="e.g. Bachelor of Technology (B.Tech) / B.S. / M.S."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#7A7368]" />
              Current Academic Year
            </label>
            <select
              value={context.academicYear}
              onChange={(e) => handleFieldChange('academicYear', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            >
              <option value="1st Year / Freshman">1st Year / Freshman</option>
              <option value="2nd Year / Sophomore">2nd Year / Sophomore</option>
              <option value="3rd Year / Junior">3rd Year / Junior</option>
              <option value="Final Year / 4th Year">Final Year / 4th Year</option>
              <option value="Recent Graduate">Recent Graduate</option>
              <option value="Postgraduate / Masters">Postgraduate / Masters</option>
            </select>
          </div>

          {/* Graduation Year */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#7A7368]" />
              Graduation Year
            </label>
            <input
              type="text"
              value={context.graduationYear}
              onChange={(e) => handleFieldChange('graduationYear', e.target.value)}
              placeholder="e.g. 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* GPA / Score (Optional) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              <BrainCircuit className="w-3.5 h-3.5 text-[#7A7368]" />
              GPA / CGPA (Optional)
            </label>
            <input
              type="text"
              value={context.gpa || ''}
              onChange={(e) => handleFieldChange('gpa', e.target.value)}
              placeholder="e.g. 3.8 / 4.0 or 8.9 / 10"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>

          {/* Location (City, Country) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#171513] uppercase tracking-wider">
              Current Location (Optional)
            </label>
            <input
              type="text"
              value={context.location || ''}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              placeholder="e.g. San Francisco, CA or Bengaluru, India"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
