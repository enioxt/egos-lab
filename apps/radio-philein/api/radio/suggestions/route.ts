import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api-rate-limit';

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request, 'api', '/api/radio/suggestions');
  if (rateLimited) return rateLimited;
    try {
        const cookieStore = await cookies();

        // Create server client to check auth
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Login required' }, { status: 401 });
        }

        const { textOrUrl } = await request.json();
        if (!textOrUrl || typeof textOrUrl !== 'string') {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Parsing Logic
        let suggestionData: any = null;
        let provider = 'text';

        // 1. Check if URL
        try {
            const urlObj = new URL(textOrUrl);
            if (['open.spotify.com', 'music.apple.com', 'youtube.com', 'youtu.be'].some(d => urlObj.hostname.includes(d))) {
                // Valid music provider - parse via Odesli
                // We use the Odesli API here server-side to validate
                const odesliRes = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(textOrUrl)}&userCountry=BR`);
                if (odesliRes.ok) {
                    const data = await odesliRes.json();
                    const entityKey = Object.keys(data.entitiesByUniqueId)[0];
                    const entity = data.entitiesByUniqueId[entityKey];

                    if (entity) {
                        suggestionData = {
                            title: entity.title,
                            artist: entity.artistName,
                            sourceUrl: textOrUrl,
                            provider: entity.apiProvider,
                            normalizedKey: `${entity.title} - ${entity.artistName}`.toLowerCase()
                        };
                        provider = entity.apiProvider;
                    }
                }
            }
        } catch (e) {
            // Not a URL, treat as text
        }

        // 2. Heuristic Text Parsing (if not URL)
        if (!suggestionData) {
            // Simple format: "Title - Artist"
            const parts = textOrUrl.split(/[-–—]/); // hyphens
            if (parts.length >= 2) {
                suggestionData = {
                    title: parts[0].trim(),
                    artist: parts[1].trim(),
                    sourceUrl: null,
                    provider: 'manual',
                    normalizedKey: textOrUrl.toLowerCase()
                };
            } else {
                // Fallback: Just treat whole text as title
                suggestionData = {
                    title: textOrUrl.trim(),
                    artist: 'Desconhecido',
                    sourceUrl: null,
                    provider: 'manual',
                    normalizedKey: textOrUrl.toLowerCase()
                };
            }
        }

        // 3. Save to DB (SSOT)
        const { error: dbError } = await supabase
            .from('volante_music_suggestions')
            .insert({
                user_id: user.id,
                status: 'PENDING',
                suggestion_json: suggestionData,
                created_at: new Date().toISOString()
            });

        if (dbError) {
            console.error('Error saving suggestion:', dbError);
            return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
        }

        return NextResponse.json({ success: true, suggestion: suggestionData });

    } catch (err) {
        console.error('Error processing suggestion:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
