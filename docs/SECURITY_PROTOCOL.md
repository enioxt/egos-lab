# 🛡️ Egos Lab Security Protocol (ESP-01)

**Version:** 1.0.0
**Date:** 2026-02-16
**Status:** ACTIVE

This document registers the mandatory security verification standards for the `egos-lab` repository.

## 1. Methodology (The "Paranoid" Standard)

To ensure zero leakage of sensitive credentials, we employ a 3-Layer Defense:

### Layer 1: Prevention (Git Configuration)
**Rule:** No sensitive file extensions or directories may even enter the staging area.
- **Tool:** `.gitignore` (Strict Whitelist approach).
- **Blocked:** `.env`, `*.pem`, `*.key`, `node_modules/`, `coverage/`.

### Layer 2: Static Analysis (Current State)
**Rule:** Every file currently in the repo must be scanned for patterns AND entropy.
- **Tool:** `scripts/security_scan.ts`
- **Checks:**
    - **Regex:** `sk-proj-`, `AIza`, `ghp_`, `sbp_`, `ctx7sk-`.
    - **Entropy:** Shannon Entropy > 4.5 for string literals assigned to variables like `key`, `secret`, `token`.
    - **Heuristics:** Assignments like `const apiKey = "..."`.

### Layer 3: Forensic Audit (Time Machine)
**Rule:** We must ensure no secrets were committed in the past and then deleted (which would still be in `.git`).
- **Tool:** `git grep` on full history (`$(git rev-list --all)`).
- **Commands:**
    ```bash
    git grep "AIza" $(git rev-list --all)
    git grep "sk-proj-" $(git rev-list --all)
    ```

---

## 2. Audit Log (2026-02-16)

The following verifications were executed to certify `v1.0.0` release:

| Check ID | Type | Target | Command / Tool | Result | Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Static | `scripts/` | Manual Review | ✅ Pass | Whitelisted safe scripts. |
| **SEC-02** | Static | `.env` | `.gitignore` Check | ✅ Pass | File is ignored. |
| **SEC-03** | Static | `docs/` | `security_scan.ts` | ⚠️ **FAIL** | Found `ctx7sk-` key. **Redacted.** |
| **SEC-04** | Static | `docs/` | `security_scan.ts` | ⚠️ **FAIL** | Found `AIza` false positive. **Updated Regex.** |
| **SEC-05** | Forensic | Git History | `git grep "AIza"` | ✅ Pass | 0 matches in history. |
| **SEC-06** | Forensic | Git History | `git grep "sk-"` | ⚠️ **WARN** | Found placeholders `sk-SUA-CHAVE`. **Verified harmless.** |

---

## 3. Incident Response

If a key is found in the future:
1.  **Revoke:** Immediately rotate the key in the provider dashboard (OpenAI, Google, etc.).
2.  **Redact:** Replace with `REDACTED` in the file.
3.  **Purge:** If committed, use `git filter-repo` or BFG Repo-Cleaner to nuke it from history.
4.  **Audit:** Run full forensic scan again.

## 4. Continuous Integration

This protocol is now **Law**.
Run `bun security:scan` before every `git push`.
