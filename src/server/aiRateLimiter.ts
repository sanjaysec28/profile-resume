/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Rate Limiting & Abuse Protection
 * Sliding window rate limiter preventing denial of service, burst spam, and API key exhaustion.
 */

import { Request, Response, NextFunction } from 'express';
import { createStructuredAiError } from './aiSecurity.ts';

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitBucket>();
const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Checks whether an identifier has exceeded the rate limit.
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  let bucket = rateLimitMap.get(identifier);

  if (!bucket) {
    bucket = { timestamps: [] };
    rateLimitMap.set(identifier, bucket);
  }

  // Filter timestamps within current sliding window
  const windowStart = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  bucket.timestamps.push(now);
  const remaining = Math.max(0, maxRequests - bucket.timestamps.length);

  return {
    allowed: true,
    remaining,
    resetInSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Express middleware for AI endpoint rate limiting.
 */
export function aiRateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract client identifier (IP address or fallback)
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const { allowed, remaining, resetInSeconds } = checkRateLimit(clientIp);

  res.setHeader('X-RateLimit-Limit', DEFAULT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetInSeconds);

  if (!allowed) {
    res.setHeader('Retry-After', resetInSeconds);
    res.status(429).json(
      createStructuredAiError(
        'RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded. Maximum ${DEFAULT_MAX_REQUESTS} requests per minute allowed. Please wait ${resetInSeconds}s before retrying.`,
        { retryAfter: resetInSeconds, isTransient: true }
      )
    );
    return;
  }

  next();
}

/**
 * Clears rate limiter cache (used in test harnesses).
 */
export function clearRateLimiter(): void {
  rateLimitMap.clear();
}
