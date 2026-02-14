import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';

export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/resolve-links');
  if (rateLimited) return rateLimited;
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(url)}&userCountry=BR`);

        if (!response.ok) {
            throw new Error(`Odesli API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Error resolving links:', err);
        return NextResponse.json({ error: 'Failed to resolve links' }, { status: 500 });
    }
}
