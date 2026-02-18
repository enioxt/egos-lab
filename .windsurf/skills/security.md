---
description: Security practices — RLS, pre-commit scanning, secrets management, and hardening
---

# Security Skill

## 1. Secret Scanning (Pre-Commit)
Agent: `security_scanner` — runs automatically on every commit via `.husky/pre-commit`.

```bash
# Manual run
bun scripts/security_scan.ts
```

### What it detects:
- API keys (OpenRouter, GitHub, Supabase, Stripe, Asaas)
- JWT tokens, passwords, connection strings
- High-entropy strings (Shannon entropy > 4.5)
- PII patterns (CPF, phone numbers, emails in code)

### Rules:
- **NEVER hardcode secrets** — use `.env` files (always gitignored)
- **Server-side only** — no `VITE_` prefix for secret keys
- **Rotate immediately** if a key is ever committed

## 2. Database Security (Supabase RLS)

### Mandatory Rules:
1. **RLS ALWAYS ON** — every new table MUST have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **No `WITH CHECK (true)`** — use `auth.role() = 'authenticated'` or `current_setting('role') = 'service_role'`
3. **`SET search_path`** — every function MUST include `SET search_path = public`
4. **Extensions** — install in `extensions` schema, never `public`

### Policy Patterns:
```sql
-- Public read, authenticated write
CREATE POLICY "read_all" ON public.my_table FOR SELECT USING (true);
CREATE POLICY "write_own" ON public.my_table FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Service role only (admin tables)
CREATE POLICY "service_only" ON public.admin_table 
  TO service_role USING (true) WITH CHECK (true);
```

### Checking Advisors:
```bash
# Via MCP
mcp10_get_advisors({ type: 'security' })

# Via SQL
SELECT * FROM extensions.pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

## 3. API Route Security

Every new API route MUST:
1. **Authenticate** — check session/token before processing
2. **Rate limit** — prevent abuse (10 req/min per IP minimum)
3. **Validate input** — sanitize and validate all parameters
4. **No `select('*')`** — specify columns explicitly

```typescript
// Pattern for Vercel serverless
export default async function handler(req, res) {
  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  // 2. Rate limit (use in-memory Map or Redis)
  // 3. Validate input
  // 4. Process with explicit column selection
}
```

## 4. Hardening Checklist

### Before Launch:
- [ ] All RLS policies reviewed (run `mcp10_get_advisors`)
- [ ] No secrets in client bundle (check `dist/` output)
- [ ] Pre-commit hooks active (`.husky/pre-commit`)
- [ ] Pre-push build gate (`.husky/pre-push`)
- [ ] `.env` in `.gitignore`
- [ ] Supabase leaked password protection enabled
- [ ] Extensions in `extensions` schema

### Agent-Assisted:
```bash
bun scripts/security_scan.ts          # Secret scanning
bun agents/agents/auth-roles-checker.ts --dry  # Auth consistency
bun agents/agents/ssot-auditor.ts --dry        # Type/data leaks
```
