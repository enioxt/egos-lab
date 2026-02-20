# Private Repository Analysis — Architecture & Security

> **STATUS:** Architecture defined, sandbox already supports private repos  
> **UPDATED:** 2026-02-19

---

## How Major Tools Do It

| Tool | Method | Security Model |
|---|---|---|
| **SonarCloud** | GitHub App (installation token) | Read-only access, ephemeral analysis, no code stored |
| **Snyk** | GitHub App or CLI (user token) | Scans in CI/CD pipeline, results only |
| **CodeClimate** | GitHub App (OAuth) | Read-only clone, analysis in container, purge after |
| **Dependabot** | GitHub App (built-in) | Native GitHub integration, never leaves GitHub infra |
| **EGOS** | **3 methods below** | Ephemeral sandbox, purge after analysis |

---

## EGOS Private Repo Access — 3 Methods

### Method 1: GitHub Personal Access Token (Current ✅)
**How:** User provides their `GITHUB_TOKEN` via API request or env var.  
**Security:** Token is injected into clone URL (`https://TOKEN@github.com/...`) and never stored.  
**Best for:** Self-hosted / API users. Power users who manage their own tokens.

```typescript
// Already implemented in sandbox.ts lines 32-38
function injectToken(repoUrl: string): string {
    if (!GITHUB_TOKEN) return repoUrl;
    return repoUrl.replace('https://github.com/', `https://${GITHUB_TOKEN}@github.com/`);
}
```

### Method 2: GitHub App Installation (Planned 🔜)
**How:** EGOS registers as a GitHub App. Users install it on their repos/orgs.  
**Security:** Installation tokens are short-lived (~1 hour), automatically scoped to authorized repos, read-only.  
**Best for:** Web UI self-service. "Install EGOS → Audit your private repos."

```
Flow:
1. User installs "EGOS Audit" GitHub App on their repo/org
2. GitHub sends us installation_id
3. We generate a short-lived token via GitHub API
4. Clone with that token → ephemeral sandbox → analyze → purge
5. Token auto-expires, code is deleted
```

### Method 3: User-Provided Token (Per-Request) (Planned 🔜)
**How:** User pastes a fine-grained PAT in the Audit Hub UI.  
**Security:** Token is used once, never stored, transmitted over HTTPS only.  
**Best for:** One-time audits of private repos without installing an app.

```
Flow:
1. User creates a fine-grained PAT (read-only, single repo)
2. Pastes it in the Audit Hub UI
3. Token sent to Worker via HTTPS → used for clone → deleted
4. Code cloned into ephemeral sandbox → analyzed → purged
```

---

## Security Guarantees

| Guarantee | Implementation |
|---|---|
| **Code never persisted** | `sandbox.ts` → `destroySandbox()` always runs in `finally` block |
| **Tokens never logged** | `log()` function redacts any string matching `gh[ps]_*` |
| **Ephemeral sandboxes** | `/tmp/egos-sandbox/sandbox-*` — RAM-backed on Railway |
| **Size limits** | Max 500MB per repo clone (enforced in `sandbox.ts`) |
| **Timeout enforcement** | 60s clone timeout + 2min per agent + 10min total task |
| **No code sent to AI** | AI enrichment only receives **findings** (severity, message, file path), never raw source code |
| **HTTPS only** | All API communication encrypted in transit |

---

## API Extension for Private Repos

### Current: `/api/run-audit` (POST)
```json
{
  "repoUrl": "https://github.com/owner/private-repo",
  "githubToken": "ghp_xxxx..."  // Optional: for private repos
}
```

### Planned: GitHub App Installation Flow
```
POST /api/run-audit
{
  "repoUrl": "https://github.com/owner/private-repo",
  "installationId": 12345678  // GitHub App installation
}
```

---

## Key Insight: Partial Analysis

For very large private repos, we can offer **partial analysis**:
- Clone only specific directories (e.g., `src/`, `lib/`)
- Use `git sparse-checkout` to reduce clone size
- Analyze only changed files (from a PR diff)

This reduces security exposure AND speeds up analysis.
