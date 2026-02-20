---
description: Transforms any complex real-world domain into scalable primitives, tools, and DB models (The Descript Engine).
---

# Domain-to-Solution Workflow (/domain)

Decomposes any complex domain into structured primitives using the Descript Pattern:
`Complex Domain → SSOT Abstraction → Existing Tools → Clean UI on Top`

## Steps

1. **Research the domain** using Exa web search:
   - `mcp3_web_search_exa` for current landscape, competitors, open-source tools
   - `mcp3_get_code_context_exa` for existing libraries and SDKs
   - Identify the **SSOT abstraction** (what's the "transcript" for this domain?)

2. **Run the Domain Explorer agent** (or do it manually with AI):
   ```bash
   bun agent:run domain_explorer --exec --domain "DOMAIN_NAME"
   ```
   - Output: `docs/domains/[slug].json` (structured taxonomy)
   - Output: `docs/domains/[slug].md` (readable summary)

3. **Review the DomainTaxonomy output** — verify:
   - [ ] SSOT abstraction makes sense (the ONE thing that governs everything)
   - [ ] Core primitives map to real open-source tools (not vaporware)
   - [ ] Data models are minimal and CRUD-able
   - [ ] MVP features use 2-3 primitives max

4. **Generate Supabase schema** from the data models:
   - Create migration SQL from the `data_models` array
   - Add RLS policies per EGOS security rules
   - Save to `supabase/migrations/`

5. **Document in TASKS.md** — create tasks for each MVP feature

## Example

```
/domain Trademark Registration (INPI)
```

Expected SSOT: "Application Dossier" (all docs, deadlines, status in one structured record)
Expected tools: INPI API, PDF.js, OCR (Tesseract), deadline calculators
Expected models: Application, Document, Deadline, Applicant, ClassificationCode
