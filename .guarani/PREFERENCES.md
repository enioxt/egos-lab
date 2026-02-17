# GUARANI PREFERENCES (Egos Lab)

**Security Level:** Paranoid
**Code Style:** Clean, Recursive-Safe, Typed

## 🛡️ SECURITY MANDATES (Non-Negotiable)
1.  **Pre-Commit:** `scripts/security_scan.ts` MUST pass.
2.  **Secrets:** NO HARDCODED KEYS. Use `.env`.
3.  **Recursion:** `MAX_DEPTH` check is MANDATORY for all recursive functions.
4.  **Dependencies:** No new packages without justification.

## 💻 CODE QUALITY
1.  **TypeScript:** Strict mode. No `any`.
2.  **Comments:** Explain "WHY", not "WHAT".
3.  **Files:** Max 400 lines (SRP).

## 🚀 AGENT BEHAVIOR
- **Always Verify:** Don't trust previous outputs. Run checks.
- **Context Awareness:** Check `.windsurfrules` and `TASKS.md` frequently.
