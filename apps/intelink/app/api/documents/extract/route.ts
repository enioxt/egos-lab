/**
 * POST /api/documents/extract
 * 
 * Extrai entidades de um documento usando LLM (Gemini 2.5 Flash)
 * Schema baseado no i2 Analyst's Notebook
 * 
 * @see lib/prompts/documents/extraction.ts for centralized prompts
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    generateTraceId, 
    generateDocumentHash, 
    startIngestion, 
    completeIngestion 
} from '@/lib/telemetry/ingestion-telemetry';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { getExtractionPrompt, EXTRACTION_PROMPTS } from '@/lib/prompts/documents/extraction';

// Tipos
interface ExtractionRequest {
    text: string;
    document_type?: 'reds' | 'cs' | 'relatorio' | 'depoimento' | 'livre' | 'comunicacao';
    investigation_id?: string;
}

interface Entity {
    type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'PHONE' | 'ORGANIZATION' | 'FIREARM';
    name: string;
    role: string;
    confidence: number;
    metadata: Record<string, unknown>;
}

interface Evidence {
    type: 'DRUG' | 'DEVICE' | 'MONEY' | 'DOCUMENT';
    description: string;
    quantity: string;
    details: Record<string, unknown>;
}

interface ExtractionResult {
    document_type: string;
    numero_ocorrencia: string;
    data_fato: string;
    natureza: string;
    summary: string;
    historico_completo: string;
    entities: Entity[];
    evidences: Evidence[];
    relationships: Array<{
        source: string;
        target: string;
        type: string;
        description: string;
    }>;
    timeline: Array<{
        datetime: string;
        description: string;
        entities_involved: string[];
    }>;
    metadata: {
        policiais: Array<{ nome: string; cargo?: string; matricula?: string }>;
        advogados: Array<{ nome: string }>;
        unidade_responsavel: string;
    };
    insights: string[];
    warnings: string[];
}

// Helper para limpar e parsear JSON do LLM
function cleanAndParseJSON(text: string): any {
    try {
        // Remove markdown code blocks
        let cleaned = text.replace(/^```json\s*|```$/g, '').trim();
        // Remove prefixo/sufixo se houver texto fora do JSON
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('JSON parse error, attempting fallback:', e);
        throw new Error('Não foi possível processar a resposta da IA como JSON válido.');
    }
}

async function handlePost(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    const traceId = generateTraceId();
    const startTime = Date.now();
    
    try {
        const body: ExtractionRequest = await request.json();
        
        if (!body.text || body.text.trim().length < 50) {
            return NextResponse.json(
                { error: 'Texto muito curto para extração. Mínimo 50 caracteres.' },
                { status: 400 }
            );
        }

        // Start telemetry tracking
        await startIngestion({
            traceId,
            source: body.document_type === 'livre' ? 'text_livre' : 'upload',
            documentType: body.document_type || 'livre',
            documentHash: generateDocumentHash(body.text),
            documentSizeBytes: Buffer.byteLength(body.text, 'utf-8'),
            investigationId: body.investigation_id,
        });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            await completeIngestion(traceId, { status: 'failed', errorMessage: 'API key não configurada' });
            return NextResponse.json(
                { error: 'OPENROUTER_API_KEY não configurada' },
                { status: 500 }
            );
        }

        // Chamar Gemini 2.5 Flash via OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
                'X-Title': 'Intelink Document Extraction'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { 
                        role: 'user', 
                        content: getExtractionPrompt(body.document_type || 'livre') + '\n\n' + body.text 
                    }
                ],
                max_tokens: 16000, // Aumentado para capturar históricos longos
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter error:', errorText);
            return NextResponse.json(
                { error: 'Erro na API de extração', details: errorText },
                { status: 502 }
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const usage = data.usage || {};
        
        // Parse JSON com função robusta
        let result: ExtractionResult;
        try {
            result = cleanAndParseJSON(content);
        } catch (parseError: any) {
            console.error('JSON parse error:', parseError);
            return NextResponse.json(
                { 
                    error: 'Erro ao processar resposta do LLM: ' + parseError.message,
                    raw_content: content.substring(0, 1000)
                },
                { status: 422 }
            );
        }

        const processingTime = Date.now() - startTime;

        // Calcular custos
        const inputCost = (usage.prompt_tokens / 1_000_000) * 0.30;
        const outputCost = (usage.completion_tokens / 1_000_000) * 2.50;
        const totalCost = inputCost + outputCost;

        // Complete telemetry with success
        const entitiesCount = result.entities?.length || 0;
        await completeIngestion(traceId, { status: 'completed' }, {
            entitiesExtracted: entitiesCount,
            processingTimeMs: processingTime,
            extractionTimeMs: processingTime
        });

        return NextResponse.json({
            success: true,
            result,
            traceId, // Include trace ID for debugging
            stats: {
                processing_time_ms: processingTime,
                tokens: {
                    input: usage.prompt_tokens,
                    output: usage.completion_tokens
                },
                cost_usd: totalCost.toFixed(4),
                entities_count: entitiesCount,
                evidences_count: result.evidences?.length || 0,
                relationships_count: result.relationships?.length || 0
            }
        });

    } catch (error) {
        console.error('Extraction error:', error);
        
        // Complete telemetry with error
        await completeIngestion(traceId, { 
            status: 'failed', 
            errorMessage: String(error) 
        }, {
            processingTimeMs: Date.now() - startTime
        });
        
        return NextResponse.json(
            { error: 'Erro interno na extração', details: String(error), traceId },
            { status: 500 }
        );
    }
}

// Protected: Only member+ can extract documents
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
