# 🎨 Eagle Eye Dashboard — Stitch Design

> **Status:** Ready for Stitch generation
> **Priority:** P1 (after MVP validation)

---

## Design Request: Eagle Eye Results Dashboard

### Context
Dashboard para visualizar oportunidades detectadas pelo Eagle Eye nos diários oficiais brasileiros. O usuário vê as oportunidades filtradas por padrão, cidade e urgência.

### Users
- Admin (Enio) — visualiza oportunidades e decide ações
- Agente AI — alimenta dados via API

### Requirements

#### Must Have
- [ ] Cards de oportunidades com confidence score visual
- [ ] Filtros: por padrão (17), por cidade, por urgência
- [ ] Timeline de publicações recentes
- [ ] Badge de urgência colorido (🔴 critical, 🟠 high, 🟡 medium, 🟢 low)
- [ ] Detalhe expansível com o trecho do diário oficial

#### Nice to Have
- [ ] Gráfico de tendências (oportunidades/semana)
- [ ] Mapa do Brasil com cidades monitoradas
- [ ] Dark/Light mode toggle

### Data Displayed

```
- pattern_name: string (e.g. "Licitações e Compras Públicas")
- confidence: number 0-100 → progress bar (green > 70, yellow > 40, red < 40)
- urgency: "critical" | "high" | "medium" | "low" → color badge
- territory_name: string (e.g. "Belo Horizonte")
- date: date (e.g. "2026-02-13")
- ai_reasoning: string (1-2 sentences)
- matched_keywords: string[] → tags/chips
- action_deadline: date | null → countdown badge
- cost_usd: number → small label
```

### Stitch Prompt

> **Copie este prompt diretamente para o Google Stitch:**

```
Design a modern dashboard for "Eagle Eye" — a Brazilian official gazette monitoring 
platform that uses AI to identify business opportunities from legislative changes.

STYLE:
- Dark mode (slate-900 bg), glassmorphism cards with subtle borders
- Color palette: slate-900/800 background, emerald-500 accents for opportunities, 
  amber-500 for warnings, rose-500 for critical, sky-500 for info
- Font: Inter (body) + JetBrains Mono (data/numbers)
- Premium SaaS aesthetic — think "Linear" or "Vercel Dashboard" quality
- Portuguese (PT-BR) labels for all text

LAYOUT (Desktop — 1440px):
- Top bar: logo "🦅 Eagle Eye" left, date picker + city selector right
- Left sidebar (240px): 17 pattern filters as checkable list, grouped by Tier 1/2/3
- Main content: 
  - Row 1: 4 KPI cards (Total Opportunities, Critical, This Week Cost, Monitored Cities)
  - Row 2: Opportunity cards grid (2 columns)

OPPORTUNITY CARD:
- Header: Pattern name (bold) + urgency badge (colored pill)
- Body: AI reasoning text (2 lines max, expandable)
- Footer: confidence bar (0-100), keyword tags, territory name, date
- If action_deadline: show countdown "⏰ 5 dias restantes" in amber
- Hover: subtle glow + expand preview

KPI CARDS:
- Glass background, subtle border
- Large number, small label below
- Mini sparkline in corner

FILTERS SIDEBAR:
- Tier 1 (Alta Relevância): green dot indicator, 5 patterns
- Tier 2 (Média Relevância): yellow dot, 10 patterns  
- Tier 3 (Monitoramento): gray dot, 2 patterns
- Each with checkbox + count badge

SAMPLE DATA:
- Card 1: "Pregão Eletrônico nº 015/2026 — Aquisição de equipamentos de TI"
  Confidence: 92%, Urgency: Critical, Keywords: [licitação, pregão, TI]
  City: Belo Horizonte, Deadline: 2026-02-28
- Card 2: "Alteração de Zoneamento — Área Industrial Região Norte"
  Confidence: 78%, Urgency: High, Keywords: [zoneamento, plano diretor]
  City: Uberlândia, No deadline
- Card 3: "Nova Obrigação LGPD para Órgãos Municipais"
  Confidence: 65%, Urgency: Medium, Keywords: [LGPD, regulamentação]
  City: Contagem, Deadline: 2026-06-01

NO placeholder images. Use icons from Lucide React. No phone/laptop frames.
```

### Reference Designs
- [Vercel Dashboard](https://vercel.com/dashboard) — dark, minimal, premium
- [Linear](https://linear.app) — clean list views with status badges
- [PostHog](https://posthog.com) — data-heavy dashboard with good filters

### Notes for Implementation
- After Stitch approval, implement with Next.js App Router + shadcn/ui + Recharts
- This will be a future app in egos-lab or an addition to eagle-eye
- API backend already exists in `analyze_gazette.ts`
