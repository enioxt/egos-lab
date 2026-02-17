# Intelink Features Analysis — What's Reusable for EGOS

> **Date:** 2026-02-17 | **Source:** EGOSv5/apps/intelink

---

## 1. Cross-Reference Service (HIGH VALUE — Port to EGOS)

**File:** `lib/intelink/cross-reference-service.ts`

Multi-level entity matching with confidence scoring:

| Level | Criteria | Confidence | Algorithm |
|-------|----------|------------|-----------|
| 1 | CPF/RG/CNPJ exact match | 100% | Exact |
| 2 | Name + Date of Birth | 95% | Exact + Date |
| 3 | Name + Filiation | 90% | Jaro-Winkler > 0.85 |
| 4 | Phone number | 85% | Normalized exact |
| 5 | Address fuzzy | 75-90% | Parse + Jaro-Winkler > 0.90 + number proximity |
| 6 | Name similarity | 70% | Jaro-Winkler > 0.90 + common name filter |

**Key innovations:**
- **Data Quality Alerts**: Detects CPF+Name mismatches (critical errors)
- **Homonym Protection**: If both entities have CPF and they differ → NOT a match (even with identical names)
- **Common Name Filter**: "José", "Maria" etc. alone don't trigger matches
- **Address Parsing**: Separates street type, name, number; compares intelligently

**Reusable for EGOS:**
- **SSOT Auditor**: Adapt the fuzzy matching for detecting duplicate type definitions (beyond exact regex)
- **Rule Sharing**: Match similar .guarani/.windsurfrules configs across projects
- **Activity Timeline**: Cross-reference commits across repos by author, file patterns, module

---

## 2. Link Prediction + Accuracy Tracking (MEDIUM VALUE)

**File:** `lib/link-prediction/accuracy-tracker.ts`

Tracks prediction accuracy with:
- **Algorithms**: exact, fuzzy, phonetic, embedding, LLM
- **Metrics**: Precision, Recall, F1 Score, Accuracy
- **Score ranges**: high (≥0.9), medium (0.7-0.9), low (<0.7)
- **Trend tracking**: 7-day, 30-day, all-time

**Reusable for EGOS:**
- **Agent Eval System**: Track agent finding accuracy (confirmed/rejected/pending)
- **SSOT Auditor**: Track false positive rates per detection algorithm
- **Code Review**: Track AI review suggestion acceptance rates

---

## 3. Drag & Drop Modular Dashboard (HIGH VALUE — Port Pattern)

**File:** `components/shared/DraggableGridLayout.tsx`

Uses `@dnd-kit/core` + `@dnd-kit/sortable` for:
- **Grid-based widget layout** with 2-column support
- **Persistent widget positions** per investigation
- **Drag handles** (GripVertical icon)
- **Keyboard accessibility** (KeyboardSensor)

**Reusable for EGOS:**
- **Mission Control Dashboard**: Users can rearrange activity stream, ecosystem grid, chat, stats
- **Rule Forge**: Drag-and-drop rule composition (combine .guarani snippets)
- **Agent Dashboard**: Arrange agent output panels by priority

---

## 4. Investigation Timeline (MEDIUM VALUE — Port Pattern)

**File:** `components/intelink/InvestigationTimeline.tsx`

Event types: `entity_added`, `relationship_created`, `evidence_uploaded`, `status_changed`, `analysis_run`, `custom`

Features:
- **Grouped by date** with date headers
- **Color-coded event types** (blue, purple, emerald, amber, cyan)
- **Entity-type icons** (Person, Location, Vehicle, Organization)
- **Clickable events** for drill-down

**Reusable for EGOS:**
- **Activity Timeline**: Group commits by date, color by category (feat=blue, fix=red, docs=green)
- **Agent Timeline**: Show agent runs, findings, actions in chronological order
- **Project Timeline**: Milestones, releases, contributor joins

---

## 5. Graph Visualization (MEDIUM VALUE)

**Files:**
- `components/graph/ConnectionList.tsx` — Entity connections list
- `components/graph/PredictedLinksPanel.tsx` — AI-predicted hidden links
- `components/chat/ChatGraphWidget.tsx` — Chat-integrated graph

**Reusable for EGOS:**
- **Dependency Graph**: Show agent→file→finding relationships
- **Rule Inheritance**: Visualize how .guarani rules cascade through projects
- **Commit Graph**: Force-directed graph of commits, branches, contributors

---

## 6. Priority Porting Order

| # | Feature | Effort | Impact | For |
|---|---------|--------|--------|-----|
| 1 | Timeline pattern | 2h | High | Activity Stream enrichment |
| 2 | Accuracy Tracker | 2h | High | Agent eval system |
| 3 | DraggableGridLayout | 4h | High | Mission Control dashboard |
| 4 | Cross-Reference fuzzy matching | 4h | Medium | SSOT Auditor improvement |
| 5 | Graph visualization | 8h | Medium | Rule inheritance + dependency viz |
| 6 | Link Prediction | 4h | Low | Future: auto-suggest connections |

---

## 7. Architecture Notes

Intelink patterns that apply to EGOS:
- **Everything is an entity**: People, vehicles, locations → In EGOS: Commits, agents, rules, findings
- **Everything has relationships**: Directed links with types → In EGOS: agent→finding, commit→file, rule→project
- **Everything is scored**: Confidence levels → In EGOS: Finding severity, agent accuracy, rule coverage
- **Everything is auditable**: Timeline events → In EGOS: JSONL logs, correlation IDs, handoff docs
