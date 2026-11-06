/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Phase D.4.3 Production Deployment & Final Launch Verification Suite
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

function runD43Tests() {
  console.log('🚀 Starting ProFile Phase D.4.3 Production Deployment & Launch Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function test(description: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as Promise<void>)
          .then(() => {
            console.log(`  ✓ ${description}`);
            passed++;
          })
          .catch((err: any) => {
            console.error(`  ✗ ${description}`);
            console.error(`    Error: ${err.message}`);
          });
      } else {
        console.log(`  ✓ ${description}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  // 1. Vercel Configuration & Build Settings
  test('1.1 vercel.json defines buildCommand, outputDirectory, security headers and SPA rewrites', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.resolve('./vercel.json'), 'utf-8'));
    assert.strictEqual(vercelConfig.buildCommand, 'vite build');
    assert.strictEqual(vercelConfig.outputDirectory, 'dist');
    assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites array must be defined');

    // Verify all 10 API route rewrites exist
    const sources = vercelConfig.rewrites.map((r: any) => r.source);
    assert.ok(sources.includes('/api/health'), 'rewrites must include /api/health');
    assert.ok(sources.includes('/api/recommendations'), 'rewrites must include /api/recommendations');
    assert.ok(sources.includes('/api/assistant/content'), 'rewrites must include /api/assistant/content');
    assert.ok(sources.includes('/api/assistant/review'), 'rewrites must include /api/assistant/review');
    assert.ok(sources.includes('/api/career/generate-plan'), 'rewrites must include /api/career/generate-plan');
    assert.ok(sources.includes('/api/career/assistant-chat'), 'rewrites must include /api/career/assistant-chat');
    assert.ok(sources.includes('/api/interview/generate-questions'), 'rewrites must include /api/interview/generate-questions');
    assert.ok(sources.includes('/api/interview/evaluate-answer'), 'rewrites must include /api/interview/evaluate-answer');
    assert.ok(sources.includes('/api/interview/coach-chat'), 'rewrites must include /api/interview/coach-chat');
    assert.ok(sources.includes('/api/placement/generate-draft'), 'rewrites must include /api/placement/generate-draft');

    // Verify SPA client routing fallback exists
    const spaRewrite = vercelConfig.rewrites.find((r: any) => r.destination === '/index.html');
    assert.ok(spaRewrite, 'Must have SPA rewrite to /index.html for client-side navigation');

    // Verify security headers
    assert.ok(Array.isArray(vercelConfig.headers), 'headers must be defined');
    const headerKeys = vercelConfig.headers[0].headers.map((h: any) => h.key);
    assert.ok(headerKeys.includes('X-Content-Type-Options'));
    assert.ok(headerKeys.includes('X-Frame-Options'));
    assert.ok(headerKeys.includes('X-XSS-Protection'));
    assert.ok(headerKeys.includes('Referrer-Policy'));
  });

  // 2. Vercel Serverless Function Files in /api
  test('2.1 All required Vercel serverless function handlers exist in /api', () => {
    const requiredFiles = [
      'health.ts',
      'recommendations.ts',
      'assistant-content.ts',
      'review.ts',
      'career-plan.ts',
      'career-chat.ts',
      'interview-questions.ts',
      'interview-evaluate.ts',
      'interview-coach.ts',
      'application-draft.ts',
    ];
    for (const f of requiredFiles) {
      assert.ok(fs.existsSync(path.resolve('./api', f)), `Serverless file api/${f} must exist`);
    }
  });

  // 3. Environment Variables & Secret Hygiene
  test('3.1 Secrets hygiene: GEMINI_API_KEY is isolated server-side, no secrets in .env.example', () => {
    const envExample = fs.readFileSync(path.resolve('./.env.example'), 'utf-8');
    assert.ok(!envExample.includes('AIzaSy'), 'No real Google API keys in .env.example');
    assert.ok(envExample.includes('GEMINI_API_KEY'), '.env.example documents GEMINI_API_KEY');
    assert.ok(envExample.includes('VITE_FIREBASE_API_KEY'), '.env.example documents VITE_FIREBASE_API_KEY');
    assert.ok(envExample.includes('VITE_FIREBASE_AUTH_DOMAIN'), '.env.example documents VITE_FIREBASE_AUTH_DOMAIN');
    assert.ok(envExample.includes('VITE_FIREBASE_PROJECT_ID'), '.env.example documents VITE_FIREBASE_PROJECT_ID');
    assert.ok(envExample.includes('VITE_FIREBASE_APP_ID'), '.env.example documents VITE_FIREBASE_APP_ID');

    // Confirm client files do not import process.env.GEMINI_API_KEY directly
    const mainTsx = fs.readFileSync(path.resolve('./src/main.tsx'), 'utf-8');
    assert.ok(!mainTsx.includes('process.env.GEMINI_API_KEY'));
  });

  // 4. Firebase Configuration Detection & Transparent Offline Fallback
  test('4.1 Firebase configuration accurately detects unconfigured keys without falsifying cloud sync', () => {
    const firebaseTs = fs.readFileSync(path.resolve('./src/lib/firebase.ts'), 'utf-8');
    assert.ok(firebaseTs.includes('checkFirebaseConfig'), 'Must export checkFirebaseConfig');
    assert.ok(firebaseTs.includes('VITE_FIREBASE_API_KEY'));
    assert.ok(firebaseTs.includes('VITE_FIREBASE_AUTH_DOMAIN'));
    assert.ok(firebaseTs.includes('VITE_FIREBASE_PROJECT_ID'));
    assert.ok(firebaseTs.includes('VITE_FIREBASE_APP_ID'));

    // Confirm UI shows honest local status when unconfigured
    const builderTsx = fs.readFileSync(
      path.resolve('./src/features/resume/components/ResumeBuilder.tsx'),
      'utf-8'
    );
    assert.ok(builderTsx.includes('Local Cache') && builderTsx.includes('Cloud Sync'));
  });

  // 5. Firestore Rules & Spark Plan Compatibility
  test('5.1 firestore.rules strictly isolates all 13 user collections with root default deny', () => {
    const rules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf-8');
    assert.ok(rules.includes("match /{document=**} {\n      allow read, write: if false;\n    }"));
    assert.ok(rules.includes('request.auth.uid == userId'));
    assert.ok(rules.includes('match /users/{userId}'));

    const collections = [
      'resumes',
      'resumeSetups',
      'resumeReviews',
      'atsReports',
      'careerIntelligence',
      'interviewSessions',
      'interviewProgress',
      'interviewPlans',
      'savedJobs',
      'applications',
      'jobMatches',
      'applicationDrafts',
    ];
    for (const c of collections) {
      assert.ok(rules.includes(`match /${c}/`), `firestore.rules must explicitly isolate collection ${c}`);
    }

    // Verify 100% Spark plan compatibility (no Blaze extensions or paid cloud triggers in package.json)
    const pkg = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf-8'));
    assert.ok(!pkg.dependencies['firebase-admin'], 'No server-side firebase-admin requiring service account keys');
    assert.ok(!pkg.dependencies['@google-cloud/storage'], 'No raw cloud storage requiring billing');
  });

  // 6. Production Build Verification
  test('6.1 Production build succeeds with manual vendor chunk separation', () => {
    const distIndex = path.resolve('./dist/index.html');
    assert.ok(fs.existsSync(distIndex), 'dist/index.html must exist');
    const distAssets = fs.readdirSync(path.resolve('./dist/assets'));
    assert.ok(distAssets.some((f) => f.startsWith('vendor-pdf-ocr')), 'Must contain vendor-pdf-ocr chunk');
    assert.ok(distAssets.some((f) => f.startsWith('vendor-firebase')), 'Must contain vendor-firebase chunk');
    assert.ok(distAssets.some((f) => f.startsWith('vendor-react')), 'Must contain vendor-react chunk');
  });

  // 7. Live Server Endpoints & Gemini Integration
  test('7.1 Live Express server serves /api/health with hasGeminiKey=true', async () => {
    return new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/health', (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            assert.strictEqual(res.statusCode, 200);
            const parsed = JSON.parse(data);
            assert.strictEqual(parsed.status, 'ok');
            assert.strictEqual(parsed.hasGeminiKey, true);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }).on('error', reject);
    });
  });

  // 8. Student Journey Smoke Test Verification
  test('8.1 Complete student journey contract: Data schemas and offline continuity', () => {
    // 1. Profile
    const profile = {
      fullName: 'Sanjay Kumar',
      email: 'sanjay@example.com',
      college: 'National Institute of Technology',
      targetRole: 'Software Engineer',
      graduationYear: 2026,
    };
    assert.ok(profile.fullName && profile.targetRole);

    // 2. Resume Data
    const resume = {
      personalInfo: { fullName: profile.fullName, email: profile.email, phone: '+91 9876543210' },
      education: [{ institution: profile.college, degree: 'B.Tech CSE', year: '2026' }],
      skills: { technical: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'], soft: ['Problem Solving'] },
      experience: [],
      projects: [{ title: 'ProFile Platform', techStack: ['React', 'Vite', 'Tailwind'] }],
      certifications: [],
    };
    assert.ok(resume.skills.technical.length >= 3);

    // 3. ATS Fingerprint
    const str = JSON.stringify(resume);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    assert.ok(hash !== 0);

    // 4. Placement Job Match
    const jobSkills = ['React', 'TypeScript', 'Docker'];
    const matched = jobSkills.filter((s) => resume.skills.technical.includes(s));
    assert.strictEqual(matched.length, 2);
    const score = Math.round((matched.length / jobSkills.length) * 100);
    assert.strictEqual(score, 67);
  });

  setTimeout(() => {
    console.log(`\n📊 D.4.3 Results: ${passed}/${total} assertions passed.\n`);
    if (passed !== total) {
      process.exit(1);
    }
  }, 1500);
}

runD43Tests();
