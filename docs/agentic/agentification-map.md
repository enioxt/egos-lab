# Agentification Map — EGOS Lab

> Generated: 2026-02-17 | Version: 1.0

This document maps all internal areas that should be covered by agents, their dependencies, and implementation priority.

---

## Area Dependency Graph

```
Layer 0 (Foundation - implement first):
  [Architecture & SSOT] → all other areas depend on clean data contracts

Layer 1 (Core - implement next):
  [Auth & Roles] ← depends on SSOT
  [Data Contracts] ← depends on SSOT
  [Security & Secrets] ← independent

Layer 2 (Quality - implement after core):
  [QA & E2E] ← depends on Auth, Data
  [Observability] ← depends on SSOT
  [Release Engineering] ← depends on QA, Security

Layer 3 (Product - implement last):
  [Payments & Ledger] ← depends on Auth, Data, Security
  [Product Config] ← depends on SSOT
  [Docs & Knowledge] ← depends on all above
```

---

## 10 Areas with Agent Definitions

### 1. Architecture & SSOT (Layer 0)

**Why first:** Every other area depends on knowing where data lives and who owns it.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| SSOT Auditor | `ssot_auditor` | **Implemented** | P0 |
| Schema Drift Detector | `schema_drift` | Planned | P1 |
| Dependency Graph Builder | `dep_graph` | Planned | P2 |

**Capabilities needed:** filesystem:read, git:read, ai:analyze
**Guardrails:** Read-only. Never modifies code.
**Evals:** Detect known duplicates in test fixtures; verify no false positives on `Props`/`State` generics.

---

### 2. Data Contracts & Validation (Layer 1)

**Why:** Supabase tables lack a formal ORM. Types are scattered across services, components, and API routes.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Type-DB Sync Checker | `type_db_sync` | Planned | P1 |
| Zod Schema Generator | `zod_gen` | Planned | P2 |

**Capabilities needed:** filesystem:read, supabase:read_schema
**Guardrails:** Read-only in dry_run. Execute mode can generate .ts files but not modify existing.
**Evals:** Compare generated types with actual Supabase `information_schema.columns`.

---

### 3. Auth & Roles Consistency (Layer 1)

**Why:** Role checks happen in middleware, sidebar rendering, API routes, and Supabase RLS — they can drift.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Auth Roles Checker | `auth_roles_checker` | **Registered** | P0 |
| RLS Policy Auditor | `rls_auditor` | Planned | P1 |

**Capabilities needed:** filesystem:read, supabase:read_policies, ai:analyze
**Guardrails:** Never modifies auth code. Report-only.
**Evals:** Inject known role mismatches into test fixtures; verify detection.

---

### 4. Payments & Ledger (Layer 3)

**Why:** Financial operations (Asaas) require strict idempotency and audit trails.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Payment Flow Auditor | `payment_auditor` | Planned | P2 |
| Ledger Reconciliation | `ledger_recon` | Planned | P2 |

**Capabilities needed:** supabase:read, asaas:read (future)
**Guardrails:** Read-only. PII masking mandatory (CPF, email).
**Evals:** Verify idempotency keys exist on all payment mutations.

---

### 5. Observability (Layer 2)

**Why:** No structured logging or metrics today. Rho calculator is the only health metric.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Rho Calculator | `rho_calculator` | **Active** | P0 |
| Log Coverage Checker | `log_coverage` | Planned | P1 |
| Cost Tracker | `cost_tracker` | Planned | P1 |

**Capabilities needed:** git:read, filesystem:read
**Guardrails:** Read-only.
**Evals:** Verify Rho calculation matches known git log fixtures.

---

### 6. QA & E2E (Layer 2)

**Why:** "Tests pass but button doesn't work" is the #1 risk in AI-generated code.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| E2E Smoke Validator | `e2e_smoke` | **Registered** | P0 |
| Code Reviewer | `code_reviewer` | **Placeholder** | P1 |
| Visual Regression | `visual_regression` | Planned | P2 |

**Capabilities needed:** browser:navigate, browser:assert, ai:analyze
**Guardrails:** Never modifies application code. Only creates test files.
**Evals:** Run smoke tests against known-good and known-broken fixtures.

---

### 7. Security & Secrets (Layer 1)

**Why:** Pre-commit scanner exists but needs registry integration and eval coverage.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Security Scanner | `security_scanner` | **Active** | P0 |
| LGPD Compliance Checker | `lgpd_checker` | Planned | P2 |

**Capabilities needed:** filesystem:read
**Guardrails:** Never writes secrets. Masks PII in all output.
**Evals:** Inject known secrets in test fixtures; verify detection and zero false negatives.

---

### 8. Release Engineering (Layer 2)

**Why:** Deploy failures from implicit-any and missing types are the #1 time sink.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Pre-Deploy Validator | `pre_deploy` | Planned | P1 |
| Migration Checker | `migration_checker` | Planned | P2 |

**Capabilities needed:** filesystem:read, shell:exec (tsc --noEmit)
**Guardrails:** Never pushes code. Blocks deploy on errors.
**Evals:** Run against known-broken builds; verify correct error detection.

---

### 9. Product Config & Feature Flags (Layer 3)

**Why:** Hardcoded values in UI are a recurring problem (prices, labels, feature toggles).

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Hardcode Detector | `hardcode_detector` | Planned | P1 |
| Feature Flag Auditor | `feature_flag_auditor` | Planned | P2 |

**Capabilities needed:** filesystem:read, ai:analyze
**Guardrails:** Read-only.
**Evals:** Detect known hardcoded values in test fixtures.

---

### 10. Docs & Knowledge Base (Layer 3)

**Why:** 40+ ingested idea files, but no index, no search, no freshness check.

| Agent | ID | Status | Priority |
|-------|----|--------|----------|
| Idea Scanner | `idea_scanner` | **Active** | P0 |
| Knowledge Disseminator | `disseminator` | **Active** | P0 |
| Doc Freshness Checker | `doc_freshness` | Planned | P2 |

**Capabilities needed:** filesystem:read, filesystem:write, ai:analyze
**Guardrails:** Write only to docs/ directory.
**Evals:** Verify classification accuracy on known idea files.

---

## Summary

| Status | Count | IDs |
|--------|-------|-----|
| **Active** (migrated proto-agents) | 5 | security_scanner, idea_scanner, rho_calculator, disseminator, code_reviewer |
| **Implemented** (new P0) | 1 | ssot_auditor |
| **Registered** (stub) | 2 | auth_roles_checker, e2e_smoke |
| **Planned** | 12 | schema_drift, dep_graph, type_db_sync, zod_gen, rls_auditor, payment_auditor, ledger_recon, log_coverage, cost_tracker, visual_regression, lgpd_checker, pre_deploy, migration_checker, hardcode_detector, feature_flag_auditor, doc_freshness |
| **Total** | 20 | — |

## Implementation Order (by dependency)

1. **Now:** SSOT Auditor (done), Registry + Runner (done), CLI (done)
2. **Next sprint:** Auth Roles Checker, Pre-Deploy Validator, Code Reviewer (connect LLM)
3. **Sprint +2:** E2E Smoke (Playwright), Type-DB Sync, Log Coverage
4. **Sprint +3:** All Layer 3 agents (Payments, Product Config, Doc Freshness)
