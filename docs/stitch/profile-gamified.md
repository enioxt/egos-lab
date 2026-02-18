# Prompt: Gamified Profile (The Builder)

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
