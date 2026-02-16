# 🌍 Egos Open Source Launch Plan

> **Objective:** Release `egos-lab` as the standard for "Agentic Engineering".
> **License:** AGPL-3.0 (Strong Copyleft) - "If you use our engine to build a SaaS, you must contribute back to the engine."

## 1. 📦 Repository Strategy: The Monorepo
We will use **1 Main Repository**: `egos-lab`. (Currently on disk).

**Why Monorepo?**
- **Unified Standards:** One `.windsurfrules`, one `package.json`, one `Standard`.
- **Easier Audit:** Security scans run once for everything.
- **Brand Power:** "Look at the sheer scale of this ecosystem."

**Structure:**
```
egos-lab/
├── apps/
│   ├── eagle-eye/       (✅ Public - The MVP)
│   ├── radio-philein/   (✅ Public - The Vibe)
│   └── marketplace-core/(⚠️ Private - Future SaaS?) -> Maybe move to private repo later?
├── packages/            (✅ Public - Shared Logic)
├── docs/                (✅ Public - The Knowledge)
├── scripts/             (✅ Public - The Automation)
└── projects/            (✅ Public - The Roadmap)
```

## 2. 🔐 Security Pre-Requisites (Must-Haves)
Before `git push origin main`:
1.  **Gitleaks (Local):** `brew install gitleaks` -> `gitleaks detect`.
2.  **TruffleHog (Deep):** Scan entire git history for old commits.
3.  **BFG Repo-Cleaner:** If TruffleHog finds something old, use BFG to erase it from history.
4.  **`security_scan.ts`:** Our custom script (already active).

## 3. 📢 LinkedIn Launch Strategy
**Profile Transformation:**
- **Headline:** `AI Architect @ Egos Lab | Building the "Intelink" Operating System for Agents`
- **About:** Focus on the *Engineering* aspect. "I built a monorepo that manages 13 AI projects simultaneously using Agentic Workflows."

**The "Manifesto" Post:**
- "I am open-sourcing my brain."
- Link to GitHub.
- Call to action: "Looking for TypeScript/Rust partners to build the Intelink Core."

## 4. 🛠️ Recommended Free Tools
1.  **Gitleaks:** Best for pre-commit.
2.  **TruffleHog:** Best for deep history audit.
3.  **GitHub Advanced Security:** Enable for the public repo (Free).
4.  **Dependabot:** Auto-update dependencies (Free).
