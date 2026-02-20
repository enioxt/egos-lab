/**
 * Domain Explorer Agent — Agnostic Domain-to-Primitives Mapper
 * 
 * Inspired by Descript's architecture (Andrew Mason):
 * - Take any complex domain (video editing, transit dispatch, trademark registration)
 * - Extract core primitives (the fundamental operations)
 * - Identify underlying open-source tools that already solve these problems
 * - Design structured data models (SSOT) to manage state
 * - Suggest MVP features based on primitive composition
 * 
 * The key insight from Descript: they didn't reinvent FFmpeg — they built
 * a transcript-as-SSOT layer on top of it. Every domain has this pattern:
 * complex tool underneath → structured abstraction on top → simple UI.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { runAgent, printResult, log, type RunContext, type Finding } from '../runtime/runner';
import { analyzeWithAI } from '../../packages/shared/src/ai-client';

// ─── Types ────────────────────────────────────────────────────

interface DomainTaxonomy {
  domain: string;
  ssot_abstraction: string;
  core_primitives: Array<{
    name: string;
    description: string;
    underlying_tool: string;
    complexity: 'low' | 'medium' | 'high';
  }>;
  underlying_tools: Array<{
    name: string;
    url: string;
    role: string;
    maturity: 'stable' | 'growing' | 'experimental';
  }>;
  data_models: Array<{
    entity: string;
    fields: string[];
    relationships: string[];
  }>;
  suggested_mvp: Array<{
    feature: string;
    primitives_used: string[];
    effort: 'small' | 'medium' | 'large';
  }>;
  descript_parallel: string;
}

// ─── Prompts ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Domain Architect — an expert at decomposing complex real-world domains into structured software primitives.

Your methodology follows the "Descript Pattern":
1. IDENTIFY the domain's core operations (primitives)
2. MAP each primitive to an existing open-source tool that already solves it
3. DESIGN a SSOT abstraction layer (like Descript's transcript-over-FFmpeg)
4. COMPOSE primitives into MVP features

Key principle: NEVER reinvent the roda. If an open-source tool with 10K+ stars already does it, USE IT.
Every complex domain reduces to: [Powerful CLI/Library] + [Structured Database] + [Clean UI].

Return ONLY valid JSON matching the requested schema. No markdown, no explanation outside JSON.`;

function buildUserPrompt(domain: string, context?: string): string {
  return `Analyze this domain and extract its complete taxonomy:

DOMAIN: "${domain}"
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Return a JSON object with this EXACT structure:
{
  "domain": "canonical name",
  "ssot_abstraction": "What is the single source of truth for this domain? (like transcript for video editing)",
  "core_primitives": [
    {
      "name": "primitive_name",
      "description": "what this primitive does",
      "underlying_tool": "open-source tool that does this (e.g. FFmpeg, Tesseract, Puppeteer)",
      "complexity": "low|medium|high"
    }
  ],
  "underlying_tools": [
    {
      "name": "tool_name",
      "url": "github or docs URL",
      "role": "what role this tool plays",
      "maturity": "stable|growing|experimental"
    }
  ],
  "data_models": [
    {
      "entity": "EntityName",
      "fields": ["id", "field1", "field2"],
      "relationships": ["belongs_to Entity", "has_many Entity"]
    }
  ],
  "suggested_mvp": [
    {
      "feature": "Feature description",
      "primitives_used": ["primitive1", "primitive2"],
      "effort": "small|medium|large"
    }
  ],
  "descript_parallel": "How this domain maps to Descript's pattern (tool underneath + abstraction + UI)"
}

Include at least 5 core primitives, 3 tools, 4 data models, and 3 MVP features.`;
}

// ─── Dry-Run Mock ─────────────────────────────────────────────

const DRY_RUN_TAXONOMY: DomainTaxonomy = {
  domain: 'Video Editing',
  ssot_abstraction: 'Transcript — editing text edits the video (Descript\'s core insight)',
  core_primitives: [
    { name: 'trim', description: 'Cut video at start/end points', underlying_tool: 'FFmpeg -ss -to', complexity: 'low' },
    { name: 'transcribe', description: 'Speech-to-text from audio track', underlying_tool: 'Whisper', complexity: 'medium' },
    { name: 'remove_filler', description: 'Detect and remove um/uh/like', underlying_tool: 'Whisper + regex', complexity: 'medium' },
    { name: 'overdub', description: 'Synthesize speaker voice for new text', underlying_tool: 'Custom TTS model', complexity: 'high' },
    { name: 'denoise', description: 'Remove background noise', underlying_tool: 'RNNoise / FFmpeg anlmdn', complexity: 'medium' },
  ],
  underlying_tools: [
    { name: 'FFmpeg', url: 'https://ffmpeg.org', role: 'Core media processing engine', maturity: 'stable' },
    { name: 'Whisper', url: 'https://github.com/openai/whisper', role: 'Speech-to-text transcription', maturity: 'stable' },
    { name: 'ffmpeg.wasm', url: 'https://github.com/ffmpegwasm/ffmpeg.wasm', role: 'Browser-side media processing', maturity: 'growing' },
  ],
  data_models: [
    { entity: 'Project', fields: ['id', 'name', 'created_at', 'owner_id', 'status'], relationships: ['has_many Asset', 'has_one Transcript'] },
    { entity: 'Asset', fields: ['id', 'project_id', 'type', 'url', 'duration_ms'], relationships: ['belongs_to Project'] },
    { entity: 'Transcript', fields: ['id', 'project_id', 'words', 'speakers', 'confidence'], relationships: ['belongs_to Project', 'has_many Edit'] },
    { entity: 'Edit', fields: ['id', 'transcript_id', 'type', 'start_ms', 'end_ms', 'payload'], relationships: ['belongs_to Transcript'] },
  ],
  suggested_mvp: [
    { feature: 'Upload video → auto-transcribe → edit text to trim', primitives_used: ['transcribe', 'trim'], effort: 'medium' },
    { feature: 'One-click filler word removal', primitives_used: ['transcribe', 'remove_filler', 'trim'], effort: 'medium' },
    { feature: 'Background noise cleanup', primitives_used: ['denoise'], effort: 'small' },
  ],
  descript_parallel: 'Descript = FFmpeg + Whisper + Transcript-as-SSOT + Document-style UI. Every edit to the transcript generates FFmpeg commands under the hood.',
};

// ─── Agent Handler ────────────────────────────────────────────

async function domainExplore(ctx: RunContext): Promise<Finding[]> {
  const findings: Finding[] = [];
  const domain = process.argv.find((_, i) => process.argv[i - 1] === '--domain') || 'Video Editing';

  log(ctx, 'info', `Domain Explorer: analyzing "${domain}"`);

  let taxonomy: DomainTaxonomy;

  if (ctx.mode === 'dry_run') {
    log(ctx, 'info', 'Dry-run mode — using mock taxonomy (Video Editing)');
    taxonomy = DRY_RUN_TAXONOMY;
  } else {
    log(ctx, 'info', 'Execute mode — calling AI for domain analysis...');
    try {
      const result = await analyzeWithAI({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(domain),
        maxTokens: 3000,
        temperature: 0.2,
      });
      log(ctx, 'info', `AI response received (cost: $${result.cost_usd.toFixed(4)})`);

      const parsed = JSON.parse(result.content);
      taxonomy = parsed as DomainTaxonomy;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(ctx, 'error', `AI analysis failed: ${msg}`);
      findings.push({
        severity: 'error',
        category: 'domain:ai_failure',
        message: `Failed to analyze domain "${domain}": ${msg}`,
        suggestion: 'Check OPENROUTER_API_KEY is set and valid',
      });
      return findings;
    }
  }

  // Generate findings from taxonomy
  findings.push({
    severity: 'info',
    category: 'domain:ssot',
    message: `SSOT Abstraction: ${taxonomy.ssot_abstraction}`,
    suggestion: 'This is the core insight — build your product around this abstraction',
  });

  findings.push({
    severity: 'info',
    category: 'domain:descript_parallel',
    message: `Descript Pattern: ${taxonomy.descript_parallel}`,
  });

  for (const p of taxonomy.core_primitives) {
    findings.push({
      severity: p.complexity === 'high' ? 'warning' : 'info',
      category: `domain:primitive`,
      message: `Primitive "${p.name}" → ${p.underlying_tool} [${p.complexity}]`,
      suggestion: p.description,
    });
  }

  for (const t of taxonomy.underlying_tools) {
    findings.push({
      severity: 'info',
      category: 'domain:tool',
      message: `Tool: ${t.name} (${t.maturity}) — ${t.role}`,
      suggestion: t.url,
    });
  }

  for (const m of taxonomy.data_models) {
    findings.push({
      severity: 'info',
      category: 'domain:model',
      message: `Entity "${m.entity}": ${m.fields.join(', ')}`,
      suggestion: m.relationships.join(', '),
    });
  }

  for (const f of taxonomy.suggested_mvp) {
    findings.push({
      severity: 'info',
      category: 'domain:mvp',
      message: `MVP: ${f.feature} [${f.effort}]`,
      suggestion: `Uses: ${f.primitives_used.join(' + ')}`,
    });
  }

  // Write output file in execute mode
  if (ctx.mode === 'execute') {
    const outDir = join(ctx.repoRoot, 'docs', 'domains');
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    const slug = taxonomy.domain.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const outPath = join(outDir, `${slug}.json`);
    writeFileSync(outPath, JSON.stringify(taxonomy, null, 2));
    log(ctx, 'info', `Taxonomy written to docs/domains/${slug}.json`);

    // Also write a readable markdown summary
    const md = generateMarkdown(taxonomy, ctx);
    writeFileSync(join(outDir, `${slug}.md`), md);
    log(ctx, 'info', `Summary written to docs/domains/${slug}.md`);
  }

  return findings;
}

// ─── Markdown Report ──────────────────────────────────────────

function generateMarkdown(t: DomainTaxonomy, ctx: RunContext): string {
  const lines = [
    `# Domain Taxonomy: ${t.domain}`,
    ``,
    `> Generated by Domain Explorer Agent | ${ctx.startedAt}`,
    `> Correlation: \`${ctx.correlationId}\``,
    ``,
    `## SSOT Abstraction`,
    ``,
    `**${t.ssot_abstraction}**`,
    ``,
    `> _Descript parallel: ${t.descript_parallel}_`,
    ``,
    `## Core Primitives`,
    ``,
    `| Primitive | Tool | Complexity | Description |`,
    `|-----------|------|------------|-------------|`,
    ...t.core_primitives.map(p => `| ${p.name} | ${p.underlying_tool} | ${p.complexity} | ${p.description} |`),
    ``,
    `## Underlying Tools`,
    ``,
    ...t.underlying_tools.map(tool => `- **${tool.name}** (${tool.maturity}) — ${tool.role} → ${tool.url}`),
    ``,
    `## Data Models`,
    ``,
    ...t.data_models.map(m => [
      `### ${m.entity}`,
      `- **Fields:** ${m.fields.join(', ')}`,
      `- **Relations:** ${m.relationships.join(', ')}`,
      ``,
    ]).flat(),
    `## Suggested MVP`,
    ``,
    ...t.suggested_mvp.map((f, i) => `${i + 1}. **${f.feature}** [${f.effort}] — uses: ${f.primitives_used.join(' + ')}`),
    ``,
  ];
  return lines.join('\n');
}

// ─── CLI Entry ────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--exec') ? 'execute' as const : 'dry_run' as const;

runAgent('domain_explorer', mode, domainExplore).then(result => {
  printResult(result);
  process.exit(result.success ? 0 : 1);
});
