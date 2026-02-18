/**
 * INTELINK Unified Entity Dossiê API
 * 
 * Generates a unified cross-entity analysis report that identifies
 * connections, patterns, and relationships between multiple entities.
 * 
 * @endpoint POST /api/reports/entity/unified
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

const supabase = getSupabaseAdmin();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

interface UnifiedReportRequest {
    entity_ids: string[];
    individual_reports: { name: string; report: string }[];
}

const UNIFIED_ANALYSIS_PROMPT = `Você é um Analista de Inteligência Criminal SÊNIOR especializado em ANÁLISE DE VÍNCULOS e CRUZAMENTO DE DADOS.

## MISSÃO
Você recebeu DOSSIÊS INDIVIDUAIS de múltiplas entidades (pessoas, veículos, locais). Sua tarefa é:

1. **IDENTIFICAR VÍNCULOS** entre as entidades
   - Conexões familiares, comerciais, criminais
   - Coincidências de local, data, telefone, veículo
   - Padrões de comportamento similares

2. **DETECTAR PADRÕES** 
   - Modus operandi comum
   - Hierarquia criminal (quem lidera quem)
   - Rede de apoio/logística

3. **CRUZAR INFORMAÇÕES**
   - Mesmos locais frequentados
   - Veículos compartilhados
   - Telefones em comum
   - Aparições nas mesmas operações

4. **GERAR INSIGHTS INVESTIGATIVOS**
   - Hipóteses de conexão
   - Linhas de investigação prioritárias
   - Alvos-chave da rede

## FORMATO DE SAÍDA

Gere um relatório profissional com as seguintes seções:

═══════════════════════════════════════════════════════════════════
                    DOSSIÊ INTEGRADO
                    ANÁLISE CROSS-ENTITY
                    INTELINK SYSTEM
═══════════════════════════════════════════════════════════════════

📅 Gerado em: [DATA]
📊 Entidades Analisadas: [N] alvos

───────────────────────────────────────────────────────────────────
                    1. RESUMO EXECUTIVO
───────────────────────────────────────────────────────────────────

[Parágrafo conciso resumindo as principais descobertas]

───────────────────────────────────────────────────────────────────
                    2. MAPA DE VÍNCULOS
───────────────────────────────────────────────────────────────────

[Para cada par de entidades com vínculo identificado:]
• [ENTIDADE A] ←→ [ENTIDADE B]
  Tipo: [Familiar/Comercial/Criminal/Geográfico]
  Evidência: [Como foi identificado]
  Força do vínculo: [Alta/Média/Baixa]

───────────────────────────────────────────────────────────────────
                    3. PADRÕES DETECTADOS
───────────────────────────────────────────────────────────────────

[Lista de padrões identificados:]
• [PADRÃO 1]: Descrição
  Entidades envolvidas: [Lista]
  
───────────────────────────────────────────────────────────────────
                    4. HIERARQUIA DA REDE
───────────────────────────────────────────────────────────────────

[Se identificada estrutura hierárquica:]
🔺 LÍDER(ES): [Nome(s)]
├── BRAÇO DIREITO: [Nome(s)]
├── EXECUTORES: [Nome(s)]
└── APOIO/LOGÍSTICA: [Nome(s)]

───────────────────────────────────────────────────────────────────
                    5. COINCIDÊNCIAS CRÍTICAS
───────────────────────────────────────────────────────────────────

[Locais, datas, eventos em comum:]
• [Coincidência 1]
• [Coincidência 2]

───────────────────────────────────────────────────────────────────
                    6. LINHAS DE INVESTIGAÇÃO
───────────────────────────────────────────────────────────────────

[Recomendações para aprofundar:]
1. [Linha prioritária 1]
2. [Linha prioritária 2]

───────────────────────────────────────────────────────────────────
                    ⚠️ ALERTAS E WARNINGS
───────────────────────────────────────────────────────────────────

[Pontos de atenção, riscos, informações incompletas:]
• [Alerta 1]

═══════════════════════════════════════════════════════════════════
        DOCUMENTO GERADO AUTOMATICAMENTE PELO INTELINK
         CLASSIFICAÇÃO: CONFIDENCIAL / INTELIGÊNCIA
═══════════════════════════════════════════════════════════════════

REGRAS:
- Seja OBJETIVO e FACTUAL
- Identifique APENAS vínculos com evidência nos dossiês
- Diferencie FATOS de HIPÓTESES
- Use linguagem profissional de inteligência policial`;

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body: UnifiedReportRequest = await req.json();
        const { entity_ids, individual_reports } = body;

        if (!entity_ids || entity_ids.length < 2) {
            return errorResponse('Mínimo 2 entidades necessárias para análise integrada', 400);
        }

        if (!individual_reports || individual_reports.length < 2) {
            return errorResponse('Dossiês individuais necessários para análise', 400);
        }

        if (!OPENROUTER_API_KEY) {
            return errorResponse('API key não configurada', 500);
        }

        // Fetch relationships between entities
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select(`
                type, description,
                source:source_entity_id(id, name, type),
                target:target_entity_id(id, name, type)
            `)
            .or(entity_ids.map(id => `source_entity_id.eq.${id}`).join(','))
            .or(entity_ids.map(id => `target_entity_id.eq.${id}`).join(','));

        // Check for cross-case appearances
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, investigation_id, investigation:intelink_investigations(id, title)')
            .in('id', entity_ids);

        // Build context for AI
        const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const entityNames = individual_reports.map(r => r.name).join(', ');
        
        const dossieSummaries = individual_reports.map(r => 
            `=== DOSSIÊ: ${r.name} ===\n${r.report}`
        ).join('\n\n');

        const relationshipContext = relationships?.length 
            ? `\n\n=== RELACIONAMENTOS EXISTENTES NO BANCO ===\n${relationships.map(r => {
                const source = (r.source as any)?.name || 'Desconhecido';
                const target = (r.target as any)?.name || 'Desconhecido';
                return `${source} --[${r.type}]--> ${target}: ${r.description || ''}`;
            }).join('\n')}`
            : '';

        const investigationContext = entities?.length
            ? `\n\n=== OPERAÇÕES RELACIONADAS ===\n${entities.map(e => 
                `${e.name}: ${(e.investigation as any)?.title || 'Sem operação'}`
            ).join('\n')}`
            : '';

        // Call LLM for unified analysis
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
                'X-Title': 'Intelink Unified Dossie'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: UNIFIED_ANALYSIS_PROMPT },
                    { 
                        role: 'user', 
                        content: `Analise os seguintes ${individual_reports.length} dossiês e gere um relatório unificado de análise de vínculos:

Data/Hora: ${now}
Entidades: ${entityNames}

${dossieSummaries}
${relationshipContext}
${investigationContext}

Gere o DOSSIÊ INTEGRADO completo no formato especificado.`
                    }
                ],
                max_tokens: 8000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Unified Dossie API] LLM error:', errorText);
            return errorResponse('Erro ao gerar análise integrada', 502);
        }

        const data = await response.json();
        const report = data.choices?.[0]?.message?.content || '';

        if (!report) {
            return errorResponse('Resposta vazia da IA', 500);
        }

        return successResponse({ 
            report,
            entity_count: entity_ids.length,
            entities: individual_reports.map(r => r.name)
        });

    } catch (e: any) {
        console.error('[Unified Dossie API] Error:', e);
        return errorResponse(e.message || 'Erro ao gerar relatório integrado', 500);
    }
}

export const POST = withSecurity(handlePost);
