# Handoff: Documentation & Security Hardening (2026-02-18)

> **Session Goal:** Improve `egos-lab` documentation for Open Source release (Humans + AIs) and harden RLS security.

## 📝 Documentation Overhaul

| File | Purpose |
|------|---------|
| **`docs/SYSTEM_MAP.md`** | **NEW.** Auto-generated inventory of all 1051 files & 357k LOC. Run `bun scripts/extract_system_map.ts` to update. |
| **`CONTRIBUTING.md`** | **NEW.** Root-level entry point pointing to detailed guides. |
| **`agents/README.md`** | **NEW.** Documentation for the Agentic Platform runtime & registry. |
| **`apps/README.md`** | **NEW.** Inventory of active applications (Mission Control, Intelink, etc). |
| **`projects/README.md`** | **NEW.** Guide to Project Blueprints. |
| **`packages/README.md`** | **NEW.** Guide to shared packages. |
| **`docs/README.md`** | **NEW.** Index for the knowledge base. |
| **`docs/INTELINK_IDENTITY.md`** | **NEW.** Clarification on Intelink's dual role (Police Tool vs Cortex Engine). |

## 🔐 Security Hardening

**Fixed 15 Permissive RLS Policies** (Migrations `004` & `005`):
- Locked down to `service_role` only (removed public access):
  - **Batch 1:** `reward_ledger`, `user_tiers`, `risk_events`, `pending_claims`, `volante_instructors`, `volante_lessons`, `volante_candidates`, `volante_availability`
  - **Batch 2:** `intelink_role_permissions`, `messages_v3`, `pattern_feedback`, `telemetry_events_v2`, `volante_gift_lessons`, `volante_instructor_applications`, `intelink_telemetry`

## 🤖 Automations

- **System Map Script:** `scripts/extract_system_map.ts` — Generates a markdown report of the file structure. Added to `/start` workflow.

## 📌 Next Steps

- **P1:** Continue updating `docs/INTELINK_IDENTITY.md` (task DOCS-002).
- **P2:** Set up GitHub OAuth for `egos-web` (task EGOSWEB-001).
- **P2:** Publish "First External Contribution" article.
