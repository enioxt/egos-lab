# 🦅 Eagle Eye

**Brazilian Gazette Monitor + AI Opportunity Detector**

Monitor official gazettes (DOU, DOE, DOM) using AI to identify business opportunities from legislative changes.

## Quick Start

```bash
# Install dependencies
cd ../../ && npm install

# Test API connection (no API key needed)
npm run eagle-eye:fetch

# Run AI analysis (needs OpenRouter key)
export OPENROUTER_API_KEY=your_key_here
npm run eagle-eye:analyze
```

## Architecture

```
Data Sources → Ingestion → AI Analysis → Scored Opportunities
     │              │            │              │
Querido Diário   fetch_    analyze_        JSON output
  PNCP API    gazettes.ts  gazette.ts    (17 patterns)
```

## 17 Opportunity Patterns

| Strategy | Count | How |
|---|---|---|
| A: Keyword Search | 12 | `/gazettes?querystring=` |
| B: Themed Search | 2 | `/gazettes/by_theme/{theme}` |
| C: AI Semantic | 3 | Post-fetch Gemini analysis |

### Tier 1 (High Relevance)
1. **PROC-001** — Public Procurement (licitações)
2. **ZONE-001** — Real Estate & Zoning
3. **CAREER-001** — Public Security Careers
4. **FISCAL-001** — Fiscal Oversight
5. **LEGAL-001** — Legal Compliance / LGPD

### Tier 2 (Medium Relevance)
6-10: Electronic Invoicing, Press, Innovation, Cybersecurity, Tax Changes

### Tier 3 (Monitoring)
11-12: Public Health, Education

### AI Semantic (Strategy C)
15-17: Innovation Programs, Local Commerce, Digital Government

## API Reference

- **Querido Diário:** `https://api.queridodiario.ok.org.br`
- **PNCP:** `https://pncp.gov.br/api/consulta` (Phase 2)
- **Compras.gov.br:** `https://compras.dados.gov.br` (Phase 2)

## Cost

~$3-5/month for 300 gazette analyses via Gemini 2.0 Flash.
