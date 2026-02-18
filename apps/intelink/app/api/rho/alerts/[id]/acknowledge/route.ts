import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, notFoundError } from '@/lib/api-utils';

/**
 * POST /api/rho/alerts/[id]/acknowledge
 * 
 * Acknowledges a Rho alert
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: alert, error: fetchError } = await supabase
        .from('intelink_rho_alerts')
        .select('id, is_acknowledged')
        .eq('id', id)
        .single();

    if (fetchError || !alert) {
        return notFoundError('Alerta');
    }

    if (alert.is_acknowledged) {
        return NextResponse.json({ 
            success: true, 
            message: 'Alerta já foi reconhecido' 
        });
    }

    const { error: updateError } = await supabase
        .from('intelink_rho_alerts')
        .update({
            is_acknowledged: true,
            acknowledged_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) {
        console.error('[Rho Alerts] Acknowledge error:', updateError);
        return NextResponse.json({ 
            success: false, 
            error: 'Erro ao reconhecer alerta' 
        }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true,
        message: 'Alerta reconhecido'
    });
}
