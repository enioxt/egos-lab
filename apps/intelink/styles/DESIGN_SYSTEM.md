# 🎨 Intelink Design System v2.0

**Atualizado:** 2025-12-12
**Filosofia:** Inteligência Policial - Dark Mode Only

---

## 🎯 Princípios de Design

1. **Minimalismo Funcional** - Menos cores = menos fadiga em turnos longos
2. **Hierarquia Clara** - Apenas ação principal colorida, resto ghost
3. **Consistência** - Mesmas cores, mesmos tamanhos, mesmos padrões
4. **Dark Mode Only** - Não há light mode

---

## Paleta de Cores Principal

### Backgrounds
| Nome | Classe | Hex | Uso |
|------|--------|-----|-----|
| **bg-primary** | `bg-slate-950` | #020617 | Fundo principal das páginas |
| **bg-secondary** | `bg-slate-900` | #0f172a | Cards, modais, dropdowns |
| **bg-card** | `bg-slate-800` | #1e293b | Cards internos, inputs |
| **bg-hover** | `bg-slate-700` | #334155 | Hover states |
| **bg-card-alt** | `bg-slate-800/40` | - | Cards com transparência |

### Cores por Tipo de Entidade
| Tipo | Cor Principal | Background | Border |
|------|--------------|------------|--------|
| **PERSON** | `text-blue-400` | `bg-blue-500/20` | `border-blue-500/30` |
| **LOCATION** | `text-emerald-400` | `bg-emerald-500/20` | `border-emerald-500/30` |
| **VEHICLE** | `text-pink-400` | `bg-pink-500/20` | `border-pink-500/30` |
| **ORGANIZATION** | `text-amber-400` | `bg-amber-500/20` | `border-amber-500/30` |
| **WEAPON/FIREARM** | `text-rose-400` | `bg-rose-500/20` | `border-rose-500/30` |
| **DOCUMENT** | `text-cyan-400` | `bg-cyan-500/20` | `border-cyan-500/30` |

### Cores de Status/Confiança
| Nível | Cor | Background | Uso |
|-------|-----|------------|-----|
| **Crítico (100%)** | `text-red-400` | `bg-red-500/20` | CPF/RG idêntico |
| **Alto (90-99%)** | `text-orange-400` | `bg-orange-500/20` | Nome + Data Nasc |
| **Médio (80-89%)** | `text-yellow-400` | `bg-yellow-500/20` | Telefone match |
| **Baixo (<80%)** | `text-slate-400` | `bg-slate-500/20` | Nome similar |

### Cores de Ação
| Ação | Cor | Background |
|------|-----|------------|
| **Confirmar/Sucesso** | `text-emerald-400` | `bg-emerald-500/20` |
| **Cancelar/Erro** | `text-red-400` | `bg-red-500/20` |
| **Info** | `text-blue-400` | `bg-blue-500/20` |
| **Warning** | `text-amber-400` | `bg-amber-500/20` |

---

## 🔘 Botões

### Hierarquia de Botões

| Tipo | Classe | Uso |
|------|--------|-----|
| **Primary** | `bg-blue-600 hover:bg-blue-700 text-white` | Ação principal (1 por tela) |
| **Ghost** | `text-slate-400 hover:text-white hover:bg-slate-800 border-transparent hover:border-slate-700` | Ações secundárias |
| **Danger** | `bg-red-500/20 text-red-400 hover:bg-red-500/30` | Deletar, cancelar |
| **Success** | `bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30` | Confirmar |

### Exemplos de Classe Completa

```tsx
// Primary Button (+ Nova Operação)
className="flex items-center gap-2 px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"

// Ghost Button (Chat IA, Relatórios, Gestão)
className="flex items-center gap-2 px-3 h-10 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-lg transition-all"

// Danger Button (Deletar)
className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"

// Success Button (Confirmar)
className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors"
```

### Regra de Ouro

> **Apenas 1 botão colorido por seção.** Todo o resto deve ser Ghost.

### Roles de Pessoa
| Role | Cor | Label |
|------|-----|-------|
| **suspeito** | `text-red-400` | Suspeito |
| **vítima** | `text-amber-400` | Vítima |
| **testemunha** | `text-blue-400` | Testemunha |
| **líder** | `text-purple-400` | Líder |
| **informante** | `text-emerald-400` | Informante |

## Componentes Padronizados

### Modal de Entidade
Sempre usar o mesmo layout:
1. Header com ícone, nome, badge de role
2. Seção "Dados Pessoais" (se PERSON)
3. Seções de relacionamentos (Pessoas, Locais, Veículos...)
4. Footer com stats

### Regras de Tamanho
- Modal: `max-w-2xl max-h-[90vh]`
- Card: `rounded-xl` ou `rounded-2xl`
- Botões: `px-4 py-2` (normal), `px-3 py-1.5` (small)
- Texto: 
  - Título: `text-xl font-bold`
  - Subtítulo: `text-sm text-slate-400`
  - Label: `text-xs text-slate-500`
  - Corpo: `text-sm text-white`

## Ícones por Tipo
```typescript
const TYPE_ICONS = {
    PERSON: User,
    LOCATION: MapPin,
    VEHICLE: Car,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    WEAPON: Target,
    FIREARM: Target,
    PHONE: Phone,
    DOCUMENT: FileText,
};
```

## Bordas e Sombras
- Borda padrão: `border border-slate-800`
- Borda hover: `hover:border-slate-700`
- Border radius: `rounded-xl` (cards), `rounded-lg` (buttons)
- Sem sombras (design flat)

## Animações
- Transição: `transition-colors` (hover)
- Loading: `animate-spin` (spinners)
- Modal backdrop: `bg-black/70`
