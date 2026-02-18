# 🎨 EGOS Lab Platform - All Stitch Prompts

> **Context:** Complete UI package for the EGOS Lab open-source platform.
> **Theme:** "Future of Coding" / "Cyber-Police Intelligence" (Dark, Sleek, Neon Accents).
> **Generated:** 2026-02-18

---

## 1. Landing Page (Public Face)
**File:** `lab-landing-page.md`

**Prompt:**
```text
**Context:**
The public homepage (`/`) for non-logged-in users. Must explain what EGOS Lab is and convert visitors into users immediately.

**Visual Style:**
- **Theme:** "Future of Coding". Dark, sleek, glowing geometric accents (Hexagons/Spirals).
- **Typography:** Large, bold headings. High contrast.

**Key Elements:**

1.  **Hero Section (The Hook):**
    - **Headline:** "Where Code Meets Intelligence."
    - **Subheadline:** "An open ecosystem for agentic development. Audit your repo, share your rules, and build better software."
    - **Primary Action (The Audit Gate):**
        - Input: "github.com/username/repo"
        - Button: "Analyze Security & SSOT" (Triggers Audit UI).
    - **Secondary Action:** "Explore the Rules" (Ghost button).

2.  **Value Props (The Pillars):**
    - **Security:** "Automated pre-commit audits for peace of mind." (Shield).
    - **Knowledge:** "A marketplace of .windsurfrules and .cursorrules." (Book/Brain).
    - **Community:** "Gamified contribution graph. Earn Cred, not just stars." (Users/Graph).

3.  **Live Pulse (Social Proof):**
    - "Recent Activity": Scrolling ticker of commits/audits.
    - "1,240 Repos Audited", "500+ Rules Shared".

4.  **Footer:**
    - Links to GitHub, Discord (if any), Docs.
    - "Part of the EGOS Ecosystem".

**Interaction:**
- Typing in the Hero Input transforms the page background (focus mode).
- Scroll animations for Value Props.

**Output Format:**
- React + Tailwind component (`LandingPage.tsx`).
```

---

## 2. Audit UI (Security Gate)
**File:** `audit-ui.md`

**Prompt:**
```text
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
```

---

## 3. Onboarding Wizard (Start Here)
**File:** `onboarding-wizard.md`

**Prompt:**
```text
**Context:**
The first experience for a new user. Determines their level and sets up their environment.

**Visual Style:**
- **Theme:** "Zen Mode". Minimalist, focused, step-by-step.
- **Layout:** Centered card with progress bar.

**Key Elements:**

1.  **Step 1: Identity (The Role):**
    - "How do you want to contribute?"
    - Cards:
        - 🐣 **Explorer:** "I want to browse ideas."
        - 🔨 **Builder:** "I want to code."
        - 🧠 **Architect:** "I want to share rules."

2.  **Step 2: Stack (The Tools):**
    - "What's your weapon of choice?"
    - Selectable Icons: Windsurf, Cursor, VS Code, None.

3.  **Step 3: Setup (The Config):**
    - Based on selection:
        - If Windsurf: "Download this .windsurfrules file."
        - If None: "Launch GitHub Codespaces (Browser)."
    - One-click "Magic Setup" button if possible.

4.  **Step 4: First Mission (The Call to Action):**
    - "Ready? Here is your first mission."
    - Card: "Task #42: Fix typo in README."
    - Button: "Start Mission" (Redirects to Repo/IDE).

**Interaction:**
- Smooth transitions between steps (`AnimatePresence`).
- Celebration confetti on completion.

**Output Format:**
- React + Tailwind component (`OnboardingWizard.tsx`).
```

---

## 4. Mission Control V2 (Logged In)
**File:** `lab-mission-control.md`

**Prompt:**
```text
**Context:**
The main dashboard (`/dashboard`) for logged-in builders. The cockpit for managing their journey.

**Visual Style:**
- **Theme:** "Command Center". Dense but organized data. Sidebar navigation.
- **Layout:** Bento Grid (responsive grid of widgets).

**Key Elements:**

1.  **Sidebar Nav:**
    - **Hub:** Dashboard (Home).
    - **Tools:** Audit, Rule Forge, Idea Market.
    - **Me:** Profile, Projects, Settings.
    - **System:** Telemetry (Admin only).

2.  **Main Grid (Bento):**
    - **Widget A (Status):** "Welcome back, Enio. You are on a 12-day streak! 🔥"
    - **Widget B (Active Mission):** "Current Task: Fix RLS Policies in `egos-lab`." (Progress bar).
    - **Widget C (Activity):** Mini "Listening Spiral" showing recent ecosystem events.
    - **Widget D (Recommendations):** "Try this new Rule: 'Next.js Security Hardening'."
    - **Widget E (Your Projects):** List of repos you've submitted or claimed.

3.  **Quick Actions (Floating or Top Bar):**
    - "New Audit".
    - "New Idea".
    - "Search Rules".

**Interaction:**
- Widgets are draggable/resizable (optional).
- Real-time updates via Supabase (notification badge on bell icon).

**Output Format:**
- React + Tailwind component (`MissionControl.tsx`).
```

---

## 5. Rule Forge (Marketplace)
**File:** `rule-forge.md`

**Prompt:**
```text
**Context:**
A marketplace where users can browse, copy, and fork configuration rules (`.windsurfrules`, `.cursorrules`, `.guarani`).

**Visual Style:**
- **Theme:** "Extensions Store" clean layout (like VS Code Marketplace or Raycast Store).
- **Grid:** Responsive cards with clean borders.

**Key Elements:**

1.  **Sidebar Filters:**
    - **IDE:** Windsurf, Cursor, Cline, Antigravity.
    - **Stack:** Next.js, Python, Rust, Go.
    - **Goal:** Security, Speed, Refactoring, Docs.

2.  **Rule Cards (The Item):**
    - **Header:** Icon (IDE logo) + Title ("Next.js Hardened Rules").
    - **Author:** Avatar + @username (linked to GitHub).
    - **Stats:** ⭐ 4.8 | ⬇️ 1.2k installs.
    - **Tags:** `Security`, `TypeScript`, `Strict`.
    - **Action:** "Copy" button (instantly copies to clipboard).

3.  **Detail Modal (Quick View):**
    - Opens on click.
    - **Preview:** Syntax-highlighted code block showing the rule content.
    - **Explanation:** "Why use this?" text.
    - **Install Guide:** "Save this as .windsurfrules in your root."

4.  **Header Actions:**
    - Search bar ("Search for 'python data' rules...").
    - "Submit Rule" button (Primary).

**Interaction:**
- Filter click -> Grid shuffles (Layout animation).
- Copy button -> Toast "Copied to clipboard! Paste in .windsurfrules".

**Output Format:**
- React + Tailwind component (`RuleForge.tsx`).
- Use `lucide-react` for IDE icons.
```

---

## 6. Gamified Profile (The Builder)
**File:** `profile-gamified.md`

**Prompt:**
```text
**Context:**
User profile page showing their journey, reputation, and impact in the ecosystem.

**Visual Style:**
- **Theme:** "GitHub Sky" / "Video Game Stats". Dark mode with glowing accents.

**Key Elements:**

1.  **Header Identity:**
    - Large Avatar + Name + Handle.
    - **Level Badge:** "Level 3: Architect" (Holographic/Shiny effect).
    - **Bio:** "Building agents for public procurement."

2.  **Reputation Stats (The Cred):**
    - **Cred Score:** "842" (Big number).
    - **Impact:** "12 projects used your rules".
    - **Streak:** "🔥 12 days".

3.  **Contribution Graph (The Spiral):**
    - Instead of squares, use the "Listening Spiral" visualization.
    - Dots represent commits, reviews, ideas.
    - Hovering a dot shows details.

4.  **Trophy Case:**
    - Grid of earned badges:
        - "First PR" (Bronze).
        - "Security Hawk" (Silver) - Found a vulnerability.
        - "Rule Maker" (Gold) - Shared a popular rule.
    - Greyed out badges for "Next Goals".

5.  **Project/Rule Showcase:**
    - Tabs: "Projects", "Rules", "Ideas".
    - List of items created by user with their status/rating.

**Interaction:**
- Level Badge has a tooltip explaining "Next level at 1000 Cred".
- Spiral is interactive (rotatable/zoomable).

**Output Format:**
- React + Tailwind component (`BuilderProfile.tsx`).
```

---

## 7. Project Details (The Hub)
**File:** `project-details.md`

**Prompt:**
```text
**Context:**
Detailed view of a project in the ecosystem. Acts as the "enhanced README" with runbooks and collaboration features.

**Visual Style:**
- **Theme:** "Documentation meets Dashboard". Clean typography, clear hierarchy.
- **Layout:** Two-column (Content + Sidebar).

**Key Elements:**

1.  **Hero Header:**
    - **Title:** "Eagle Eye".
    - **Subtitle:** "OSINT gazette monitor for public procurement."
    - **Actions:** "Star", "Fork", "Run in Lab" (Primary).
    - **Badges:** `Live`, `SaaS`, `Security: A`.

2.  **Main Content (Left Col):**
    - **Tabs:** "Overview", "Runbook", "Keys & Costs", "Help".
    - **Runbook View:**
        - Interactive steps ("1. Clone", "2. Env").
        - Copyable code blocks.
        - "Estimated Setup Time: 5 min".
    - **Keys & Costs View:**
        - Table of required services (Supabase, OpenAI).
        - Estimated cost/month ($5).
        - "Get Key" links for each service.

3.  **Sidebar (Right Col):**
    - **Maintainers:** Avatars.
    - **Tech Stack:** Icons (Bun, React, Supabase).
    - **Activity:** Mini "Listening Spiral" or sparkline of commits.
    - **Contributors:** List of top 5 contributors.

4.  **Help Request Section (Bottom):**
    - List of open "Help Wanted" cards.
    - "Ask for Help" button.

**Interaction:**
- Clicking "Run in Lab" triggers the Onboarding/Setup wizard context.

**Output Format:**
- React + Tailwind component (`ProjectDetails.tsx`).
```
