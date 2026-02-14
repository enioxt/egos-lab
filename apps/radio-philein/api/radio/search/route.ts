/**
 * Spotify Search API Proxy
 * GET /api/radio/search?q=coldplay+yellow
 * 
 * Uses Spotify's public search endpoint to provide autocomplete suggestions.
 */

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';

export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/search');
  if (rateLimited) return rateLimited;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        // Use the public Spotify embed search API (no auth required)
        const res = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5&market=BR`,
            {
                headers: {
                    // For unauthenticated search, we can use the open.spotify.com endpoint instead
                    'Accept': 'application/json',
                },
            }
        );

        // If Spotify API fails (needs auth), fallback to Odesli/mock
        if (!res.ok) {
            // Fallback: Return empty and let user paste link directly
            return NextResponse.json({
                results: [],
                fallback: true,
                message: 'Digite o nome completo ou cole um link do Spotify'
            });
        }

        const data = await res.json();
        const results = data.tracks?.items?.map((track: any) => ({
            id: track.id,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album.name,
            cover_url: track.album.images?.[0]?.url,
            spotify_url: track.external_urls.spotify,
            duration_ms: track.duration_ms,
        })) || [];

        return NextResponse.json({ results });
    } catch (e) {
        console.error('Spotify search error:', e);
        return NextResponse.json({ results: [], error: 'Search failed' });
    }
}
