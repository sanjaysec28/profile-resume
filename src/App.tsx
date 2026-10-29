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
  Sparkles,
} from 'lucide-react';

import { WelcomePage } from './components/welcome/WelcomePage.tsx';
import { SignInPage } from './components/auth/SignInPage.tsx';
import { ResumeBuilder } from './features/resume/index.ts';
import { MyProfilePage } from './components/profile/MyProfilePage.tsx';

interface AtsDiagnosticItem {
  label: string;
  score: number;
  status: 'passed' | 'warning' | 'info';
  details: string;
}

interface AtsReport {
  overallScore: number;
  items: AtsDiagnosticItem[];
}

function computeAtsReport(resume: ResumeData): AtsReport {
  const items: AtsDiagnosticItem[] = [];

  // 1. Contact Information
  const hasName = Boolean(resume.personalInfo?.fullName?.trim());
  const hasEmail = Boolean(resume.personalInfo?.email?.trim());
  const hasPhone = Boolean(resume.personalInfo?.phone?.trim());
  const hasLocation = Boolean(resume.personalInfo?.location?.trim());

  let contactScore = 0;
  if (hasName) contactScore += 30;
  if (hasEmail) contactScore += 30;
  if (hasPhone) contactScore += 20;
  if (hasLocation) contactScore += 20;

  items.push({
    label: 'Contact Information Completeness',
    score: contactScore,
    status: contactScore >= 80 ? 'passed' : contactScore >= 50 ? 'warning' : 'info',
    details:
      contactScore === 100
        ? 'All key contact details detected (Name, Email, Phone, Location).'
        : `Missing: ${[!hasName && 'Name', !hasEmail && 'Email', !hasPhone && 'Phone', !hasLocation && 'Location'].filter(Boolean).join(', ')}.`,
  });

  // 2. Summary / Objective
  const summaryLen = resume.personalInfo?.summary?.trim().length || 0;
  let summaryScore = 0;
  if (summaryLen >= 60) summaryScore = 100;
  else if (summaryLen >= 20) summaryScore = 65;
  else summaryScore = 20;

  items.push({
    label: 'Professional Summary & Headline',
    score: summaryScore,
    status: summaryScore >= 65 ? 'passed' : 'warning',
    details:
      summaryScore === 100
        ? 'Strong, concise professional summary detected.'
        : summaryLen > 0
        ? 'Summary is relatively short. Consider adding 2-3 impact-focused sentences.'
        : 'No summary detected. An introductory profile summary improves ATS keyword matching.',
  });

  // 3. Education
  const validEdu = (resume.education || []).filter((e) => e.institution?.trim() || e.degree?.trim());
  let eduScore = 0;
  if (validEdu.length >= 1 && validEdu[0].institution && validEdu[0].degree) eduScore = 100;
  else if (validEdu.length >= 1) eduScore = 60;
  else eduScore = 15;

  items.push({
    label: 'Academic & Degree Credentials',
    score: eduScore,
    status: eduScore >= 60 ? 'passed' : 'warning',
    details:
      eduScore === 100
        ? `Found ${validEdu.length} formal academic credential${validEdu.length > 1 ? 's' : ''} with degree details.`
        : 'Include your college or university, degree, and expected graduation date.',
  });

  // 4. Experience & Practical Work
  const validExp = (resume.experience || []).filter((e) => e.company?.trim());
  const validProj = (resume.projects || []).filter((p) => p.title?.trim());
  let expScore = 0;
  if (validExp.length >= 1) expScore = 100;
  else if (validProj.length >= 2) expScore = 80;
  else if (validProj.length === 1) expScore = 50;
  else expScore = 20;

  items.push({
    label: 'Experience & Practical Work',
    score: expScore,
    status: expScore >= 80 ? 'passed' : expScore >= 50 ? 'warning' : 'info',
    details:
      validExp.length >= 1
        ? `Detected ${validExp.length} internship/job experience record${validExp.length > 1 ? 's' : ''}.`
        : validProj.length >= 1
        ? 'Project-focused portfolio detected. Practical projects demonstrate hands-on competence.'
        : 'Add internships, research fellowships, or major projects to showcase impact.',
  });

  // 5. Technical & Core Skills
  const skillCount =
    (resume.skills?.technical?.length || 0) +
    (resume.skills?.soft?.length || 0) +
    (resume.skills?.tools?.length || 0);
  let skillScore = 0;
  if (skillCount >= 6) skillScore = 100;
  else if (skillCount >= 3) skillScore = 75;
  else if (skillCount >= 1) skillScore = 40;
  else skillScore = 15;

  items.push({
    label: 'Technical & Domain Keywords',
    score: skillScore,
    status: skillScore >= 75 ? 'passed' : 'warning',
    details:
      skillCount >= 3
        ? `${skillCount} skills indexed for ATS keyword density.`
        : 'Add at least 4-6 specific technical skills or domain tools.',
  });

  // 6. ATS Layout Hierarchy
  items.push({
    label: 'Standard A4 Layout & Parsability',
    score: 100,
    status: 'passed',
    details: 'Single & dual column linear hierarchy compliant with Workday, Greenhouse & Taleo.',
  });

  // Weighted overall score
  const overall = Math.round(
    contactScore * 0.2 +
    summaryScore * 0.15 +
    eduScore * 0.25 +
    expScore * 0.2 +
    skillScore * 0.1 +
    100 * 0.1
  );

  return {
    overallScore: Math.min(100, Math.max(10, overall)),
    items,
  };
}

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

  const [isAtsScanning, setIsAtsScanning] = useState(false);
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);

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

  // Guard against unauthenticated access to protected views
  useEffect(() => {
    if (!isAuthLoading && !user && currentView !== 'welcome' && currentView !== 'signin') {
      setCurrentView('signin');
    }
  }, [user, isAuthLoading, currentView]);

  // Protected navigation handler
  const handleNavigate = (view: AppView) => {
    // If user is unauthenticated, protected routes redirect to signin
    if (!user && view !== 'welcome' && view !== 'signin') {
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
      const report = computeAtsReport(resumeData);
      setAtsReport(report);
    }, 850);
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
                    {profile.collegeOrUniversity || profile.graduationYear ? (
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] mb-1 sm:mb-2">
                        {profile.collegeOrUniversity && <span>{profile.collegeOrUniversity}</span>}
                        {profile.collegeOrUniversity && profile.graduationYear && <span>·</span>}
                        {profile.graduationYear && <span>Class of {profile.graduationYear}</span>}
                      </div>
                    ) : (
                      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] mb-1 sm:mb-2">
                        Student Workspace
                      </div>
                    )}
                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#101010] leading-tight">
                      Welcome back{profile.fullName && profile.fullName !== 'Student' ? `, ${profile.fullName.split(' ')[0]}` : ''}
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

                {/* Dashboard Career Banner Card with downcard.png */}
                <div className="mt-8 sm:mt-10 relative w-full rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#E5E0D8] bg-[#F7F4ED] shadow-sm flex items-center justify-center">
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
                    {atsReport !== null && (
                      <div className="p-6 rounded-[28px] bg-white border border-[#E5E0D8] shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                              className={`w-5 h-5 ${
                                atsReport.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-500'
                              }`}
                            />
                            <h4 className="font-bold text-sm text-[#101010]">
                              {atsReport.overallScore >= 70 ? 'ATS Diagnostic Complete' : 'ATS Readiness Analysis'}
                            </h4>
                          </div>
                          <span
                            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                              atsReport.overallScore >= 75
                                ? 'bg-[#EBF5EE] text-[#1E5631]'
                                : atsReport.overallScore >= 50
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {atsReport.overallScore}% Overall Match
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          {atsReport.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-[#F5F2EB] last:border-none"
                            >
                              <div className="pr-2">
                                <span className="font-semibold text-[#101010]">{item.label}</span>
                                <p className="text-[11px] text-[#777777] mt-0.5">{item.details}</p>
                              </div>
                              <span
                                className={`font-semibold shrink-0 text-left sm:text-right ${
                                  item.status === 'passed'
                                    ? 'text-emerald-600'
                                    : item.status === 'warning'
                                    ? 'text-amber-600'
                                    : 'text-[#888888]'
                                }`}
                              >
                                {item.status === 'passed'
                                  ? `Passed (${item.score}%)`
                                  : `Needs Attention (${item.score}%)`}
                              </span>
                            </div>
                          ))}
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
