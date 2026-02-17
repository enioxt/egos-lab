# EGOS Agent Platform — How To Guide

> Version 1.0 | Updated: 2026-02-17

## Quick Start

```bash
# List all registered agents
bun agent:list

# Run SSOT Auditor in dry-run mode (report only)
bun agent:run ssot_auditor --dry

# Run SSOT Auditor in execute mode (writes report to docs/agentic/reports/)
bun agent:run ssot_auditor --exec

# Validate the registry
bun agent:lint
```

## Architecture

```
agents/
├── cli.ts                  ← CLI entry point
├── runtime/
│   └── runner.ts           ← Core: registry loader, logger, runner, types
├── registry/
│   └── agents.json         ← All agent definitions (SSOT)
├── agents/
│   ├── ssot-auditor.ts     ← P0.1: SSOT violation detector
│   ├── auth-roles-checker.ts  ← P0.2: Auth consistency (planned)
│   └── e2e-smoke.ts        ← P0.3: E2E smoke tests (planned)
├── evals/                  ← Eval suites per agent (planned)
└── .logs/                  ← JSONL logs per agent (auto-created)
```

## Creating a New Agent

### 1. Register in `agents/registry/agents.json`

Add an entry to the `agents` array:

```json
{
  "id": "my_agent",
  "name": "My Agent",
  "area": "qa",
  "description": "What this agent does",
  "owner": "your_github_username",
  "risk_level": "low",
  "entrypoint": "agents/agents/my-agent.ts",
  "tools_allowed": ["filesystem:read"],
  "data_access": { "pii": false, "secrets_scan": false },
  "triggers": ["manual"],
  "memory_mode": "none",
  "eval_suite": ["evals/my_agent.json"],
  "run_modes": ["dry_run", "execute"],
  "status": "active"
}
```

### 2. Create the agent script

```typescript
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

async function myAgentLogic(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  log(ctx, 'info', 'Starting analysis...');

  // Your logic here — scan files, check patterns, call AI, etc.

  if (ctx.mode === 'execute') {
    // Only write files / apply patches in execute mode
  }

  return findings;
}

const mode = process.argv.includes('--exec') ? 'execute' as const : 'dry_run' as const;
runAgent('my_agent', mode, myAgentLogic).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
```

### 3. Test it

```bash
bun agent:run my_agent --dry
```

### 4. Validate registry

```bash
bun agent:lint
```

## Agent Requirements Checklist

Every agent MUST have:

- [ ] Registry entry in `agents.json`
- [ ] Correlation ID (auto-provided by runner)
- [ ] JSONL structured logging (auto-provided by runner)
- [ ] Dry-run mode (report without side-effects)
- [ ] Idempotency (running twice produces same result)
- [ ] No hardcoded secrets (use env vars)
- [ ] PII masking (if accessing user data)
- [ ] At least 3 eval scenarios (planned)

## Logs

Logs are written to `agents/.logs/<agent_id>.jsonl` in structured format:

```json
{"timestamp":"2026-02-17T15:00:00Z","correlation_id":"abc-123","agent_id":"ssot_auditor","mode":"dry_run","level":"info","message":"Starting..."}
```

The `.logs/` directory is gitignored. Logs are local only.

## Risk Levels

| Level | Meaning | Extra Requirements |
|-------|---------|--------------------|
| `low` | Read-only, no side effects | None |
| `medium` | Writes to docs/ or test files | Requires `--exec` flag |
| `high` | Modifies source code | Requires `--exec` + confirmation |
| `critical` | Touches auth, payments, or secrets | Requires `--exec` + manual review |

## Using AI in Agents

Import the shared AI client:

```typescript
import { analyzeWithAI } from '../../packages/shared/src/ai-client';

const result = await analyzeWithAI({
  systemPrompt: 'You are an architecture auditor...',
  userPrompt: `Analyze this code for SSOT violations:\n${code}`,
  maxTokens: 1000,
});
// result.content, result.cost_usd, result.usage
```

Requires `OPENROUTER_API_KEY` env var. Cost is tracked automatically.
