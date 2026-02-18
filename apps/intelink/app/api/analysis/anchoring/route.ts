/**
 * Anchoring Score API
 * 
 * POST /api/analysis/anchoring
 * - Evaluate AI response quality using MACI anchoring formula
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    calculateAnchoringScore, 
    formatAnchoringScore,
    AnchoringInput 
} from '@/lib/analysis/anchoring-score';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            query,
            response,
            context,
            expected_length,
            format = 'json'
        } = body;

        if (!query || !response) {
            return NextResponse.json(
                { error: 'Campos "query" e "response" são obrigatórios' },
                { status: 400 }
            );
        }

        const input: AnchoringInput = {
            query,
            response,
            context,
            expected_length
        };

        const score = calculateAnchoringScore(input);

        console.log(`[Anchoring API] Score: ${score.total}/100 (${score.quality_level})`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                formatted: formatAnchoringScore(score)
            });
        }

        return NextResponse.json({
            success: true,
            score
        });

    } catch (error: any) {
        console.error('[Anchoring API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao calcular anchoring score' },
            { status: 500 }
        );
    }
}
