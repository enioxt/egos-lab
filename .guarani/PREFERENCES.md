# ⚙️ PREFERENCES — Coding Standards for egos-lab

> **Version:** 1.0.0 | **Updated:** 2026-02-13
> **Heritage:** carteira-livre PREFERENCES v2.0

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ / tsx |
| Language | TypeScript (strict) |
| AI | Gemini 2.0 Flash via OpenRouter |
| Monorepo | npm workspaces |
| Design | Google Stitch (external) |
| Data | Querido Diário API, PNCP, Compras.gov.br |

## Code Style

### Size Limits

- **400 linhas** max por arquivo
- **200 linhas** max por função
- **1 responsabilidade** por arquivo

### Imports (ordem obrigatória)

```typescript
// 1. Node built-ins → 2. @egos-lab/* packages → 3. Local imports → 4. Types
import { readFileSync } from 'node:fs';
import { analyzeWithAI } from '@egos-lab/shared';
import { fetchGazettes } from './fetch_gazettes';
import type { GazetteItem } from '@egos-lab/shared';
```

### Commits: `type(scope): description`

`feat` | `fix` | `docs` | `refactor` | `chore`

Scopes: `eagle-eye` | `shared` | `scanner` | `docs` | `governance`

**IMPORTANTE:** Todo commit deve conter contexto suficiente para o OUTRO AGENTE entender. Inclua:
- O que foi feito
- Por que foi feito
- O que o próximo agente deve fazer (se aplicável)

## Module Rules

```typescript
// ✅ ESM only (type: "module" in all package.json)
import { thing } from './module.ts';

// ❌ CommonJS
const { thing } = require('./module');

// ✅ Always use .ts extension in imports within apps
import { fetchGazettes } from './fetch_gazettes';

// ✅ Use @egos-lab/* for cross-package imports
import { RateLimiter } from '@egos-lab/shared';
```

## AI Cost Tracking (OBRIGATÓRIO)

```typescript
// ✅ Every AI call must log cost
const result = await analyzeWithAI({ ... });
console.log(`💰 Cost: $${result.cost_usd.toFixed(4)}`);

// ❌ AI call without cost tracking
await fetch('https://openrouter.ai/api/v1/chat/completions', ...);
```

## Design Standard: Google Stitch

```
// ❌ PROIBIDO — construir UI direto
export function Dashboard() { return <div>...</div>; }

// ✅ CORRETO — gerar prompt para Stitch primeiro
// 1. Criar docs/stitch/eagle-eye-dashboard.md
// 2. Gerar design no Stitch
// 3. Implementar matching pixel-perfect
```

## Anti-Patterns

```typescript
// ❌ Hardcoded API URLs
const url = 'https://api.queridodiario.ok.org.br/gazettes';
// ✅ Use constants
import { API_BASE } from './config';

// ❌ Magic numbers
if (keywords.length > 5) { ... }
// ✅ Named constants
const MAX_KEYWORDS_PER_QUERY = 5;

// ❌ Ignore rate limits
for (const id of ids) { await fetch(...); }
// ✅ Use RateLimiter
await rateLimiter.waitForSlot();
```

## Security

1. **API keys** — NUNCA em código. Usar `.env` + `.gitignore`
2. **No PII** — Nenhum dado pessoal em logs
3. **Rate limiting** — Toda API externa deve usar RateLimiter
