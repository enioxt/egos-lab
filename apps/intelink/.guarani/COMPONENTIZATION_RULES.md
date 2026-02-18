# 🧩 Regras de Componentização — Intelink

**Versão:** 2.0.0  
**Data:** 2025-12-16
**Status:** OBRIGATÓRIO (enforced via /start e /end)

---

## 🚨 LIMITES DE TAMANHO (HARD LIMITS)

> **REGRA ZERO: Nenhum arquivo deve ultrapassar estes limites**

| Tipo | Limite | Ação se Exceder |
|------|:------:|-----------------|
| **Componente React (.tsx)** | **500 linhas** | 🔴 BLOQUEADOR - Refatorar ANTES de merge |
| **Página Next.js (page.tsx)** | **400 linhas** | 🔴 BLOQUEADOR - Extrair componentes |
| **API Route (route.ts)** | **300 linhas** | 🟡 ALERTA - Extrair para lib/ |
| **Lib/Util (.ts)** | **400 linhas** | 🟡 ALERTA - Modularizar |
| **Hooks (.ts)** | **150 linhas** | 🟡 ALERTA - Dividir responsabilidades |

### ⚠️ Ações Obrigatórias ao Atingir Limite:

1. **PARAR** - Não adicionar mais código ao arquivo
2. **ANALISAR** - Identificar seções extraíveis
3. **EXTRAIR** - Criar módulo/componente separado
4. **IMPORTAR** - Usar o novo módulo no arquivo original
5. **VALIDAR** - `wc -l arquivo` deve estar abaixo do limite

### 📏 Verificação de Limites (usar no /start e /end):

```bash
# Verificar arquivos acima do limite
find apps/intelink -name "*.tsx" -exec sh -c 'lines=$(wc -l < "$1"); [ "$lines" -gt 500 ] && echo "🔴 $lines $1"' _ {} \;
find apps/intelink -name "page.tsx" -exec sh -c 'lines=$(wc -l < "$1"); [ "$lines" -gt 400 ] && echo "🔴 $lines $1"' _ {} \;
find apps/intelink/app/api -name "route.ts" -exec sh -c 'lines=$(wc -l < "$1"); [ "$lines" -gt 300 ] && echo "🟡 $lines $1"' _ {} \;
```

---

## 🎯 PRINCÍPIO FUNDAMENTAL

> **"Um componente, um propósito. Se existir, REUSE."**

ANTES de criar qualquer componente UI:
1. Procurar em `components/shared/` se já existe
2. Verificar `components/intelink/` para componentes específicos
3. Usar `grep_search` para encontrar duplicatas

---

## 📦 COMPONENTES CANÔNICOS (SSOT)

### Modais
| Componente | Local | Usar Para |
|------------|-------|-----------|
| **EntityDetailModal** | `components/shared/` | ✅ MODAL PADRÃO - Mais completo |
| ~~UnifiedEntityModal~~ | DEPRECATED | Falta Síntese + Conexões 2º grau |
| ~~PersonModal~~ | DEPRECATED | Migrar para EntityDetailModal |

### Sub-componentes de Entidade (REUSO OBRIGATÓRIO)
| Componente | Local | Usar Para |
|------------|-------|-----------|
| **EntityNarrativeSummary** | `components/shared/` | Síntese narrativa + conexões diretas |
| **IndirectConnectionsModal** | `components/shared/` | Conexões de 2º grau (teia expandida) |

### Listas e Cards
| Componente | Local | Usar Para |
|------------|-------|-----------|
| **EntityCard** | `components/shared/` | Cards de entidade em listas |
| **RelationshipCard** | `components/shared/` | Cards de relacionamento |

### Navegação
| Componente | Local | Usar Para |
|------------|-------|-----------|
| **PageHeader** | `components/shared/` | Header padrão de páginas |
| **Breadcrumbs** | `components/shared/` | Navegação hierárquica |

---

## 🎨 DESIGN TOKENS (SSOT)

### Cores por Tipo de Entidade
```typescript
// lib/intelink/constants.ts
ENTITY_TYPE_COLORS = {
  PERSON: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  VEHICLE: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  LOCATION: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  ORGANIZATION: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  COMPANY: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  FIREARM: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  PHONE: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
}
```

### Ícones por Tipo
```typescript
// lib/intelink/constants.ts
import { UserCircle, Car, MapPin, Building2, Target, Phone } from 'lucide-react';

ENTITY_TYPE_ICONS = {
  PERSON: UserCircle,
  VEHICLE: Car,
  LOCATION: MapPin,
  ORGANIZATION: Building2,
  COMPANY: Building2,
  FIREARM: Target,
  PHONE: Phone,
}
```

---

## 🔍 PADRÕES DE DETECÇÃO DE DUPLICATAS

### Entidades (intra-investigação)
```sql
-- Considera duplicata SE:
-- 1. Mesmo nome (case-insensitive, trimmed) + mesmo tipo + mesma investigação
-- 2. OU mesmo CPF (se PERSON)
-- 3. OU mesma placa (se VEHICLE)

-- NÃO considera duplicata SE:
-- 1. Nomes similares mas não idênticos (ex: "JOAO SILVA" vs "JOAO S.")
-- 2. Investigações diferentes (isso é cross-case alert, não duplicata)
```

### Thresholds de Similaridade
| Tipo | Exata | Alta | Média |
|------|-------|------|-------|
| CPF | 100% | - | - |
| Placa | 100% | - | - |
| Nome | 100% | ≥95% Jaro-Winkler | ≥85% |
| Endereço | - | ≥90% | ≥80% |

### Human-in-the-Loop
- **Auto-merge:** Apenas para 100% match (nome exato + tipo + investigação)
- **Sugestão:** Para 85-99% similaridade → Entity Resolver Tab
- **Ignorar:** Abaixo de 85% similaridade

---

## ❌ ANTI-PATTERNS (NUNCA FAZER)

1. **Criar novo modal** quando UnifiedEntityModal existe
2. **Hardcoded colors** em componentes (usar constants.ts)
3. **Copiar componente** ao invés de extrair para shared/
4. **Inline styles** exceto para valores dinâmicos
5. **Duplicar lógica** de formatação de entidades

---

## ✅ CHECKLIST: Antes de Criar Componente

- [ ] Procurei em `components/shared/`?
- [ ] Procurei em `components/intelink/`?
- [ ] Fiz `grep_search` pelo nome/funcionalidade?
- [ ] O componente existente pode ser estendido com props?
- [ ] Se criar novo, será em `shared/` para reuso?
- [ ] Usa cores de `constants.ts`?
- [ ] Usa ícones de `lucide-react`?

---

## 🔄 MIGRAÇÃO PENDENTE

### Fase 1: Modais (P1)
1. [ ] Migrar `PersonModal` → `UnifiedEntityModal`
2. [ ] Migrar `EntityDetailModal` → `UnifiedEntityModal`
3. [ ] Deprecar arquivos antigos

### Fase 2: Cards (P2)
1. [ ] Consolidar cards de entidade
2. [ ] Criar `EntityCard` genérico

---

*"Código duplicado é dívida técnica. Componentes reutilizáveis são investimento."*
