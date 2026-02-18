# 🛡️ Intelink Security Module - SOTA

**Version:** 1.0.0
**Status:** ✅ Production Ready
**Location:** `lib/security/`

---

## 📋 Visão Geral

O módulo de segurança é **State of the Art** e **centralizado**. TODO endpoint deve usar este módulo.

### Arquitetura

```
lib/security/
├── index.ts        # Re-exporta tudo (entry point)
├── auth.ts         # Autenticação e sessões
├── rate-limit.ts   # Controle de taxa
├── validation.ts   # Validação Zod
├── headers.ts      # Headers de segurança
├── audit.ts        # Auditoria de ações
└── middleware.ts   # Wrapper unificado
```

---

## 🚀 Uso Rápido

### Proteger uma API Route

```typescript
import { withSecurity } from '@/lib/security';
import { createInvestigationSchema } from '@/lib/validations';

async function handler(request: NextRequest, context: SecureContext) {
    const { user, body } = context;
    
    // user já está autenticado
    // body já foi validado com Zod
    
    return NextResponse.json({ success: true });
}

export const POST = withSecurity(handler, {
    auth: true,                           // Requer autenticação
    rateLimit: 'llm',                     // 10 req/min
    validation: createInvestigationSchema, // Valida body
    audit: 'INVESTIGATION_CREATE',        // Loga ação
});
```

### Presets Disponíveis

```typescript
import { withPublic, withAuth, withLLM, withUpload, withAdmin } from '@/lib/security';

// Endpoint público (sem auth, com rate limit)
export const GET = withPublic(handler);

// Endpoint de autenticação (rate limit agressivo)
export const POST = withAuth(handler, authSchema);

// Endpoint de LLM/Chat (10 req/min)
export const POST = withLLM(handler, chatSchema);

// Endpoint de upload (20 req/min)
export const POST = withUpload(handler, uploadSchema);

// Endpoint admin-only
export const POST = withAdmin(handler, adminSchema);
```

---

## 📦 Módulos

### 1. Authentication (`auth.ts`)

```typescript
import { validateSession, requireAuth, isAdmin, hasRole } from '@/lib/security';

// Validar sessão manualmente
const result = await validateSession(request);
if (result.valid) {
    console.log('User:', result.user);
}

// Requer autenticação (retorna response de erro se falhar)
const { authorized, user, response } = await requireAuth(request);
if (!authorized) return response;

// Verificar roles
if (isAdmin(user)) { /* ... */ }
if (hasRole(user, ['admin', 'analyst'])) { /* ... */ }
```

### 2. Rate Limiting (`rate-limit.ts`)

```typescript
import { checkRateLimit, RATE_LIMITS, tooManyRequestsResponse } from '@/lib/security';

// Presets disponíveis
RATE_LIMITS.auth    // 5 req/min
RATE_LIMITS.llm     // 10 req/min
RATE_LIMITS.upload  // 20 req/min
RATE_LIMITS.webhook // 100 req/min
RATE_LIMITS.default // 60 req/min

// Verificar manualmente
const result = checkRateLimit(request, RATE_LIMITS.llm);
if (!result.allowed) {
    return tooManyRequestsResponse(result.retryAfter);
}
```

### 3. Validation (`validation.ts`)

```typescript
import { validateRequestBody, validateRequestQuery, sanitizeInput } from '@/lib/security';
import { createEntitySchema } from '@/lib/validations';

// Validar body
const result = await validateRequestBody(request, createEntitySchema);
if (!result.success) {
    return validationError(result.error);
}
const entity = result.data; // Tipado corretamente!

// Sanitizar input
const cleanInput = sanitizeInput(userInput);
```

### 4. Headers (`headers.ts`)

```typescript
import { addSecurityHeaders, addCorsHeaders, isOriginAllowed } from '@/lib/security';

// Adicionar headers de segurança
const response = NextResponse.json(data);
return addSecurityHeaders(response);

// CORS (se necessário)
const origin = request.headers.get('origin');
if (isOriginAllowed(origin)) {
    return addCorsHeaders(response, origin);
}
```

### 5. Audit (`audit.ts`)

```typescript
import { logAuditEvent, logAuditEventAsync, extractRequestInfo } from '@/lib/security';

// Logar evento (blocking)
await logAuditEvent({
    action: 'INVESTIGATION_CREATE',
    userId: user.memberId,
    resourceId: investigation.id,
    details: { title: investigation.title }
});

// Logar evento (non-blocking, fire and forget)
logAuditEventAsync({
    action: 'DOCUMENT_UPLOAD',
    userId: user.memberId,
    resourceId: document.id,
});

// Extrair info do request
const { ipAddress, userAgent } = extractRequestInfo(request);
```

---

## 🔐 Ações de Auditoria

| Categoria | Ações |
|-----------|-------|
| Auth | `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_LOGIN_FAILED` |
| Investigation | `INVESTIGATION_CREATE`, `UPDATE`, `DELETE`, `VIEW` |
| Entity | `ENTITY_CREATE`, `UPDATE`, `DELETE` |
| Document | `DOCUMENT_UPLOAD`, `DELETE`, `EXTRACT` |
| Chat | `CHAT_SESSION_CREATE`, `MESSAGE_SEND`, `SHARE` |
| Admin | `MEMBER_CREATE`, `UPDATE`, `DELETE`, `UNIT_CREATE`, `UPDATE` |
| Cross-case | `CROSS_CASE_ALERT_VIEW`, `DISMISS` |

---

## 📊 Rate Limits

| Preset | Limite | Janela | Uso |
|--------|:------:|:------:|-----|
| `auth` | 5 | 1 min | Login, OTP |
| `llm` | 10 | 1 min | Chat, Extraction |
| `upload` | 20 | 1 min | Document upload |
| `webhook` | 100 | 1 min | Telegram |
| `default` | 60 | 1 min | Geral |

---

## 🛡️ Checklist de Segurança

Ao criar uma nova API, verifique:

- [ ] Usa `withSecurity()` ou um preset
- [ ] Define schema Zod para validação
- [ ] Especifica roles se necessário
- [ ] Adiciona auditoria para ações sensíveis
- [ ] Usa rate limit apropriado

---

## 📝 Migração de APIs Existentes

### Antes

```typescript
export async function POST(request: NextRequest) {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    
    // Sem validação
    // Sem autenticação
    // Sem rate limit
    
    return NextResponse.json({ success: true });
}
```

### Depois

```typescript
import { withSecurity, SecureContext } from '@/lib/security';
import { mySchema } from '@/lib/validations';

async function handler(
    request: NextRequest,
    { user, body }: SecureContext<typeof mySchema>
) {
    const supabase = getSupabaseAdmin();
    
    // user já autenticado
    // body já validado
    // rate limit aplicado
    // headers de segurança adicionados
    
    return NextResponse.json({ success: true });
}

export const POST = withSecurity(handler, {
    validation: mySchema,
    rateLimit: 'default',
});
```

---

**Última Atualização:** 2025-12-05
