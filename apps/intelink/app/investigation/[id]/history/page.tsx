'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Loader2, Users, Car, MapPin, Building2, Target, Link2, Calendar, GitBranch, Clock } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import InvestigationTimeline, { buildTimelineEvents, TimelineEvent } from '@/components/intelink/InvestigationTimeline';
import JourneyList from '@/components/shared/JourneyList';

interface CronosReport {
    id: string;
    title: string;
    summary: string;
    content: string; // JSON with timeline events
    created_at: string;
}

export default function InvestigationHistoryPage() {
    const params = useParams();
    const id = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [investigation, setInvestigation] = useState<any>(null);
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [cronosReports, setCronosReports] = useState<CronosReport[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'timeline' | 'journeys' | 'cronos'>('timeline');

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // console.log('[History] Loading data via API for investigation:', id);
            
            // Use API route to fetch data (bypasses RLS)
            const response = await fetch(`/api/history?investigation_id=${id}`);
            
            if (!response.ok) {
                console.error('[History] API error:', response.status);
                return;
            }

            const data = await response.json();
            
            setInvestigation(data.investigation);
            // console.log('[History] Entities loaded:', data.entities?.length || 0);
            // console.log('[History] Relationships loaded:', data.relationships?.length || 0);
            // console.log('[History] Evidence loaded:', data.evidence?.length || 0);

            // Build timeline events
            const allEvents = buildTimelineEvents({
                entities: data.entities || [],
                relationships: data.relationships || [],
                evidence: data.evidence || []
            });

            // console.log('[History] Total events:', allEvents.length);
            setEvents(allEvents);
            
            // Fetch Cronos reports (extracted timelines)
            const cronosResponse = await fetch(`/api/reports?investigation_id=${id}&type=cronologia`);
            if (cronosResponse.ok) {
                const cronosData = await cronosResponse.json();
                setCronosReports(cronosData.reports || []);
            }
        } catch (error) {
            console.error('[History] Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter events
    const filteredEvents = filter === 'all' 
        ? events 
        : events.filter(e => e.type === filter);

    // Stats
    const stats = {
        total: events.length,
        entities: events.filter(e => e.type === 'entity_added').length,
        relationships: events.filter(e => e.type === 'relationship_created').length,
        evidence: events.filter(e => e.type === 'evidence_uploaded').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center gap-4">
                    <Link 
                        href={`/investigation/${id}`}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Histórico Completo
                        </h1>
                        <p className="text-sm text-slate-400">
                            {investigation?.title || 'Operação'}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-xs text-slate-400">Total de Eventos</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.entities}</p>
                        <p className="text-xs text-slate-400">Entidades</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">{stats.relationships}</p>
                        <p className="text-xs text-slate-400">Vínculos</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{stats.evidence}</p>
                        <p className="text-xs text-slate-400">Evidências</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'timeline' 
                                ? 'border-cyan-500 text-cyan-400' 
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('journeys')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'journeys' 
                                ? 'border-cyan-500 text-cyan-400' 
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <GitBranch className="w-4 h-4" />
                        Jornadas de Investigação
                    </button>
                    <button
                        onClick={() => setActiveTab('cronos')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'cronos' 
                                ? 'border-indigo-500 text-indigo-400' 
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Cronologias Extraídas
                        {cronosReports.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs font-bold">
                                {cronosReports.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'timeline' ? (
                    <>
                        {/* Filters */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {[
                                { key: 'all', label: 'Todos', icon: Calendar },
                                { key: 'entity_added', label: 'Entidades', icon: Users },
                                { key: 'relationship_created', label: 'Vínculos', icon: Link2 },
                                { key: 'evidence_uploaded', label: 'Evidências', icon: Target },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                        filter === f.key 
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                                    }`}
                                >
                                    <f.icon className="w-4 h-4" />
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Timeline */}
                        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                            {filteredEvents.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>Nenhum evento encontrado</p>
                                </div>
                            ) : (
                                <InvestigationTimeline 
                                    events={filteredEvents}
                                    onEventClick={() => {}}
                                />
                            )}
                        </div>
                    </>
                ) : activeTab === 'journeys' ? (
                    /* Journeys Tab */
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                        <JourneyList investigationId={id} />
                    </div>
                ) : (
                    /* Cronos Tab */
                    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6">
                        {cronosReports.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="mb-2">Nenhuma cronologia extraída</p>
                                <p className="text-sm">Use o Cronos no IA Lab para extrair timeline de documentos</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cronosReports.map(report => {
                                    let timeline;
                                    try {
                                        timeline = JSON.parse(report.content);
                                    } catch { timeline = null; }
                                    
                                    return (
                                        <div key={report.id} className="border border-slate-700 rounded-xl overflow-hidden">
                                            <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-white">{report.title}</h3>
                                                    <p className="text-xs text-slate-400">{report.summary}</p>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            {timeline?.events && (
                                                <div className="p-4 space-y-3">
                                                    {timeline.events.slice(0, 5).map((event: any, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-3">
                                                            <div className="w-3 h-3 mt-1.5 bg-indigo-500 rounded-full flex-shrink-0" />
                                                            <div>
                                                                <span className="text-xs text-indigo-400 font-medium">
                                                                    {event.date || 'Data não especificada'}
                                                                    {event.time && ` às ${event.time}`}
                                                                </span>
                                                                <p className="text-sm text-slate-300">{event.event}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {timeline.events.length > 5 && (
                                                        <p className="text-xs text-slate-500 text-center pt-2">
                                                            + {timeline.events.length - 5} eventos
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
