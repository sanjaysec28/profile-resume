/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Full-Stack Server
 * Express entry point mounting Vite dev middlewares in development
 * and serving production assets in deployment, with secure server-side AI endpoints.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateResumeRecommendations } from './src/server/generateRecommendations.ts';
import { generateResumeContent } from './src/server/generateContent.ts';
import { generateResumeReview } from './src/server/generateReview.ts';
import { generateCareerRoadmapPlan } from './src/server/generateCareerPlan.ts';
import { answerCareerQuestion } from './src/server/careerAssistantChat.ts';
import { generateInterviewQuestions } from './src/server/generateInterviewQuestions.ts';
import { evaluateInterviewAnswer } from './src/server/evaluateInterviewAnswer.ts';
import { chatWithInterviewCoach } from './src/server/interviewCoachChat.ts';
import { generateApplicationDraft } from './src/server/generateApplicationDraft.ts';
import { processUnifiedAssistantChat } from './src/server/unifiedAssistantChat.ts';

import { getGeminiClient } from './src/server/geminiConfig.ts';
import { aiRateLimiterMiddleware } from './src/server/aiRateLimiter.ts';
import { createStructuredAiError, validateAiRequestBody } from './src/server/aiSecurity.ts';
import { getAiDiagnosticsHistory, createRequestId } from './src/server/aiDiagnostics.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '5mb' }));

  // Attach request ID and rate limiter to all API endpoints (Phase D.7.3)
  app.use('/api', (req: Request, res: Response, next) => {
    const reqId = (req.headers['x-request-id'] as string) || createRequestId();
    res.setHeader('X-Request-Id', reqId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/api', aiRateLimiterMiddleware);

  // Observability & Diagnostics buffer audit endpoint (Phase D.7.3)
  app.get('/api/audit/ai-diagnostics', (_req: Request, res: Response) => {
    const history = getAiDiagnosticsHistory();
    return res.json({
      status: 'ok',
      totalRecorded: history.length,
      recentDiagnostics: history,
    });
  });

  // Health and provider status endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    res.json({
      status: 'ok',
      hasGeminiKey: hasKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Targeted model audit endpoint for Phase D.2.2 (tests each model independently without fallback)
  app.get('/api/audit/test-model', async (req: Request, res: Response) => {
    const model = (req.query.model as string) || 'gemini-3.8-flash';
    const start = Date.now();
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model,
        contents: 'Reply with the single word: "AVAILABLE"',
      });
      return res.json({
        model,
        status: 'AVAILABLE',
        httpStatus: 200,
        latencyMs: Date.now() - start,
        text: (response.text || '').trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return res.status(502).json({
        model,
        status: 'ERROR',
        httpStatus: 502,
        latencyMs: Date.now() - start,
        error: msg,
      });
    }
  });

  // Standardized response helpers for Phase D.7.3
  function respondStructuredError(
    res: Response,
    status: number,
    code: Parameters<typeof createStructuredAiError>[0],
    message: string,
    options?: { isTransient?: boolean; retryAfter?: number; details?: Record<string, any> }
  ) {
    const reqId = (res.getHeader('X-Request-Id') as string) || '';
    const payload = createStructuredAiError(code, message, {
      requestId: reqId,
      isTransient: options?.isTransient,
      retryAfter: options?.retryAfter,
      details: options?.details,
    });
    return res.status(status).json({
      message,
      ...payload,
    });
  }

  function handleEndpointCatch(err: unknown, res: Response, endpointName: string) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API ${endpointName} Error]:`, message);

    if (message.includes('GEMINI_API_KEY')) {
      return respondStructuredError(res, 503, 'AI_SERVICE_UNAVAILABLE', message, { isTransient: false });
    }
    if (message.includes('timed out') || message.includes('ETIMEDOUT') || message.includes('DEADLINE_EXCEEDED')) {
      return respondStructuredError(res, 504, 'GENERATION_TIMEOUT', message, { isTransient: true });
    }
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('rate limit')) {
      return respondStructuredError(res, 429, 'RATE_LIMIT_EXCEEDED', message, { isTransient: true, retryAfter: 5 });
    }
    return respondStructuredError(res, 500, 'INTERNAL_ERROR', message, { isTransient: false });
  }

  // 1. Secure AI Resume Recommendations endpoint (Phase 2)
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['targetRole']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required targetRole.');
      }

      const recommendations = await generateResumeRecommendations(req.body);
      if (recommendations && (recommendations as any).modelUsed) {
        res.setHeader('X-AI-Model', (recommendations as any).modelUsed);
      }
      return res.json(recommendations);
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/recommendations');
    }
  });

  // 2. Secure AI Resume Content Assistant endpoint (Phase 3)
  app.post('/api/assistant/content', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['targetRole', 'section', 'action']);
      if (!validation.valid) {
        return respondStructuredError(
          res,
          400,
          'MISSING_INPUT',
          validation.reason || 'Missing required fields (targetRole, section, or action).'
        );
      }

      const result = await generateResumeContent(req.body);
      if (result && result.modelUsed) {
        res.setHeader('X-AI-Model', result.modelUsed);
      }
      return res.json(result);
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/assistant/content');
    }
  });

  // 3. Secure AI Resume Final Review endpoint (Phase 4)
  app.post('/api/assistant/review', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['targetRole', 'resumeData']);
      if (!validation.valid) {
        return respondStructuredError(
          res,
          400,
          'MISSING_INPUT',
          validation.reason || 'Missing required fields (targetRole or resumeData).'
        );
      }

      const review = await generateResumeReview(req.body);
      if (review && (review as any).modelUsed) {
        res.setHeader('X-AI-Model', (review as any).modelUsed);
      }
      return res.json(review);
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/assistant/review');
    }
  });

  // 4. Secure AI Career Intelligence Roadmap endpoint (Phase 5)
  app.post('/api/career/generate-plan', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['targetRole']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required targetRole.');
      }

      const planResult = await generateCareerRoadmapPlan(req.body);
      if (planResult && (planResult as any).modelUsed) {
        res.setHeader('X-AI-Model', (planResult as any).modelUsed);
      }
      return res.json(planResult);
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/career/generate-plan');
    }
  });

  // 5. Secure AI Career Assistant Q&A Chat endpoint (Phase 5)
  app.post('/api/career/assistant-chat', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['question']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required question.');
      }

      const reply = await answerCareerQuestion(req.body);
      return res.json({ reply });
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/career/assistant-chat');
    }
  });

  // 6. Secure AI Interview Question Generator endpoint (Phase 6)
  app.post('/api/interview/generate-questions', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['targetRole']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required targetRole.');
      }

      const questions = await generateInterviewQuestions(req.body);
      return res.json({ questions });
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/interview/generate-questions');
    }
  });

  // 7. Secure AI Interview Answer Evaluation endpoint (Phase 6)
  app.post('/api/interview/evaluate-answer', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['question']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required question.');
      }

      const evaluation = await evaluateInterviewAnswer(req.body);
      return res.json({ evaluation });
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/interview/evaluate-answer');
    }
  });

  // 8. Secure AI Interview Coach Chat endpoint (Phase 6)
  app.post('/api/interview/coach-chat', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['message']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required message.');
      }

      const reply = await chatWithInterviewCoach(req.body);
      return res.json({ reply });
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/interview/coach-chat');
    }
  });

  // 9. Secure AI Application Draft Assistant endpoint (Phase 7)
  app.post('/api/placement/generate-draft', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['job', 'studentContext']);
      if (!validation.valid) {
        return respondStructuredError(
          res,
          400,
          'MISSING_INPUT',
          validation.reason || 'Missing required job or studentContext.'
        );
      }

      const draft = await generateApplicationDraft(req.body);
      if (draft && (draft as any).modelUsed) {
        res.setHeader('X-AI-Model', (draft as any).modelUsed);
      }
      return res.json({ draft });
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/placement/generate-draft');
    }
  });

  // 10. Secure Unified AI Assistant & Cross-Module Intelligence endpoint (Phase D.7.1)
  app.post('/api/assistant/unified-chat', async (req: Request, res: Response) => {
    try {
      const validation = validateAiRequestBody(req.body, ['message']);
      if (!validation.valid) {
        return respondStructuredError(res, 400, 'MISSING_INPUT', validation.reason || 'Missing required message.');
      }

      const result = await processUnifiedAssistantChat(req.body);
      if (result && result.modelUsed) {
        res.setHeader('X-AI-Model', result.modelUsed);
      }
      return res.json(result);
    } catch (err: unknown) {
      return handleEndpointCatch(err, res, '/api/assistant/unified-chat');
    }
  });

  // Development vs Production serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProFile Server] Running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[ProFile Server Startup Error]:', err);
  process.exit(1);
});
