'use client';

/**
 * JourneyReportModal - Modal for displaying Journey Analysis Report
 * 
 * Shows the timeline of steps and AI analysis insights.
 */

import React, { useState } from 'react';
import { 
    X, 
    Sparkles, 
    Loader2, 
    User, 
    Car, 
    MapPin, 
    Building2,
    FileText,
    Send,
    ChevronRight,
    Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJourneySafe } from '@/providers/JourneyContext';

// Entity type icons
const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    PERSON: User,
    VEHICLE: Car,
    LOCATION: MapPin,
    ORGANIZATION: Building2,
    COMPANY: Building2,
    default: FileText,
};

interface JourneyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function JourneyReportModal({ isOpen, onClose }: JourneyReportModalProps) {
    const router = useRouter();
    const { journey, stepCount, requestAnalysis } = useJourneySafe();
    
    const [context, setContext] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(journey?.aiAnalysis || null);
    const [error, setError] = useState<string | null>(null);
    
    if (!isOpen) return null;
    
    const getIcon = (type: string) => {
        const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
        return <Icon className="w-4 h-4" />;
    };
    
    const handleAnalyze = async () => {
        if (!context.trim()) {
            setError('Informe o contexto da investigação');
            return;
        }
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            const result = await requestAnalysis(context);
            if (result) {
                setAnalysis(result);
            } else {
                setError('Falha na análise. Tente novamente.');
            }
        } catch (e) {
            setError('Erro ao processar análise');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleSendToChat = () => {
        if (analysis) {
            // Store analysis in sessionStorage and navigate to chat
            sessionStorage.setItem('journey_analysis_context', analysis);
            router.push('/chat?source=journey');
            onClose();
        }
    };
    
    const handleExportPDF = async () => {
        if (!journey) return;
        
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            const timestamp = new Date().toLocaleString('pt-BR');
            let y = 20;
            
            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Diário de Bordo - INTELINK', 15, y);
            y += 10;
            
            // Metadata
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${timestamp}`, 15, y);
            y += 5;
            doc.text(`Passos: ${stepCount}`, 15, y);
            y += 10;
            
            // Context
            if (context) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Contexto da Investigação:', 15, y);
                y += 6;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const contextLines = doc.splitTextToSize(context, 180);
                for (const line of contextLines) {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(line, 15, y);
                    y += 5;
                }
                y += 5;
            }
            
            // Steps
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Trajeto Percorrido:', 15, y);
            y += 8;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            for (const step of journey.steps) {
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(`${step.stepNumber}. [${step.entityType}] ${step.entityName}`, 15, y);
                y += 5;
                if (step.relationshipType) {
                    doc.text(`   via: ${step.relationshipType}`, 15, y);
                    y += 5;
                }
            }
            y += 10;
            
            // Analysis
            if (analysis) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Análise da IA:', 15, y);
                y += 8;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const analysisLines = doc.splitTextToSize(analysis, 180);
                for (const line of analysisLines) {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(line, 15, y);
                    y += 5;
                }
            }
            
            doc.save(`jornada_intelink_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('[JourneyReport] PDF export error:', error);
        }
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Diário de Bordo Inteligente
                            </h2>
                            <p className="text-sm text-slate-400">
                                {stepCount} passos registrados
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex h-[60vh]">
                    {/* Left: Timeline */}
                    <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">
                            Trajeto Percorrido
                        </h3>
                        
                        <div className="space-y-2">
                            {journey?.steps.map((step, i) => (
                                <div 
                                    key={i}
                                    className="flex items-start gap-2 p-2 bg-slate-800/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs text-slate-500 w-5">
                                            {step.stepNumber}.
                                        </span>
                                        <div className="text-slate-400">
                                            {getIcon(step.entityType)}
                                        </div>
                                        <span className="text-sm text-white truncate">
                                            {step.entityName}
                                        </span>
                                    </div>
                                    {step.relationshipType && (
                                        <span className="text-xs text-slate-500 shrink-0">
                                            via {step.relationshipType}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Right: Analysis */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {!analysis ? (
                            <div className="h-full flex flex-col">
                                <h3 className="text-sm font-medium text-slate-400 mb-3">
                                    Contexto da Investigação
                                </h3>
                                
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Descreva o que você está investigando... Ex: Homicídio em Patos de Minas, vítima homem trans, veículo Gol Prata visto no local."
                                    className="flex-1 w-full p-4 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                                    rows={5}
                                />
                                
                                {error && (
                                    <p className="text-sm text-red-400 mt-2">{error}</p>
                                )}
                                
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !context.trim()}
                                    className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Analisando com IA...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Gerar Análise Inteligente
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-400">
                                        Análise da IA
                                    </h3>
                                    <button
                                        onClick={() => setAnalysis(null)}
                                        className="text-xs text-slate-500 hover:text-slate-400"
                                    >
                                        Nova análise
                                    </button>
                                </div>
                                
                                {/* Analysis text */}
                                <div className="flex-1 overflow-y-auto bg-slate-800/50 rounded-lg p-4">
                                    <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">
                                        {analysis}
                                    </pre>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSendToChat}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                        Enviar para Chat
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JourneyReportModal;
