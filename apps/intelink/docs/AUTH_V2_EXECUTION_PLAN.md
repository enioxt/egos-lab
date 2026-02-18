# Auth v2.0 - Plano de Execução Detalhado

**Status:** 🟡 Em Progresso  
**Início:** 2025-12-12  
**Modo:** Local Only (sem deploy até estável)

---

## 📊 Mapeamento do Sistema Atual

### Endpoints de Autenticação

| Endpoint | Método | Função | Status |
|----------|--------|--------|--------|
| `/api/auth/phone` | POST | Login multi-step (phone→password→otp) | 🔴 Complexo demais |
| `/api/auth/verify` | POST | Verificar token Telegram | 🟡 Será removido |
| `/api/auth/forgot-password` | POST | Solicitar reset via email/telegram | 🟢 OK |
| `/api/auth/reset-password` | POST | Executar reset de senha | 🟢 OK |
| `/api/auth/verify-reset-code` | POST | Verificar código de reset | 🟢 OK |
| `/api/auth/link-telegram` | POST | Vincular Telegram à conta | 🟡 Será removido |
| `/api/auth/remember` | POST | Auto-login com remember token | 🔴 Frágil |
| `/api/auth/me` | GET | Info do usuário logado | 🟢 OK |
| `/api/session` | POST | Validação de sessão | 🔴 Confuso |

### Arquivos Frontend

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `app/auth/page.tsx` | ~1600 | UI + lógica misturados |
| `app/page.tsx` | ~1200 | Lógica de auth duplicada |
| `components/shared/Header.tsx` | ~300 | Menu sem verificação de permissão |

### Banco de Dados

| Tabela | Uso | Problema |
|--------|-----|----------|
| `intelink_sessions` | Sessões ativas | `chat_id` como PK (fake para phone users) |
| `intelink_unit_members` | Usuários | Muitas colunas de auth espalhadas |

---

## 🎯 Fases de Execução

### FASE 0: Quick Wins (Hoje)
- [ ] **0.1** Esconder menu "Gestão" para usuários sem permissão
- [ ] **0.2** Criar `/lib/auth/types.ts` com tipos TypeScript

### FASE 1: Foundation (2 dias)
- [ ] **1.1** Criar `/lib/auth/index.ts` - exports públicos
- [ ] **1.2** Criar `/lib/auth/constants.ts` - configurações
- [ ] **1.3** Criar `/lib/auth/jwt.ts` - geração/validação JWT
- [ ] **1.4** Criar `/lib/auth/session.ts` - gerenciamento de sessão
- [ ] **1.5** Criar `/lib/auth/password.ts` - mover funções de hash

### FASE 2: Database (1 dia)
- [ ] **2.1** Criar tabela `auth_sessions` (nova estrutura)
- [ ] **2.2** Criar tabela `auth_audit_log`
- [ ] **2.3** Criar migration script

### FASE 3: API v2 (3 dias)
- [ ] **3.1** POST `/api/v2/auth/login` - endpoint único
- [ ] **3.2** POST `/api/v2/auth/logout`
- [ ] **3.3** POST `/api/v2/auth/refresh`
- [ ] **3.4** GET `/api/v2/auth/verify`
- [ ] **3.5** POST `/api/v2/auth/otp/send`
- [ ] **3.6** POST `/api/v2/auth/otp/verify`
- [ ] **3.7** Migrar password reset para v2

### FASE 4: Frontend v2 (2 dias)
- [ ] **4.1** Criar hook `useAuth.ts`
- [ ] **4.2** Criar hook `usePermissions.ts`
- [ ] **4.3** Refatorar `/app/(auth)/login/page.tsx`
- [ ] **4.4** Refatorar `/app/page.tsx` para usar hooks
- [ ] **4.5** Criar `AuthProvider` context

### FASE 5: Migration (1 dia)
- [ ] **5.1** Script para migrar sessões existentes
- [ ] **5.2** Testar todos os fluxos
- [ ] **5.3** Remover endpoints v1 (deprecate)

### FASE 6: Audit & Security (1 dia)
- [ ] **6.1** Implementar audit logging
- [ ] **6.2** Rate limiting em todas as rotas
- [ ] **6.3** CSRF protection
- [ ] **6.4** Testes de segurança

---

## 📋 Checklist de Hoje (FASE 0)

### 0.1 - Menu de Gestão

Arquivo: `components/shared/Header.tsx` ou similar

```typescript
// Verificar permissão antes de mostrar item do menu
const canAccessAdmin = ['super_admin', 'unit_admin'].includes(user?.systemRole);

{canAccessAdmin && (
  <DropdownMenu>
    <DropdownMenuTrigger>Gestão</DropdownMenuTrigger>
    <DropdownMenuContent>
      {/* items */}
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

### 0.2 - Types TypeScript

```typescript
// /lib/auth/types.ts
export interface Member {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: MemberRole;
    systemRole: SystemRole;
    unitId: string;
}

export type MemberRole = 'investigador' | 'analista' | 'escrivao' | 'delegado' | 'estagiario';
export type SystemRole = 'super_admin' | 'unit_admin' | 'member' | 'visitor' | 'intern';

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
```

---

## 🚫 O que NÃO fazer

1. ❌ Não modificar endpoints v1 existentes (criar v2 em paralelo)
2. ❌ Não fazer deploy até todos os testes passarem
3. ❌ Não remover código legado antes de v2 funcionar 100%
4. ❌ Não misturar lógica de UI com business logic

---

**Próximo passo:** Iniciar FASE 0.1 - Esconder menu de Gestão
