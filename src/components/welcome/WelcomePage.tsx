/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile Welcome Page
 * Recreates the exact visual direction from the reference image:
 * - Warm cream/off-white background with subtle ash-grey 3D ambient curves
 * - Centered hero image intro.png (responsive, object-fit: contain, aspect-ratio preserved)
 * - Black "Get Started →" button directly below with balanced spacing
 * - No extra text, headers, or clutter
 */

import { ArrowRight } from 'lucide-react';
import { FadeImage } from '../ui/FadeImage.tsx';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export function WelcomePage({ onGetStarted }: WelcomePageProps) {
  return (
    <div className="relative min-h-screen w-full bg-[#F7F4ED] overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-page-enter">
      {/* Background ambient lighting and soft 3D decorative curves matching reference */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft radial glow in the center behind the logo */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(247, 244, 237, 0.6) 60%, rgba(243, 238, 229, 0) 100%)',
          }}
        />

        {/* Left side soft 3D curved orb with gentle ash-grey shadow */}
        <div
          className="absolute -left-28 sm:-left-20 top-1/4 sm:top-1/5 w-[320px] sm:w-[440px] md:w-[520px] h-[320px] sm:h-[440px] md:h-[520px] rounded-full blur-2xs opacity-75"
          style={{
            background: 'radial-gradient(circle at 65% 45%, #FFFFFF 0%, #EFEAE0 55%, #DDD4C5 85%, #CCC2B1 100%)',
            boxShadow: '18px 25px 60px rgba(180, 170, 155, 0.25)',
          }}
        />

        {/* Lower left ambient foreground curve */}
        <div
          className="absolute -left-36 sm:-left-24 bottom-[-100px] sm:bottom-[-80px] w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle at 50% 30%, #FFFFFF 0%, #EFEAE0 60%, #DDD3C2 100%)',
            boxShadow: '10px -10px 45px rgba(180, 170, 155, 0.15)',
          }}
        />

        {/* Right side upper ambient curved form */}
        <div
          className="absolute -right-24 sm:-right-16 top-[-60px] sm:top-[-40px] w-[260px] sm:w-[380px] md:w-[460px] h-[260px] sm:h-[380px] md:h-[460px] rounded-full opacity-65"
          style={{
            background: 'radial-gradient(circle at 35% 65%, #FFFFFF 0%, #EDE7DB 60%, #DDD2BF 90%, #CCC0AC 100%)',
            boxShadow: '-15px 20px 50px rgba(180, 170, 155, 0.2)',
          }}
        />

        {/* Right side lower ambient curve */}
        <div
          className="absolute -right-32 sm:-right-20 bottom-1/8 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full opacity-55"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #FFFFFF 0%, #EEE7DC 65%, #DDD3C2 100%)',
            boxShadow: '-12px -12px 40px rgba(180, 170, 155, 0.15)',
          }}
        />

        {/* Gentle bottom floor lighting gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{
            background: 'linear-gradient(to top, rgba(235, 229, 218, 0.35) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* Main Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-full px-4">
        {/* Centered Hero Image: intro.png with responsive sizing, breathing scale effect, and gentle shadow breath */}
        <div className="relative flex items-center justify-center">
          {/* Subtle soft ash shadow directly beneath the 3D illustration with smooth shadow breathing */}
          <div
            className="absolute bottom-14 sm:bottom-16 w-3/5 h-8 rounded-full blur-xl opacity-30 pointer-events-none animate-shadow-breath"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 16, 16, 0.5) 0%, rgba(16, 16, 16, 0) 70%)',
            }}
          />

          <div className="animate-breath">
            <FadeImage
              src="/image/intro.png"
              fallbackSrc="/images/intro.png"
              alt="ProFile"
              wrapperClassName="flex items-center justify-center"
              className="w-[280px] sm:w-[360px] md:w-[440px] lg:w-[480px] h-auto object-contain select-none pointer-events-none"
              style={{
                filter: 'drop-shadow(0 10px 24px rgba(16, 16, 16, 0.05))',
              }}
              loading="eager"
            />
          </div>
        </div>

        {/* Black Get Started → Button directly below with balanced spacing */}
        <button
          onClick={onGetStarted}
          className="mt-6 sm:mt-7 group inline-flex items-center justify-center gap-2.5 px-8 sm:px-9 py-3 sm:py-3.5 bg-[#101010] hover:bg-[#222222] text-white text-sm sm:text-base font-medium rounded-full shadow-[0_8px_22px_rgba(16,16,16,0.22)] hover:shadow-[0_12px_28px_rgba(16,16,16,0.3)] transition-all duration-200 cursor-pointer active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#101010]"
          aria-label="Get Started with ProFile"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
