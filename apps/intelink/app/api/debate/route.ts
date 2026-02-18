/**
 * Debate API - Tsun-cha Protocol
 * 
 * Challenges AI assertions and demands logical justification.
 * "The Defender must prove its premises."
 * 
 * @see .guarani/philosophy/TSUN_CHA_PROTOCOL.md
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { 
    DEBATE_SYSTEM_PROMPT, 
    buildDebateUserPrompt, 
    parseDebateResult,
    promptConfig 
} from '@/lib/prompts/chat/debate';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'sk-placeholder',
  baseURL: 'https://openrouter.ai/api/v1',
});

// System prompt now imported from lib/prompts/chat/debate.ts

interface DebateRequest {
  assertion: string;
  context?: {
    entityId?: string;
    investigationId?: string;
    source?: string;
  };
  mode: 'challenge' | 'verify';
}

async function handlePost(req: NextRequest, auth: AuthContext) {
  try {
    const { assertion, context, mode }: DebateRequest = await req.json();

    if (!assertion) {
      return NextResponse.json(
        { error: 'Assertion is required' },
        { status: 400 }
      );
    }

    // Build context string
    let contextInfo = '';
    if (context?.entityId) {
      contextInfo += `Entidade ID: ${context.entityId}\n`;
    }
    if (context?.investigationId) {
      contextInfo += `Investigação ID: ${context.investigationId}\n`;
    }
    if (context?.source) {
      contextInfo += `Fonte: ${context.source}\n`;
    }

    const userMessage = `## AFIRMAÇÃO A DEBATER

"${assertion}"

${contextInfo ? `## CONTEXTO\n${contextInfo}` : ''}

## INSTRUÇÃO

Analise esta afirmação usando o protocolo Tsun-cha.
Determine se ela é logicamente válida ou se contém falácias/generalizações.
Responda APENAS com JSON válido.`;

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: DEBATE_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3, // Lower temperature for logical analysis
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          valid: result.valid ?? false,
          reasoning: result.reasoning || 'Análise inconclusiva',
          evidence: result.evidence || [],
          confidence: result.confidence ?? 0.5,
          logicalFlaws: result.logical_flaws || [],
        });
      }
    } catch (parseError) {
      console.error('[Debate API] JSON parse error:', parseError);
    }

    // Fallback response
    return NextResponse.json({
      valid: false,
      reasoning: 'Não foi possível analisar a afirmação automaticamente.',
      evidence: [],
      confidence: 0,
    });
  } catch (error) {
    console.error('[Debate API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withSecurity(handlePost, { requiredRole: 'member' });
