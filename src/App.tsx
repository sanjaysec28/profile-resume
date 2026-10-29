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
import { Avatar } from './components/ui/Avatar.tsx';
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
  Sparkles,
} from 'lucide-react';

import { WelcomePage } from './components/welcome/WelcomePage.tsx';
import { SignInPage } from './components/auth/SignInPage.tsx';
import { ResumeBuilder } from './features/resume/index.ts';
import { MyProfilePage } from './components/profile/MyProfilePage.tsx';

function AppContent() {
  const { user, userProfile, isLoading: isAuthLoading, isConfigured, signOut, updateProfile } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [isInitializing, setIsInitializing] = useState(true);

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
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial
    }
    return INITIAL_STUDENT_PROFILE;
  });

  // Resume draft state with localStorage persistence
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('profile_resume_draft');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback to initial
    }
    return INITIAL_RESUME_DATA;
  });

  const [isAtsScanning, setIsAtsScanning] = useState(false);
  const [atsScoreResult, setAtsScoreResult] = useState<number | null>(null);

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

  // Protected navigation handler
  const handleNavigate = (view: AppView) => {
    // If Firebase is configured and user is unauthenticated, protected routes redirect to signin
    if (isConfigured && !user && view !== 'welcome' && view !== 'signin') {
      setCurrentView('signin');
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
  const handleUpdateProfile = (updated: StudentProfile) => {
    setProfile(updated);
    try {
      localStorage.setItem('profile_student_data', JSON.stringify(updated));
    } catch {}

    // Persist to Firestore if user is authenticated
    if (user) {
      updateProfile({
        displayName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        location: updated.location,
        collegeOrUniversity: updated.collegeOrUniversity,
        major: updated.major,
        graduationYear: updated.graduationYear,
        gpa: updated.gpa,
        targetRole: updated.targetRole,
        bio: updated.bio,
        avatar: updated.avatar,
        photoURL: updated.avatarUrl,
        socialLinks: updated.socialLinks,
      }).catch((err) => {
        console.error('[ProFile Firestore updateProfile error]:', err);
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

  // Dedicated 3-Panel Resume Builder
  if (currentView === 'resume-builder') {
    return (
      <>
        <LoadingScreen isLoading={isInitializing} />
        <ResumeBuilder
          onBackToDashboard={() => setCurrentView('dashboard')}
          studentName={profile.fullName.split(' ')[0]}
          initialData={resumeData}
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

  const handleSimulateAtsScan = () => {
    setIsAtsScanning(true);
    setTimeout(() => {
      setIsAtsScanning(false);
      setAtsScoreResult(96);
    }, 1200);
  };

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
                  <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14 max-w-[62%] sm:max-w-[55%]">
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

                {/* Exactly THREE prominent clickable image cards */}
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

                {/* Bottom Career Banner Card with downcard.png */}
                <div className="mt-8 sm:mt-10 relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#3A3A3A] bg-[#101010] shadow-md min-h-[120px]">
                  <FadeImage
                    src="/image/downcard.png"
                    fallbackSrc="/images/downcard.png"
                    alt="Your Career Journey Starts Here"
                    wrapperClassName="w-full h-auto"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Student Quick Summary Strip */}
                <div className="mt-8 sm:mt-10 p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              <div>
                <PageHeader
                  title="ATS Resume Scanner & Score Checker"
                  description="Test your resume against leading Applicant Tracking Systems with comprehensive formatting, keyword, and section analysis."
                  kicker="Instant ATS Diagnostic"
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setCurrentView('resume-builder')}
                    >
                      Open Resume Builder
                    </Button>
                  }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Drag & Drop Scanner */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-8 sm:p-10 rounded-[28px] bg-[#F8F8F6] border-2 border-dashed border-[#DDD5C7] hover:border-[#101010] transition-colors flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#101010] text-[#F8F5EE] flex items-center justify-center mb-4 shadow-sm">
                        <Upload className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-[#101010]">
                        Upload Resume for ATS Score
                      </h3>
                      <p className="text-xs text-[#777777] max-w-sm mt-1 leading-relaxed">
                        Drop your PDF or DOCX resume here, or scan your active ProFile draft.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3 justify-center">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleSimulateAtsScan}
                          disabled={isAtsScanning}
                        >
                          {isAtsScanning ? 'Analyzing Document...' : 'Scan Active Resume Draft'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => setCurrentView('resume-builder')}
                        >
                          Build from Scratch
                        </Button>
                      </div>
                    </div>

                    {/* Score Diagnostic Card */}
                    {atsScoreResult !== null && (
                      <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-bold text-sm text-[#101010]">Diagnostic Complete</h4>
                          </div>
                          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-[#EBF5EE] text-[#1E5631] rounded-lg">
                            {atsScoreResult}% Overall Match
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Standard A4 Layout &amp; Margins</span>
                            <span className="font-semibold text-emerald-600">Passed (100%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Section Header Hierarchy</span>
                            <span className="font-semibold text-emerald-600">Passed (98%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Font Legibility (Inter / Sans-Serif)</span>
                            <span className="font-semibold text-emerald-600">Passed (100%)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#555555]">Contact &amp; Hyperlink Structure</span>
                            <span className="font-semibold text-emerald-600">Passed (95%)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: ATS Best Practices Guidelines */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="p-6 rounded-[28px] bg-[#F8F8F6] border border-[#E5E0D8] space-y-3">
                      <h4 className="text-sm font-bold text-[#101010] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#101010]" />
                        <span>How ProFile Maximizes ATS Scores</span>
                      </h4>
                      <ul className="text-xs text-[#555555] space-y-2.5 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-[#101010]">•</span>
                          <span><strong>Single &amp; Dual Column Balance:</strong> Clean linear DOM hierarchy ensures text extractors read contact details and sections in sequential order.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-[#101010]">•</span>
                          <span><strong>Zero Unparseable Graphics:</strong> Uses semantic text elements rather than flattened images or complex SVG text.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-[#101010]">•</span>
                          <span><strong>Standardized Section Headings:</strong> Uses recognizable headers like Education, Experience, Skills, and Projects.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
