# 🔐 Intelink RBAC - Regras de Acesso

**Versão:** 2.0.0  
**Atualizado:** 2025-12-05  
**Super Admin:** ENIO (ID: 7a62c0fa-e690-4165-ad88-1ca09aa1b737)

---

## 📊 Hierarquia de System Roles

```
super_admin (1000) ─── Poderes totais (APENAS desenvolvedores/TI)
      │
org_admin (800) ───── Admin regional (Delegado Regional)
      │
unit_admin (600) ──── Admin da unidade (Delegado de DP)
      │
member (400) ──────── Membro padrão (investigadores, escrivães)
      │
intern (200) ──────── Estagiário (somente leitura)
      │
visitor (100) ─────── Visitante (demo, oculto)
```

---

## 🎭 Roles Funcionais (Cargo Policial)

| Role | Descrição | Nível |
|------|-----------|:-----:|
| `delegado` | Autoridade policial responsável | 100 |
| `analista` | Analista de inteligência | 80 |
| `investigador` | Investigador de campo | 70 |
| `escrivao` | Escrivão de polícia | 60 |
| `perito` | Perito criminal | 60 |
| `agente` | Agente de polícia | 50 |
| `estagiario` | Em treinamento | 20 |

---

## 🔒 Regras de Negócio Críticas

### 1. Deletar Operação
```
QUEM PODE: NINGUÉM sozinho
REGRA: Requer QUORUM de 2+ membros com role >= unit_admin
MOTIVO: Operações são evidências legais
```

### 2. Criar Role `visitor`
```
QUEM PODE: super_admin APENAS
REGRA: Visitantes são ocultos para outros membros
MOTIVO: Demonstrações controladas
```

### 3. Alterar Roles de Outros
```
QUEM PODE: Apenas roles SUPERIORES na hierarquia
REGRA: canManageRole(manager, target) = manager.level > target.level
EXEMPLO: unit_admin pode alterar member, mas NÃO outro unit_admin
```

### 4. Ver Membros de Outras Unidades
```
QUEM PODE: org_admin, super_admin
REGRA: Membros só veem sua própria unidade
EXCEÇÃO: super_admin vê TUDO
```

### 5. Editar Perfil de Outro Membro
```
QUEM PODE: unit_admin (da mesma unidade), org_admin, super_admin
REGRA: Membros podem editar SEU PRÓPRIO perfil apenas
```

### 6. Acessar Central de Inteligência
```
QUEM PODE: member+, exceto intern
REGRA: intern e visitor podem VER, não AGIR
```

### 7. Criar Operação
```
QUEM PODE: member+ com permissão 'investigation:create'
REGRA: Precisa estar associado a uma unidade
```

### 8. Votar em Vínculos
```
QUEM PODE: member+ (não intern, não visitor)
REGRA: Segundo voto requer EVIDÊNCIA obrigatória
```

---

## 🛡️ Permissões por System Role

### super_admin
- ✅ TUDO (scope: all)
- ✅ Criar role visitor
- ✅ Gerenciar todos os membros
- ✅ Configurar sistema
- ⚠️ NÃO pode deletar operação sozinho (quorum)

### org_admin
- ✅ Ver/Editar todas as unidades
- ✅ Criar/Gerenciar membros
- ✅ Alterar roles (< org_admin)
- ❌ Criar role visitor
- ❌ Configurações de sistema

### unit_admin
- ✅ Gerenciar sua unidade
- ✅ Criar/Editar membros da unidade
- ✅ Arquivar operações
- ❌ Ver outras unidades
- ❌ Alterar roles >= unit_admin

### member
- ✅ Criar/Editar operações (próprias)
- ✅ Votar em vínculos
- ✅ Ver membros da unidade
- ❌ Gerenciar outros membros
- ❌ Acessar configurações

### intern
- ✅ Ver operações
- ✅ Ver entidades
- ✅ Ver membros
- ❌ Editar qualquer coisa
- ❌ Votar
- ❌ Chat IA

### visitor
- ✅ Ver TUDO (demo)
- ✅ Navegar sistema completo
- ❌ Editar/Criar qualquer coisa
- ❌ Votar
- 🔒 OCULTO para outros membros

---

## 📋 Scopes de Permissão

| Scope | Descrição | Exemplo |
|-------|-----------|---------|
| `own` | Apenas recursos próprios | Editar próprio perfil |
| `unit` | Recursos da unidade | Ver operações do DP |
| `all` | Todos os recursos | super_admin |

---

## 🚨 Ações que Requerem Quorum

| Ação | Quorum | Roles Mínimas |
|------|:------:|---------------|
| Deletar Operação | 2 | 2x unit_admin+ |
| Confirmar Vínculo (>=90%) | 2 | member+ |
| Remover Membro | 2 | unit_admin + org_admin |
| Arquivar DP inteira | 2 | org_admin + super_admin |

---

## 💾 IDs Importantes

| Usuário | ID | Role |
|---------|----|----|
| ENIO | `7a62c0fa-e690-4165-ad88-1ca09aa1b737` | super_admin |

---

## 📝 Changelog

- **2025-12-05**: RBAC v2.0 - Sistema completo com scopes
- **2025-12-04**: Sistema de quorum implementado
- **2025-12-03**: Roles básicas definidas
