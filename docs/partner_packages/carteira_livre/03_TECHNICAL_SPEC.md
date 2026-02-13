# 🏗️ Technical Specification: Carteira Livre

> **Architecture & Stack Definition**
> Optimized for Speed, Scalability, and Regulatory Compliance.

---

## 1. High-Level Architecture
**Monolith (Modular)** structure using **Next.js 15 (App Router)** hosted on **Vercel**.
- **Frontend:** React 19, TailwindCSS, Lucide Icons.
- **Backend:** Next.js API Routes (Serverless Functions).
- **Database:** PostgreSQL (Supabase).
- **Real-time:** Supabase Realtime (for Ride Tracking/Chat).

## 2. Infrastructure & Services

### Core Services
| Service | Provider | Purpose |
|---------|----------|---------|
| **Hosting** | Vercel | Frontend & Edge Functions CDN |
| **Database** | Supabase | Relational Data, Auth, Storage |
| **Payments** | Asaas | Split Payments (Marketplace), PIX, Boleto |
| **Maps** | Google Maps | Geocoding, Directions, Static Maps |
| **AI** | OpenRouter (Gemini) | "Tutor IA", Support Bot, Document OCR |

### Key Libraries
- `@mobile/camera`: Capacitor Camera (for Liveness Check).
- `react-map-gl` or `google-maps-react`: Map rendering.
- `zod`: Schema validation.
- `tanstack/react-query`: Data fetching & caching.

---

## 3. Data Schema (Core Tables)

### `users` (Managed by Supabase Auth)
- `id` (UUID)
- `email`
- `role` (student, instructor, admin)

### `profiles` (Public Metadata)
- `id` (FK users)
- `full_name`
- `avatar_url`
- `document_id` (CPF - Encrypted)
- `address_json`

### `instructors` (Professional Data)
- `id` (FK profiles)
- `credential_number` (DETRAN)
- `rating_avg` (0-5)
- `hourly_rate` (Decimal)
- `vehicle_info_json`

### `lessons` (The Core Transaction)
- `id` (UUID)
- `student_id` (FK)
- `instructor_id` (FK)
- `status` (scheduled, in_progress, completed, disputed)
- `scheduled_at` (Timestamp)
- `geo_trace_json` (Array of Lat/Lng)
- `payment_id` (FK)

---

## 4. Security & Compliance
- **RLS (Row Level Security):** Strict policies on Supabase.
    - *Students can only see their lessons.*
    - *Instructors can only see their lessons.*
    - *Public profiles are visible to auth users.*
- **PII Protection:** CPF, CNH, and Address stored encrypted or restricted.
- **Audit Logs:** All status changes in `lessons` are logged to `audit_logs` table (immutable).

## 5. Mobile Strategy (PWA vs Native)
- **Initial Launch:** PWA (Progressive Web App).
- **Phase 2:** Capacitor Wrapper (iOS/Android) for better location tracking & push notifications.
- **Reasoning:** Speed to market. PWA supports Geolocation and Camera sufficiently for MVP.

---
*Created by Eagle Eye "Tech Lead" Agent*
