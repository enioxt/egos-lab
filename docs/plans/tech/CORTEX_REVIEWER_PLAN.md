# 🐰 Cortex Reviewer (Project "Rabbit Hunter")

**Status:** Draft
**Goal:** Replace CodeRabbit with a superior, internal, privacy-first AI Code Reviewer.

## 1. Reverse Engineering "CodeRabbit"

CodeRabbit is powerful because it uses a **Hybrid Architecture**:
1.  **Static Analysis First:** It doesn't send everything to LLM. It runs Linters/SAST/AST first.
2.  **Context-Aware:** It understands the *graph* of the code, not just lines.
3.  **Summarization:** High-level PR summaries + Line-by-line nitpicks.

## 2. The "Cortex" Architecture (Internal)

We will build **Cortex Reviewer** to run locally (CLI) or inside CI/CD, bypassing external SaaS limits.

### Core Components

| Component | Tech Stack | Role |
| :--- | :--- | :--- |
| **The Trigger** | `husky` / `bun` | Runs on `pre-push` or manual `bun review`. |
| **The Screener** | `security_scan.ts` + `eslint` | Fails early on security/syntax errors. |
| **The Diff Engine** | `git diff` filtered | Extracts only meaningful changes (ignores lockfiles). |
| **The Brain** | `Google Gemini 2.0 Flash` | Fast, huge context, cheap. Analyzes the diff. |
| **The Memory** | `docs/LEARNINGS.md` | Persistent file where the AI records "Don't do X again". |

### Workflow

1.  **Developer commits** code.
2.  **Husky** triggers `bun review`.
3.  **Local Script** (`scripts/review.ts`):
    *   Runs static checks (Security/Lint).
    *   Grabs `diff`.
    *   Reads `docs/LEARNINGS.md` (Context).
    *   Sends to LLM: "Review this diff against these Learnings."
4.  **Output:**
    *   **Pass:** "Code looks great! 🐰"
    *   **Fail:** "Blocker on line 45: Infinite recursion."

## 3. Implementation Plan

### Phase 1: The Scanner (Already Done)
- [x] Security Scan (Regex/Entropy).
- [x] `pre-commit` hook.

### Phase 2: The Reviewer (Script)
- [ ] Create `scripts/review.ts`.
- [ ] Implement `DiffParser` (ignore whitespace/vendor).
- [ ] Integration with `OpenRouter` (Gemini Flash).
- [ ] Prompt Engineering: "You are the Lead Architect. Be ruthless but helpful."

### Phase 3: The Memory (Vector/File)
- [ ] Create `docs/review/LEARNINGS.md`.
- [ ] Logic: If user rejects valid feedback, update rules.

## 4. Competitive Advantage
| Feature | CodeRabbit | Cortex Reviewer (Internal) |
| :--- | :--- | :--- |
| **Cost** | $15/user/mo | ~$0.10/mo (API usage) |
| **Privacy** | Shared Cloud | Local/Private LLM calls |
| **Customization** | Limited | Infinite (Access to all internal docs) |
| **Speed** | Queue-based | Instant (Local) |

## 5. Next Steps
1.  Create the `review.ts` script structure.
2.  Define the `SYSTEM_PROMPT` for the reviewer.
