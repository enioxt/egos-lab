# EGOS Applications (`apps/`)

> **"Code that runs. Value that ships."**

This directory contains the live, deployable applications of the EGOS ecosystem.
It is a Bun workspace monorepo.

## 📂 Applications

| App | Status | Stack | Description |
|-----|--------|-------|-------------|
| **`egos-web`** | 🟢 Live | React + Vite | **Mission Control**. The central dashboard for the ecosystem (egos.ia.br). |
| **`intelink`** | 🟡 Beta | Next.js | Intelligence & Telemetry visualization engine. |
| **`eagle-eye`** | 🟡 Alpha | Bun + AI | OSINT gazette monitor + Opportunity detector. |
| **`radio-philein`** | ⏸️ Paused | React | Community radio player. |

## 🚀 Development

```bash
# Install dependencies for all apps
bun install

# Run Mission Control
cd apps/egos-web
bun dev

# Run Eagle Eye analysis
cd apps/eagle-eye
bun analyze
```

## 📦 Deployment

All web apps are deployed automatically to **Vercel** on push to `main`.
- `egos-web` → egos.ia.br
- `intelink` → intelink.ia.br (planned)
