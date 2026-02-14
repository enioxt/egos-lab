# 🌌 QUANTUM PROMPT: MARKETPLACE-CORE (New Project)

**Mission:** Create a generic, AI-first, mobile-first marketplace platform for autonomous workers.
**Constraint:** Build in parallel to `carteira-livre` (legacy) without modifying it. Extract patterns only. `egos-lab/apps/marketplace-core`.

## 1. 🎯 OBJECTIVE (Quantum Definition)
**State Vector S(t):** `[Supply, Demand, Liquidity, Trust, Conversion, Retention, GMV, TakeRate, AbuseRisk, Disputes, CAC, LTV]`
**Maximize J:** `w1*Liquidity + w2*Conversion + w3*Retention + w4*Trust - w5*Risk - w6*Disputes - w7*CAC + w8*Contribution`

**Key Constraints:**
- LGPD & Data Minimization.
- No promise of results (Marketplace model, not Agency).
- Split payments with audit trail.
- Mobile-first & Accessibility.
- Observability first.

## 2. 🔍 PHASE 1: REUSE AUDIT (From `carteira-livre`)
- **Inventory:** Auth, Roles, Onboarding, Payments (Split), Notifications, UI Tokens.
- **Output:** `/docs/marketplace/reuse-audit.md`.

## 3. 🏗️ PHASE 2: CORE ARCHITECTURE (`marketplace-core`)
- **Modules:**
  - `identity-core`: Users, Roles, Sessions.
  - `marketplace-core`: Requests, Proposals, Bookings.
  - `payments-core`: Providers, Split, Ledger.
  - `comms-core`: Chat, Notifications.
  - `analytics-core`: Event Schema, Attribution.

## 4. 🧠 PHASE 3: INTELLIGENCE & RANKING
- **Structured Demand:** RFQ -> Distribution -> Propsals.
- **Ranking Model:** `Score = a*Trust + b*Distance + c*Availability + d*PriceFit + e*ResponseRate`.
- **Agents:**
  - `OnboardingAgent`: Profile optimization.
  - `MatchingAgent`: Ranking & Distribution.
  - `SupportAgent`: First triage.

## 5. 💰 PHASE 4: PAYMENTS & LEDGER
- **Internal Ledger:** Immutable transaction log.
- **Split Logic:** Platform Fee vs Provider Payout.
- **Provider Interface:** Abstract Adapter (start with Asaas).

## 6. 📊 PHASE 5: ANALYTICS NERVOUS SYSTEM
- **Events:** `view_list`, `create_request`, `proposal_sent`, `booking_crated`, `payment_succeeded`.
- **Metrics:** Liquidity, Take Rate, Contribution, Time-to-Book.
- **Attribution:** UTM tracking + First/Last touch.

## 7. 📱 PHASE 6: EXECUTION & UI
- **Mobile-First UI:** Tokens, Themes, Components.
- **E2E Tests:** Critical flows (RFQ -> Pay -> Review).

---
**Next Step:** Execute Phase 1 (Audit) immediately.
