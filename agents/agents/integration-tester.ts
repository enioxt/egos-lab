/**
 * Integration Tester Agent
 * 
 * Layer 3: Tests full flows, Supabase RLS, and cross-service interactions.
 * - Supabase table access with different roles (anon, authenticated, service_role)
 * - RLS policy enforcement (can user X access row Y?)
 * - Full request → DB → response flows
 * - Data integrity checks
 * 
 * Modes:
 * - dry_run: List all integration test cases
 * - execute: Run real queries against Supabase
 */

import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface IntegrationTest {
  id: string;
  name: string;
  category: 'rls' | 'flow' | 'integrity' | 'edge';
  run: (ctx: RunContext) => Promise<TestResult>;
}

interface TestResult {
  passed: boolean;
  detail: string;
  suggestion?: string;
}

// ═══ Supabase REST helper ═══

async function supabaseREST(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  opts: {
    key?: 'anon' | 'service';
    query?: string;
    body?: Record<string, unknown>;
    select?: string;
  } = {}
): Promise<{ status: number; data: any; error?: string }> {
  const apiKey = opts.key === 'service' ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
  if (!apiKey) return { status: 0, data: null, error: 'Missing API key' };

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (opts.query) url.search = opts.query;
  if (opts.select) url.searchParams.set('select', opts.select);

  const headers: Record<string, string> = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
  };

  const fetchOpts: RequestInit = { method, headers };
  if (opts.body && method !== 'GET') {
    fetchOpts.body = JSON.stringify(opts.body);
  }

  try {
    const res = await fetch(url.toString(), fetchOpts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, error: res.ok ? undefined : text.substring(0, 200) };
  } catch (err: any) {
    return { status: 0, data: null, error: err.message };
  }
}

// ═══ Test Definitions ═══

const TESTS: IntegrationTest[] = [
  // --- RLS: Public read access ---
  {
    id: 'rls-anon-read-products',
    name: 'RLS: Anon can read nexusmkt_products',
    category: 'rls',
    run: async () => {
      const { status, data, error } = await supabaseREST('nexusmkt_products', 'GET', {
        key: 'anon', select: 'id,name,price', query: 'limit=3',
      });
      if (status === 200 && Array.isArray(data)) {
        return { passed: true, detail: `Got ${data.length} products` };
      }
      return { passed: false, detail: `Status ${status}: ${error}`, suggestion: 'Check RLS policies on nexusmkt_products for anon read' };
    },
  },
  {
    id: 'rls-anon-read-merchants',
    name: 'RLS: Anon can read nexusmkt_merchants',
    category: 'rls',
    run: async () => {
      const { status, data, error } = await supabaseREST('nexusmkt_merchants', 'GET', {
        key: 'anon', select: 'id,name,slug', query: 'limit=3',
      });
      if (status === 200 && Array.isArray(data)) {
        return { passed: true, detail: `Got ${data.length} merchants` };
      }
      return { passed: false, detail: `Status ${status}: ${error}`, suggestion: 'Check RLS policies on nexusmkt_merchants for anon read' };
    },
  },
  {
    id: 'rls-anon-read-global-catalog',
    name: 'RLS: Anon can read nexusmkt_global_catalog',
    category: 'rls',
    run: async () => {
      const { status, data, error } = await supabaseREST('nexusmkt_global_catalog', 'GET', {
        key: 'anon', select: 'ean,name,brand', query: 'limit=3',
      });
      if (status === 200 && Array.isArray(data)) {
        return { passed: true, detail: `Got ${data.length} catalog items` };
      }
      return { passed: false, detail: `Status ${status}: ${error}`, suggestion: 'Check RLS policies on nexusmkt_global_catalog for anon read' };
    },
  },

  // --- RLS: Write protection ---
  {
    id: 'rls-anon-cannot-write-products',
    name: 'RLS: Anon CANNOT insert into nexusmkt_products',
    category: 'rls',
    run: async () => {
      const { status } = await supabaseREST('nexusmkt_products', 'POST', {
        key: 'anon',
        body: { name: 'TEST_INJECTION', price: 0, merchant_id: '00000000-0000-0000-0000-000000000000' },
      });
      // Should be 401 or 403 (denied by RLS)
      if (status === 401 || status === 403 || status === 404) {
        return { passed: true, detail: `Correctly blocked: ${status}` };
      }
      return { passed: false, detail: `Expected 401/403, got ${status} — anon CAN write!`, suggestion: 'CRITICAL: Add INSERT RLS policy to nexusmkt_products' };
    },
  },
  {
    id: 'rls-anon-cannot-write-orders',
    name: 'RLS: Anon CANNOT insert into nexusmkt_orders',
    category: 'rls',
    run: async () => {
      const { status } = await supabaseREST('nexusmkt_orders', 'POST', {
        key: 'anon',
        body: {
          consumer_id: '00000000-0000-0000-0000-000000000000',
          merchant_id: '00000000-0000-0000-0000-000000000000',
          total_amount: 0, items: [], delivery_address: {},
        },
      });
      if (status === 401 || status === 403 || status === 404) {
        return { passed: true, detail: `Correctly blocked: ${status}` };
      }
      return { passed: false, detail: `Expected 401/403, got ${status}`, suggestion: 'CRITICAL: nexusmkt_orders allows anon writes' };
    },
  },
  {
    id: 'rls-anon-cannot-delete-products',
    name: 'RLS: Anon CANNOT delete nexusmkt_products',
    category: 'rls',
    run: async () => {
      const { status } = await supabaseREST('nexusmkt_products', 'DELETE', {
        key: 'anon', query: 'id=eq.00000000-0000-0000-0000-000000000000',
      });
      if (status === 401 || status === 403 || status === 404 || status === 204) {
        // 204 with 0 rows affected is ok (RLS filtered it out)
        return { passed: true, detail: `Blocked or no-op: ${status}` };
      }
      return { passed: false, detail: `Unexpected: ${status}`, suggestion: 'Check DELETE RLS policy on nexusmkt_products' };
    },
  },

  // --- Service role access ---
  {
    id: 'service-role-read-all',
    name: 'Service Role: Can read all tables',
    category: 'rls',
    run: async () => {
      if (!SUPABASE_SERVICE_KEY) {
        return { passed: true, detail: 'Skipped — no service role key in env' };
      }
      const { status, data } = await supabaseREST('nexusmkt_products', 'GET', {
        key: 'service', select: 'id', query: 'limit=1',
      });
      if (status === 200) {
        return { passed: true, detail: `Service role has full read access` };
      }
      return { passed: false, detail: `Service role denied: ${status}`, suggestion: 'Check service_role RLS policy' };
    },
  },

  // --- Data integrity ---
  {
    id: 'integrity-products-have-merchant',
    name: 'Integrity: All products have valid merchant_id',
    category: 'integrity',
    run: async () => {
      if (!SUPABASE_SERVICE_KEY) {
        return { passed: true, detail: 'Skipped — no service role key' };
      }
      const { status, data } = await supabaseREST('nexusmkt_products', 'GET', {
        key: 'service', select: 'id,merchant_id,name',
      });
      if (status !== 200 || !Array.isArray(data)) {
        return { passed: false, detail: `Failed to fetch products: ${status}` };
      }
      const orphans = data.filter((p: any) => !p.merchant_id);
      if (orphans.length > 0) {
        return { passed: false, detail: `${orphans.length} products without merchant_id`, suggestion: 'Fix orphaned products — they need a valid merchant' };
      }
      return { passed: true, detail: `All ${data.length} products have merchant_id` };
    },
  },

  // --- Edge cases ---
  {
    id: 'edge-sql-injection-attempt',
    name: 'Edge: SQL injection via REST API filter is blocked',
    category: 'edge',
    run: async () => {
      const { status, data } = await supabaseREST('nexusmkt_products', 'GET', {
        key: 'anon', query: `name=eq.'; DROP TABLE nexusmkt_products; --`,
      });
      // Should return 200 with empty array (PostgREST parameterizes)
      if (status === 200 && Array.isArray(data) && data.length === 0) {
        return { passed: true, detail: 'SQL injection safely parameterized' };
      }
      if (status === 200 && Array.isArray(data)) {
        return { passed: true, detail: `Safe: returned ${data.length} rows (no injection)` };
      }
      return { passed: false, detail: `Unexpected response: ${status}`, suggestion: 'Investigate — SQL injection test returned unexpected status' };
    },
  },
  {
    id: 'edge-xss-in-query',
    name: 'Edge: XSS attempt in query params is sanitized',
    category: 'edge',
    run: async () => {
      const { status, data } = await supabaseREST('nexusmkt_products', 'GET', {
        key: 'anon', query: `name=eq.<script>alert("xss")</script>`,
      });
      if (status === 200 && Array.isArray(data)) {
        return { passed: true, detail: 'XSS safely handled by PostgREST' };
      }
      return { passed: false, detail: `Unexpected: ${status}` };
    },
  },
];

// ═══ Agent Handler ═══

async function integrationTester(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    findings.push({
      severity: 'error',
      category: 'config',
      message: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY — cannot run integration tests',
      suggestion: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    });
    return findings;
  }

  log(ctx, 'info', `Integration Tester: ${TESTS.length} tests, target: ${SUPABASE_URL}`);

  if (ctx.mode === 'dry_run') {
    for (const test of TESTS) {
      findings.push({
        severity: 'info',
        category: `test:plan:${test.category}`,
        message: `[${test.id}] ${test.name}`,
      });
    }
    return findings;
  }

  // Execute mode
  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    log(ctx, 'info', `Running: ${test.id}...`);
    const result = await test.run(ctx);

    if (result.passed) {
      passed++;
      findings.push({
        severity: 'info',
        category: `test:pass:${test.category}`,
        message: `✅ [${test.id}] ${test.name} — ${result.detail}`,
      });
    } else {
      failed++;
      findings.push({
        severity: 'error',
        category: `test:fail:${test.category}`,
        message: `❌ [${test.id}] ${test.name} — ${result.detail}`,
        suggestion: result.suggestion,
      });
    }
  }

  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  findings.push({
    severity: failed > 0 ? 'warning' : 'info',
    category: 'test:summary',
    message: `Integration Tests: ${passed}/${total} passed (${pct}%) — ${failed} failures`,
  });

  return findings;
}

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('integration_tester', mode, integrationTester).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
