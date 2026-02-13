/**
 * @egos-lab/shared — Shared utilities for all egos-lab apps
 * 
 * Exports:
 * - AI client (Gemini via OpenRouter)
 * - Rate limiter
 * - Common types
 */

export { analyzeWithAI, type AIAnalysisResult } from './ai-client';
export { RateLimiter } from './rate-limiter';
export type { OpportunityPattern, OpportunityMatch, GazetteItem, AnalysisResult } from './types';
