# EGOS AI Model Strategy & Tier Matrix

> **STATUS:** Preliminary Results — Community Feedback Welcome  
> **UPDATED:** 2026-02-19  
> **PURPOSE:** Guide model selection for different agent tiers and customer needs

---

## ⚠️ Preliminary Results — Call for Collaboration

These results come from our **initial test runs** against real repositories. We are actively seeking:

- **Peer review** of our analysis methodology
- **Suggestions** for new agents or improved scan logic
- **Model comparison data** from the community
- **Bug reports** and edge cases

👉 If our analysis of your repo seems inaccurate, **please open an issue** — every correction makes the system smarter.

---

## Current AI Stack

| Layer | Model | Cost/1M tokens | Where |
|---|---|---|---|
| Chat (Mission Control) | `gemini-2.0-flash-001` | ~$0.10 | `chat.ts` |
| UI Designer Agent | `gemini-2.0-flash-001` | ~$0.10 | `ui-designer.ts` |
| AI Verifier Agent | `gemini-2.0-flash-001` | ~$0.10 | `ai-verifier.ts` |
| Commit Analyzer | `gemini-2.0-flash-001` | ~$0.10 | `ingest-commits.ts` |
| Static Agents (11) | No AI needed | $0.00 | Pure code analysis |

**Current monthly AI cost estimate:** ~$2-5/month at light usage.

---

## Model Tier Matrix (OpenRouter)

### 🏆 Tier S — Enterprise/Premium
*For customers who want "the best in the world"*

| Model | Input/1M | Output/1M | Best For | Benchmark |
|---|---|---|---|---|
| `anthropic/claude-sonnet-4` | $3.00 | $15.00 | Deep code review, security | SOTA reasoning |
| `google/gemini-2.5-pro` | $2.50 | $15.00 | Architecture analysis | Top coding benchmark |
| `openai/gpt-4.1` | $2.00 | $8.00 | General analysis | Balanced |
| `openai/o3-pro` | $20.00 | $80.00 | Complex reasoning | Frontier math/code |

### 🥇 Tier A — Professional
*Best cost/quality ratio for production*

| Model | Input/1M | Output/1M | Best For | Note |
|---|---|---|---|---|
| `google/gemini-2.5-flash` | $0.15 | $0.60 | Fast + smart | Best $/quality |
| `anthropic/claude-3.5-haiku` | $0.80 | $4.00 | Fast analysis | Good for agents |
| `openai/gpt-4.1-mini` | $0.40 | $1.60 | Reliable | Good generalist |

### 🥈 Tier B — Startup/Individual
*Current EGOS default tier (good enough for most use cases)*

| Model | Input/1M | Output/1M | Best For | Note |
|---|---|---|---|---|
| `google/gemini-2.0-flash-001` | $0.10 | $0.40 | **Current default** | Free tier available |
| `meta-llama/llama-4-maverick` | $0.20 | $0.60 | Open source | Self-hostable |
| `deepseek/deepseek-chat-v3-0324` | $0.14 | $0.28 | Coding tasks | Excellent for code |

### 🆓 Tier C — Free/Community
*For open source projects on a budget*

| Model | Cost | Best For | Note |
|---|---|---|---|
| `google/gemini-2.0-flash-exp:free` | $0.00 | Light usage | Rate limited |
| `meta-llama/llama-4-scout:free` | $0.00 | Basic analysis | Open weights |
| `deepseek/deepseek-chat-v3-0324:free` | $0.00 | Code analysis | Limited quota |

---

## Cost Projections per Audit

*Assumes ~50K tokens input + ~5K tokens output per AI agent per audit*

| Tier | Per Audit | 100 Audits/mo | 1000 Audits/mo |
|---|---|---|---|
| **S (Claude Sonnet 4)** | ~$0.23 | ~$23 | ~$230 |
| **A (Gemini 2.5 Flash)** | ~$0.01 | ~$1.10 | ~$11 |
| **B (Gemini 2.0 Flash)** | ~$0.007 | ~$0.70 | ~$7 |
| **C (Free models)** | $0.00 | $0.00 | $0.00 |

---

## Recommended Model per Agent

| Agent | Current | Recommended (Pro) | Why |
|---|---|---|---|
| SSOT Auditor | Static | Static | Regex-based, no AI needed |
| Dead Code Detector | Static | Static | AST analysis, no AI needed |
| Security Scanner | Static | + AI Layer (Tier A) | AI can detect context-dependent vulns |
| Code Reviewer | Gemini 2.0 Flash | Gemini 2.5 Flash/Pro | Deeper analysis with better model |
| AI Verifier | Gemini 2.0 Flash | Claude Sonnet 4 | Adversarial testing needs top reasoning |
| UI Designer | Gemini 2.0 Flash | Gemini 2.5 Pro | Better design understanding |
| Auth Checker | Static | + AI Layer (Tier S) | Can detect complex auth bypass patterns |

---

## Configuration Architecture

```env
# Set in Railway / Vercel / .env
EGOS_AI_TIER=B                    # Default tier (S/A/B/C)
EGOS_MODEL_OVERRIDE=              # Override specific model
OPENROUTER_API_KEY=sk-or-...      # API key
```

The system automatically selects the best model for the configured tier. Enterprise customers can set `EGOS_AI_TIER=S` to use frontier models.
