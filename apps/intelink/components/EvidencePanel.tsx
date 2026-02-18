'use client';

/**
 * INTELINK - Evidence Panel
 * 
 * Displays evidence/documents attached to an investigation.
 * Supports viewing, downloading, and extracting info from files.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import { useState, useEffect } from 'react';
import { 
    FileText, 
    Image, 
    FileAudio, 
    Download, 
    Eye, 
    ChevronDown, 
    ChevronRight,
    Upload,
    AlertCircle,
    CheckCircle,
    Clock,
    File
} from 'lucide-react';

interface Evidence {
    id: string;
    name: string;
    type: string;
    file_type: string;
    file_url?: string;
    size?: number;
    created_at: string;
    extracted_text?: string;
    entities_extracted?: number;
    status: 'pending' | 'processing' | 'completed' | 'error';
}

interface EvidencePanelProps {
    investigationId: string;
    onEvidenceClick?: (evidence: Evidence) => void;
    onUploadClick?: () => void;
}

export default function EvidencePanel({ investigationId, onEvidenceClick, onUploadClick }: EvidencePanelProps) {
    const [evidence, setEvidence] = useState<Evidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvidence();
    }, [investigationId]);

    const fetchEvidence = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/investigation/${investigationId}/evidence`);
            
            if (!response.ok) {
                throw new Error('Falha ao carregar evidências');
            }
            
            const data = await response.json();
            setEvidence(data.evidence || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setEvidence([]);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
        if (fileType.includes('audio')) return <FileAudio className="h-5 w-5 text-purple-500" />;
        if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
        return <File className="h-5 w-5 text-gray-500" />;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'processing':
                return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDownload = async (e: React.MouseEvent, ev: Evidence) => {
        e.stopPropagation();
        if (ev.file_url) {
            window.open(ev.file_url, '_blank');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidências
                </h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-800 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 rounded-lg p-4 border border-red-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidências
                </h3>
                <div className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidências
                    <span className="text-sm text-gray-400 font-normal">
                        ({evidence.length})
                    </span>
                </h3>
                <button 
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    onClick={onUploadClick}
                    disabled={!onUploadClick}
                >
                    <Upload className="h-4 w-4" />
                    Adicionar
                </button>
            </div>

            {evidence.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma evidência anexada</p>
                    <p className="text-sm mt-1">Clique em "Adicionar" para anexar documentos</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {evidence.map((ev) => (
                        <div 
                            key={ev.id}
                            className="bg-gray-800 rounded-lg overflow-hidden"
                        >
                            {/* Main Row */}
                            <div 
                                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-750"
                                onClick={() => onEvidenceClick ? onEvidenceClick(ev) : toggleExpand(ev.id)}
                            >
                                {/* Expand Arrow */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(ev.id);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {expandedId === ev.id ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>

                                {/* File Icon */}
                                {getFileIcon(ev.file_type)}

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {ev.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(ev.size)} • {new Date(ev.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(ev.status)}
                                    
                                    {ev.entities_extracted && ev.entities_extracted > 0 && (
                                        <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">
                                            {ev.entities_extracted} entidades
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => handleDownload(e, ev)}
                                        className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700"
                                        title="Download"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEvidenceClick?.(ev);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700"
                                        title="Visualizar"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedId === ev.id && (
                                <div className="px-4 pb-3 border-t border-gray-700">
                                    <div className="pt-3 space-y-2">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase">Tipo</span>
                                            <p className="text-sm text-gray-300">{ev.type}</p>
                                        </div>
                                        
                                        {ev.extracted_text && (
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase">Texto Extraído</span>
                                                <p className="text-sm text-gray-300 line-clamp-3">
                                                    {ev.extracted_text}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                                                Extrair com IA
                                            </button>
                                            <button className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded">
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
