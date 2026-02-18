# Design Standards — Intelink

**Sacred Code:** 000.111.369.963.1618
**Versão:** 1.0.0 (16/12/2025)

> **IMPORTANTE:** Este arquivo DEVE ser lido pelo agente a cada 5-10 commits.
> Use `mcp13_search_nodes("design_standards")` para recuperar da memória.

---

## 🎨 Paleta de Cores (Dark Mode Only)

```css
/* BACKGROUNDS */
--bg-primary: slate-950 (#020617)
--bg-secondary: slate-900 (#0f172a)
--bg-tertiary: slate-800 (#1e293b)
--bg-input: slate-800/50 (semi-transparent)

/* TEXT */
--text-primary: white (#ffffff)
--text-secondary: slate-400 (#94a3b8)
--text-muted: slate-500 (#64748b)
--text-placeholder: slate-500

/* SEMANTIC COLORS */
--danger: red-500/400 (#ef4444 / #f87171)
--warning: amber-500/400 (#f59e0b / #fbbf24)
--success: emerald-500/400 (#10b981 / #34d399)
--info: blue-500/400 (#3b82f6 / #60a5fa)
--accent: purple-500/400 (#a855f7 / #c084fc)

/* BORDERS */
--border-default: slate-700 (#334155)
--border-focus: blue-500 / purple-500
```

---

## 📐 Spacing (Tailwind 4pt Grid)

| Uso | Classes |
|-----|---------|
| Padding container | `p-4`, `p-6` |
| Gap between items | `gap-2`, `gap-4` |
| Margin sections | `my-4`, `my-6` |
| Border radius | `rounded-lg`, `rounded-xl` |

**REGRA:** NUNCA use magic numbers (ex: `px-[13px]`). Use grid Tailwind.

---

## 🖱️ Componentes Interativos

### Dropdowns/Selects
```tsx
className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg 
           text-white appearance-none 
           focus:outline-none focus:ring-2 focus:ring-purple-500 
           [&>option]:bg-slate-800 [&>option]:text-white"
```

### Buttons
```tsx
// Primary
className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"

// Secondary
className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"

// Danger
className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"

// Disabled
className="... disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
```

### Inputs
```tsx
className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg 
           text-white placeholder-slate-500
           focus:outline-none focus:ring-2 focus:ring-blue-500"
```

---

## 📝 Tipografia

| Uso | Classes |
|-----|---------|
| Headings (h1) | `text-xl font-bold text-white` |
| Headings (h2) | `text-lg font-semibold text-white` |
| Body text | `text-sm text-slate-300` |
| Labels | `text-xs font-medium text-slate-400` |
| Muted | `text-xs text-slate-500` |

---

## 🎯 Fitts's Law (Hit Areas)

- **Min hit-area:** 40x40px (10 Tailwind units)
- **Padding inside links**, not around
- Botões com ícone: `gap-2` entre ícone e texto

---

## ✅ Checklist de UI (Antes de Commit)

- [ ] Cores seguem paleta? (sem cores hardcoded)
- [ ] Spacing usa grid Tailwind? (sem magic numbers)
- [ ] Dropdowns têm `[&>option]:bg-slate-800`?
- [ ] Botões têm estados `hover` e `disabled`?
- [ ] Focus rings configurados?
- [ ] Text colors corretos? (white/slate-400/slate-500)

---

## 🔄 Integração com Workflow

### Em `/start`
O agente deve verificar se há mudanças de UI pendentes e lembrar destes standards.

### Em `/end`
O handoff deve incluir:
- Componentes UI criados/modificados
- Se seguiram os standards

### A cada 5-10 commits
O agente deve reler este arquivo ou consultar:
```
mcp13_search_nodes("design_standards")
```

---

## 📚 Referências

- `.guarani/PREFERENCES.md` — Regras gerais
- `docs/DESIGN_SYSTEM.md` — Componentes completos
- `apps/intelink/tailwind.config.ts` — Configuração Tailwind

---

*"Consistency breeds trust. Follow the standards."*
