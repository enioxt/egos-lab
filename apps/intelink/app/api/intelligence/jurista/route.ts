/**
 * POST /api/intelligence/jurista
 * 
 * Jurista IA - Análise jurídica de textos policiais
 * Identifica crimes, tipificação penal, flagrantes e artigos
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    buildJuristaPrompt, 
    parseJuristaResult,
    promptConfig,
    JuristaResult
} from '@/lib/prompts/intelligence/jurista';

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { text } = body;
        
        if (!text || text.length < 100) {
            return NextResponse.json({ 
                error: 'Texto muito curto. Forneça pelo menos 100 caracteres.' 
            }, { status: 400 });
        }
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ 
                error: 'API key não configurada' 
            }, { status: 500 });
        }
        
        // Build prompt
        const prompt = buildJuristaPrompt(text);
        
        console.log(`[Jurista IA] Analyzing ${text.length} chars for user ${auth.memberName}`);
        
        // Call AI
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
                'X-Title': 'Intelink Jurista IA'
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
            console.error('[Jurista IA] API error:', errorText);
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
            const result = parseJuristaResult(content);
            
            console.log(`[Jurista IA] Found ${result.crimes?.length || 0} crimes`);
            
            return NextResponse.json({
                success: true,
                analysis: result,
                usage: data.usage,
                model: promptConfig.model
            });
            
        } catch (parseError) {
            console.error('[Jurista IA] Parse error:', parseError, 'Content:', content);
            return NextResponse.json({ 
                error: 'Erro ao processar resposta da IA',
                raw_content: content.substring(0, 500)
            }, { status: 500 });
        }
        
    } catch (error: any) {
        console.error('[Jurista IA] Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Erro interno' 
        }, { status: 500 });
    }
}

// Protected: Only member+ can use Jurista IA
export const POST = withSecurity(handlePost, { requiredRole: 'member' });
