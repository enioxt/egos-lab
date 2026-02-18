/**
 * POST /api/intelligence/narrative-links
 * 
 * Extrai vínculos narrativos de textos policiais
 * Foca em relações subjetivas: testemunhas, suspeitos, vítimas, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    buildNarrativeLinksPrompt, 
    parseNarrativeLinksResult,
    promptConfig,
    NarrativeLinksResult
} from '@/lib/prompts/intelligence/narrative-links';

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { text, save_to_investigation } = body;
        
        if (!text || text.length < 50) {
            return NextResponse.json({ 
                error: 'Texto muito curto. Forneça pelo menos 50 caracteres.' 
            }, { status: 400 });
        }
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                error: 'API key não configurada' 
            }, { status: 500 });
        }
        
        // Build prompt
        const prompt = buildNarrativeLinksPrompt(text);
        
        console.log(`[Narrative Links] Analyzing ${text.length} chars for user ${auth.memberName}`);
        
        // Call AI
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
                'X-Title': 'Intelink Narrative Links'
            },
            body: JSON.stringify({
                model: promptConfig.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: promptConfig.maxTokens,
                temperature: promptConfig.temperature
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Narrative Links] API error:', errorText);
            return NextResponse.json({ 
                error: 'Erro na análise. Tente novamente.' 
            }, { status: 500 });
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        if (!content) {
            return NextResponse.json({ 
                error: 'Resposta vazia da IA' 
            }, { status: 500 });
        }
        
        // Parse result
        try {
            const result = parseNarrativeLinksResult(content);
            
            console.log(`[Narrative Links] Found ${result.relationships?.length || 0} relationships`);
            
            return NextResponse.json({
                success: true,
                analysis: result,
                usage: data.usage,
                model: promptConfig.model
            });
            
        } catch (parseError) {
            console.error('[Narrative Links] Parse error:', parseError, 'Content:', content);
            return NextResponse.json({ 
                error: 'Erro ao processar resposta da IA',
                raw_content: content.substring(0, 500)
            }, { status: 500 });
        }
        
    } catch (error: any) {
        console.error('[Narrative Links] Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Erro interno' 
        }, { status: 500 });
    }
}

// Protected: Only member+ can use
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
