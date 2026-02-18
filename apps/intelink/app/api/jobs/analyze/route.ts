/**
 * POST /api/jobs/analyze
 * 
 * Analisa um problema de dados com IA (Gemini 2.0 Flash via OpenRouter)
 * Retorna sugestões de como resolver o problema
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { successResponse, errorResponse } from '@/lib/api-utils';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemini-2.0-flash-001';

const JOB_TYPE_DESCRIPTIONS: Record<string, string> = {
    'typo_fix': 'Correção de erro de digitação ou formatação',
    'duplicate_merge': 'Duas entidades parecem ser a mesma pessoa/objeto',
    'address_enrich': 'Endereço incompleto que precisa de mais informações',
    'data_validation': 'Dado que precisa ser validado (CPF, telefone, etc)',
    'conflict_resolution': 'Conflito de informações entre registros',
    'cpf_duplicate': 'CPF duplicado em entidades diferentes',
    'cpf_invalid': 'CPF com dígitos verificadores inválidos',
    'phone_duplicate': 'Telefone duplicado em entidades diferentes',
    'filiation_duplicate': 'Mesma filiação com CPFs diferentes'
};

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { jobId, jobType, entityName, description, originalValue } = body;

        if (!jobType || !entityName) {
            return errorResponse('jobType e entityName são obrigatórios');
        }

        const jobDescription = JOB_TYPE_DESCRIPTIONS[jobType] || jobType;

        const prompt = `Você é um especialista em qualidade de dados policiais. Analise o seguinte problema e forneça uma sugestão CONCISA (máximo 2-3 frases) de como resolvê-lo.

PROBLEMA:
- Tipo: ${jobDescription}
- Entidade: ${entityName}
- Descrição: ${description || 'Não informada'}
- Valor Original: ${originalValue || 'Não informado'}

CONTEXTO: Este é um sistema de inteligência policial onde a qualidade dos dados é crítica. Erros podem comprometer investigações.

Forneça uma sugestão prática e direta de como o analista deve resolver este problema. Seja específico.`;

        // Chamar OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://intelink.ia.br',
                'X-Title': 'Intelink Data Quality'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Jobs Analyze] OpenRouter error:', errorText);
            return errorResponse('Erro ao consultar IA');
        }

        const data = await response.json();
        const suggestion = data.choices?.[0]?.message?.content || 'Sem sugestão disponível.';

        return successResponse({ 
            suggestion,
            jobId,
            model: MODEL
        });

    } catch (e: any) {
        console.error('[Jobs Analyze] Error:', e);
        return errorResponse(e.message || 'Erro ao analisar');
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'member' });
