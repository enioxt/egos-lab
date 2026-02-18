/**
 * CRIT Judging API
 * 
 * POST /api/analysis/crit
 * - Evaluate argument validity using Socratic method
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
    evaluateArgument, 
    evaluateMultipleArguments,
    formatCritEvaluation,
    Argument 
} from '@/lib/analysis/crit-judging';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            claim,
            evidence = [],
            arguments: multipleArgs,
            format = 'json'
        } = body;

        // Handle multiple arguments
        if (multipleArgs && Array.isArray(multipleArgs)) {
            const args: Argument[] = multipleArgs.map((a: any, i: number) => ({
                id: a.id || `arg_${i}`,
                claim: a.claim,
                evidence: a.evidence || [],
                source: a.source,
                confidence: a.confidence
            }));

            const result = evaluateMultipleArguments(args);

            return NextResponse.json({
                success: true,
                batch: true,
                ...result
            });
        }

        // Handle single argument
        if (!claim) {
            return NextResponse.json(
                { error: 'Campo "claim" é obrigatório' },
                { status: 400 }
            );
        }

        const argument: Argument = {
            id: 'arg_single',
            claim,
            evidence: Array.isArray(evidence) ? evidence : [evidence]
        };

        const evaluation = evaluateArgument(argument);

        console.log(`[CRIT API] Evaluated: ${evaluation.is_valid ? 'VALID' : 'INVALID'} (${evaluation.score}/100)`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                formatted: formatCritEvaluation(evaluation)
            });
        }

        return NextResponse.json({
            success: true,
            evaluation
        });

    } catch (error: any) {
        console.error('[CRIT API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao avaliar argumento' },
            { status: 500 }
        );
    }
}
