/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Google Sign-In Page
 * Recreates the exact visual direction from the reference image:
 * - Warm cream background #F7F4ED with subtle ambient lighting and soft ash-grey shadows
 * - Premium, minimalist two-column layout on desktop (text left, large illustration right)
 * - Mobile stacked layout with comfortable spacing
 * - Heading: "Sign in to ProFile"
 * - Supporting text: "Continue with your Google account to build your resume, check ATS score and manage your profile."
 * - White rounded "Continue with Google" button
 * - Centered /image/login.png with soft bottom fade blended into the background
 */

import { useState } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Logo } from '../ui/Logo.tsx';
import { FadeImage } from '../ui/FadeImage.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export interface SignInPageProps {
  onBackToWelcome?: () => void;
  onContinueToDashboard?: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
}

export function SignInPage({
  onBackToWelcome,
  onContinueToDashboard,
  onGoogleSignIn,
}: SignInPageProps) {
  const { signInWithGoogle, isLoading: isAuthLoading, isConfigured, missingFirebaseKeys, authError } = useAuth();
  const [localAuthenticating, setLocalAuthenticating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * Real Google Sign-in Handler using Firebase Authentication
   */
  const handleGoogleSignIn = async () => {
    setLocalAuthenticating(true);
    setLocalError(null);

    try {
      if (onGoogleSignIn) {
        await onGoogleSignIn();
      } else {
        await signInWithGoogle();
      }
      onContinueToDashboard?.();
    } catch (err: any) {
      console.error('[ProFile Auth] Sign-in failed:', err);
      setLocalError(err.message || 'Unable to complete Google Sign-In.');
    } finally {
      setLocalAuthenticating(false);
    }
  };

  const isWorking = isAuthLoading || localAuthenticating;
  const displayError = localError || authError;

  return (
    <div className="relative min-h-screen w-full bg-[#F7F4ED] text-[#101010] flex flex-col justify-between overflow-x-hidden selection:bg-[#101010] selection:text-[#F8F5EE] animate-page-enter">
      {/* Background ambient lighting and soft 3D decorative curves */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central ambient luminous glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 237, 0.5) 60%, rgba(243, 238, 229, 0) 100%)',
          }}
        />

        {/* Soft upper-left ambient curve with gentle ash-grey shadow */}
        <div
          className="absolute -left-28 top-[-60px] w-[420px] h-[420px] rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle at 60% 50%, #FFFFFF 0%, #EFE9DE 60%, #DDD3C2 100%)',
            boxShadow: '18px 25px 60px rgba(180, 170, 155, 0.2)',
          }}
        />

        {/* Soft bottom-right ambient curve */}
        <div
          className="absolute -right-28 bottom-[-80px] w-[500px] h-[500px] rounded-full opacity-55"
          style={{
            background:
              'radial-gradient(circle at 35% 45%, #FFFFFF 0%, #EEE7DC 60%, #DDD3C2 100%)',
            boxShadow: '-15px -15px 50px rgba(180, 170, 155, 0.15)',
          }}
        />
      </div>

      {/* Top minimal brand bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-6 sm:pt-8 flex items-center justify-between">
        {onBackToWelcome ? (
          <button
            onClick={onBackToWelcome}
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#777777] hover:text-[#101010] transition-colors cursor-pointer"
            aria-label="Back to welcome page"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center">
          <Logo size="md" />
        </div>
      </header>

      {/* Main Two-Column Layout on Desktop / Stacked on Mobile */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 sm:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Heading, supporting text, and Google Button */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#101010] text-balance">
              Sign in to ProFile
            </h1>

            {/* Supporting text */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-[#777777] leading-relaxed max-w-md">
              Continue with your Google account to build your resume, check ATS score and manage your profile.
            </p>

            {/* White rounded "Continue with Google" button */}
            <div className="mt-7 sm:mt-8 w-full max-w-sm flex flex-col items-center lg:items-start">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isWorking}
                className="w-full sm:w-auto min-w-[280px] h-13 sm:h-14 px-6 sm:px-8 bg-white hover:bg-[#FAF9F5] text-[#101010] font-medium text-sm sm:text-base rounded-full border border-[#E5E0D8] hover:border-[#D1C9BE] shadow-[0_2px_8px_rgba(16,16,16,0.04),0_6px_20px_rgba(16,16,16,0.03)] hover:shadow-[0_4px_16px_rgba(16,16,16,0.08)] transition-all duration-200 flex items-center justify-center gap-3.5 cursor-pointer active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#101010] disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Continue with Google"
              >
                {isWorking ? (
                  <span className="flex items-center gap-2 text-xs sm:text-sm text-[#777777]">
                    <svg
                      className="animate-spin h-4 w-4 text-[#101010]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Authenticating with Google...</span>
                  </span>
                ) : (
                  <>
                    {/* Official Multi-colored Google "G" Icon */}
                    <svg
                      className="w-5 h-5 shrink-0"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Error or configuration alert */}
              {displayError && (
                <div className="text-xs text-red-700 bg-red-50/90 border border-red-200 p-3 rounded-xl mt-3 flex items-start gap-2 w-full text-left">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{displayError}</span>
                </div>
              )}

              {/* Guidance if Firebase is awaiting configuration */}
              {!isConfigured && !displayError && (
                <p className="text-[11px] text-[#888888] mt-3 bg-white/70 px-3 py-2 rounded-xl border border-[#E5E0D8] text-center lg:text-left leading-relaxed">
                  Firebase Authentication is ready. Provide your web configuration in <code className="bg-[#EAE5DC] px-1 py-0.5 rounded text-[10px]">.env</code> to connect.
                </p>
              )}

              {/* Optional Demo Dashboard link for testing */}
              {onContinueToDashboard && (
                <button
                  type="button"
                  onClick={onContinueToDashboard}
                  className="mt-4 text-xs font-medium text-[#777777] hover:text-[#101010] transition-colors cursor-pointer underline underline-offset-4"
                >
                  Explore student dashboard preview →
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Large /image/login.png illustration */}
          <div className="lg:col-span-6 flex items-center justify-center w-full">
            <div className="relative w-full max-w-[340px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[540px] flex items-center justify-center">
              
              {/* Subtle ash-grey drop shadow beneath character */}
              <div
                className="absolute bottom-6 w-3/4 h-12 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(16, 16, 16, 0.6) 0%, rgba(16, 16, 16, 0) 70%)',
                }}
              />

              {/* Illustration with object-fit: contain and aspect-ratio preservation */}
              <FadeImage
                src="/image/login.png"
                fallbackSrc="/images/login.png"
                alt="Sign in to ProFile"
                wrapperClassName="w-full flex items-center justify-center"
                className="w-full h-auto max-h-[380px] sm:max-h-[460px] lg:max-h-[520px] object-contain select-none pointer-events-none"
                loading="eager"
              />

              {/* Soft bottom blend gradient naturally dissolving into cream background */}
              <div
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, #F7F4ED 0%, rgba(247, 244, 237, 0.7) 45%, transparent 100%)',
                }}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-6 text-center lg:text-left text-xs text-[#A3A3A3]">
        <span>ProFile · Premium Student Resume Builder &amp; ATS Checker</span>
      </footer>
    </div>
  );
}
