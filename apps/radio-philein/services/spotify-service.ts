import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

let spotifyAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken() {
    if (spotifyAccessToken && Date.now() < tokenExpiresAt) {
        return spotifyAccessToken;
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
        throw new Error("Missing Spotify Credentials in .env");
    }

    const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SPOTIFY_REFRESH_TOKEN,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh Spotify token: ${error}`);
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000; // Buffer 60s

    return spotifyAccessToken;
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

export async function syncNowPlaying() {
    try {
        const token = await getAccessToken();

        // Get Current Track
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 204) {
            // Nothing playing
            await supabaseAdmin
                .from('volante_radio_now_playing')
                .update({ is_playing: false })
                .eq('id', 1);
            return { is_playing: false };
        }

        const data = await response.json();
        const item = data.item;

        if (!item || item.type !== 'track') {
            // Podcast or other format - ignore for radio logs
            await supabaseAdmin
                .from('volante_radio_now_playing')
                .update({ is_playing: false })
                .eq('id', 1);
            return { is_playing: false, reason: 'not_track' };
        }

        // 1. Upsert Artist
        const artist = item.artists[0]; // Primary artist
        const artistSlug = slugify(artist.name);

        // Check existing
        let { data: dbArtist } = await supabaseAdmin
            .from('volante_radio_artists')
            .select('id')
            .eq('spotify_id', artist.id)
            .maybeSingle();

        if (!dbArtist) {
            // Try by slug to avoid dupes if spotify_id missing (unlikely)
            const { data: dbArtistBySlug } = await supabaseAdmin
                .from('volante_radio_artists')
                .select('id')
                .eq('slug', artistSlug)
                .maybeSingle();

            if (dbArtistBySlug) {
                dbArtist = dbArtistBySlug;
                // Update spotify_id
                await supabaseAdmin.from('volante_radio_artists').update({ spotify_id: artist.id }).eq('id', dbArtist.id);
            } else {
                // Insert
                const { data: newArtist, error } = await supabaseAdmin
                    .from('volante_radio_artists')
                    .insert({
                        name: artist.name,
                        slug: artistSlug,
                        spotify_id: artist.id,
                        // We can fetch image later via Enrichment Job
                    })
                    .select('id')
                    .maybeSingle();

                if (error) console.error("Error creating artist", error);
                dbArtist = newArtist;
            }
        }

        if (!dbArtist) throw new Error("Failed to resolve artist");

        // 2. Upsert Track
        const trackSlug = slugify(`${item.name}-${artist.name}`);
        let { data: dbTrack } = await supabaseAdmin
            .from('volante_radio_tracks')
            .select('id')
            .eq('spotify_id', item.id)
            .maybeSingle();

        if (!dbTrack) {
            const { data: newTrack, error } = await supabaseAdmin
                .from('volante_radio_tracks')
                .insert({
                    title: item.name,
                    slug: trackSlug,
                    artist_id: dbArtist.id,
                    spotify_id: item.id,
                    cover_url: item.album.images[0]?.url,
                    duration_ms: item.duration_ms,
                    isrc: item.external_ids?.isrc
                })
                .select('id')
                .maybeSingle();

            if (error) console.error("Error creating track", error);
            dbTrack = newTrack;

            // TRIGGER ENRICHMENT HERE (Event or Job)
            // For MVP we just log it needs enrichment
        }

        if (!dbTrack) throw new Error("Failed to resolve track");

        // 3. Update Now Playing (SSOT)
        // Check if it really changed to avoid spamming Play Events
        const { data: currentSSOT } = await supabaseAdmin
            .from('volante_radio_now_playing')
            .select('track_id, is_playing')
            .eq('id', 1)
            .maybeSingle();

        const isdifferentTrack = currentSSOT?.track_id !== dbTrack.id;
        const wasPaused = currentSSOT?.is_playing === false;
        const isNowPlaying = data.is_playing;

        // Update Singleton
        await supabaseAdmin
            .from('volante_radio_now_playing')
            .upsert({
                id: 1,
                track_id: dbTrack.id,
                started_at: new Date(Date.now() - (data.progress_ms || 0)).toISOString(),
                is_playing: isNowPlaying,
                updated_at: new Date().toISOString()
            });

        // 4. Log Play Event (Only if track changed or resumed after long pause?)
        // Simplest SSOT: If track changed, log new event.
        if (isdifferentTrack) {
            await supabaseAdmin
                .from('volante_radio_play_events')
                .insert({
                    track_id: dbTrack.id,
                    played_at: new Date().toISOString(),
                    duration_ms: item.duration_ms,
                    context_uri: data.context?.uri
                });

            console.debug(`[Radio] New Track: ${item.name} by ${artist.name}`);
        }

        return {
            success: true,
            track: item.name,
            artist: artist.name,
            is_playing: isNowPlaying
        };

    } catch (err) {
        console.error("[Radio] Sync Error:", err);
        return { success: false, error: err };
    }
}
