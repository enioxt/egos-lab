# 🔍 REUSE AUDIT: CARTEIRA LIVRE -> MARKETPLACE CORE

**Source:** `carteira-livre` (Production)
**Target:** `marketplace-core` (New Generic Platform)
**Date:** 2026-02-14

## 1. 🛡️ AUTHENTICATION & ROLES (`identity-core`)
**Status:** 🟢 High Reusability
-   **Pattern:** Supabase Auth + Custom `profiles` table.
-   **Roles:** `admin`, `instructor`, `student`. Store role in `public.profiles` metadata.
-   **Middleware:** `lib/auth/auth-guard.ts` protects routes.
-   **Verification:** `lib/auth/verify-admin.ts` uses both DB role and email allowlist.
-   **Extraction Strategy:**
    -   Copy `lib/auth` verbatim.
    -   Generalize `instructor` -> `provider` and `student` -> `client`.

## 2. 💰 PAYMENTS & SPLIT (`payments-core`)
**Status:** 🟡 Medium Reusability (Logic good, implementation specific)
-   **Provider:** Asaas (implied by validators/installments logic).
-   **Logic:**
    -   `lib/installments.ts`: Credit card installment calc (1-12x) with interest rates.
    -   `lib/pricing/distance-pricing.ts`: Dynamic pricing model.
    -   `lib/validators/asaas-validators.ts`: Critical for input sanitization (CPF/CNPJ/Address) to avoid 500 errors.
-   **Recommendation:**
    -   Extract `installments.ts` as a pure utility.
    -   Extract `asaas-validators.ts` but rename to `provider-validators.ts`.

## 3. 🎨 UI & DESIGN SYSTEM (`ui-core`)
**Status:** 🟢 High Reusability
-   **Stack:** TailwindCSS + Lucide + Shadcn/Radix.
-   **Tokens:** `tailwind.config.ts` uses semantic colors (e.g., `primary`, `destructive`) mapped to CSS variables.
-   **Components:**
    -   `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx` are generic.
    -   `ModernSlider.tsx` and `StatsCard.tsx` are valuable for dashboards.
-   **Extraction Strategy:**
    -   Copy `components/ui/` folder entirely.
    -   Copy `tailwind.config.ts` and `app/globals.css` (rename theme variables if needed).

## 4. 💾 DATA & MIGRATIONS (`data-core`)
**Status:** 🟡 Medium Reusability
-   **Schema:** `profiles`, `lessons` (bookings), `reviews`.
-   **Migrations:** `supabase/migrations` contains the evolution.
-   **Strategy:**
    -   Use `profiles` table as baseline for `Users`.
    -   Generalize `lessons` table to `ServiceRequests` or `Bookings`.
    -   Keep RLS policies (e.g., "Users can read own data").

## 5. 🧠 AI & INTELLIGENCE (`intelligence-core`)
**Status:** 🟢 High Reusability
-   **Orchestrator:** `lib/ai/orchestrator` is already a structured agent system.
-   **Agents:**
    -   `InfluencerAgent`: Good for demand generation.
    -   `DocumentAgent`: Reusable for generic KYC/onboarding.
-   **Extraction:**
    -   Lift the `orchestrator` folder as-is.

## 6. ⚠️ GAPS & NEW NEEDS
-   **Ledger:** Current system implies split but lacks a dedicated double-entry ledger module. **Must build from scratch.**
-   **RFQ Flow:** Current flow is "Book Instructor" (Direct). New model needs "Post Request -> Get Proposals". **New Logic required.**
-   **Analytics:** Current logging is scattered. Need a unified `AnalyticsEvent` bus.

---
**Conclusion:** `carteira-livre` provides ~60% of the foundation (Auth, UI, Basic Payments). The remaining 40% (Ledger, RFQ, Event Bus) must be built new in `marketplace-core`.
