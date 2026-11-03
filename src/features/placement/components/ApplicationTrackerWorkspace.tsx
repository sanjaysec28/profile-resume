/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 7: Application Tracker Workspace
 * 8-stage application pipeline tracker supporting status transitions, follow-ups, and notes.
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  ExternalLink,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../../../types/placementIntelligence.ts';
import { deleteApplication, updateApplicationStatus } from '../../../lib/placementIntelligenceService.ts';

interface ApplicationTrackerWorkspaceProps {
  userId?: string;
  applications: ApplicationRecord[];
  onApplicationsUpdated: (updated: ApplicationRecord[]) => void;
  onOpenAddModal: () => void;
  onEditApplication: (app: ApplicationRecord) => void;
}

const ALL_STATUSES: { id: ApplicationStatus; label: string; badgeColor: string }[] = [
  { id: 'saved', label: 'Saved', badgeColor: 'bg-stone-100 text-stone-800' },
  { id: 'preparing', label: 'Preparing', badgeColor: 'bg-amber-100 text-amber-800' },
  { id: 'applied', label: 'Applied', badgeColor: 'bg-blue-100 text-blue-800' },
  { id: 'assessment', label: 'Assessment', badgeColor: 'bg-indigo-100 text-indigo-800' },
  { id: 'interview', label: 'Interview', badgeColor: 'bg-purple-100 text-purple-800' },
  { id: 'offer', label: 'Offer', badgeColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'rejected', label: 'Rejected', badgeColor: 'bg-rose-100 text-rose-800' },
  { id: 'withdrawn', label: 'Withdrawn', badgeColor: 'bg-stone-200 text-stone-700' },
];

export const ApplicationTrackerWorkspace: React.FC<ApplicationTrackerWorkspaceProps> = ({
  userId,
  applications,
  onApplicationsUpdated,
  onOpenAddModal,
  onEditApplication,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ApplicationStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredApps = applications.filter((app) => {
    if (selectedFilter !== 'all' && app.status !== selectedFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        app.jobTitle.toLowerCase().includes(q) ||
        app.company.toLowerCase().includes(q) ||
        (app.notes && app.notes.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    const updated = await updateApplicationStatus(userId, appId, newStatus);
    if (updated) {
      onApplicationsUpdated(applications.map((a) => (a.id === appId ? updated : a)));
    }
  };

  const handleDelete = async (appId: string) => {
    await deleteApplication(userId, appId);
    onApplicationsUpdated(applications.filter((a) => a.id !== appId));
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Full-Lifecycle Application Tracker</span>
            </div>
            <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
              Application Pipeline Management
            </h2>
            <p className="text-sm text-[#666666] mt-1 max-w-xl leading-relaxed">
              Track application progression across all 8 stages from preparation to interview and offer.
              Keep private notes, next follow-up dates, and interview schedules in one secure place.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Track New Application</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracked applications by title, company, or personal notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                : 'bg-[#FAF9F5] text-[#666666] hover:text-[#101010]'
            }`}
          >
            All Stages ({applications.length})
          </button>

          {ALL_STATUSES.map((st) => {
            const count = applications.filter((a) => a.status === st.id).length;
            const isSelected = selectedFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                    : 'bg-[#FAF9F5] text-[#666666] hover:text-[#101010]'
                }`}
              >
                {st.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-xs text-[#888888] space-y-3">
          <Briefcase className="w-8 h-8 text-[#CCCCCC] mx-auto stroke-[1.5]" />
          <div className="font-semibold text-sm text-[#101010]">No applications in this stage</div>
          <p className="max-w-md mx-auto text-[#666666] leading-relaxed">
            {applications.length === 0
              ? 'You have not added any job applications yet. Track discovered openings or manually record positions applied through LinkedIn or employer portals.'
              : 'No applications match the current filter selection.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-lg hover:bg-[#262626] transition-all cursor-pointer"
          >
            Add Application
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-[#E5E0D8] rounded-xl p-5 hover:border-[#101010]/40 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#101010]">{app.company}</span>
                  <span className="text-[11px] text-[#888888]">• {app.location}</span>
                  <span className="capitalize text-[11px] px-2 py-0.2 bg-[#FAF9F5] rounded text-[#666666] font-medium">
                    {app.workEnvironment}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#101010] leading-snug">
                  {app.jobTitle}
                </h4>

                {app.notes && (
                  <p className="text-xs text-[#666666] line-clamp-1 italic">
                    "{app.notes}"
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#888888] pt-1">
                  {app.appliedDate && (
                    <span>Applied: {new Date(app.appliedDate).toLocaleDateString()}</span>
                  )}
                  {app.nextFollowUpDate && (
                    <span className="text-amber-800 font-medium">
                      Next Follow-up: {new Date(app.nextFollowUpDate).toLocaleDateString()}
                    </span>
                  )}
                  {app.interviewDate && (
                    <span className="text-purple-800 font-bold">
                      Interview: {new Date(app.interviewDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Selector & Actions */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  className="px-3 py-1.5 bg-[#FAF9F5] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] focus:outline-none capitalize cursor-pointer"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onEditApplication(app)}
                  className="p-1.5 text-[#666666] hover:text-[#101010] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Edit Application"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {app.jobUrl && (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#666666] hover:text-[#101010] rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Open Job URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setDeletingId(app.id)}
                  className="p-1.5 text-[#888888] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-[#101010]">Delete Application Record?</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              This will remove this application from your tracker pipeline. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
