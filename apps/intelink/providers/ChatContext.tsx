'use client';

/**
 * ChatContext - Global state for chat functionality
 * 
 * Enables persistent shell pattern where sidebar/header/input
 * remain static while navigating between chat sessions.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Message, Investigation, TeamMember, ChatSession, Toast } from '@/types/chat';
import { classifyForTelemetry } from '@/lib/telemetry/prompt-classifier';
import { useIntelinkFocusOptional } from '@/contexts/IntelinkFocusContext';

interface ChatContextType {
    // Core state
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    loading: boolean;
    currentSessionId: string | null;
    setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
    
    // Investigation
    selectedInv: string;
    setSelectedInv: React.Dispatch<React.SetStateAction<string>>;
    investigations: Investigation[];
    loadingInvestigations: boolean;
    isCentralMode: boolean;
    
    // Journey Integration
    startChatWithContext: (context: string, systemPrompt?: string) => void;
    
    // History
    showHistory: boolean;
    setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
    chatSessions: ChatSession[];
    sharedSessions: ChatSession[];
    historyTab: 'mine' | 'shared';
    setHistoryTab: React.Dispatch<React.SetStateAction<'mine' | 'shared'>>;
    
    // Sharing
    teamMembers: TeamMember[];
    shareableMembers: TeamMember[];
    showShareModal: boolean;
    setShowShareModal: React.Dispatch<React.SetStateAction<boolean>>;
    showShareMenu: boolean;
    setShowShareMenu: React.Dispatch<React.SetStateAction<boolean>>;
    selectedMembersToShare: string[];
    setSelectedMembersToShare: React.Dispatch<React.SetStateAction<string[]>>;
    shareCanInteract: boolean;
    setShareCanInteract: React.Dispatch<React.SetStateAction<boolean>>;
    sharingInProgress: boolean;
    
    // Export
    showExportMenu: boolean;
    setShowExportMenu: React.Dispatch<React.SetStateAction<boolean>>;
    copied: boolean;
    
    // Toast
    toast: Toast | null;
    showToast: (message: string, type: 'success' | 'error') => void;
    
    // Context info
    contextSize: number;
    isSharedSession: boolean;
    
    // Refs
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    
    // Actions
    sendMessage: () => Promise<void>;
    loadSession: (sessionId: string, fromShared?: boolean) => Promise<void>;
    loadChatHistory: () => Promise<void>;
    startNewChat: () => void;
    deleteSession: (sessionId: string, e: React.MouseEvent) => Promise<void>;
    handleSelectInvestigation: (invId: string) => void;
    toggleMemberSelection: (memberId: string) => void;
    shareInternally: () => Promise<void>;
    copyToClipboard: () => void;
    formatConversation: (format: 'txt' | 'md' | 'html') => string;
    exportAsTxt: () => void;
    exportAsMd: () => void;
    exportAsHtml: () => void;
    exportAsPdf: () => void;
    shareWithMember: (member: TeamMember) => void;
    openShareModal: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Context Bridge - Get visual context from Dashboard
    const intelinkFocus = useIntelinkFocusOptional();
    
    // Core state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    
    // Investigation
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [loadingInvestigations, setLoadingInvestigations] = useState(true);
    const [selectedInv, setSelectedInv] = useState<string>('');
    
    // History
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [sharedSessions, setSharedSessions] = useState<ChatSession[]>([]);
    const [historyTab, setHistoryTab] = useState<'mine' | 'shared'>('mine');
    
    // Sharing
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [shareableMembers, setShareableMembers] = useState<TeamMember[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [selectedMembersToShare, setSelectedMembersToShare] = useState<string[]>([]);
    const [shareCanInteract, setShareCanInteract] = useState(false);
    const [sharingInProgress, setSharingInProgress] = useState(false);
    
    // Export
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Toast
    const [toast, setToast] = useState<Toast | null>(null);
    
    // Context info
    const [contextSize, setContextSize] = useState(0);
    const [isSharedSession, setIsSharedSession] = useState(false);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const isCentralMode = selectedInv === 'ALL';
    
    // Show toast notification
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);
    
    // Load investigations
    const loadInvestigations = useCallback(async () => {
        setLoadingInvestigations(true);
        try {
            const res = await fetch('/api/investigations?limit=100');
            if (res.ok) {
                const data = await res.json();
                setInvestigations(data.investigations || []);
            }
        } catch (error) {
            console.error('Error loading investigations:', error);
        } finally {
            setLoadingInvestigations(false);
        }
    }, []);
    
    // Load chat history
    const loadChatHistory = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/history?limit=20');
            if (res.ok) {
                const data = await res.json();
                setChatSessions(data.sessions || []);
            }
            
            const sharedRes = await fetch('/api/chat/shared');
            if (sharedRes.ok) {
                const sharedData = await sharedRes.json();
                setSharedSessions(sharedData.sessions || []);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }, []);
    
    // Load team members
    const loadTeamMembers = useCallback(async () => {
        try {
            const res = await fetch('/api/members?limit=50');
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data.members?.filter((m: TeamMember) => m.whatsapp) || []);
                setShareableMembers(data.members || []);
            }
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }, []);
    
    // Load session
    const loadSession = useCallback(async (sessionId: string, fromShared = false) => {
        try {
            const res = await fetch(`/api/chat/history/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.session && data.messages) {
                    if (data.session.mode === 'central') {
                        setSelectedInv('ALL');
                    } else if (data.session.investigation_id) {
                        setSelectedInv(data.session.investigation_id);
                    }
                    
                    setMessages(data.messages.map((m: any) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: new Date(m.created_at),
                        sender_id: m.sender_id,
                        sender_name: m.sender_name || (m.role === 'user' ? 'Você' : 'INTELINK')
                    })));
                    
                    setCurrentSessionId(sessionId);
                    setIsSharedSession(fromShared || data.session.is_shared);
                    setShowHistory(false);
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }, []);
    
    // Start new chat
    const startNewChat = useCallback(() => {
        setMessages([]);
        setCurrentSessionId(null);
        setShowHistory(false);
        router.push('/chat');
    }, [router]);
    
    // Delete session
    const deleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm('Excluir esta conversa?')) return;
        
        try {
            await fetch(`/api/chat/history/${sessionId}`, { method: 'DELETE' });
            setChatSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                startNewChat();
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    }, [currentSessionId, startNewChat]);
    
    // Handle investigation selection
    const handleSelectInvestigation = useCallback((invId: string) => {
        setSelectedInv(invId);
        setMessages([]);
        setContextSize(0);
    }, []);
    
    // Toggle member selection for sharing
    const toggleMemberSelection = useCallback((memberId: string) => {
        setSelectedMembersToShare(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    }, []);
    
    // Open share modal
    const openShareModal = useCallback(() => {
        if (!currentSessionId) {
            alert('Salve a conversa primeiro antes de compartilhar');
            return;
        }
        setShowShareModal(true);
        setShowShareMenu(false);
        setSelectedMembersToShare([]);
        setShareCanInteract(false);
    }, [currentSessionId]);
    
    // Format conversation for export
    const formatConversation = useCallback((format: 'txt' | 'md' | 'html'): string => {
        const timestamp = new Date().toLocaleString('pt-BR');
        const invTitle = isCentralMode 
            ? 'Central de Inteligência' 
            : investigations.find(i => i.id === selectedInv)?.title || 'Operação';

        let content = '';

        if (format === 'md') {
            content = `# Conversa INTELINK\n\n`;
            content += `**Data:** ${timestamp}\n`;
            content += `**Contexto:** ${invTitle}\n\n`;
            content += `---\n\n`;
            messages.forEach(msg => {
                const role = msg.role === 'user' ? '👤 Usuário' : '🤖 INTELINK';
                content += `### ${role}\n\n${msg.content}\n\n`;
            });
        } else if (format === 'html') {
            content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Conversa INTELINK</title>
            <style>body{font-family:Arial;max-width:800px;margin:0 auto;padding:20px}
            .user{background:#e3f2fd;padding:15px;border-radius:10px;margin:10px 0}
            .assistant{background:#f5f5f5;padding:15px;border-radius:10px;margin:10px 0}
            h1{color:#1a237e}pre{white-space:pre-wrap}</style></head><body>`;
            content += `<h1>Conversa INTELINK</h1>`;
            content += `<p><strong>Data:</strong> ${timestamp}</p>`;
            content += `<p><strong>Contexto:</strong> ${invTitle}</p><hr>`;
            messages.forEach(msg => {
                const cls = msg.role === 'user' ? 'user' : 'assistant';
                const role = msg.role === 'user' ? '👤 Usuário' : '🤖 INTELINK';
                content += `<div class="${cls}"><strong>${role}</strong><pre>${msg.content}</pre></div>`;
            });
            content += `</body></html>`;
        } else {
            content = `CONVERSA INTELINK\n`;
            content += `${'='.repeat(50)}\n`;
            content += `Data: ${timestamp}\n`;
            content += `Contexto: ${invTitle}\n`;
            content += `${'='.repeat(50)}\n\n`;
            messages.forEach(msg => {
                const role = msg.role === 'user' ? 'USUÁRIO' : 'INTELINK';
                content += `[${role}]\n${msg.content}\n\n${'-'.repeat(30)}\n\n`;
            });
        }

        return content;
    }, [messages, isCentralMode, investigations, selectedInv]);
    
    // Download file helper
    const downloadFile = useCallback((content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }, []);
    
    // Export functions
    const exportAsTxt = useCallback(() => {
        const content = formatConversation('txt');
        downloadFile(content, 'conversa_intelink.txt', 'text/plain');
        setShowExportMenu(false);
    }, [formatConversation, downloadFile]);
    
    const exportAsMd = useCallback(() => {
        const content = formatConversation('md');
        downloadFile(content, 'conversa_intelink.md', 'text/markdown');
        setShowExportMenu(false);
    }, [formatConversation, downloadFile]);
    
    const exportAsHtml = useCallback(() => {
        const content = formatConversation('html');
        downloadFile(content, 'conversa_intelink.html', 'text/html');
        setShowExportMenu(false);
    }, [formatConversation, downloadFile]);
    
    const exportAsPdf = useCallback(async () => {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const content = formatConversation('txt');
        const lines = content.split('\n');
        let y = 20;
        
        doc.setFontSize(10);
        for (const line of lines) {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            const splitLines = doc.splitTextToSize(line, 180);
            for (const sl of splitLines) {
                doc.text(sl, 15, y);
                y += 5;
            }
        }
        
        doc.save('conversa_intelink.pdf');
        setShowExportMenu(false);
    }, [formatConversation]);
    
    // Copy to clipboard
    const copyToClipboard = useCallback(() => {
        const content = formatConversation('txt');
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [formatConversation]);
    
    // Share with member via WhatsApp
    const shareWithMember = useCallback((member: TeamMember) => {
        if (!member.whatsapp) return;
        const content = formatConversation('txt');
        const truncated = content.length > 3000 
            ? content.substring(0, 3000) + '\n\n[...conversa truncada]' 
            : content;
        const encoded = encodeURIComponent(truncated);
        window.open(`https://wa.me/${member.whatsapp.replace(/\D/g, '')}?text=${encoded}`, '_blank');
        setShowShareMenu(false);
    }, [formatConversation]);
    
    // Start chat with pre-filled context (for Journey integration)
    const startChatWithContext = useCallback((context: string, systemPrompt?: string) => {
        // Clear current chat
        setMessages([]);
        setCurrentSessionId(null);
        
        // Set Central Mode for cross-investigation analysis
        setSelectedInv('ALL');
        
        // Pre-fill input with context
        const prompt = systemPrompt 
            ? `${systemPrompt}\n\n---\n\n${context}`
            : `Analise o seguinte resultado do Diário de Bordo:\n\n${context}`;
        
        setInput(prompt);
        
        // Navigate to chat
        router.push('/chat');
        
        // Show toast
        showToast('Contexto carregado no Chat!', 'success');
    }, [router, showToast]);
    
    // Share internally
    const shareInternally = useCallback(async () => {
        if (!currentSessionId || selectedMembersToShare.length === 0) return;
        
        setSharingInProgress(true);
        try {
            const res = await fetch('/api/chat/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: currentSessionId,
                    member_ids: selectedMembersToShare,
                    can_interact: shareCanInteract
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                showToast(`✅ Conversa compartilhada com ${data.count || selectedMembersToShare.length} membro(s)!`, 'success');
                setShowShareModal(false);
            } else {
                const error = await res.json();
                showToast(`❌ ${error.error || 'Falha ao compartilhar'}`, 'error');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            showToast('❌ Erro ao compartilhar conversa', 'error');
        } finally {
            setSharingInProgress(false);
        }
    }, [currentSessionId, selectedMembersToShare, shareCanInteract, showToast]);
    
    // Send message
    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading || !selectedInv) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageContent = input;
        setInput('');
        setLoading(true);

        try {
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Classify prompt for telemetry
            const promptMetadata = classifyForTelemetry(messageContent);
            
            // Context Bridge: Build visual context from IntelinkFocus
            const visualContext = intelinkFocus ? {
                investigationTitle: intelinkFocus.focus.investigationTitle,
                selectedEntities: intelinkFocus.focus.selectedEntities,
                activeView: intelinkFocus.focus.activeView,
            } : undefined;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...conversationHistory, { role: 'user', content: messageContent }],
                    investigationId: isCentralMode ? null : selectedInv,
                    mode: isCentralMode ? 'central' : 'single',
                    saveHistory: true,
                    sessionId: currentSessionId,
                    telemetry: promptMetadata,
                    visualContext, // Context Bridge: Send visual context to API
                })
            });

            const data = await response.json();
            setContextSize(data.contextSize || 0);
            
            // Update session ID if a new one was created
            if (data.sessionId) {
                const isNewSession = !currentSessionId && data.sessionId;
                
                if (data.sessionId !== currentSessionId) {
                    setCurrentSessionId(data.sessionId);
                }
                
                // Reload history to show new conversation in sidebar
                setTimeout(() => loadChatHistory(), 500);
                
                // Navigate to /chat/[id] on first message (keeps shell persistent)
                if (isNewSession) {
                    router.replace(`/chat/${data.sessionId}`, { scroll: false });
                }
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || 'Erro ao processar mensagem.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Erro ao conectar com a IA. Tente novamente.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, selectedInv, messages, currentSessionId, isCentralMode, router, loadChatHistory, intelinkFocus]);
    
    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Load data on mount
    useEffect(() => {
        loadInvestigations();
        loadChatHistory();
        loadTeamMembers();
    }, [loadInvestigations, loadChatHistory, loadTeamMembers]);
    
    // Auto-select investigation from URL parameter (e.g., /chat?inv=xxx)
    useEffect(() => {
        const invParam = searchParams?.get('inv');
        if (invParam && investigations.length > 0 && !selectedInv) {
            // Check if the investigation exists
            const invExists = investigations.find(i => i.id === invParam);
            if (invExists) {
                setSelectedInv(invParam);
                console.log('Auto-selected investigation from URL:', invParam);
            }
        }
        
        // Handle Journey integration (source=journey)
        const sourceParam = searchParams?.get('source');
        if (sourceParam === 'journey' && typeof window !== 'undefined') {
            const journeyContext = sessionStorage.getItem('journey_analysis_context');
            if (journeyContext) {
                // Clear the storage
                sessionStorage.removeItem('journey_analysis_context');
                
                // Set Central Mode and pre-fill input
                setSelectedInv('ALL');
                setInput(`Analise o seguinte resultado do Diário de Bordo:\n\n${journeyContext}`);
                
                console.log('[Chat] Loaded context from Journey');
            }
        }
    }, [searchParams, investigations, selectedInv]);
    
    // Detect session from URL and load
    useEffect(() => {
        const match = pathname?.match(/\/chat\/([^/]+)/);
        if (match) {
            const sessionId = match[1];
            if (sessionId !== currentSessionId && sessionId !== 'new') {
                loadSession(sessionId);
            }
        }
    }, [pathname, currentSessionId, loadSession]);
    
    const value: ChatContextType = {
        messages,
        setMessages,
        input,
        setInput,
        loading,
        currentSessionId,
        setCurrentSessionId,
        selectedInv,
        setSelectedInv,
        investigations,
        loadingInvestigations,
        isCentralMode,
        startChatWithContext,
        showHistory,
        setShowHistory,
        chatSessions,
        sharedSessions,
        historyTab,
        setHistoryTab,
        teamMembers,
        shareableMembers,
        showShareModal,
        setShowShareModal,
        showShareMenu,
        setShowShareMenu,
        selectedMembersToShare,
        setSelectedMembersToShare,
        shareCanInteract,
        setShareCanInteract,
        sharingInProgress,
        showExportMenu,
        setShowExportMenu,
        copied,
        toast,
        showToast,
        contextSize,
        isSharedSession,
        messagesEndRef,
        sendMessage,
        loadSession,
        loadChatHistory,
        startNewChat,
        deleteSession,
        handleSelectInvestigation,
        toggleMemberSelection,
        shareInternally,
        copyToClipboard,
        formatConversation,
        exportAsTxt,
        exportAsMd,
        exportAsHtml,
        exportAsPdf,
        shareWithMember,
        openShareModal,
    };
    
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
