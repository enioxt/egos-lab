import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';
import { verifyCronSecret } from '@/lib/auth/verify-cron';
import { syncNowPlaying } from '@/services/radio/spotify-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/cron/radio/now-playing');
  if (rateLimited) return rateLimited;
    const unauthorized = verifyCronSecret(request);
    if (unauthorized) return unauthorized;
    try {
        const result = await syncNowPlaying();

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ error: 'Erro no rádio' }, { status: 500 });
    }
}
