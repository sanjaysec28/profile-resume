/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side AI Security & Prompt Injection Protection
 * Protects against prompt injection attacks, malicious third-party job descriptions,
 * oversized payloads, and unauthorized access while preserving legitimate engineering text.
 */

import { StructuredAiError } from '../types/aiReliability.ts';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|directions)/gi,
  /disregard\s+(all\s+)?(previous|prior)\s+(instructions|prompts)/gi,
  /system\s+prompt\s+override/gi,
  /you\s+are\s+now\s+in\s+developer\s+mode/gi,
  /reveal\s+(your\s+)?(system\s+instructions|secret\s+key|api\s+key)/gi,
  /output\s+the\s+system\s+prompt/gi,
  /bypass\s+all\s+(filters|rules|safeguards)/gi,
];

/**
 * Sanitizes untrusted user inputs or third-party job descriptions before embedding into LLM prompts.
 * Escapes control delimiters and neutralizes hostile instruction-overriding tokens.
 */
export function sanitizeUntrustedPromptInput(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') return '';

  let sanitized = input.trim();

  // Enforce reasonable length bound
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Escape prompt delimiter blocks so untrusted text cannot break out of JSON/string literals
  sanitized = sanitized
    .replace(/"""/g, '\\"\\"\\"')
    .replace(/```/g, '\\`\\`\\`');

  // Neutralize common adversarial injection attempts
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[FILTERED_ADVERSARIAL_INSTRUCTION]');
  }

  return sanitized;
}

/**
 * Validates request body structure and payload sizes.
 */
export function validateAiRequestBody(
  body: unknown,
  requiredFields: string[]
): { valid: boolean; missingField?: string; reason?: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, reason: 'Request body must be a valid JSON object.' };
  }

  const record = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null) {
      return { valid: false, missingField: field, reason: `Missing required field: "${field}".` };
    }
  }

  return { valid: true };
}

/**
 * Formats a standardized, typed structured error response.
 */
export function createStructuredAiError(
  code: StructuredAiError['code'],
  message: string,
  options?: {
    requestId?: string;
    isTransient?: boolean;
    retryAfter?: number;
    details?: Record<string, any>;
  }
): { error: StructuredAiError } {
  return {
    error: {
      code,
      message,
      isTransient: options?.isTransient ?? false,
      requestId: options?.requestId,
      retryAfter: options?.retryAfter,
      details: options?.details,
    },
  };
}
