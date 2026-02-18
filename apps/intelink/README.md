# Intelink

> **Status:** Integrated into `egos-lab` Monorepo (Feb 2026)
> **Role:** Intelligence Visualization Engine & Police System (DHPP)
> **Stack:** Next.js 15, Supabase, Tailwind, Shadcn/UI

## 🦅 Overview

Intelink is the "Cortex" of the ecosystem — a visualization engine for complex data relationships.
Originally built as a Police Intelligence System for DHPP (Homicide Department), it is now being generalized to visualize *any* graph data (including the EGOS ecosystem itself).

## 🚀 Features

- **Timeline Analysis**: Visual chronological events
- **Graph Explorer**: Force-directed graph of entities (People, Vehicles, Phones)
- **Telemetry**: Real-time system observability
- **Auth**: RBAC with Supabase (Police/Admin roles)

## 🛠️ Development

```bash
# Run from monorepo root
cd apps/intelink
bun dev
```

## 🏗️ Architecture

- **`app/`**: Next.js App Router
- **`components/`**: UI Components (many specialized for data viz)
- **`lib/`**: Core logic (graph algorithms, timeline processing)
- **`migrations/`**: Supabase SQL migrations (historical)

## 🔐 Security

- **RLS Enabled**: All tables protected by Row Level Security
- **RBAC**: Strict role checks (`admin`, `police`, `analyst`)
- **Audit Logs**: All actions recorded in `telemetry_events`

---
*Part of the [EGOS Lab](../../README.md) Ecosystem.*
