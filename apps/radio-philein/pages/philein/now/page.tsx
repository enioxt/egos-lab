"use client";

import React, { useEffect, useState } from 'react';
import { Radio, ExternalLink, ArrowLeft, ThumbsUp, ThumbsDown, Send, ListMusic } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface NowPlaying {
    track: { id: string; title: string; artist: string; spotify_url: string | null } | null;
    progress_ms: number;
    duration_ms: number;
    started_at: string;
}

export default function RadioNowPage() {
    const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
    const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch config
        fetch('/api/radio/philein/config')
            .then(r => r.json())
            .then(data => {
                if (data.spotify_playlist_url) {
                    setPlaylistUrl(data.spotify_playlist_url);
                }
            });

        // Fetch now playing
        const fetchNowPlaying = () => {
            fetch('/api/radio/now-playing')
                .then(r => r.json())
                .then(setNowPlaying);
        };

        fetchNowPlaying();
        const interval = setInterval(fetchNowPlaying, 10000);
        return () => clearInterval(interval);
    }, []);

    // Extract playlist ID
    const getPlaylistId = () => {
        if (!playlistUrl) return '3Ld1GKhiOg6ousSaE3XAW1';
        if (playlistUrl.includes('spotify:playlist:')) return playlistUrl.split(':')[2];
        const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        return match?.[1] || '3Ld1GKhiOg6ousSaE3XAW1';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-gray-800">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">Voltar</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-amber-500 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="font-bold">Rádio Philein</h1>
                    <span className="text-[10px] bg-red-500/80 text-white px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                        24/7
                    </span>
                </div>
                <a
                    href={`https://open.spotify.com/playlist/${getPlaylistId()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-sm"
                >
                    <ExternalLink className="w-4 h-4" />
                    Spotify
                </a>
            </header>

            {/* Now Playing Banner */}
            {nowPlaying?.track && (
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-500/20 p-4">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <div className="flex-1">
                            <p className="text-xs text-purple-300">Tocando agora para todos</p>
                            <p className="font-bold">{nowPlaying.track.title}</p>
                            <p className="text-sm text-gray-400">{nowPlaying.track.artist}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Player */}
            <main className="max-w-4xl mx-auto p-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
                    <iframe
                        style={{ borderRadius: '12px' }}
                        src={`https://open.spotify.com/embed/playlist/${getPlaylistId()}?utm_source=generator&theme=0`}
                        width="100%"
                        height="480"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    />
                </div>

                {/* Instructions */}
                <div className="mt-6 text-center text-gray-500 text-sm space-y-2">
                    <p>🎧 Aperte play e deixe rolando enquanto navega.</p>
                    <p>Esta janela pode ficar aberta em segundo plano.</p>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        href="/radio/philein"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition"
                    >
                        <ListMusic className="w-4 h-4" />
                        Ver Histórico
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center text-gray-600 text-xs py-8">
                <p>Rádio Philein &copy; {new Date().getFullYear()} Carteira Livre</p>
                <p className="mt-1">Música curada pela comunidade</p>
            </footer>
        </div>
    );
}
