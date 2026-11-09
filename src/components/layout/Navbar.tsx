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

import { useState, useRef, useEffect } from 'react';
import { AppView } from '../../types/navigation.ts';
import { AvatarType } from '../../types/profile.ts';
import { Logo } from '../ui/Logo.tsx';
import { cn } from '../../lib/utils.ts';
import {
  Menu,
  X,
  FileText,
  CheckCircle2,
  User,
  LogOut,
  Compass,
  Mic,
  Briefcase,
  ChevronDown,
} from 'lucide-react';

export interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  userAvatar?: AvatarType;
  userName?: string;
  userPhotoUrl?: string | null;
  user?: any;
  onGetStartedClick?: () => void;
  showAllNav?: boolean;
  onSignOut?: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  userName = '',
  userPhotoUrl,
  user,
  onGetStartedClick,
  showAllNav = true,
  onSignOut,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Core user-facing navigation items (Dashboard and My Profile removed)
  const navLinks: { view: AppView; label: string; icon: typeof FileText }[] = [
    { view: 'resume-builder', label: 'Resume Builder', icon: FileText },
    { view: 'career-intelligence', label: 'Career Roadmap', icon: Compass },
    { view: 'interview-prep', label: 'Interview Prep', icon: Mic },
    { view: 'placement-intelligence', label: 'Jobs & Placements', icon: Briefcase },
    { view: 'ats-upload', label: 'ATS Checker', icon: CheckCircle2 },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  const fullName = userName || user?.displayName || 'Student';
  const displayName = fullName.trim().split(/\s+/)[0] || 'User';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();
  const userPhoto = userPhotoUrl || user?.photoURL;

  return (
    <header className="sticky top-2 sm:top-4 z-40 w-full px-3 sm:px-6 pointer-events-none select-none">
      <div className="pointer-events-auto max-w-6xl mx-auto">
        {/* Floating Pill Container: White rounded container with subtle shadow */}
        <div className="bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-full shadow-[0_4px_24px_rgba(16,16,16,0.06),0_1px_3px_rgba(16,16,16,0.03)] px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-4 transition-all duration-200">
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
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 p-1 bg-[#F5F2EB] rounded-full border border-[#E8E2D7]">
              {navLinks.map((item) => {
                const isActive =
                  item.view === 'resume-builder'
                    ? currentView === 'resume-builder' ||
                      currentView === 'resume-setup' ||
                      currentView === 'resume-recommendations'
                    : currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={cn(
                      'px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer',
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

          {/* Zone 3: Right Action — Profile Dropdown Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentView === 'welcome' ? (
              <button
                onClick={onGetStartedClick || (() => handleNavClick('resume-builder'))}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#101010] rounded-full hover:bg-[#252525] transition-colors whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
              >
                Get Started
              </button>
            ) : (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#101010] text-white border border-[#2A2A2A] hover:bg-[#252525] transition-all active:scale-95 cursor-pointer shadow-xs shrink-0 select-none',
                    currentView === 'profile' && 'ring-2 ring-[#101010] ring-offset-2 ring-offset-[#F8F5EE]'
                  )}
                  aria-label={`User account menu for ${fullName}`}
                  aria-expanded={isAccountMenuOpen}
                  title={`${fullName} — Account & Profile`}
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={fullName}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[#333333]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#2A2A2A] text-white flex items-center justify-center font-bold text-xs">
                      {initial}
                    </div>
                  )}

                  <span className="text-xs sm:text-sm font-medium tracking-tight max-w-[110px] truncate">
                    {displayName}
                  </span>

                  <ChevronDown className={cn("w-3.5 h-3.5 text-[#AAAAAA] transition-transform duration-200", isAccountMenuOpen && "rotate-180")} />
                </button>

                {/* Compact Popover Account Menu */}
                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E0D8] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-2 border-b border-[#F0ECE3] mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">Signed In As</p>
                      <p className="text-xs font-semibold text-[#101010] truncate">{user?.email || userName || fullName}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        handleNavClick('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#101010] hover:bg-[#FAF9F5] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#777777]" />
                      <span>My Profile</span>
                    </button>

                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer border-t border-[#F0ECE3] mt-1 pt-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            {showAllNav && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full bg-[#F8F8F6] border border-[#E5E0D8] text-[#101010] hover:bg-white transition-colors cursor-pointer shadow-2xs"
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
          <div className="lg:hidden mt-2 p-3 bg-[#F8F8F6]/98 backdrop-blur-xl border border-[#E5E0D8] rounded-3xl shadow-xl space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((item) => {
              const isActive =
                item.view === 'resume-builder'
                  ? currentView === 'resume-builder' ||
                    currentView === 'resume-setup' ||
                    currentView === 'resume-recommendations'
                  : currentView === item.view;
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
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-150 cursor-pointer text-left border-t border-[#E8E2D7] pt-2"
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
