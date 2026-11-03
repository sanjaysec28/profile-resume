/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — AI Resume Setup Wizard | Step 2: Target Role Selection
 * Searchable role categories, curated role pills/cards, and custom role input.
 */

import React, { useState, useMemo } from 'react';
import {
  TargetRole,
  RoleCategoryKey,
  ROLE_CATEGORIES,
  DEFAULT_TARGET_ROLES,
} from '../../../../types/resumeSetup.ts';
import {
  Search,
  Check,
  BrainCircuit,
  Plus,
  Briefcase,
} from 'lucide-react';

interface Step2TargetRoleProps {
  selectedRole: TargetRole;
  onSelectRole: (role: TargetRole) => void;
}

export function Step2TargetRole({
  selectedRole,
  onSelectRole,
}: Step2TargetRoleProps) {
  const [activeCategory, setActiveCategory] = useState<RoleCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    Boolean(selectedRole.isCustom)
  );
  const [customRoleInput, setCustomRoleInput] = useState(
    selectedRole.isCustom ? selectedRole.title : ''
  );

  const filteredRoles = useMemo(() => {
    return DEFAULT_TARGET_ROLES.filter((role) => {
      const matchesCategory =
        activeCategory === 'all' || role.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        role.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelectPredefined = (role: TargetRole) => {
    setIsCustomMode(false);
    onSelectRole(role);
  };

  const handleApplyCustomRole = (value: string) => {
    setCustomRoleInput(value);
    const trimmed = value.trim();
    if (trimmed) {
      setIsCustomMode(true);
      onSelectRole({
        id: `custom-${Date.now()}`,
        title: trimmed,
        category: 'software',
        isCustom: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E2DDD5] text-xs font-semibold text-[#625D56] uppercase tracking-wider mb-2">
          Step 2 of 5 • Role Targeting
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171513] tracking-tight">
          Which role or title are you targeting?
        </h2>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D56] max-w-2xl">
          Pick a specialized title or enter your custom target. This drives role-specific keyword weighting and resume headline generation.
        </p>
      </div>

      {/* Selected Role Badge Callout */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#171513] text-white flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-[#787168] uppercase tracking-wider block">
              Currently Selected Target Role
            </span>
            <span className="text-base sm:text-lg font-bold text-[#171513]">
              {selectedRole.title || 'Select a role below'}
            </span>
          </div>
        </div>
        {selectedRole.isCustom && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF4E5] text-[#8C6D1F] border border-[#EADAB8] w-fit">
            <BrainCircuit className="w-3.5 h-3.5" />
            Custom User Role
          </span>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8A8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles (e.g. Android, Data Analyst, Cloud, UX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCD5C9] bg-white text-sm text-[#171513] placeholder-[#9E9689] focus:outline-none focus:ring-2 focus:ring-[#171513] focus:border-transparent transition-all"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ROLE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#171513] text-white shadow-xs'
                    : 'bg-[#ECE8E0] hover:bg-[#E0DAD0] text-[#625D56]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Predefined Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredRoles.map((role) => {
          const isSelected = !isCustomMode && selectedRole.id === role.id;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => handleSelectPredefined(role)}
              className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171513] ${
                isSelected
                  ? 'bg-white border-[#171513] ring-1 ring-[#171513] shadow-xs'
                  : 'bg-white/80 hover:bg-white border-[#E6E1D8] hover:border-[#D0C9BD]'
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="text-sm font-semibold text-[#171513] block truncate">
                  {role.title}
                </span>
                <span className="text-[11px] text-[#8A8275] capitalize">
                  {role.category.replace('-', ' ')}
                </span>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[#171513] border-[#171513] text-white'
                    : 'border-[#D8D2C5]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Role Input Accordion / Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isCustomMode
            ? 'bg-white border-[#171513] ring-1 ring-[#171513] shadow-sm'
            : 'bg-[#FAF7F2] border-[#E5E0D8]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#171513]" />
            <span className="text-sm font-bold text-[#171513]">
              Need a Custom or Specialized Role?
            </span>
          </div>
          {isCustomMode && (
            <span className="text-xs font-semibold text-[#171513] bg-[#EFECE6] px-2 py-0.5 rounded-md">
              Active Selection
            </span>
          )}
        </div>
        <p className="text-xs text-[#625D56] mb-3">
          Enter any job role (e.g. "Computer Vision Researcher", "Junior DevOps Specialist", "Robotics Firmware Engineer"):
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Type your custom role title..."
            value={customRoleInput}
            onChange={(e) => handleApplyCustomRole(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-[#D5CFC4] bg-white text-sm text-[#171513] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#171513]"
          />
          <button
            type="button"
            onClick={() => handleApplyCustomRole(customRoleInput)}
            disabled={!customRoleInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#171513] text-white text-xs font-semibold hover:bg-[#2A2724] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply Role
          </button>
        </div>
      </div>
    </div>
  );
}
