/**
 * INTELINK Tool Definitions for Function Calling
 * 
 * Tools that the AI agent can call dynamically during conversations.
 * Based on OpenRouter/OpenAI function calling standard.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import { getSupabaseAdmin } from '@/lib/api-utils';
import { detectCriminalArticles, formatDetectionResults } from '@/lib/legal/criminal-articles';
import { assessRisk, formatRiskAssessment, RiskFactors } from '@/lib/analysis/risk-assessment';
import { suggestDiligences, formatDiligenceSuggestions, InvestigationContext } from '@/lib/analysis/diligence-suggestions';
import { validateEvidence } from '@/lib/intelink/evidence-validation';

// ============================================================================
// TOOL DEFINITIONS (for LLM)
// ============================================================================

export const INTELINK_TOOLS = [
    {
        type: "function" as const,
        function: {
            name: "search_entities",
            description: "Busca entidades (pessoas, veículos, locais, organizações) por nome ou tipo na investigação atual",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Nome ou termo para buscar"
                    },
                    entity_type: {
                        type: "string",
                        enum: ["PESSOA", "VEICULO", "LOCAL", "ORGANIZACAO", "TELEFONE", "ARMA", "DOCUMENTO", "ALL"],
                        description: "Tipo de entidade para filtrar (opcional)"
                    },
                    limit: {
                        type: "number",
                        description: "Número máximo de resultados (padrão: 10)"
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "global_search",
            description: "QUANTUM SEARCH: Busca entidades em TODAS as investigações (cross-case) com detecção de vínculos",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Termo de busca (Nome, CPF, Placa, Telefone)"
                    },
                    limit: {
                        type: "number",
                        description: "Limite de resultados (padrão: 5)"
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "validate_evidence",
            description: "Valida uma evidência (texto/documento) usando IA para extrair dados e cruzar com a base",
            parameters: {
                type: "object",
                properties: {
                    content: {
                        type: "string",
                        description: "Conteúdo do texto ou resumo do documento"
                    },
                    type: {
                        type: "string",
                        enum: ["text", "file"],
                        description: "Tipo da evidência"
                    },
                    context: {
                        type: "object",
                        description: "Contexto para validação (opcional)",
                        properties: {
                            suggestionId: { type: "string" },
                            entityAName: { type: "string" },
                            entityBName: { type: "string" },
                            matchType: { type: "string" }
                        }
                    }
                },
                required: ["content", "type"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_entity_relationships",
            description: "Obtém todos os vínculos/conexões de uma entidade específica",
            parameters: {
                type: "object",
                properties: {
                    entity_id: {
                        type: "string",
                        description: "ID da entidade (UUID)"
                    },
                    entity_name: {
                        type: "string",
                        description: "Nome da entidade (se ID não disponível)"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_rho_status",
            description: "Obtém o Índice Rho (saúde da rede) da investigação atual",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "list_investigation_summary",
            description: "Lista resumo da investigação: total de entidades, vínculos, documentos",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "find_connections",
            description: "Encontra conexões entre duas entidades na rede",
            parameters: {
                type: "object",
                properties: {
                    entity1_name: {
                        type: "string",
                        description: "Nome da primeira entidade"
                    },
                    entity2_name: {
                        type: "string",
                        description: "Nome da segunda entidade"
                    }
                },
                required: ["entity1_name", "entity2_name"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_top_connected_entities",
            description: "Lista as entidades mais conectadas (hubs) da investigação",
            parameters: {
                type: "object",
                properties: {
                    limit: {
                        type: "number",
                        description: "Número de entidades a retornar (padrão: 5)"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "detect_criminal_articles",
            description: "Detecta tipificações criminais (artigos do CP, Lei de Drogas, Maria da Penha, etc.) em um texto ou descrição de fatos",
            parameters: {
                type: "object",
                properties: {
                    text: {
                        type: "string",
                        description: "Texto descrevendo os fatos a serem analisados"
                    },
                    min_confidence: {
                        type: "number",
                        description: "Confiança mínima para incluir resultado (0.0 a 1.0, padrão: 0.3)"
                    }
                },
                required: ["text"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "assess_risk",
            description: "Avalia risco de fuga, reincidência e periculosidade de um investigado",
            parameters: {
                type: "object",
                properties: {
                    entity_name: {
                        type: "string",
                        description: "Nome do investigado"
                    },
                    factors: {
                        type: "object",
                        description: "Fatores de risco conhecidos",
                        properties: {
                            hasFixedResidence: { type: "boolean" },
                            hasStableEmployment: { type: "boolean" },
                            priorConvictions: { type: "number" },
                            gangAffiliation: { type: "boolean" },
                            weaponsInvolved: { type: "boolean" },
                            violentCrimeHistory: { type: "boolean" }
                        }
                    }
                },
                required: ["entity_name"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "suggest_diligences",
            description: "Sugere diligências investigativas com base no tipo de crime e evidências disponíveis",
            parameters: {
                type: "object",
                properties: {
                    crime_type: {
                        type: "string",
                        description: "Tipo de crime (ex: HOMICIDIO, ROUBO, TRAFICO, VIOLENCIA_DOMESTICA)"
                    },
                    context: {
                        type: "object",
                        description: "Contexto da investigação",
                        properties: {
                            hasVictimStatement: { type: "boolean" },
                            hasSuspectStatement: { type: "boolean" },
                            hasWitnesses: { type: "boolean" },
                            suspectsIdentified: { type: "boolean" },
                            vehicleInvolved: { type: "boolean" },
                            weaponInvolved: { type: "boolean" }
                        }
                    }
                },
                required: ["crime_type"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "generate_executive_summary",
            description: "Gera resumo executivo da investigação para delegado, promotor ou juiz",
            parameters: {
                type: "object",
                properties: {
                    audience: {
                        type: "string",
                        enum: ["delegado", "promotor", "juiz"],
                        description: "Destinatário do resumo"
                    }
                },
                required: []
            }
        }
    }
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

const supabase = getSupabaseAdmin();

export async function executeSearchEntities(
    investigationId: string,
    query: string,
    entityType?: string,
    limit: number = 10
): Promise<string> {
    try {
        let queryBuilder = supabase
            .from('intelink_entities')
            .select('id, name, type, metadata')
            .eq('investigation_id', investigationId)
            .ilike('name', `%${query}%`)
            .limit(limit);

        if (entityType && entityType !== 'ALL') {
            queryBuilder = queryBuilder.eq('type', entityType);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        if (!data || data.length === 0) {
            return `Nenhuma entidade encontrada com o termo "${query}"`;
        }

        const results = data.map(e => 
            `- ${e.name} (${e.type})${e.metadata?.cpf ? ` CPF: ${e.metadata.cpf}` : ''}${e.metadata?.phone ? ` Tel: ${e.metadata.phone}` : ''}`
        ).join('\n');

        return `ENTIDADES ENCONTRADAS (${data.length}):\n${results}`;
    } catch (error: any) {
        return `Erro na busca: ${error.message}`;
    }
}

export async function executeGetEntityRelationships(
    investigationId: string,
    entityId?: string,
    entityName?: string
): Promise<string> {
    try {
        // Find entity first if only name provided
        let targetEntityId = entityId;
        
        if (!targetEntityId && entityName) {
            const { data: entity } = await supabase
                .from('intelink_entities')
                .select('id, name')
                .eq('investigation_id', investigationId)
                .ilike('name', `%${entityName}%`)
                .single();
            
            if (entity) targetEntityId = entity.id;
        }

        if (!targetEntityId) {
            return `Entidade "${entityName || entityId}" não encontrada`;
        }

        // Get relationships where entity is source or target
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select(`
                type, description, strength,
                source:source_entity_id(name, type),
                target:target_entity_id(name, type)
            `)
            .eq('investigation_id', investigationId)
            .or(`source_entity_id.eq.${targetEntityId},target_entity_id.eq.${targetEntityId}`)
            .limit(20);

        if (!relationships || relationships.length === 0) {
            return `Nenhum vínculo encontrado para esta entidade`;
        }

        const results = relationships.map(r => {
            const source = (r.source as any)?.name || 'Desconhecido';
            const target = (r.target as any)?.name || 'Desconhecido';
            return `- ${source} → [${r.type}] → ${target}${r.description ? `: ${r.description}` : ''}`;
        }).join('\n');

        return `VÍNCULOS (${relationships.length}):\n${results}`;
    } catch (error: any) {
        return `Erro ao buscar vínculos: ${error.message}`;
    }
}

export async function executeGetRhoStatus(investigationId: string): Promise<string> {
    try {
        const { data } = await supabase
            .from('intelink_investigations')
            .select('title, rho_score, rho_status')
            .eq('id', investigationId)
            .single();

        if (!data) return 'Investigação não encontrada';

        const rhoPercent = data.rho_score ? (data.rho_score * 100).toFixed(1) : 'N/A';
        const statusMap: Record<string, string> = {
            'healthy': 'SAUDÁVEL - Rede bem distribuída',
            'warning': 'ATENÇÃO - Moderada centralização',
            'critical': 'CRÍTICO - Alta centralização',
            'extreme': 'EXTREMO - Risco de viés investigativo'
        };

        return `ÍNDICE RHO: ${rhoPercent}%
STATUS: ${statusMap[data.rho_status] || data.rho_status || 'Desconhecido'}
OPERAÇÃO: ${data.title}`;
    } catch (error: any) {
        return `Erro ao obter Rho: ${error.message}`;
    }
}

export async function executeListInvestigationSummary(investigationId: string): Promise<string> {
    try {
        const [invResult, entitiesResult, relsResult, docsResult] = await Promise.all([
            supabase.from('intelink_investigations').select('title, description, status').eq('id', investigationId).single(),
            supabase.from('intelink_entities').select('id', { count: 'exact' }).eq('investigation_id', investigationId),
            supabase.from('intelink_relationships').select('id', { count: 'exact' }).eq('investigation_id', investigationId),
            supabase.from('intelink_documents').select('id', { count: 'exact' }).eq('investigation_id', investigationId)
        ]);

        const inv = invResult.data;
        
        return `RESUMO DA INVESTIGAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Operação: ${inv?.title || 'N/A'}
Descrição: ${inv?.description || 'N/A'}
Status: ${inv?.status || 'Em andamento'}

MÉTRICAS:
- Entidades: ${entitiesResult.count || 0}
- Vínculos: ${relsResult.count || 0}
- Documentos: ${docsResult.count || 0}`;
    } catch (error: any) {
        return `Erro ao obter resumo: ${error.message}`;
    }
}

export async function executeGetTopConnectedEntities(
    investigationId: string,
    limit: number = 5
): Promise<string> {
    try {
        // Count connections per entity
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type')
            .eq('investigation_id', investigationId);

        if (!entities || entities.length === 0) {
            return 'Nenhuma entidade encontrada';
        }

        // Get connection counts
        const entityConnections: { id: string; name: string; type: string; connections: number }[] = [];

        for (const entity of entities.slice(0, 50)) { // Limit to first 50 for performance
            const { count } = await supabase
                .from('intelink_relationships')
                .select('id', { count: 'exact' })
                .eq('investigation_id', investigationId)
                .or(`source_entity_id.eq.${entity.id},target_entity_id.eq.${entity.id}`);

            entityConnections.push({
                ...entity,
                connections: count || 0
            });
        }

        // Sort by connections and take top N
        const top = entityConnections
            .sort((a, b) => b.connections - a.connections)
            .slice(0, limit);

        const results = top.map((e, i) => 
            `${i + 1}. ${e.name} (${e.type}) - ${e.connections} conexões`
        ).join('\n');

        return `ENTIDADES MAIS CONECTADAS (HUBS):\n${results}`;
    } catch (error: any) {
        return `Erro: ${error.message}`;
    }
}

export async function executeFindConnections(
    investigationId: string,
    entity1Name: string,
    entity2Name: string
): Promise<string> {
    try {
        // Find both entities
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name')
            .eq('investigation_id', investigationId)
            .or(`name.ilike.%${entity1Name}%,name.ilike.%${entity2Name}%`);

        if (!entities || entities.length < 2) {
            return `Não foi possível encontrar ambas as entidades: "${entity1Name}" e "${entity2Name}"`;
        }

        const entity1 = entities.find(e => e.name.toLowerCase().includes(entity1Name.toLowerCase()));
        const entity2 = entities.find(e => e.name.toLowerCase().includes(entity2Name.toLowerCase()));

        if (!entity1 || !entity2) {
            return `Entidades não encontradas`;
        }

        // Direct connection
        const { data: directRel } = await supabase
            .from('intelink_relationships')
            .select('type, description')
            .eq('investigation_id', investigationId)
            .or(`and(source_entity_id.eq.${entity1.id},target_entity_id.eq.${entity2.id}),and(source_entity_id.eq.${entity2.id},target_entity_id.eq.${entity1.id})`);

        if (directRel && directRel.length > 0) {
            return `CONEXÃO DIRETA ENCONTRADA:
${entity1.name} ↔ ${entity2.name}
Tipo: ${directRel[0].type}
${directRel[0].description ? `Descrição: ${directRel[0].description}` : ''}`;
        }

        return `Nenhuma conexão direta entre "${entity1.name}" e "${entity2.name}".
Para análise de conexões indiretas, use o Grafo Visual.`;
    } catch (error: any) {
        return `Erro: ${error.message}`;
    }
}

// ============================================================================
// TOOL EXECUTOR (Routes tool calls to implementations)
// ============================================================================

export async function executeToolCall(
    toolName: string,
    args: any,
    investigationId: string
): Promise<string> {
    switch (toolName) {
        case 'search_entities':
            return executeSearchEntities(
                investigationId,
                args.query,
                args.entity_type,
                args.limit
            );
        
        case 'global_search':
            return executeGlobalSearch(
                args.query,
                args.limit
            );
        
        case 'validate_evidence':
            return executeValidateEvidenceTool(
                args.content,
                args.type,
                args.context
            );
        
        case 'get_entity_relationships':
            return executeGetEntityRelationships(
                investigationId,
                args.entity_id,
                args.entity_name
            );
        
        case 'get_rho_status':
            return executeGetRhoStatus(investigationId);
        
        case 'list_investigation_summary':
            return executeListInvestigationSummary(investigationId);
        
        case 'get_top_connected_entities':
            return executeGetTopConnectedEntities(
                investigationId,
                args.limit
            );
        
        case 'find_connections':
            return executeFindConnections(
                investigationId,
                args.entity1_name,
                args.entity2_name
            );
        
        case 'detect_criminal_articles':
            return executeDetectCriminalArticles(
                args.text,
                args.min_confidence
            );
        
        case 'assess_risk':
            return executeAssessRisk(
                args.entity_name,
                args.factors
            );
        
        case 'suggest_diligences':
            return executeSuggestDiligences(
                args.crime_type,
                args.context
            );
        
        case 'generate_executive_summary':
            return executeGenerateSummary(
                investigationId,
                args.audience
            );
        
        default:
            return `Ferramenta desconhecida: ${toolName}`;
    }
}

// ============================================================================
// CRIMINAL ARTICLES DETECTION
// ============================================================================

export function executeDetectCriminalArticles(
    text: string,
    minConfidence: number = 0.3
): string {
    try {
        const results = detectCriminalArticles(text, minConfidence);
        
        if (results.length === 0) {
            return 'NENHUMA TIPIFICAÇÃO IDENTIFICADA\n\nO texto não contém termos que indiquem crimes específicos. Considere fornecer mais detalhes sobre os fatos.';
        }
        
        return formatDetectionResults(results);
    } catch (error: any) {
        return `Erro ao detectar artigos: ${error.message}`;
    }
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export function executeAssessRisk(
    entityName: string,
    factors: Partial<RiskFactors> = {}
): string {
    try {
        const assessment = assessRisk(entityName, 'PERSON', factors);
        return formatRiskAssessment(assessment);
    } catch (error: any) {
        return `Erro ao avaliar risco: ${error.message}`;
    }
}

// ============================================================================
// DILIGENCE SUGGESTIONS
// ============================================================================

export function executeSuggestDiligences(
    crimeType: string,
    context: Partial<InvestigationContext> = {}
): string {
    try {
        const fullContext: InvestigationContext = {
            crimeType,
            hasVictimStatement: context.hasVictimStatement ?? false,
            hasSuspectStatement: context.hasSuspectStatement ?? false,
            hasWitnesses: context.hasWitnesses ?? false,
            hasDocumentaryEvidence: context.hasDocumentaryEvidence ?? false,
            hasTechnicalEvidence: context.hasTechnicalEvidence ?? false,
            hasPhoneData: context.hasPhoneData ?? false,
            hasBankData: context.hasBankData ?? false,
            hasVideoEvidence: context.hasVideoEvidence ?? false,
            hasForensicEvidence: context.hasForensicEvidence ?? false,
            suspectsIdentified: context.suspectsIdentified ?? false,
            vehicleInvolved: context.vehicleInvolved ?? false,
            weaponInvolved: context.weaponInvolved ?? false,
            drugInvolved: context.drugInvolved ?? false
        };
        
        const suggestions = suggestDiligences(fullContext);
        return formatDiligenceSuggestions(suggestions);
    } catch (error: any) {
        return `Erro ao sugerir diligências: ${error.message}`;
    }
}

// ============================================================================
// EXECUTIVE SUMMARY
// ============================================================================

export async function executeGenerateSummary(
    investigationId: string,
    audience: 'delegado' | 'promotor' | 'juiz' = 'delegado'
): Promise<string> {
    try {
        // Fetch data via API (simpler than duplicating logic)
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/analysis/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                investigationId,
                audience,
                format: 'text'
            })
        });
        
        if (!response.ok) {
            return 'Erro ao gerar resumo executivo. Tente novamente.';
        }
        
        const data = await response.json();
        return data.formatted || 'Resumo não disponível.';
    } catch (error: any) {
        return `Erro ao gerar resumo: ${error.message}`;
    }
}

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

export async function executeGlobalSearch(
    query: string,
    limit: number = 5
): Promise<string> {
    try {
        // Reuse logic from /api/search
        // Since we are server-side, query DB directly
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, metadata,
                investigation:intelink_investigations(title)
            `)
            .or(`name.ilike.%${query}%,metadata->>cpf.ilike.%${query}%,metadata->>cnpj.ilike.%${query}%,metadata->>plate.ilike.%${query}%`)
            .limit(limit);

        if (!entities || entities.length === 0) {
            return `Nenhum resultado global encontrado para "${query}"`;
        }

        const results = entities.map(e => {
            const invTitle = (e.investigation as any)?.title || 'Desconhecida';
            const meta = e.metadata || {};
            const info = [
                meta.cpf ? `CPF: ${meta.cpf}` : null,
                meta.cnpj ? `CNPJ: ${meta.cnpj}` : null,
                meta.plate ? `Placa: ${meta.plate}` : null
            ].filter(Boolean).join(', ');

            return `- ${e.name} (${e.type}) [Op: ${invTitle}] ${info ? `| ${info}` : ''}`;
        }).join('\n');

        return `RESULTADOS DA BUSCA GLOBAL (${entities.length}):\n${results}`;
    } catch (error: any) {
        return `Erro na busca global: ${error.message}`;
    }
}

// ============================================================================
// EVIDENCE VALIDATION
// ============================================================================

export async function executeValidateEvidenceTool(
    content: string,
    type: 'text' | 'file',
    context?: any
): Promise<string> {
    try {
        const result = await validateEvidence(
            { content, type },
            context || { 
                suggestionId: 'chat-tool', 
                entityAName: 'Unknown', 
                entityBName: 'Unknown', 
                matchType: 'Manual Check' 
            }
        );

        return `RESULTADO DA VALIDAÇÃO:
Status: ${result.isValid ? '✅ VÁLIDO' : '⚠️ PROBLEMAS DETECTADOS'}
Confiança: ${(result.confidence * 100).toFixed(1)}%

DADOS EXTRAÍDOS:
${JSON.stringify(result.extractedData, null, 2)}

SUGESTÕES:
${result.suggestions.join('\n- ')}

ERROS:
${result.errors.join('\n- ')}`;
    } catch (error: any) {
        return `Erro na validação: ${error.message}`;
    }
}

export default INTELINK_TOOLS;
