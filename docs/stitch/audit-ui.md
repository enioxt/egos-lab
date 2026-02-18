# Prompt: Audit UI (Security Gate)

**Context:**
Interface for developers to submit their GitHub repositories for an automated security and SSOT audit. This is the main "hook" for the platform.

**Visual Style:**
- **Theme:** "Cyber-Police Intelligence" but welcoming (Palantir meets Vercel).
- **Colors:** Slate-950 background, Emerald-500 (Safe), Amber-500 (Warning), Rose-600 (Danger).
- **Typography:** Inter (UI), JetBrains Mono (Code/Terminal).

**Key Elements:**

1.  **Hero Input Section:**
    - Large, centered input field: "Paste your GitHub Repository URL".
    - Placeholder: `https://github.com/username/project`.
    - Primary CTA Button: "Run Audit" (with scanner icon).
    - Helper text: "Public repositories only for now. No write access required."

2.  **Live Terminal (The "Magic" Moment):**
    - A visual terminal window that expands when audit starts.
    - Streaming log lines: `[init] Cloning repo...`, `[security] Scanning for secrets...`, `[ssot] Checking single source of truth...`.
    - Typing effect for realism.

3.  **The Scorecard (Result):**
    - **Overall Grade:** Big letter (A, B, C, F) with color ring.
    - **Metric Grid:**
        - **Security:** "0 Critical, 2 Warnings" (Shield icon).
        - **SSOT Compliance:** "85% - Excellent" (Database icon).
        - **Architecture:** "Monorepo detected" (Sitemap icon).
    - **Findings List:**
        - Accordion items for each issue found.
        - Badges: `[P0]`, `[Security]`, `[Type Duplication]`.
        - "Fix" button next to issues that leads to Rule Forge (upsell).

**Interaction:**
- User pastes URL -> Button clicks -> Terminal animates -> Scorecard reveals.
- Hovering over a grade shows "How is this calculated?".

**Output Format:**
- React + Tailwind component (`AuditScanner.tsx`).
- Use `framer-motion` for the terminal reveal and score count-up.
