# Security Policy — egos-lab

## 🚨 Reporting Vulnerabilities

If you discover a security vulnerability, please email **enioxt@gmail.com** directly.
Do NOT open a public GitHub issue for security concerns.

## 🔒 Rules for All Contributors (Humans AND AI Agents)

### NEVER Do
1. **Never hardcode secrets** in source code, comments, or commit messages
2. **Never commit `.env` files** — they are gitignored for a reason
3. **Never log sensitive values** (API keys, passwords, tokens) to console
4. **Never include credentials in AI "thinking" comments** (e.g., `// the password is X`)
5. **Never paste `.env` contents into code** as literal strings
6. **Never commit connection strings** with embedded passwords

### ALWAYS Do
1. **Always use `process.env.VAR_NAME`** to access secrets
2. **Always add new env vars** to `.env.example` (without real values)
3. **Always run the pre-commit hook** — install with `scripts/setup-hooks.sh`
4. **Always rotate secrets** immediately if accidentally exposed
5. **Always use the GitGuardian dashboard** to monitor for incidents

## 🛡️ Defense Layers

| Layer | Tool | Status |
|-------|------|--------|
| Pre-commit | `scripts/hooks/pre-commit` | ✅ Active |
| Scanning Config | `.gitleaks.toml` | ✅ Active |
| Remote Monitoring | GitGuardian | ✅ Active |
| Git Ignore | `.gitignore` (env files) | ✅ Active |

## 🔑 Environment Variables

All secrets live **exclusively** in `.env` (never committed). See `.env.example` for required variables.

| Variable | Purpose | Rotation Notes |
|----------|---------|----------------|
| `OPENROUTER_API_KEY` | AI model access | Rotate via OpenRouter dashboard |
| `EXA_API_KEY` | Web search | Rotate via Exa dashboard |
| `SERPER_API_KEY` | Google SERP search | Rotate via serper.dev |
| `SUPABASE_SERVICE_ROLE_KEY` | DB admin access | Rotate via Supabase Settings > API |
| `SUPABASE_DB_PASSWORD` | Direct Postgres | Rotate via Supabase Settings > Database |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Repo access | Rotate via GitHub Settings > Tokens |
| `VITE_GITHUB_TOKEN` | Client-side GitHub | Rotate via GitHub Settings > Tokens |

## 📋 Incident History

| Date | Incident | Status |
|------|----------|--------|
| 2026-02-18 | `SUPABASE_DB_PASSWORD` hardcoded in `deploy_nexus_schema.ts` comments (commit 9818f4b) — detected by GitGuardian | ✅ Remediated — script cleaned, password rotation recommended |

## ⚙️ Setup

```bash
# Install pre-commit hook
chmod +x scripts/hooks/pre-commit
cp scripts/hooks/pre-commit .git/hooks/pre-commit

# Or use the setup script
bash scripts/setup-hooks.sh
```
