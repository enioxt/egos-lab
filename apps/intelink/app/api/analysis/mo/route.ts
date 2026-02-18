/**
 * Modus Operandi API
 * 
 * POST /api/analysis/mo
 * - Compare investigation MO with other cases
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/api-utils';
import { 
    extractSignature, 
    analyzeMO, 
    formatMOAnalysis,
    CrimeSignature 
} from '@/lib/analysis/modus-operandi';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            investigationId,
            crimeType,
            metadata = {},
            format = 'json'
        } = body;

        if (!investigationId || !crimeType) {
            return NextResponse.json(
                { error: 'Campos "investigationId" e "crimeType" são obrigatórios' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        // Extract source signature
        const sourceSignature = extractSignature(investigationId, crimeType, metadata);

        // Fetch other investigations to compare
        const { data: investigations } = await supabase
            .from('intelink_investigations')
            .select('id, title, crime_type, metadata')
            .neq('id', investigationId)
            .limit(100);

        // Extract signatures from other cases
        const allSignatures: CrimeSignature[] = (investigations || []).map(inv => 
            extractSignature(
                inv.id,
                inv.crime_type || 'DESCONHECIDO',
                inv.metadata || {}
            )
        );

        // Analyze MO
        const analysis = analyzeMO(investigationId, sourceSignature, allSignatures);

        console.log(`[MO API] Analyzed ${investigationId}: ${analysis.matches.length} similar cases`);

        if (format === 'text') {
            return NextResponse.json({
                success: true,
                formatted: formatMOAnalysis(analysis)
            });
        }

        return NextResponse.json({
            success: true,
            analysis
        });

    } catch (error: any) {
        console.error('[MO API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erro ao analisar MO' },
            { status: 500 }
        );
    }
}
