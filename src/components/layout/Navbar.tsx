/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Top Bar Contract:
 * [Brand title, one line] — [4–5 nav links, 1–2 word labels] — [1 primary action]
 */

import { AppView } from '../../types/navigation.ts';
import { Avatar } from '../ui/Avatar.tsx';
import { AvatarType } from '../../types/profile.ts';
import { cn } from '../../lib/utils.ts';

export interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  userAvatar?: AvatarType;
  userName?: string;
  onGetStartedClick?: () => void;
  showAllNav?: boolean;
}

export function Navbar({
  currentView,
  onNavigate,
  userAvatar = 'boy',
  userName = 'Alex Chen',
  onGetStartedClick,
  showAllNav = true,
}: NavbarProps) {
  const navLinks: { view: AppView; label: string }[] = [
    { view: 'dashboard', label: 'Dashboard' },
    { view: 'resume-builder', label: 'Resume Builder' },
    { view: 'ats-upload', label: 'ATS Checker' },
    { view: 'profile', label: 'My Profile' },
    { view: 'design-system', label: 'Design Tokens' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F5EE]/90 backdrop-blur-md border-b border-[#E5E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-xl sm:text-2xl font-bold tracking-tight text-[#101010] whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer text-left"
          aria-label="ProFile Home"
        >
          <div className="w-8 h-8 rounded-xl bg-[#101010] flex items-center justify-center text-[#F8F5EE] font-extrabold text-sm shadow-xs">
            P
          </div>
          <span className="font-semibold tracking-tight">ProFile</span>
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        {showAllNav && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={cn(
                    'transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2',
                    isActive
                      ? 'text-[#101010] border-[#101010] font-semibold'
                      : 'text-[#777777] border-transparent hover:text-[#101010]'
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentView === 'welcome' ? (
            <button
              onClick={onGetStartedClick || (() => onNavigate('dashboard'))}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#101010] rounded-xl hover:bg-[#242424] transition-colors whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2.5 p-1 rounded-full hover:ring-1 hover:ring-[#E5E0D8] transition-all cursor-pointer group"
              aria-label="Student profile"
            >
              <Avatar type={userAvatar} size="sm" />
              <span className="hidden sm:inline text-xs font-medium text-[#101010] group-hover:text-[#242424]">
                {userName.split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
