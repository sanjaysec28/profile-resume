/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Floating Pill Navbar
 * - Floating pill-shaped navigation bar with warm cream/off-white background
 * - Generously rounded corners (rounded-full), subtle border, and soft shadow
 * - Prominent horizontal ProFile logo with natural aspect ratio
 * - Vertically aligned navigation links and user avatar
 * - Compact mobile navbar with polished hamburger toggle and no overflow
 */

import { useState } from 'react';
import { AppView } from '../../types/navigation.ts';
import { Avatar } from '../ui/Avatar.tsx';
import { AvatarType } from '../../types/profile.ts';
import { Logo } from '../ui/Logo.tsx';
import { cn } from '../../lib/utils.ts';
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  CheckCircle2,
  User,
  LogOut,
} from 'lucide-react';

export interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  userAvatar?: AvatarType;
  userName?: string;
  onGetStartedClick?: () => void;
  showAllNav?: boolean;
  onSignOut?: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  userAvatar = 'boy',
  userName = '',
  onGetStartedClick,
  showAllNav = true,
  onSignOut,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 4 Core user-facing navigation items
  const navLinks: { view: AppView; label: string; icon: typeof LayoutDashboard }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'resume-builder', label: 'Resume Builder', icon: FileText },
    { view: 'ats-upload', label: 'ATS Checker', icon: CheckCircle2 },
    { view: 'profile', label: 'My Profile', icon: User },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full px-3 sm:px-6 pointer-events-none select-none">
      <div className="pointer-events-auto max-w-5xl mx-auto">
        {/* Floating Pill Container: White rounded container with subtle shadow */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-full shadow-[0_4px_24px_rgba(16,16,16,0.06),0_1px_3px_rgba(16,16,16,0.03)] px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-6 transition-all duration-200">
          {/* Zone 1: Official Brand Logo on the left */}
          <button
            onClick={() => handleNavClick('dashboard')}
            className="shrink-0 flex items-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] py-1"
            aria-label="ProFile Home"
          >
            <Logo size="md" />
          </button>

          {/* Zone 2: Centered Desktop Pill Navigation Links with fully rounded tabs */}
          {showAllNav && (
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[#F5F2EB] rounded-full border border-[#E8E2D7]">
              {navLinks.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={cn(
                      'px-4 sm:px-4.5 py-2 text-xs lg:text-[13px] font-semibold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer',
                      isActive
                        ? 'bg-[#101010] text-[#F8F5EE] shadow-sm'
                        : 'text-[#666666] hover:text-[#101010] hover:bg-white/80'
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Right Action — User Profile plus Logout icon */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {currentView === 'welcome' ? (
              <button
                onClick={onGetStartedClick || (() => handleNavClick('dashboard'))}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#101010] rounded-full hover:bg-[#252525] transition-colors whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('profile')}
                className={cn(
                  'flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-3.5 rounded-full border transition-all cursor-pointer group shadow-2xs',
                  currentView === 'profile'
                    ? 'bg-[#101010] text-[#F8F5EE] border-[#101010]'
                    : 'bg-[#F8F8F6] hover:bg-white border-[#E5E0D8] text-[#101010]'
                )}
                aria-label="Student profile"
              >
                <Avatar type={userAvatar} size="sm" />
                {userName ? (
                  <span className="hidden sm:inline text-xs font-semibold tracking-tight">
                    {userName.split(' ')[0]}
                  </span>
                ) : null}
              </button>
            )}

            {/* Logout icon */}
            {onSignOut && currentView !== 'welcome' && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-2 sm:p-2.5 rounded-full bg-[#F8F8F6] hover:bg-[#F2ECE0] text-[#777777] hover:text-[#101010] border border-[#E5E0D8] transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Sign out of ProFile"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            {showAllNav && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-full bg-[#F8F8F6] border border-[#E5E0D8] text-[#101010] hover:bg-white transition-colors cursor-pointer shadow-2xs"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu Card */}
        {showAllNav && isMobileMenuOpen && (
          <div className="md:hidden mt-2 p-3 bg-[#F8F8F6]/98 backdrop-blur-xl border border-[#E5E0D8] rounded-3xl shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((item) => {
              const isActive = currentView === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left',
                    isActive
                      ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                      : 'text-[#555555] hover:text-[#101010] hover:bg-white'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-150 cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
