---
description: Deployment procedures for egos-web and other apps via Vercel
---

# Deploy Skill

## Architecture
| App | Framework | Deploy | URL |
|-----|-----------|--------|-----|
| egos-web | React + Vite | Vercel (auto on push) | egos.ia.br |
| eagle-eye | Bun scripts | Manual / CLI | — |
| intelink | Next.js | Vercel (separate project) | intelink.ia.br |

## Deploy Flow (egos-web)

### 1. Pre-Push Checks
```bash
# Type check (quick ~30s)
cd apps/egos-web && npx tsc -b

# Full build (mandatory before push)
npx vite build

# These run automatically via .husky/pre-push
```

### 2. Push (triggers Vercel deploy)
```bash
git push origin main
```

### 3. Verify Deploy
```bash
# Check Vercel dashboard or CLI
npx vercel inspect --scope enioxt
```

### 4. Skip Build for Docs-Only
```bash
# Commit message with [skip ci] or [docs] flag
git commit -m "docs: update README [docs]"
git push origin main --no-verify
```

## Deploy Discipline (CRITICAL)
- **Commit often, push ONCE** — batch changes per feature
- **Max 3 pushes per session** — each push = Vercel build minutes
- **Build before push** — `.husky/pre-push` runs `vite build` automatically
- **Never push docs-only without `--no-verify`** — wastes build minutes

## Environment Variables
Set in Vercel Dashboard → Settings → Environment Variables:
```
SUPABASE_URL              → server-side only
SUPABASE_SERVICE_ROLE_KEY → server-side only
OPENROUTER_API_KEY        → server-side only
VITE_SUPABASE_URL         → client-safe (VITE_ prefix)
VITE_SUPABASE_ANON_KEY    → client-safe (VITE_ prefix)
```

## Vercel Config
File: `apps/egos-web/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "ignoreCommand": "bash vercel-ignore-build.sh"
}
```

## Rollback
```bash
# List recent deployments
npx vercel ls --scope enioxt

# Promote a previous deployment
npx vercel promote <deployment-url> --scope enioxt
```

## Troubleshooting
1. **Build fails on Vercel but passes locally** → Check Node version (Vercel uses 18.x by default)
2. **`vite: command not found`** → Ensure `vite` is in dependencies (not just devDependencies) or use `npx vite build`
3. **API routes 404** → Check `vercel.json` rewrites and `api/` directory structure
