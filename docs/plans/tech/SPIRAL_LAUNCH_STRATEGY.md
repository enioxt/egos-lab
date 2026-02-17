# 🚀 Spiral Launch Strategy: "The Git Universe"

**Vision:** A decentralized research lab where every "Voice" is a Branch and every "Consensus" is a Merge.
**Evolution:** This is the culmination of the "Agent-Centric" vision. Instead of building a siloed chat app, we use the global standard (Git) as our communication layer.

## 1. Feasibility & Comparative Analysis
| Feature | Old Idea (Custom App) | New Idea (Git Spiral) | Verdict |
| :--- | :--- | :--- | :--- |
| **Storage** | SQL Database (Costly) | GitHub Repo (Free) | **Git Wins** |
| **Identity** | Validated User | GPG Signed Commit | **Git Wins** |
| **AI Access** | API Only | ANY Tool (Cursor, Claude) | **Git Wins** |
| **Speed** | Real-time | Async (Push/Pull) | **Trade-off** |

**Why it works:** It leans into the "Slow Thinking" nature of Research. It's not for "Hey, how are you?". It's for "Here is a profound change to the axiom."

## 2. The Hard Challenges (Reality Check)
1.  **Collision (Merge Conflicts):** If two people edit `knowledge.md` at the same time, it breaks.
    *   *Solution:* **Sharded Memory.** Each Agent/User gets their own folder `docs/voices/@user/`.
2.  **Visualization Latency:** Fetching 5,000 commits in the browser is heavy.
    *   *Solution:* **Pre-computation.** A GitHub Action generates `graph.json` on every push.
3.  **Onboarding:** "Git" is scary for non-devs.
    *   *Solution:* We are building for **AI-First Users**. The AI handles the Git complexity.

## 3. Architecture: The "Invisible Backend"
- **Frontend:** Vercel (`apps/egos-web`). Renders the Spiral.
- **Backend:** GitHub API (Read-Only). Fetches the Graph.
- **Write Layer:** The User's IDE (Cursor/Windsurf).

## 4. Implementation Steps (The Launch)
1.  **Prep:** Configure `apps/egos-web` for Vercel.
2.  **Data:** Create a script to generate `public/graph.json` from real git history.
3.  **Deploy:** Connect Vercel to `main` branch.

## 5. Timeline
- **Now:** Deploy Vercel Skeleton (Visualizer).
- **Next:** Connect GitHub API for Real Data.
