'use client';

/**
 * JourneyFABGlobal - Global Floating Action Button for Investigation Journey
 * 
 * v2.0 - Redesigned:
 * - Clean circular button
 * - Hover tooltip with explanation
 * - Click to expand panel
 * - Draggable from panel header
 * - Works across ALL pages
 */

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
    Footprints,
    Sparkles, 
    X, 
    User, 
    Car, 
    MapPin, 
    Building2,
    FileText,
    ChevronDown
} from 'lucide-react';
import { useJourneySafe } from '@/providers/JourneyContext';
import JourneyReportModal from './JourneyReportModal';
import JourneyReplayModal from './JourneyReplayModal';
import JourneyCompareModal from './JourneyCompareModal';
import Link from 'next/link';

// Pages where FAB should NOT appear (security + UX)
const HIDDEN_PAGES = ['/login', '/offline', '/api'];

// Entity type icons
const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    default: FileText,
};

const POSITION_STORAGE_KEY = 'intelink_fab_position';

export function JourneyFABGlobal() {
    const pathname = usePathname();
    
    const { 
        journey, 
        isRecording, 
        stepCount, 
        getLastSteps,
        endJourney,
        clearJourney,
    } = useJourneySafe();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [showReplay, setShowReplay] = useState(false);
    const [showCompare, setShowCompare] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    
    // Draggable state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
    
    // SECURITY: Don't show FAB on login/public pages
    const isHiddenPage = HIDDEN_PAGES.some(page => pathname?.startsWith(page));
    
    // Load hidden state from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hidden = localStorage.getItem('journey_fab_hidden');
        setIsHidden(hidden === 'true');
    }, []);
    
    // When step count increases, show FAB again
    useEffect(() => {
        if (stepCount > 0 && isHidden) {
            setIsHidden(false);
            localStorage.removeItem('journey_fab_hidden');
        }
    }, [stepCount, isHidden]);
    
    // Handle hide FAB
    const handleHideFAB = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsHidden(true);
        localStorage.setItem('journey_fab_hidden', 'true');
    };
    
    // Calculate panel expansion direction based on position
    const [panelDirection, setPanelDirection] = useState<'up-left' | 'up-right' | 'down-left' | 'down-right'>('up-left');
    
    // Load saved position
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const saved = localStorage.getItem(POSITION_STORAGE_KEY);
        if (saved) {
            try {
                const pos = JSON.parse(saved);
                setPosition(pos);
            } catch {
                // Default position (bottom-right)
                setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
            }
        } else {
            // Default position
            setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
        }
    }, []);
    
    // Save position on change and calculate panel direction
    useEffect(() => {
        if (position.x !== 0 || position.y !== 0) {
            localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
            
            // Calculate best direction for panel expansion
            if (typeof window !== 'undefined') {
                const isRight = position.x > window.innerWidth / 2;
                const isBottom = position.y > window.innerHeight / 2;
                
                if (isRight && isBottom) setPanelDirection('up-left');
                else if (isRight && !isBottom) setPanelDirection('down-left');
                else if (!isRight && isBottom) setPanelDirection('up-right');
                else setPanelDirection('down-right');
            }
        }
    }, [position]);
    
    // Keep FAB inside viewport on window resize
    useEffect(() => {
        const handleResize = () => {
            const fabSize = 56;
            const margin = 10;
            const maxX = window.innerWidth - fabSize - margin;
            const maxY = window.innerHeight - fabSize - margin - 64;
            
            setPosition(prev => ({
                x: Math.max(margin, Math.min(maxX, prev.x)),
                y: Math.max(margin, Math.min(maxY, prev.y)),
            }));
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Drag handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Don't prevent default for click to work
        setIsDragging(true);
        setHasDragged(false); // Reset drag flag
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        dragStartRef.current = {
            x: clientX,
            y: clientY,
            posX: position.x,
            posY: position.y,
        };
    };
    
    useEffect(() => {
        if (!isDragging) return;
        
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - dragStartRef.current.x;
            const deltaY = clientY - dragStartRef.current.y;
            
            // Only count as dragged if moved more than 5px
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                setHasDragged(true);
            }
            
            // Ensure FAB stays within viewport with safe margins
            const fabSize = 56; // w-14 = 56px
            const margin = 10;
            const maxX = window.innerWidth - fabSize - margin;
            const maxY = window.innerHeight - fabSize - margin - 64; // 64px for mobile nav bar
            
            const newX = Math.max(margin, Math.min(maxX, dragStartRef.current.posX + deltaX));
            const newY = Math.max(margin, Math.min(maxY, dragStartRef.current.posY + deltaY));
            
            setPosition({ x: newX, y: newY });
        };
        
        const handleEnd = () => {
            setIsDragging(false);
            // hasDragged stays true until next drag start
        };
        
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);
        
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);
    
    // SECURITY: Don't render on login/public pages
    if (isHiddenPage) {
        return null;
    }
    
    // Don't render if not recording and no steps
    if (!isRecording && stepCount === 0) {
        return null;
    }
    
    // Calculate panel position - panel expands from FAB, FAB stays fixed
    const getPanelStyle = (): React.CSSProperties => {
        const panelWidth = 288; // w-72 = 18rem = 288px
        const panelHeight = 450;
        const fabSize = 56; // FAB button size
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const margin = 20; // margin from screen edges
        
        // Calculate available space from FAB position
        const spaceAbove = position.y;
        const spaceBelow = viewportHeight - position.y - fabSize;
        const spaceLeft = position.x;
        const spaceRight = viewportWidth - position.x - fabSize;
        
        // Determine best position for panel
        const expandUp = spaceBelow < panelHeight && spaceAbove > spaceBelow;
        const expandLeft = spaceRight < panelWidth && spaceLeft > spaceRight;
        
        const style: React.CSSProperties = {
            position: 'absolute',
            maxHeight: `${Math.min(panelHeight, viewportHeight - margin * 2)}px`,
        };
        
        // Vertical positioning
        if (expandUp) {
            // Panel appears ABOVE the FAB
            style.bottom = fabSize + 8; // 8px gap
            style.top = 'auto';
        } else {
            // Panel appears BELOW the FAB (or at same level)
            style.top = 0;
            style.bottom = 'auto';
        }
        
        // Horizontal positioning
        if (expandLeft) {
            // Panel expands to the LEFT
            style.right = 0;
            style.left = 'auto';
        } else {
            // Panel expands to the RIGHT (default)
            style.left = 0;
            style.right = 'auto';
        }
        
        return style;
    };
    
    const lastSteps = getLastSteps(3);
    
    const getIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
        return <Icon className="w-3 h-3" />;
    };
    
    const handleAnalyze = () => {
        setIsExpanded(false);
        setShowReport(true);
    };
    
    // Don't render if hidden by user
    if (isHidden || isHiddenPage) {
        return null;
    }
    
    return (
        <>
            {/* FAB Container - Always at fixed position */}
            <div 
                ref={dragRef}
                className="fixed z-50 group/fab"
                style={{ 
                    left: position.x, 
                    top: position.y,
                }}
            >
                {/* Close Button - subtle X on hover */}
                <button
                    onClick={handleHideFAB}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-slate-800 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/fab:opacity-100 transition-all z-10 border border-slate-600 shadow-lg"
                    title="Ocultar (volta quando houver novos passos)"
                >
                    <X className="w-3 h-3 text-slate-400 hover:text-white" />
                </button>
                
                {/* FAB Button - Always visible */}
                <div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    onClick={(e) => {
                        if (!hasDragged) {
                            setIsExpanded(!isExpanded);
                        }
                        setHasDragged(false);
                    }}
                    onMouseEnter={() => !isDragging && !isExpanded && setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`relative cursor-grab active:cursor-grabbing ${isExpanded ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    <div className={`
                        w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 select-none
                        ${isRecording 
                            ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 shadow-cyan-500/30' 
                            : 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/50'
                        }
                    `}>
                        <Footprints className="w-6 h-6 text-white pointer-events-none" />
                        {stepCount > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg pointer-events-none">
                                {stepCount}
                            </div>
                        )}
                        {isRecording && (
                            <div className="absolute inset-0 rounded-full bg-cyan-400/20 pointer-events-none" style={{ animation: 'subtlePulse 2s ease-in-out infinite' }} />
                        )}
                    </div>
                    
                    {/* Tooltip */}
                    {showTooltip && !isDragging && (
                        <div className="absolute bottom-full mb-2 right-0 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                            {isRecording ? '✓ Jornada Completa' : 'Jornada Completa'}
                            <span className="text-slate-400 ml-1">• {stepCount} passos</span>
                        </div>
                    )}
                </div>
                
                {/* Expanded Panel - Positioned relative to FAB */}
                {isExpanded && (
                    <div 
                        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-72 animate-in fade-in duration-200 overflow-hidden flex flex-col"
                        style={getPanelStyle()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="text-sm font-medium text-white">
                                    {isRecording ? 'Rastreando Jornada' : 'Jornada Completa'}
                                </span>
                            </div>
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-1">
                            {/* Stats */}
                            <div className="bg-slate-900/50 rounded-xl p-3 mb-4">
                                <div className="text-xs text-slate-400 mb-1">Passos registrados</div>
                                <div className="text-3xl font-bold text-cyan-400">{stepCount}</div>
                            </div>
                            
                            {/* Last Steps */}
                            {lastSteps.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-xs text-slate-400 mb-2">Últimos passos</div>
                                    <div className="space-y-1.5">
                                        {lastSteps.map((step, i) => (
                                            <div 
                                                key={`step-${step.stepNumber}-${i}`}
                                                className="flex items-center gap-2 text-xs bg-slate-900/30 rounded-lg px-3 py-2"
                                            >
                                                <span className="text-slate-500 font-mono">{step.stepNumber}.</span>
                                                {getIcon(step.entityType)}
                                                <span className="text-slate-300 truncate flex-1">
                                                    {step.entityName}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={stepCount < 2}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Analisar com IA
                                </button>
                                {isRecording && (
                                    <button
                                        onClick={() => endJourney()}
                                        className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Finalizar
                                    </button>
                                )}
                            </div>
                            
                            {/* Link to History */}
                            <Link
                                href="/reports"
                                className="block w-full mt-3 text-center text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                onClick={() => setIsExpanded(false)}
                            >
                                📋 Ver todas as jornadas em Relatórios
                            </Link>
                            
                            {/* Replay Saved Journeys */}
                            <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    setShowReplay(true);
                                }}
                                className="w-full mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                🎬 Reproduzir jornada salva
                            </button>
                            
                            {/* Compare Journeys */}
                            <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    setShowCompare(true);
                                }}
                                className="w-full mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                🔀 Comparar jornadas
                            </button>
                            
                            {/* Clear */}
                            {!isRecording && (
                                <button
                                    onClick={() => clearJourney()}
                                    className="w-full mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
                                >
                                    Limpar e iniciar nova jornada
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                {/* CSS for subtle pulse */}
                <style jsx>{`
                    @keyframes subtlePulse {
                        0%, 100% { transform: scale(1); opacity: 0.2; }
                        50% { transform: scale(1.15); opacity: 0.4; }
                    }
                `}</style>
            </div>
            
            {/* Journey Report Modal */}
            <JourneyReportModal 
                isOpen={showReport}
                onClose={() => setShowReport(false)}
            />
            
            {/* Journey Replay Modal */}
            <JourneyReplayModal 
                isOpen={showReplay}
                onClose={() => setShowReplay(false)}
            />
            
            {/* Journey Compare Modal */}
            <JourneyCompareModal 
                isOpen={showCompare}
                onClose={() => setShowCompare(false)}
            />
        </>
    );
}

export default JourneyFABGlobal;
