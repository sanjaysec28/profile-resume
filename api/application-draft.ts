/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function Handler for /api/placement/generate-draft
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { generateApplicationDraft } from '../src/server/generateApplicationDraft.ts';

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
      if (!input || !input.job || !input.studentContext) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Missing required job or studentContext in application draft request.',
          })
        );
        return;
      }

      const draft = await generateApplicationDraft(input);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ draft }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      res.statusCode = message.includes('GEMINI_API_KEY') ? 503 : 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  });
}
