# EGOS Testing Architecture — Agents Testing Agents

> **VERSION:** 1.0.0 | **Created:** 2026-02-18
> **Philosophy:** Real tests close to production. AI computational power for verification. Agents that test, improve, and orchestrate each other.

---

## Why This Exists

Traditional unit tests become useless over time. They test implementation details, not behavior. They mock away the real complexity. They give false confidence.

**EGOS testing is different:**
- **Real endpoints** — hit actual API routes, not mocks
- **Real database** — query Supabase with real RLS policies
- **AI-powered** — use Gemini to generate edge cases, verify response quality, detect regressions
- **Multi-layer** — 5 layers of agents, each verifying different aspects
- **Self-improving** — agents review each other's findings, reduce false positives

---

## Architecture: 5 Testing Layers

```
┌─────────────────────────────────────────────────────┐
│                 TEST ORCHESTRATOR                     │
│    Runs all layers → Combined report → Tracks time   │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Layer 5: AI VERIFIER                                │
│  ├─ AI evaluates AI response quality                 │
│  ├─ Generates adversarial edge-case inputs           │
│  ├─ Reviews other agents' findings (false positive?) │
│  └─ Scores: accuracy, safety, consistency            │
│                                                       │
│  Layer 4: REGRESSION WATCHER                         │
│  ├─ Compares current results vs last N runs          │
│  ├─ Detects: new failures, flaky tests, degradation  │
│  ├─ Alerts on breaking changes                       │
│  └─ Tracks: test health score over time              │
│                                                       │
│  Layer 3: INTEGRATION TESTER                         │
│  ├─ Full flow: request → processing → DB → response  │
│  ├─ Supabase RLS: can user X access row Y?           │
│  ├─ Auth flows: token → session → protected route    │
│  └─ Cross-service: API → DB → webhook → response     │
│                                                       │
│  Layer 2: CONTRACT TESTER                            │
│  ├─ API routes: status codes, content types, schemas │
│  ├─ Request validation: missing fields, bad types    │
│  ├─ Error handling: 4xx, 5xx, rate limits            │
│  └─ Response structure: matches TypeScript types     │
│                                                       │
│  Layer 1: STATIC ANALYSIS (existing agents)          │
│  ├─ SSOT Auditor: type consistency                   │
│  ├─ Dead Code: unused exports                        │
│  ├─ Dep Auditor: version conflicts                   │
│  └─ Security Scanner: secrets, PII                   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Agent Registry (New Testing Agents)

| Agent ID | Layer | What It Tests | Risk |
|----------|-------|---------------|------|
| `contract_tester` | 2 | API schemas, status codes, error handling | low |
| `integration_tester` | 3 | Full flows, RLS, auth, cross-service | medium |
| `regression_watcher` | 4 | Historical comparison, flaky detection | low |
| `ai_verifier` | 5 | AI response quality, edge cases, false positives | medium |

---

## Layer 2: Contract Tester

Tests every API route for contract compliance:

```typescript
// For each API route:
// 1. Valid request → 200 + correct response shape
// 2. Missing required field → 400
// 3. Wrong method → 405
// 4. No auth (if required) → 401
// 5. Rate limit exceeded → 429
// 6. Response headers correct (Content-Type, CORS)
```

**Targets (egos-web):**
- `POST /api/chat` — message → AI response
- `GET /api/github-commits` — fetch recent commits
- `POST /api/ingest-commits` — analyze commits with AI

**Targets (Supabase direct):**
- `nexusmkt_products` — CRUD with RLS
- `eagle_eye_gazettes` — read-only public access
- `commits` — insert from ingestion
- `telemetry_events` — write-only from services

---

## Layer 3: Integration Tester

Tests complete flows:

```
Flow 1: Chat
  Input: { message: "What is EGOS?" }
  Expected: 200, response.reply exists, length > 50, no hallucination

Flow 2: Commit Ingestion
  Input: GitHub commits JSON
  Expected: 200, commits stored in DB, AI analysis generated

Flow 3: RLS Enforcement
  As anon: SELECT nexusmkt_products → rows (public read)
  As anon: INSERT nexusmkt_products → DENIED
  As authenticated: SELECT own orders → rows
  As authenticated: SELECT other's orders → empty

Flow 4: Supabase Functions
  Test edge functions respond correctly
  Test webhook endpoints accept valid payloads
```

---

## Layer 4: Regression Watcher

```
1. Load previous test results from agents/.logs/test-history.jsonl
2. Run current test suite
3. Compare:
   - Tests that PASSED before but FAIL now → REGRESSION
   - Tests that FAIL intermittently → FLAKY
   - New failures in previously untested areas → NEW_ISSUE
   - Tests that FAILED before but PASS now → FIXED
4. Generate regression report with diff
```

---

## Layer 5: AI Verifier

Uses AI to test AI:

```
1. Generate adversarial inputs:
   - SQL injection attempts in chat
   - Prompt injection ("ignore previous instructions")
   - Extremely long messages
   - Unicode edge cases
   - Empty/null inputs

2. Evaluate response quality:
   - Is the chat response factually correct about EGOS?
   - Does it hallucinate features that don't exist?
   - Is it safe (no PII, no harmful content)?
   - Is the tone appropriate?

3. Cross-verify agent findings:
   - Take SSOT Auditor findings → Are they real issues?
   - Take Dead Code findings → Would removing them break anything?
   - Score: precision, recall, actionability
```

---

## Execution Model

```bash
# Run all test layers
bun agent:test              # dry-run (plan what would be tested)
bun agent:test --exec       # execute (run real tests)
bun agent:test --layer 2    # run specific layer only
bun agent:test --report     # generate full test report

# Run individual test agents
bun agent:contract          # contract tests only
bun agent:integration       # integration tests only  
bun agent:regression        # regression analysis only
bun agent:ai-verify         # AI verification only
```

---

## Test Report Format

```markdown
# EGOS Test Report — 2026-02-18T14:00:00Z

## Summary
- Total tests: 47
- Passed: 43 (91.5%)
- Failed: 2
- Skipped: 2
- Duration: 12.4s

## By Layer
| Layer | Tests | Pass | Fail | Duration |
|-------|-------|------|------|----------|
| Contract | 15 | 14 | 1 | 2.1s |
| Integration | 12 | 11 | 1 | 8.2s |
| Regression | 10 | 10 | 0 | 0.3s |
| AI Verify | 10 | 8 | 0 | 1.8s |

## Failures
### FAIL: POST /api/chat — missing message field
- Expected: 400
- Actual: 500 (unhandled error)
- Fix: Add input validation before AI call

## Regressions
- None detected (baseline: previous run)

## AI Verification
- Chat quality score: 8.7/10
- Prompt injection resistance: 10/10
- Hallucination rate: 0% (5 factual checks)
```

---

## Implementation Order

1. ✅ Static Analysis agents (Layer 1) — already exist
2. 🔨 Contract Tester (Layer 2) — implement NOW
3. 🔨 Integration Tester (Layer 3) — implement NOW  
4. 📋 Regression Watcher (Layer 4) — after baseline exists
5. 📋 AI Verifier (Layer 5) — after Layers 2-3 produce data
6. 📋 Test Orchestrator — wire into existing orchestrator
