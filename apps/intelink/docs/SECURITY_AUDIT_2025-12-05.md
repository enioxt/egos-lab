# 🛡️ Security Audit Report - Intelink

**Date:** 2025-12-05
**Auditor:** Cascade (AI)
**System:** Intelink - Police Investigation Platform
**Criticality:** HIGH (handles sensitive police data)

---

## 📊 Executive Summary

| Category | Status | Issues |
|----------|:------:|:------:|
| Authentication Flow | 🟡 | 2 |
| Authorization (RLS) | 🔴 | 8 |
| API Security | 🔴 | 5 |
| Data Protection | 🟡 | 2 |
| Infrastructure | 🟢 | 1 |

**Overall Risk Level:** 🔴 **HIGH**

---

## 🔴 CRITICAL ISSUES (P0)

### 1. No Authentication Middleware

**Risk:** Any request to API endpoints is processed without verifying user identity.

**Current State:**
```typescript
// APIs just use service role without checking authentication
export async function POST(request: NextRequest) {
    const supabase = getSupabaseAdmin(); // Bypasses RLS!
    // No check if user is authenticated...
}
```

**Impact:** Anyone can call any API endpoint.

**Fix:** Create `middleware.ts` with session validation.

---

### 2. Service Role Bypasses RLS

**Risk:** All API routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses Row Level Security.

**Current State:**
- 53 API endpoints use `getSupabaseAdmin()`
- Service role ignores all RLS policies
- Data is accessible to any request

**Impact:** RLS policies are useless for API access.

**Fix:** Either:
- A) Add middleware authentication + validate permissions in code
- B) Use anon client in APIs + rely on RLS (requires auth tokens)

---

### 3. Tables Without RLS Enabled

**Risk:** 4 tables have no row-level security protection.

| Table | RLS Status |
|-------|:----------:|
| `intelink_evidence_access_grants` | ❌ DISABLED |
| `intelink_evidence_access_requests` | ❌ DISABLED |
| `intelink_investigator_findings` | ❌ DISABLED |
| `intelink_role_definitions` | ❌ DISABLED |

**Impact:** Direct database access (if anon key exposed) would expose all data.

---

### 4. Overly Permissive RLS Policies

**Risk:** Many tables allow `anon` (unauthenticated) access.

**Critical Policies to Remove:**

| Table | Policy | Risk |
|-------|--------|------|
| `intelink_entities` | `anon_insert_entities` | Anyone can create fake entities |
| `intelink_entities` | `anon_update_entities` | Anyone can modify entities |
| `intelink_investigations` | `anon_insert_investigations` | Anyone can create investigations |
| `intelink_investigations` | `anon_update_investigations` | Anyone can modify investigations |
| `intelink_deletion_requests` | `anon_all_deletion_requests` | Anyone can request deletions |
| `intelink_chat_shared_access` | `Allow all operations` | Anyone can access shared chats |

---

## 🟡 MEDIUM ISSUES (P1)

### 5. No Rate Limiting

**Risk:** APIs are vulnerable to abuse and DDoS.

**High-Risk Endpoints:**
- `/api/documents/extract` - Costs money (LLM calls)
- `/api/documents/embeddings` - Costs money (OpenAI embeddings)
- `/api/chat` - Costs money (LLM calls)
- `/api/investigation/analyze` - Costs money

**Recommended Limits:**
- LLM endpoints: 10 requests/minute
- Data endpoints: 100 requests/minute
- Auth endpoints: 5 requests/minute (brute force protection)

---

### 6. No Input Validation (Zod)

**Risk:** APIs accept any input without validation.

**Current State:** ~30% of APIs have Zod validation.

**Missing Validation:**
- All document-related APIs
- Investigation APIs
- Entity manipulation APIs

---

### 7. Session Storage in localStorage

**Risk:** XSS attacks can steal session tokens.

**Current State:**
```typescript
// Tokens stored in localStorage
localStorage.setItem('intelink_session', JSON.stringify(session));
```

**Recommendation:** Use HTTP-only cookies instead.

---

## 🟢 GOOD PRACTICES FOUND

### ✅ Security Headers Configured

```javascript
// next.config.js
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
]
```

### ✅ Authentication Flow

- OTP via Telegram (2FA)
- Single-use tokens
- Token expiration
- Password hashing (bcrypt)
- Account lockout after failed attempts

### ✅ RLS Enabled on Core Tables

40 of 44 tables have RLS enabled.

---

## 📋 REMEDIATION PLAN

### Phase 1 - P0 Critical (Immediate)

| # | Task | Effort | Impact |
|:-:|------|:------:|:------:|
| 1 | Create authentication middleware | 2h | 🔴 Critical |
| 2 | Enable RLS on 4 remaining tables | 30m | 🔴 Critical |
| 3 | Remove `anon` write policies | 1h | 🔴 Critical |
| 4 | Add session validation to APIs | 3h | 🔴 Critical |

### Phase 2 - P1 Important (This Week)

| # | Task | Effort | Impact |
|:-:|------|:------:|:------:|
| 5 | Add rate limiting | 2h | 🟡 High |
| 6 | Add Zod validation schemas | 4h | 🟡 High |
| 7 | Migrate to HTTP-only cookies | 2h | 🟡 Medium |

### Phase 3 - P2 Improvements (Next Week)

| # | Task | Effort | Impact |
|:-:|------|:------:|:------:|
| 8 | Add audit logging | 3h | 🟢 Medium |
| 9 | Configure CORS properly | 1h | 🟢 Low |
| 10 | Add CSP headers | 1h | 🟢 Low |

---

## 📝 Migration Scripts

### Enable RLS on Missing Tables

```sql
-- Enable RLS
ALTER TABLE public.intelink_evidence_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelink_evidence_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelink_investigator_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelink_role_definitions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Authenticated users only" ON public.intelink_evidence_access_grants
    FOR ALL USING ((SELECT auth.role()) = 'authenticated' OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "Authenticated users only" ON public.intelink_evidence_access_requests
    FOR ALL USING ((SELECT auth.role()) = 'authenticated' OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "Authenticated users only" ON public.intelink_investigator_findings
    FOR ALL USING ((SELECT auth.role()) = 'authenticated' OR (SELECT auth.role()) = 'service_role');

CREATE POLICY "Authenticated users only" ON public.intelink_role_definitions
    FOR ALL USING ((SELECT auth.role()) = 'authenticated' OR (SELECT auth.role()) = 'service_role');
```

### Remove Dangerous Policies

```sql
-- Remove anon write policies
DROP POLICY IF EXISTS "anon_insert_entities" ON public.intelink_entities;
DROP POLICY IF EXISTS "anon_update_entities" ON public.intelink_entities;
DROP POLICY IF EXISTS "anon_insert_investigations" ON public.intelink_investigations;
DROP POLICY IF EXISTS "anon_update_investigations" ON public.intelink_investigations;
DROP POLICY IF EXISTS "anon_all_deletion_requests" ON public.intelink_deletion_requests;
DROP POLICY IF EXISTS "Allow all operations" ON public.intelink_chat_shared_access;
```

---

## 🔒 Recommended Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                        │
│  - Session validation                                        │
│  - Rate limiting                                             │
│  - Request logging                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
│  - Zod input validation                                      │
│  - Permission checks                                         │
│  - Uses service role (after auth verified)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  - RLS as defense-in-depth                                   │
│  - Audit logging (pg_audit)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

**Report Generated:** 2025-12-05 09:30 BRT
**Next Review:** After Phase 1 implementation
