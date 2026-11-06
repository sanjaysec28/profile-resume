/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Centralized Gemini Model Configuration & Client Factory
 * Aligned with @google/genai TypeScript SDK and AI Studio model standards.
 * Provides resilient multi-model fallback across generation and review tasks.
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Standard model priorities:
 * 1. 'gemini-3.8-flash' (High-speed, recommended for general text and reasoning)
 * 2. 'gemini-flash-latest' (Universal Google Gen AI Flash alias)
 * 3. 'gemini-3.1-flash-lite' (Resilient lightweight fallback)
 */
export const GEMINI_GENERATION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

export const GEMINI_REVIEW_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
] as const;

/**
 * Returns an initialized GoogleGenAI instance.
 * Validates presence of GEMINI_API_KEY.
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
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper to execute a generateContent request with multi-model fallback.
 */
export async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  models?: readonly string[];
  operationName?: string;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  const models = params.models || GEMINI_GENERATION_MODELS;
  const opName = params.operationName || 'Gemini Generation';

  let lastError: Error | null = null;

  for (const modelName of models) {
    const controller = new AbortController();
    let timeoutTimer: NodeJS.Timeout | null = setTimeout(() => {
      controller.abort(new Error(`Model ${modelName} request timed out after 12s`));
    }, 12000);

    try {
      console.log(`[${opName}] Attempting generation with model "${modelName}"...`);

      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Model ${modelName} timed out after 12s`));
        }, { once: true });
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType,
            temperature: params.temperature,
            abortSignal: controller.signal,
            httpOptions: {
              timeout: 12000,
            },
          },
        }),
        timeoutPromise,
      ]);

      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error(`Model ${modelName} returned an empty response.`);
      }

      console.log(`[${opName}] Successfully generated response with model "${modelName}".`);
      return { text: responseText, modelUsed: modelName };
    } catch (err: unknown) {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      // Ensure aborted if error occurred to close open HTTP sockets
      if (!controller.signal.aborted) {
        controller.abort();
      }

      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[${opName}] Model "${modelName}" attempt failed (${msg}). Trying next fallback...`);
      lastError = err instanceof Error ? err : new Error(msg);
    }
  }

  throw new Error(
    `${opName} failed across all available models (${models.join(', ')}): ${lastError?.message || 'Unknown error'}`
  );
}
