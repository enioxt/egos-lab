'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, Clock, Construction } from 'lucide-react';

export default function ActivityPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Minhas Atividades</h1>
                            <p className="text-sm text-slate-400">Histórico de ações no sistema</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Construction className="w-10 h-10 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Em Desenvolvimento</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        A página de atividades está sendo construída. Em breve você poderá visualizar:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="bg-slate-700/50 rounded-xl p-4">
                            <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">Ações realizadas</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-xl p-4">
                            <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">Histórico temporal</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-xl p-4">
                            <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-300">Telemetria</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
