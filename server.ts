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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '5mb' }));

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

  // Secure AI Resume Recommendations endpoint (Phase 2)
  app.post('/api/recommendations', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.targetRole) {
        return res.status(400).json({
          error: 'Missing required targetRole in recommendation input.',
        });
      }

      const recommendations = await generateResumeRecommendations(input);
      return res.json(recommendations);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/recommendations Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Resume Content Assistant endpoint (Phase 3)
  app.post('/api/assistant/content', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.targetRole || !input.section || !input.action) {
        return res.status(400).json({
          error: 'Missing required fields (targetRole, section, or action) in assistant request.',
        });
      }

      const result = await generateResumeContent(input);
      return res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/assistant/content Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Resume Final Review endpoint (Phase 4)
  app.post('/api/assistant/review', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.targetRole || !input.resumeData) {
        return res.status(400).json({
          error: 'Missing required fields (targetRole or resumeData) in review request.',
        });
      }

      const review = await generateResumeReview(input);
      return res.json(review);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/assistant/review Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Career Intelligence Roadmap endpoint (Phase 5)
  app.post('/api/career/generate-plan', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.targetRole) {
        return res.status(400).json({
          error: 'Missing required targetRole in career plan request.',
        });
      }

      const planResult = await generateCareerRoadmapPlan(input);
      return res.json(planResult);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/career/generate-plan Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Career Assistant Q&A Chat endpoint (Phase 5)
  app.post('/api/career/assistant-chat', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.question) {
        return res.status(400).json({
          error: 'Missing required question in career assistant chat request.',
        });
      }

      const reply = await answerCareerQuestion(input);
      return res.json({ reply });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/career/assistant-chat Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Interview Question Generator endpoint (Phase 6)
  app.post('/api/interview/generate-questions', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.targetRole) {
        return res.status(400).json({
          error: 'Missing required targetRole in interview question request.',
        });
      }

      const questions = await generateInterviewQuestions(input);
      return res.json({ questions });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/interview/generate-questions Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Interview Answer Evaluation endpoint (Phase 6)
  app.post('/api/interview/evaluate-answer', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.question) {
        return res.status(400).json({
          error: 'Missing required question in answer evaluation request.',
        });
      }

      const evaluation = await evaluateInterviewAnswer(input);
      return res.json({ evaluation });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/interview/evaluate-answer Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Interview Coach Chat endpoint (Phase 6)
  app.post('/api/interview/coach-chat', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.message) {
        return res.status(400).json({
          error: 'Missing required message in interview coach request.',
        });
      }

      const reply = await chatWithInterviewCoach(input);
      return res.json({ reply });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/interview/coach-chat Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
    }
  });

  // Secure AI Application Draft Assistant endpoint (Phase 7)
  app.post('/api/placement/generate-draft', async (req: Request, res: Response) => {
    try {
      const input = req.body;
      if (!input || !input.job || !input.studentContext) {
        return res.status(400).json({
          error: 'Missing required job or studentContext in application draft request.',
        });
      }

      const draft = await generateApplicationDraft(input);
      return res.json({ draft });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[API /api/placement/generate-draft Error]:', message);

      const status = message.includes('GEMINI_API_KEY') ? 503 : 500;
      return res.status(status).json({
        error: message,
      });
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
