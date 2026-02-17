# 🌀 Universal Lab: The "Git-as-Chat" Protocol

**Objective:** A decentralized "Spiral of Listening" where every voice is a Commit, and every listener is an AI.
**Core Concept:** The Repository *is* the Chat Room.

## 1. The Protocol: "Bring Your Own AI" (BYO-AI)
We do not build a chat app. We use **Git** as the immutable ledger of the conversation.

### A. The Flow
1.  **The Context:** You clone the repo (`git clone`). This is "entering the room".
2.  **The Voice:** You make a change (docs, code, config).
3.  **The Speech:** You commit with a semantic message (`feat: propose new spiral logic`).
4.  **The Proposal:** You push a branch (`proposal/my-idea`).
5.  **The Spiral:** The website visualizes `main` (The Core) vs `proposal/*` (The Edges).

### B. Universal Compatibility
Since it relies on files and git, it works with **ANY** AI:
- **Antigravity (Google):** Reads the repo, edits files.
- **Claude Code (Anthropic):** Edits files via CLI.
- **Cursor/Windsurf:** Edits files via IDE.
- **Human:** Edits files via text editor.

## 2. The Website: "Visualizing the Multiverse"
The `apps/egos-web` will render the **Git Graph** as a 3D Spiral.
- **Center:** The `main` branch (Consensus).
- **Orbiting Stars:** The open PRs/Branches (Proposals).
- **Gravity:** The number of upvotes/comments (or AI validation score).

## 3. Instructions for Agents (The "Prompt")
We need a standard instruction set for AIs to understand how to "speak" in this system.
*See `docs/CONTRIBUTING_WITH_AI.md`.*
