/**
 * 🦅 Eagle Eye — AI Gazette Analyzer
 * 
 * Pipeline: Fetch gazette → Extract text → Analyze with Gemini → Score patterns
 * Cost: ~$0.01-0.02 per gazette analysis
 */

import { analyzeWithAI, type AIAnalysisResult } from '@egos-lab/shared';
import type { OpportunityMatch, AnalysisResult, GazetteItem } from '@egos-lab/shared';
import { fetchGazettes, fetchGazetteText } from './fetch_gazettes';
import { ALL_PATTERNS, KEYWORD_PATTERNS, buildQuerystring } from './idea_patterns';

// ═══════════════════════════════════════════════════════════
// System Prompt for Gazette Analysis
// ═══════════════════════════════════════════════════════════

function buildSystemPrompt(): string {
    const patternDescriptions = ALL_PATTERNS.map(p =>
        `- ${p.id} (${p.name_pt}): ${p.ai_context} Keywords: [${p.keywords.join(', ')}]`
    ).join('\n');

    return `Você é um analista especializado em legislação brasileira. Sua tarefa é analisar textos de diários oficiais e identificar oportunidades de negócio.

PADRÕES DE OPORTUNIDADE (analise contra TODOS):
${patternDescriptions}

INSTRUÇÕES:
1. Leia o texto do diário oficial
2. Para CADA padrão relevante encontrado, atribua:
   - confidence: 0-100 (quão forte é a evidência)
   - urgency: "critical" | "high" | "medium" | "low"
   - matched_keywords: quais palavras-chave foram encontradas
   - ai_reasoning: explicação breve (1-2 frases) do porquê
   - effective_date: data de vigência (se mencionada)
   - action_deadline: prazo para ação (se mencionado)
3. Só retorne padrões com confidence >= 30
4. NÃO invente informações. Se não encontrar evidência, não inclua o padrão.

RETORNE JSON no formato:
{
  "matches": [
    {
      "pattern_id": "PROC-001",
      "pattern_name": "Licitações e Compras Públicas", 
      "confidence": 85,
      "urgency": "high",
      "matched_keywords": ["licitação", "pregão eletrônico"],
      "ai_reasoning": "Edital de pregão eletrônico nº 123/2026 para aquisição de equipamentos de TI",
      "effective_date": "2026-03-01",
      "action_deadline": "2026-02-28"
    }
  ],
  "summary": "Resumo geral em 1-2 frases do conteúdo mais relevante"
}`;
}

/**
 * Analyze a single gazette against all 17 patterns
 */
export async function analyzeGazette(gazette: GazetteItem): Promise<AnalysisResult> {
    // 1. Fetch full text
    console.log(`📖 Fetching text for ${gazette.territory_name} (${gazette.date})...`);
    const fullText = await fetchGazetteText(gazette);

    // 2. Truncate if too long (save tokens)
    const maxChars = 15_000; // ~4K tokens
    const truncatedText = fullText.length > maxChars
        ? fullText.substring(0, maxChars) + '\n\n[... texto truncado ...]'
        : fullText;

    // 3. Analyze with AI
    console.log(`🤖 Analyzing with Gemini (${truncatedText.length} chars)...`);
    const result = await analyzeWithAI({
        systemPrompt: buildSystemPrompt(),
        userPrompt: `Analise o seguinte texto do diário oficial de ${gazette.territory_name} (${gazette.date}):\n\n${truncatedText}`,
        maxTokens: 2000,
        temperature: 0.2, // Low temp for consistent analysis
    });

    // 4. Parse response
    let matches: OpportunityMatch[] = [];
    try {
        const parsed = JSON.parse(result.content);
        matches = (parsed.matches ?? []).map((m: any) => ({
            pattern_id: m.pattern_id,
            pattern_name: m.pattern_name,
            confidence: Math.min(100, m.confidence + (ALL_PATTERNS.find(p => p.id === m.pattern_id)?.confidence_boost ?? 0)),
            urgency: m.urgency,
            matched_keywords: m.matched_keywords ?? [],
            ai_reasoning: m.ai_reasoning ?? '',
            effective_date: m.effective_date,
            action_deadline: m.action_deadline,
        }));
    } catch (e) {
        console.warn('⚠️  Failed to parse AI response:', e);
    }

    return {
        gazette,
        matches,
        raw_text_length: fullText.length,
        analysis_model: result.model,
        analysis_cost_usd: result.cost_usd,
        timestamp: new Date().toISOString(),
    };
}

// ═══════════════════════════════════════════════════════════
// CLI Entry Point
// ═══════════════════════════════════════════════════════════

if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🦅 Eagle Eye — AI Gazette Analyzer');
    console.log('═══════════════════════════════════════════════════════════');

    if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ Set OPENROUTER_API_KEY environment variable');
        console.error('   Get one at: https://openrouter.ai/keys');
        process.exit(1);
    }

    try {
        // Fetch recent gazettes with Tier 1 keywords
        const querystring = buildQuerystring(KEYWORD_PATTERNS.filter(p => p.tier === 1));
        console.log(`🔍 Searching with Tier 1 keywords...`);

        const searchResult = await fetchGazettes({
            querystring,
            size: 2, // Start small for testing
            published_since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        console.log(`📋 Found ${searchResult.total_gazettes} matching gazettes`);
        console.log(`   Analyzing first ${Math.min(2, searchResult.gazettes.length)}...\n`);

        let totalCost = 0;

        for (const gazette of searchResult.gazettes.slice(0, 2)) {
            console.log(`\n${'═'.repeat(60)}`);
            const result = await analyzeGazette(gazette);
            totalCost += result.analysis_cost_usd;

            if (result.matches.length === 0) {
                console.log(`   ℹ️  No opportunities detected`);
                continue;
            }

            console.log(`   ✅ Found ${result.matches.length} opportunities:`);
            for (const match of result.matches.sort((a, b) => b.confidence - a.confidence)) {
                const urgencyEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[match.urgency] ?? '⚪';
                console.log(`   ${urgencyEmoji} [${match.confidence}%] ${match.pattern_name}`);
                console.log(`      ${match.ai_reasoning}`);
                if (match.action_deadline) {
                    console.log(`      ⏰ Deadline: ${match.action_deadline}`);
                }
            }
        }

        console.log(`\n${'═'.repeat(60)}`);
        console.log(`💰 Total analysis cost: $${totalCost.toFixed(4)}`);
        console.log('✅ Analysis complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
