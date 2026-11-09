/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.7.3: AI Reliability, Cost Optimization & Diagnostics Types
 * Shared data contracts for model selection, token usage tracking, request diagnostics,
 * rate limiting, and structured error payloads.
 */

export interface TokenUsageStats {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
}

export interface AiDiagnosticsRecord {
  requestId: string;
  operationName: string;
  modelUsed: string;
  durationMs: number;
  status: 'success' | 'fallback' | 'error';
  retryCount: number;
  tokenUsage?: TokenUsageStats;
  isFallback: boolean;
  timestamp: string;
  errorMessage?: string;
}

export interface StructuredAiError {
  code:
    | 'MISSING_INPUT'
    | 'INVALID_INPUT'
    | 'UNAUTHORIZED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'AI_SERVICE_UNAVAILABLE'
    | 'GENERATION_TIMEOUT'
    | 'SCHEMA_VALIDATION_ERROR'
    | 'INTERNAL_ERROR';
  message: string;
  isTransient: boolean;
  requestId?: string;
  retryAfter?: number;
  details?: Record<string, any>;
}

export interface AiModelConfig {
  primaryModel: string;
  fastModel: string;
  reasoningModel: string;
  defaultTimeoutMs: number;
  maxRetries: number;
  taskTokenLimits: Record<string, number>;
}
