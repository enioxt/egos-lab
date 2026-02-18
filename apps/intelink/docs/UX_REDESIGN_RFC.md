# RFC: Redesign de UX - Intelink

**Versão:** 1.0.0  
**Data:** 2025-12-10  
**Status:** RFC (Request for Comments)  
**Autores:** Análise consolidada de ChatGPT + Claude + Especialistas UX

---

## 📋 Resumo Executivo

Análise completa da interface atual do Intelink identificou problemas de hierarquia visual e fluxo cognitivo. As principais conclusões:

1. **A busca está escondida** - deveria ser protagonista
2. **O card "Central de Inteligência" é grande demais** - ocupa espaço inútil
3. **A narrativa está tímida** - deveria ser o centro da investigação
4. **Falta direção** - o sistema mostra dados, deveria mostrar ações

---

## 🎯 Diagnóstico Detalhado

### 1. Busca Global (CRÍTICO)

**Estado Atual:**
- Pequena e em posição secundária
- Visualmente igual a elementos menos importantes
- Sem contraste suficiente
- Atalho "Ctrl+K" quase invisível

**Problema de UX:**
> "A busca é o órgão vital de um sistema de inteligência. Se o usuário não a vê, o sistema perde metade do poder."

**Benchmark:**
- Palantir: Busca ocupa 50% do header
- AWS Console: Search bar central com foco automático
- Kibana: Omnibar com autosuggest
- Notion: CMD+K como feature principal

**Solução Proposta:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Logo     [🔍 Buscar pessoas, CPFs, placas, telefones...  ⌘K]  │
│            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^     │
│            Largura: 50% | Altura: 48px | Fundo claro           │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Card "Central de Inteligência" (PROBLEMA)

**Estado Atual:**
- Ocupa ~300px verticais
- Texto "Análises avançadas..." é decorativo
- Métricas poderiam estar em barra compacta
- Usuário tem que rolar para ver operações

**Problema de UX:**
> "É um 'Welcome Screen'. O policial vê isso no dia 1 e acha bonito. No dia 30, ele odeia porque ocupa espaço e tem que rolar."

**Solução Proposta:**
- REMOVER o card banner grande
- Criar **Stats Bar** horizontal (80px máx)
- Métricas lado a lado: `6 Vínculos | Rho 7.8% | 5 Ops Ativas`

### 3. Dashboard de Operações (BOM, MAS PODE MELHORAR)

**Estado Atual:**
- Informativo e organizado
- Muito "flat" - sem hierarquia de urgência
- "9 entidades, 6 vínculos" é técnico demais

**Problema de UX:**
> "O ideal é mostrar DIREÇÃO, não apenas dados."

**Solução Proposta:**
- Destacar operações com **risco alto** (cor/badge)
- Indicadores inteligentes:
  - "3 entidades NOVAS esta semana"
  - "2 cross-cases pendentes"
  - "Rho cresceu 15%"
- Ordenar por relevância, não por data

### 4. Página de Investigação (EVOLUINDO BEM)

**Estado Atual:**
- Resumo narrativo bom, mas "enterrado"
- CTA "Atualizar análise" pouco visível
- Cross-case insights ocupam muito espaço
- Grafo é "cru" - sem modo história

**Solução Proposta:**
- Narrativa no TOPO com destaque visual
- Ícone de IA pulsante (Sparkles)
- Cross-cases colapsados por padrão
- Botão "Atualizar" mais proeminente

---

## 🔧 Plano de Ação

### Fase 1: Quick Wins (1-2 dias)

| # | Task | Impacto | Esforço |
|---|------|---------|---------|
| 1.1 | Aumentar busca global (h-12, w-50%, bg-slate-700) | Alto | Baixo |
| 1.2 | Adicionar glow effect no foco (ring-4 ring-blue-500/20) | Médio | Baixo |
| 1.3 | Detectar OS e mostrar ⌘K vs Ctrl K | Médio | Baixo |
| 1.4 | Remover botão "Demo" (se existir) | Baixo | Baixo |

### Fase 2: Reorganização (3-5 dias)

| # | Task | Impacto | Esforço |
|---|------|---------|---------|
| 2.1 | Remover card banner "Central de Inteligência" | Alto | Médio |
| 2.2 | Criar Stats Bar horizontal | Alto | Médio |
| 2.3 | Mover busca para centro absoluto do header | Alto | Médio |
| 2.4 | Compactar quick actions (Chat IA, Relatórios, Gestão) | Médio | Baixo |

### Fase 3: Inteligência Visual (5-7 dias)

| # | Task | Impacto | Esforço |
|---|------|---------|---------|
| 3.1 | Destacar operações por risco (badge colorido) | Alto | Médio |
| 3.2 | Indicadores inteligentes no card de operação | Alto | Alto |
| 3.3 | Narrativa com gradiente e ícone IA | Médio | Médio |
| 3.4 | Cross-cases colapsáveis por padrão | Médio | Baixo |

### Fase 4: Polish (7-10 dias)

| # | Task | Impacto | Esforço |
|---|------|---------|---------|
| 4.1 | Modo "história" no grafo | Alto | Alto |
| 4.2 | Autosuggest na busca global | Alto | Alto |
| 4.3 | Animações de transição | Baixo | Médio |
| 4.4 | Temas light/dark consistentes | Baixo | Médio |

---

## 📐 Especificações de Design

### Header Redesign

```css
/* Busca Global - Omnibar */
.global-search {
  width: 50%;
  max-width: 600px;
  height: 48px; /* h-12 */
  background: theme('colors.slate.700');
  border: 1px solid theme('colors.slate.600');
  border-radius: 12px;
  
  /* Foco */
  &:focus-within {
    ring: 4px;
    ring-color: rgba(59, 130, 246, 0.2); /* blue-500/20 */
    border-color: theme('colors.blue.500');
  }
}

/* Atalho de teclado */
.kbd-shortcut {
  background: theme('colors.slate.800');
  border: 1px solid theme('colors.slate.600');
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 10px;
  font-family: monospace;
}
```

### Stats Bar

```jsx
<div className="flex items-center gap-4 px-4 py-2 bg-slate-900/50 border-b border-slate-800">
  <StatCard icon={Link2} value="6" label="Vínculos Pendentes" href="/central/vinculos" />
  <StatCard icon={Activity} value="7.8%" label="Rho Global" href="/central/saude" />
  <StatCard icon={FileText} value="5" label="Ops Ativas" />
</div>
```

### Operação Card (Redesign)

```jsx
<div className="relative">
  {/* Badge de Risco */}
  {operation.risk_level === 'high' && (
    <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
  )}
  
  <h3>{operation.title}</h3>
  
  {/* Indicadores Inteligentes */}
  <div className="flex gap-2 text-xs">
    {operation.new_entities > 0 && (
      <span className="text-emerald-400">+{operation.new_entities} esta semana</span>
    )}
    {operation.pending_crosscases > 0 && (
      <span className="text-amber-400">{operation.pending_crosscases} cross-cases</span>
    )}
  </div>
</div>
```

---

## 📊 Métricas de Sucesso

### KPIs a Monitorar

| Métrica | Baseline | Meta |
|---------|----------|------|
| Tempo até primeira busca | 8s | 2s |
| Cliques para ver operação | 3 | 1 |
| Uso do CMD+K | 5% | 40% |
| Scroll na home | 2x | 0x |
| NPS investigadores | - | > 8 |

### Testes A/B Sugeridos

1. **Busca**: Posição atual vs centralizada
2. **Stats Bar**: Com vs sem
3. **Narrativa**: Compacta vs expandida

---

## 🔗 Referências de Design

1. **Palantir Gotham**: Busca centralizada, cards compactos
2. **Elastic Kibana**: Omnibar com filtros
3. **Notion**: CMD+K como cidadão de primeira classe
4. **Linear**: Dashboard focado em ação

---

## 📝 Changelog

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-12-10 | 1.0.0 | Documento inicial baseado em análise de especialistas |

---

*Documento criado por: Equipe Intelink*  
*Aguardando aprovação para implementação*
