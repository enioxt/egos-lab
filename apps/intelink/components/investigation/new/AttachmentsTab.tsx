'use client';

/**
 * AttachmentsTab - File attachments management
 * Reutiliza DocumentUploadModal para consistência
 * ~200 lines
 */

import { useState } from 'react';
import { FileText, FileSearch, Users, Camera, Video, Paperclip, Upload, X, CheckCircle2, Info } from 'lucide-react';
import { Attachment, AttachmentType, EntityInput } from './types';
import DocumentUploadModal from '@/components/intelink/DocumentUploadModal';
import { DocumentType } from '@/components/intelink/DocumentActionButtons';
import { MAX_FILE_SIZE_DISPLAY, MAX_FILES_PER_BATCH } from '@/lib/upload-config';

interface AttachmentsTabProps {
    attachments: Attachment[];
    addAttachment: (type: AttachmentType) => void;
    updateAttachment: (id: string, name: string) => void;
    removeAttachment: (id: string) => void;
    // Novos callbacks para extrair entidades do documento
    onEntitiesExtracted?: (entities: EntityInput[]) => void;
    onDocumentProcessed?: (result: any) => void;
}

const ATTACHMENT_TYPES = [
    { type: 'ocorrencia' as AttachmentType, label: 'Ocorrência (REDS)', icon: FileText, color: 'text-red-400', bgColor: 'bg-red-600' },
    { type: 'relatorio' as AttachmentType, label: 'Relatório de Serviço', icon: FileSearch, color: 'text-blue-400', bgColor: 'bg-blue-600' },
    { type: 'depoimento' as AttachmentType, label: 'Depoimento', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-600' },
    { type: 'foto' as AttachmentType, label: 'Foto', icon: Camera, color: 'text-emerald-400', bgColor: 'bg-emerald-600' },
    { type: 'video' as AttachmentType, label: 'Vídeo', icon: Video, color: 'text-pink-400', bgColor: 'bg-pink-600' },
    { type: 'documento' as AttachmentType, label: 'Outro Documento', icon: Paperclip, color: 'text-slate-400', bgColor: 'bg-slate-600' },
];

const ATTACHMENT_ICONS: Record<AttachmentType, typeof FileText> = {
    ocorrencia: FileText,
    relatorio: FileSearch,
    depoimento: Users,
    foto: Camera,
    video: Video,
    documento: Paperclip,
};

const ATTACHMENT_COLORS: Record<AttachmentType, string> = {
    ocorrencia: 'text-red-400',
    relatorio: 'text-blue-400',
    depoimento: 'text-purple-400',
    foto: 'text-emerald-400',
    video: 'text-pink-400',
    documento: 'text-slate-400',
};

// Mapeamento de AttachmentType para DocumentType do modal
const ATTACHMENT_TO_DOC_TYPE: Record<string, DocumentType> = {
    'ocorrencia': 'reds',
    'relatorio': 'cs',
    'depoimento': 'depoimento',
    'foto': 'livre',
    'video': 'livre',
    'documento': 'livre',
};

export function AttachmentsTab({ 
    attachments, 
    addAttachment, 
    updateAttachment, 
    removeAttachment,
    onEntitiesExtracted,
    onDocumentProcessed 
}: AttachmentsTabProps) {
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>('reds');
    const [processedDocs, setProcessedDocs] = useState<any[]>([]);

    const handleTypeClick = (type: AttachmentType) => {
        // Abrir modal com o tipo correto
        const docType = ATTACHMENT_TO_DOC_TYPE[type] || 'livre';
        setSelectedDocType(docType);
        setIsModalOpen(true);
    };

    const handleDocumentSuccess = (result: any) => {
        // Adicionar à lista de processados
        setProcessedDocs(prev => [...prev, result]);
        
        // Callback para entidades extraídas
        if (onEntitiesExtracted && result.created) {
            console.log('Document processed:', result);
        }
        
        onDocumentProcessed?.(result);
    };

    return (
        <div className="space-y-6">
            {/* Info banner sobre limites */}
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="text-sm text-blue-300">
                    <strong>Upload inteligente:</strong> Máx. {MAX_FILES_PER_BATCH} arquivos por vez, {MAX_FILE_SIZE_DISPLAY} cada.
                    Documentos são processados por IA para extrair entidades automaticamente.
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Anexos e Documentos</h2>
                </div>

                {/* Add buttons */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {ATTACHMENT_TYPES.map(({ type, label, icon: Icon, bgColor }) => (
                        <button
                            key={type}
                            onClick={() => handleTypeClick(type)}
                            className={`flex items-center gap-2 p-3 ${bgColor} hover:opacity-90 rounded-lg text-sm font-medium transition-opacity`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Attachments list */}
                {/* Documentos Processados */}
                {processedDocs.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {processedDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-emerald-300">Documento Processado</p>
                                    <p className="text-xs text-slate-400">
                                        {doc.created?.entities || 0} entidades • {doc.created?.evidences || 0} evidências • {doc.created?.findings || 0} achados
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {processedDocs.length === 0 && attachments.length === 0 && (
                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-600 rounded-xl">
                        <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhum documento processado.</p>
                        <p className="text-sm mt-1">Clique em <strong>Ocorrência (REDS)</strong> para começar a operação.</p>
                        <p className="text-xs mt-2 text-slate-600">
                            Entidades serão extraídas automaticamente do documento.
                        </p>
                    </div>
                )}

                {/* Legacy attachments list */}
                {attachments.length > 0 && (
                    <div className="space-y-3">
                        {attachments.map(attachment => {
                            const Icon = ATTACHMENT_ICONS[attachment.type];
                            const color = ATTACHMENT_COLORS[attachment.type];
                            
                            return (
                                <div key={attachment.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                                    <div className="p-2 bg-slate-600 rounded-lg">
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Nome/Descrição do anexo"
                                            value={attachment.name}
                                            onChange={(e) => updateAttachment(attachment.id, e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeAttachment(attachment.id)} 
                                        className="p-2 hover:bg-red-500/20 rounded"
                                    >
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Document Upload Modal (reutilizado) */}
            <DocumentUploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                investigationId="temp-new" // Placeholder para nova operação
                documentType={selectedDocType}
                onSuccess={handleDocumentSuccess}
            />
        </div>
    );
}
