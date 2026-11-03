/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Student-Focused Resume Builder & ATS Checker
 * Phase 11: Real Firebase Authentication + Cloud Firestore User Profile + Cloudinary Integration
 */

import { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell.tsx';
import { PageHeader } from './components/layout/PageHeader.tsx';
import { Button } from './components/ui/Button.tsx';
import { FadeImage } from './components/ui/FadeImage.tsx';
import { LoadingScreen } from './components/ui/LoadingScreen.tsx';
import { AppView } from './types/navigation.ts';
import { StudentProfile } from './types/profile.ts';
import { ResumeData } from './types/resume.ts';
import { INITIAL_STUDENT_PROFILE } from './lib/constants.ts';
import { INITIAL_RESUME_DATA } from './features/resume/constants.ts';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { mapUserDocToStudentProfile } from './lib/userService.ts';
import {
  Upload,
  CheckCircle2,
  Brain,
  Mic,
  Briefcase,
} from 'lucide-react';

import { WelcomePage } from './components/welcome/WelcomePage.tsx';
import { SignInPage } from './components/auth/SignInPage.tsx';
import { ResumeBuilder, ResumeSetupWizard, RecommendationsDashboard } from './features/resume/index.ts';
import { ResumeSetupData } from './types/resumeSetup.ts';
import { getActiveResumeSetup, createInitialResumeSetup } from './lib/resumeSetupService.ts';
import { MyProfilePage } from './components/profile/MyProfilePage.tsx';
import { AtsCheckerWorkspace } from './features/ats/components/AtsCheckerWorkspace.tsx';
import { CareerIntelligenceWorkspace } from './features/career/index.ts';
import { InterviewIntelligenceWorkspace } from './features/interview/index.ts';
import { PlacementIntelligenceWorkspace } from './features/placement/index.ts';

import { forceUnlockAllScroll } from './lib/scrollLock.ts';
import { PdfQaTestHarness } from './features/resume/test/PdfQaTestHarness.tsx';

function AppContent() {
  const { user, userProfile, isLoading: isAuthLoading, isConfigured, signOut, updateProfile } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [isInitializing, setIsInitializing] = useState(true);

  // Ensure scroll is never locked when switching views
  useEffect(() => {
    forceUnlockAllScroll();
  }, [currentView]);

  // Fast genuine app readiness check
  useEffect(() => {
    const initApp = async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.ready;
        }
      } catch {
        // Fallback
      } finally {
        setTimeout(() => {
          setIsInitializing(false);
        }, 160);
      }
    };
    initApp();
  }, []);

  // Student Profile state with localStorage persistence
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('profile_student_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.fullName === 'Alex Chen' ||
          parsed.fullName === 'Sanjay Kumar' ||
          parsed.fullName === 'ProFile Student'
        ) {
          localStorage.removeItem('profile_student_data');
          return INITIAL_STUDENT_PROFILE;
        }
        return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_STUDENT_PROFILE;
  });

  // Resume draft state with localStorage persistence
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('profile_resume_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.personalInfo?.fullName === 'Alex Chen' ||
          parsed.personalInfo?.fullName === 'Sanjay Kumar' ||
          parsed.personalInfo?.fullName === 'ProFile Student'
        ) {
          localStorage.removeItem('profile_resume_draft');
          return INITIAL_RESUME_DATA;
        }
        return parsed;
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_RESUME_DATA;
  });

  // Synchronize authenticated Firestore profile document into student profile and resume
  useEffect(() => {
    if (userProfile) {
      const synced = mapUserDocToStudentProfile(userProfile, profile);
      setProfile(synced);
      try {
        localStorage.setItem('profile_student_data', JSON.stringify(synced));
      } catch {}

      setResumeData((prev) => {
        const next: ResumeData = {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            fullName: synced.fullName,
            email: synced.email,
            phone: synced.phone || prev.personalInfo.phone,
            location: synced.location || prev.personalInfo.location,
            professionalTitle: synced.targetRole || prev.personalInfo.professionalTitle,
            linkedin: synced.socialLinks?.linkedin || prev.personalInfo.linkedin,
            github: synced.socialLinks?.github || prev.personalInfo.github,
            website: synced.socialLinks?.portfolio || prev.personalInfo.website,
            photoUrl: synced.avatarUrl || prev.personalInfo.photoUrl,
          },
        };
        try {
          localStorage.setItem('profile_resume_draft', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [userProfile]);

  // If user is authenticated and is on signin or welcome, take them directly to dashboard
  useEffect(() => {
    if (user && (currentView === 'signin' || currentView === 'welcome')) {
      setCurrentView('dashboard');
    }
  }, [user]);

  // Active AI Resume Setup state
  const [activeResumeSetup, setActiveResumeSetup] = useState<ResumeSetupData | null>(() => {
    try {
      const cached = localStorage.getItem('profile_resume_setup_active');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  // Load setup from Firestore when user logs in
  useEffect(() => {
    if (user?.uid) {
      getActiveResumeSetup(user.uid).then((setup) => {
        if (setup) {
          setActiveResumeSetup(setup);
        }
      });
    }
  }, [user?.uid]);

  const handleSetupComplete = (setup: ResumeSetupData) => {
    setActiveResumeSetup(setup);

    // Apply target role and student info to active resume draft
    setResumeData((prev) => {
      const next: ResumeData = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: setup.profileContext.fullName || prev.personalInfo.fullName,
          email: setup.profileContext.email || prev.personalInfo.email,
          phone: setup.profileContext.phone || prev.personalInfo.phone,
          location: setup.profileContext.location || prev.personalInfo.location,
          professionalTitle: setup.targetRole.title || prev.personalInfo.professionalTitle,
        },
      };
      try {
        localStorage.setItem('profile_resume_draft', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Proceed directly to the intelligent recommendations engine!
    setCurrentView('resume-recommendations');
  };

  // Applies student-approved recommendations to the active resume draft
  const handleApplyApprovedRecommendations = (selectedTech: string[], selectedSoft: string[]) => {
    setResumeData((prev) => {
      const existingTech = new Set((prev.skills?.technical || []).map((s) => s.toLowerCase()));
      const existingSoft = new Set((prev.skills?.soft || []).map((s) => s.toLowerCase()));

      const newTech = [...(prev.skills?.technical || [])];
      for (const t of selectedTech) {
        if (!existingTech.has(t.toLowerCase())) {
          newTech.push(t);
          existingTech.add(t.toLowerCase());
        }
      }

      const newSoft = [...(prev.skills?.soft || [])];
      for (const s of selectedSoft) {
        if (!existingSoft.has(s.toLowerCase())) {
          newSoft.push(s);
          existingSoft.add(s.toLowerCase());
        }
      }

      const next: ResumeData = {
        ...prev,
        skills: {
          ...prev.skills,
          technical: newTech,
          soft: newSoft,
        },
      };
      try {
        localStorage.setItem('profile_resume_draft', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Protected navigation handler
  const handleNavigate = (view: AppView) => {
    // If user is unauthenticated, protected routes redirect to signin
    if (!user && view !== 'welcome' && view !== 'signin') {
      setCurrentView('signin');
      return;
    }
    if (view === 'resume-recommendations') {
      setCurrentView('resume-recommendations');
      return;
    }
    if (view === 'resume-builder') {
      if (activeResumeSetup) {
        setCurrentView('resume-builder');
      } else {
        setCurrentView('resume-setup');
      }
      return;
    }
    setCurrentView(view);
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOut();
    setCurrentView('welcome');
  };

  // Sync updated profile to localStorage, Firestore (if logged in), and resumeData
  const handleUpdateProfile = async (updated: StudentProfile): Promise<void> => {
    setProfile(updated);
    try {
      localStorage.setItem('profile_student_data', JSON.stringify(updated));
    } catch {}

    // Persist to Firestore if user is authenticated
    if (user) {
      await updateProfile({
        displayName: updated.fullName,
        email: updated.email,
        phone: updated.phone || '',
        location: updated.location || '',
        collegeOrUniversity: updated.collegeOrUniversity || '',
        major: updated.major || '',
        graduationYear: updated.graduationYear || '',
        gpa: updated.gpa || '',
        targetRole: updated.targetRole || '',
        bio: updated.bio || '',
        avatar: updated.avatar,
        photoURL: updated.avatarUrl || null,
        socialLinks: {
          linkedin: updated.socialLinks?.linkedin || '',
          github: updated.socialLinks?.github || '',
          portfolio: updated.socialLinks?.portfolio || '',
        },
      });
    }

    setResumeData((prev) => {
      const next: ResumeData = {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone || prev.personalInfo.phone,
          location: updated.location || prev.personalInfo.location,
          linkedin: updated.socialLinks?.linkedin || prev.personalInfo.linkedin,
          github: updated.socialLinks?.github || prev.personalInfo.github,
          website: updated.socialLinks?.portfolio || prev.personalInfo.website,
          photoUrl: updated.avatarUrl || prev.personalInfo.photoUrl,
        },
      };
      try {
        localStorage.setItem('profile_resume_draft', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Sync updated resumeData to localStorage and propagate personal changes to profile
  const handleUpdateResumeData = (updater: (prev: ResumeData) => ResumeData) => {
    setResumeData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('profile_resume_draft', JSON.stringify(next));
      } catch {}

      if (
        next.personalInfo.fullName !== profile.fullName ||
        next.personalInfo.email !== profile.email
      ) {
        setProfile((prevProf) => {
          const updatedProf: StudentProfile = {
            ...prevProf,
            fullName: next.personalInfo.fullName,
            email: next.personalInfo.email,
            phone: next.personalInfo.phone || prevProf.phone,
            location: next.personalInfo.location || prevProf.location,
            avatarUrl: next.personalInfo.photoUrl || prevProf.avatarUrl,
            socialLinks: {
              ...prevProf.socialLinks,
              linkedin: next.personalInfo.linkedin,
              github: next.personalInfo.github,
              portfolio: next.personalInfo.website,
            },
          };
          try {
            localStorage.setItem('profile_student_data', JSON.stringify(updatedProf));
          } catch {}

          if (user) {
            updateProfile({
              displayName: updatedProf.fullName,
              email: updatedProf.email,
              phone: updatedProf.phone,
              location: updatedProf.location,
              photoURL: updatedProf.avatarUrl,
              socialLinks: updatedProf.socialLinks,
            }).catch(() => {});
          }

          return updatedProf;
        });
      }

      return next;
    });
  };

  // Welcome Screen: Centered hero intro.png on warm cream background with black Get Started button
  if (currentView === 'welcome') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing || isAuthLoading} />
        <WelcomePage onGetStarted={() => setCurrentView('signin')} />
      </>
    );
  }

  // Google Sign-In Screen: Two-column desktop layout with official brand logo, login.png illustration and Google button
  if (currentView === 'signin') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing || isAuthLoading} />
        <SignInPage
          onBackToWelcome={() => setCurrentView('welcome')}
          onContinueToDashboard={() => setCurrentView('dashboard')}
        />
      </>
    );
  }

  // Dedicated AI Resume Assistant Setup Wizard (Phase 1)
  if (currentView === 'resume-setup') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <ResumeSetupWizard
          user={user}
          profile={profile}
          userAvatar={profile.avatar}
          userName={profile.fullName}
          onSignOut={user ? handleSignOut : undefined}
          onNavigate={handleNavigate}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onComplete={handleSetupComplete}
        />
      </>
    );
  }

  // Dedicated AI Resume Recommendations Dashboard (Phase 2)
  if (currentView === 'resume-recommendations') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <RecommendationsDashboard
          user={user}
          profile={profile}
          userAvatar={profile.avatar}
          userName={profile.fullName}
          setup={activeResumeSetup || createInitialResumeSetup(user, profile)}
          resumeData={resumeData}
          onSignOut={user ? handleSignOut : undefined}
          onNavigate={handleNavigate}
          onBackToSetup={() => setCurrentView('resume-setup')}
          onContinueToBuilder={() => setCurrentView('resume-builder')}
          onApplyApprovedToResume={handleApplyApprovedRecommendations}
        />
      </>
    );
  }

  // Dedicated 3-Panel Resume Builder
  if (currentView === 'resume-builder') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <ResumeBuilder
          onBackToDashboard={() => setCurrentView('dashboard')}
          onNavigate={handleNavigate}
          userAvatar={profile.avatar}
          userName={profile.fullName}
          onSignOut={user ? handleSignOut : undefined}
          studentName={profile.fullName.split(' ')[0]}
          initialData={resumeData}
          resumeSetup={activeResumeSetup}
          onOpenSetupWizard={() => setCurrentView('resume-setup')}
          onOpenRecommendations={() => setCurrentView('resume-recommendations')}
          onResumeDataChange={(data) => {
            setResumeData(data);
            try {
              localStorage.setItem('profile_resume_draft', JSON.stringify(data));
            } catch {}
          }}
        />
      </>
    );
  }

  // Dedicated AI Career Intelligence Workspace (Phase 5)
  if (currentView === 'career-intelligence') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <CareerIntelligenceWorkspace
          user={user}
          profile={profile}
          resumeData={resumeData}
          resumeSetup={activeResumeSetup}
          onNavigate={handleNavigate}
          onSignOut={user ? handleSignOut : undefined}
        />
      </>
    );
  }

  // Dedicated AI Interview Intelligence & Placement Workspace (Phase 6)
  if (currentView === 'interview-prep') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <AppShell
          currentView={currentView}
          onNavigate={handleNavigate}
          userAvatar={profile.avatar}
          userName={profile.fullName}
          onSignOut={user ? handleSignOut : undefined}
        >
          <InterviewIntelligenceWorkspace
            userId={user?.uid}
            profile={profile}
            resumeData={resumeData}
            setupData={activeResumeSetup}
            onNavigateBack={() => setCurrentView('dashboard')}
          />
        </AppShell>
      </>
    );
  }

  // Dedicated AI Placement Intelligence, Job Discovery & Application Management (Phase 7)
  if (currentView === 'placement-intelligence') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <AppShell
          currentView={currentView}
          onNavigate={handleNavigate}
          userAvatar={profile.avatar}
          userName={profile.fullName}
          onSignOut={user ? handleSignOut : undefined}
        >
          <PlacementIntelligenceWorkspace
            userId={user?.uid}
            profile={profile}
            resumeData={resumeData}
            setupData={activeResumeSetup}
            onNavigateBack={() => setCurrentView('dashboard')}
          />
        </AppShell>
      </>
    );
  }

  return (
    <>
      <LoadingScreen isLoading={isInitializing} />
      <AppShell
        currentView={currentView}
        onNavigate={handleNavigate}
        userAvatar={profile.avatar}
        userName={profile.fullName}
        onSignOut={user ? handleSignOut : undefined}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div key={currentView} className="animate-page-enter">
            {/* VIEW 1: STUDENT DASHBOARD */}
            {currentView === 'dashboard' && (
              <div>
                {/* Header Banner Card with headercard.png */}
                <div className="relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F7F4ED] shadow-sm mb-8 sm:mb-10 min-h-[140px]">
                  <FadeImage
                    src="/image/headercard.png"
                    fallbackSrc="/images/headercard.png"
                    alt="Welcome to ProFile"
                    wrapperClassName="w-full h-auto"
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  {/* Subtle warm ivory/cream text backdrop gradient on the left side to ensure excellent contrast */}
                  <div
                    className="absolute inset-y-0 left-0 w-full sm:w-[75%] lg:w-[62%] bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/80 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-10 lg:px-14 max-w-[85%] sm:max-w-[70%] lg:max-w-[58%] z-10">
                    <div className="space-y-1 sm:space-y-2">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#625D56] block">
                        YOUR CAREER JOURNEY STARTS HERE
                      </span>
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#171513] leading-tight">
                        {(() => {
                          const rawName = user?.displayName || (profile.fullName && profile.fullName !== 'Student' ? profile.fullName : '');
                          const firstName = rawName.trim().split(/\s+/)[0];
                          return firstName ? `Welcome back, ${firstName}!` : 'Welcome back!';
                        })()}
                      </h1>
                      <p className="text-[11px] sm:text-sm lg:text-base text-[#625D56] leading-snug sm:leading-relaxed max-w-xl">
                        Build a professional resume, check your ATS compatibility, and get ready for your next opportunity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exactly THREE prominent clickable image cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
                  {/* Card 1: Build Resume */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setCurrentView('resume-setup')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCurrentView('resume-setup');
                      }
                    }}
                    className="group relative aspect-square w-full rounded-[26px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F8F8F6] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#101010]"
                    aria-label="Build Resume"
                  >
                    <FadeImage
                      src="/image/build.png"
                      fallbackSrc="/images/build.png"
                      alt="Build Resume"
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="eager"
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
                    <FadeImage
                      src="/image/ats.png"
                      fallbackSrc="/images/ats.png"
                      alt="ATS Checker"
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="eager"
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
                    <FadeImage
                      src="/image/pro.png"
                      fallbackSrc="/images/pro.png"
                      alt="My Profile"
                      wrapperClassName="w-full h-full"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Dashboard Career Intelligence Banner Card (Phase 5) */}
                <div className="mt-8 bg-white border border-[#E5E0D8] rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF5EC] border border-[#E8DEC8] flex items-center justify-center text-[#8C6D1F] shrink-0">
                      <Brain className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6D1F] bg-[#FAF5EC] border border-[#E8DEC8] px-2.5 py-0.5 rounded-full">
                          Phase 5 Intelligence
                        </span>
                        <span className="text-xs text-[#777777]">
                          Personalized Roadmap
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#101010] mt-0.5">
                        Career Intelligence & Learning Roadmap
                      </h3>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Analyze skill gaps for your target role, track a 6-stage structured curriculum, and build proposed capstone projects.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('career-intelligence')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] text-white hover:bg-[#252525] text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>Open Career Roadmap</span>
                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>

                {/* Phase 6 Feature Card: AI Interview Intelligence & Placement Prep */}
                <div className="mt-4 p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-white via-[#FAF9F5] to-white border border-[#E5E0D8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center shrink-0 shadow-xs">
                      <Mic className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          Phase 6 Intelligence
                        </span>
                        <span className="text-xs text-[#777777]">
                          AI Mock & Defense
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#101010] mt-0.5">
                        AI Interview Preparation & Placement Training
                      </h3>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Simulate realistic campus placements, defend your resume projects, practice 10 core DSA topics, and rehearse STAR behavioral answers.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('interview-prep')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] text-white hover:bg-[#252525] text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>Open Interview Prep</span>
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                </div>

                {/* Phase 7 Feature Card: AI Placement Intelligence, Job Discovery & Application Management */}
                <div className="mt-4 p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-white via-[#FAF9F5] to-white border border-[#E5E0D8] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center shrink-0 shadow-xs">
                      <Briefcase className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                          Phase 7 Intelligence
                        </span>
                        <span className="text-xs text-[#777777]">
                          Verified Jobs &amp; Application Hub
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#101010] mt-0.5">
                        Placement Intelligence &amp; Job Discovery
                      </h3>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Explore genuine fresher &amp; internship roles, check eligibility with transparent criteria, match your resume, track applications through 8 pipeline stages, and craft tailored cover letters.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('placement-intelligence')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101010] text-white hover:bg-[#252525] text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <span>Explore Verified Jobs</span>
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                </div>

                {/* Dashboard Career Banner Card with downcard.png */}
                <div className="mt-6 sm:mt-8 relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F7F4ED] shadow-sm flex items-center justify-center">
                  <FadeImage
                    src="/image/downcard.png"
                    fallbackSrc="/images/downcard.png"
                    alt="ProFile Career Journey"
                    wrapperClassName="w-full flex items-center justify-center"
                    className="w-full h-auto object-contain block"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: MY PROFILE */}
            {currentView === 'profile' && (
              <MyProfilePage
                profile={profile}
                resumeData={resumeData}
                onUpdateProfile={handleUpdateProfile}
                onUpdateResumeData={handleUpdateResumeData}
                onNavigateToBuilder={() => setCurrentView('resume-builder')}
                onNavigateToAts={() => setCurrentView('ats-upload')}
                onSignOut={user ? handleSignOut : undefined}
              />
            )}

            {/* VIEW 3: ATS CHECKER WORKSPACE */}
            {currentView === 'ats-upload' && (
              <AtsCheckerWorkspace
                resumeData={resumeData}
                onNavigateToBuilder={() => setCurrentView('resume-builder')}
              />
            )}
          </div>
        </div>
      </AppShell>
    </>
  );
}

export default function App() {
  const isQaMode = typeof window !== 'undefined' && window.location.search.includes('qa=true');
  if (isQaMode) {
    return <PdfQaTestHarness />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
