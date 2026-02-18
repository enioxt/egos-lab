# API Security Audit - Intelink

**Data:** 2025-12-14
**Status:** TESTING_MODE Ativo
**Autor:** Automated Audit

---

## 🔓 TESTING_MODE (Global)

**Arquivo:** `lib/api-security.ts`

```typescript
const TESTING_MODE = true; // Line 17
```

### Comportamento
- Quando `true`: Todas as APIs com `withSecurity` ou `withSecurityParams` **bypass** autenticação
- Context padrão: `{ memberId: 'test-user', systemRole: 'member', isAuthenticated: true }`

### ⚠️ PRODUÇÃO CHECKLIST
```typescript
// ANTES de deploy para produção:
const TESTING_MODE = false; // Mudar para false
```

---

## 📋 Endpoints com `allowPublic: true`

Esses endpoints têm `allowPublic: true` hardcoded **além** do TESTING_MODE:

| Arquivo | Método | Endpoint | Justificativa | Ação p/ Prod |
|---------|--------|----------|---------------|--------------|
| `investigations/route.ts` | POST | `/api/investigations` | Criar operação | `requiredRole: 'member'` |
| `reports/generate/route.ts` | POST | `/api/reports/generate` | Gerar relatório | `requiredRole: 'member'` |
| `central/route.ts` | GET | `/api/central` | Dashboard central | `requiredRole: 'member'` |

---

## 🔒 Endpoints Protegidos (75+ rotas)

Todos os endpoints com `withSecurity` que usam `requiredRole`:

### Admin Only (`requiredRole: 'unit_admin'` ou `'org_admin'`)
- `/api/admin/*`
- `/api/members` (POST, PATCH, DELETE)
- `/api/units` (POST, PATCH, DELETE)
- `/api/units/delete-request`

### Member+ (`requiredRole: 'member'`)
- `/api/investigations` (PATCH)
- `/api/documents/*`
- `/api/entities/*`
- `/api/chat/*`
- `/api/findings/*`
- `/api/links/*`
- `/api/reports/*`
- `/api/telemetry/*`
- `/api/jobs/*`
- `/api/audit/*`

### Intern+ (`requiredRole: 'intern'`)
- `/api/analytics`
- `/api/history`

---

## 🚀 Passos para Produção

### 1. Desabilitar TESTING_MODE
```bash
# lib/api-security.ts
sed -i 's/const TESTING_MODE = true/const TESTING_MODE = false/' lib/api-security.ts
```

### 2. Restaurar requiredRole nos endpoints
```bash
# investigations/route.ts
sed -i "s/allowPublic: true/requiredRole: 'member'/" app/api/investigations/route.ts

# reports/generate/route.ts  
sed -i "s/allowPublic: true/requiredRole: 'member'/" app/api/reports/generate/route.ts

# central/route.ts
sed -i "s/allowPublic: true/requiredRole: 'member'/" app/api/central/route.ts
```

### 3. Testar
```bash
npm run build
npm run test:e2e
```

---

## 📊 Métricas

- **Total de APIs:** ~75 rotas protegidas
- **TESTING_MODE:** 1 flag global
- **allowPublic hardcoded:** 3 endpoints
- **Última auditoria:** 2025-12-14 22:30 BRT

---

*Gerado automaticamente. Manter atualizado após cada sprint.*
