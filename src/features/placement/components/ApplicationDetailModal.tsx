/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.6.2: Comprehensive Application Detail Workspace
 * Deep-dive workspace for an individual tracked application, preserving historical snapshots,
 * interactive timeline history, recruiter contact details, and in-app reminders.
 */

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Edit2,
  Calendar,
  Clock,
  Briefcase,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Plus,
  Trash2,
  Bell,
  Award,
  ShieldCheck,
  CheckSquare,
  Square,
  ArrowRight,
  PenLine,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
  ApplicationReminder,
} from '../../../types/placementIntelligence.ts';
import {
  updateApplicationStatus,
  addApplicationReminder,
  toggleApplicationReminder,
  deleteApplicationReminder,
} from '../../../lib/placementIntelligenceService.ts';

interface ApplicationDetailModalProps {
  userId?: string;
  application: ApplicationRecord | null;
  onClose: () => void;
  onEdit: (app: ApplicationRecord) => void;
  onApplicationUpdated: (updated: ApplicationRecord) => void;
  onOpenAiAssistant?: (jobId?: string) => void;
}

const STAGES: { id: ApplicationStatus; label: string }[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'applied', label: 'Applied' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'withdrawn', label: 'Withdrawn' },
];

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  userId,
  application,
  onClose,
  onEdit,
  onApplicationUpdated,
  onOpenAiAssistant,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'reminders' | 'checklist'>('overview');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderType, setNewReminderType] = useState<ApplicationReminder['type']>('followup');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  if (!application) return null;

  const handleStageChange = async (newStage: ApplicationStatus) => {
    if (newStage === application.status) return;
    const updated = await updateApplicationStatus(userId, application.id, newStage, {
      stageNote: `Advanced to ${newStage}`,
    });
    if (updated) {
      onApplicationUpdated(updated);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate) return;

    const updated = await addApplicationReminder(userId, application.id, {
      title: newReminderTitle.trim(),
      dueDate: newReminderDate,
      type: newReminderType,
      completed: false,
    });

    if (updated) {
      onApplicationUpdated(updated);
      setNewReminderTitle('');
      setNewReminderDate('');
      setIsAddingReminder(false);
    }
  };

  const handleToggleReminder = async (remId: string) => {
    const updated = await toggleApplicationReminder(userId, application.id, remId);
    if (updated) onApplicationUpdated(updated);
  };

  const handleDeleteReminder = async (remId: string) => {
    const updated = await deleteApplicationReminder(userId, application.id, remId);
    if (updated) onApplicationUpdated(updated);
  };

  const handleAddQuickNote = async () => {
    if (!quickNote.trim()) return;
    const combinedNotes = application.notes
      ? `${application.notes}\n[${new Date().toLocaleDateString()}]: ${quickNote.trim()}`
      : `[${new Date().toLocaleDateString()}]: ${quickNote.trim()}`;

    const updated = await updateApplicationStatus(userId, application.id, application.status, {
      notes: combinedNotes,
      stageNote: `Added note: "${quickNote.trim()}"`,
    });

    if (updated) {
      onApplicationUpdated(updated);
      setQuickNote('');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8E2D7] bg-[#FAF9F5] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#101010]">{application.company}</span>
              {application.location && (
                <span className="text-xs text-[#888888]">• {application.location}</span>
              )}
              <span className="capitalize text-[11px] px-2 py-0.2 bg-white border border-[#E5E0D8] rounded text-[#666666] font-medium">
                {application.workEnvironment}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#101010] leading-snug">
              {application.jobTitle}
            </h2>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#666666]">
              <span>Source: <strong>{application.sourceName}</strong></span>
              {application.appliedDate && (
                <>
                  <span>•</span>
                  <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                </>
              )}
              {application.deadline && (
                <>
                  <span>•</span>
                  <span className="text-rose-700 font-semibold">
                    Deadline: {new Date(application.deadline).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(application)}
              className="p-2 text-[#666666] hover:text-[#101010] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              title="Edit Application Information"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {application.jobUrl && (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[#666666] hover:text-[#101010] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                title="Open Official Job URL"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#888888] hover:text-[#101010] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Stepper Banner */}
        <div className="px-5 py-3 bg-white border-b border-[#E8E2D7] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {STAGES.map((st) => {
              const isCurrent = application.status === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => handleStageChange(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                      : 'bg-[#FAF9F5] text-[#666666] hover:text-[#101010] hover:bg-[#EAE5DC]'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-2 border-b border-[#E8E2D7] bg-white flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'overview', label: 'Overview & Details', icon: Briefcase },
            { id: 'timeline', label: `Timeline (${application.timeline?.length || 1})`, icon: Clock },
            { id: 'reminders', label: `Reminders (${application.reminders?.length || 0})`, icon: Bell },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#101010] text-[#101010]'
                    : 'border-transparent text-[#666666] hover:text-[#101010]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Match & Eligibility Banner */}
              {(application.matchScore !== undefined || application.eligibilityStatus) && (
                <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {application.matchScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#101010]" />
                        <span className="font-bold text-[#101010] text-sm">
                          {application.matchScore}% Match
                        </span>
                      </div>
                    )}
                    {application.eligibilityStatus && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          application.eligibilityStatus === 'appears-eligible'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : application.eligibilityStatus === 'potentially-eligible'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {application.eligibilityStatus.replace('-', ' ')}
                      </span>
                    )}
                  </div>

                  {onOpenAiAssistant && application.jobId && (
                    <button
                      type="button"
                      onClick={() => onOpenAiAssistant(application.jobId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#101010] hover:bg-stone-50 cursor-pointer shadow-2xs"
                    >
                      <PenLine className="w-3.5 h-3.5 text-amber-500" />
                      <span>Open AI Application Assistant</span>
                    </button>
                  )}
                </div>
              )}

              {/* Key Dates & Snapshot Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider block">
                    Applied Date
                  </span>
                  <span className="text-xs font-semibold text-[#101010]">
                    {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'Not recorded'}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider block">
                    Next Follow-up
                  </span>
                  <span className="text-xs font-semibold text-amber-900">
                    {application.nextFollowUpDate ? new Date(application.nextFollowUpDate).toLocaleDateString() : 'None scheduled'}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider block">
                    Assessment Date
                  </span>
                  <span className="text-xs font-semibold text-indigo-900">
                    {application.assessmentDate ? new Date(application.assessmentDate).toLocaleDateString() : 'None scheduled'}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-0.5">
                  <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider block">
                    Interview Date
                  </span>
                  <span className="text-xs font-semibold text-purple-900">
                    {application.interviewDate ? new Date(application.interviewDate).toLocaleDateString() : 'None scheduled'}
                  </span>
                </div>
              </div>

              {/* Recruiter / Contact Card */}
              {application.recruiterContact && (application.recruiterContact.name || application.recruiterContact.email) && (
                <div className="p-4 bg-white border border-[#EAE5DC] rounded-xl space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#101010]" />
                    <span>Recruiter / Point of Contact</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {application.recruiterContact.name && (
                      <div>
                        <span className="text-[#888888] block text-[10px]">Name</span>
                        <strong className="text-[#101010]">{application.recruiterContact.name}</strong>
                      </div>
                    )}
                    {application.recruiterContact.role && (
                      <div>
                        <span className="text-[#888888] block text-[10px]">Role / Title</span>
                        <span className="text-[#444444]">{application.recruiterContact.role}</span>
                      </div>
                    )}
                    {application.recruiterContact.email && (
                      <div>
                        <span className="text-[#888888] block text-[10px]">Email</span>
                        <a href={`mailto:${application.recruiterContact.email}`} className="text-[#101010] underline">
                          {application.recruiterContact.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resume Version Reference */}
              <div className="p-3 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl flex items-center justify-between text-xs">
                <span>
                  <strong>Applied Resume Version: </strong>
                  {application.resumeVersionUsed || 'Default ProFile Resume'}
                </span>
                <span className="text-[11px] text-[#888888]">
                  Preserved in record
                </span>
              </div>

              {/* Notes & Quick Note Entry */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Private Notes & Next Actions
                  </span>
                </div>

                {application.notes ? (
                  <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs sm:text-sm text-[#222222] whitespace-pre-line leading-relaxed">
                    {application.notes}
                  </div>
                ) : (
                  <p className="text-xs text-[#888888] italic">No notes recorded yet.</p>
                )}

                {/* Add Quick Note input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Add a progress note (e.g. Sent follow-up email to recruiter)..."
                    className="flex-1 px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#101010] focus:outline-none focus:border-[#101010]"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickNote}
                    disabled={!quickNote.trim()}
                    className="px-4 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Preserved Job Description Snapshot */}
              {application.jobDescriptionSnapshot && (
                <div className="space-y-2 pt-2 border-t border-[#E8E2D7]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    Preserved Job Description Snapshot
                  </span>
                  <div className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl text-xs text-[#444444] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {application.jobDescriptionSnapshot}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICATION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                Application Progression History
              </span>

              {(!application.timeline || application.timeline.length === 0) ? (
                <div className="p-8 text-center text-xs text-[#888888] bg-[#FAF9F5] rounded-xl border border-[#EAE5DC]">
                  No stage transitions recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-[#E5E0D8] space-y-6">
                  {application.timeline.map((event, idx) => (
                    <div key={idx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#101010] border-2 border-white shadow-2xs" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-[#101010] text-[#F8F5EE] rounded">
                            {event.stage}
                          </span>
                          <span className="text-[11px] text-[#888888]">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-xs text-[#444444] leading-relaxed pt-0.5">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMINDERS & FOLLOW-UP MANAGEMENT */}
          {activeTab === 'reminders' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                    In-App Reminders & Schedules
                  </span>
                  <div className="text-[11px] text-[#888888]">
                    Deadlines, technical assessments, interviews, and follow-ups.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingReminder(!isAddingReminder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#101010] text-[#F8F5EE] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingReminder ? 'Cancel' : 'Add Reminder'}</span>
                </button>
              </div>

              {/* Add Reminder Form */}
              {isAddingReminder && (
                <form onSubmit={handleAddReminder} className="p-4 bg-[#FAF9F5] border border-[#EAE5DC] rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-wider mb-1">
                        Reminder Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newReminderTitle}
                        onChange={(e) => setNewReminderTitle(e.target.value)}
                        placeholder="e.g. Submit Take-Home Assessment, Follow up with Recruiter"
                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#101010] focus:outline-none focus:border-[#101010]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-wider mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={newReminderDate}
                        onChange={(e) => setNewReminderDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#101010] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#666666] font-medium">Type:</label>
                      <select
                        value={newReminderType}
                        onChange={(e) => setNewReminderType(e.target.value as any)}
                        className="px-2.5 py-1 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#101010] focus:outline-none capitalize"
                      >
                        <option value="deadline">Deadline</option>
                        <option value="assessment">Assessment</option>
                        <option value="interview">Interview</option>
                        <option value="followup">Follow-up</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#101010] text-[#F8F5EE] rounded-lg text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
                    >
                      Save Reminder
                    </button>
                  </div>
                </form>
              )}

              {/* Reminders List */}
              {(!application.reminders || application.reminders.length === 0) ? (
                <div className="p-8 text-center text-xs text-[#888888] bg-[#FAF9F5] rounded-xl border border-[#EAE5DC]">
                  No reminders set for this application.
                </div>
              ) : (
                <div className="space-y-2">
                  {application.reminders.map((rem) => {
                    const isOverdue = !rem.completed && rem.dueDate < todayStr;
                    const isDueToday = !rem.completed && rem.dueDate === todayStr;

                    return (
                      <div
                        key={rem.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                          rem.completed
                            ? 'bg-stone-50 border-stone-200 opacity-60'
                            : isOverdue
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : isDueToday
                            ? 'bg-amber-50 border-amber-200 text-amber-950'
                            : 'bg-white border-[#E5E0D8]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(rem.id)}
                            className="cursor-pointer text-[#101010]"
                          >
                            {rem.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-[#888888]" />
                            )}
                          </button>
                          <div>
                            <span className={`font-semibold ${rem.completed ? 'line-through text-[#888888]' : 'text-[#101010]'}`}>
                              {rem.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#666666] mt-0.5">
                              <span className="capitalize px-1.5 py-0.2 bg-[#FAF9F5] border border-[#E8E2D7] rounded text-[10px]">
                                {rem.type}
                              </span>
                              <span>Due: {new Date(rem.dueDate).toLocaleDateString()}</span>
                              {isOverdue && (
                                <span className="text-rose-700 font-bold uppercase text-[9px]">
                                  Overdue
                                </span>
                              )}
                              {isDueToday && (
                                <span className="text-amber-800 font-bold uppercase text-[9px]">
                                  Due Today
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1.5 text-[#888888] hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Delete Reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E8E2D7] bg-white flex items-center justify-between">
          <span className="text-[11px] text-[#888888]">
            ProFile Application Pipeline • Safe Offline Persistence
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#101010] text-[#F8F5EE] rounded-xl text-xs font-semibold hover:bg-[#262626] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
