/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vercel Serverless Function Handler for /api/assistant/content
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { generateResumeContent } from '../src/server/generateContent.ts';

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
      if (!input || !input.targetRole || !input.section || !input.action) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Missing required fields (targetRole, section, or action) in assistant request.',
          })
        );
        return;
      }

      const result = await generateResumeContent(input);
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
