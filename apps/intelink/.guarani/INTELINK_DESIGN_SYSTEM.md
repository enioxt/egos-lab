# INTELINK DESIGN SYSTEM
# Version: 1.0.0
# Updated: 2025-12-10
# Purpose: Garantir consistência visual entre todos os modelos de IA

---

## 1. PALETA DE CORES (Tailwind)

### Backgrounds
```
Page BG:     slate-950
Card BG:     slate-900/50 ou slate-900
Input BG:    slate-800
Secondary:   slate-800/50
```

### Borders
```
Default:     border-slate-800
Hover:       border-slate-700
Active:      border-blue-500
```

### Text
```
Headings:    text-white
Body:        text-slate-300
Metadata:    text-slate-400
Disabled:    text-slate-500
```

---

## 2. STATUS COLORS (SEMÂNTICO - OBRIGATÓRIO)

**NUNCA use cores aleatórias. Use APENAS estas mappings:**

| Status | Background | Text | Border | Uso |
|--------|------------|------|--------|-----|
| 🔴 CRITICAL | `bg-red-500/10` | `text-red-500` | `border-red-500/20` | Crimes, Alertas, Erros |
| 🟠 HIGH | `bg-orange-500/10` | `text-orange-500` | `border-orange-500/20` | Warnings, Duplicatas |
| 🟡 MEDIUM | `bg-yellow-500/10` | `text-yellow-500` | `border-yellow-500/20` | Atenção, Pendente |
| 🟢 SUCCESS | `bg-emerald-500/10` | `text-emerald-500` | `border-emerald-500/20` | Verificado, Seguro |
| 🔵 INFO | `bg-blue-500/10` | `text-blue-400` | `border-blue-500/20` | Informação, Links |
| ⚫ ADMIN | `bg-slate-700` | `text-slate-300` | `border-slate-600` | Settings, Roles |

**REGRA DE OURO:** Vermelho é APENAS para crimes, alertas e erros. NUNCA para botões admin.

---

## 3. COMPONENTES PADRÃO

### StatusBadge
```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

<StatusBadge status="critical">Extremo</StatusBadge>
<StatusBadge status="high">Alto</StatusBadge>
<StatusBadge status="medium">Médio</StatusBadge>
<StatusBadge status="success">Saudável</StatusBadge>
<StatusBadge status="admin">Admin</StatusBadge>
```

### StandardCard
```tsx
import { StandardCard } from '@/components/ui/StandardCard';

<StandardCard 
  title="Título" 
  subtitle="Subtítulo opcional"
  icon={<IconComponent />}
  headerAction={<Button />}
>
  {children}
</StandardCard>
```

---

## 4. LAYOUT PATTERNS

### Page Structure
```tsx
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <PageHeaderCompact title="..." />
  <div className="space-y-6">
    {/* Content */}
  </div>
</main>
```

### Grid de Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
  {/* Cards com h-full */}
</div>
```

### Card Padrão
```tsx
<div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full flex flex-col">
  {/* Header */}
  <div className="flex-1">{/* Content */}</div>
  <div className="mt-auto">{/* Footer/Actions */}</div>
</div>
```

---

## 5. TIPOGRAFIA

### Headings
```
H1: text-2xl font-bold text-white
H2: text-xl font-semibold text-white
H3: text-lg font-medium text-white
H4: text-sm font-semibold text-slate-400 uppercase tracking-wider
```

### Body
```
Default: text-sm text-slate-300
Small:   text-xs text-slate-400
Micro:   text-xs text-slate-500
```

---

## 6. CONTEXTO INVESTIGATIVO (DOMAIN)

### Persona do Usuário
- **É:** Investigador de Polícia
- **NÃO É:** Admin de TI

### Hierarquia de Prioridade
1. **PESSOAS** (Suspeitos/Vítimas) - Sempre #1
2. **EVIDÊNCIAS** (Armas/Drogas) - #2
3. **LOCAIS/VEÍCULOS** - #3
4. **SISTEMA/ADMIN** - Menor prioridade

### Terminologia
| ❌ Técnico | ✅ Policial |
|------------|-------------|
| Database ID | Número do Caso |
| Rho Index | Índice de Integridade |
| Null | (não mostrar) |
| Entity | Envolvido |
| Relationship | Vínculo |

---

## 7. REGRAS DE CÓDIGO

### Null Safety (OBRIGATÓRIO)
```tsx
// ❌ ERRADO
<p>{user.phone}</p>
<p>Telefone: {user.phone || 'Não informado'}</p>

// ✅ CORRETO
{user.phone && <p>{user.phone}</p>}
```

### Icons (Lucide)
```
Small UI:  w-4 h-4
Headers:   w-5 h-5
Large:     w-6 h-6
```

### Modularização
- Componente > 200 linhas → Quebrar
- 3+ usos do mesmo estilo → Criar componente

---

## 8. COMPONENTES EXISTENTES NO CODEBASE

### UI Kit (`@/components/ui/`)
| Componente | Uso |
|------------|-----|
| `StatusBadge` | Badges semânticos (critical/high/medium/success/admin) |
| `StandardCard` | Cards com header/content/footer |
| `StandardCardGrid` | Grid com auto-rows-fr |
| `Card` | Card básico (shadcn style) |

### Shared (`@/components/shared/`)
| Componente | Uso |
|------------|-----|
| `PageHeader` | Header de página com back link |
| `PageHeaderCompact` | Header sem back link, com actions |
| `CollapsibleCard` | Card colapsável com localStorage |
| `EvidenceDetailModal` | Modal de evidência |
| `EntityDetailModal` | Modal de entidade |
| `UnifiedEntityModal` | Modal unificado |
| `SmartSearch` | Busca inteligente |
| `VoteModal` | Modal de votação |
| `PhoneDisplay` | Exibe telefone formatado |

### Hooks (`@/hooks/`)
| Hook | Uso |
|------|-----|
| `useCollapsible(id, defaultOpen)` | Estado de colapso com localStorage |
| `useRole()` | RBAC permissions |

---

## 9. PADRÕES DE LAYOUT

### Lista vs Card (Regra de Ouro)
```
CARDS → Para itens complexos com ações (Operações, Delegacias)
TABELA → Para listas de pessoas/membros (escaneabilidade)
```

### Sidebar de Entidades (Border-Left)
```tsx
// ❌ ERRADO - fundo colorido dificulta leitura
<div className="bg-purple-500/20 p-3">

// ✅ CORRETO - border-left para categoria
<div className="border-l-4 border-purple-500 pl-3 hover:bg-slate-800/50">
```

### Botões de Ação (Sticky)
```tsx
// ❌ ERRADO - botão no final do scroll
<button className="mt-8">Salvar</button>

// ✅ CORRETO - sticky no header ou footer
<div className="sticky bottom-0 bg-slate-900 border-t p-4">
  <button>Salvar</button>
</div>
```

---

## 10. COMO USAR

### Referência no Prompt
Se o agente desviar do padrão, adicione:
> "Siga as regras de UI em `.guarani/INTELINK_DESIGN_SYSTEM.md`"

### Para Refatorar
```
"Refatore /central/membros para usar StatusBadge e layout de tabela
conforme .guarani/INTELINK_DESIGN_SYSTEM.md"
```

---

*"Consistência visual = Profissionalismo. A IA é um estagiário genial mas desorganizado."*
