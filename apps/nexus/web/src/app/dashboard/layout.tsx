'use client';
/**
 * Dashboard Layout — Merchant sidebar + content area
 * Dark sidebar, light content area.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Visão Geral', icon: '📊' },
    { href: '/dashboard/products', label: 'Produtos', icon: '📦' },
    { href: '/dashboard/import', label: 'Importar', icon: '⬆️' },
    { href: '/dashboard/settings', label: 'Configurações', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-gray-300 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        🛒 Nexus<span className="text-green-400">Market</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Painel do Lojista</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-green-600/20 text-green-400'
                                        : 'hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
                    <p>Nexus Market MVP</p>
                    <p className="text-gray-600">v0.3.0 — AI-First</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
