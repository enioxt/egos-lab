# AI Enhancement Plan for All EGOS Agents

> **STATUS:** Approved for incremental implementation  
> **UPDATED:** 2026-02-19

---

## Current State

| Agent | Type Today | Uses AI? | Findings Quality |
|---|---|---|---|
| Security Scanner | Regex + entropy | ❌ | Good for secrets, no context |
| Idea Scanner | File parser | ❌ | Basic classification |
| Rho Calculator | Git log stats | ❌ | Pure metrics |
| Code Reviewer | Git diff + LLM | ✅ Gemini | Good |
| Disseminator | Comment parser | ❌ | Basic extraction |
| UI Designer | Prompt → LLM | ✅ Gemini | Good |
| SSOT Auditor | Regex + imports | ❌ | High false positives |
| Auth Checker | Pattern matching | ❌ | Misses context |
| Dead Code Detector | Export/import diff | ❌ | High false positives |
| Dep Auditor | package.json parse | ❌ | Good but no priority |
| Contract Tester | HTTP assertions | ❌ | Pass/fail only |
| Integration Tester | SQL + HTTP | ❌ | Pass/fail only |
| Regression Watcher | JSONL diff | ❌ | Good trend data |
| AI Verifier | Adversarial + LLM | ✅ Gemini | Good |
| E2E Smoke | Playwright (pending) | ❌ | Not implemented |

---

## AI Enhancement Opportunities

### High Value (Do First)

#### 1. SSOT Auditor + AI Interpretation Layer
- **Problem:** Generates 200+ findings, many false positives. User doesn't know which to fix first.
- **AI adds:** Priority ranking, auto-generated fix patches, "this is likely intentional" filtering.
- **Cost/audit:** ~$0.01 (Tier B) to ~$0.90 (Tier S)
- **Impact:** 🔥🔥🔥 — Transforms raw data into actionable next steps.

#### 2. Security Scanner + Context-Aware Analysis
- **Problem:** Regex finds strings that LOOK like secrets but may be test data or examples.
- **AI adds:** Context analysis ("this is in a test file", "this is a placeholder"), severity scoring, remediation suggestions.
- **Cost/audit:** ~$0.01 (Tier B)
- **Impact:** 🔥🔥🔥 — Reduces noise dramatically. Enterprise killer feature.

#### 3. Dead Code Detector + Impact Assessment
- **Problem:** Flags all unused exports, but some are public API surface or used by external consumers.
- **AI adds:** "Safe to delete" confidence score, dependency graph reasoning, migration suggestions.
- **Cost/audit:** ~$0.005 (Tier B)
- **Impact:** 🔥🔥 — Makes cleanup safe and automated.

### Medium Value (Do Next)

#### 4. Auth Checker + Vulnerability Reasoning
- **Problem:** Pattern-matches `auth.role()` checks but can't detect complex bypass patterns.
- **AI adds:** "This route has no auth but handles sensitive data", privilege escalation path detection.
- **Cost/audit:** ~$0.01 (Tier B)
- **Impact:** 🔥🔥 — Security selling point for enterprises.

#### 5. Dep Auditor + Upgrade Strategy
- **Problem:** Lists version conflicts but doesn't prioritize them.
- **AI adds:** "This conflict causes build failures", CVE cross-reference, upgrade path generation.
- **Cost/audit:** ~$0.005 (Tier B)
- **Impact:** 🔥🔥

#### 6. Contract Tester + Natural Language Report
- **Problem:** Returns pass/fail, no explanation.
- **AI adds:** "This endpoint returns 500 because the database connection string is missing", suggested fixes.
- **Cost/audit:** ~$0.005 (Tier B)
- **Impact:** 🔥

### Lower Priority (Later)

#### 7. Regression Watcher + Trend Narrative
- **AI adds:** "Your security findings increased 40% this week, mainly from new auth routes without guards."
- **Impact:** 🔥 — Great for dashboards.

#### 8. Rho Calculator + Health Narrative
- **AI adds:** "Bus factor is 1 — if enioxt goes on vacation, 87% of the codebase has no other contributor."
- **Impact:** 🔥 — Storytelling for reports.

#### 9. Idea Scanner + Smart Classification
- **AI adds:** Better categorization, market viability scoring, duplicate detection.
- **Impact:** 🔥 — Nice to have.

---

## Architecture: How AI Layers Work

```
┌───────────────────────────┐
│  Static Agent (existing)  │ ← unchanged, still runs fast
│  ssot-auditor.ts          │
│  Output: Finding[]        │
└──────────┬────────────────┘
           │ raw findings (JSON)
           ▼
┌───────────────────────────┐
│  AI Interpretation Layer  │ ← NEW, optional, configurable
│  Uses: getModel('audit')  │
│  Prompt: "Prioritize and  │
│   explain these findings" │
│  Output: EnrichedFinding[] │
└──────────┬────────────────┘
           │ enriched findings
           ▼
┌───────────────────────────┐
│  Report / UI / Supabase   │
└───────────────────────────┘
```

**Key principle:** The static agent runs first (fast, free). The AI layer is an **optional post-processor** controlled by `EGOS_AI_TIER`. If tier is C (free), skip AI enrichment entirely. If tier is S, use Claude 4.6 Opus Thinking for deep analysis.

---

## Implementation Plan

| Phase | Agents | Effort | ETA |
|---|---|---|---|
| **Phase 1** | SSOT Auditor + Security Scanner | 2-3 hours | Next sprint |
| **Phase 2** | Dead Code + Auth Checker | 2 hours | Following sprint |
| **Phase 3** | Dep Auditor + Contract Tester | 2 hours | Week after |
| **Phase 4** | Regression + Rho + Idea | 3 hours | Backlog |

---

## Model Research Sources (Governance Rule 11)

Agents MUST verify against these sources before recommending models:

| Source | URL | What It Tells You |
|---|---|---|
| **OpenRouter Models** | https://openrouter.ai/models | Pricing, availability, API compatibility |
| **Chatbot Arena (LMSYS)** | https://lmarena.ai/ | Community ELO rankings, blind comparisons |
| **Artificial Analysis** | https://artificialanalysis.ai/ | Cost/quality trade-offs, speed benchmarks |
| **HF Open LLM Leaderboard** | https://huggingface.co/spaces/open-llm-leaderboard | Open-source model rankings |

**Research frequency:** Monthly, or when a major model launch is announced.
