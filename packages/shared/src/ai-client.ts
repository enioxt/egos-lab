/**
 * AI Client — Gemini 2.0 Flash via OpenRouter
 * 
 * Cost: ~$0.10/100K input tokens, ~$0.40/100K output tokens
 * Model: google/gemini-2.0-flash-001
 */

import type { AIAnalysisResult } from './types';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

// Pricing per 1M tokens (USD)
const PRICING = {
    'google/gemini-2.0-flash-001': { input: 0.10, output: 0.40 },
} as const;

export async function analyzeWithAI(params: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
}): Promise<AIAnalysisResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not set. Get one at https://openrouter.ai/keys');
    }

    const model = params.model ?? DEFAULT_MODEL;

    const response = await fetch(OPENROUTER_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://egos-lab.dev',
            'X-Title': 'egos-lab',
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt },
            ],
            max_tokens: params.maxTokens ?? 2000,
            temperature: params.temperature ?? 0.3,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const usage = data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    const pricing = PRICING[model as keyof typeof PRICING] ?? { input: 0.10, output: 0.40 };
    const costUsd = (usage.prompt_tokens * pricing.input + usage.completion_tokens * pricing.output) / 1_000_000;

    return {
        content: data.choices[0]?.message?.content ?? '',
        model,
        usage,
        cost_usd: costUsd,
    };
}
