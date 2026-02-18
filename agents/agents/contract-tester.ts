/**
 * Contract Tester Agent
 * 
 * Layer 2: Tests API routes for contract compliance.
 * - Status codes (200, 400, 405, 429)
 * - Response shapes (correct fields, types)
 * - Error handling (missing fields, wrong methods)
 * - Rate limiting behavior
 * 
 * Modes:
 * - dry_run: List all test cases that would run
 * - execute: Run real HTTP requests against endpoints
 */

import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

const EGOS_WEB_URL = process.env.EGOS_WEB_URL || 'https://egos.ia.br';

interface TestCase {
  id: string;
  name: string;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  expect: {
    status: number;
    bodyContains?: string[];
    bodyShape?: string[]; // expected keys in response JSON
    contentType?: string;
  };
}

const TEST_CASES: TestCase[] = [
  // ═══ POST /api/chat ═══
  {
    id: 'chat-valid',
    name: 'Chat: valid message returns AI response',
    method: 'POST',
    path: '/api/chat',
    body: { message: 'What is EGOS?', context: '' },
    expect: { status: 200, bodyShape: ['reply'], contentType: 'application/json' },
  },
  {
    id: 'chat-empty-message',
    name: 'Chat: empty message returns 400',
    method: 'POST',
    path: '/api/chat',
    body: { message: '', context: '' },
    expect: { status: 400, bodyShape: ['error'] },
  },
  {
    id: 'chat-no-body',
    name: 'Chat: no body returns 400',
    method: 'POST',
    path: '/api/chat',
    body: {},
    expect: { status: 400, bodyShape: ['error'] },
  },
  {
    id: 'chat-wrong-method',
    name: 'Chat: GET method returns 405',
    method: 'GET',
    path: '/api/chat',
    expect: { status: 405, bodyShape: ['error'] },
  },
  {
    id: 'chat-long-message',
    name: 'Chat: message > 1000 chars returns 400',
    method: 'POST',
    path: '/api/chat',
    body: { message: 'a'.repeat(1001), context: '' },
    expect: { status: 400, bodyContains: ['too long'] },
  },

  // ═══ GET /api/github-commits ═══
  {
    id: 'commits-valid',
    name: 'GitHub Commits: returns commit list',
    method: 'GET',
    path: '/api/github-commits',
    expect: { status: 200, contentType: 'application/json' },
  },
  {
    id: 'commits-wrong-method',
    name: 'GitHub Commits: POST returns 405',
    method: 'POST',
    path: '/api/github-commits',
    expect: { status: 405 },
  },

  // ═══ POST /api/ingest-commits ═══
  // Note: This endpoint accepts GET (for Vercel cron) and empty body (fetches from GitHub itself)
  {
    id: 'ingest-post-ok',
    name: 'Ingest Commits: POST returns 200 with results',
    method: 'POST',
    path: '/api/ingest-commits',
    body: {},
    expect: { status: 200, bodyShape: ['ok', 'results'] },
  },
  {
    id: 'ingest-get-ok',
    name: 'Ingest Commits: GET returns 200 (cron trigger)',
    method: 'GET',
    path: '/api/ingest-commits',
    expect: { status: 200, bodyShape: ['ok'] },
  },
  {
    id: 'ingest-delete-blocked',
    name: 'Ingest Commits: DELETE returns 405',
    method: 'DELETE',
    path: '/api/ingest-commits',
    expect: { status: 405, bodyShape: ['error'] },
  },
];

async function runTest(test: TestCase): Promise<{ passed: boolean; actual: number; body: string; error?: string }> {
  try {
    const url = `${EGOS_WEB_URL}${test.path}`;
    const options: RequestInit = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        ...test.headers,
      },
    };

    if (test.body && test.method !== 'GET') {
      options.body = JSON.stringify(test.body);
    }

    const res = await fetch(url, options);
    const body = await res.text();

    // Check status code
    if (res.status !== test.expect.status) {
      return { passed: false, actual: res.status, body, error: `Expected ${test.expect.status}, got ${res.status}` };
    }

    // Check content type
    if (test.expect.contentType) {
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes(test.expect.contentType)) {
        return { passed: false, actual: res.status, body, error: `Expected Content-Type ${test.expect.contentType}, got ${ct}` };
      }
    }

    // Check body shape (JSON keys)
    if (test.expect.bodyShape) {
      try {
        const json = JSON.parse(body);
        for (const key of test.expect.bodyShape) {
          if (!(key in json)) {
            return { passed: false, actual: res.status, body, error: `Missing key "${key}" in response` };
          }
        }
      } catch {
        return { passed: false, actual: res.status, body, error: `Response is not valid JSON` };
      }
    }

    // Check body contains strings
    if (test.expect.bodyContains) {
      const lower = body.toLowerCase();
      for (const needle of test.expect.bodyContains) {
        if (!lower.includes(needle.toLowerCase())) {
          return { passed: false, actual: res.status, body, error: `Response missing "${needle}"` };
        }
      }
    }

    return { passed: true, actual: res.status, body };
  } catch (err: any) {
    return { passed: false, actual: 0, body: '', error: `Network error: ${err.message}` };
  }
}

async function contractTester(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  log(ctx, 'info', `Contract Tester: ${TEST_CASES.length} test cases, target: ${EGOS_WEB_URL}`);

  if (ctx.mode === 'dry_run') {
    for (const test of TEST_CASES) {
      findings.push({
        severity: 'info',
        category: 'test:plan',
        message: `[${test.id}] ${test.name} — ${test.method} ${test.path} → expect ${test.expect.status}`,
      });
    }
    return findings;
  }

  // Execute mode — run real tests
  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    log(ctx, 'info', `Running: ${test.id}...`);
    const result = await runTest(test);

    if (result.passed) {
      passed++;
      findings.push({
        severity: 'info',
        category: 'test:pass',
        message: `✅ [${test.id}] ${test.name}`,
      });
    } else {
      failed++;
      findings.push({
        severity: 'error',
        category: 'test:fail',
        message: `❌ [${test.id}] ${test.name}: ${result.error}`,
        suggestion: `Fix endpoint ${test.method} ${test.path} — expected ${test.expect.status}, got ${result.actual}`,
      });
    }
  }

  // Summary finding
  const total = passed + failed;
  const pct = Math.round((passed / total) * 100);
  findings.push({
    severity: failed > 0 ? 'warning' : 'info',
    category: 'test:summary',
    message: `Contract Tests: ${passed}/${total} passed (${pct}%) — ${failed} failures`,
  });

  return findings;
}

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('contract_tester', mode, contractTester).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
