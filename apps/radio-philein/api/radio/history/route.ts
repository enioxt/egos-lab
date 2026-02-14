/**
 * Radio History API
 * GET /api/radio/history - Get history of all played tracks
 */

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/history');
  if (rateLimited) return rateLimited;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: history, error, count } = await supabase
        .from('volante_radio_history')
        .select('*', { count: 'exact' })
        .order('played_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        return NextResponse.json({ error: 'Erro no histórico do rádio' }, { status: 500 });
    }

    return NextResponse.json({
        history,
        total: count,
        limit,
        offset,
    });
  } catch (err: any) {
    console.error('[Radio History] Error:', err);
    return NextResponse.json({ error: 'Erro no histórico do rádio' }, { status: 500 });
  }
}
