# EGOS Shared Packages (`packages/`)

> **"Share logic, not just code."**

This directory contains shared libraries and configurations used across the EGOS ecosystem applications.

## 📦 Packages

| Package | Description |
|---------|-------------|
| **`shared`** | Core utilities: AI Client (`Gemini/OpenRouter`), Rate Limiter, Result Types. |
| **`nexus-shared`** | Shared types and constants for the Nexus product line (Market, Web, Mobile). |
| **`config`** | (Planned) Shared ESLint, Prettier, and TypeScript configurations. |

## 🚀 Usage

These packages are internal workspaces. They are consumed by apps via `package.json`:

```json
{
  "dependencies": {
    "@egos/shared": "workspace:*"
  }
}
```

## 🛠️ Development

To build all packages:

```bash
bun install
```
