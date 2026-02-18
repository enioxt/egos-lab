# Prompt: Lab Landing Page (Public Face)

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
