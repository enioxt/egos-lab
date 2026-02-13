# 🎨 Stitch Prompt 02 — Mapa Nacional

> **Copie este prompt para o Google Stitch**

---

```
Design a geographic intelligence view for "Eagle Eye" showing opportunity 
density across Brazil as an interactive map dashboard.

STYLE: Same as Prompt 01 (dark mode, slate-900, glassmorphism, Inter + JetBrains Mono,
emerald/amber/rose/sky accents). Portuguese PT-BR.

LAYOUT:
TOP BAR: Same as Prompt 01.

MAIN AREA:
- Full-width map of Brazil (simplified SVG silhouette, no Google Maps)
- States outlined with subtle borders (#334155)
- Heat map overlay: states colored by opportunity density
  - High (>100): emerald gradient glow
  - Medium (30-100): amber gradient
  - Low (<30): dim slate-700
  - No data: transparent with dotted border

- Hover on state: tooltip glass card showing:
  "Minas Gerais"
  "347 oportunidades | 12 críticas"
  "Última análise: há 2 horas"

- Click state: zoom + show top 5 cities in that state as floating cards

RIGHT PANEL (320px, slide-in):
- Title: "Detalhes — Minas Gerais"
- Top cities list:
  1. Belo Horizonte — 89 oportunidades (emerald dot)
  2. Uberlândia — 45 (amber dot)
  3. Contagem — 34 (amber dot)
  4. Juiz de Fora — 23 (sky dot)
  5. Betim — 18 (sky dot)

- "Padrões Dominantes" mini bar chart:
  Licitações ████████ 156
  Fiscal █████ 98
  LGPD ████ 67

BOTTOM BAR:
- "Cobertura: 5.569 municípios | Última atualização: 13 fev 2026 08:45"
- Toggle: "Mostrar apenas críticas" switch

NO placeholder images. Lucide React icons. No device frames.
```
