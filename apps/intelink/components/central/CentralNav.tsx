'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Building2, Users, Settings,
    ArrowLeft, Shield, Link2, ClipboardCheck, Activity, ShieldAlert, Fingerprint,
    FileText, UserCircle, Brain
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface NavItem {
    href: string;
    label: string;
    icon: typeof Link2;
    requiresPermission?: 'canManagePermissions' | 'canAccessConfig';
    requiresSuperAdmin?: boolean;
    highlight?: 'danger';
}

interface CentralNavProps {
    isMainPage?: boolean;
}

// NOTE: /central/vinculos foi consolidado no IA Lab (tab Nexus)
// Removidos itens redundantes para header mais limpo
const NAV_ITEMS: NavItem[] = [
    // Principais - Visíveis para todos
    { href: '/central/intelligence-lab', label: 'IA Lab', icon: Brain },
    { href: '/central/entidades', label: 'Entidades', icon: UserCircle },
    { href: '/central/documentos', label: 'Documentos', icon: FileText },
    { href: '/central/evidencias', label: 'Evidências', icon: Fingerprint },
    { href: '/central/qualidade', label: 'Qualidade', icon: ClipboardCheck },
    { href: '/central/saude', label: 'Saúde', icon: Activity },
    // Admin - Só para quem tem permissão
    { href: '/central/delegacias', label: 'Delegacias', icon: Building2, requiresPermission: 'canAccessConfig' },
    { href: '/central/membros', label: 'Membros', icon: Users, requiresPermission: 'canAccessConfig' },
    { href: '/central/permissoes', label: 'Permissões', icon: Shield, requiresPermission: 'canManagePermissions' },
    { href: '/central/auditoria', label: 'Auditoria', icon: ShieldAlert, requiresSuperAdmin: true, highlight: 'danger' },
];

export default function CentralNav({ isMainPage = false }: CentralNavProps) {
    const pathname = usePathname();
    const permissions = useRole();

    return (
        <div className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header - Clean, clickable */}
                <div className="flex items-center justify-between py-4">
                    <Link 
                        href="/"
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Central Intelink</h1>
                            <p className="text-sm text-slate-400">Inteligência, administração e relatórios</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation Tabs - Hidden on mobile (use MobileNavBar instead) */}
                <div className="hidden md:flex gap-1 overflow-x-auto pb-0">
                    {NAV_ITEMS.map((item) => {
                        // Check permission if required
                        if (item.requiresPermission && !permissions[item.requiresPermission]) {
                            return null;
                        }
                        
                        // Check super_admin only items
                        if (item.requiresSuperAdmin && permissions.role !== 'super_admin') {
                            return null;
                        }

                        const Icon = item.icon;
                        const isActive = pathname === item.href || 
                            (item.href !== '/central' && pathname?.startsWith(item.href));
                        
                        // Danger highlight for audit-type tabs
                        const isDanger = item.highlight === 'danger';
                        
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                                    isActive 
                                        ? isDanger 
                                            ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500' 
                                            : 'bg-slate-800 text-white border-b-2 border-blue-500' 
                                        : isDanger
                                            ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

