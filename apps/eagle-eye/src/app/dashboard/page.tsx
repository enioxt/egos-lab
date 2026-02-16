import React from 'react';
import {
    Building2,
    MapPin,
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    FileText
} from 'lucide-react';

// Mock Data based on CityProfile
const MOCK_STATS = {
    readinessScore: 31,
    activeOpportunities: 12,
    marketingRoi: 15,
    totalAssets: 145
};

const CHECKLIST_ITEMS = [
    { id: 1, text: 'Claim Google Business Profile for "Museu Municipal"', critical: true },
    { id: 2, text: 'Update Opening Hours for "Parque do Mocambo"', critical: true },
    { id: 3, text: 'Respond to 5 negative reviews on "Hotel Center"', critical: false },
    { id: 4, text: 'Upload photos for "Catedral de Santo Antônio"', critical: false },
];

const RECENT_SIGNALS = [
    { id: 1, title: 'Abertura de Licitação - Shows Expomilho', source: 'Diário Oficial', time: '2h ago', type: 'gazette' },
    { id: 2, title: 'Novo decreto sobre Horário de Bares', source: 'Prefeitura', time: '5h ago', type: 'gazette' },
    { id: 3, title: 'Viral Check-in at "Lagoa Grande"', source: 'Instagram', time: '1d ago', type: 'social' },
];

export default function ManagerDashboard() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Eagle Eye</h1>
                    <p className="text-neutral-400">Patos de Minas (MG) • Manager View</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        Settings
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-emerald-900/20 transition">
                        Refresh Intelligence
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <StatsCard
                    title="Readiness Score"
                    value={`${MOCK_STATS.readinessScore}/100`}
                    trend="-2% this week"
                    icon={<AlertTriangle className="text-red-500" />}
                    color="text-red-500"
                />
                <StatsCard
                    title="Active Opportunities"
                    value={MOCK_STATS.activeOpportunities}
                    trend="+4 new"
                    icon={<FileText className="text-blue-500" />}
                    color="text-blue-500"
                />
                <StatsCard
                    title="Est. Marketing ROI"
                    value={`+${MOCK_STATS.marketingRoi}%`}
                    trend="Projected"
                    icon={<TrendingUp className="text-emerald-500" />}
                    color="text-emerald-500"
                />
                <StatsCard
                    title="Mapped Assets"
                    value={MOCK_STATS.totalAssets}
                    trend="85% Verified"
                    icon={<MapPin className="text-purple-500" />}
                    color="text-purple-500"
                />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Critical Checklist */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="text-orange-500" size={20} />
                            Critical Actions Checklist
                        </h2>
                        <div className="space-y-3">
                            {CHECKLIST_ITEMS.map(item => (
                                <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-neutral-800/50 rounded-lg transition group cursor-pointer">
                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${item.critical ? 'border-red-500/50 text-red-500' : 'border-neutral-600 text-transparent group-hover:border-neutral-500'}`}>
                                        {/* Checkbox state simulation */}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${item.critical ? 'text-red-100' : 'text-neutral-200'}`}>{item.text}</p>
                                        {item.critical && <span className="text-xs text-red-500 uppercase font-bold tracking-wider">High Priority</span>}
                                    </div>
                                    <button className="ml-auto text-xs bg-neutral-800 text-neutral-400 px-2 py-1 rounded hover:bg-neutral-700">
                                        Fix Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Asset Inventory Preview */}
                    <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="text-indigo-500" size={20} />
                                Asset Inventory
                            </h2>
                            <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300">View All</a>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AssetCard name="Cachoeira do Prata" category="Nature" verified={false} score={45} />
                            <AssetCard name="Hotel Center" category="Hospitality" verified={true} score={88} />
                        </div>
                    </section>
                </div>

                {/* Right Column: Intelligence Feed */}
                <div className="space-y-6">
                    <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-full">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="text-blue-500" size={20} />
                            Recent Signals
                        </h2>
                        <div className="space-y-4 relative">
                            {/* Timeline line */}
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-800" />

                            {RECENT_SIGNALS.map(signal => (
                                <div key={signal.id} className="relative pl-8">
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-neutral-800 border-2 border-neutral-600 z-10" />
                                    <div className="bg-neutral-800/30 p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 transition">
                                        <span className="text-xs font-mono text-neutral-500 mb-1 block">{signal.time} • {signal.source}</span>
                                        <h3 className="text-sm font-medium text-neutral-200 mb-2 leading-relaxed">{signal.title}</h3>
                                        <div className="flex gap-2">
                                            <button className="text-xs text-blue-400 hover:text-blue-300">Analyze</button>
                                            <button className="text-xs text-neutral-500 hover:text-neutral-400">Dismiss</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}

// Sub-components

function StatsCard({ title, value, trend, icon, color }: any) {
    return (
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl hover:bg-neutral-800/80 transition">
            <div className="flex justify-between items-start mb-2">
                <span className="text-neutral-400 text-sm font-medium">{title}</span>
                <div className={`p-2 rounded-lg bg-neutral-950 ${color.replace('text-', 'bg-').replace('500', '500/10')}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className={`text-xs mb-1 ${trend.includes('-') ? 'text-red-400' : 'text-emerald-400'}`}>{trend}</span>
            </div>
        </div>
    );
}

function AssetCard({ name, category, verified, score }: any) {
    return (
        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex items-center gap-3">
            <div className="w-12 h-12 bg-neutral-800 rounded bg-gradient-to-br from-neutral-800 to-neutral-900" />
            <div className="flex-1">
                <h4 className="font-medium text-sm text-neutral-200">{name}</h4>
                <span className="text-xs text-neutral-500">{category}</span>
            </div>
            <div className="text-right">
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {verified ? 'VERIFIED' : 'PENDING'}
                </div>
                <span className="text-xs text-neutral-600 font-mono mt-1 block">Sc: {score}</span>
            </div>
        </div>
    )
}
