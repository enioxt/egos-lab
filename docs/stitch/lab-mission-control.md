# Prompt: Mission Control V2 (Logged In)

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
