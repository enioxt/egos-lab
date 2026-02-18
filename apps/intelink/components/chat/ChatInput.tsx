'use client';

/**
 * ChatInput - Input de mensagem com suporte a áudio
 * - Permite digitar durante envio (queue messages)
 * - Gravação de áudio com Groq Whisper
 */

import { Send, Loader2, Mic, MicOff, Square, Paperclip, X, Image, FileText, Film, Music } from 'lucide-react';
import { useChat } from '@/providers/ChatContext';
import { useState, useRef, useEffect } from 'react';

export function ChatInput() {
    const {
        input,
        setInput,
        loading,
        selectedInv,
        sendMessage,
        isCentralMode,
        contextSize,
    } = useChat();

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Queued message for sending while loading
    const [queuedMessage, setQueuedMessage] = useState('');
    
    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect to send queued message when loading finishes
    useEffect(() => {
        if (!loading && queuedMessage) {
            setInput(queuedMessage);
            setQueuedMessage('');
        }
    }, [loading, queuedMessage, setInput]);
    
    // Cleanup file preview URLs
    useEffect(() => {
        return () => {
            filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [filePreviewUrls]);
    
    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        
        // Max 5 files at a time
        const newFiles = files.slice(0, 5 - selectedFiles.length);
        
        // Create preview URLs for images
        const newUrls = newFiles.map(file => {
            if (file.type.startsWith('image/')) {
                return URL.createObjectURL(file);
            }
            return '';
        });
        
        setSelectedFiles(prev => [...prev, ...newFiles]);
        setFilePreviewUrls(prev => [...prev, ...newUrls]);
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    // Remove a selected file
    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setFilePreviewUrls(prev => {
            const url = prev[index];
            if (url) URL.revokeObjectURL(url);
            return prev.filter((_, i) => i !== index);
        });
    };
    
    // Get file icon based on type
    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return Image;
        if (file.type.startsWith('video/')) return Film;
        if (file.type.startsWith('audio/')) return Music;
        return FileText;
    };
    
    // Process files and send message
    const handleSendWithFiles = async () => {
        if (selectedFiles.length === 0) {
            sendMessage();
            return;
        }
        
        setIsProcessingFile(true);
        
        try {
            // Process each file
            const processedContents: string[] = [];
            
            for (const file of selectedFiles) {
                if (file.type.startsWith('image/')) {
                    // Convert to base64 and send to vision API
                    const base64 = await fileToBase64(file);
                    const response = await fetch('/api/chat/vision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: base64,
                            prompt: input || 'Descreva esta imagem em detalhes.',
                        }),
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        processedContents.push(`[Análise de imagem: ${file.name}]\n${data.description}`);
                    }
                } else if (file.type === 'application/pdf') {
                    // Extract PDF text using documents extract API
                    const base64 = await fileToBase64(file);
                    
                    // Try to extract text from PDF via vision API (works with scanned PDFs too)
                    const response = await fetch('/api/chat/pdf', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pdf: base64,
                            filename: file.name,
                        }),
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const text = data.text || data.content || 'Não foi possível extrair texto do PDF.';
                        processedContents.push(`[Conteúdo do PDF: ${file.name}]\n${text.substring(0, 4000)}`);
                    } else {
                        console.error('PDF extraction failed:', await response.text());
                        processedContents.push(`[PDF: ${file.name}] - Erro ao extrair conteúdo. Tente colar o texto manualmente.`);
                    }
                } else if (file.type.startsWith('audio/')) {
                    // Use existing transcription
                    const formData = new FormData();
                    formData.append('file', file, file.name);
                    
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData,
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        processedContents.push(`[Transcrição de áudio: ${file.name}]\n${data.text}`);
                    }
                }
            }
            
            // Append file contents to message
            const fileContext = processedContents.join('\n\n');
            const fullMessage = input + (fileContext ? '\n\n' + fileContext : '');
            
            // Clear files and send
            setSelectedFiles([]);
            setFilePreviewUrls([]);
            setInput(fullMessage);
            
            // Wait for state to update then send
            setTimeout(() => sendMessage(), 100);
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Erro ao processar arquivos. Tente novamente.');
        } finally {
            setIsProcessingFile(false);
        }
    };
    
    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Start audio recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Erro ao acessar microfone. Verifique as permissões.');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    // Transcribe audio with Groq Whisper
    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const data = await response.json();
            if (data.text) {
                setInput((prev: string) => prev + (prev ? ' ' : '') + data.text);
            }
        } catch (error) {
            console.error('Transcription error:', error);
            alert('Erro na transcrição. Tente novamente.');
        } finally {
            setIsTranscribing(false);
        }
    };

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    return (
        <div className="border-t border-slate-800 bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-4">
                {/* Context indicator */}
                {contextSize > 0 && (
                    <div className="text-xs text-slate-500 mb-2 text-center">
                        {contextSize.toLocaleString()} caracteres de contexto
                    </div>
                )}
                
                {/* Recording indicator */}
                {isRecording && (
                    <div className="flex items-center justify-center gap-2 px-3 py-2 mb-3 bg-red-600/20 border border-red-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-red-400 font-mono">{formatTime(recordingTime)}</span>
                        <span className="text-sm text-red-400">Gravando...</span>
                    </div>
                )}
                
                {/* File preview */}
                {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedFiles.map((file, index) => {
                            const FileIcon = getFileIcon(file);
                            const previewUrl = filePreviewUrls[index];
                            
                            return (
                                <div 
                                    key={index}
                                    className="relative group flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg"
                                >
                                    {/* Preview or Icon */}
                                    {previewUrl ? (
                                        <img 
                                            src={previewUrl} 
                                            alt={file.name}
                                            className="w-8 h-8 object-cover rounded"
                                        />
                                    ) : (
                                        <FileIcon className="w-5 h-5 text-slate-400" />
                                    )}
                                    
                                    {/* File name */}
                                    <span className="text-sm text-slate-300 max-w-[120px] truncate">
                                        {file.name}
                                    </span>
                                    
                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="ml-1 p-1 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                        
                        {isProcessingFile && (
                            <div className="flex items-center gap-2 px-3 py-2 text-cyan-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Processando...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ChatGPT-style unified input container */}
                <div className={`flex items-end gap-0 bg-slate-800 rounded-2xl border transition-colors ${
                    loading ? 'border-blue-500/50' : 'border-slate-700 focus-within:border-slate-500'
                }`}>
                    {/* File Input (hidden) */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf,audio/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    
                    {/* Left button - Add files */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!selectedInv || selectedFiles.length >= 5}
                        className="flex-shrink-0 p-3 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Adicionar arquivos (max 5)"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Input Area */}
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            isTranscribing
                                ? "Transcrevendo áudio..."
                                : !selectedInv 
                                    ? "Selecione uma operação primeiro..."
                                    : loading
                                        ? "Continue digitando..."
                                        : isCentralMode
                                            ? "Pergunte sobre todas as operações..."
                                            : "Digite sua mensagem..."
                        }
                        disabled={!selectedInv}
                        rows={1}
                        className="flex-1 px-2 py-3 bg-transparent text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 resize-none"
                        style={{ 
                            height: '48px',
                            minHeight: '48px',
                            maxHeight: '200px',
                            overflow: 'hidden',
                        }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = '48px';
                            target.style.overflow = 'hidden';
                            
                            const scrollHeight = target.scrollHeight;
                            if (scrollHeight > 48) {
                                const newHeight = Math.min(scrollHeight, 200);
                                target.style.height = newHeight + 'px';
                                if (scrollHeight > 200) {
                                    target.style.overflow = 'auto';
                                }
                            }
                        }}
                    />

                    {/* Right buttons */}
                    <div className="flex items-center gap-1 pr-2">
                        {/* Audio Recording Button */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!selectedInv || isTranscribing}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                                isRecording
                                    ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                    : isTranscribing
                                        ? 'text-slate-500 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                        >
                            {isTranscribing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isRecording ? (
                                <Square className="w-5 h-5" />
                            ) : (
                                <Mic className="w-5 h-5" />
                            )}
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={selectedFiles.length > 0 ? handleSendWithFiles : sendMessage}
                            disabled={!selectedInv || loading || isProcessingFile || (!input.trim() && selectedFiles.length === 0)}
                            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                                loading || isProcessingFile || (!input.trim() && selectedFiles.length === 0) || !selectedInv
                                    ? 'text-slate-500 cursor-not-allowed'
                                    : 'bg-white text-slate-900 hover:bg-slate-200'
                            }`}
                        >
                            {loading || isProcessingFile ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Hint */}
                <p className="text-xs text-slate-600 mt-2 text-center">
                    Enter para enviar • Shift+Enter para nova linha
                </p>
            </div>
        </div>
    );
}
