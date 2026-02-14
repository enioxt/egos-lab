# 🧬 QUANTUM PROMPT: CARTEIRA LIVRE (Reverse Engineered)

**Mission:** Build "Carteira Livre" — An AI-Powered Driving Instructor Marketplace.
**Role:** Senior Full-Stack Architect & AI Engineer.
**Objective:** Construct the entire platform from zero to production-ready state.

---

## 1. 🏗️ SYSTEM ARCHITECTURE & STACK

### Core Frameworks
- **Frontend/Fullstack:** Next.js 15 (App Router, Server Actions).
- **Language:** TypeScript (Strict mode).
- **Styling:** TailwindCSS v3.4 + `lucide-react` + `shadcn/ui` (Radix).
- **Backend/DB:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- **Runtime:** Bun (Package Manager & Script runner).

### Key Integrations (The "Accounts" List)
1.  **Supabase Pro:**
    -   *Modules:* Database, Authentication (OAuth), Storage (Images), Edge Functions.
    -   *Env:* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Google Cloud Platform (GCP):**
    -   *APIs:* Google Auth (Login), Vision API (CNH/Document OCR).
    -   *Env:* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_VISION_CREDENTIALS`.
3.  **Asaas (Fintech):**
    -   *Purpose:* Split payments, Marketplace logic, Pix/Credit Card processing.
    -   *Env:* `ASAAS_API_KEY`, `ASAAS_WALLET_ID` (Platform Wallet).
4.  **Resend:**
    -   *Purpose:* Transactional emails (Welcome, Booking Confirmations).
    -   *Env:* `RESEND_API_KEY`.
5.  **AI & LLMs:**
    -   *Providers:* OpenAI (GPT-4o), Google (Gemini 2.0 Flash).
    -   *Sdk:* Vercel AI SDK (`ai`, `@ai-sdk/openai`).
    -   *Env:* `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`.
6.  **Meta/WhatsApp (Optional):**
    -   *Purpose:* Notifications via WhatsApp Business API.
    -   *Env:* `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.

---

## 2. 💾 DATABASE SCHEMA (Supabase)

**Core Tables:**
-   `profiles`: Users (id, email, full_name, role: 'student'|'instructor'|'admin', avatar_url).
-   `instructors`: Extended profile (id, bio, price_per_class, vehicles, service_area, rating).
-   `lessons`: Bookings (id, student_id, instructor_id, date, status: 'pending'|'confirmed'|'completed', payment_id).
-   `payments`: Financial records (id, lesson_id, asaas_id, amount, split_fee, status).
-   `reviews`: Ratings (id, lesson_id, rating, comment).
-   `wallet`: Referral credits (id, user_id, balance).

**Security:**
-   Enable RLS (Row Level Security) on ALL tables.
-   Policies: "Users can read/write their own data", "Public can view active instructors".

---

## 3. 🧠 MODULES & FEATURES

### A. Authentication & Roles
-   **Multi-Role System:** One user, multiple personas (Student, Instructor, Partner).
-   **Onboarding:** Specialized flows for Student (Basic) vs Instructor (Document Validation).

### B. Marketplace & Payments (The "Money" Engine)
-   **Engine:** Asaas Split Payment.
-   **Flow:**
    1.  Student pays platform (Pix/Card).
    2.  Platform holds funds.
    3.  On lesson completion -> Release split (Platform Fee % + Instructor %).
-   **Logic:** `lib/pricing/distance-pricing.ts` (Dynamic pricing based on location) and `lib/installments.ts` (Credit card installment calc).

### C. AI Orchestrator (`lib/ai/orchestrator`)
-   **Concept:** A central brain dispatching tasks to specialized agents.
-   **Agents:**
    1.  `TutorAgent`: Chatbot for traffic laws/student questions.
    2.  `DocumentAgent`: Extracts data from CNH/CRLV photos using Google Vision.
    3.  `InfluencerAgent`: Finds marketing partners on Instagram/YouTube.
    4.  `SEOAgent`: Optimizes content.

### D. Gamification
-   Points system for students (completing lessons) and instructors (getting reviews).
-   Badges/Levels in `profiles` table.

---

## 4. 🚀 EXECUTION PLAN (Step-by-Step)

### Phase 1: Foundation
1.  Initialize Next.js App Router project with Bun.
2.  Setup Tailwind CSS with "Stitch" design tokens (Warm Amber/Slate theme).
3.  Configure Supabase client and Auth callbacks.

### Phase 2: Database & Types
1.  Run SQL migrations to create `profiles`, `instructors`, `lessons`.
2.  Generate TypeScript types from Supabase schema.

### Phase 3: Marketplace Core
1.  Build `InstructorCard` and Search Page (Filter by city, price).
2.  Build Booking System (Calendar selection).
3.  Integrate Asaas API for checkout (create customer -> create charge).

### Phase 4: AI Layer
1.  Scaffold `lib/ai/orchestrator`.
2.  Implement `DocumentAgent` first (MVP feature: Validate Instructor).
3.  Implement `TutorAgent` (Chat UI).

### Phase 5: Polish & Deploy
1.  Implement `app/globals.css` with advanced animations.
2.  Deploy to Vercel.
3.  Setup Cron Jobs (via Supabase Edge Functions) to check payment status.

---

## 5. 📝 INSTRUCTION FOR EAGLE EYE
*Use this prompt to understand the "DNA" of Carteira Livre. When asked to "build it", follow the Execution Plan sequentially. Ensure all "Integrations" keys are present in `.env.local` before starting code execution.*
