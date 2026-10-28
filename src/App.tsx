/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase 1: Project Foundation & Design System
 * Interactive showcase and foundation for the student-focused Resume Builder & ATS Checker.
 */

import { useState } from 'react';
import { AppShell } from './components/layout/AppShell.tsx';
import { Container } from './components/layout/Container.tsx';
import { PageHeader } from './components/layout/PageHeader.tsx';
import { FeatureCard } from './components/cards/FeatureCard.tsx';
import { ProfileCard } from './components/cards/ProfileCard.tsx';
import {
  BuildResumeIllustration,
  AtsCheckerIllustration,
  MyProfileIllustration,
} from './components/illustrations/index.ts';
import { Button } from './components/ui/Button.tsx';
import { Input } from './components/ui/Input.tsx';
import { Textarea } from './components/ui/Textarea.tsx';
import { Select } from './components/ui/Select.tsx';
import { Card } from './components/ui/Card.tsx';
import { Dialog } from './components/ui/Dialog.tsx';
import { Badge } from './components/ui/Badge.tsx';
import { Avatar } from './components/ui/Avatar.tsx';
import { AppView } from './types/navigation.ts';
import { StudentProfile, AvatarType } from './types/profile.ts';
import { INITIAL_STUDENT_PROFILE, DASHBOARD_CARDS } from './lib/constants.ts';
import { colors, typography, spacing, radii } from './styles/tokens.ts';
import { ArrowRight, CheckCircle2, Sparkles, Layers, Sliders, ShieldCheck } from 'lucide-react';

import { WelcomePage } from './components/welcome/WelcomePage.tsx';
import { SignInPage } from './components/auth/SignInPage.tsx';
import { ResumeBuilder } from './features/resume/index.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'tokens' | 'components'>('preview');

  // Handle avatar toggle
  const handleAvatarSelect = (avatar: AvatarType) => {
    setProfile((prev) => ({ ...prev, avatar }));
  };

  // Welcome Screen: Matches the reference image exactly (centered intro.png, warm cream/off-white background, black Get Started -> button)
  if (currentView === 'welcome') {
    return <WelcomePage onGetStarted={() => setCurrentView('signin')} />;
  }

  // Google Sign-In Screen: Matches reference image (warm cream #F7F4ED, two-column on desktop, white rounded button, large /image/login.png)
  if (currentView === 'signin') {
    return (
      <SignInPage
        onBackToWelcome={() => setCurrentView('welcome')}
        onContinueToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  // Dedicated 3-Panel Resume Builder: Matches the 8-panel reference image exactly
  if (currentView === 'resume-builder') {
    return (
      <ResumeBuilder
        onBackToDashboard={() => setCurrentView('dashboard')}
        studentName={profile.fullName.split(' ')[0]}
      />
    );
  }

  return (
    <AppShell
      currentView={currentView}
      onNavigate={(view) => setCurrentView(view)}
      userAvatar={profile.avatar}
      userName={profile.fullName}
    >
      <Container size="lg" className="py-8 sm:py-12">
        {/* Navigation / Mode banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#F8F8F6] p-2.5 rounded-2xl border border-[#E5E0D8]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setActiveTab('preview');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'dashboard' && activeTab === 'preview'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              Student Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('profile');
                setActiveTab('preview');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'profile'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              My Profile & 3D Avatars
            </button>
            <button
              onClick={() => {
                setCurrentView('design-system');
                setActiveTab('tokens');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'design-system' && activeTab === 'tokens'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              Color Palette & Tokens
            </button>
            <button
              onClick={() => {
                setCurrentView('design-system');
                setActiveTab('components');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                currentView === 'design-system' && activeTab === 'components'
                  ? 'bg-[#101010] text-[#F8F5EE] shadow-2xs'
                  : 'text-[#777777] hover:text-[#101010]'
              }`}
            >
              Shared UI Components
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('signin')}
              className="text-xs text-[#777777] hover:text-[#101010] px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white transition-colors cursor-pointer"
            >
              Sign In Page
            </button>
            <button
              onClick={() => setCurrentView('welcome')}
              className="text-xs text-[#777777] hover:text-[#101010] px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-white transition-colors cursor-pointer"
            >
              Welcome Page
            </button>
          </div>
        </div>

        {/* VIEW 1: STUDENT DASHBOARD (Permanent UI/UX Rules: exactly three prominent clickable image cards, no sidebar) */}
        {currentView === 'dashboard' && activeTab === 'preview' && (
          <div>
            {/* Header Banner Card */}
            <div className="relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F7F4ED] shadow-sm mb-8 sm:mb-10">
              <img
                src="/image/headercard.png"
                alt="Welcome to ProFile"
                className="w-full h-auto object-cover"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.indexOf('/images/headercard.png') === -1) {
                    target.src = '/images/headercard.png';
                  }
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14 max-w-[60%] sm:max-w-[55%]">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] mb-1 sm:mb-2">
                  <span>{profile.collegeOrUniversity}</span>
                  <span>·</span>
                  <span>Class of {profile.graduationYear}</span>
                </div>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#101010] leading-tight">
                  Welcome back, {profile.fullName.split(' ')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-[#777777] mt-1 sm:mt-2 hidden sm:block leading-relaxed">
                  Ready to prepare for internship season? Build your resume, test your ATS score, or update your profile.
                </p>
              </div>
            </div>

            {/* Exactly THREE prominent clickable image cards (Build Resume, ATS Checker, My Profile) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
              {/* Card 1: Build Resume */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCurrentView('resume-builder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentView('resume-builder');
                  }
                }}
                className="group relative aspect-square w-full rounded-[26px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F8F8F6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#101010]"
                aria-label="Build Resume"
              >
                <img
                  src="/image/build.png"
                  alt="Build Resume"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.indexOf('/images/build.png') === -1) {
                      target.src = '/images/build.png';
                    }
                  }}
                />
              </div>

              {/* Card 2: ATS Checker */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCurrentView('ats-upload')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentView('ats-upload');
                  }
                }}
                className="group relative aspect-square w-full rounded-[26px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F8F8F6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#101010]"
                aria-label="ATS Checker"
              >
                <img
                  src="/image/ats.png"
                  alt="ATS Checker"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.indexOf('/images/ats.png') === -1) {
                      target.src = '/images/ats.png';
                    }
                  }}
                />
              </div>

              {/* Card 3: My Profile */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCurrentView('profile')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentView('profile');
                  }
                }}
                className="group relative aspect-square w-full rounded-[26px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F8F8F6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#101010]"
                aria-label="My Profile"
              >
                <img
                  src="/image/pro.png"
                  alt="My Profile"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.indexOf('/images/pro.png') === -1) {
                      target.src = '/images/pro.png';
                    }
                  }}
                />
              </div>
            </div>

            {/* Bottom Career Banner Card */}
            <div className="mt-8 sm:mt-10 relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#3A3A3A] bg-[#101010] shadow-md">
              <img
                src="/image/downcard.png"
                alt="Your Career Journey Starts Here"
                className="w-full h-auto object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.indexOf('/images/downcard.png') === -1) {
                    target.src = '/images/downcard.png';
                  }
                }}
              />
            </div>

            {/* Student Quick Summary Strip */}
            <div className="mt-10 p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar type={profile.avatar} size="md" />
                <div>
                  <h4 className="text-sm font-semibold text-[#101010]">
                    Active 3D Avatar: {profile.avatar === 'boy' ? 'Student (Boy)' : 'Student (Girl)'}
                  </h4>
                  <p className="text-xs text-[#777777]">
                    Faceless monochrome clay aesthetic · Fully responsive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentView('profile')}
                >
                  Change Avatar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentView('resume-builder')}
                >
                  Create New Resume
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MY PROFILE (Avatar Customizer & Student Details) */}
        {currentView === 'profile' && (
          <div>
            <PageHeader
              title="My Student Profile"
              description="Customize your faceless 3D student avatar and manage your education credentials."
              kicker="Profile & Avatars"
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  Edit Information
                </Button>
              }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ProfileCard
                  profile={profile}
                  onAvatarSelect={handleAvatarSelect}
                  onEditClick={() => setIsEditDialogOpen(true)}
                />

                {/* Additional student credentials card */}
                <div className="mt-6 p-6 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8]">
                  <h3 className="text-base font-bold text-[#101010] mb-4">
                    Student Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#A3A3A3] block">Target Role</span>
                      <span className="font-medium text-[#101010] mt-0.5 block">
                        {profile.targetRole || 'Software Engineering Intern'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block">GPA</span>
                      <span className="font-medium text-[#101010] mt-0.5 block">
                        {profile.gpa || '3.88 / 4.0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block">Email</span>
                      <span className="font-medium text-[#101010] mt-0.5 block">
                        {profile.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A3A3A3] block">Location</span>
                      <span className="font-medium text-[#101010] mt-0.5 block">
                        {profile.location || 'San Francisco, CA'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar info */}
              <div className="flex flex-col gap-6">
                <Card variant="white" padding="md" rounded="2xl">
                  <h4 className="text-sm font-semibold text-[#101010] mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#101010]" />
                    Design Rule Compliance
                  </h4>
                  <ul className="text-xs text-[#777777] space-y-2 leading-relaxed">
                    <li>• Faceless 3D avatars in smooth monochrome clay</li>
                    <li>• Neutral warm cream studio background</li>
                    <li>• Clean unboxed student metadata</li>
                    <li>• Zero colorful badges or pills</li>
                  </ul>
                </Card>

                <Card variant="cream" padding="md" rounded="2xl">
                  <h4 className="text-sm font-semibold text-[#101010] mb-2">
                    Quick Navigation
                  </h4>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => setCurrentView('dashboard')}
                    >
                      Back to Dashboard
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => setCurrentView('resume-builder')}
                    >
                      Start Resume Builder
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DESIGN TOKENS CATALOG */}
        {((currentView === 'design-system' && activeTab === 'tokens') || false) && (
          <div>
            <PageHeader
              title="Centralized Design Tokens"
              description="Locked color system, typography scale, spacing, border radii, and elevation tokens."
              kicker="Design System System Architecture"
            />

            {/* 1. Locked Color System Showcase */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-[#101010] mb-4">
                1. Locked Color System
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-[#F8F5EE]">
                  <div className="h-16 rounded-xl border border-[#E5E0D8] mb-3 bg-[#F8F5EE]" />
                  <div className="text-xs font-semibold text-[#101010]">Cream White</div>
                  <div className="text-[11px] text-[#777777]">{colors.creamBg}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Primary background</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-[#F8F8F6]">
                  <div className="h-16 rounded-xl border border-[#E5E0D8] mb-3 bg-[#F8F8F6]" />
                  <div className="text-xs font-semibold text-[#101010]">Off-White</div>
                  <div className="text-[11px] text-[#777777]">{colors.surfaceOffWhite}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Main surface / cards</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-white">
                  <div className="h-16 rounded-xl border border-[#E5E0D8] mb-3 bg-white" />
                  <div className="text-xs font-semibold text-[#101010]">Pure White</div>
                  <div className="text-[11px] text-[#777777]">{colors.pureWhite}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Input highlights</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#3A3A3A] bg-[#101010] text-white">
                  <div className="h-16 rounded-xl border border-[#3A3A3A] mb-3 bg-[#101010]" />
                  <div className="text-xs font-semibold text-white">Obsidian Black</div>
                  <div className="text-[11px] text-[#A3A3A3]">{colors.obsidian}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Primary text & CTAs</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#3A3A3A] bg-[#242424] text-white">
                  <div className="h-16 rounded-xl border border-[#3A3A3A] mb-3 bg-[#242424]" />
                  <div className="text-xs font-semibold text-white">Charcoal</div>
                  <div className="text-[11px] text-[#A3A3A3]">{colors.charcoal}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Secondary dark surface</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#3A3A3A] bg-[#1C1C1C] text-white">
                  <div className="h-16 rounded-xl border border-[#3A3A3A] mb-3 bg-[#1C1C1C]" />
                  <div className="text-xs font-semibold text-white">Dark Elevated</div>
                  <div className="text-[11px] text-[#A3A3A3]">{colors.darkElevated}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Elevated containers</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-white">
                  <div className="h-16 rounded-xl mb-3 bg-[#777777]" />
                  <div className="text-xs font-semibold text-[#101010]">Ash Grey</div>
                  <div className="text-[11px] text-[#777777]">{colors.textSecondary}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Secondary text</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-white">
                  <div className="h-16 rounded-xl mb-3 bg-[#A3A3A3]" />
                  <div className="text-xs font-semibold text-[#101010]">Muted Text</div>
                  <div className="text-[11px] text-[#777777]">{colors.textMuted}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Subtle metadata</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#E5E0D8] bg-white">
                  <div className="h-16 rounded-xl mb-3 bg-[#E5E0D8]" />
                  <div className="text-xs font-semibold text-[#101010]">Soft Ash Border</div>
                  <div className="text-[11px] text-[#777777]">{colors.borderSoft}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Card boundaries</div>
                </div>

                <div className="p-4 rounded-2xl border border-[#3A3A3A] bg-[#242424] text-white">
                  <div className="h-16 rounded-xl mb-3 bg-[#3A3A3A]" />
                  <div className="text-xs font-semibold text-white">Dark Border</div>
                  <div className="text-[11px] text-[#A3A3A3]">{colors.borderDark}</div>
                  <div className="text-[10px] text-[#A3A3A3] mt-1">Dark boundaries</div>
                </div>
              </div>
            </div>

            {/* 2. Typography Scale */}
            <div className="mb-12">
              <h3 className="text-lg font-bold text-[#101010] mb-4">
                2. Typography Scale (Inter Clean Sans)
              </h3>
              <div className="p-6 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-6">
                <div>
                  <span className="text-xs text-[#A3A3A3] font-mono block">5xl · 48px · Display Headline</span>
                  <p className="text-4xl sm:text-5xl font-bold text-[#101010] tracking-tight">
                    Craft Your Future
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#A3A3A3] font-mono block">3xl · 30px · Section Heading</span>
                  <p className="text-2xl sm:text-3xl font-bold text-[#101010] tracking-tight">
                    ATS-Optimized Resumes
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#A3A3A3] font-mono block">xl · 20px · Card Title</span>
                  <p className="text-xl font-semibold text-[#101010] tracking-tight">
                    Live A4 Preview & Intelligent Keyword Scoring
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#A3A3A3] font-mono block">base · 16px · Body Prose</span>
                  <p className="text-base text-[#101010] leading-relaxed max-w-2xl">
                    ProFile provides undergraduate students with clean, high-parse-rate templates
                    tailored for tech, finance, and engineering internship applications.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#A3A3A3] font-mono block">xs · 12px · Secondary Metadata</span>
                  <p className="text-xs text-[#777777]">
                    Stanford University · Class of 2027 · Software Engineering Intern
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Spacing, Radii & Shadows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8]">
                <h4 className="text-sm font-bold text-[#101010] mb-3">Border Radii Scale</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-3 bg-white border border-[#E5E0D8] rounded-md text-xs">
                    sm (8px)
                  </div>
                  <div className="p-3 bg-white border border-[#E5E0D8] rounded-xl text-xs">
                    md (12px)
                  </div>
                  <div className="p-3 bg-white border border-[#E5E0D8] rounded-2xl text-xs">
                    lg (16px)
                  </div>
                  <div className="p-3 bg-white border border-[#E5E0D8] rounded-[24px] text-xs">
                    2xl (24px)
                  </div>
                  <div className="p-3 bg-white border border-[#E5E0D8] rounded-[32px] text-xs">
                    3xl (32px)
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8]">
                <h4 className="text-sm font-bold text-[#101010] mb-3">Spatial Scale</h4>
                <div className="text-xs text-[#777777] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Mobile Container Padding:</span>
                    <span className="font-mono text-[#101010]">{spacing.containerPaddingMobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desktop Container Padding:</span>
                    <span className="font-mono text-[#101010]">{spacing.containerPaddingDesktop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card Padding Desktop:</span>
                    <span className="font-mono text-[#101010]">{spacing.cardPaddingDesktop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Touch Target Minimum:</span>
                    <span className="font-mono text-[#101010]">44px (h-11)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SHARED UI COMPONENTS SHOWCASE */}
        {((currentView === 'design-system' && activeTab === 'components') || false) && (
          <div>
            <PageHeader
              title="Reusable UI Components"
              description="Buttons, inputs, textareas, selects, cards, badges, and modals built with the locked monochrome system."
              kicker="Component Library"
            />

            {/* Buttons Showcase */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8] mb-8">
              <h3 className="text-base font-bold text-[#101010] mb-4">
                Button Sizes & Variants
              </h3>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Button variant="primary" size="lg">
                  Primary Large
                </Button>
                <Button variant="primary" size="md">
                  Primary Medium
                </Button>
                <Button variant="primary" size="sm">
                  Primary Small
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Off-White
                </Button>
                <Button variant="outline" size="md">
                  Outline
                </Button>
                <Button variant="ghost" size="md">
                  Ghost
                </Button>
                <Button variant="dark" size="md">
                  Dark Charcoal
                </Button>
                <Button variant="primary" size="md" isLoading>
                  Loading
                </Button>
              </div>
            </div>

            {/* Form Controls */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8] mb-8">
              <h3 className="text-base font-bold text-[#101010] mb-4">
                Form Inputs & Selection Controls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                <Input
                  label="Student Full Name"
                  placeholder="e.g. Alex Chen"
                  defaultValue="Alex Chen"
                />
                <Input
                  label="University Email"
                  placeholder="alex.chen@stanford.edu"
                  type="email"
                  defaultValue="alex.chen@stanford.edu"
                />
                <Select
                  label="Graduation Year"
                  defaultValue="2027"
                  options={[
                    { value: '2025', label: 'Class of 2025' },
                    { value: '2026', label: 'Class of 2026' },
                    { value: '2027', label: 'Class of 2027 (Undergraduate)' },
                    { value: '2028', label: 'Class of 2028' },
                  ]}
                />
                <Input
                  label="Target Career Track"
                  placeholder="e.g. Machine Learning Engineer"
                  defaultValue="Software Engineering Intern"
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Student Bio / Summary"
                    rows={3}
                    defaultValue="First-year undergraduate building modern web applications, distributed systems, and intuitive user tools."
                  />
                </div>
              </div>
            </div>

            {/* Badges & Unboxed Metadata */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8]">
              <h3 className="text-base font-bold text-[#101010] mb-2">
                Metadata & State Indicators (Anti-Pill Compliant)
              </h3>
              <p className="text-xs text-[#777777] mb-4">
                No candy pill badges. Uses clean unboxed text with typographic separators or subtle rounded rectangles.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-[#777777]">
                  <span className="font-medium text-[#101010]">Stanford University</span>
                  <span>·</span>
                  <span>Computer Science</span>
                  <span>·</span>
                  <span>GPA 3.88</span>
                </div>
                <Badge variant="subtle">Subtle Tag</Badge>
                <Badge variant="dark">Dark Tag</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
          </div>
        )}

        {/* FUTURE ARCHITECTURE STUBS: ATS checker placeholder preview */}
        {currentView === 'ats-upload' && (
          <div className="text-center py-16 sm:py-20 px-4">
            <div className="max-w-xl mx-auto p-8 sm:p-10 rounded-3xl bg-[#F8F8F6] border border-[#E5E0D8]">
              <div className="w-14 h-14 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold text-[#101010]">
                ATS Document Scanner &amp; Analysis
              </h2>

              <p className="text-sm text-[#777777] mt-3 leading-relaxed">
                Phase 1 project foundation and design tokens are established.
                This screen architecture is ready for page-by-page implementation in upcoming phases.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => setCurrentView('dashboard')}
                >
                  Return to Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentView('design-system')}
                >
                  Inspect Design Tokens
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Edit Profile Modal Dialog */}
      <Dialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Edit Student Information"
        description="Update your academic credentials and personal details."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Full Name"
            value={profile.fullName}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
          <Input
            label="College / University"
            value={profile.collegeOrUniversity}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                collegeOrUniversity: e.target.value,
              }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Major"
              value={profile.major}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, major: e.target.value }))
              }
            />
            <Input
              label="Graduation Year"
              value={profile.graduationYear}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  graduationYear: e.target.value,
                }))
              }
            />
          </div>
          <Input
            label="Target Role"
            value={profile.targetRole}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, targetRole: e.target.value }))
            }
          />
        </div>
      </Dialog>
    </AppShell>
  );
}
