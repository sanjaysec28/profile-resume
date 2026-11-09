/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.2: Visual Kanban Pipeline & Application Tracking Workspace
 * Drag-and-drop 8-stage Kanban board with responsive stage switcher, genuine metric counters,
 * search/filter/sorting, and application detail workspace.
 */

import React, { useState, useMemo } from 'react';
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
  LayoutGrid,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  Award,
  Bell,
  Eye,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
} from '../../../types/placementIntelligence.ts';
import {
  deleteApplication,
  updateApplicationStatus,
} from '../../../lib/placementIntelligenceService.ts';
import { ApplicationDetailModal } from './ApplicationDetailModal.tsx';

interface ApplicationTrackerWorkspaceProps {
  userId?: string;
  applications: ApplicationRecord[];
  onApplicationsUpdated: (updated: ApplicationRecord[]) => void;
  onOpenAddModal: () => void;
  onEditApplication: (app: ApplicationRecord) => void;
  onOpenAiAssistant?: (jobId?: string) => void;
}

export const KANBAN_STAGES: {
  id: ApplicationStatus;
  label: string;
  colorClass: string;
  badgeBg: string;
  borderClass: string;
}[] = [
  { id: 'saved', label: 'Saved', colorClass: 'text-stone-800', badgeBg: 'bg-stone-200', borderClass: 'border-stone-300' },
  { id: 'preparing', label: 'Preparing', colorClass: 'text-amber-800', badgeBg: 'bg-amber-100', borderClass: 'border-amber-300' },
  { id: 'applied', label: 'Applied', colorClass: 'text-blue-800', badgeBg: 'bg-blue-100', borderClass: 'border-blue-300' },
  { id: 'assessment', label: 'Assessment', colorClass: 'text-indigo-800', badgeBg: 'bg-indigo-100', borderClass: 'border-indigo-300' },
  { id: 'interview', label: 'Interview', colorClass: 'text-purple-800', badgeBg: 'bg-purple-100', borderClass: 'border-purple-300' },
  { id: 'offer', label: 'Offer', colorClass: 'text-emerald-800', badgeBg: 'bg-emerald-100', borderClass: 'border-emerald-300' },
  { id: 'rejected', label: 'Rejected', colorClass: 'text-rose-800', badgeBg: 'bg-rose-100', borderClass: 'border-rose-300' },
  { id: 'withdrawn', label: 'Withdrawn', colorClass: 'text-stone-600', badgeBg: 'bg-stone-100', borderClass: 'border-stone-200' },
];

type SortOption = 'updated-desc' | 'applied-desc' | 'company-asc' | 'match-desc' | 'deadline-asc';

export const ApplicationTrackerWorkspace: React.FC<ApplicationTrackerWorkspaceProps> = ({
  userId,
  applications,
  onApplicationsUpdated,
  onOpenAddModal,
  onEditApplication,
  onOpenAiAssistant,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMobileStage, setSelectedMobileStage] = useState<ApplicationStatus>('applied');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [selectedStageFilter, setSelectedStageFilter] = useState<ApplicationStatus | 'all'>('all');
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ApplicationStatus | null>(null);
  const [detailModalApp, setDetailModalApp] = useState<ApplicationRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics calculated from genuine records
  const metrics = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((a) =>
      ['preparing', 'applied', 'assessment', 'interview'].includes(a.status)
    ).length;
    const interviews = applications.filter((a) => a.status === 'interview').length;
    const offers = applications.filter((a) => a.status === 'offer').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingDeadlines = applications.filter((a) => {
      if (!a.deadline) return false;
      return a.deadline >= todayStr && a.status !== 'offer' && a.status !== 'rejected' && a.status !== 'withdrawn';
    }).length;

    const pendingReminders = applications.reduce((acc, app) => {
      const active = (app.reminders || []).filter((r) => !r.completed).length;
      return acc + active;
    }, 0);

    return {
      total,
      inProgress,
      interviews,
      offers,
      rejected,
      upcomingDeadlines,
      pendingReminders,
    };
  }, [applications]);

  // Filtered & Sorted applications
  const processedApps = useMemo(() => {
    let result = [...applications];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (app) =>
          app.jobTitle.toLowerCase().includes(q) ||
          app.company.toLowerCase().includes(q) ||
          (app.location && app.location.toLowerCase().includes(q)) ||
          (app.notes && app.notes.toLowerCase().includes(q))
      );
    }

    // Filter by stage (in list view)
    if (selectedStageFilter !== 'all') {
      result = result.filter((app) => app.status === selectedStageFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'updated-desc') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'applied-desc') {
        const da = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
        const db = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'company-asc') {
        return a.company.localeCompare(b.company);
      }
      if (sortBy === 'match-desc') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (sortBy === 'deadline-asc') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      return 0;
    });

    return result;
  }, [applications, searchQuery, selectedStageFilter, sortBy]);

  // Group applications by stage for Kanban
  const stageGroups = useMemo(() => {
    const groups: Record<ApplicationStatus, ApplicationRecord[]> = {
      saved: [],
      preparing: [],
      applied: [],
      assessment: [],
      interview: [],
      offer: [],
      rejected: [],
      withdrawn: [],
    };

    processedApps.forEach((app) => {
      if (groups[app.status]) {
        groups[app.status].push(app);
      } else {
        groups.applied.push(app);
      }
    });

    return groups;
  }, [processedApps]);

  // Stage change with optimistic UI update and offline error fallback
  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    const target = applications.find((a) => a.id === appId);
    if (!target || target.status === newStatus) return;

    // Optimistic local update
    const previousApps = [...applications];
    const optimisticUpdated: ApplicationRecord = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onApplicationsUpdated(applications.map((a) => (a.id === appId ? optimisticUpdated : a)));

    try {
      setIsUpdating(true);
      const serverUpdated = await updateApplicationStatus(userId, appId, newStatus, {
        stageNote: `Stage moved to ${newStatus}`,
      });
      if (serverUpdated) {
        onApplicationsUpdated(applications.map((a) => (a.id === appId ? serverUpdated : a)));
        if (detailModalApp && detailModalApp.id === appId) {
          setDetailModalApp(serverUpdated);
        }
        showToast(`Moved "${target.jobTitle}" to ${newStatus.toUpperCase()}`);
      }
    } catch (err) {
      console.warn('Failed to update stage on network, reverting:', err);
      onApplicationsUpdated(previousApps);
      showToast('Network error: reverted stage update.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Move application to next/prev stage
  const handleShiftStage = (app: ApplicationRecord, direction: 'prev' | 'next') => {
    const currentIndex = KANBAN_STAGES.findIndex((s) => s.id === app.status);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < KANBAN_STAGES.length) {
      handleStatusChange(app.id, KANBAN_STAGES[targetIndex].id);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: ApplicationStatus) => {
    if (dragOverStage === stageId) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: ApplicationStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      handleStatusChange(appId, targetStage);
    }
    setDraggedAppId(null);
  };

  // Delete handler
  const handleDelete = async (appId: string) => {
    try {
      await deleteApplication(userId, appId);
      onApplicationsUpdated(applications.filter((a) => a.id !== appId));
      if (detailModalApp && detailModalApp.id === appId) {
        setDetailModalApp(null);
      }
      showToast('Application record deleted.');
    } catch (err) {
      showToast('Failed to delete application.');
    } finally {
      setDeletingId(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-xl shadow-xl animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5E0D8] rounded-full text-xs font-semibold text-[#101010] mb-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Full-Lifecycle Application Pipeline</span>
            </div>
            <h2 className="text-2xl font-bold text-[#101010] tracking-tight">
              Application Tracker & Visual Kanban
            </h2>
            <p className="text-sm text-[#666666] max-w-2xl leading-relaxed">
              Track your journey from preparation to interview and offer. Drag cards between stages, manage in-app reminders, and review historical application snapshots.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Track New Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar (Calculated from genuine records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider block">
            Total Tracked
          </span>
          <div className="text-2xl font-extrabold text-[#101010]">{metrics.total}</div>
          <div className="text-[10px] text-[#666666]">Applications in pipeline</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            In Progress
          </span>
          <div className="text-2xl font-extrabold text-amber-900">{metrics.inProgress}</div>
          <div className="text-[10px] text-[#666666]">Active review stages</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
            Interviews
          </span>
          <div className="text-2xl font-extrabold text-purple-900">{metrics.interviews}</div>
          <div className="text-[10px] text-[#666666]">Rounds scheduled</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Offers
          </span>
          <div className="text-2xl font-extrabold text-emerald-900">{metrics.offers}</div>
          <div className="text-[10px] text-[#666666]">Offers received</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
            Rejected
          </span>
          <div className="text-2xl font-extrabold text-rose-900">{metrics.rejected}</div>
          <div className="text-[10px] text-[#666666]">Archived records</div>
        </div>

        <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl space-y-1 shadow-2xs">
          <span className="text-[10px] font-bold text-[#101010] uppercase tracking-wider block">
            Upcoming Deadlines
          </span>
          <div className="text-2xl font-extrabold text-[#101010]">{metrics.upcomingDeadlines}</div>
          <div className="text-[10px] text-[#666666]">Action due soon</div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search, Sort & Filters */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, role title, location, or private notes..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF9F5] border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#101010] focus:outline-none focus:border-[#101010]"
            />
          </div>

          {/* Controls: Sort and View Mode */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF9F5] px-2.5 py-1.5 border border-[#E8E2D7] rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#888888]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-[#101010] font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="updated-desc">Recently Updated</option>
                <option value="applied-desc">Date Applied</option>
                <option value="deadline-asc">Upcoming Deadline</option>
                <option value="match-desc">Highest Match Score</option>
                <option value="company-asc">Company Name (A–Z)</option>
              </select>
            </div>

            {/* View Mode Toggle: Kanban vs Table List */}
            <div className="flex items-center bg-[#FAF9F5] p-1 border border-[#E8E2D7] rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                    : 'text-[#666666] hover:text-[#101010]'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                    : 'text-[#666666] hover:text-[#101010]'
                }`}
                title="List / Table View"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Stage Selector Tabs (Active only on small screens for Kanban mode) */}
        {viewMode === 'kanban' && (
          <div className="block lg:hidden pt-2 border-t border-[#F0ECE1]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {KANBAN_STAGES.map((st) => {
                const count = stageGroups[st.id].length;
                const isSelected = selectedMobileStage === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedMobileStage(st.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#101010] text-[#F8F5EE] shadow-xs'
                        : 'bg-[#FAF9F5] text-[#666666] hover:text-[#101010]'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#EAE5DC] text-[#666666]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {processedApps.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-xs text-[#888888] space-y-3">
          <Briefcase className="w-8 h-8 text-[#CCCCCC] mx-auto stroke-[1.5]" />
          <div className="font-semibold text-sm text-[#101010]">No application records match your filter</div>
          <p className="max-w-md mx-auto text-[#666666] leading-relaxed">
            {applications.length === 0
              ? 'You have not added any job applications yet. Track discovered openings or record positions applied through campus recruitment or external career portals.'
              : 'Try clearing your search query or switching your stage filter.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-[#101010] text-[#F8F5EE] text-xs font-semibold rounded-xl hover:bg-[#262626] transition-all cursor-pointer"
          >
            Track New Application
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <>
          {/* DESKTOP KANBAN: 8 COLUMNS HORIZONTAL BOARD */}
          <div className="hidden lg:grid grid-cols-8 gap-3 items-start min-h-[550px] overflow-x-auto pb-4">
            {KANBAN_STAGES.map((stage) => {
              const stageApps = stageGroups[stage.id];
              const isOver = dragOverStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`bg-[#FAF9F5] border rounded-2xl p-2.5 flex flex-col min-h-[480px] transition-all ${
                    isOver ? 'border-[#101010] bg-stone-100 ring-2 ring-[#101010]/20' : 'border-[#E5E0D8]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-2 mb-2 bg-white rounded-xl border border-[#EAE5DC] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#101010] truncate">{stage.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${stage.badgeBg} ${stage.colorClass}`}>
                      {stageApps.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] scrollbar-none">
                    {stageApps.length === 0 ? (
                      <div className="h-28 border border-dashed border-[#E5E0D8] rounded-xl flex items-center justify-center p-2 text-center text-[11px] text-[#AAAAAA]">
                        Drop applications here
                      </div>
                    ) : (
                      stageApps.map((app) => {
                        const hasOverdueReminder = (app.reminders || []).some(
                          (r) => !r.completed && r.dueDate < todayStr
                        );
                        const isDraggingThis = draggedAppId === app.id;

                        return (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onClick={() => setDetailModalApp(app)}
                            className={`bg-white border rounded-xl p-3 shadow-2xs hover:shadow-xs hover:border-[#101010]/50 transition-all cursor-grab active:cursor-grabbing space-y-2 group ${
                              isDraggingThis ? 'opacity-40 scale-95' : 'opacity-100'
                            } ${hasOverdueReminder ? 'border-rose-300' : 'border-[#EAE5DC]'}`}
                          >
                            {/* Card Header: Company & Match Badge */}
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="text-[11px] font-bold text-[#101010] truncate">
                                {app.company}
                              </span>
                              {app.matchScore !== undefined && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-[#FAF9F5] border border-[#EAE5DC] rounded font-bold text-[#101010] shrink-0">
                                  {app.matchScore}%
                                </span>
                              )}
                            </div>

                            {/* Job Title */}
                            <h4 className="text-xs font-bold text-[#101010] line-clamp-2 leading-snug">
                              {app.jobTitle}
                            </h4>

                            {/* Key Indicators */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#666666]">
                              {app.deadline && (
                                <span className="text-rose-700 font-semibold truncate">
                                  Due {new Date(app.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {app.interviewDate && (
                                <span className="text-purple-800 font-bold truncate">
                                  Int: {new Date(app.interviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              {hasOverdueReminder && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Overdue Reminder" />
                              )}
                            </div>

                            {/* Shift Stage Quick Buttons */}
                            <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftStage(app, 'prev');
                                }}
                                disabled={stage.id === 'saved'}
                                className="p-1 text-[#888888] hover:text-[#101010] disabled:opacity-20 cursor-pointer"
                                title="Move to previous stage"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailModalApp(app);
                                }}
                                className="text-[10px] font-semibold text-[#666666] hover:text-[#101010] hover:underline"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShiftStage(app, 'next');
                                }}
                                disabled={stage.id === 'withdrawn'}
                                className="p-1 text-[#888888] hover:text-[#101010] disabled:opacity-20 cursor-pointer"
                                title="Advance to next stage"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MOBILE & TABLET KANBAN: STAGE FOCUS VIEW */}
          <div className="block lg:hidden space-y-3">
            <div className="bg-[#FAF9F5] border border-[#E5E0D8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#101010]">
                  {KANBAN_STAGES.find((s) => s.id === selectedMobileStage)?.label} Column ({stageGroups[selectedMobileStage].length})
                </span>
                <span className="text-[11px] text-[#888888]">
                  Tap card to view details
                </span>
              </div>

              {stageGroups[selectedMobileStage].length === 0 ? (
                <div className="p-8 text-center text-xs text-[#888888] bg-white rounded-xl border border-[#EAE5DC]">
                  No applications in this stage.
                </div>
              ) : (
                <div className="space-y-3">
                  {stageGroups[selectedMobileStage].map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setDetailModalApp(app)}
                      className="bg-white border border-[#EAE5DC] rounded-xl p-4 space-y-2 shadow-2xs hover:border-[#101010] transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#101010]">{app.company}</span>
                        {app.matchScore !== undefined && (
                          <span className="text-xs font-extrabold text-[#101010]">
                            {app.matchScore}% Match
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-[#101010]">{app.jobTitle}</h4>

                      {app.notes && (
                        <p className="text-xs text-[#666666] line-clamp-1 italic">
                          "{app.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(app, 'prev');
                            }}
                            disabled={app.status === 'saved'}
                            className="px-2 py-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded text-[11px] font-semibold text-[#101010] disabled:opacity-30"
                          >
                            ← Prev
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftStage(app, 'next');
                            }}
                            disabled={app.status === 'withdrawn'}
                            className="px-2 py-1 bg-[#FAF9F5] border border-[#E5E0D8] rounded text-[11px] font-semibold text-[#101010] disabled:opacity-30"
                          >
                            Next →
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditApplication(app);
                            }}
                            className="p-1.5 text-[#666666] hover:text-[#101010] rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(app.id);
                            }}
                            className="p-1.5 text-[#888888] hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* TABLE / LIST VIEW */
        <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E8E2D7] text-[#666666] uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 pl-5">Role & Company</th>
                  <th className="p-3.5">Stage</th>
                  <th className="p-3.5">Match</th>
                  <th className="p-3.5">Applied Date</th>
                  <th className="p-3.5">Next Action</th>
                  <th className="p-3.5">Resume Version</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE1]">
                {processedApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setDetailModalApp(app)}
                    className="hover:bg-[#FAF9F5] transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-sm text-[#101010]">{app.jobTitle}</div>
                      <div className="text-xs text-[#666666]">{app.company} • {app.location}</div>
                    </td>

                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="px-2.5 py-1 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] focus:outline-none capitalize cursor-pointer"
                      >
                        {KANBAN_STAGES.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3.5">
                      {app.matchScore !== undefined ? (
                        <span className="font-bold text-[#101010]">{app.matchScore}%</span>
                      ) : (
                        <span className="text-[#888888]">—</span>
                      )}
                    </td>

                    <td className="p-3.5 text-[#555555]">
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '—'}
                    </td>

                    <td className="p-3.5 text-[#555555]">
                      {app.nextFollowUpDate ? (
                        <span className="text-amber-900 font-medium">
                          {new Date(app.nextFollowUpDate).toLocaleDateString()}
                        </span>
                      ) : app.interviewDate ? (
                        <span className="text-purple-900 font-bold">
                          Interview: {new Date(app.interviewDate).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="p-3.5 text-[#666666] truncate max-w-[140px]">
                      {app.resumeVersionUsed || 'Default'}
                    </td>

                    <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailModalApp(app)}
                          className="p-1.5 text-[#666666] hover:text-[#101010] rounded-lg hover:bg-stone-100"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditApplication(app)}
                          className="p-1.5 text-[#666666] hover:text-[#101010] rounded-lg hover:bg-stone-100"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {app.jobUrl && (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#666666] hover:text-[#101010] rounded-lg hover:bg-stone-100"
                            title="Job URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingId(app.id)}
                          className="p-1.5 text-[#888888] hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: APPLICATION DETAIL WORKSPACE */}
      {detailModalApp && (
        <ApplicationDetailModal
          userId={userId}
          application={detailModalApp}
          onClose={() => setDetailModalApp(null)}
          onEdit={(app) => {
            setDetailModalApp(null);
            onEditApplication(app);
          }}
          onApplicationUpdated={(updated) => {
            setDetailModalApp(updated);
            onApplicationsUpdated(applications.map((a) => (a.id === updated.id ? updated : a)));
          }}
          onOpenAiAssistant={onOpenAiAssistant}
        />
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-[#101010]">Delete Application Record?</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              This will remove this application and its progression history from your tracker pipeline. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 cursor-pointer shadow-xs"
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
