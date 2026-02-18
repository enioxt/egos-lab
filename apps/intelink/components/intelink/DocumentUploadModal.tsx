'use client';

/**
 * DocumentUploadModal - Modal para upload e extração de documentos
 * 
 * Fluxo:
 * 1. Upload de arquivo OU texto livre
 * 2. Extração de texto (PDF/DOCX)
 * 3. Análise por LLM
 * 4. Preview de entidades extraídas
 * 5. Revisão e aprovação
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
    X, Upload, FileText, Loader2, AlertTriangle,
    CheckCircle2, Users, Car, MapPin, Building2,
    Target, Phone, ChevronRight, Save, RotateCcw, Mic, Info, Files, Brain,
    Edit3, Check, Trash2
} from 'lucide-react';
import { ENTITY_TYPE_LABELS, EVIDENCE_TYPE_LABELS } from '@/lib/constants';
import { 
    MAX_FILE_SIZE_DISPLAY, 
    MAX_FILES_PER_BATCH, 
    ACCEPTED_EXTENSIONS,
    formatFileSize,
    validateFile 
} from '@/lib/upload-config';
import { DocumentType } from './DocumentActionButtons';
import { useProcessingCheckpoint } from '@/hooks/useProcessingCheckpoint';
import {
    UPLOAD_TYPE_CONFIG,
    ENTITY_ICONS,
    ENTITY_COLORS,
    Step,
    DuplicateMatch,
    CheckingStep,
    ExtractingStep,
    SavingStep,
    ErrorStep,
    SuccessStep,
    DuplicateWarningStep
} from '@/components/document-upload';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    investigationId: string;
    documentType: DocumentType;
    onSuccess?: (result: any) => void;
}

// Types and constants imported from @/components/document-upload

export default function DocumentUploadModal({
    isOpen,
    onClose,
    investigationId,
    documentType,
    onSuccess
}: DocumentUploadModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [files, setFiles] = useState<File[]>([]);
    const [fileErrors, setFileErrors] = useState<string[]>([]);
    const [freeText, setFreeText] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [saveResult, setSaveResult] = useState<any>(null);
    
    // Editable document title
    const [documentTitle, setDocumentTitle] = useState('');
    
    // Editable historico (for when AI extraction is poor)
    const [isEditingHistorico, setIsEditingHistorico] = useState(false);
    const [editedHistorico, setEditedHistorico] = useState('');
    
    // Inline entity editing
    const [editingEntityIdx, setEditingEntityIdx] = useState<number | null>(null);
    const [editingEntityData, setEditingEntityData] = useState<any>(null);
    
    // Duplicate detection
    const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
    const [forceProcess, setForceProcess] = useState(false);
    const [fileHash, setFileHash] = useState<string | null>(null);
    
    // Batch processing progress
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentFileName: '' });
    
    // Batch extraction results (for review before save)
    const [batchExtractions, setBatchExtractions] = useState<Array<{
        file: File;
        fileHash: string;
        extraction: any;
        stats: any;
    }>>([]);
    
    // Processing checkpoint for resume capability
    const { 
        checkpoint, 
        saveCheckpoint, 
        clearCheckpoint, 
        hasUnfinishedWork 
    } = useProcessingCheckpoint<{
        fileNames: string[];
        processedCount: number;
        extractions: any[];
    }>('document-upload', investigationId);
    
    // Entity Matching State
    const [entityMatches, setEntityMatches] = useState<any[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    
    // Ref para o input de arquivo
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Guardian AI state
    const [guardianResult, setGuardianResult] = useState<any>(null);
    const [isCheckingGuardian, setIsCheckingGuardian] = useState(false);
    const [guardianAutoRan, setGuardianAutoRan] = useState(false);
    
    // Connection checking state
    const [isCheckingConnections, setIsCheckingConnections] = useState(false);
    const [connectionResults, setConnectionResults] = useState<Record<string, any[]>>({});
    
    // Auto-save state
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
    const AUTOSAVE_KEY = `intelink_draft_${investigationId}_${documentType}`;

    // Auto-save to localStorage with debounce
    useEffect(() => {
        if (!freeText || freeText.length < 10) return;
        
        // Clear previous timeout
        if (autoSaveRef.current) {
            clearTimeout(autoSaveRef.current);
        }
        
        // Save after 3 seconds of inactivity
        autoSaveRef.current = setTimeout(() => {
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
                    text: freeText,
                    timestamp: new Date().toISOString(),
                    documentType
                }));
                setLastSaved(new Date());
            } catch (e) {
                console.warn('Auto-save failed:', e);
            }
        }, 3000);
        
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [freeText, AUTOSAVE_KEY, documentType]);

    // Reset state when modal opens - restore draft if exists
    useEffect(() => {
        if (isOpen) {
            setStep('upload');
            setFiles([]);
            setFileErrors([]);
            setExtractedData(null);
            setError(null);
            setSaveResult(null);
            setDuplicateMatches([]);
            setForceProcess(false);
            setFileHash(null);
            setEntityMatches([]);
            setLastSaved(null);
            setDocumentTitle('');
            
            // Restore draft from localStorage
            try {
                const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
                if (savedDraft) {
                    const draft = JSON.parse(savedDraft);
                    const savedTime = new Date(draft.timestamp);
                    const hoursSinceSave = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
                    
                    // Only restore if less than 24 hours old
                    if (hoursSinceSave < 24 && draft.text) {
                        setFreeText(draft.text);
                        setLastSaved(savedTime);
                    } else {
                        // Clear old draft
                        localStorage.removeItem(AUTOSAVE_KEY);
                        setFreeText('');
                    }
                } else {
                    setFreeText('');
                }
            } catch (e) {
                setFreeText('');
            }
        }
    }, [isOpen, AUTOSAVE_KEY]);

    // AUTO-PILOT: Guardian AI runs automatically when entering review step
    useEffect(() => {
        if (step === 'review' && extractedData && !guardianAutoRan && !isCheckingGuardian) {
            setGuardianAutoRan(true);
            // Small delay to let UI render first
            const timer = setTimeout(() => {
                handleGuardianCheckAuto(extractedData);
            }, 500);
            return () => clearTimeout(timer);
        }
        // Reset flag when leaving review
        if (step !== 'review') {
            setGuardianAutoRan(false);
        }
    }, [step, extractedData, guardianAutoRan, isCheckingGuardian]);

    // Effect for entity matching on free text change
    useEffect(() => {
        if (documentType !== 'livre' || !freeText || freeText.length < 20) {
            setEntityMatches([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsMatching(true);
            try {
                const res = await fetch('/api/intelink/match-entities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: freeText })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    // Only show high confidence matches
                    setEntityMatches((data.matches || []).filter((m: any) => m.dbEntity || m.candidate.confidence > 80));
                }
            } catch (error) {
                console.error('Matching error:', error);
            } finally {
                setIsMatching(false);
            }
        }, 1000); // 1s debounce

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [freeText, documentType]);

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const typeInfo = UPLOAD_TYPE_CONFIG[documentType] || UPLOAD_TYPE_CONFIG.reds;

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const addFiles = (newFiles: File[]) => {
        const errors: string[] = [];
        const validFiles: File[] = [];
        
        newFiles.forEach(f => {
            const result = validateFile(f);
            if (result.valid) {
                validFiles.push(f);
            } else if (result.error) {
                errors.push(`${f.name}: ${result.error}`);
            }
        });
        
        const totalFiles = files.length + validFiles.length;
        if (totalFiles > MAX_FILES_PER_BATCH) {
            errors.push(`Máximo ${MAX_FILES_PER_BATCH} arquivos por vez.`);
            validFiles.splice(MAX_FILES_PER_BATCH - files.length);
        }
        
        setFiles(prev => [...prev, ...validFiles]);
        setFileErrors(errors);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        addFiles(selectedFiles);
    };

    // Verificar duplicatas antes de processar
    const checkForDuplicates = async (): Promise<boolean> => {
        // Skip for free text or new investigations
        if (documentType === 'livre' || files.length === 0 || investigationId === 'temp-new') {
            return false;
        }

        try {
            const formData = new FormData();
            formData.append('file', files[0]);
            formData.append('investigation_id', investigationId);

            const res = await fetch('/api/documents/check-duplicate', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                console.warn('Duplicate check failed, continuing anyway');
                return false;
            }

            const data = await res.json();
            
            if (data.isDuplicate && data.matches?.length > 0) {
                setDuplicateMatches(data.matches);
                return true;
            }

            return false;
        } catch (err) {
            console.error('Error checking duplicates:', err);
            return false;
        }
    };

    // Processar documento (após confirmação de duplicata se necessário)
    const handleProcess = async (skipDuplicateCheck = false) => {
        setError(null);

        // Se não está forçando e não fez check ainda, verifica duplicatas
        if (!skipDuplicateCheck && !forceProcess && files.length > 0 && documentType !== 'livre') {
            const hasDuplicates = await checkForDuplicates();
            if (hasDuplicates) return; // Vai para tela de confirmação
        }

        setStep('extracting');

        try {
            // Para texto livre, processa direto
            if (documentType === 'livre' || files.length === 0) {
                if (!freeText || freeText.trim().length < 50) {
                    throw new Error('Texto muito curto para extração. Mínimo 50 caracteres.');
                }
                
                const extractRes = await fetch('/api/documents/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: freeText,
                        document_type: documentType,
                        investigation_id: investigationId,
                    }),
                });

                if (!extractRes.ok) {
                    const errData = await extractRes.json();
                    throw new Error(errData.error || 'Erro na extração');
                }

                const data = await extractRes.json();
                setExtractedData(data.result);
                setStats(data.stats);
                setStep('review');
                return;
            }

            // BATCH PROCESSING: Extract all files FIRST, then go to review
            const extractions: typeof batchExtractions = [];
            
            setBatchProgress({ current: 0, total: files.length, currentFileName: '' });

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setBatchProgress({ current: i + 1, total: files.length, currentFileName: `${file.name} (Extraindo texto...)` });
                
                // 1. Upload do arquivo para extrair texto
                const formData = new FormData();
                formData.append('file', file);
                formData.append('investigation_id', investigationId);
                formData.append('document_type', documentType);
                if (forceProcess) {
                    formData.append('force', 'true');
                }

                const uploadRes = await fetch('/api/documents/upload', {
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                
                if (!uploadRes.ok) {
                    console.error(`Erro no arquivo ${file.name}:`, uploadData.error);
                    continue;
                }

                const textToProcess = uploadData.extraction.text;
                const currentFileHash = uploadData.file?.hash || '';

                if (!textToProcess || textToProcess.trim().length < 50) {
                    console.warn(`Arquivo ${file.name} tem texto muito curto, pulando...`);
                    continue;
                }

                // 2. Extração LLM
                setBatchProgress({ current: i + 1, total: files.length, currentFileName: `${file.name} (Analisando com IA...)` });
                
                const extractRes = await fetch('/api/documents/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: textToProcess,
                        document_type: documentType,
                        investigation_id: investigationId,
                    }),
                });

                if (!extractRes.ok) {
                    console.error(`Erro na extração de ${file.name}`);
                    continue;
                }

                const extractData = await extractRes.json();
                
                // 3. ACCUMULATE extractions for review (DON'T SAVE YET)
                extractions.push({
                    file,
                    fileHash: currentFileHash,
                    extraction: extractData.result,
                    stats: extractData.stats
                });
                
                // 4. SAVE CHECKPOINT for resume capability
                saveCheckpoint(
                    'extracting',
                    {
                        fileNames: files.map(f => f.name),
                        processedCount: extractions.length,
                        extractions: extractions.map(e => ({
                            fileName: e.file.name,
                            fileHash: e.fileHash,
                            extraction: e.extraction,
                            stats: e.stats
                        }))
                    },
                    files.length,
                    extractions.length
                );
            }

            // If we have extractions, go to REVIEW step
            if (extractions.length > 0) {
                setBatchExtractions(extractions);
                
                // For SINGLE file - show full extraction data including historico
                if (extractions.length === 1) {
                    const singleExtraction = extractions[0].extraction;
                    setExtractedData({
                        ...singleExtraction,
                        title: singleExtraction?.title || files[0].name,
                        _batchMode: false,
                        _fileCount: 1
                    });
                    setStats(extractions[0].stats);
                } else {
                    // For MULTIPLE files - show each file's data separately
                    const allEntities = extractions.flatMap(e => e.extraction?.entities || []);
                    const allEvidence = extractions.flatMap(e => e.extraction?.evidence || []);
                    const allRelationships = extractions.flatMap(e => e.extraction?.relationships || []);
                    
                    // Set extractedData with all extractions for batch review
                    setExtractedData({
                        entities: allEntities,
                        evidence: allEvidence,
                        relationships: allRelationships,
                        title: `${extractions.length} documentos`,
                        _batchMode: true,
                        _fileCount: extractions.length,
                        // Include individual files data for per-file review
                        _files: extractions.map(e => ({
                            fileName: e.file.name,
                            title: e.extraction?.title || e.file.name,
                            entities: e.extraction?.entities || [],
                            relationships: e.extraction?.relationships || [],
                            historico_completo: e.extraction?.historico_completo || '',
                            summary: e.extraction?.summary || '',
                            numero_ocorrencia: e.extraction?.numero_ocorrencia || '',
                            natureza: e.extraction?.natureza || ''
                        }))
                    });
                    
                    // Calculate combined stats
                    const combinedStats = {
                        entities: allEntities.length,
                        relationships: allRelationships.length,
                        evidence: allEvidence.length,
                        files: extractions.length
                    };
                    setStats(combinedStats);
                }
                
                // GO TO REVIEW STEP (not save!)
                setStep('review');
            } else {
                throw new Error('Nenhum arquivo pôde ser processado');
            }

        } catch (error: any) {
            console.error('Erro no processamento:', error);
            setError(error.message || 'Erro desconhecido');
            setStep('error');
        }
    };

    // NEW: Save batch extractions after review
    const handleSaveBatch = async () => {
        if (batchExtractions.length === 0) return;
        
        setStep('saving');
        const savedDocuments: any[] = [];
        let totalEntities = 0;
        let totalRelationships = 0;
        const allCrossCaseAlerts: any[] = [];
        
        try {
            for (let i = 0; i < batchExtractions.length; i++) {
                const { file, fileHash: currentFileHash, extraction, stats: extractionStats } = batchExtractions[i];
                setBatchProgress({ current: i + 1, total: batchExtractions.length, currentFileName: `${file.name} (Salvando...)` });
                
                const saveRes = await fetch('/api/documents/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        investigation_id: investigationId,
                        document_type: documentType,
                        extraction: extraction,
                        file_info: {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            hash: currentFileHash
                        },
                        stats: extractionStats
                    }),
                });

                if (saveRes.ok) {
                    const saveData = await saveRes.json();
                    savedDocuments.push({
                        filename: file.name,
                        document_id: saveData.document_id,
                        entities_created: saveData.created?.entities || 0,
                        relationships_created: saveData.created?.relationships || 0,
                    });
                    totalEntities += saveData.created?.entities || 0;
                    totalRelationships += saveData.created?.relationships || 0;
                    
                    if (saveData.cross_case_alerts?.length > 0) {
                        allCrossCaseAlerts.push(...saveData.cross_case_alerts);
                    }
                } else {
                    const errorData = await saveRes.json().catch(() => ({}));
                    if (saveRes.status === 409 && errorData.duplicate) {
                        savedDocuments.push({
                            filename: file.name,
                            duplicate: true,
                            duplicate_message: errorData.message
                        });
                    } else {
                        console.error(`Erro ao salvar ${file.name}:`, errorData);
                    }
                }
            }

            // Verificar se salvamos algo
            if (savedDocuments.length === 0) {
                throw new Error('Nenhum documento foi processado com sucesso. Verifique se os arquivos são válidos.');
            }

            // 4. ANÁLISE DE VÍNCULOS AUTOMÁTICA (se mais de 1 documento ou entidades criadas)
            if (savedDocuments.length > 1 || totalEntities > 3) {
                setBatchProgress({ current: files.length, total: files.length, currentFileName: 'Analisando vínculos cruzados...' });
                
                try {
                    // Trigger cross-case analysis
                    await fetch('/api/central/cross-case-alerts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            investigation_id: investigationId,
                            trigger: 'batch_upload'
                        }),
                    });
                } catch (e) {
                    console.warn('Cross-case analysis failed:', e);
                }
            }

            // Resultado final - resumo do batch
            const batchResult = {
                documents_saved: savedDocuments.length,
                documents_failed: files.length - savedDocuments.length,
                total_entities: totalEntities,
                total_relationships: totalRelationships,
                cross_case_alerts: allCrossCaseAlerts.length,
                saved_documents: savedDocuments,
            };

            setExtractedData(batchResult);
            setStats({
                files_processed: savedDocuments.length,
                entities_found: totalEntities,
                relationships_found: totalRelationships,
                cross_case_alerts: allCrossCaseAlerts.length,
            });
            
            // Pular review e ir direto para sucesso (já salvamos tudo)
            const batchSaveResult = {
                success: true,
                message: `${savedDocuments.length} documento(s) processado(s) e salvo(s) com sucesso!`,
                created: {
                    documents: savedDocuments.length,
                    entities: totalEntities,
                    relationships: totalRelationships,
                },
                cross_case_alerts: allCrossCaseAlerts,
            };
            setSaveResult(batchSaveResult);
            setStep('success');
            
            // Clear checkpoint - work completed successfully
            clearCheckpoint();
            
            // IMPORTANT: Call onSuccess to trigger page reload
            onSuccess?.(batchSaveResult);

        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
            setStep('error');
        }
    };
    
    // Confirmar processamento apesar de duplicata
    const handleForceProcess = () => {
        setForceProcess(true);
        handleProcess(true); // Skip duplicate check
    };

    // Guardian AI check - AUTO version (receives data as param to avoid stale state)
    const handleGuardianCheckAuto = async (data: any) => {
        if (!data) return;
        
        setIsCheckingGuardian(true);
        setGuardianResult(null);
        
        try {
            const response = await fetch('/api/documents/guardian', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: freeText || data.historico_completo || '',
                    entities: data.entities || []
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                setGuardianResult(result);
            }
        } catch (err) {
            console.error('Guardian auto-check failed:', err);
        } finally {
            setIsCheckingGuardian(false);
        }
    };

    // Guardian AI check - MANUAL version (uses state)
    const handleGuardianCheck = async () => {
        if (!extractedData) return;
        await handleGuardianCheckAuto(extractedData);
    };

    // Salvar entidades aprovadas
    const handleSave = async () => {
        setStep('saving');
        setError(null);

        // Para novas operações, apenas retorna os dados extraídos
        if (investigationId === 'temp-new') {
            const localResult = {
                success: true,
                document_id: null,
                extraction: extractedData,
                file_info: files.length > 0 ? {
                    name: files[0].name,
                    size: files[0].size,
                    type: files[0].type,
                    hash: fileHash
                } : undefined,
                created: {
                    entities: extractedData?.entities?.length || 0,
                    evidences: extractedData?.evidences?.length || 0,
                    relationships: extractedData?.relationships?.length || 0,
                    findings: extractedData?.insights?.length || 0
                },
                message: 'Dados extraídos. Serão salvos ao criar a operação.'
            };
            setSaveResult(localResult);
            setStep('success');
            onSuccess?.(localResult);
            return;
        }

        try {
            // Use custom title or fallback to filename/ocorrencia number
            const finalTitle = documentTitle || 
                (files.length > 0 ? files[0].name : extractedData?.numero_ocorrencia) || 
                'Evidência';
            
            const saveRes = await fetch('/api/documents/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    investigation_id: investigationId,
                    document_type: documentType,
                    extraction: extractedData,
                    file_info: {
                        name: finalTitle, // Use editable title
                        size: files.length > 0 ? files[0].size : freeText.length,
                        type: files.length > 0 ? files[0].type : 'text/plain',
                        hash: fileHash
                    },
                    stats: stats
                }),
            });

            const saveData = await saveRes.json();

            if (!saveRes.ok) {
                throw new Error(saveData.error || 'Erro ao salvar');
            }

            setSaveResult(saveData);
            setStep('success');
            
            // Clear draft from localStorage on successful save
            try {
                localStorage.removeItem(AUTOSAVE_KEY);
            } catch (e) {
                console.warn('Failed to clear draft:', e);
            }
            
            onSuccess?.(saveData);

        } catch (err: any) {
            setError(err.message || 'Erro ao salvar documento');
            setStep('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col">
                {/* Header */}
                <div className={`px-6 py-4 border-b border-slate-700 bg-${typeInfo.color}-900/30`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">{typeInfo.label}</h2>
                            <p className={`text-sm text-${typeInfo.color}-300`}>{typeInfo.description}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {documentType === 'livre' ? (
                                /* Modo texto livre */
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Cole ou digite o texto do documento
                                    </label>
                                    <textarea
                                        value={freeText}
                                        onChange={(e) => setFreeText(e.target.value)}
                                        placeholder="Cole aqui o histórico da ocorrência, depoimento ou qualquer texto para análise..."
                                        className="w-full h-64 p-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="mt-2 flex items-center justify-between text-xs">
                                        <p className="text-slate-500">
                                            Mínimo 50 caracteres. Atual: {freeText.length}
                                        </p>
                                        {lastSaved && (
                                            <p className="text-emerald-500 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Rascunho salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Entity Matches Preview */}
                                    {(isMatching || entityMatches.length > 0) && (
                                        <div className="mt-4 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-cyan-400" />
                                                    Análise em Tempo Real
                                                </h4>
                                                {isMatching && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                                            </div>

                                            {entityMatches.length > 0 ? (
                                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                    {entityMatches.map((match, idx) => (
                                                        <div key={idx} className={`rounded-lg border transition-all ${
                                                            match.dbEntity 
                                                                ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/50' 
                                                                : 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                                                        }`}>
                                                            <div className="p-3">
                                                                <div className="flex items-start gap-3">
                                                                    {/* Avatar/Icon */}
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                                                        match.dbEntity 
                                                                            ? 'bg-emerald-500/20 text-emerald-400' 
                                                                            : 'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                        {match.candidate.type === 'PERSON' ? (
                                                                            match.candidate.normalizedValue.charAt(0)
                                                                        ) : match.candidate.type === 'VEHICLE' ? (
                                                                            <Car className="w-5 h-5" />
                                                                        ) : (
                                                                            <FileText className="w-5 h-5" />
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium text-white truncate">
                                                                                {match.candidate.normalizedValue}
                                                                            </p>
                                                                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                                                                                match.dbEntity ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                                            }`}>
                                                                                {match.dbEntity ? 'MATCH' : 'NOVO'}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {match.dbEntity ? (
                                                                            /* Card expandido para match encontrado */
                                                                            <div className="mt-1 space-y-1">
                                                                                <p className="text-xs text-slate-400">
                                                                                    <span className="text-emerald-400">✓</span> {match.dbEntity.name}
                                                                                    {match.dbEntity.cpfPartial && (
                                                                                        <span className="ml-2 text-slate-500">CPF: {match.dbEntity.cpfPartial}</span>
                                                                                    )}
                                                                                </p>
                                                                                {match.dbEntity.investigationTitle && (
                                                                                    <p className="text-[10px] text-slate-500">
                                                                                        📁 {match.dbEntity.investigationTitle}
                                                                                    </p>
                                                                                )}
                                                                                <p className="text-[10px] text-slate-500">
                                                                                    {match.dbEntity.matchReason}
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            /* Card para nova entidade */
                                                                            <p className="text-xs text-slate-400 mt-1">
                                                                                Nova entidade: {match.candidate.type} • {match.candidate.confidence}% confiança
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {/* Confidence indicator */}
                                                                    <div className="text-right">
                                                                        <div className={`text-lg font-bold ${match.dbEntity ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                            {match.dbEntity ? match.dbEntity.confidence : match.candidate.confidence}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : !isMatching && freeText.length > 20 ? (
                                                <p className="text-xs text-slate-500 italic">Nenhuma entidade identificada ainda...</p>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Modo upload */
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        border-2 border-dashed rounded-xl p-6 text-center transition-colors
                                        ${isDragging 
                                            ? 'border-blue-500 bg-blue-500/10' 
                                            : files.length > 0 
                                                ? 'border-emerald-500 bg-emerald-500/10' 
                                                : 'border-slate-600 hover:border-slate-500'
                                        }
                                    `}
                                >
                                    {/* Input hidden - SEMPRE renderizado para o ref funcionar */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={typeInfo.accept}
                                        onChange={handleFileSelect}
                                        multiple
                                        className="hidden"
                                    />
                                    
                                    {files.length > 0 ? (
                                        <div className="space-y-3">
                                            <Files className="w-10 h-10 mx-auto text-emerald-400" />
                                            <div className="space-y-2">
                                                {files.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-slate-400" />
                                                            <span className="text-sm text-white truncate max-w-[200px]">{f.name}</span>
                                                            <span className="text-xs text-slate-500">{formatFileSize(f.size)}</span>
                                                        </div>
                                                        <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                + Adicionar mais ({MAX_FILES_PER_BATCH - files.length} restantes)
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="space-y-3 cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {documentType === 'audio' ? (
                                                <Mic className="w-12 h-12 mx-auto text-slate-500" />
                                            ) : (
                                                <Upload className="w-12 h-12 mx-auto text-slate-500" />
                                            )}
                                            <div>
                                                <p className="text-lg font-medium text-white">
                                                    Arraste os arquivos aqui
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    ou clique para selecionar
                                                </p>
                                            </div>
                                            {/* Limites de upload */}
                                            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                                                <Info className="w-3 h-3" />
                                                <span>{ACCEPTED_EXTENSIONS} • Máx. {MAX_FILE_SIZE_DISPLAY}/arquivo • Até {MAX_FILES_PER_BATCH} arquivos</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info box */}
                            <div className={`p-4 rounded-xl bg-${typeInfo.color}-500/10 border border-${typeInfo.color}-500/30`}>
                                <p className={`text-sm text-${typeInfo.color}-300`}>
                                    {documentType === 'cs' || documentType === 'depoimento' ? (
                                        <>
                                            <strong>⚠️ Extração Cautelosa:</strong> Insights serão marcados como 
                                            hipóteses. Relacionamentos indicarão nível de confiança.
                                        </>
                                    ) : (
                                        <>
                                            <strong>✓ Extração Objetiva:</strong> Dados factuais serão extraídos 
                                            com alta confiança.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step: Checking for duplicates */}
                    {step === 'checking' && <CheckingStep />}

                    {/* Step: Duplicate Warning */}
                    {step === 'duplicate_warning' && (
                        <DuplicateWarningStep 
                            duplicateMatches={duplicateMatches}
                            onProceed={() => {
                                setForceProcess(true);
                                handleProcess(true);
                            }}
                            onCancel={() => {
                                setStep('upload');
                                setDuplicateMatches([]);
                            }}
                        />
                    )}

                    {/* Step: Extracting */}
                    {step === 'extracting' && <ExtractingStep batchProgress={batchProgress} />}

                    {/* Step: Review */}
                    {step === 'review' && extractedData && (
                        <div className="space-y-6">
                            {/* Smart Editable Title with duplicate check */}
                            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Título do Documento
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={documentTitle || (files.length > 0 ? files[0].name : extractedData.numero_ocorrencia || 'Evidência')}
                                        onChange={(e) => setDocumentTitle(e.target.value)}
                                        placeholder="Ex: REDS 2024-68600497 - Tráfico de Drogas"
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {documentTitle && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        </div>
                                    )}
                                </div>
                                {/* Format suggestion */}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="text-xs text-slate-500">Sugestões:</span>
                                    {extractedData.numero_ocorrencia && (
                                        <button
                                            onClick={() => setDocumentTitle(`REDS ${extractedData.numero_ocorrencia} - ${extractedData.natureza || 'Ocorrência'}`)}
                                            className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                        >
                                            REDS {extractedData.numero_ocorrencia}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setDocumentTitle(`Depoimento - ${new Date().toLocaleDateString('pt-BR')}`)}
                                        className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded hover:bg-slate-600"
                                    >
                                        Depoimento
                                    </button>
                                    <button
                                        onClick={() => setDocumentTitle(`Denúncia Anônima - ${new Date().toLocaleDateString('pt-BR')}`)}
                                        className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded hover:bg-slate-600"
                                    >
                                        Denúncia
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    💡 Use formato padronizado: <code className="text-cyan-400">TIPO NÚMERO - Descrição</code>
                                </p>
                            </div>

                            {/* BATCH MODE: Show each file individually */}
                            {extractedData._batchMode && extractedData._files && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <Files className="w-4 h-4 text-blue-400" />
                                        {extractedData._files.length} Documentos Processados
                                    </h3>
                                    {extractedData._files.map((file: any, idx: number) => (
                                        <details key={idx} className="group border border-slate-700 rounded-xl overflow-hidden">
                                            <summary className="p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                                            <FileText className="w-4 h-4 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{file.title || file.fileName}</p>
                                                            <p className="text-xs text-slate-400">
                                                                {file.numero_ocorrencia && <span className="mr-2">📋 {file.numero_ocorrencia}</span>}
                                                                {file.natureza && <span className="mr-2">⚖️ {file.natureza}</span>}
                                                                <span>👥 {file.entities?.length || 0} entidades</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                                                </div>
                                            </summary>
                                            <div className="p-4 bg-slate-900/50 border-t border-slate-700 space-y-3">
                                                {/* Summary */}
                                                {file.summary && (
                                                    <div>
                                                        <h4 className="text-xs font-medium text-slate-400 mb-1">Resumo</h4>
                                                        <p className="text-sm text-slate-300">{file.summary}</p>
                                                    </div>
                                                )}
                                                {/* Entities */}
                                                {file.entities?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-xs font-medium text-slate-400 mb-2">Entidades ({file.entities.length})</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {file.entities.slice(0, 8).map((ent: any, eIdx: number) => (
                                                                <span key={eIdx} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                                                                    {ent.name} <span className="text-slate-500">({ent.type})</span>
                                                                </span>
                                                            ))}
                                                            {file.entities.length > 8 && (
                                                                <span className="px-2 py-1 text-xs text-slate-500">+{file.entities.length - 8} mais</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Histórico */}
                                                {file.historico_completo && (
                                                    <details className="mt-2">
                                                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                                                            📜 Ver Histórico Completo ({file.historico_completo.length} caracteres)
                                                        </summary>
                                                        <div className="mt-2 p-3 bg-slate-800 rounded-lg max-h-48 overflow-y-auto">
                                                            <p className="text-xs text-slate-300 whitespace-pre-wrap">{file.historico_completo}</p>
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}

                            {/* SINGLE FILE: Summary */}
                            {!extractedData._batchMode && extractedData.summary && (
                                <div className="p-4 bg-slate-800 rounded-xl">
                                    <h3 className="text-sm font-medium text-slate-400 mb-2">Resumo</h3>
                                    <p className="text-white">{extractedData.summary}</p>
                                </div>
                            )}

                            {/* SINGLE FILE: Histórico Completo - Collapsible with Edit Option */}
                            {!extractedData._batchMode && extractedData.historico_completo && (
                                <details className="group" open={isEditingHistorico}>
                                    <summary className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl cursor-pointer hover:bg-blue-500/20 transition-colors">
                                        <div className="inline-flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-blue-300">
                                                Histórico Completo da Ocorrência
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                ({(editedHistorico || extractedData.historico_completo).length} caracteres) — clique para expandir
                                            </span>
                                            {isEditingHistorico && (
                                                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-400">Editando</span>
                                            )}
                                        </div>
                                    </summary>
                                    <div className="mt-2 space-y-2">
                                        {/* Edit Toggle Button */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => {
                                                    if (!isEditingHistorico) {
                                                        setEditedHistorico(extractedData.historico_completo);
                                                    }
                                                    setIsEditingHistorico(!isEditingHistorico);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                    isEditingHistorico 
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                }`}
                                            >
                                                {isEditingHistorico ? '✓ Salvar Edição' : '✏️ Editar Texto'}
                                            </button>
                                        </div>
                                        
                                        {isEditingHistorico ? (
                                            <textarea
                                                value={editedHistorico}
                                                onChange={(e) => {
                                                    setEditedHistorico(e.target.value);
                                                    // Update extractedData with edited text
                                                    setExtractedData((prev: any) => ({
                                                        ...prev,
                                                        historico_completo: e.target.value
                                                    }));
                                                }}
                                                className="w-full h-64 p-4 bg-slate-900 rounded-xl border border-amber-500/30 text-sm text-slate-300 leading-relaxed resize-none focus:outline-none focus:border-amber-500/50"
                                                placeholder="Edite o histórico aqui..."
                                            />
                                        ) : (
                                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                    {extractedData.historico_completo}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {isEditingHistorico && (
                                            <p className="text-xs text-amber-400/70 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Após editar, clique em "Reprocessar" para extrair novamente ou salve com o texto atual.
                                            </p>
                                        )}
                                    </div>
                                </details>
                            )}

                            {/* Stats */}
                            {stats && (
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span>⏱️ {stats.processing_time_ms}ms</span>
                                    <span>🎯 {stats.entities_count} entidades</span>
                                    <span>🔗 {stats.relationships_count} vínculos</span>
                                    <span>💰 ${stats.cost_usd}</span>
                                </div>
                            )}

                            {/* Entities - Clickable and Expandable */}
                            <div>
                                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                    Entidades Encontradas ({extractedData.entities?.length || 0})
                                    <span className="text-xs text-slate-500 font-normal">— clique para expandir</span>
                                </h3>
                                <div className="space-y-2">
                                    {extractedData.entities?.map((entity: any, idx: number) => {
                                        const Icon = ENTITY_ICONS[entity.type] || Users;
                                        const color = ENTITY_COLORS[entity.type] || 'slate';
                                        return (
                                            <details key={idx} className="group">
                                                <summary className={`flex items-center gap-3 p-3 bg-${color}-500/10 border border-${color}-500/30 rounded-lg cursor-pointer hover:bg-${color}-500/20 transition-colors list-none`}>
                                                    <div className={`p-2 bg-${color}-500/20 rounded-lg`}>
                                                        <Icon className={`w-4 h-4 text-${color}-400`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{entity.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {ENTITY_TYPE_LABELS[entity.type] || entity.type} • {entity.role} • {Math.round((entity.confidence || 0.9) * 100)}% confiança
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setEditingEntityIdx(idx);
                                                            setEditingEntityData({ ...entity });
                                                        }}
                                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
                                                        title="Editar entidade"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition-transform" />
                                                </summary>
                                                
                                                {/* Expanded Details - Hierarchical */}
                                                <div className="mt-2 ml-12 p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                                                    {/* Metadata - Hierarchical order */}
                                                    <div className="space-y-1.5 text-xs">
                                                        {entity.metadata?.cpf && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">CPF:</span>
                                                                <span className="text-white font-mono">{entity.metadata.cpf}</span>
                                                            </div>
                                                        )}
                                                        {entity.metadata?.nome_mae && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">Nome da Mãe:</span>
                                                                <span className="text-white">{entity.metadata.nome_mae}</span>
                                                            </div>
                                                        )}
                                                        {entity.metadata?.data_nascimento && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">Nascimento:</span>
                                                                <span className="text-white">{entity.metadata.data_nascimento}</span>
                                                            </div>
                                                        )}
                                                        {entity.metadata?.endereco && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">Endereço:</span>
                                                                <span className="text-white">{entity.metadata.endereco}</span>
                                                            </div>
                                                        )}
                                                        {entity.metadata?.telefone && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">Telefone:</span>
                                                                <span className="text-white font-mono">{entity.metadata.telefone}</span>
                                                            </div>
                                                        )}
                                                        {entity.metadata?.placa && (
                                                            <div className="flex">
                                                                <span className="text-slate-500 w-24">Placa:</span>
                                                                <span className="text-white font-mono">{entity.metadata.placa}</span>
                                                            </div>
                                                        )}
                                                        {/* Show if no metadata */}
                                                        {(!entity.metadata || Object.keys(entity.metadata).filter(k => k !== 'role').length === 0) && (
                                                            <p className="text-slate-500 italic">Nenhum dado adicional extraído</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Existing connections */}
                                                    <div className="pt-2 border-t border-slate-700">
                                                        <p className="text-xs text-slate-500 mb-2">🔗 Conexões no sistema:</p>
                                                        {isCheckingConnections ? (
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                <span>Buscando conexões...</span>
                                                                <div className="flex-1 h-1 bg-slate-700 rounded overflow-hidden">
                                                                    <div className="h-full bg-blue-500 animate-pulse" style={{width: '60%'}}></div>
                                                                </div>
                                                            </div>
                                                        ) : connectionResults[entity.name] ? (
                                                            connectionResults[entity.name].length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {connectionResults[entity.name].map((conn, cIdx) => (
                                                                        <a 
                                                                            key={cIdx} 
                                                                            href={`/investigation/${conn.investigation_id}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline"
                                                                        >
                                                                            <ChevronRight className="w-3 h-3" />
                                                                            <span>{conn.name}</span>
                                                                            <span className="text-slate-500">em {conn.investigation_title}</span>
                                                                            <span className="text-slate-600">↗</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-500 italic">Nenhuma conexão encontrada</p>
                                                            )
                                                        ) : (
                                                            <p className="text-xs text-slate-500 italic">Conexões serão verificadas ao salvar</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Evidences */}
                            {extractedData.evidences?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-slate-300 mb-3">
                                        Evidências ({extractedData.evidences.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {extractedData.evidences.map((ev: any, idx: number) => (
                                            <div key={idx} className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                                <p className="font-medium text-white">{ev.description}</p>
                                                <p className="text-xs text-slate-400">
                                                    {EVIDENCE_TYPE_LABELS[ev.type] || ev.type} • {ev.quantity || '-'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Warnings */}
                            {extractedData.warnings?.length > 0 && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <p className="text-sm font-medium text-amber-400 mb-2">⚠️ Atenção:</p>
                                    <ul className="space-y-1 text-sm text-amber-300">
                                        {extractedData.warnings.map((w: string, idx: number) => (
                                            <li key={idx}>• {w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Guardian AI Result - INSIDE CONTENT with scroll */}
                            {guardianResult && (
                                <div className="p-4 bg-cyan-500/5 border-2 border-cyan-500/40 rounded-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-cyan-400 font-medium flex items-center gap-2">
                                            <Brain className="w-5 h-5" />
                                            Revisão do Guardião IA
                                        </h4>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                        {/* Missing Entities - with checkboxes and edit */}
                                        {guardianResult.missed_entities?.length > 0 && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-amber-400 text-xs font-medium">⚠️ Entidades que podem estar faltando:</p>
                                                    <button className="text-xs text-slate-400 hover:text-white">
                                                        Marcar todas
                                                    </button>
                                                </div>
                                                <ul className="text-xs text-slate-300 space-y-2">
                                                    {guardianResult.missed_entities.map((e: any, i: number) => (
                                                        <li key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded text-cyan-500 bg-slate-700 border-slate-600" 
                                                                defaultChecked 
                                                            />
                                                            <span className="text-amber-300 text-[10px] uppercase">{e.type}</span>
                                                            <span className="text-white font-medium flex-1">{e.value}</span>
                                                            <button 
                                                                className="text-blue-400 hover:text-blue-300 text-[10px] px-1.5 py-0.5 bg-blue-500/10 rounded"
                                                                title="Editar sugestão"
                                                            >
                                                                ✏️ Editar
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* Alerts */}
                                        {guardianResult.alerts?.length > 0 && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                <p className="text-red-400 text-xs font-medium mb-2">⚠️ Alertas:</p>
                                                <ul className="text-xs space-y-2">
                                                    {guardianResult.alerts.map((a: any, i: number) => (
                                                        <li key={i} className={`p-2 rounded ${a.severity === 'high' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                                            {a.severity === 'high' ? '🔴' : '🟡'} {a.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* All clear */}
                                        {(!guardianResult.missed_entities?.length && !guardianResult.alerts?.length) && (
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                                <p className="text-emerald-400 text-sm">✅ Nenhum problema detectado</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Guardian Actions - Clear hierarchy */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-cyan-500/20">
                                        <button
                                            onClick={() => setGuardianResult(null)}
                                            className="px-3 py-1.5 text-slate-400 hover:text-white text-sm hover:bg-slate-700 rounded"
                                        >
                                            Ignorar e voltar
                                        </button>
                                        <button
                                            onClick={() => {
                                                // TODO: Apply only selected suggestions to extractedData
                                                // Then close guardian and go back to review
                                                setGuardianResult(null);
                                            }}
                                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Aplicar Selecionadas
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step: Saving */}
                    {step === 'saving' && <SavingStep />}

                    {/* Step: Error */}
                    {step === 'error' && <ErrorStep error={error || 'Erro desconhecido'} onRetry={() => setStep('upload')} />}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="py-8 space-y-6">
                            <div className="text-center">
                                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-400" />
                                <p className="mt-4 text-lg font-medium text-white">
                                    {saveResult?.created?.documents > 1 
                                        ? `${saveResult.created.documents} documentos processados!` 
                                        : 'Documento processado!'}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {saveResult?.message || 'As entidades foram adicionadas à operação.'}
                                </p>
                            </div>

                            {/* Stats */}
                            {saveResult?.created && (
                                <div className="flex justify-center gap-4 text-sm flex-wrap">
                                    {saveResult.created.documents > 0 && (
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-400">{saveResult.created.documents}</p>
                                            <p className="text-slate-500">Documentos</p>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-emerald-400">{saveResult.created.entities}</p>
                                        <p className="text-slate-500">Entidades</p>
                                    </div>
                                    {saveResult.created.linked_entities > 0 && (
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-cyan-400">{saveResult.created.linked_entities}</p>
                                            <p className="text-slate-500">Vinculadas</p>
                                        </div>
                                    )}
                                    {saveResult.created.evidences > 0 && (
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-amber-400">{saveResult.created.evidences}</p>
                                            <p className="text-slate-500">Evidências</p>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-purple-400">{saveResult.created.relationships}</p>
                                        <p className="text-slate-500">Vínculos</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Batch Documents Details */}
                            {extractedData?.saved_documents?.length > 1 && (
                                <div className="mt-4 bg-slate-800/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                        <Files className="w-4 h-4 text-blue-400" />
                                        Documentos Salvos
                                    </h4>
                                    <div className="space-y-2">
                                        {extractedData.saved_documents.map((doc: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded-lg">
                                                <span className="text-slate-300 truncate flex-1">{doc.filename}</span>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-emerald-400">{doc.entities_created} entidades</span>
                                                    <span className="text-purple-400">{doc.relationships_created} vínculos</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cross-Case Alerts */}
                            {saveResult?.cross_case_alerts && saveResult.cross_case_alerts.length > 0 && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Conexões Cross-Case Detectadas!
                                    </h3>
                                    <div className="space-y-2">
                                        {saveResult.cross_case_alerts.map((alert: any, idx: number) => (
                                            <div key={idx} className="text-sm text-amber-300 bg-amber-500/5 p-2 rounded">
                                                <span className="font-medium">{alert.entity}</span>
                                                <span className="text-amber-400/70"> → {alert.matchReason}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3">
                                        Veja os alertas em Central → Alertas Cruzados
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                        {step === 'success' ? 'Fechar' : 'Cancelar'}
                    </button>

                    {step === 'upload' && (
                        <button
                            onClick={() => handleProcess()}
                            disabled={documentType === 'livre' ? freeText.length < 50 : files.length === 0}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            Processar Documento
                        </button>
                    )}

                    {step === 'duplicate_warning' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleForceProcess}
                                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Processar mesmo assim
                            </button>
                        </div>
                    )}

                    {/* Footer buttons for review step - only when Guardian not active */}
                    {step === 'review' && !guardianResult && (
                        <div className="flex gap-3 items-center">
                            {/* Connection checking indicator */}
                            {isCheckingConnections && (
                                <div className="flex items-center gap-2 text-xs text-blue-400 mr-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Verificando conexões...</span>
                                </div>
                            )}
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
                            >
                                <RotateCcw className="w-4 h-4 inline mr-2" />
                                Reprocessar
                            </button>
                            {/* Guardian button - shows loading on auto, re-analyze after */}
                            {isCheckingGuardian ? (
                                <div className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Guardião IA analisando...</span>
                                </div>
                            ) : guardianResult ? (
                                <button
                                    onClick={handleGuardianCheck}
                                    disabled={isCheckingConnections}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Brain className="w-4 h-4" />
                                    Re-analisar
                                </button>
                            ) : null}
                            <button
                                onClick={batchExtractions.length > 0 ? handleSaveBatch : handleSave}
                                disabled={isCheckingConnections}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isCheckingConnections ? 'Aguarde...' : batchExtractions.length > 1 ? `Aprovar e Salvar ${batchExtractions.length} Documentos` : 'Aprovar e Salvar'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Inline Entity Edit Modal */}
            {editingEntityIdx !== null && editingEntityData && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Editar Entidade</h3>
                            <button onClick={() => { setEditingEntityIdx(null); setEditingEntityData(null); }} className="p-1 hover:bg-slate-800 rounded">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nome</label>
                                <input 
                                    type="text" 
                                    value={editingEntityData.name || ''} 
                                    onChange={(e) => setEditingEntityData({...editingEntityData, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                            {/* Tipo */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                <select 
                                    value={editingEntityData.type || 'PERSON'} 
                                    onChange={(e) => setEditingEntityData({...editingEntityData, type: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="PERSON">Pessoa</option>
                                    <option value="VEHICLE">Veículo</option>
                                    <option value="LOCATION">Local</option>
                                    <option value="ORGANIZATION">Organização</option>
                                    <option value="PHONE">Telefone</option>
                                    <option value="FIREARM">Arma</option>
                                    <option value="EVIDENCE">Evidência</option>
                                </select>
                            </div>
                            {/* Role */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Papel</label>
                                <select 
                                    value={editingEntityData.role || 'ENVOLVIDO'} 
                                    onChange={(e) => setEditingEntityData({...editingEntityData, role: e.target.value})}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="AUTOR">Autor</option>
                                    <option value="VITIMA">Vítima</option>
                                    <option value="TESTEMUNHA">Testemunha</option>
                                    <option value="CONDUTOR">Condutor</option>
                                    <option value="SUSPEITO">Suspeito</option>
                                    <option value="ENVOLVIDO">Envolvido</option>
                                    <option value="MENCIONADO">Mencionado</option>
                                </select>
                            </div>
                            {/* Metadata fields based on type */}
                            {editingEntityData.type === 'PERSON' && (
                                <>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">CPF</label>
                                        <input 
                                            type="text" 
                                            value={editingEntityData.metadata?.cpf || ''} 
                                            onChange={(e) => setEditingEntityData({...editingEntityData, metadata: {...(editingEntityData.metadata || {}), cpf: e.target.value}})}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Nome da Mãe</label>
                                        <input 
                                            type="text" 
                                            value={editingEntityData.metadata?.nome_mae || editingEntityData.metadata?.mae || ''} 
                                            onChange={(e) => setEditingEntityData({...editingEntityData, metadata: {...(editingEntityData.metadata || {}), mae: e.target.value}})}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </>
                            )}
                            {editingEntityData.type === 'VEHICLE' && (
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Placa</label>
                                    <input 
                                        type="text" 
                                        value={editingEntityData.metadata?.placa || ''} 
                                        onChange={(e) => setEditingEntityData({...editingEntityData, metadata: {...(editingEntityData.metadata || {}), placa: e.target.value.toUpperCase()}})}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="ABC-1234"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
                            <button
                                onClick={() => {
                                    // Remove entity
                                    const newEntities = [...(extractedData.entities || [])];
                                    newEntities.splice(editingEntityIdx, 1);
                                    setExtractedData({...extractedData, entities: newEntities});
                                    setEditingEntityIdx(null);
                                    setEditingEntityData(null);
                                }}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remover
                            </button>
                            <button
                                onClick={() => {
                                    // Save changes to extractedData
                                    const newEntities = [...(extractedData.entities || [])];
                                    newEntities[editingEntityIdx] = editingEntityData;
                                    setExtractedData({...extractedData, entities: newEntities});
                                    setEditingEntityIdx(null);
                                    setEditingEntityData(null);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
