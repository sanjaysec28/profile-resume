/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './Navbar.tsx';
import { AppView } from '../../types/navigation.ts';
import { AvatarType } from '../../types/profile.ts';
import { Logo } from '../ui/Logo.tsx';

export interface AppShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
  userAvatar?: AvatarType;
  userName?: string;
  showNavbar?: boolean;
  onSignOut?: () => void;
}

export function AppShell({
  currentView,
  onNavigate,
  children,
  userAvatar = 'boy',
  userName = 'Sanjay Kumar',
  showNavbar = true,
  onSignOut,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#101010] flex flex-col font-sans">
      {showNavbar && (
        <Navbar
          currentView={currentView}
          onNavigate={onNavigate}
          userAvatar={userAvatar}
          userName={userName}
          showAllNav={currentView !== 'welcome'}
          onSignOut={onSignOut}
        />
      )}

      <main className="flex-1 flex flex-col">{children}</main>

      <footer className="w-full border-t border-[#E5E0D8]/60 bg-[#F8F5EE] py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#777777]">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[#A3A3A3]">·</span>
            <span>Student Resume Builder &amp; ATS Checker</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="hover:text-[#101010] transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('resume-builder')}
              className="hover:text-[#101010] transition-colors cursor-pointer"
            >
              Resume Builder
            </button>
            <button
              onClick={() => onNavigate('ats-upload')}
              className="hover:text-[#101010] transition-colors cursor-pointer"
            >
              ATS Checker
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="hover:text-[#101010] transition-colors cursor-pointer"
            >
              My Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
