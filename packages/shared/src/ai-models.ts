/**
 * AI Model Selector — Tier-based model resolution for EGOS agents
 * 
 * Supports 4 tiers: S (Enterprise), A (Professional), B (Startup), C (Free)
 * Each tier maps to specific models optimized for different use cases.
 * 
 * Usage:
 *   import { getModel, AI_TIERS } from '../packages/shared/src/ai-models';
 *   const model = getModel('code_review');  // Returns best model for the tier
 */

export type AITier = 'S' | 'A' | 'B' | 'C';

export interface ModelConfig {
    id: string;
    name: string;
    inputCostPer1M: number;   // USD per 1M input tokens
    outputCostPer1M: number;  // USD per 1M output tokens
    contextWindow: number;     // max tokens
    strengths: string[];
}

// --- Tier Definitions ---

const TIER_S: Record<string, ModelConfig> = {
    code_review: {
        id: 'anthropic/claude-4.6-opus-thinking',
        name: 'Claude 4.6 Opus Thinking',
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00,
        contextWindow: 200_000,
        strengths: ['deep reasoning', 'security analysis', 'architectural review'],
    },
    architecture: {
        id: 'google/gemini-3.1',
        name: 'Gemini 3.1',
        inputCostPer1M: 5.00,
        outputCostPer1M: 20.00,
        contextWindow: 2_000_000,
        strengths: ['large context', 'code understanding', 'long file analysis'],
    },
    adversarial: {
        id: 'anthropic/claude-4.6-opus-thinking',
        name: 'Claude 4.6 Opus Thinking',
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00,
        contextWindow: 200_000,
        strengths: ['adversarial testing', 'safety', 'prompt injection detection'],
    },
    default: {
        id: 'google/gemini-3.1',
        name: 'Gemini 3.1',
        inputCostPer1M: 5.00,
        outputCostPer1M: 20.00,
        contextWindow: 2_000_000,
        strengths: ['general purpose', 'high quality'],
    },
};

const TIER_A: Record<string, ModelConfig> = {
    code_review: {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        contextWindow: 1_000_000,
        strengths: ['fast', 'smart', 'best value'],
    },
    architecture: {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        contextWindow: 1_000_000,
        strengths: ['large context', 'fast'],
    },
    adversarial: {
        id: 'anthropic/claude-3.5-haiku',
        name: 'Claude 3.5 Haiku',
        inputCostPer1M: 0.80,
        outputCostPer1M: 4.00,
        contextWindow: 200_000,
        strengths: ['fast reasoning', 'good safety'],
    },
    default: {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        contextWindow: 1_000_000,
        strengths: ['general purpose', 'best $/quality'],
    },
};

const TIER_B: Record<string, ModelConfig> = {
    default: {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        inputCostPer1M: 0.10,
        outputCostPer1M: 0.40,
        contextWindow: 1_000_000,
        strengths: ['very cheap', 'fast', 'good enough'],
    },
};

const TIER_C: Record<string, ModelConfig> = {
    default: {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Gemini 2.0 Flash (Free)',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        contextWindow: 1_000_000,
        strengths: ['free', 'rate limited'],
    },
};

export const AI_TIERS: Record<AITier, Record<string, ModelConfig>> = {
    S: TIER_S,
    A: TIER_A,
    B: TIER_B,
    C: TIER_C,
};

// --- Public API ---

/**
 * Get the current AI tier from environment
 */
export function getCurrentTier(): AITier {
    const tier = (process.env.EGOS_AI_TIER || 'B').toUpperCase();
    if (['S', 'A', 'B', 'C'].includes(tier)) return tier as AITier;
    return 'B'; // Default to startup tier
}

/**
 * Get model config for a specific use case in the current tier
 */
export function getModel(useCase: string = 'default'): ModelConfig {
    const tier = getCurrentTier();
    const override = process.env.EGOS_MODEL_OVERRIDE;

    if (override) {
        return {
            id: override,
            name: 'Custom Override',
            inputCostPer1M: 0,
            outputCostPer1M: 0,
            contextWindow: 128_000,
            strengths: ['user-specified'],
        };
    }

    const tierModels = AI_TIERS[tier];
    return tierModels[useCase] || tierModels.default;
}

/**
 * Get the model ID string for OpenRouter API calls
 */
export function getModelId(useCase: string = 'default'): string {
    return getModel(useCase).id;
}

/**
 * Estimate cost for a request
 */
export function estimateCost(inputTokens: number, outputTokens: number, useCase: string = 'default'): number {
    const model = getModel(useCase);
    return (inputTokens / 1_000_000) * model.inputCostPer1M + (outputTokens / 1_000_000) * model.outputCostPer1M;
}

/**
 * Telemetry record for AI usage
 */
export interface AIUsageRecord {
    timestamp: string;
    model: string;
    tier: AITier;
    useCase: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    taskId?: string;
    agentId?: string;
}

/**
 * Create a telemetry record after an AI call
 */
export function createUsageRecord(
    useCase: string,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number,
    taskId?: string,
    agentId?: string,
): AIUsageRecord {
    const model = getModel(useCase);
    return {
        timestamp: new Date().toISOString(),
        model: model.id,
        tier: getCurrentTier(),
        useCase,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateCost(inputTokens, outputTokens, useCase),
        latencyMs,
        taskId,
        agentId,
    };
}
