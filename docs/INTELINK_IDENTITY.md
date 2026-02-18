# Intelink Identity & Positioning

> **Status:** Dual-Use Technology
> **Current Version:** 2.0 (Integrated into egos-lab)

## ☯️ The Duality

Intelink serves two distinct purposes in the EGOS ecosystem. It is crucial for contributors to understand this duality to avoid confusion when reading the code.

### 1. The Product: "Intelink Policial"
**Target Audience:** Law Enforcement (DHPP - Homicide Department)
**Goal:** Solves crimes by visualizing connections between people, vehicles, and evidence.
**Key Features:**
- **Timeline:** Chronological reconstruction of crimes.
- **Graph:** Force-directed network of suspects and evidence.
- **Report:** PDF generation for judicial inquiries.
- **Telematics:** Phone tower triangulation and call records.

> **Code Context:** You will see types like `Suspect`, `Crime`, `Evidence`, `Inquiry` in the codebase.

### 2. The Engine: "Intelink Cortex"
**Target Audience:** Developers & Systems (EGOS Ecosystem)
**Goal:** General-purpose visualization engine for *any* high-dimensional graph data.
**Key Features:**
- **Universal Graph:** Visualizing the EGOS ecosystem (Agents, Files, Tasks).
- **Telemetry:** Visualizing system health and agent operations.
- **Memory Explorer:** Navigating the vector database of memories.

> **Code Context:** We are currently refactoring hardcoded "Police" logic into generic "Entity" adapters.

## 🏗️ Architecture Transition

We are moving from **V1 (App)** to **V2 (Platform)**.

| Feature | V1 (Legacy) | V2 (Target) |
|---------|-------------|-------------|
| **Data Source** | Supabase `investigations` table | Agnostic `GraphProvider` interface |
| **Entities** | Hardcoded (Suspect, Vehicle) | Dynamic `EntityDefinition` |
| **Auth** | `isPolice` boolean | RBAC (`viewer`, `editor`, `admin`) |
| **Deployment** | Standalone App | Module within `egos-lab` |

## 🧭 Contributor Guide

- If you see `police` logic, it's likely V1 code.
- If you see `GraphNode`, `Edge`, `TimelineEvent` (generic), it's V2 code.
- **Do not break V1 features** while refactoring for V2. The police system is live and critical.

## 🔗 Related Docs
- [Project Blueprint](../../projects/00-CORE-intelink/)
- [System Map](../SYSTEM_MAP.md)
