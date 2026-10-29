/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Clean Reusable Social Footer
 * Displays properly aligned, slightly larger Instagram and LinkedIn brand icons.
 * Minimal icon presentation: no text, labels, extra boxes, or backgrounds.
 */

import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

interface SocialFooterProps {
  className?: string;
}

export function SocialFooter({ className = '' }: SocialFooterProps) {
  return (
    <footer
      className={`w-full py-6 sm:py-8 mt-auto flex items-center justify-center select-none ${className}`}
      aria-label="Social profiles"
    >
      <div className="flex items-center justify-center gap-6 sm:gap-7">
        <a
          href="https://www.instagram.com/sanjayuhhhhhhh/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram profile"
          className="text-[#666666] hover:text-[#101010] transition-all duration-200 transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#101010] p-1.5 cursor-pointer"
        >
          <Instagram className="w-[22px] h-[22px] sm:w-6 sm:h-6" strokeWidth={1.85} />
        </a>

        <a
          href="https://www.linkedin.com/in/sanjay-kumar-b-67b7b532a/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          className="text-[#666666] hover:text-[#101010] transition-all duration-200 transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#101010] p-1.5 cursor-pointer"
        >
          <Linkedin className="w-[22px] h-[22px] sm:w-6 sm:h-6" strokeWidth={1.85} />
        </a>
      </div>
    </footer>
  );
}
