'use client';

/**
 * MobileNavBar - Navegação inferior para mobile
 * 
 * Estilo Instagram/Spotify - 4 botões fixos no rodapé
 * Só aparece em telas < 768px (md breakpoint)
 * 
 * @version 1.0.0
 */

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Search, Bell, Menu, X, Settings, User, LogOut, FileText, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
    icon: React.ElementType;
    label: string;
    href?: string;
    action?: 'search' | 'menu';
}

const NAV_ITEMS: NavItem[] = [
    { icon: LayoutDashboard, label: 'Central', href: '/central' },
    { icon: Search, label: 'Busca', action: 'search' },
    { icon: Bell, label: 'Alertas', href: '/central/alertas' },
    { icon: Menu, label: 'Menu', action: 'menu' },
];

const MENU_ITEMS = [
    { icon: FileText, label: 'Relatórios', href: '/reports' },
    { icon: Shield, label: 'Permissões', href: '/central/permissoes' },
    { icon: Settings, label: 'Configurações', href: '/central/configuracoes' },
    { icon: User, label: 'Perfil', href: '/profile' },
];

interface MobileNavBarProps {
    onSearchOpen?: () => void;
}

export default function MobileNavBar({ onSearchOpen }: MobileNavBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    // Fecha menu ao mudar de rota
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    const handleNavClick = (item: NavItem) => {
        if (item.action === 'search') {
            // Dispatch evento global para abrir busca
            window.dispatchEvent(new CustomEvent('global-search-open'));
            onSearchOpen?.();
        } else if (item.action === 'menu') {
            setMenuOpen(!menuOpen);
        } else if (item.href) {
            router.push(item.href);
        }
    };

    const isActive = (item: NavItem) => {
        if (!item.href) return false;
        if (item.href === '/central') {
            return pathname === '/central' || pathname === '/';
        }
        return pathname.startsWith(item.href);
    };

    return (
        <>
            {/* Menu Drawer */}
            {menuOpen && (
                <div className="fixed inset-0 z-[55] md:hidden">
                    {/* Backdrop - more blur to keep context visible */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-md"
                        onClick={() => setMenuOpen(false)}
                    />
                    
                    {/* Drawer */}
                    <div className="absolute bottom-16 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 animate-slide-up">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                            <span className="text-lg font-semibold text-white">Menu</span>
                            <button 
                                onClick={() => setMenuOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="space-y-1">
                            {MENU_ITEMS.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => {
                                        router.push(item.href);
                                        setMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                                        ${pathname === item.href 
                                            ? 'bg-cyan-500/20 text-cyan-400' 
                                            : 'text-slate-300 hover:bg-slate-800'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950 border-t border-slate-700 safe-area-bottom">
                <div className="grid grid-cols-4 h-16">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item);
                        return (
                            <button
                                key={item.label}
                                onClick={() => handleNavClick(item)}
                                className={`flex flex-col items-center justify-center gap-1 transition-colors
                                    ${active 
                                        ? 'text-cyan-400' 
                                        : 'text-slate-400 hover:text-slate-200 active:text-cyan-400'
                                    }`}
                            >
                                <item.icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
