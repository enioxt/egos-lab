# Nexus Market — Intelligent Local Delivery Platform

> **Status**: Planning Phase
> **Type**: Commercial Application (White-label capable)
> **Stack**: Next.js, React Native (Expo), Supabase, Node.js/NestJS

## 1. Executive Summary
Nexus Market is a "Smart Local Delivery" platform designed to bridge the gap between local supermarkets and digital consumers. It reverse-engineers successful models like **Daki** and **iFood Mercado**, adding a unique layer of **Artificial Intelligence** for inventory management, expiration date tracking, and predictive shopping lists.

**Core Philosophy:**
- **Mobile First**: Native experience for iOS/Android.
- **AI-Driven**: Automate mundane tasks (categorization) and enhance revenue (smart suggestions).
- **White-Label**: Built to be deployed as a standalone brand for supermarket chains or as a multi-tenant marketplace.

## 2. Market Analysis & Inspiration
### Benchmarks
- **Daki**: 15-min delivery optimization, dedicated dark stores. *Lesson: UX speed and "Turbo" mode.*
- **iFood Mercado**: Marketplace model, vast coverage. *Lesson: Logistics orchestration.*
- **Soudaki**: Local implementation reference.
- **B4Waste/FoodToSave**: Expiry date management. *Lesson: "Best Before" discounts as a traffic driver.*

### Local Context: Patos de Minas (Pilot Region)
Research indicates a fragmented market in the pilot region (Patos de Minas, MG):
- **Bernardão**: Strong online presence with "Bernardão em Casa". Good for weekly shoppings.
- **Hiper ABC**: Televendas + App. Strong on offers.
- **Bahamas Mix**: WhatsApp channel focus.
- **Opportunity**: Most competitors lack a unified, AI-driven "Smart Cart" experience or "Best Before" aggressive discounts. Users currently have to compare manually or rely on WhatsApp for deals. Nexus Market aims to centralize this with a superior UX.

### Problem Statement
Local markets lack the infrastructure to compete with giants. They suffer from:
1.  **Inventory Sync Issues**: discrepancies between physical and digital stock.
2.  **Expiration Waste**: High loss on perishable goods.
3.  **Logistics Complexity**: Picking, packing, and delivery coordination.

## 3. Product Features

### 🛒 Consumer App (Mobile/Web)
- **Smart Cart**: AI suggests items based on purchase history and consumption patterns (e.g., "You usually buy milk every 7 days").
- **"Best Before" Deals**: Dedicated section for products near expiration with dynamic pricing (-30%, -50%).
- **Unified Search**: Fuzzy search across all categories (AI-corrected typolgy).
- **Payment Split**: Support for Credit Card and Pix with automatic revenue split (Market receives direct, App keeps commission).

### 🏪 Merchant Dashboard (Web)
- **Inventory Ingestion Engine**:
  - Import via CSV/Excel.
  - Integration with local ERPs (future).
  - **AI Auto-Categorization**: Automatically sorts "Leite Int 1L" into "Laticínios > Leite > UHT" using LLMs.
- **Expiry Management**: Alert system for batch expiry dates.
- **Order Management**: Real-time picking dashboard with "Turbo" vs "Standard" prioritization.

### 🚚 Logistics & Operations
- **Picking App**: Simple interface for store collectors (Pickers).
- **Turbo Mode**: Optional premium delivery (30-60 mins) with higher fee.
- **Standard Mode**: Scheduled delivery windows.
- **Packaging Guidelines**: Strict protocols for separation (Cleaning vs Food, Heavy vs Fragile).

## 4. Technical Architecture

### Stack Strategy
Built within the **Egos Lab** monorepo structure.

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **Mobile App** | React Native (Expo) | Write once, deploy iOS/Android. Fast iteration. |
| **Web / Admin** | Next.js (App Router) | SEO for marketplace, high performance for dashboards. |
| **Backend API** | Node.js (NestJS) | Scalable, strictly typed, modular architecture. |
| **Database** | Supabase (PostgreSQL) | Real-time updates, Auth handles, easy scaling. |
| **AI Layer** | OpenAI / Gemini API | Product categorization, recommendation engine. |
| **Search** | MeiliSearch / Algolia | Fast, typo-tolerant search for products. |

### Data Model (High Level)
- **Tenants**: Support for multi-tenant (SaaS) or single-tenant (White-label) deployments.
- **Catalog**: Global Product Database (GS1/EAN based) + Local Store Overrides (Price/Stock).
- **Orders**: State machine handling (`PENDING` -> `PAID` -> `PICKING` -> `READY` -> `DELIVERING` -> `COMPLETED`).

## 5. Implementation Plan

### Phase 1: MVP (The Core)
- [ ] **Data Core**: Define Database Schema (Products, Stores, Orders).
- [ ] **Ingestion**: Script to parse CSVs and use LLM to categorize products.
- [ ] **Consumer App**: Home, Search, Cart, Checkout (Mock Payment).
- [ ] **Merchant View**: Basic order list.

### Phase 2: Operations & Payments
- [ ] **Payments**: Integrate Pagar.me/Stripe for Split Payments.
- [ ] **Logistics Module**: Delivery radius calculation and basic "Picking" UI.
- [ ] **Real-time**: Supabase Realtime subscriptions for order status.

### Phase 3: AI & Optimization
- [ ] **Recommendation Engine**: "Buy it again" smart lists.
- [ ] **expiry-bot**: Automated discounts for nearing expiration dates.
- [ ] **White-label Theming**: Configurable color schemes and logos for tenants.

## 6. Operational Guidelines (Standard Operating Procedure)
*To be provided to partner markets.*

1.  **Picking Process**:
    - **Step 1**: Print/View Order.
    - **Step 2**: Pick Heavy Items (Drinks, Detergents).
    - **Step 3**: Pick Dry Goods.
    - **Step 4**: Pick Fresh/Frozen (Last to keep temp).
    - **Step 5**: Pick Fragile (Eggs, Bread) - Place on top.
2.  **Packaging**: Use color-coded tags for "Fragile" or "Keep Frozen".
3.  **Handoff**: Verify order ID with driver.
