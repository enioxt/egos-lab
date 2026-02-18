# Nexus Market: Architecture & Strategy

## 1. Monorepo Structure: Apps vs Projects
We follow a strict separation of concerns within the `egos-lab` monorepo:

### **Apps (`apps/`)**
- **Definition**: Deployable applications with a build target (Production).
- **Examples**: `nexus-market-web` (Next.js), `nexus-market-api` (NestJS), `nexus-market-mobile` (Expo).
- **Criteria**: If it has a URL or an App Store entry, it belongs here.

### **Projects (`projects/`) & Packages (`packages/`)**
- **Definition**: Internal tools, experiments, or shared libraries.
- **Criteria**: If it's imported by an App or used by developers (CLI tools), it belongs here.

---

## 2. White-Label Strategy (Multi-Tenant)
To serve multiple supermarkets ("Market A", "Market B") from a single codebase, we use a hybrid strategy:

### A. Data Layer (Logical Isolation)
- **Database**: Single Postgres instance with Row Level Security (RLS).
- **Column**: Every table (`products`, `orders`, `customers`) has a `tenant_id` column.
- **Auth**: Users are bound to a tenant. Super-admins have global access.

### B. Frontend Layer (Visual Customization)
- **Theming**: A `themes.json` config defines colors, logos, and fonts for each tenant.
- **Components**: UI components (Buttons, Headers) consume these tokens dynamically.
- **Domains**: Middleware detects the hostname (`market-a.com`) and injects the corresponding `tenant_id` into the request context.

---

## 3. Core Modules
### **1. Intelligent Catalog (AI-Powered)**
*Problem*: Market ERPs have messy data ("ARROZ T1 5KG").
*Solution*: A specialized ingestion pipeline.
- **Input**: CSV/API from ERP.
- **Process**: LLM (Gemini/OpenAI) standardizes names ("Arroz Tipo 1 - 5kg"), assigns categories, and finding image URLs.
- **Output**: Clean Catalog.

### **2. Logistics Engine**
- **Calculators**: Distance-based delivery fees.
- **Split**: Logic to route orders to "Turbo" or "Standard" queues based on distance and cart items.

### **3. Financial Split**
- **Gateway**: Pagar.me or Stripe Connect.
- **Flow**:
  1. Customer pays R$ 100,00.
  2. Gateway splits: R$ 90,00 to Market, R$ 10,00 to Platform.
  3. Market receives funds directly (simplifying tax liability for the Platform).

---

## 4. Scalability Roadmap
1.  **Stage 1 (MVP)**: Next.js Monolith (Frontend + API Routes). Easy to build and deploy.
2.  **Stage 2 (Growth)**: Extract API to NestJS service for better job processing (inventory sync).
3.  **Stage 3 (Scale)**: Microservices for "Search" (Elasticsearch) and "Recommendations" (Python/FastAPI).
