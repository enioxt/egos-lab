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

    return `Você é um analista sênior de licitações e inteligência de mercado. Sua missão é ler Diários Oficiais e identificar oportunidades de negócio REAIS e IMEDIATAS.

### CONTEXTO & REGRAS
1. **Objetivo**: Encontrar editais de licitação, contratações diretas, ou movimentações orçamentárias que sinalizem compra de produtos/serviços.
2. **O que IGNORAR (Exemplos Negativos)**:
   - ❌ Decretos de nomeação/exoneração de pessoas.
   - ❌ Leis de datas comemorativas ou nomes de ruas.
   - ❌ Processos seletivos para estagiários ou funcionários (RH).
   - ❌ Avisos de licitação FRACASSADA ou SUSPENSA (a menos que seja republicação).

### PADRÕES DE INTERESSE
${patternDescriptions}

### PROCESSO DE PENSAMENTO (CoT)
Para cada segmento do texto, você deve:
1. **Identificar**: Existe alguma palavra-chave dos padrões?
2. **Validar**: É uma compra/contratação futura ou aberta? (Verbos: "Torna público", "Abertura de licitação", "Aquisição de", "Contratação de").
3. **Extrair Dados**: Qual o objeto? Qual o valor? Qual o prazo?
4. **Classificar**: Qual a urgência? (Critical = prazo < 5 dias ou valor alto).

### FORMATO DE SAÍDA (JSON)
Retorne *apenas* um JSON válido.

{
  "matches": [
    {
      "pattern_id": "ID_DO_PADRAO",
      "pattern_name": "Nome do Padrão",
      "confidence": 0-100, // Seja conservador. 100% apenas se tiver certeza absoluta e prazo definido.
      "urgency": "critical" | "high" | "medium" | "low",
      "matched_keywords": ["keyword1", "keyword2"],
      "ai_reasoning": "Texto exato encontrado: '...'. Visto que o prazo é dia X, a urgência é alta.",
      "effective_date": "YYYY-MM-DD",
      "action_deadline": "YYYY-MM-DD"
    }
  ],
  "summary": "Resumo executivo do que foi encontrado no texto."
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
            published_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        console.log(`📋 Found ${searchResult.total_gazettes} matching gazettes`);

        let gazettesToAnalyze = searchResult.gazettes;

        // Fallback: If no keywords match, fetch *any* recent gazette to verify pipeline
        if (searchResult.total_gazettes === 0) {
            console.log('⚠️  No matches for keywords. Attempting broad search (last 30 days)...');
            const broadResult = await fetchGazettes({
                size: 1,
                published_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });

            if (broadResult.total_gazettes > 0) {
                console.log(`📋 Broad search found ${broadResult.total_gazettes} gazettes.`);
                gazettesToAnalyze = broadResult.gazettes;
            } else {
                console.log('⚠️  No local gazettes found. Attempting GLOBAL search (any territory)...');
                const globalResult = await fetchGazettes({
                    size: 1,
                    territory_ids: [], // Empty array = no filter = global search
                    published_since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });
                console.log(`📋 Global search found ${globalResult.total_gazettes} gazettes.`);
                gazettesToAnalyze = globalResult.gazettes;
            }
        }

        console.log(`   Analyzing first ${Math.min(2, gazettesToAnalyze.length)}...\n`);

        let totalCost = 0;

        for (const gazette of gazettesToAnalyze.slice(0, 2)) {
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
