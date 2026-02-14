import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

async function getTrack(slug: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('volante_radio_tracks')
        .select('*, artist:volante_radio_artists(*)')
        .eq('slug', slug)
        .maybeSingle();

    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const track = await getTrack(slug);

    if (!track) return { title: 'Música não encontrada' };

    return {
        title: `${track.title} - ${track.artist?.name} | Rádio Philein`,
        description: `Ouça ${track.title} de ${track.artist?.name} na Rádio Philein. Contexto, letra e informações sobre a faixa.`,
        openGraph: {
            images: track.cover_url ? [track.cover_url] : [],
        }
    };
}

export default async function TrackPage({ params }: Props) {
    const { slug } = await params;
    const track = await getTrack(slug);

    if (!track) return <div className="p-20 text-center text-white">Música não encontrada</div>;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": track.title,
        "byArtist": {
            "@type": "MusicGroup",
            "name": track.artist?.name
        },
        "duration": track.duration_ms ? `PT${Math.floor(track.duration_ms / 1000)}S` : undefined,
        "image": track.cover_url
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 pb-24">
            <Link href="/radio/philein" className="inline-flex items-center text-gray-400 hover:text-white mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Rádio
            </Link>

            <article className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                    {track.cover_url && (
                        <Image
                            src={track.cover_url}
                            alt={track.title}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    )}
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{track.title}</h1>
                        <h2 className="text-xl md:text-2xl text-purple-400">{track.artist?.name}</h2>
                    </div>

                    {/* AI Content */}
                    {track.metadata?.mood && (
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-purple-900/40 text-purple-300 text-sm border border-purple-500/20">
                                {track.metadata.mood}
                            </span>
                        </div>
                    )}

                    {track.metadata?.bio && (
                        <div className="prose prose-invert">
                            <h3 className="text-lg font-bold">Sobre a faixa</h3>
                            <p className="text-gray-300">
                                {track.metadata.bio}
                            </p>
                        </div>
                    )}

                    {/* Disclaimer/Citation */}
                    {track.metadata?.citations?.length > 0 && (
                        <div className="text-xs text-gray-600 mt-8 pt-4 border-t border-gray-900">
                            Fontes: {track.metadata.citations.join(', ')}
                        </div>
                    )}
                </div>
            </article>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}
