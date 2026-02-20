# The Agnostic Domain-to-Solution Engine

> **VERSION:** 2.0.0 | **UPDATED:** 2026-02-20
> **STATUS:** Foundation (domain_explorer operational, pipeline designed)
> **AGENT:** `agents/agents/domain_explorer.ts` | **WORKFLOW:** `.windsurf/workflows/domain.md`

## 1. The Descript Pattern (What We Actually Learned)

Descript didn't use AI to write their product. They applied a **structural insight** that's universally replicable:

### The Formula

```
Complex Domain → Identify SSOT Abstraction → Map to Existing Tools → Build Clean UI on Top
```

**Descript's specific implementation:**

| Layer | What Descript Did | Universal Pattern |
|-------|-------------------|-------------------|
| **SSOT** | Transcript = source of truth for video | Every domain has ONE abstraction that governs everything |
| **Engine** | FFmpeg (stable, 20+ years) | Don't reinvent — find the CLI/lib that already does it |
| **Orchestration** | Temporal (Go SDK, unit-testable workflows) | Multi-stage async pipelines with retry + observability |
| **Culture** | Notion databases (structured, queryable) | Rules and processes must be data, not documents |
| **AI Layer** | Underlord (agent for editing) | AI operates on the SSOT, not on raw media |

### What made Descript's approach work

1. **Transcript-as-SSOT**: Editing text = editing video. The transcript is the single representation that drives all downstream operations. FFmpeg commands are *generated* from transcript edits.

2. **Temporal for orchestration**: They migrated from RabbitMQ + PostgreSQL + Node.js to Temporal (Go SDK). Production incidents dropped from **weekly to virtually zero**. Key: workflows-as-code that can be unit tested, not YAML/JSON configs.

3. **Specialized compute routing**: GPU workers for ML (Whisper, TTS), general workers for data processing, all orchestrated by Temporal task queues. Activity routing, not monolithic processing.

4. **Progressive migration**: Feature flags to gradually shift workloads. Never a big-bang rewrite.

> Source: [Temporal case study](https://temporal.io/in-use/descript), Andrew Mason's Notion talk, Descript engineering blog

## 2. EGOS vs Descript: SSOT Comparison

| Dimension | Descript | EGOS | Gap |
|-----------|---------|------|-----|
| **Core SSOT** | Transcript (edit text → edit video) | `TASKS.md` + `agents.json` + `.windsurfrules` | EGOS has multiple SSOTs per concern — good |
| **Orchestration** | Temporal (retry, persistence, parallel) | Sequential `orchestrator.ts` | No retry, no state persistence, no parallelism |
| **Culture tracking** | Notion databases (structured, queryable) | Markdown files (static, manual) | Rules aren't queryable or versionable as data |
| **Feedback loop** | Systematic (every ritual → measured outcome) | Ad-hoc (no Living Laboratory yet) | No experiment tracking |
| **Testing** | Unit tests on Temporal workflows + E2E | 5-layer agent testing pyramid | EGOS is actually **ahead** here |
| **Rule evolution** | "Culture is a product" — iterate like code | Rules manually edited | No agent proposes rule changes |
| **Agent system** | Underlord (single AI agent) | 15 registered agents (specialized) | EGOS is **ahead** — multi-agent > single |

**Where EGOS is ahead:**
- Multi-agent architecture (15 specialized > 1 general)
- AST-based structural analysis (ssot-auditor)
- Agent-testing-agent pyramid (5 layers)
- Cross-repo audit capability (ran on Documenso, Cal.com, tRPC, Medusa)

**Where Descript is ahead:**
- Workflow orchestration (Temporal >> sequential runner)
- Culture-as-data (Notion databases >> markdown files)
- SSOT-driven UI (transcript drives everything)
- Production scale (150 people, $50M+)

## 3. The Domain Engine Architecture

### Pipeline

```
Input: "Video Editing" or "Transit Dispatch" or "Trademark Registration"
                                    │
                    ┌───────────────▼───────────────┐
                    │     domain_explorer agent      │
                    │  (AI + web search → taxonomy)  │
                    └───────────────┬───────────────┘
                                    │ DomainTaxonomy JSON
                    ┌───────────────▼───────────────┐
                    │   Output: docs/domains/*.json  │
                    │   + docs/domains/*.md summary  │
                    └───────────────────────────────┘
```

### DomainTaxonomy Schema

```typescript
interface DomainTaxonomy {
  domain: string;
  ssot_abstraction: string;     // THE key insight — what's the "transcript" for this domain?
  core_primitives: Array<{
    name: string;               // e.g. "trim", "transcribe", "denoise"
    description: string;
    underlying_tool: string;    // e.g. "FFmpeg -ss -to", "Whisper"
    complexity: 'low' | 'medium' | 'high';
  }>;
  underlying_tools: Array<{
    name: string;               // e.g. "FFmpeg"
    url: string;
    role: string;
    maturity: 'stable' | 'growing' | 'experimental';
  }>;
  data_models: Array<{
    entity: string;             // e.g. "Project", "Transcript", "Edit"
    fields: string[];
    relationships: string[];
  }>;
  suggested_mvp: Array<{
    feature: string;
    primitives_used: string[];
    effort: 'small' | 'medium' | 'large';
  }>;
  descript_parallel: string;    // How this maps to Descript's pattern
}
```

### Usage

```bash
# Dry-run (mock data, $0 cost)
bun agent:run domain_explorer --dry

# Real analysis (AI call, ~$0.001)
bun agent:run domain_explorer --exec --domain "Trademark Registration"

# Output goes to docs/domains/trademark-registration.json + .md
```

## 4. Applied Examples

### Example: Carteira Livre (Transit Instructor Marketplace)

| Layer | Mapping |
|-------|---------|
| **SSOT** | Instructor Profile + License Status |
| **Engine** | DETRAN APIs, Asaas Payment API |
| **Orchestration** | Next.js API routes (simple — single-user flows) |
| **Primitives** | verify_cnh, match_student, process_payment, track_lesson |
| **Data Models** | Instructor, Student, Lesson, Payment, Verification |

### Example: Eagle Eye (OSINT Gazette Monitor)

| Layer | Mapping |
|-------|---------|
| **SSOT** | Gazette Entry (structured procurement data) |
| **Engine** | Querido Diário API (open gazette data) |
| **Orchestration** | Cron + AI analysis pipeline |
| **Primitives** | fetch_gazette, extract_entities, score_opportunity, alert |
| **Data Models** | Gazette, Opportunity, Entity, Alert |

## 5. Living Laboratory Integration

The Domain Engine feeds into the Living Laboratory pattern:

1. **Explore** → `domain_explorer` maps a new domain
2. **Build** → Developer uses taxonomy to scaffold project
3. **Measure** → Agents test the implementation
4. **Learn** → Living Laboratory records what worked/failed
5. **Evolve** → Rules update based on measured outcomes

## 6. Roadmap

- [x] `domain_explorer` agent (operational, dry-run + execute)
- [x] `/domain` workflow
- [x] DomainTaxonomy JSON schema
- [x] Markdown report generation
- [ ] `primitive_architect` agent (takes taxonomy → generates Supabase schema + TypeScript interfaces)
- [ ] `solution_scaffolder` agent (generates project skeleton from taxonomy)
- [ ] Web search integration (Exa) for real-time domain research
- [ ] Taxonomy versioning (track how understanding of a domain evolves)
