# SSOT Structural Triage Report v2.2

> ⚠️ **This is a triage report, not a verdict.** Findings are structural signals
> that require human review to confirm as actual SSOT violations.

## Scan Metadata

| Metric | Value |
|--------|-------|
| Engine Version | v2.2 (AST + explicit scoring + executive summary) |
| Generated | 2026-02-21T12:15:52.932Z |
| Correlation | `647ffdf7-055d-4115-a7b3-1ee97cb6e90a` |
| Analysis Mode | AST-based (TypeScript compiler API) |
| API Cost | $0 (local static pass, no LLM inference) |
| Files scanned | 697 |
| Symbols extracted | 946 |
| Extraction time | 1602ms |
| Symbol breakdown | interface: 769, type_alias: 137, enum: 0, class: 40 |

## What This Report Proves

1. **Proven:** Fast repo-wide structural triage with AST parsing
2. **Proven:** Symbol classification by kind (interface/type_alias/enum/class)
3. **Proven:** Scope-aware filtering (exported, cross-package)
4. **Proven:** Explicit scoring (0-10) with human-readable rationale per finding
5. **Proven:** Context-aware recommendations (domain vs UI vs generic)
6. **Not yet proven:** Semantic shape comparison between duplicates
7. **Not yet proven:** Whether duplicates represent actual drift vs intentional variants

## Executive Summary

| Category | Count |
|----------|-------|
| 🔴 High — Cross-Package | 39 |
| 🟠 High — Intra-Package | 22 |
| ⚠️ Medium | 33 |
| ℹ️ Low / Convention | 338 |
| **Total** | **432** |

### Top 5 Offenders (by score)

| # | Symbol | Score | Scope | Occurrences |
|---|--------|-------|-------|-------------|
| 1 | `TimelineEvent` | 10/10 | Cross (intelink, eagle-eye) | 7x |
| 2 | `SearchResult` | 10/10 | Cross (intelink, eagle-eye) | 5x |
| 3 | `RateLimitConfig` | 10/10 | Cross (intelink, egos-web) | 4x |
| 4 | `ChatMessage` | 9/10 | Cross (intelink, egos-web) | 3x |
| 5 | `AnalysisResult` | 9/10 | Cross (intelink, shared) | 3x |

### Recommended Next Steps

1. **Immediate:** Review the 39 cross-package High findings — these represent the highest risk of divergent type drift
2. **Short-term:** Consolidate the 22 intra-package High findings in `intelink/types/` to reduce internal fragmentation
3. **Medium-term:** Evaluate the 33 Medium findings during regular code review cycles
4. **Long-term:** Run shape comparison (v3) to distinguish identical duplicates from true drift

---

## 🔴 High Confidence — Cross-Package (39)
> Strongest drift signals: exported and/or cross-package, with specific names and repeated structural declarations.

### 🔴 interface "TimelineEvent" defined 7x across 2 packages (intelink, eagle-eye) (5 exported)
- **Score:** 10/10 *(+exported(5), +cross-package(2), +specific-name, +long-name, +high-count(7))*
- **Kind:** interface
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/app/api/investigation/[id]/timeline/route.ts:5`
  - `apps/intelink/lib/intelligence/graph-aggregator.ts:58`
  - `apps/intelink/lib/prompts/types.ts:47`
  - `apps/intelink/lib/document-extraction.ts:64`
  - `apps/intelink/components/intelligence/CronosTab.tsx:23`
  - `apps/intelink/components/intelink/InvestigationTimeline.tsx:9`
  - `apps/eagle-eye/src/research/timeline_tracer.ts:24`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (intelink + eagle-eye)

### 🔴 interface "SearchResult" defined 5x across 2 packages (intelink, eagle-eye) (3 exported)
- **Score:** 10/10 *(+exported(3), +cross-package(2), +specific-name, +long-name, +count(5))*
- **Kind:** interface
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/app/api/search/route.ts:29`
  - `apps/intelink/lib/intelligence/graph-aggregator.ts:80`
  - `apps/intelink/lib/cache/incremental-index.ts:29`
  - `apps/intelink/components/search/constants.ts:20`
  - `apps/eagle-eye/src/research/timeline_tracer.ts:16`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (intelink + eagle-eye)

### 🔴 interface "RateLimitConfig" defined 4x across 2 packages (intelink, egos-web) (3 exported)
- **Score:** 10/10 *(+exported(3), +cross-package(2), +specific-name, +long-name, +count(4))*
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/rate-limit.ts:17`
  - `apps/intelink/lib/etl/rate-limiter.ts:15`
  - `apps/intelink/lib/security/rate-limit.ts:22`
  - `apps/egos-web/api/_rate-limit.ts:15`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, egos-web)

### 🔴 interface "ChatMessage" defined 3x across 2 packages (intelink, egos-web) (3 exported)
- **Score:** 9/10 *(+exported(3), +cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/types/api.ts:224`
  - `apps/intelink/lib/llm/llm-provider.ts:16`
  - `apps/egos-web/src/store/useAppStore.ts:30`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, egos-web)

### 🔴 interface "AnalysisResult" defined 3x across 2 packages (intelink, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, shared
- **Locations:**
  - `apps/intelink/lib/intelink/analysis-prompts.ts:56`
  - `apps/intelink/components/investigation/SetupWizard.tsx:20`
  - `packages/shared/src/types.ts:66`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (intelink + shared)

### ⚠️ type_alias "SourceType" defined 2x across 2 packages (intelink, eagle-eye) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/lib/types/journey.ts:11`
  - `apps/eagle-eye/src/modules/tourism/truth-consensus.ts:4`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, eagle-eye)

### ⚠️ interface "ModelConfig" defined 2x across 2 packages (intelink, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, shared
- **Locations:**
  - `apps/intelink/lib/document-extraction.ts:86`
  - `packages/shared/src/ai-models.ts:14`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, shared)

### ⚠️ type_alias "RouteStatus" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:9`
  - `packages/shared/src/api-registry.ts:19`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ type_alias "AutomationLevel" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:10`
  - `packages/shared/src/api-registry.ts:21`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ type_alias "HttpMethod" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:11`
  - `packages/shared/src/api-registry.ts:27`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ type_alias "RouteCategory" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:12`
  - `packages/shared/src/api-registry.ts:29`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ interface "RouteEntry" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:14`
  - `packages/shared/src/api-registry.ts:45`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ interface "UserProfile" defined 2x across 2 packages (marketplace-core, eagle-eye) (2 exported)
- **Score:** 9/10 *(+exported(2), +cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** marketplace-core, eagle-eye
- **Locations:**
  - `apps/marketplace-core/src/domain/identity/types.ts:11`
  - `apps/eagle-eye/src/modules/tourism/gamification.ts:2`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (marketplace-core, eagle-eye)

### ⚠️ type_alias "AppName" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Score:** 8/10 *(+exported(2), +cross-package(2), +specific-name)*
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:8`
  - `packages/shared/src/api-registry.ts:17`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, shared)

### ⚠️ type_alias "UserRole" defined 2x across 2 packages (marketplace-core, nexus-shared) (2 exported)
- **Score:** 8/10 *(+exported(2), +cross-package(2), +specific-name)*
- **Kind:** type_alias
- **Packages:** marketplace-core, nexus-shared
- **Locations:**
  - `apps/marketplace-core/src/domain/identity/types.ts:1`
  - `packages/nexus-shared/src/types/index.ts:2`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (marketplace-core, nexus-shared)

### 🔴 interface "Finding" defined 4x across 3 packages (agents, scripts, intelink) (1 exported)
- **Score:** 6/10 *(+cross-package(3), +specific-name, +count(4))*
- **Kind:** interface
- **Packages:** agents, scripts, intelink
- **Locations:**
  - `agents/runtime/runner.ts:56`
  - `scripts/ssot_governance.ts:27`
  - `apps/intelink/components/intelink/FindingsPanel.tsx:29`
  - `apps/intelink/components/FindingsPanel.tsx:24`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (agents + scripts + intelink)

### 🔴 interface "Stats" defined 4x across 2 packages (intelink, nexus) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +count(4))*
- **Kind:** interface
- **Packages:** intelink, nexus
- **Locations:**
  - `apps/intelink/app/page.tsx:12`
  - `apps/intelink/app/central/page.tsx:16`
  - `apps/intelink/app/central/vinculos/page.tsx:79`
  - `apps/nexus/web/src/app/dashboard/page.tsx:14`
- **Recommendation:** Cross-package generic name — verify semantic equivalence before consolidation; "Stats" may represent different concepts in intelink vs nexus

### 🔴 interface "AgentResult" defined 3x across 2 packages (agents, egos-web) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** agents, egos-web
- **Locations:**
  - `agents/agents/orchestrator.ts:22`
  - `agents/worker/index.ts:50`
  - `apps/egos-web/src/components/AuditHub.tsx:4`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (agents, egos-web)

### 🔴 interface "GraphData" defined 3x across 2 packages (intelink, egos-web) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/app/graph/[id]/page.tsx:38`
  - `apps/intelink/app/graph/[id]/3d/page.tsx:51`
  - `apps/egos-web/src/services/github.ts:27`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (intelink + egos-web)

### 🔴 interface "EmptyStateProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/patterns/EmptyState.tsx:6`
  - `apps/intelink/components/vinculos/UIComponents.tsx:88`
  - `apps/marketplace-core/src/components/ui/EmptyState.tsx:6`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### 🔴 interface "PageHeaderProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/shared/PageHeader.tsx:7`
  - `apps/intelink/components/layout/PageHeader.tsx:8`
  - `apps/marketplace-core/src/components/ui/PageHeader.tsx:7`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### 🔴 interface "SkeletonProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/shared/Skeleton.tsx:14`
  - `apps/intelink/components/ui/Skeleton.tsx:5`
  - `apps/marketplace-core/src/components/ui/skeleton.tsx:8`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### 🔴 class "RateLimiter" defined 3x across 3 packages (egos-web, eagle-eye, shared) (1 exported)
- **Score:** 6/10 *(+cross-package(3), +specific-name, +long-name)*
- **Kind:** class
- **Packages:** egos-web, eagle-eye, shared
- **Locations:**
  - `apps/egos-web/api/_rate-limit.ts:20`
  - `apps/eagle-eye/src/enrich_opportunity.ts:12`
  - `packages/shared/src/rate-limiter.ts:7`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (egos-web, eagle-eye, shared)

### ⚠️ type_alias "ConfidenceLevel" defined 2x across 2 packages (agents, intelink) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** agents, intelink
- **Locations:**
  - `agents/agents/ssot-auditor.ts:66`
  - `apps/intelink/lib/pramana/confidence-system.ts:13`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (agents + intelink)

### ⚠️ interface "EnrichmentResult" defined 2x across 2 packages (agents, eagle-eye) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** agents, eagle-eye
- **Locations:**
  - `agents/worker/ai-enricher.ts:48`
  - `apps/eagle-eye/src/enrich_opportunity.ts:46`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (agents, eagle-eye)

### ⚠️ interface "EnrichedProduct" defined 2x across 2 packages (scripts, nexus-shared) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** scripts, nexus-shared
- **Locations:**
  - `scripts/simulate_audit.ts:16`
  - `packages/nexus-shared/src/ai/product-enricher.ts:23`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (scripts, nexus-shared)

### ⚠️ interface "AuthState" defined 2x across 2 packages (intelink, egos-web) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:107`
  - `apps/egos-web/src/hooks/useAuth.ts:5`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, egos-web)

### ⚠️ interface "AIAnalysis" defined 2x across 2 packages (intelink, egos-web) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:75`
  - `apps/egos-web/api/ingest-commits.ts:52`
- **Recommendation:** Cross-package domain type — consider a shared canonical type in packages/shared (intelink + egos-web)

### ⚠️ type_alias "ToastType" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** type_alias
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/intelink/Toast.tsx:7`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:6`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, marketplace-core)

### ⚠️ interface "ToastContextType" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/intelink/Toast.tsx:17`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:15`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, marketplace-core)

### ⚠️ interface "OptimizedImageProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/OptimizedImage.tsx:20`
  - `apps/marketplace-core/src/components/ui/optimized-image.tsx:12`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### ⚠️ interface "CardProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:6`
  - `apps/marketplace-core/src/components/ui/Card.tsx:4`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### ⚠️ interface "CardHeaderProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:52`
  - `apps/marketplace-core/src/components/ui/Card.tsx:39`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### ⚠️ interface "CardContentProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:91`
  - `apps/marketplace-core/src/components/ui/Card.tsx:59`
- **Recommendation:** Cross-package UI props — consider a shared component library or extract to packages/shared/ui-types

### ⚠️ interface "Suggestion" defined 2x across 2 packages (intelink, eagle-eye) (1 exported)
- **Score:** 6/10 *(+cross-package(2), +specific-name, +long-name)*
- **Kind:** interface
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/components/graph/PredictedLinksPanel.tsx:50`
  - `apps/eagle-eye/src/modules/tourism/gamification.ts:102`
- **Recommendation:** Cross-package generic name — verify semantic equivalence before consolidation; "Suggestion" may represent different concepts in intelink vs eagle-eye

### 🔴 interface "Toast" defined 3x across 2 packages (intelink, marketplace-core) (1 exported)
- **Score:** 5/10 *(+cross-package(2), +specific-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/types/chat.ts:39`
  - `apps/intelink/components/intelink/Toast.tsx:9`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:8`
- **Recommendation:** Cross-package generic name — verify semantic equivalence before consolidation; "Toast" may represent different concepts in intelink vs marketplace-core

### ⚠️ interface "Message" defined 2x across 2 packages (intelink, nexus) (1 exported)
- **Score:** 5/10 *(+cross-package(2), +specific-name)*
- **Kind:** interface
- **Packages:** intelink, nexus
- **Locations:**
  - `apps/intelink/types/chat.ts:5`
  - `apps/nexus/web/src/app/dashboard/chat/page.tsx:12`
- **Recommendation:** Cross-package generic name — verify semantic equivalence before consolidation; "Message" may represent different concepts in intelink vs nexus

### ⚠️ type_alias "TabId" defined 2x across 2 packages (intelink, egos-web) (all local)
- **Score:** 5/10 *(+cross-package(2), +specific-name)*
- **Kind:** type_alias
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/app/central/intelligence-lab/page.tsx:40`
  - `apps/egos-web/src/components/SecurityHub.tsx:92`
- **Recommendation:** Cross-package duplicate — consolidate into packages/shared or verify intentional divergence (intelink, egos-web)

### ⚠️ interface "User" defined 2x across 2 packages (intelink, marketplace-core) (1 exported)
- **Score:** 5/10 *(+cross-package(2), +specific-name)*
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/providers/AuthProvider.tsx:6`
  - `apps/marketplace-core/src/domain/identity/types.ts:3`
- **Recommendation:** Cross-package generic name — verify semantic equivalence before consolidation; "User" may represent different concepts in intelink vs marketplace-core

## 🟠 High Confidence — Intra-Package Exported Drift (22)
> High-scoring duplicates within the same package — strong signal of internal drift.

### 🔴 interface "Investigation" defined 10x within "intelink" (5 exported)
- **Score:** 8/10 *(+exported(5), +specific-name, +long-name, +very-high-count(10), -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/chat.ts:13`
  - `apps/intelink/types/api.ts:112`
  - `apps/intelink/app/investigation/[id]/reports/page.tsx:38`
  - `apps/intelink/app/central/vinculos/page.tsx:32`
  - `apps/intelink/lib/utils/formatters.ts:353`
  - `apps/intelink/components/intelligence/JuristaTab.tsx:72`
  - `apps/intelink/components/intelligence/CronosTab.tsx:41`
  - `apps/intelink/components/intelligence/EntityResolverTab.tsx:151`
  - `apps/intelink/components/reports/types.ts:6`
  - `apps/intelink/components/vinculos/constants.ts:12`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 interface "Entity" defined 14x within "intelink" (3 exported)
- **Score:** 7/10 *(+exported(3), +specific-name, +very-high-count(14), -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:52`
  - `apps/intelink/app/central/entidades/page.tsx:14`
  - `apps/intelink/app/api/rho/calculate/route.ts:11`
  - `apps/intelink/app/api/investigation/[id]/predictions/route.ts:26`
  - `apps/intelink/app/api/documents/extract/route.ts:27`
  - `apps/intelink/lib/entity-resolution/matcher.ts:16`
  - `apps/intelink/lib/similarity-detector.ts:21`
  - `apps/intelink/components/intelink/DuplicateDiffView.tsx:29`
  - `apps/intelink/components/intelink/ConnectionHeatmap.tsx:6`
  - `apps/intelink/components/intelink/NarrativeSummary.tsx:49`
  - `apps/intelink/components/intelink/GroupedEntityList.tsx:34`
  - `apps/intelink/components/intelink/EntityMergePanel.tsx:24`
  - `apps/intelink/components/reports/types.ts:14`
  - `apps/intelink/components/graph/ConnectionList.tsx:16`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 type_alias "EntityType" defined 6x within "intelink" (4 exported)
- **Score:** 7/10 *(+exported(4), +specific-name, +long-name, +high-count(6), -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:41`
  - `apps/intelink/lib/intelink/entity-matcher.ts:16`
  - `apps/intelink/lib/document-extraction.ts:46`
  - `apps/intelink/components/intelink/AddEntityModal.tsx:25`
  - `apps/intelink/components/investigation/new/types.ts:35`
  - `apps/intelink/hooks/useEntityModals.ts:8`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 interface "TeamMember" defined 4x within "intelink" (2 exported)
- **Score:** 6/10 *(+exported(2), +specific-name, +long-name, +count(4), -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/chat.ts:18`
  - `apps/intelink/app/central/membros/page.tsx:56`
  - `apps/intelink/components/investigation/new/types.ts:11`
  - `apps/intelink/components/shared/ShareJourneyDialog.tsx:29`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 type_alias "DocumentType" defined 4x within "intelink" (4 exported)
- **Score:** 6/10 *(+exported(4), +specific-name, +long-name, +count(4), -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:201`
  - `apps/intelink/lib/prompts/types.ts:8`
  - `apps/intelink/lib/document-extraction.ts:36`
  - `apps/intelink/components/intelink/DocumentActionButtons.tsx:17`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 type_alias "AuditAction" defined 4x within "intelink" (3 exported)
- **Score:** 6/10 *(+exported(3), +specific-name, +long-name, +count(4), -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:250`
  - `apps/intelink/lib/audit-service.ts:12`
  - `apps/intelink/lib/security/audit.ts:25`
  - `apps/intelink/hooks/useAudit.ts:19`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 interface "Member" defined 4x within "intelink" (3 exported)
- **Score:** 5/10 *(+exported(3), +specific-name, +count(4), -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:255`
  - `apps/intelink/app/central/equipe/page.tsx:32`
  - `apps/intelink/lib/auth/types.ts:32`
  - `apps/intelink/components/permissoes/constants.ts:9`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 interface "EvidenceData" defined 3x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/intelligence/graph-aggregator.ts:49`
  - `apps/intelink/lib/intelink/evidence-validation.ts:72`
  - `apps/intelink/components/shared/EvidenceDetailModal.tsx:60`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### 🔴 type_alias "SystemRole" defined 3x within "intelink" (3 exported)
- **Score:** 5/10 *(+exported(3), +specific-name, +long-name, -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:21`
  - `apps/intelink/lib/rbac/index.ts:22`
  - `apps/intelink/hooks/useRole.tsx:5`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### 🔴 type_alias "Permission" defined 3x within "intelink" (3 exported)
- **Score:** 5/10 *(+exported(3), +specific-name, +long-name, -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:279`
  - `apps/intelink/lib/permissions.ts:18`
  - `apps/intelink/lib/rbac/index.ts:45`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "ChatSession" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/chat.ts:27`
  - `apps/intelink/types/api.ts:232`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ type_alias "MatchType" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:181`
  - `apps/intelink/lib/documents/cross-case-utils.ts:12`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### ⚠️ type_alias "MemberRole" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** type_alias
- **Package:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:245`
  - `apps/intelink/lib/auth/types.ts:13`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "InvestigationContext" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/intelink/ai-chat.ts:26`
  - `apps/intelink/lib/analysis/diligence-suggestions.ts:28`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "ExtractedEntity" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:29`
  - `apps/intelink/lib/document-extraction.ts:48`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "ExtractedRelationship" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:38`
  - `apps/intelink/lib/document-extraction.ts:56`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "GuardianResult" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/documents/guardian.ts:93`
  - `apps/intelink/hooks/useGuardianAnalysis.ts:36`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "RateLimitResult" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/rate-limit.ts:53`
  - `apps/intelink/lib/security/rate-limit.ts:31`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### ⚠️ interface "SessionUser" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/security/auth.ts:22`
  - `apps/intelink/lib/session.ts:10`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "SessionValidationResult" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/lib/security/auth.ts:33`
  - `apps/intelink/lib/session.ts:21`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "EntityInput" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/components/investigation/entity-forms/types.ts:5`
  - `apps/intelink/components/investigation/new/types.ts:19`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### ⚠️ interface "UserPermissions" defined 2x within "intelink" (2 exported)
- **Score:** 5/10 *(+exported(2), +specific-name, +long-name, -single-package)*
- **Kind:** interface
- **Package:** intelink
- **Locations:**
  - `apps/intelink/hooks/useRole.tsx:7`
  - `apps/intelink/hooks/usePermissions.ts:5`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

## ⚠️ Medium Confidence Signals (33)
> Require validation — may be intentional or framework-driven.

### interface "Relationship" defined 6x within "intelink" (1 exported)
- **Score:** 4/10 *(+specific-name, +long-name, +high-count(6), -single-package)*
- **Locations:** `apps/intelink/types/api.ts:95`, `apps/intelink/app/api/rho/calculate/route.ts:17`, `apps/intelink/app/api/investigation/[id]/predictions/route.ts:33`, `apps/intelink/components/intelink/ConnectionHeatmap.tsx:12`, `apps/intelink/components/intelink/NarrativeSummary.tsx:56`, `apps/intelink/components/graph/ConnectionList.tsx:23`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "GraphNode" defined 6x within "intelink" (1 exported)
- **Score:** 4/10 *(+specific-name, +long-name, +high-count(6), -single-package)*
- **Locations:** `apps/intelink/app/central/unit/[id]/graph/page.tsx:17`, `apps/intelink/app/central/graph/page.tsx:17`, `apps/intelink/app/graph/[id]/page.tsx:20`, `apps/intelink/app/graph/[id]/3d/page.tsx:36`, `apps/intelink/lib/intelink/graph-algorithms.ts:11`, `apps/intelink/components/chat/ChatGraphWidget.tsx:40`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "ApiError" defined 2x within "intelink" (2 exported)
- **Score:** 4/10 *(+exported(2), +specific-name, -single-package)*
- **Locations:** `apps/intelink/types/api.ts:17`, `apps/intelink/lib/api-utils.ts:47`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### interface "GraphLink" defined 5x within "intelink" (all local)
- **Score:** 3/10 *(+specific-name, +long-name, +count(5), -single-package)*
- **Locations:** `apps/intelink/app/central/unit/[id]/graph/page.tsx:28`, `apps/intelink/app/central/graph/page.tsx:29`, `apps/intelink/app/graph/[id]/page.tsx:31`, `apps/intelink/app/graph/[id]/3d/page.tsx:44`, `apps/intelink/components/chat/ChatGraphWidget.tsx:48`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "CrossCaseAlert" defined 4x within "intelink" (1 exported)
- **Score:** 3/10 *(+specific-name, +long-name, +count(4), -single-package)*
- **Locations:** `apps/intelink/types/api.ts:183`, `apps/intelink/app/central/operacoes/page.tsx:22`, `apps/intelink/components/CrossCaseAlertsPanel.tsx:25`, `apps/intelink/components/intelligence/NexusTab.tsx:21`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### interface "MemberInfo" defined 4x within "intelink" (1 exported)
- **Score:** 3/10 *(+specific-name, +long-name, +count(4), -single-package)*
- **Locations:** `apps/intelink/app/page.tsx:19`, `apps/intelink/app/profile/page.tsx:15`, `apps/intelink/lib/auth-client.ts:22`, `apps/intelink/components/dashboard/DashboardHeader.tsx:11`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "PoliceUnit" defined 4x within "intelink" (1 exported)
- **Score:** 3/10 *(+specific-name, +long-name, +count(4), -single-package)*
- **Locations:** `apps/intelink/app/central/delegacias/page.tsx:13`, `apps/intelink/app/central/membros/page.tsx:82`, `apps/intelink/app/central/equipe/page.tsx:46`, `apps/intelink/components/investigation/new/types.ts:5`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "Evidence" defined 5x within "intelink" (all local)
- **Score:** 2/10 *(+specific-name, +count(5), -single-package)*
- **Locations:** `apps/intelink/app/central/evidencias/page.tsx:20`, `apps/intelink/app/api/documents/extract/route.ts:35`, `apps/intelink/components/intelink/EvidencePanel.tsx:32`, `apps/intelink/components/intelink/NarrativeSummary.tsx:63`, `apps/intelink/components/EvidencePanel.tsx:29`
- **Recommendation:** Intra-package domain drift — consolidate into a single canonical definition within intelink/types/

### interface "TestResult" defined 3x within "agents" (1 exported)
- **Score:** 2/10 *(+specific-name, +long-name, -single-package)*
- **Locations:** `agents/agents/regression-watcher.ts:28`, `agents/agents/integration-tester.ts:28`, `agents/runtime/quantum-test.ts:25`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within agents

### interface "ExtractionResult" defined 3x within "intelink" (1 exported)
- **Score:** 2/10 *(+specific-name, +long-name, -single-package)*
- **Locations:** `apps/intelink/app/api/documents/batch/route.ts:29`, `apps/intelink/app/api/documents/extract/route.ts:42`, `apps/intelink/lib/document-extraction.ts:70`
- **Recommendation:** Intra-package exported drift — consolidate into a single types file within intelink

### Remaining Medium Signals (23)

- **interface "CrossCaseEntity" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "UnifiedLink" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "DossierResult" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "JourneyAnalysisRequest" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "IndirectConnection" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "DuplicateGroup" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "EntityData" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "PredictedLink" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "EntityMatch" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "JuristaCrime" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **interface "JuristaResult" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "DebateResult" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "RateLimitEntry" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "NotificationPayload" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "CacheEntry" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "TelemetryEvent" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "EntityInfo" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package domain drift — consolidate into a single canonical definition within intelink/types/
- **type_alias "InputMode" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink
- **interface "StatCardProps" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package UI props — likely intentional per-component variants; consolidate only if shapes are identical
- **interface "FindingsPanelProps" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package UI props — likely intentional per-component variants; consolidate only if shapes are identical
- **interface "EvidencePanelProps" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package UI props — likely intentional per-component variants; consolidate only if shapes are identical
- **interface "StatusBadgeProps" defined 2x within "intelink" (all local)** — Score: 2/10 — Intra-package UI props — likely intentional per-component variants; consolidate only if shapes are identical
- **interface "WidgetConfig" defined 2x within "intelink" (1 exported)** — Score: 2/10 — Intra-package exported drift — consolidate into a single types file within intelink

## ℹ️ Low Confidence / Convention (338)
> Likely framework conventions, local variants, or orphaned exports.
> Review only if actively cleaning up the codebase.

- interface "Props" defined 5x across 3 packages (intelink, nexus, radio-philein) (all local)
- interface "Document" defined 3x within "intelink" (1 exported)
- interface "Session" defined 3x within "intelink" (1 exported)
- interface "AuditLog" defined 2x within "intelink" (all local)
- interface "DataJob" defined 2x within "intelink" (1 exported)
- type_alias "ItemType" defined 2x within "intelink" (all local)
- interface "NavItem" defined 2x within "intelink" (all local)
- interface "Product" defined 2x within "nexus" (1 exported)
- Exported interface "AuditReport" in agents is never imported
- Exported interface "RawFinding" in agents is never imported
- Exported interface "EnrichedFinding" in agents is never imported
- Exported interface "EnrichmentResult" in agents is never imported
- Exported interface "SandboxInfo" in agents is never imported
- Exported interface "AgentDefinition" in agents is never imported
- Exported interface "RunContext" in agents is never imported
- Exported interface "RunResult" in agents is never imported
- Exported interface "Finding" in agents is never imported
- Exported type_alias "AgentHandler" in agents is never imported
- Exported interface "TestResult" in agents is never imported
- Exported interface "QuantumReport" in agents is never imported
- ... and 318 more

---

## Methodology

This report uses the TypeScript compiler API (`ts.createSourceFile`) to parse
the AST of each file. Only structural type-level declarations are extracted:
interfaces, type aliases, enums, and classes. Comments, strings, property keys,
and variable names are **not** captured (fixing a known v1 issue).

### Package Inference

Package names are inferred from file paths using the following rules:
- `apps/<name>/...` → package = `<name>` (e.g., `apps/egos-web/src/App.tsx` → `egos-web`)
- `packages/<name>/...` → package = `<name>` (e.g., `packages/shared/src/types.ts` → `shared`)
- Other top-level dirs → package = dir name (e.g., `agents/...` → `agents`, `scripts/...` → `scripts`)

This is path-based inference, not `package.json` resolution. It works reliably for
standard monorepo layouts (`apps/*`, `packages/*`) but may not capture workspace aliases.

### Confidence Scoring (Explicit)

Each finding receives a numeric score (0-10) with human-readable rationale:

| Factor | Score | Condition |
|--------|-------|-----------|
| Exported | +3 | Multiple exported declarations |
| Cross-package | +3 | Appears in 2+ workspace packages |
| Specific name | +2 | Not a framework convention (Props, State, etc.) |
| Long name | +1 | Name > 8 characters |
| Count (4-5x) | +1 | 4-5 occurrences |
| Count (6-9x) | +2 | 6-9 occurrences |
| Count (10+x) | +3 | 10+ occurrences (very high drift signal) |
| Convention name | -3 | Framework pattern (Props, Config, etc.) |
| Generated file | -2 | Involves auto-generated code |
| Single package | -1 | All in the same workspace package |
| Short name | -3 | Name ≤ 2 characters |

**Thresholds:** High ≥ 5 | Medium ≥ 2 | Low < 2

### Known Limitations

1. **No shape comparison yet** — duplicate names may have identical or divergent member shapes
2. **No import graph / barrel resolution** — can't trace re-exports through index files
3. **Confidence is heuristic** — based on structural signals, not semantic analysis
4. **Framework conventions are not exhaustive** — custom project-specific patterns may be missed
5. **No cross-repo analysis** — only scans the target monorepo
