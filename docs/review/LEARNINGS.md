# 🧠 Cortex Reviewer Memory (LEARNINGS)

This file contains the "Collective Intelligence" of the Egos team.
The AI Reviewer (`scripts/review.ts`) reads this file to understand context and preferences.

## 🛡️ Security
- **Never commit API Keys.** Use `security_scan.ts` to verify.
- **Avoid Recursive Functions without Limits.** Always use `MAX_DEPTH` (e.g., in Accessibility Services).

## 🏗️ Architecture
- **Use Bun.** We prefer `bun` over `node` or `npm` for scripts.
- **Event-Driven.** Prefer `NATS` topics over direct HTTP calls for inter-service communication.

## 🎨 Style
- **Comments:** Use `@disseminate` to capture new knowledge.
- **Naming:** Use `PascalCase` for Classes, `camelCase` for variables.
