/**
 * Radio Now Playing API
 * GET  /api/radio/now-playing - Get current track
 * POST /api/radio/now-playing/advance - Advance to next track (cron)
 */

import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabaseAdmin = getSupabaseAdmin();

const DEFAULT_DURATION_MS = 180000; // 3 minutes fallback

export async function GET() {
  try {
    // Get current now playing
    const { data: nowPlaying } = await supabaseAdmin
        .from('volante_radio_now_playing')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    if (!nowPlaying || !nowPlaying.queue_id) {
        // No track playing, start with top of queue
        const { data: topTrack } = await supabaseAdmin
            .from('volante_radio_queue')
            .select('*')
            .eq('status', 'APPROVED')
            .order('score', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (topTrack) {
            // Set this as now playing
            await supabaseAdmin
                .from('volante_radio_now_playing')
                .upsert({
                    id: 1,
                    queue_id: topTrack.id,
                    track_title: topTrack.title,
                    track_artist: topTrack.artist,
                    track_uri: topTrack.spotify_url,
                    started_at: new Date().toISOString(),
                    duration_ms: DEFAULT_DURATION_MS,
                    is_playing: true,
                });

            return NextResponse.json({
                track: topTrack,
                started_at: new Date().toISOString(),
                progress_ms: 0,
            });
        }

        return NextResponse.json({ track: null, message: 'Queue is empty' });
    }

    // Calculate progress
    const startedAt = new Date(nowPlaying.started_at).getTime();
    const now = Date.now();
    const progressMs = now - startedAt;
    const duration = nowPlaying.duration_ms || DEFAULT_DURATION_MS;

    // Check if track should have ended
    if (progressMs >= duration) {
        // Track ended, advance to next (but return current for now)
        // The cron job handles this, but we can trigger it here too
    }

    return NextResponse.json({
        track: {
            id: nowPlaying.queue_id,
            title: nowPlaying.track_title,
            artist: nowPlaying.track_artist,
            spotify_url: nowPlaying.track_uri,
        },
        started_at: nowPlaying.started_at,
        progress_ms: Math.min(progressMs, duration),
        duration_ms: duration,
    });
  } catch (err: any) {
    console.error('[Radio Now Playing] Error:', err);
    return NextResponse.json({ error: 'Erro no rádio' }, { status: 500 });
  }
}
