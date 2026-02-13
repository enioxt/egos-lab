# 🎨 Stitch Prompt 01 — Eagle Eye Overview Dashboard

> **Copie este prompt para o Google Stitch**

---

```
Design a premium SaaS dashboard overview page for "Eagle Eye" — an AI-powered 
platform that monitors 5,500+ Brazilian municipalities' official gazettes 
to detect business opportunities from legislative changes.

STYLE:
- Dark mode: background #0f172a (slate-900), cards #1e293b (slate-800)
- Glassmorphism: cards with rgba(255,255,255,0.05) bg, 1px border rgba(255,255,255,0.1)
- Accents: emerald-500 (#10b981) success, amber-500 (#f59e0b) warning, 
  rose-500 (#f43f5e) critical, sky-500 (#0ea5e9) info
- Font: Inter for body, JetBrains Mono for numbers/data
- Micro-animations: subtle hover glow on cards, smooth transitions
- Premium aesthetic like Linear.app or Vercel Dashboard
- ALL text in Portuguese (PT-BR)

TOP BAR (64px height, sticky):
- Left: "🦅 Eagle Eye" logo in emerald gradient text
- Center: search bar with placeholder "Buscar em diários oficiais..."
- Right: date range picker ("Últimos 7 dias" dropdown), notification bell with red dot, 
  avatar circle

4 KPI CARDS (Row 1, equal width):
1. "Oportunidades Detectadas" — large number "847" in emerald, 
   sparkline trending up, "+12% esta semana" subtitle
2. "Urgência Crítica" — large "23" in rose-500, pulsing dot indicator,
   "requerem ação imediata" subtitle
3. "Municípios Monitorados" — large "5.569" in sky-500, 
   mini Brazil map silhouette icon, "cobertura nacional" subtitle
4. "Custo Total IA" — large "$4.23" in amber, 
   "este mês" subtitle, progress bar showing budget limit

MAIN CONTENT (2 columns):
LEFT COLUMN (65%):
- Section title: "Oportunidades Recentes" with filter chips: 
  [Todas] [Críticas] [Licitações] [LGPD] [Zoneamento]
- 4 opportunity cards stacked:

Card 1 (Critical):
  - Left accent border in rose-500
  - Header: "Pregão Eletrônico nº 015/2026" + 🔴 "Crítica" pill badge
  - Subtitle: "Belo Horizonte, MG — 13 fev 2026"
  - Body: "Aquisição de equipamentos de TI para Secretaria de Educação. 
    Valor estimado R$ 2.4M."
  - Footer row: [92% confidence bar in green] [licitação] [pregão] [TI] tags
  - Countdown: "⏰ 5 dias restantes" in amber

Card 2 (High):
  - Left accent border in amber-500
  - Header: "Alteração de Zoneamento Urbano" + 🟠 "Alta" pill
  - Subtitle: "Uberlândia, MG — 12 fev 2026"
  - Body: "Expansão da zona industrial na região norte. Novas áreas permitidas 
    para uso misto comercial/residencial."
  - Footer: [78% bar] [zoneamento] [plano diretor] tags

Card 3 (Medium):
  - Left border sky-500
  - Header: "Nova Regulamentação LGPD Municipal" + 🟡 "Média" pill
  - Subtitle: "Contagem, MG — 11 fev 2026"

Card 4 (Low):
  - Left border emerald-500
  - Header: "Edital de Inovação — Hub Tecnológico" + 🟢 "Baixa" pill
  - Subtitle: "Campinas, SP — 10 fev 2026"

RIGHT COLUMN (35%):
- "Distribuição por Padrão" — horizontal bar chart showing:
  Licitações ████████████ 234
  Zoneamento █████████ 189
  Fiscal █████████ 178
  LGPD ██████ 112
  Carreiras ████ 67
  Inovação ███ 45
  Outros ██ 22

- "Atividade Recente" — timeline with dots:
  • 08:45 — 3 novas oportunidades em BH
  • 08:12 — Análise concluída: Uberlândia
  • 07:58 — Alerta crítico: licitação TI
  • 07:30 — Scan diário iniciado

NO placeholder images. Use Lucide React icons only. No device frames.
```
