/**
 * Agent CLI — Entry point for all agent operations
 * 
 * Usage:
 *   bun agents/cli.ts list
 *   bun agents/cli.ts run <agent_id> --dry
 *   bun agents/cli.ts run <agent_id> --exec
 *   bun agents/cli.ts lint-registry
 */

import { listAgents } from './runtime/runner';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'list': {
    const agents = listAgents();
    console.log('\n📋 Registered Agents:\n');
    console.log('  ID                     | Area           | Status      | Modes');
    console.log('  ' + '─'.repeat(80));
    for (const a of agents) {
      const id = a.id.padEnd(23);
      const area = a.area.padEnd(15);
      const status = a.status.padEnd(12);
      const modes = a.run_modes.join(', ');
      console.log(`  ${id}| ${area}| ${status}| ${modes}`);
    }
    console.log(`\n  Total: ${agents.length} agents\n`);
    break;
  }

  case 'run': {
    const agentId = args[1];
    if (!agentId) {
      console.error('Usage: bun agents/cli.ts run <agent_id> [--dry|--exec]');
      process.exit(1);
    }
    const mode = args.includes('--exec') ? '--exec' : '--dry';
    // Delegate to the agent's own entrypoint
    const agent = listAgents().find(a => a.id === agentId);
    if (!agent) {
      console.error(`Agent "${agentId}" not found. Run "bun agents/cli.ts list" to see available agents.`);
      process.exit(1);
    }
    console.log(`\n🚀 Delegating to: bun ${agent.entrypoint} ${mode}\n`);
    const { spawnSync } = await import('child_process');
    const result = spawnSync('bun', [agent.entrypoint, mode], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    process.exit(result.status ?? 1);
  }

  case 'lint-registry': {
    const agents = listAgents();
    let errors = 0;
    console.log('\n🔍 Linting agent registry...\n');

    for (const a of agents) {
      // Check required fields
      if (!a.id || !a.name || !a.area || !a.entrypoint) {
        console.error(`  ❌ Agent missing required fields: ${JSON.stringify(a)}`);
        errors++;
      }
      // Check risk level
      if (!['low', 'medium', 'high', 'critical'].includes(a.risk_level)) {
        console.error(`  ❌ Agent "${a.id}" has invalid risk_level: ${a.risk_level}`);
        errors++;
      }
      // Check run modes
      if (!a.run_modes || a.run_modes.length === 0) {
        console.error(`  ❌ Agent "${a.id}" has no run_modes defined`);
        errors++;
      }
      // Check for duplicate IDs
      const dupes = agents.filter(x => x.id === a.id);
      if (dupes.length > 1) {
        console.error(`  ❌ Duplicate agent ID: "${a.id}"`);
        errors++;
      }
    }

    if (errors === 0) {
      console.log(`  ✅ Registry valid. ${agents.length} agents, 0 errors.\n`);
    } else {
      console.error(`  ❌ ${errors} error(s) found.\n`);
      process.exit(1);
    }
    break;
  }

  default:
    console.log(`
EGOS Agent Platform CLI

Commands:
  list              List all registered agents
  run <id> --dry    Run agent in dry-run mode (report only)
  run <id> --exec   Run agent in execute mode (apply changes)
  lint-registry     Validate the agent registry
`);
}
