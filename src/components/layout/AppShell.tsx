/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Navbar } from './Navbar.tsx';
import { AppView } from '../../types/navigation.ts';
import { AvatarType } from '../../types/profile.ts';
import { SocialFooter } from './SocialFooter.tsx';

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
  userName = '',
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

      <SocialFooter />
    </div>
  );
}
