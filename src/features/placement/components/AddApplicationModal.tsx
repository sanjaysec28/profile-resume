/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Add / Edit Application Record Modal
 * Allows students to manually track applications found on external platforms or career fairs.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Building,
  Calendar,
  Globe,
  MapPin,
  Save,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
  WorkEnvironment,
  JobType,
} from '../../../types/placementIntelligence.ts';
import { saveApplication } from '../../../lib/placementIntelligenceService.ts';

interface AddApplicationModalProps {
  userId?: string;
  initialData?: ApplicationRecord | null;
  onClose: () => void;
  onSaved: (savedRecord: ApplicationRecord) => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  userId,
  initialData,
  onClose,
  onSaved,
}) => {
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [location, setLocation] = useState(initialData?.location || 'Remote / Hybrid');
  const [workEnvironment, setWorkEnvironment] = useState<WorkEnvironment>(
    initialData?.workEnvironment || 'remote'
  );
  const [jobType, setJobType] = useState<JobType>(initialData?.jobType || 'full-time');
  const [jobUrl, setJobUrl] = useState(initialData?.jobUrl || '');
  const [sourceName, setSourceName] = useState(initialData?.sourceName || 'LinkedIn');
  const [status, setStatus] = useState<ApplicationStatus>(initialData?.status || 'applied');
  const [appliedDate, setAppliedDate] = useState(
    initialData?.appliedDate || new Date().toISOString().split('T')[0]
  );
  const [deadline, setDeadline] = useState(initialData?.deadline || '');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(initialData?.nextFollowUpDate || '');
  const [interviewDate, setInterviewDate] = useState(initialData?.interviewDate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) return;

    const record: ApplicationRecord = {
      id: initialData?.id || `app_${Date.now()}`,
      userId,
      jobId: initialData?.jobId,
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      location: location.trim(),
      workEnvironment,
      jobType,
      jobUrl: jobUrl.trim(),
      sourceName: sourceName.trim() || 'Manual Entry',
      appliedDate: appliedDate || undefined,
      deadline: deadline || undefined,
      status,
      notes: notes.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      interviewDate: interviewDate || undefined,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveApplication(userId, record);
    onSaved(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E8E2D7] bg-[#FAF9F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#101010]" />
            <h3 className="text-base font-bold text-[#101010]">
              {initialData ? 'Edit Tracked Application' : 'Track New Application'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#101010] rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Graduate Software Engineer"
                className="w-full px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Company *
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp, Microsoft"
                className="w-full px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Work Environment
              </label>
              <select
                value={workEnvironment}
                onChange={(e) => setWorkEnvironment(e.target.value as WorkEnvironment)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#101010] focus:outline-none"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Employment Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#101010] focus:outline-none"
              >
                <option value="full-time">Full-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Stage / Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#101010] focus:outline-none capitalize"
              >
                <option value="saved">Saved</option>
                <option value="preparing">Preparing</option>
                <option value="applied">Applied</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, Bangalore, New York"
                className="w-full px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Source
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. LinkedIn, Campus Placement, Direct"
                className="w-full px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
              Job URL / Application Link
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://company.com/careers/job-123"
              className="w-full px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Date Applied
              </label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Next Follow-up
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
                Interview Date
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#666666] uppercase tracking-wider mb-1">
              Private Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Applied via referral from alum; submitted resume v2; technical screening scheduled for Thursday..."
              className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010] resize-y"
            />
          </div>

          <div className="pt-4 border-t border-[#E8E2D7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#666666] hover:bg-[#FAF9F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!jobTitle.trim() || !company.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Record' : 'Save Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
