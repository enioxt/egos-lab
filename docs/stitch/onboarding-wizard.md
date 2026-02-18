# Prompt: Onboarding Wizard (Start Here)

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
