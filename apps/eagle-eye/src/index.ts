/**
 * 🦅 Eagle Eye — Main Entry Point
 * 
 * Usage:
 *   bun apps/eagle-eye/src/index.ts              # Full pipeline (fetch + analyze)
 *   bun apps/eagle-eye/src/fetch_gazettes.ts     # Fetch only (API test)
 *   bun apps/eagle-eye/src/idea_patterns.ts      # View patterns
 *   bun apps/eagle-eye/src/analyze_gazette.ts    # Analyze with AI
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🦅 EAGLE EYE — Brazilian Gazette Opportunity Monitor    ║
║                                                           ║
║  API: api.queridodiario.ok.org.br                        ║
║  AI:  Gemini 2.0 Flash via OpenRouter                    ║
║  Patterns: 17 (3 strategies)                             ║
╚═══════════════════════════════════════════════════════════╝
`);

import { ALL_PATTERNS, getPatternsByTier, buildQuerystring } from './idea_patterns';

console.log('📊 Pattern Stats:');
console.log(`   Total: ${ALL_PATTERNS.length} patterns`);
console.log(`   Tier 1 (High):   ${getPatternsByTier(1).length} — Direct legislative match`);
console.log(`   Tier 2 (Medium): ${getPatternsByTier(2).length} — Indirect/niche`);
console.log(`   Tier 3 (Watch):  ${getPatternsByTier(3).length} — Monitoring`);
console.log('');

console.log('🔑 Available commands:');
console.log('   bun run eagle-eye:fetch    — Test API connection');
console.log('   bun run eagle-eye:analyze  — Run AI analysis (needs OPENROUTER_API_KEY)');
console.log('   bun run eagle-eye          — This help screen');
