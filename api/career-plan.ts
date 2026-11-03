/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function Handler for /api/career/generate-plan
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { generateCareerRoadmapPlan } from '../src/server/generateCareerPlan.ts';

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let bodyData = '';
  req.on('data', (chunk) => {
    bodyData += chunk;
  });

  req.on('end', async () => {
    try {
      const input = JSON.parse(bodyData || '{}');
      if (!input || !input.targetRole) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Missing required targetRole in career plan request.',
          })
        );
        return;
      }

      const result = await generateCareerRoadmapPlan(input);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.statusCode = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  });
}
