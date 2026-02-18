# INTELINK Auth System v2.0 - Refactor Plan

## Executive Summary

O sistema atual de autenticação cresceu organicamente com múltiplos remendos, criando:
- Inconsistências entre login via Telegram e via Telefone
- Uso de "chat_id fake" (negativos) que causam loops
- Lógica espalhada em múltiplos arquivos
- Dificuldade de manutenção e debugging

**Objetivo:** Sistema unificado, simples, seguro e enterprise-grade.

---

## Current State Analysis

### Problemas Identificados

| Problema | Impacto | Severidade |
|----------|---------|------------|
| chat_id fake (negativo) para usuários sem Telegram | Loops infinitos de redirect | 🔴 Critical |
| Lógica de sessão espalhada em 4+ arquivos | Difícil manutenção | 🟠 High |
| localStorage como fonte primária de verdade | Vulnerável a manipulação | 🟠 High |
| Múltiplos identificadores (chat_id, phone, member_id) | Confusão no código | 🟠 High |
| Falta de tipos TypeScript estritos | Bugs em runtime | 🟡 Medium |
| Ausência de testes automatizados | Regressões frequentes | 🟡 Medium |

### Arquivos Atuais (Spaghetti)

```
/app/auth/page.tsx              → 1600+ linhas, UI + lógica misturados
/app/api/auth/phone/route.ts    → 400+ linhas, múltiplos steps confusos
/app/api/auth/verify/route.ts   → Verificação de token Telegram
/app/api/auth/forgot-password/  → Recovery via email/telegram
/app/api/auth/reset-password/   → Definir nova senha
/app/api/auth/verify-reset-code/→ Verificar código de reset
/app/api/session/route.ts       → Validação de sessão
/app/page.tsx                   → Lógica de auth duplicada
/lib/auth.ts                    → Helpers espalhados
```

---

## Target Architecture v2.0

### Princípios

1. **Single Source of Truth:** `member_id` (UUID) é o único identificador
2. **Stateless Sessions:** JWT com refresh tokens
3. **Separation of Concerns:** UI, API, Business Logic separados
4. **Type Safety:** 100% TypeScript strict mode
5. **Testability:** Cada módulo testável isoladamente
6. **Security First:** HTTP-only cookies, CSRF protection, rate limiting

### Nova Estrutura de Arquivos

```
/lib/auth/
├── index.ts                    → Exports públicos
├── types.ts                    → Interfaces e tipos
├── constants.ts                → Configurações
├── jwt.ts                      → Geração/validação JWT
├── session.ts                  → Gerenciamento de sessão
├── password.ts                 → Hash, verify, reset
├── otp.ts                      → Geração e validação OTP
├── providers/
│   ├── phone.ts                → Autenticação por telefone
│   └── telegram.ts             → Autenticação por Telegram
└── hooks/
    ├── useAuth.ts              → Hook principal
    ├── useSession.ts           → Estado da sessão
    └── usePermissions.ts       → Verificação de permissões

/app/api/auth/
├── login/route.ts              → Endpoint único de login
├── logout/route.ts             → Endpoint de logout
├── refresh/route.ts            → Refresh token
├── verify/route.ts             → Verificar sessão
├── password/
│   ├── forgot/route.ts         → Solicitar reset
│   └── reset/route.ts          → Executar reset
└── otp/
    ├── send/route.ts           → Enviar OTP
    └── verify/route.ts         → Verificar OTP

/app/(auth)/
├── layout.tsx                  → Layout da área de auth
├── login/page.tsx              → Tela de login (simplificada)
├── logout/page.tsx             → Tela de logout
└── reset-password/page.tsx     → Tela de reset
```

---

## Database Schema v2.0

### Mudanças Necessárias

```sql
-- 1. Nova tabela de sessões (substitui intelink_sessions)
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES intelink_unit_members(id) ON DELETE CASCADE,
    
    -- Tokens
    access_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT UNIQUE,
    
    -- Metadata
    device_info JSONB,                    -- User agent, IP, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft revocation
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Índices para performance
CREATE INDEX idx_auth_sessions_member ON auth_sessions(member_id);
CREATE INDEX idx_auth_sessions_access ON auth_sessions(access_token);
CREATE INDEX idx_auth_sessions_refresh ON auth_sessions(refresh_token);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at) WHERE revoked_at IS NULL;

-- 2. Cleanup de colunas legadas em intelink_unit_members
-- (após migração completa)
-- ALTER TABLE intelink_unit_members DROP COLUMN IF EXISTS password_reset_code;
-- ALTER TABLE intelink_unit_members DROP COLUMN IF EXISTS password_reset_expires;

-- 3. Nova tabela de audit log
CREATE TABLE auth_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES intelink_unit_members(id),
    action TEXT NOT NULL,                 -- login, logout, password_reset, etc.
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_member ON auth_audit_log(member_id);
CREATE INDEX idx_auth_audit_action ON auth_audit_log(action, created_at);
```

---

## Core Types (TypeScript)

```typescript
// /lib/auth/types.ts

export interface Member {
    id: string;                           // UUID - ÚNICO IDENTIFICADOR
    name: string;
    phone: string;
    email?: string;
    role: 'investigador' | 'analista' | 'escrivao' | 'delegado' | 'estagiario';
    systemRole: 'super_admin' | 'unit_admin' | 'member' | 'visitor';
    unitId: string;
    telegramChatId?: number;              // Opcional - para 2FA
    telegramUsername?: string;
}

export interface Session {
    id: string;
    memberId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    member: Member;
}

export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    error: string | null;
}

export interface LoginRequest {
    phone: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    success: boolean;
    session?: Session;
    requiresOtp?: boolean;                // Se precisa 2FA
    error?: string;
}
```

---

## API Design v2.0

### POST /api/auth/login

**Request:**
```json
{
    "phone": "34996522114",
    "password": "******",
    "rememberMe": true
}
```

**Response (Success):**
```json
{
    "success": true,
    "session": {
        "id": "uuid",
        "memberId": "uuid",
        "expiresAt": "2025-12-13T10:00:00Z",
        "member": {
            "id": "uuid",
            "name": "JESSICA",
            "role": "estagiario",
            "systemRole": "member"
        }
    }
}
```

**Response (Requires OTP):**
```json
{
    "success": true,
    "requiresOtp": true,
    "message": "Código enviado para seu Telegram"
}
```

**Cookies Set:**
- `intelink_access` (HTTP-only, Secure, SameSite=Strict)
- `intelink_refresh` (HTTP-only, Secure, SameSite=Strict, Path=/api/auth/refresh)

### GET /api/auth/verify

**Response:**
```json
{
    "valid": true,
    "session": { ... }
}
```

### POST /api/auth/logout

Revoga sessão e limpa cookies.

---

## Frontend Hook

```typescript
// /lib/auth/hooks/useAuth.ts

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        session: null,
        error: null
    });

    // Verify session on mount
    useEffect(() => {
        verifySession();
    }, []);

    const verifySession = async () => {
        try {
            const res = await fetch('/api/auth/verify');
            if (res.ok) {
                const data = await res.json();
                setState({
                    isAuthenticated: true,
                    isLoading: false,
                    session: data.session,
                    error: null
                });
            } else {
                setState({
                    isAuthenticated: false,
                    isLoading: false,
                    session: null,
                    error: null
                });
            }
        } catch (e) {
            setState(prev => ({ ...prev, isLoading: false, error: 'Network error' }));
        }
    };

    const login = async (phone: string, password: string, rememberMe = false) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, rememberMe })
        });
        
        const data = await res.json();
        
        if (data.success && data.session) {
            setState({
                isAuthenticated: true,
                isLoading: false,
                session: data.session,
                error: null
            });
            return { success: true };
        }
        
        if (data.requiresOtp) {
            return { success: true, requiresOtp: true };
        }
        
        setState(prev => ({ ...prev, isLoading: false, error: data.error }));
        return { success: false, error: data.error };
    };

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            error: null
        });
    };

    return {
        ...state,
        login,
        logout,
        refresh: verifySession
    };
}
```

---

## Migration Plan

### Phase 1: Foundation (1-2 dias)
- [ ] Criar `/lib/auth/` com tipos e helpers
- [ ] Criar nova tabela `auth_sessions`
- [ ] Implementar JWT utilities

### Phase 2: API (2-3 dias)
- [ ] Criar novo `/api/auth/login` unificado
- [ ] Criar `/api/auth/verify` (cookie-based)
- [ ] Criar `/api/auth/logout`
- [ ] Criar `/api/auth/refresh`

### Phase 3: Frontend (2-3 dias)
- [ ] Criar hook `useAuth`
- [ ] Refatorar `/app/(auth)/login/page.tsx`
- [ ] Refatorar `/app/page.tsx` para usar hook
- [ ] Remover dependência de localStorage para auth

### Phase 4: Cleanup (1 dia)
- [ ] Migrar sessões existentes para nova tabela
- [ ] Remover código legado
- [ ] Atualizar documentação

### Phase 5: Testing (1-2 dias)
- [ ] Testes unitários para `/lib/auth/`
- [ ] Testes de integração para APIs
- [ ] Testes E2E para fluxo completo

---

## Security Checklist

- [ ] Tokens armazenados apenas em HTTP-only cookies
- [ ] Refresh tokens com rotação
- [ ] Rate limiting em todas as rotas de auth
- [ ] Audit log de todas as ações
- [ ] Proteção contra CSRF
- [ ] Senhas com bcrypt (cost 12+)
- [ ] OTP com expiração curta (5 min)
- [ ] Lockout após tentativas falhas
- [ ] Validação de input em todas as rotas

---

## Estimated Effort

| Phase | Tempo | Prioridade |
|-------|-------|------------|
| Foundation | 1-2 dias | P0 |
| API | 2-3 dias | P0 |
| Frontend | 2-3 dias | P0 |
| Cleanup | 1 dia | P1 |
| Testing | 1-2 dias | P1 |
| **Total** | **7-11 dias** | |

---

## Quick Win (Agora)

Enquanto a refatoração não acontece, o fix atual já resolve:

1. ✅ Sessões com chat_id negativo deletadas do banco
2. ✅ Frontend detecta e limpa chat_id inválido
3. ✅ Novos logins salvam telefone em vez de chat_id fake

---

## Decision Required

Antes de iniciar a refatoração:

1. **Manter compatibilidade** com login via Telegram bot? (Ou migrar 100% para web?)
2. **Exigir 2FA** para todos ou apenas para admins?
3. **Refresh token** - implementar agora ou depois?
4. **Audit log** - nível de detalhe desejado?

---

*Documento criado em: 2025-12-12*
*Autor: Cascade AI Assistant*
*Status: DRAFT - Aguardando aprovação*
