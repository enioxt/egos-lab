# 📊 Diagnóstico de Páginas - INTELINK

**Data:** 2025-12-05  
**Status Build:** ✅ PASSING

---

## 🔐 Páginas com Proteção RBAC

| Página | Proteção | Hook | Permissão Verificada |
|--------|:--------:|------|----------------------|
| `/central/configuracoes` | ✅ | useRole | `canAccessConfig` |
| `/central/permissoes` | ✅ | useRole | `canManagePermissions` |
| `/central/delegacias` | ⚠️ | useRole | Apenas lê role, não bloqueia |
| `/investigation/new` | ✅ | useRBAC | `investigation:create` |
| `/profile` | ✅ | useRole | Mostra permissões do usuário |

---

## 🟡 Páginas SEM Proteção (Acessíveis a todos logados)

| Página | Função | Precisa Proteção? |
|--------|--------|:-----------------:|
| `/` | Home/Dashboard | ❌ (todos podem ver) |
| `/central` | Central de Inteligência | ⚠️ P1 |
| `/central/vinculos` | Vínculos entre entidades | ⚠️ P1 |
| `/central/graph` | Grafo geral | ⚠️ P1 |
| `/central/membros` | Lista de membros | ⚠️ P1 |
| `/central/operacoes` | Operações | ⚠️ P2 |
| `/central/analise-vinculos` | Análise cross-case | ⚠️ P1 |
| `/chat` | Chat IA | ❌ (todos podem usar) |
| `/equipe` | Equipe da unidade | ❌ |
| `/investigation/[id]` | Detalhe operação | ⚠️ P1 |
| `/graph/[id]` | Grafo operação | ❌ |
| `/reports` | Relatórios | ⚠️ P2 |
| `/jobs` | Jobs de processamento | ⚠️ P2 |
| `/analytics` | Analytics | ⚠️ P2 |
| `/activity` | Atividade | ❌ |

---

## 📋 AÇÕES RECOMENDADAS

### P0 - CRÍTICO (Hoje)
1. ✅ Corrigir auth/me para usar member_id
2. ✅ Atualizar useRole e useRBAC
3. **AGUARDANDO**: Testar no browser se permissões aparecem

### P1 - Alta Prioridade
1. [ ] Adicionar proteção RBAC em `/central` (apenas member+)
2. [ ] Adicionar proteção em `/central/vinculos` (apenas member+)
3. [ ] Adicionar proteção em `/investigation/[id]` (scope: own/unit/all)
4. [ ] Adicionar proteção em `/central/membros` (apenas unit_admin+)
5. [ ] Adicionar proteção em `/central/analise-vinculos` (apenas member+)

### P2 - Média Prioridade
1. [ ] Proteção em `/reports` (member+)
2. [ ] Proteção em `/jobs` (unit_admin+)
3. [ ] Proteção em `/analytics` (member+)
4. [ ] Proteção em `/central/operacoes` (member+)

---

## 🔑 SEU PERFIL

```
ID: 7a62c0fa-e690-4165-ad88-1ca09aa1b737
Nome: ENIO
Telefone: 34992374363
system_role: super_admin ✅
role: investigador
Unidade: 70b665bd-0c53-4ad3-b6d0-7c5344cf41d6
```

### Permissões Esperadas:
- ✅ `canManageSystem`
- ✅ `canManagePermissions`
- ✅ `canManageUnits`
- ✅ `canManageMembers`
- ✅ `canEditInvestigations`
- ✅ `canViewInvestigations`
- ✅ `canAccessConfig`

---

## 🧪 TESTE MANUAL

Para verificar se as permissões estão funcionando:

1. Abra http://localhost:3001/auth
2. Faça login com telefone: 34992374363
3. Acesse http://localhost:3001/profile
4. Verifique se mostra "Super Admin" e todas permissões ✅
5. Acesse http://localhost:3001/central/permissoes
6. Deve mostrar lista de membros para gerenciar

---

## 📊 Fluxo de Autenticação

```
1. /auth (login)
   ├── Salva: intelink_member_id, intelink_token, intelink_chat_id
   └── Cookie: intelink_session

2. useRole() ou useRBAC()
   ├── Lê: intelink_member_id (preferido) ou intelink_token
   ├── Chama: GET /api/auth/me
   └── Retorna: system_role, permissões

3. /api/auth/me
   ├── Busca membro por ID
   └── Retorna: system_role, role, unit_id
```
