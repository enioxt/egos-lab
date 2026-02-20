/**
 * AI Enrichment Layer — Post-processes raw agent findings with AI
 * 
 * Architecture:
 *   Static Agent → raw Finding[] → AI Enricher → EnrichedFinding[]
 * 
 * The AI layer adds:
 * - Priority ranking (which findings to fix first)
 * - Fix suggestions (code patches, commands, config changes)
 * - Impact analysis (what happens if the issue is NOT fixed)
 * - False positive filtering (confidence score: is this real?)
 * - Human-readable explanation
 * 
 * Controlled by EGOS_AI_TIER:
 *   C = skip enrichment (free)
 *   B = basic enrichment (Gemini 2.0 Flash)
 *   A = smart enrichment (Gemini 2.5 Flash)
 *   S = deep analysis (Claude 4.6 Opus Thinking / Gemini 3.1)
 */

import { getModelId, getCurrentTier, estimateCost, type AITier } from '../../packages/shared/src/ai-models';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// --- Types ---

export interface RawFinding {
    severity: 'error' | 'warning' | 'info' | 'critical';
    category: string;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
}

export interface EnrichedFinding extends RawFinding {
    // AI-added fields
    priority: number;               // 1-10, higher = fix first
    fixSuggestion: string;          // Actionable fix (code, command, or config)
    impactIfIgnored: string;        // What happens if not fixed
    confidenceScore: number;        // 0-1, is this a real issue (not false positive)?
    explanation: string;            // Human-readable context
    relatedFindings?: string[];     // IDs of related findings
    aiModel: string;                // Which model analyzed this
    enrichedAt: string;             // Timestamp
}

export interface EnrichmentResult {
    agentId: string;
    originalCount: number;
    enrichedCount: number;
    aiModel: string;
    tier: AITier;
    costUsd: number;
    durationMs: number;
    findings: EnrichedFinding[];
}

// --- Core AI Call ---

async function callAI(prompt: string, useCase: string = 'audit'): Promise<string> {
    if (!OPENROUTER_API_KEY) throw new Error('No OPENROUTER_API_KEY');

    const modelId = getModelId(useCase);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 4096,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`AI API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

// --- Enrichment Prompts ---

function buildEnrichmentPrompt(agentId: string, findings: RawFinding[], repoContext?: string): string {
    const findingsJson = JSON.stringify(findings.slice(0, 30), null, 2); // Cap at 30 per batch

    return `You are an expert code auditor for the EGOS platform. Analyze these findings from the "${agentId}" agent and enrich each one.

${repoContext ? `## Repository Context\n${repoContext}\n` : ''}

## Raw Findings (JSON)
\`\`\`json
${findingsJson}
\`\`\`

## For EACH finding, provide:
1. **priority** (1-10): How urgently should this be fixed? 10 = critical security risk, 1 = cosmetic
2. **fixSuggestion**: Specific, actionable fix. Include code snippets, commands, or file paths when possible
3. **impactIfIgnored**: What happens if the developer does NOT fix this? Be specific and honest
4. **confidenceScore** (0.0-1.0): How confident are you this is a REAL issue (not a false positive)?
5. **explanation**: 1-2 sentence human-readable explanation of what's wrong and why it matters

## Rules:
- Be concise but specific — developers AND AI agents will read this
- If a finding looks like a false positive (test file, example code, intentional pattern), set confidenceScore < 0.3
- For security issues, always suggest the most secure fix, not the fastest
- Group related findings when they share a root cause

Return ONLY a JSON array of enriched findings. Each must have all 5 fields above plus the original finding fields.`;
}

// --- Main Enrichment Function ---

/**
 * Enrich raw findings with AI analysis
 * 
 * @param agentId - Which agent produced these findings
 * @param findings - Raw findings from static analysis
 * @param repoContext - Optional: repo description, tech stack, etc
 * @returns Enriched findings with fix suggestions and impact analysis
 */
export async function enrichFindings(
    agentId: string,
    findings: RawFinding[],
    repoContext?: string,
): Promise<EnrichmentResult> {
    const tier = getCurrentTier();
    const start = performance.now();

    // Tier C = skip enrichment
    if (tier === 'C' || !OPENROUTER_API_KEY) {
        return {
            agentId,
            originalCount: findings.length,
            enrichedCount: 0,
            aiModel: 'none',
            tier,
            costUsd: 0,
            durationMs: 0,
            findings: findings.map(f => ({
                ...f,
                priority: f.severity === 'critical' ? 10 : f.severity === 'error' ? 7 : f.severity === 'warning' ? 4 : 1,
                fixSuggestion: f.suggestion || 'Upgrade to a paid tier for AI-powered fix suggestions.',
                impactIfIgnored: 'Unknown — enable AI enrichment for impact analysis.',
                confidenceScore: 0.5,
                explanation: f.message,
                aiModel: 'none',
                enrichedAt: new Date().toISOString(),
            })),
        };
    }

    // Batch findings (max 30 per AI call to control cost)
    const BATCH_SIZE = 30;
    const batches: RawFinding[][] = [];
    for (let i = 0; i < findings.length; i += BATCH_SIZE) {
        batches.push(findings.slice(i, i + BATCH_SIZE));
    }

    const modelId = getModelId('audit');
    const allEnriched: EnrichedFinding[] = [];

    for (const batch of batches) {
        try {
            const prompt = buildEnrichmentPrompt(agentId, batch, repoContext);
            const response = await callAI(prompt, 'audit');

            // Parse JSON from response (handle markdown code blocks)
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed: EnrichedFinding[] = JSON.parse(jsonMatch[0]);
                allEnriched.push(...parsed.map(f => ({
                    ...f,
                    aiModel: modelId,
                    enrichedAt: new Date().toISOString(),
                })));
            }
        } catch (err: any) {
            // If AI fails, return original findings with basic enrichment
            allEnriched.push(...batch.map(f => ({
                ...f,
                priority: f.severity === 'critical' ? 10 : f.severity === 'error' ? 7 : 4,
                fixSuggestion: f.suggestion || 'AI enrichment failed for this batch.',
                impactIfIgnored: 'Could not analyze — AI error.',
                confidenceScore: 0.5,
                explanation: f.message,
                aiModel: 'error',
                enrichedAt: new Date().toISOString(),
            })));
        }
    }

    const durationMs = Math.round(performance.now() - start);
    // Rough cost estimate: ~500 tokens input per finding, ~200 tokens output
    const inputTokens = findings.length * 500;
    const outputTokens = findings.length * 200;
    const costUsd = estimateCost(inputTokens, outputTokens, 'audit');

    return {
        agentId,
        originalCount: findings.length,
        enrichedCount: allEnriched.length,
        aiModel: modelId,
        tier,
        costUsd,
        durationMs,
        findings: allEnriched,
    };
}

/**
 * Quick summary enrichment — for the overall audit report
 */
export async function enrichAuditSummary(
    repoUrl: string,
    agentResults: { agentId: string; findings: number; errors: number; warnings: number; criticals: number }[],
): Promise<string> {
    const tier = getCurrentTier();
    if (tier === 'C' || !OPENROUTER_API_KEY) return '';

    const prompt = `You are the EGOS audit system. Summarize these results for ${repoUrl} in 3-5 sentences.
Focus on: what's most urgent, what's the biggest risk, and what quick wins exist.

${JSON.stringify(agentResults, null, 2)}

Write in clear, professional language. Include specific numbers. End with a recommendation.`;

    try {
        return await callAI(prompt, 'default');
    } catch {
        return '';
    }
}
