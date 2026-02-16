# 🛡️ Egos Security Policy

> **Philosophy:** "Leak nothing. Trust no one. Verify everything."

## 1. 🚫 Zero Secret Tolerance
**ABSOLUTELY NO secrets** (API Keys, Passwords, Tokens) are allowed in the codebase.
- **Development:** Use `.env.local` (not committed).
- **Production:** Use Environment Variables in Vercel/Railway/Supabase.
- **Detection:** Pre-commit hooks scan for potential leaks.

## 2. 🕵️ Security Scanning
We use a custom scanner (`npm run security:scan`) to detect:
- `sk-proj-...` (OpenAI Keys)
- `sbp_...` (Supabase Keys)
- `ghp_...` (GitHub Tokens)
- `force-app` (Salesforce)
- AWS/Google/Azure credentials

## 3. 🚨 Incident Response
If a secret is committed:
1.  **Revoke it immediately** at the provider.
2.  **Rotate the key** in all environments.
3.  **Squash the commit** or rewrite history (bfg-repo-cleaner) if strictly necessary.
4.  **Report** to the Maintainer.

## 4. 📦 Dependency Safety
- Audit `npm/bun` packages regularly.
- No "wildcard" versions in production.

## 5. 🛠️ Recommended Tools (Free Tier)
- **Gitleaks:** `brew install gitleaks` (Local Pre-commit).
- **TruffleHog:** Scans git history for past mistakes.
- **GitHub Advanced Security:** Enable for public repos.
