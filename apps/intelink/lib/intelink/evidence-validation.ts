/**
 * Evidence Validation Service
 * 
 * Validates evidence submitted during voting on merge suggestions.
 * Uses AI to extract and verify information against external systems.
 * 
 * Future integrations:
 * - Infoseg (SINESP): CPF, RG, CNH nacional
 * - SIP (MG): Detran, veículos, CNH estadual
 * - REDS (MG): Ocorrências policiais
 * - PCNET: Inquéritos e procedimentos
 */

import { getSupabaseAdmin } from '@/lib/api-utils';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseURL: "https://openrouter.ai/api/v1"
});

// External system types (for future integrations)
export type ExternalSystem = 'infoseg' | 'sip' | 'reds' | 'pcnet';

export interface ExternalSystemConfig {
    name: string;
    description: string;
    dataTypes: string[];
    status: 'available' | 'coming_soon' | 'maintenance';
}

export const EXTERNAL_SYSTEMS: Record<ExternalSystem, ExternalSystemConfig> = {
    infoseg: {
        name: 'Infoseg (SINESP)',
        description: 'Sistema Nacional de Informações de Segurança Pública',
        dataTypes: ['CPF', 'RG', 'CNH', 'Mandados', 'Antecedentes'],
        status: 'coming_soon'
    },
    sip: {
        name: 'SIP/MG',
        description: 'Sistema Integrado de Polícia - Minas Gerais',
        dataTypes: ['Detran', 'Veículos', 'CNH estadual', 'Multas'],
        status: 'coming_soon'
    },
    reds: {
        name: 'REDS',
        description: 'Registro de Eventos de Defesa Social',
        dataTypes: ['Ocorrências', 'Boletins', 'Viaturas', 'Agentes'],
        status: 'coming_soon'
    },
    pcnet: {
        name: 'PCNET',
        description: 'Sistema da Polícia Civil de Minas Gerais',
        dataTypes: ['Inquéritos', 'IPLs', 'TCOs', 'Procedimentos'],
        status: 'coming_soon'
    }
};

export interface ValidationResult {
    isValid: boolean;
    confidence: number;
    extractedData: Record<string, any>;
    suggestions: string[];
    errors: string[];
    externalMatches?: Array<{
        system: ExternalSystem;
        match: boolean;
        data?: Record<string, any>;
    }>;
}

export interface EvidenceData {
    type: 'text' | 'file';
    content: string;
    fileName?: string;
    mimeType?: string;
}

/**
 * Validate evidence using AI
 * 
 * Process:
 * 1. Extract structured data from evidence (AI)
 * 2. Identify entities mentioned (CPFs, names, plates)
 * 3. Cross-reference with existing data
 * 4. (Future) Validate against external systems
 */
export async function validateEvidence(
    evidence: EvidenceData,
    context: {
        suggestionId: string;
        entityAName: string;
        entityBName: string;
        matchType: string;
    }
): Promise<ValidationResult> {
    const supabase = getSupabaseAdmin();
    
    const result: ValidationResult = {
        isValid: true,
        confidence: 0.5,
        extractedData: {},
        suggestions: [],
        errors: []
    };
    
    try {
        // 1. Extract data from evidence using AI
        const extractionPrompt = `Analise a seguinte evidência e extraia informações estruturadas.

CONTEXTO:
- Sugestão de vínculo entre: ${context.entityAName} e ${context.entityBName}
- Tipo de match: ${context.matchType}

EVIDÊNCIA (${evidence.type}):
${evidence.type === 'text' ? evidence.content : `[Arquivo: ${evidence.fileName}]`}

Extraia:
1. CPFs mencionados
2. Nomes completos
3. Placas de veículos
4. Endereços
5. Telefones
6. Datas relevantes
7. Fatos que confirmam ou negam o vínculo

Responda em JSON:
{
  "cpfs": ["000.000.000-00"],
  "names": ["NOME COMPLETO"],
  "plates": ["ABC1234"],
  "addresses": ["Endereço completo"],
  "phones": ["(00) 00000-0000"],
  "dates": ["YYYY-MM-DD"],
  "confirmsLink": true/false,
  "reasoning": "Explicação breve",
  "confidence": 0.0-1.0
}`;

        const response = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: extractionPrompt }],
            response_format: { type: 'json_object' },
            max_tokens: 1000
        });

        const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');
        result.extractedData = extracted;
        result.confidence = extracted.confidence || 0.5;
        
        // 2. Cross-reference with existing entities
        if (extracted.cpfs?.length > 0) {
            const { data: existingEntities } = await supabase
                .from('intelink_entities')
                .select('id, name, metadata')
                .in('metadata->>cpf', extracted.cpfs);
            
            if (existingEntities && existingEntities.length > 0) {
                result.suggestions.push(
                    `Encontrados ${existingEntities.length} registros com CPFs mencionados na evidência`
                );
            }
        }
        
        // 3. Validate reasoning
        if (!extracted.confirmsLink && !extracted.reasoning) {
            result.errors.push('Evidência não contém informações que confirmem ou neguem o vínculo');
            result.isValid = false;
        }
        
        // 4. Future: External system validation
        result.externalMatches = Object.keys(EXTERNAL_SYSTEMS).map(sys => ({
            system: sys as ExternalSystem,
            match: false,
            data: undefined // Will be populated when integrations are ready
        }));
        
        // Add suggestion for future integrations
        if (extracted.cpfs?.length > 0) {
            result.suggestions.push(
                '💡 Integração com Infoseg permitirá validar CPFs automaticamente'
            );
        }
        
        return result;
        
    } catch (error) {
        console.error('[EvidenceValidation] Error:', error);
        result.errors.push('Erro ao processar evidência');
        result.isValid = false;
        return result;
    }
}

/**
 * Store validation result
 */
export async function storeValidationResult(
    voteId: string,
    result: ValidationResult
): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    await supabase
        .from('intelink_merge_votes')
        .update({
            additional_info: {
                validation: {
                    isValid: result.isValid,
                    confidence: result.confidence,
                    extractedData: result.extractedData,
                    suggestions: result.suggestions,
                    errors: result.errors,
                    validatedAt: new Date().toISOString()
                }
            }
        })
        .eq('id', voteId);
}

/**
 * Check if external system is available
 */
export function isSystemAvailable(system: ExternalSystem): boolean {
    return EXTERNAL_SYSTEMS[system]?.status === 'available';
}

/**
 * Future: Query Infoseg
 * Placeholder for when credentials are available
 */
export async function queryInfoseg(cpf: string): Promise<any> {
    // TODO: Implement when Infoseg integration is ready
    // This will require:
    // - INFOSEG_USERNAME
    // - INFOSEG_PASSWORD
    // - VPN/Proxy configuration for internal network access
    
    console.log('[Infoseg] Integration not yet available. CPF:', cpf);
    return null;
}

/**
 * Future: Query SIP/MG
 */
export async function querySIP(plate: string): Promise<any> {
    // TODO: Implement when SIP integration is ready
    console.log('[SIP] Integration not yet available. Plate:', plate);
    return null;
}

/**
 * Future: Query REDS
 */
export async function queryREDS(occurrence: string): Promise<any> {
    // TODO: Implement when REDS integration is ready
    console.log('[REDS] Integration not yet available. Occurrence:', occurrence);
    return null;
}
