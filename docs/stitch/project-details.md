# Prompt: Project Details (The Hub)

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
