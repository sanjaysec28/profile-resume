/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Centralized Gemini Model Configuration, Reliability Engine & Client Factory
 * Aligned with @google/genai TypeScript SDK and AI Studio model standards.
 * Implements timeouts, safe exponential retries with jitter, in-flight request deduplication,
 * token usage tracking, and privacy-conscious observability diagnostics.
 */

import { GoogleGenAI } from '@google/genai';
import { TokenUsageStats } from '../types/aiReliability.ts';
import { recordAiDiagnostics, createRequestId, sanitizeLogString } from './aiDiagnostics.ts';

// Centralized model configuration with environment variable override support
export const GEMINI_PRIMARY_MODEL = process.env.GEMINI_PRIMARY_MODEL || 'gemini-3.8-flash';
export const GEMINI_FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-3.1-flash-lite';
export const GEMINI_REASONING_MODEL = process.env.GEMINI_REASONING_MODEL || 'gemini-4-argon';

export const GEMINI_GENERATION_MODELS = [
  GEMINI_FAST_MODEL,
  GEMINI_PRIMARY_MODEL,
  'gemini-flash-latest',
] as const;

export const GEMINI_REVIEW_MODELS = [
  GEMINI_PRIMARY_MODEL,
  GEMINI_FAST_MODEL,
  'gemini-flash-latest',
] as const;

// Task-based output token limits for cost control and latency optimization
export const TASK_MAX_OUTPUT_TOKENS: Record<string, number> = {
  chat: 800,
  coach: 800,
  recommendations: 1500,
  content: 1200,
  review: 2048,
  roadmap: 2048,
  interview: 1500,
  draft: 1200,
  default: 1500,
};

// In-flight request deduplication map to prevent redundant duplicate calls
const inFlightRequests = new Map<string, Promise<GenerateResult>>();

export interface GenerateResult {
  text: string;
  modelUsed: string;
  requestId: string;
  durationMs: number;
  tokenUsage?: TokenUsageStats;
  retryCount: number;
  isFallback: boolean;
}

/**
 * Returns an initialized GoogleGenAI instance.
 * Validates presence of GEMINI_API_KEY without leaking secret keys in logs.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please ensure the Gemini API key is configured in Settings > Secrets.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build/profile-d73',
      },
    },
  });
}

/**
 * Checks whether an error is transient and safe to retry.
 */
function isTransientError(err: unknown): boolean {
  if (!err) return false;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('deadline exceeded')
  );
}

/**
 * Computes deterministic hash key for concurrent request deduplication.
 */
function computeRequestHash(opName: string, contents: any, systemInstruction?: string): string {
  const str = `${opName}::${typeof contents === 'string' ? contents : JSON.stringify(contents)}::${systemInstruction || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `req_hash_${hash}`;
}

/**
 * Executes a generateContent request with multi-model fallback, request timeouts,
 * exponential retries with jitter, in-flight deduplication, and telemetry diagnostics.
 */
export async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
  models?: readonly string[];
  operationName?: string;
  timeoutMs?: number;
  requestId?: string;
  taskType?: keyof typeof TASK_MAX_OUTPUT_TOKENS;
}): Promise<GenerateResult> {
  const opName = params.operationName || 'Gemini Generation';
  const requestId = params.requestId || createRequestId();
  const startTime = Date.now();
  const models = params.models || GEMINI_GENERATION_MODELS;
  const timeoutMs = params.timeoutMs || 12000;
  const taskType = params.taskType || 'default';
  const maxOutputTokens = params.maxOutputTokens || TASK_MAX_OUTPUT_TOKENS[taskType] || 1500;

  // In-flight request deduplication check
  const dedupKey = computeRequestHash(opName, params.contents, params.systemInstruction);
  const existingInFlight = inFlightRequests.get(dedupKey);
  if (existingInFlight) {
    console.log(`[${opName}] Joining existing in-flight request matching signature.`);
    return existingInFlight;
  }

  // Create generation promise
  const executionPromise = (async () => {
    const ai = getGeminiClient();
    let totalRetries = 0;
    let lastError: Error | null = null;

    for (const modelName of models) {
      let modelAttempt = 0;
      const MAX_MODEL_RETRIES = 2;

      while (modelAttempt <= MAX_MODEL_RETRIES) {
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => {
          controller.abort(new Error(`Model ${modelName} request timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
          console.log(
            `[${opName}] Attempting generation with model "${modelName}" (attempt ${modelAttempt + 1}, req=${requestId})...`
          );

          const timeoutPromise = new Promise<never>((_, reject) => {
            controller.signal.addEventListener(
              'abort',
              () => {
                reject(new Error(`Model ${modelName} timed out after ${timeoutMs}ms`));
              },
              { once: true }
            );
          });

          const response = await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: params.contents,
              config: {
                systemInstruction: params.systemInstruction,
                responseMimeType: params.responseMimeType,
                temperature: params.temperature ?? 0.3,
                maxOutputTokens,
                abortSignal: controller.signal,
                httpOptions: {
                  timeout: timeoutMs,
                },
              },
            }),
            timeoutPromise,
          ]);

          clearTimeout(timeoutTimer);

          const responseText = response.text || '';
          if (!responseText) {
            throw new Error(`Model ${modelName} returned an empty response.`);
          }

          // Extract genuine token counts when provided by the SDK
          let tokenUsage: TokenUsageStats | undefined = undefined;
          if (response.usageMetadata) {
            tokenUsage = {
              promptTokens: response.usageMetadata.promptTokenCount,
              candidatesTokens: response.usageMetadata.candidatesTokenCount,
              totalTokens: response.usageMetadata.totalTokenCount,
            };
          }

          const durationMs = Date.now() - startTime;

          // Record privacy-safe telemetry
          recordAiDiagnostics({
            requestId,
            operationName: opName,
            modelUsed: modelName,
            durationMs,
            status: 'success',
            retryCount: totalRetries,
            tokenUsage,
            isFallback: false,
          });

          return {
            text: responseText,
            modelUsed: modelName,
            requestId,
            durationMs,
            tokenUsage,
            retryCount: totalRetries,
            isFallback: false,
          };
        } catch (err: unknown) {
          clearTimeout(timeoutTimer);
          if (!controller.signal.aborted) {
            controller.abort();
          }

          const errMsg = err instanceof Error ? err.message : String(err);
          lastError = err instanceof Error ? err : new Error(errMsg);

          // Check if error is transient and can be safely retried
          if (isTransientError(err) && modelAttempt < MAX_MODEL_RETRIES) {
            modelAttempt++;
            totalRetries++;
            // Exponential backoff with random jitter
            const backoffDelay = Math.pow(2, modelAttempt) * 200 + Math.floor(Math.random() * 100);
            console.warn(
              `[${opName}] Transient failure on "${modelName}" (${sanitizeLogString(errMsg)}). Retrying in ${backoffDelay}ms...`
            );
            await new Promise((r) => setTimeout(r, backoffDelay));
            continue;
          }

          console.warn(
            `[${opName}] Model "${modelName}" failed (${sanitizeLogString(errMsg)}). Trying next fallback model...`
          );
          break; // Break retry loop to try next model in fallback list
        }
      }
    }

    const durationMs = Date.now() - startTime;
    recordAiDiagnostics({
      requestId,
      operationName: opName,
      modelUsed: models[models.length - 1] || 'none',
      durationMs,
      status: 'error',
      retryCount: totalRetries,
      isFallback: true,
      errorMessage: lastError?.message,
    });

    throw new Error(
      `${opName} failed across all available models (${models.join(', ')}): ${lastError?.message || 'Unknown error'}`
    );
  })();

  // Track in-flight request
  inFlightRequests.set(dedupKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightRequests.delete(dedupKey);
  }
}
