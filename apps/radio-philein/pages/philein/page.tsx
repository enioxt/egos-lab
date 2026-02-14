import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { Disc, Radio, Clock, User } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Rádio Philein - Carteira Livre',
    description: 'A trilha sonora da sua liberdade. Curadoria musical, foco e inspiração para suas práticas de direção e vida.',
    openGraph: {
        type: 'website',
    }
};

export const dynamic = 'force-dynamic';

export default async function RadioLandingPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch Stats or Recent
    const { data: recentTracks } = await supabase
        .from('volante_radio_play_events')
        .select('played_at, track:volante_radio_tracks(title, slug, cover_url, artist:volante_radio_artists(name, slug))')
        .order('played_at', { ascending: false })
        .limit(6);

    // JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "RadioStation",
        "name": "Rádio Philein",
        "url": "https://carteiralivre.com/radio/philein",
        "image": "https://carteiralivre.com/icons/icon.svg", // Placeholder
        "description": "Rádio oficial do Carteira Livre. Foco e concentração.",
        "broadcastDisplayName": "Rádio Philein"
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Hero */}
            <section className="relative h-[50vh] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-black z-0" />
                <div className="z-10 text-center px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 flex items-center justify-center animate-pulse">
                        <Disc className="w-8 h-8 text-white animate-spin-slow" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Rádio Philein
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Música para focar, relaxar e dirigir.
                    </p>
                    <div className="mt-8 flex gap-4 justify-center">
                        <Link href="/radio/philein/now" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition">
                            Ouvir Agora
                        </Link>
                        <Link href="#recent" className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition">
                            Últimas Tocadas
                        </Link>
                    </div>
                </div>
            </section>

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Recent Tracks */}
            <section id="recent" className="max-w-7xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-purple-400" />
                    Visto Recentemente no Ar
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentTracks?.map((event: any, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition group">
                            <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                                {event.track.cover_url && (
                                    <Image
                                        src={event.track.cover_url}
                                        alt={event.track.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold truncate text-white group-hover:text-purple-400 transition">
                                    {event.track.title}
                                </h3>
                                <p className="text-sm text-gray-400 truncate">
                                    {event.track.artist?.name}
                                </p>
                                <span className="text-xs text-gray-600 mt-1 block">
                                    {new Date(event.played_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {/* SEO Links (Hidden visually or subtle) */}
                            <Link href={`/radio/philein/tracks/${event.track.slug}`} className="absolute inset-0" aria-label={`Ver destalhes de ${event.track.title}`} />
                        </div>
                    ))}
                </div>

                {!recentTracks?.length && (
                    <p className="text-gray-500 text-center py-10">Nenhuma música registrada recentemente.</p>
                )}
            </section>

            {/* FAQ / SEO Text */}
            <section className="max-w-4xl mx-auto px-4 py-16 border-t border-gray-900">
                <h2 className="text-2xl font-bold mb-8">Sobre a Rádio</h2>
                <div className="space-y-6 text-gray-300">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">O que é a Rádio Philein?</h3>
                        <p>A Rádio Philein é uma iniciativa do Carteira Livre para proporcionar uma trilha sonora de qualidade, curada especificamente para momentos de foco, estudo e prática de direção defensiva.</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Como posso ouvir?</h3>
                        <p>Você pode ouvir diretamente através do nosso player no topo desta página, ou utilizando o botão flutuante disponível em todo o aplicativo Carteira Livre.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
