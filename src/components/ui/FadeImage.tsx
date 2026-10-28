/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile FadeImage Component
 * Keeps layout stable and page content visible while images load in the background.
 * Uses a soft cream skeleton placeholder and smooth fade-in once ready.
 */

import React, { useState, useRef, useEffect } from 'react';

export interface FadeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  wrapperClassName?: string;
  showSkeleton?: boolean;
}

export function FadeImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  fallbackSrc,
  showSkeleton = true,
  style,
  onError,
  onLoad,
  ...rest
}: FadeImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached/complete on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [currentSrc]);

  // Update src if prop changes
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      onError?.(e);
    }
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Subtle warm skeleton placeholder while loading */}
      {showSkeleton && !isLoaded && (
        <div
          className="absolute inset-0 bg-[#E8E2D6]/60 animate-pulse rounded-[inherit] pointer-events-none transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Primary Image with smooth fade-in */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={style}
        className={`transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...rest}
      />
    </div>
  );
}
