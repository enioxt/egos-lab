/**
 * Advance Radio Queue (Cron Job)
 * POST /api/radio/now-playing/advance
 * 
 * Called periodically to move to the next track in the queue.
 * Should be triggered by Vercel Cron or external scheduler.
 * 
 * Features:
 * - Saves finished track to history
 * - Adds track to Spotify playlist (if credentials available)
 * - Picks next track from queue by score
 * - Loops playlist when queue is empty
 */

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

const DEFAULT_DURATION_MS = 180000; // 3 min
const PLAYLIST_ID = '3Ld1GKhiOg6ousSaE3XAW1'; // User's playlist

// Helper: Add track to Spotify playlist (requires valid tokens)
async function addTrackToSpotifyPlaylist(trackUri: string): Promise<boolean> {
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!refreshToken || !clientId || !clientSecret) {
        console.debug('[Radio] Spotify credentials not configured, skipping playlist add');
        return false;
    }

    try {
        // Get fresh access token
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });

        if (!tokenRes.ok) {
            console.error('[Radio] Failed to refresh Spotify token');
            return false;
        }

        const { access_token } = await tokenRes.json();

        // Convert URL to URI if needed
        let uri = trackUri;
        if (trackUri.includes('open.spotify.com')) {
            const match = trackUri.match(/track\/([a-zA-Z0-9]+)/);
            if (match) uri = `spotify:track:${match[1]}`;
        }

        // Add to playlist
        const addRes = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: [uri] }),
        });

        if (addRes.ok) {
            console.debug(`[Radio] Added ${uri} to playlist`);
            return true;
        } else {
            const err = await addRes.json();
            console.error('[Radio] Failed to add to playlist:', err);
            return false;
        }
    } catch (e) {
        console.error('[Radio] Spotify API error:', e);
        return false;
    }
}

// Helper: Save track to history
async function saveToHistory(track: any) {
    await supabaseAdmin.from('volante_radio_history').insert({
        queue_id: track.id || track.queue_id,
        track_title: track.title || track.track_title,
        track_artist: track.artist || track.track_artist,
        track_uri: track.spotify_url || track.track_uri,
        cover_url: track.cover_url,
        played_at: new Date().toISOString(),
        duration_ms: track.duration_ms || DEFAULT_DURATION_MS,
        metadata: {
            source: track.source_url,
            suggestedBy: track.user_id,
            upvotes: track.upvotes,
            downvotes: track.downvotes,
        },
    });
}

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/now-playing/advance');
  if (rateLimited) return rateLimited;
    // Cron auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current now playing
    const { data: nowPlaying } = await supabaseAdmin
        .from('volante_radio_now_playing')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    // Check if we should advance
    if (nowPlaying?.started_at) {
        const startedAt = new Date(nowPlaying.started_at).getTime();
        const elapsed = Date.now() - startedAt;
        const duration = nowPlaying.duration_ms || DEFAULT_DURATION_MS;

        if (elapsed < duration) {
            return NextResponse.json({
                advanced: false,
                message: 'Track still playing',
                remaining_ms: duration - elapsed,
            });
        }
    }

    // Save current track to history before advancing
    if (nowPlaying?.queue_id) {
        await saveToHistory(nowPlaying);

        // Mark as PLAYED
        await supabaseAdmin
            .from('volante_radio_queue')
            .update({ status: 'PLAYED', processed_at: new Date().toISOString() })
            .eq('id', nowPlaying.queue_id);
    }

    // Get next track from queue (highest score, MUST have spotify_url)
    const { data: nextTrack } = await supabaseAdmin
        .from('volante_radio_queue')
        .select('*')
        .eq('status', 'APPROVED')
        .not('spotify_url', 'is', null)
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!nextTrack) {
        // Queue empty, reset all PLAYED tracks back to APPROVED (loop)
        await supabaseAdmin
            .from('volante_radio_queue')
            .update({ status: 'APPROVED' })
            .eq('status', 'PLAYED');

        // Get random track
        const { data: allTracks } = await supabaseAdmin
            .from('volante_radio_queue')
            .select('*')
            .eq('status', 'APPROVED')
            .not('spotify_url', 'is', null);

        if (allTracks && allTracks.length > 0) {
            const randomTrack = allTracks[Math.floor(Math.random() * allTracks.length)];

            await supabaseAdmin
                .from('volante_radio_now_playing')
                .upsert({
                    id: 1,
                    queue_id: randomTrack.id,
                    track_title: randomTrack.title,
                    track_artist: randomTrack.artist,
                    track_uri: randomTrack.spotify_url,
                    started_at: new Date().toISOString(),
                    duration_ms: DEFAULT_DURATION_MS,
                    is_playing: true,
                });

            return NextResponse.json({ advanced: true, track: randomTrack, looped: true });
        }

        return NextResponse.json({ advanced: false, message: 'No tracks in queue' });
    }

    // Try to add the new track to the Spotify playlist (for persistence)
    if (nextTrack.spotify_url) {
        await addTrackToSpotifyPlaylist(nextTrack.spotify_url);
    }

    // Update now playing
    await supabaseAdmin
        .from('volante_radio_now_playing')
        .upsert({
            id: 1,
            queue_id: nextTrack.id,
            track_title: nextTrack.title,
            track_artist: nextTrack.artist,
            track_uri: nextTrack.spotify_url,
            started_at: new Date().toISOString(),
            duration_ms: nextTrack.duration_ms || DEFAULT_DURATION_MS,
            is_playing: true,
        });

    return NextResponse.json({ advanced: true, track: nextTrack });
}

// GET for manual testing
export async function GET(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/now-playing/advance');
  if (rateLimited) return rateLimited;
    return POST(request);
}
