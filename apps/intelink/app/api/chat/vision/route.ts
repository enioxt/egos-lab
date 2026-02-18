import { NextRequest, NextResponse } from 'next/server';
import { VISION_SYSTEM_PROMPT, VISION_DEFAULT_USER_PROMPT, promptConfig } from '@/lib/prompts/chat/vision';
import { fetchWithRetry, TIMEOUTS, RETRY_PRESETS } from '@/lib/adaptive-retry';
import { validateAIResponse } from '@/lib/content-guardian';

/**
 * POST /api/chat/vision
 * 
 * Analyze images using Gemini 2.0 Vision via OpenRouter
 * Uses centralized prompt from /lib/prompts/chat/vision.ts
 * 
 * Body:
 * - image: base64 encoded image (data:image/...;base64,...)
 * - prompt: optional prompt for the analysis
 */
export async function POST(request: NextRequest) {
    try {
        const { image, prompt } = await request.json();
        
        if (!image) {
            return NextResponse.json(
                { error: 'Image is required' },
                { status: 400 }
            );
        }
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }
        
        // Use centralized prompt config
        const model = promptConfig.model;
        const systemPrompt = VISION_SYSTEM_PROMPT;
        const userPrompt = prompt || VISION_DEFAULT_USER_PROMPT;
        
        // Use adaptive retry with Fibonacci backoff
        const response = await fetchWithRetry(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://intelink.ia.br',
                    'X-Title': 'Intelink Vision',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt,
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: userPrompt,
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: image,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 2000,
                    temperature: 0.3,
                }),
                // Adaptive retry config
                timeout: TIMEOUTS.llm,
                ...RETRY_PRESETS.important,
                onRetry: (attempt, error, delay) => {
                    console.warn(`[Vision API] Retry ${attempt}: ${error.message}, next in ${delay}ms`);
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.text();
            console.error('[Vision API] OpenRouter error:', error);
            return NextResponse.json(
                { error: 'Vision analysis failed' },
                { status: 500 }
            );
        }
        
        const data = await response.json();
        const rawDescription = data.choices?.[0]?.message?.content || 'Não foi possível analisar a imagem.';
        
        // Validate AI response
        const { isValid, response: description, report } = validateAIResponse(rawDescription);
        if (!isValid) {
            console.warn('[Vision API] AI response flagged:', report.violations.map(v => v.message));
        }
        
        return NextResponse.json({
            success: true,
            description,
            model,
            usage: data.usage,
        });
    } catch (error) {
        console.error('[Vision API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
