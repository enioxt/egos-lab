# EGOS Project Blueprints (`projects/`)

> **"Ideas become plans. Plans become projects."**

This directory contains **blueprints** for future applications in the EGOS ecosystem.
Each folder represents a distinct project idea that has graduated from the "Idea Phase" but is not yet a live application in `apps/`.

## 🏗️ Structure

Projects follow a standardized naming convention: `XX-TYPE-slug`

- **XX**: ID number
- **TYPE**:
  - `S`: SaaS (Software as a Service)
  - `A`: Agent / AI Tool
  - `B`: Backend / Infrastructure
  - `C`: Consumer / Mobile App
  - `CORE`: Essential Ecosystem Component

## 📂 Current Blueprints

| ID | Name | Type | Description |
|----|------|------|-------------|
| **00** | `CORE-intelink` | System | Central nervous system (Telemetry, Orchestration). |
| **01** | `S-eagle-eye` | SaaS | OSINT gazette monitor (MVP live in `apps/eagle-eye`). |
| **06** | `A-saas-builder` | Agent | AI that scaffolds SaaS apps from blueprints. |
| **07** | `B-agent-centric` | Backend | Architecture patterns for agent-first systems. |
| **26** | `C-cortex-mobile` | Consumer | Android accessibility service (migrated from CL). |

...and 10+ more. See `docs/OPEN_SOURCE_PLAN.md` for the full list.

## 🚀 How to Start a Project

1. Pick a blueprint from this folder.
2. Read its `README.md` (if available) or the associated plan in `docs/plans/`.
3. Use `bun create` or the `saas-builder` agent to scaffold it into `apps/`.
4. Move the folder to `apps/` once it has running code.
