---
description: How to create, test, and register new agents in the EGOS Agentic Platform
---

# Agent Development Skill

## Overview
Every agent in EGOS follows a strict pattern: registry entry → implementation → dry-run → execute.

## Step 1: Registry Entry
Add to `agents/registry/agents.json`:
```json
{
  "id": "my_agent",
  "name": "My Agent",
  "area": "qa|security|architecture|knowledge|design|observability|auth",
  "description": "One-line description",
  "owner": "enioxt",
  "risk_level": "low|medium|high|critical",
  "entrypoint": "agents/agents/my-agent.ts",
  "tools_allowed": ["filesystem:read"],
  "data_access": { "pii": false, "secrets_scan": false },
  "triggers": ["manual"],
  "memory_mode": "none|session|persistent",
  "eval_suite": ["evals/my_agent.json"],
  "run_modes": ["dry_run", "execute"],
  "status": "active"
}
```

## Step 2: Implementation
Create `agents/agents/my-agent.ts` using this template:
```typescript
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

async function myAgent(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  log(ctx, 'info', 'Starting scan...');
  
  // Your logic here — push findings
  findings.push({
    severity: 'info',       // info | warning | error | critical
    category: 'my:check',   // namespace:type
    message: 'Description of finding',
    file: 'optional/path.ts',
    line: 42,
    suggestion: 'How to fix it',
  });

  // Write report only in execute mode
  if (ctx.mode === 'execute') {
    const reportPath = join(ctx.repoRoot, 'docs/agentic/reports/my-agent.md');
    writeFileSync(reportPath, `# My Agent Report\n\n${findings.length} findings`);
  }

  return findings;
}

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('my_agent', mode, myAgent).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
```

## Step 3: Validate
```bash
bun agents/cli.ts lint-registry       # Validate registry
bun agents/agents/my-agent.ts --dry   # Test dry-run
bun agents/agents/my-agent.ts --exec  # Execute
```

## Step 4: Add CLI shortcut (optional)
In root `package.json` scripts:
```json
"agent:my-agent": "bun agents/agents/my-agent.ts --dry",
"agent:my-agent:exec": "bun agents/agents/my-agent.ts --exec"
```

## Rules
- **ZERO external deps** — agents use only Node/Bun stdlib
- **DRY-RUN FIRST** — always support `--dry` before `--exec`
- **Idempotent** — running twice produces the same result
- **JSONL logs** — auto-handled by runner (agents/.logs/)
- **Correlation ID** — auto-generated per execution
- **Max 300 lines** per agent file
