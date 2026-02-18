/**
 * Stitch UI Designer Agent
 * 
 * Generates UI mockup descriptions using Gemini via OpenRouter.
 * Reads prompts from docs/stitch/ALL_PLATFORM_PROMPTS.md
 * Saves output to docs/stitch/mockups/
 * 
 * Modes:
 * - dry_run: Parse prompts, report what would be generated
 * - execute: Call API and save results
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.STITCH_API_KEY;
const MOCKUP_DIR = join(process.cwd(), 'docs', 'stitch', 'mockups');
const PROMPTS_FILE = join(process.cwd(), 'docs', 'stitch', 'ALL_PLATFORM_PROMPTS.md');

const SYSTEM_PROMPT = `You are an expert UI Designer for EGOS Lab, an open-source agentic platform.

VISUAL IDENTITY:
- Dark Mode Only (Slate-950 background)
- Accents: Neon Cyan (#06b6d4), Electric Purple (#8b5cf6), Emerald (#10b981)
- Style: "Palantir meets Vercel" — data-dense, sleek, modern
- Typography: Inter (UI), JetBrains Mono (Code)
- Components: rounded-xl corners, thin slate-800 borders, glassmorphism
- Layout: Bento grids, sidebars, terminal windows

OUTPUT: Describe a detailed UI mockup with exact component placement, colors, spacing, and content hierarchy. Be specific about Tailwind classes.`;

async function callOpenRouter(prompt: string): Promise<string> {
  if (!OPENROUTER_KEY) throw new Error('No API key (OPENROUTER_API_KEY or STITCH_API_KEY)');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://egos.ia.br',
      'X-Title': 'EGOS UI Designer',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No content returned';
}

async function uiDesigner(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];

  if (!OPENROUTER_KEY) {
    findings.push({ severity: 'error', category: 'config', message: 'Missing API key (OPENROUTER_API_KEY or STITCH_API_KEY)', suggestion: 'Add to .env' });
    return findings;
  }

  if (!existsSync(PROMPTS_FILE)) {
    findings.push({ severity: 'error', category: 'input', message: `Prompts file not found: ${PROMPTS_FILE}` });
    return findings;
  }

  const content = readFileSync(PROMPTS_FILE, 'utf-8');
  const sections = content.split(/^## /m).slice(1);
  log(ctx, 'info', `Found ${sections.length} prompt sections`);

  for (const section of sections) {
    const titleLine = section.split('\n')[0].trim();
    const match = section.match(/```text([\s\S]*?)```/);
    if (!match) continue;

    const promptText = match[1].trim();
    const slug = titleLine.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const outputPath = join(MOCKUP_DIR, `${slug}.md`);

    if (existsSync(outputPath)) {
      findings.push({ severity: 'info', category: 'design:skip', message: `Already exists: ${slug}`, file: outputPath });
      continue;
    }

    if (ctx.mode === 'dry_run') {
      findings.push({ severity: 'info', category: 'design:plan', message: `Would generate: "${titleLine}"`, suggestion: `${promptText.length} chars prompt` });
    } else {
      mkdirSync(MOCKUP_DIR, { recursive: true });
      log(ctx, 'info', `Generating: ${titleLine}...`);
      try {
        const result = await callOpenRouter(promptText);
        const output = `# UI Mockup: ${titleLine}\n\n> Generated: ${ctx.startedAt}\n> Agent: ${ctx.agentId} | Correlation: ${ctx.correlationId}\n\n---\n\n${result}`;
        writeFileSync(outputPath, output);
        findings.push({ severity: 'info', category: 'design:done', message: `Generated: "${titleLine}"`, file: outputPath });
      } catch (err: any) {
        findings.push({ severity: 'error', category: 'design:fail', message: `Failed "${titleLine}": ${err.message}` });
      }
    }
  }

  return findings;
}

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('ui_designer', mode, uiDesigner).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
