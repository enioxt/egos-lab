import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    buildGuardianPrompt, 
    parseGuardianResult, 
    promptConfig 
} from '@/lib/prompts/documents/guardian';

/**
 * Guardian AI - Quick analysis before saving
 * 
 * Checks:
 * 1. Entities that regex might have missed
 * 2. Name corrections/typos
 * 3. Missing critical data alerts
 * 
 * Prompt: lib/prompts/documents/guardian.ts
 */

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const body = await req.json();
        const { text, entities } = body;
        
        if (!text || text.length < 50) {
            return NextResponse.json({ error: 'Texto muito curto' }, { status: 400 });
        }
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key não configurada' }, { status: 500 });
        }
        
        // Build prompt using centralized function
        const prompt = buildGuardianPrompt(text, entities || []);
        
        // Quick analysis with fast model
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelink.app',
                'X-Title': 'Intelink Guardian AI'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001', // Fast model for quick analysis
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1000,
                temperature: 0
            })
        });
        
        if (!response.ok) {
            console.error('Guardian API error:', await response.text());
            return NextResponse.json({ 
                missed_entities: [],
                corrections: [],
                alerts: [{ severity: 'low', message: 'Análise automática indisponível' }],
                confidence: 0
            });
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        try {
            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = content;
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1] || jsonMatch[0];
            }
            
            const result = JSON.parse(jsonStr);
            return NextResponse.json({
                ...result,
                usage: data.usage
            });
        } catch (parseError) {
            console.warn('Guardian parse error:', parseError);
            return NextResponse.json({
                missed_entities: [],
                corrections: [],
                alerts: [],
                confidence: 0,
                raw: content.substring(0, 500)
            });
        }
        
    } catch (error: any) {
        console.error('Guardian error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withSecurity(handlePost, { requiredRole: 'member' });
