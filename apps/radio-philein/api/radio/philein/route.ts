import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/philein/config');
  if (rateLimited) return rateLimited;
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: station, error } = await supabase
            .from('volante_radio_stations')
            .select('*')
            .eq('key', 'philein')
            .maybeSingle();

        if (error) {
            console.error('Error fetching radio config:', error);
            return NextResponse.json({ error: 'Station not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...station,
        });
    } catch (err) {
        console.error('Unexpected error in radio config:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
