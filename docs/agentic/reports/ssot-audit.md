# SSOT Structural Triage Report v2

> ⚠️ **This is a triage report, not a verdict.** Findings are structural signals
> that require human review to confirm as actual SSOT violations.

## Scan Metadata

| Metric | Value |
|--------|-------|
| Generated | 2026-02-21T11:52:31.350Z |
| Correlation | `f0b26d57-5f75-4bf0-8e6b-3d3329e495c0` |
| Analysis Mode | AST-based (TypeScript compiler API) |
| API Cost | $0 (local static pass, no inference) |
| Files scanned | 697 |
| Symbols extracted | 944 |
| Extraction time | 2076ms |
| Symbol breakdown | type_alias: 136, interface: 768, class: 40 |

## What This Report Proves

1. **Proven:** Fast repo-wide structural triage with AST parsing
2. **Proven:** Symbol classification by kind (interface/type/enum/class)
3. **Proven:** Scope-aware filtering (exported, cross-package)
4. **Not yet proven:** Semantic shape comparison between duplicates
5. **Not yet proven:** Whether duplicates represent actual drift vs intentional variants

---

## 🔴 High Confidence Signals (59)
> These have the strongest indicators of potential SSOT drift:
> exported, cross-package, specific names.

### 🔴 interface "Investigation" defined 10x within "intelink" (5 exported)
- **Kind:** interface
- **Packages:** intelink
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
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "TimelineEvent" defined 7x across 2 packages (intelink, eagle-eye) (5 exported)
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
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 type_alias "EntityType" defined 6x within "intelink" (4 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:41`
  - `apps/intelink/lib/intelink/entity-matcher.ts:16`
  - `apps/intelink/lib/document-extraction.ts:46`
  - `apps/intelink/components/intelink/AddEntityModal.tsx:25`
  - `apps/intelink/components/investigation/new/types.ts:35`
  - `apps/intelink/hooks/useEntityModals.ts:8`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "SearchResult" defined 5x across 2 packages (intelink, eagle-eye) (3 exported)
- **Kind:** interface
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/app/api/search/route.ts:29`
  - `apps/intelink/lib/intelligence/graph-aggregator.ts:80`
  - `apps/intelink/lib/cache/incremental-index.ts:29`
  - `apps/intelink/components/search/constants.ts:20`
  - `apps/eagle-eye/src/research/timeline_tracer.ts:16`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "Finding" defined 4x across 3 packages (agents, scripts, intelink) (1 exported)
- **Kind:** interface
- **Packages:** agents, scripts, intelink
- **Locations:**
  - `agents/runtime/runner.ts:56`
  - `scripts/ssot_governance.ts:27`
  - `apps/intelink/components/intelink/FindingsPanel.tsx:29`
  - `apps/intelink/components/FindingsPanel.tsx:24`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "TeamMember" defined 4x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/chat.ts:18`
  - `apps/intelink/app/central/membros/page.tsx:56`
  - `apps/intelink/components/investigation/new/types.ts:11`
  - `apps/intelink/components/shared/ShareJourneyDialog.tsx:29`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 type_alias "DocumentType" defined 4x within "intelink" (4 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:201`
  - `apps/intelink/lib/prompts/types.ts:8`
  - `apps/intelink/lib/document-extraction.ts:36`
  - `apps/intelink/components/intelink/DocumentActionButtons.tsx:17`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "Stats" defined 4x across 2 packages (intelink, nexus) (all local)
- **Kind:** interface
- **Packages:** intelink, nexus
- **Locations:**
  - `apps/intelink/app/page.tsx:12`
  - `apps/intelink/app/central/page.tsx:16`
  - `apps/intelink/app/central/vinculos/page.tsx:79`
  - `apps/nexus/web/src/app/dashboard/page.tsx:14`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 type_alias "AuditAction" defined 4x within "intelink" (3 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:250`
  - `apps/intelink/lib/audit-service.ts:12`
  - `apps/intelink/lib/security/audit.ts:25`
  - `apps/intelink/hooks/useAudit.ts:19`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "RateLimitConfig" defined 4x across 2 packages (intelink, egos-web) (3 exported)
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/rate-limit.ts:17`
  - `apps/intelink/lib/etl/rate-limiter.ts:15`
  - `apps/intelink/lib/security/rate-limit.ts:22`
  - `apps/egos-web/api/_rate-limit.ts:15`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "AgentResult" defined 3x across 2 packages (agents, egos-web) (all local)
- **Kind:** interface
- **Packages:** agents, egos-web
- **Locations:**
  - `agents/agents/orchestrator.ts:22`
  - `agents/worker/index.ts:50`
  - `apps/egos-web/src/components/AuditHub.tsx:4`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "Toast" defined 3x across 2 packages (intelink, marketplace-core) (1 exported)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/types/chat.ts:39`
  - `apps/intelink/components/intelink/Toast.tsx:9`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:8`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "ChatMessage" defined 3x across 2 packages (intelink, egos-web) (3 exported)
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/types/api.ts:224`
  - `apps/intelink/lib/llm/llm-provider.ts:16`
  - `apps/egos-web/src/store/useAppStore.ts:30`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "GraphData" defined 3x across 2 packages (intelink, egos-web) (1 exported)
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/app/graph/[id]/page.tsx:38`
  - `apps/intelink/app/graph/[id]/3d/page.tsx:51`
  - `apps/egos-web/src/services/github.ts:27`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "EvidenceData" defined 3x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/intelligence/graph-aggregator.ts:49`
  - `apps/intelink/lib/intelink/evidence-validation.ts:72`
  - `apps/intelink/components/shared/EvidenceDetailModal.tsx:60`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 type_alias "SystemRole" defined 3x within "intelink" (3 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:21`
  - `apps/intelink/lib/rbac/index.ts:22`
  - `apps/intelink/hooks/useRole.tsx:5`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 type_alias "Permission" defined 3x within "intelink" (3 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:279`
  - `apps/intelink/lib/permissions.ts:18`
  - `apps/intelink/lib/rbac/index.ts:45`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "AnalysisResult" defined 3x across 2 packages (intelink, shared) (2 exported)
- **Kind:** interface
- **Packages:** intelink, shared
- **Locations:**
  - `apps/intelink/lib/intelink/analysis-prompts.ts:56`
  - `apps/intelink/components/investigation/SetupWizard.tsx:20`
  - `packages/shared/src/types.ts:66`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "EmptyStateProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/patterns/EmptyState.tsx:6`
  - `apps/intelink/components/vinculos/UIComponents.tsx:88`
  - `apps/marketplace-core/src/components/ui/EmptyState.tsx:6`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "PageHeaderProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/shared/PageHeader.tsx:7`
  - `apps/intelink/components/layout/PageHeader.tsx:8`
  - `apps/marketplace-core/src/components/ui/PageHeader.tsx:7`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 interface "SkeletonProps" defined 3x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/shared/Skeleton.tsx:14`
  - `apps/intelink/components/ui/Skeleton.tsx:5`
  - `apps/marketplace-core/src/components/ui/skeleton.tsx:8`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### 🔴 class "RateLimiter" defined 3x across 3 packages (egos-web, eagle-eye, shared) (1 exported)
- **Kind:** class
- **Packages:** egos-web, eagle-eye, shared
- **Locations:**
  - `apps/egos-web/api/_rate-limit.ts:20`
  - `apps/eagle-eye/src/enrich_opportunity.ts:12`
  - `packages/shared/src/rate-limiter.ts:7`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "ConfidenceLevel" defined 2x across 2 packages (agents, intelink) (1 exported)
- **Kind:** type_alias
- **Packages:** agents, intelink
- **Locations:**
  - `agents/agents/ssot-auditor.ts:52`
  - `apps/intelink/lib/pramana/confidence-system.ts:13`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "EnrichmentResult" defined 2x across 2 packages (agents, eagle-eye) (1 exported)
- **Kind:** interface
- **Packages:** agents, eagle-eye
- **Locations:**
  - `agents/worker/ai-enricher.ts:48`
  - `apps/eagle-eye/src/enrich_opportunity.ts:46`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "EnrichedProduct" defined 2x across 2 packages (scripts, nexus-shared) (1 exported)
- **Kind:** interface
- **Packages:** scripts, nexus-shared
- **Locations:**
  - `scripts/simulate_audit.ts:16`
  - `packages/nexus-shared/src/ai/product-enricher.ts:23`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "Message" defined 2x across 2 packages (intelink, nexus) (1 exported)
- **Kind:** interface
- **Packages:** intelink, nexus
- **Locations:**
  - `apps/intelink/types/chat.ts:5`
  - `apps/nexus/web/src/app/dashboard/chat/page.tsx:12`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "ChatSession" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/chat.ts:27`
  - `apps/intelink/types/api.ts:232`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "MatchType" defined 2x within "intelink" (2 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:181`
  - `apps/intelink/lib/documents/cross-case-utils.ts:12`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "MemberRole" defined 2x within "intelink" (2 exported)
- **Kind:** type_alias
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/types/api.ts:245`
  - `apps/intelink/lib/auth/types.ts:13`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "TabId" defined 2x across 2 packages (intelink, egos-web) (all local)
- **Kind:** type_alias
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/app/central/intelligence-lab/page.tsx:40`
  - `apps/egos-web/src/components/SecurityHub.tsx:92`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "AuthState" defined 2x across 2 packages (intelink, egos-web) (1 exported)
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/auth/types.ts:107`
  - `apps/egos-web/src/hooks/useAuth.ts:5`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "SourceType" defined 2x across 2 packages (intelink, eagle-eye) (2 exported)
- **Kind:** type_alias
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/lib/types/journey.ts:11`
  - `apps/eagle-eye/src/modules/tourism/truth-consensus.ts:4`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "InvestigationContext" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/intelink/ai-chat.ts:26`
  - `apps/intelink/lib/analysis/diligence-suggestions.ts:28`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "ExtractedEntity" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:29`
  - `apps/intelink/lib/document-extraction.ts:48`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "ExtractedRelationship" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:38`
  - `apps/intelink/lib/document-extraction.ts:56`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "AIAnalysis" defined 2x across 2 packages (intelink, egos-web) (1 exported)
- **Kind:** interface
- **Packages:** intelink, egos-web
- **Locations:**
  - `apps/intelink/lib/prompts/types.ts:75`
  - `apps/egos-web/api/ingest-commits.ts:52`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "GuardianResult" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/prompts/documents/guardian.ts:93`
  - `apps/intelink/hooks/useGuardianAnalysis.ts:36`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "RateLimitResult" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/rate-limit.ts:53`
  - `apps/intelink/lib/security/rate-limit.ts:31`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "SessionUser" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/security/auth.ts:22`
  - `apps/intelink/lib/session.ts:10`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "SessionValidationResult" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/lib/security/auth.ts:33`
  - `apps/intelink/lib/session.ts:21`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "ModelConfig" defined 2x across 2 packages (intelink, shared) (2 exported)
- **Kind:** interface
- **Packages:** intelink, shared
- **Locations:**
  - `apps/intelink/lib/document-extraction.ts:86`
  - `packages/shared/src/ai-models.ts:14`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "User" defined 2x across 2 packages (intelink, marketplace-core) (1 exported)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/providers/AuthProvider.tsx:6`
  - `apps/marketplace-core/src/domain/identity/types.ts:3`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "ToastType" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** type_alias
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/intelink/Toast.tsx:7`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:6`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "ToastContextType" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/intelink/Toast.tsx:17`
  - `apps/marketplace-core/src/components/ui/Toast.tsx:15`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "EntityInput" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/components/investigation/entity-forms/types.ts:5`
  - `apps/intelink/components/investigation/new/types.ts:19`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "OptimizedImageProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/OptimizedImage.tsx:20`
  - `apps/marketplace-core/src/components/ui/optimized-image.tsx:12`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "CardProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:6`
  - `apps/marketplace-core/src/components/ui/Card.tsx:4`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "CardHeaderProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:52`
  - `apps/marketplace-core/src/components/ui/Card.tsx:39`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "CardContentProps" defined 2x across 2 packages (intelink, marketplace-core) (all local)
- **Kind:** interface
- **Packages:** intelink, marketplace-core
- **Locations:**
  - `apps/intelink/components/ui/Card.tsx:91`
  - `apps/marketplace-core/src/components/ui/Card.tsx:59`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "Suggestion" defined 2x across 2 packages (intelink, eagle-eye) (1 exported)
- **Kind:** interface
- **Packages:** intelink, eagle-eye
- **Locations:**
  - `apps/intelink/components/graph/PredictedLinksPanel.tsx:50`
  - `apps/eagle-eye/src/modules/tourism/gamification.ts:102`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "UserPermissions" defined 2x within "intelink" (2 exported)
- **Kind:** interface
- **Packages:** intelink
- **Locations:**
  - `apps/intelink/hooks/useRole.tsx:7`
  - `apps/intelink/hooks/usePermissions.ts:5`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "AppName" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:8`
  - `packages/shared/src/api-registry.ts:17`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "RouteStatus" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:9`
  - `packages/shared/src/api-registry.ts:19`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "AutomationLevel" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:10`
  - `packages/shared/src/api-registry.ts:21`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "HttpMethod" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:11`
  - `packages/shared/src/api-registry.ts:27`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "RouteCategory" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** type_alias
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:12`
  - `packages/shared/src/api-registry.ts:29`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "RouteEntry" defined 2x across 2 packages (egos-web, shared) (2 exported)
- **Kind:** interface
- **Packages:** egos-web, shared
- **Locations:**
  - `apps/egos-web/src/lib/api-registry.ts:14`
  - `packages/shared/src/api-registry.ts:45`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ type_alias "UserRole" defined 2x across 2 packages (marketplace-core, nexus-shared) (2 exported)
- **Kind:** type_alias
- **Packages:** marketplace-core, nexus-shared
- **Locations:**
  - `apps/marketplace-core/src/domain/identity/types.ts:1`
  - `packages/nexus-shared/src/types/index.ts:2`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

### ⚠️ interface "UserProfile" defined 2x across 2 packages (marketplace-core, eagle-eye) (2 exported)
- **Kind:** interface
- **Packages:** marketplace-core, eagle-eye
- **Locations:**
  - `apps/marketplace-core/src/domain/identity/types.ts:11`
  - `apps/eagle-eye/src/modules/tourism/gamification.ts:2`
- **Recommendation:** High confidence drift signal — consolidate into shared types or verify intentional divergence

## ⚠️ Medium Confidence Signals (34)
> Require validation — may be intentional or framework-driven.

- **interface "Entity" defined 14x within "intelink" (3 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "Relationship" defined 6x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "GraphNode" defined 6x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "GraphLink" defined 5x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "CrossCaseAlert" defined 4x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "Member" defined 4x within "intelink" (3 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "MemberInfo" defined 4x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "PoliceUnit" defined 4x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "TestResult" defined 3x within "agents" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "ExtractionResult" defined 3x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "ApiError" defined 2x within "intelink" (2 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "CrossCaseEntity" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "UnifiedLink" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "DossierResult" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "JourneyAnalysisRequest" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "IndirectConnection" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "DuplicateGroup" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "EntityData" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "PredictedLink" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "EntityMatch" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "JuristaCrime" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "JuristaResult" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "DebateResult" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "RateLimitEntry" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "NotificationPayload" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "CacheEntry" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "TelemetryEvent" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "EntityInfo" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **type_alias "InputMode" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "StatCardProps" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "FindingsPanelProps" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "EvidencePanelProps" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "StatusBadgeProps" defined 2x within "intelink" (all local)** — Medium signal — review if these represent the same entity or are intentionally distinct
- **interface "WidgetConfig" defined 2x within "intelink" (1 exported)** — Medium signal — review if these represent the same entity or are intentionally distinct

## ℹ️ Low Confidence / Convention (339)
> Likely framework conventions, local variants, or orphaned exports.
> Review only if actively cleaning up the codebase.

- interface "Evidence" defined 5x within "intelink" (all local)
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
- ... and 319 more

---

## Methodology

This report uses the TypeScript compiler API (`ts.createSourceFile`) to parse
the AST of each file. Only structural type-level declarations are extracted:
interfaces, type aliases, enums, and classes. Comments, strings, property keys,
and variable names are **not** captured (fixing a known v1 issue).

### Confidence Scoring

Each finding receives a confidence score based on:
- **+3** exported symbols in multiple locations
- **+3** appears across multiple packages
- **+2** name is specific (not framework convention)
- **+1** name is long (>8 characters)
- **-3** framework convention name (Props, State, etc.)
- **-2** involves generated files
- **-1** all in same package
- **-3** very short name (≤2 chars)

### Known Limitations

1. No shape comparison yet — duplicate names may have identical or divergent shapes
2. No cross-reference graph — can't trace re-exports through barrel files
3. Framework conventions are heuristic-based, not exhaustive
