import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, notFoundError, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { checkRateLimit, RATE_LIMITS, getClientIP, rateLimitExceeded } from '@/lib/rate-limit';

// Use OpenRouter as default (already configured)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const LLM_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

async function handlePost(
    req: NextRequest,
    auth: AuthContext
): Promise<NextResponse> {
    try {
        // Rate limit: LLM-intensive endpoint (5 req/min per user)
        const ip = getClientIP(req);
        const rateLimitKey = auth.isAuthenticated ? `report:user:${auth.memberId}` : `report:ip:${ip}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.llm_analysis);
        
        if (!rateLimitResult.success) {
            return rateLimitExceeded(rateLimitResult);
        }
        
        const supabase = getSupabaseAdmin();
        // Extract ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const investigationId = pathParts[pathParts.length - 2]; // /api/investigation/[id]/report
        const body = await req.json().catch(() => ({}));
        const reportType = body.type || 'summary'; // summary, detailed, network

        // Fetch investigation data
        const { data: investigation } = await supabase
            .from('intelink_investigations')
            .select('*')
            .eq('id', investigationId)
            .single();

        if (!investigation) {
            return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
        }

        // Fetch entities
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('*')
            .eq('investigation_id', investigationId);

        // Fetch relationships
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('*, source:source_id(name, type), target:target_id(name, type)')
            .eq('investigation_id', investigationId);

        // Build context for LLM
        const entitySummary = entities?.map(e => 
            `- ${e.name} (${e.type})${e.metadata?.role ? ` - ${e.metadata.role}` : ''}`
        ).join('\n') || 'Nenhuma entidade';

        const relationshipSummary = relationships?.map(r => {
            const src = (r.source as any)?.name || '?';
            const tgt = (r.target as any)?.name || '?';
            return `- ${src} → ${r.type} → ${tgt}`;
        }).join('\n') || 'Nenhum vínculo';

        // Count by type
        const typeCounts = entities?.reduce((acc: Record<string, number>, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        }, {}) || {};

        const systemPrompt = `Você é um analista de inteligência policial experiente. Gere um relatório profissional e objetivo sobre a operação.

Use linguagem formal, seja direto e evite especulações. Destaque:
1. Resumo executivo
2. Principais atores e seus papéis
3. Rede de conexões identificada
4. Pontos de atenção e inconsistências
5. Linhas investigativas sugeridas

Formate em Markdown com seções claras.`;

        const userPrompt = `# Operação: ${investigation.title}
Status: ${investigation.status}
Data: ${new Date().toLocaleDateString('pt-BR')}

## Entidades (${entities?.length || 0})
${Object.entries(typeCounts).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

### Lista:
${entitySummary}

## Vínculos (${relationships?.length || 0})
${relationshipSummary}

---
Gere um relatório ${reportType === 'detailed' ? 'detalhado' : 'executivo'} desta operação.`;

        // Call LLM via OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
            },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 2000,
                temperature: 0.3
            })
        });

        const completion = await response.json();
        const report = completion.choices?.[0]?.message?.content || 'Erro ao gerar relatório.';

        // Save report to database (optional - ignore errors if table doesn't exist)
        try {
            await supabase.from('intelink_reports').insert({
                investigation_id: investigationId,
                type: reportType,
                content: report,
                generated_at: new Date().toISOString(),
                metadata: {
                    entities_count: entities?.length || 0,
                    relationships_count: relationships?.length || 0,
                    model: LLM_MODEL
                }
            });
        } catch (_e) {
            // Table might not exist yet, ignore
        }

        return NextResponse.json({
            success: true,
            report,
            metadata: {
                investigation: investigation.title,
                entities: entities?.length || 0,
                relationships: relationships?.length || 0,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[Report API] Error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate report',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Protected: Only member+ can generate reports (LLM-intensive)
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
