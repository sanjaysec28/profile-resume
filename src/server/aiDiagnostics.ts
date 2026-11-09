/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Server-Side Privacy-Conscious AI Observability & Diagnostics
 * Tracks operational telemetry (latency, model, retries, token counts, fallbacks)
 * strictly WITHOUT logging sensitive student data, resumes, answers, or API keys.
 */

import { AiDiagnosticsRecord, TokenUsageStats } from '../types/aiReliability.ts';

const MAX_DIAGNOSTICS_HISTORY = 100;
const diagnosticsBuffer: AiDiagnosticsRecord[] = [];

/**
 * Generates a unique, privacy-safe request ID.
 */
export function createRequestId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).substring(2, 8);
  return `req_${ts}_${rnd}`;
}

/**
 * Scrubs any sensitive values (API keys, email addresses, auth tokens) from error strings.
 */
export function sanitizeLogString(str: string): string {
  if (!str) return '';
  return str
    .replace(/AIza[0-9A-Za-z-_]{20,50}/g, '[REDACTED_API_KEY]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]');
}

/**
 * Records a privacy-conscious AI operation diagnostic.
 */
export function recordAiDiagnostics(record: {
  requestId: string;
  operationName: string;
  modelUsed: string;
  durationMs: number;
  status: 'success' | 'fallback' | 'error';
  retryCount: number;
  tokenUsage?: TokenUsageStats;
  isFallback: boolean;
  errorMessage?: string;
}): AiDiagnosticsRecord {
  const sanitizedRecord: AiDiagnosticsRecord = {
    requestId: record.requestId,
    operationName: record.operationName,
    modelUsed: record.modelUsed,
    durationMs: record.durationMs,
    status: record.status,
    retryCount: record.retryCount,
    tokenUsage: record.tokenUsage ? { ...record.tokenUsage } : undefined,
    isFallback: record.isFallback,
    timestamp: new Date().toISOString(),
    errorMessage: record.errorMessage ? sanitizeLogString(record.errorMessage) : undefined,
  };

  // Add to ring buffer
  diagnosticsBuffer.unshift(sanitizedRecord);
  if (diagnosticsBuffer.length > MAX_DIAGNOSTICS_HISTORY) {
    diagnosticsBuffer.pop();
  }

  // Privacy-safe console telemetry log
  const tokenInfo = sanitizedRecord.tokenUsage?.totalTokens !== undefined
    ? `tokens=${sanitizedRecord.tokenUsage.totalTokens}`
    : 'tokens=N/A';

  console.log(
    `[AI Diagnostics] req=${sanitizedRecord.requestId} op="${sanitizedRecord.operationName}" model="${sanitizedRecord.modelUsed}" status=${sanitizedRecord.status} duration=${sanitizedRecord.durationMs}ms retries=${sanitizedRecord.retryCount} ${tokenInfo} fallback=${sanitizedRecord.isFallback}`
  );

  return sanitizedRecord;
}

/**
 * Returns recent diagnostics records for server health and audit views.
 */
export function getAiDiagnosticsHistory(): AiDiagnosticsRecord[] {
  return [...diagnosticsBuffer];
}

/**
 * Clears diagnostics history (used in automated test harnesses).
 */
export function clearAiDiagnosticsHistory(): void {
  diagnosticsBuffer.length = 0;
}
