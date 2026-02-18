# EGOS Lab — Security Keys Map v1.0
> **Purpose:** Centralized registry of all environment variables required per module.
> **Security:** VALUES are NEVER stored here. Only key names and descriptions.
> **SSOT:** This file is the single source of truth for CI/CD configuration.

---

## 1. Global / Shared (`packages/shared`)
Used by all apps and agents.

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `OPENROUTER_API_KEY` | AI Model access (Gemini 2.0 Flash) | ✅ Yes | Server |
| `SUPABASE_URL` | Database URL (transaction pool) | ✅ Yes | Server |
| `SUPABASE_ANON_KEY` | Public Anon Key (RLS enabled) | ✅ Yes | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Key (Bypass RLS) | ⚠️ CI Only | Server |

---

## 2. Mission Control (`apps/egos-web`)
Public-facing dashboard.

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | ✅ Yes | Client |
| `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY | ✅ Yes | Client |
| `GITHUB_CLIENT_ID` | OAuth Login App ID | ✅ Yes | Server |
| `GITHUB_CLIENT_SECRET` | OAuth Login Secret | ✅ Yes | Server |
| `GITHUB_TOKEN` | Fetch Commits (PAT) | ✅ Yes | Server |

---

## 3. Intelink (`apps/intelink`)
Police Intelligence Core (DHPP).

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database URL | ✅ Yes | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key | ✅ Yes | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin Access | ✅ Yes | Server |
| `OPENROUTER_API_KEY` | Intelligence Analysis | ✅ Yes | Server |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps Visualization | ✅ Yes | Client |
| `ASAAS_API_KEY` | Payments (Sandbox/Prod) | ✅ Yes | Server |
| `ASAAS_WALLET_ID` | Main Wallet ID | ✅ Yes | Server |
| `RESEND_API_KEY` | Email Transports | ✅ Yes | Server |
| `TELEGRAM_BOT_TOKEN` | Bot Integration | 🟡 Opt | Server |
| `TELEGRAM_ADMIN_ID` | Admin User ID | 🟡 Opt | Server |
| `UPSTASH_REDIS_REST_URL` | Rate Limiting | 🟡 Opt | Server |
| `UPSTASH_REDIS_REST_TOKEN` | Rate Limiting | 🟡 Opt | Server |

---

## 4. Eagle Eye (`apps/eagle-eye`)
OSINT Monitor.

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `OPENROUTER_API_KEY` | Text Analysis | ✅ Yes | Server |
| `EAGLE_EYE_TERRITORIES` | Comma-separated IDs (empty=all) | ⚪ No | Server |

---

## 5. Agent Platform (`agents/`)
CLI tools and automation.

| Key | Description | Required | Scope |
|-----|-------------|----------|-------|
| `OPENROUTER_API_KEY` | Code Analysis | ✅ Yes | Server |
| `GITHUB_TOKEN` | PR/Issue Management | 🟡 Opt | Server |

---

## ✅ Action Items

1. **Audit Vercel:** Ensure `apps/egos-web` project has:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_TOKEN` (for commit ingestion)
   
2. **Audit CI/CD:** Ensure GitHub Actions secrets include:
   - `SUPABASE_SERVICE_ROLE_KEY` (for migrations/tests)
   - `OPENROUTER_API_KEY` (for agent runs)

3. **Local Dev:** Use `.env.example` templates in each app root.
