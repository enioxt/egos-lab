'use client';

/**
 * ChatSidebar - Sidebar completo estilo ChatGPT
 * Inclui: Logo clicável, Nova conversa, Histórico, Ações (export/share)
 */

import Link from 'next/link';
import { 
    MessageSquarePlus, History, Trash2, ChevronLeft, ChevronRight,
    Download, Copy, Share2, FileText, Users, Check,
    Brain, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useChat } from '@/providers/ChatContext';
import { useState, useEffect, useRef } from 'react';

export function ChatSidebar() {
    const {
        showHistory,
        setShowHistory,
        chatSessions,
        sharedSessions,
        historyTab,
        setHistoryTab,
        currentSessionId,
        deleteSession,
        loadChatHistory,
        startNewChat,
        messages,
        copied,
        copyToClipboard,
        exportAsTxt,
        exportAsMd,
        exportAsHtml,
        exportAsPdf,
        teamMembers,
        shareWithMember,
        shareableMembers,
        showShareModal,
        setShowShareModal,
        selectedMembersToShare,
        setSelectedMembersToShare,
        toggleMemberSelection,
        shareCanInteract,
        setShareCanInteract,
        shareInternally,
        sharingInProgress,
    } = useChat();
    
    const [collapsed, setCollapsed] = useState(false);
    const [showExportSubmenu, setShowExportSubmenu] = useState(false);
    const [showShareSubmenu, setShowShareSubmenu] = useState(false);
    
    const exportRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    
    // Fecha menus ao clicar fora ou apertar ESC
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setShowExportSubmenu(false);
            }
            if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
                setShowShareSubmenu(false);
            }
        }
        
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setShowExportSubmenu(false);
                setShowShareSubmenu(false);
                setShowShareModal(false);
            }
        }
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [setShowShareModal]);
    
    // Handler para abrir modal de compartilhamento
    const handleOpenShareModal = () => {
        if (!currentSessionId) {
            alert('Envie uma mensagem primeiro para criar a conversa.');
            return;
        }
        setShowShareModal(true);
        setShowShareSubmenu(false);
        setSelectedMembersToShare([]);
        setShareCanInteract(false);
    };
    
    // Obter nome do usuário atual do localStorage
    const [currentUserName, setCurrentUserName] = useState<string | null>(null);
    
    useEffect(() => {
        const username = localStorage.getItem('intelink_username');
        setCurrentUserName(username);
    }, []);
    
    // Filtrar o próprio usuário da lista
    const filteredShareableMembers = shareableMembers.filter(member => {
        if (currentUserName) {
            return member.name.toLowerCase() !== currentUserName.toLowerCase();
        }
        return true;
    });
    
    // Filtrar teamMembers (WhatsApp) também
    const filteredTeamMembers = teamMembers.filter(member => {
        if (currentUserName) {
            return member.name.toLowerCase() !== currentUserName.toLowerCase();
        }
        return true;
    });
    
    // Sidebar colapsado
    if (collapsed) {
        return (
            <aside className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 flex-shrink-0">
                <button
                    onClick={() => setCollapsed(false)}
                    className="p-4 hover:bg-slate-800 transition-colors"
                    title="Expandir sidebar"
                >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                
                <Link
                    href="/"
                    className="p-4 hover:bg-slate-800 transition-colors"
                    title="Voltar ao início"
                >
                    <Brain className="w-5 h-5 text-slate-400" />
                </Link>
                
                <button
                    onClick={startNewChat}
                    className="p-4 hover:bg-slate-800 transition-colors"
                    title="Nova conversa"
                >
                    <MessageSquarePlus className="w-5 h-5 text-slate-400" />
                </button>
                
                <button
                    onClick={() => { setCollapsed(false); setShowHistory(true); loadChatHistory(); }}
                    className="p-4 hover:bg-slate-800 transition-colors relative"
                    title="Histórico"
                >
                    <History className="w-5 h-5 text-slate-400" />
                    {sharedSessions.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                </button>
            </aside>
        );
    }
    
    return (
        <>
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden">
                {/* Header do Sidebar - INTELINK clicável */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-slate-300" />
                        </div>
                        <span className="font-semibold text-white">INTELINK</span>
                    </Link>
                    <button
                        onClick={() => setCollapsed(true)}
                        className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                        title="Recolher sidebar"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                
                {/* Botão Nova Conversa */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-left"
                    >
                        <MessageSquarePlus className="w-5 h-5 text-slate-300" />
                        <span className="text-sm font-medium text-white">Nova Conversa</span>
                    </button>
                </div>
                
                {/* Tabs Histórico */}
                <div className="flex border-b border-slate-800 mx-3 flex-shrink-0">
                    <button
                        onClick={() => { setHistoryTab('mine'); loadChatHistory(); }}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                            historyTab === 'mine' 
                                ? 'text-white border-b-2 border-slate-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Minhas ({chatSessions.length})
                    </button>
                    <button
                        onClick={() => { setHistoryTab('shared'); loadChatHistory(); }}
                        className={`flex-1 py-2 text-xs font-medium transition-colors relative ${
                            historyTab === 'shared' 
                                ? 'text-white border-b-2 border-slate-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Compartilhadas ({sharedSessions.length})
                        {sharedSessions.length > 0 && historyTab !== 'shared' && (
                            <span className="absolute -top-0.5 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                    </button>
                </div>
                
                {/* Lista de Conversas */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {historyTab === 'mine' ? (
                        chatSessions.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhuma conversa
                            </div>
                        ) : (
                            chatSessions.map(session => (
                                <Link
                                    key={session.id}
                                    href={`/chat/${session.id}`}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-800 transition-colors group ${
                                        currentSessionId === session.id ? 'bg-slate-800' : ''
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-slate-200">
                                            {session.title || 'Conversa sem título'}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {session.mode === 'central' ? 'Central' : session.investigation?.title || 'Individual'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </Link>
                            ))
                        )
                    ) : (
                        sharedSessions.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                Nenhuma conversa compartilhada
                            </div>
                        ) : (
                            sharedSessions.map((session: any) => (
                                <Link
                                    key={`shared-${session.id}`}
                                    href={`/chat/${session.id}`}
                                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-slate-200">{session.title}</p>
                                        <p className="text-xs text-slate-500">
                                            {session.can_interact ? '• Interativo' : '• Somente leitura'}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )
                    )}
                </div>
                
                {/* Ações da Conversa Atual */}
                {messages.length > 0 && (
                    <div className="border-t border-slate-800 p-3 space-y-1 flex-shrink-0">
                        <p className="text-xs text-slate-500 px-2 mb-2">Conversa Atual</p>
                        
                        {/* Copiar */}
                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                        
                        {/* Exportar - Menu abre para cima */}
                        <div className="relative" ref={exportRef}>
                            <button
                                onClick={() => { setShowExportSubmenu(!showExportSubmenu); setShowShareSubmenu(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition-colors ${showExportSubmenu ? 'bg-slate-800' : ''}`}
                            >
                                <Download className="w-4 h-4" />
                                <span>Exportar</span>
                            </button>
                            {showExportSubmenu && (
                                <div className="absolute bottom-full left-0 mb-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                                    <button onClick={() => { exportAsTxt(); setShowExportSubmenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Texto (.txt)
                                    </button>
                                    <button onClick={() => { exportAsMd(); setShowExportSubmenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Markdown (.md)
                                    </button>
                                    <button onClick={() => { exportAsHtml(); setShowExportSubmenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> HTML (.html)
                                    </button>
                                    <button onClick={() => { exportAsPdf(); setShowExportSubmenu(false); }} className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-b-lg flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> PDF (.pdf)
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Compartilhar - Menu abre para cima */}
                        <div className="relative" ref={shareRef}>
                            <button
                                onClick={() => { setShowShareSubmenu(!showShareSubmenu); setShowExportSubmenu(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition-colors ${showShareSubmenu ? 'bg-slate-800' : ''}`}
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Compartilhar</span>
                            </button>
                            {showShareSubmenu && (
                                <div className="absolute bottom-full left-0 mb-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    <button
                                        onClick={handleOpenShareModal}
                                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg flex items-center gap-2 border-b border-slate-700"
                                    >
                                        <Users className="w-4 h-4" />
                                        <span>Gerenciar Compartilhamento</span>
                                    </button>
                                    
                                    {filteredTeamMembers.length > 0 && (
                                        <>
                                            <p className="px-3 py-1.5 text-xs text-slate-500 bg-slate-750">WhatsApp</p>
                                            {filteredTeamMembers.map(member => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => { shareWithMember(member); setShowShareSubmenu(false); }}
                                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                                >
                                                    <span className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">
                                                        {member.name.charAt(0)}
                                                    </span>
                                                    <span className="truncate">{member.name}</span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </aside>
            
            {/* Modal de Compartilhamento - Fixed overlay */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
                    <div 
                        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold text-white">Compartilhar Conversa</h3>
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Permissão */}
                            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-white">Permitir interação</p>
                                    <p className="text-xs text-slate-400">Membros podem enviar mensagens</p>
                                </div>
                                <button
                                    onClick={() => setShareCanInteract(!shareCanInteract)}
                                    className="text-slate-300 hover:text-white transition-colors"
                                >
                                    {shareCanInteract ? (
                                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8" />
                                    )}
                                </button>
                            </div>
                            
                            {/* Lista de Membros */}
                            <div>
                                <p className="text-sm font-medium text-slate-300 mb-2">
                                    Selecione os membros ({selectedMembersToShare.length} selecionados)
                                </p>
                                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                                    {filteredShareableMembers.length === 0 ? (
                                        <p className="text-sm text-slate-500 p-2 text-center">
                                            Nenhum membro disponível
                                        </p>
                                    ) : (
                                        filteredShareableMembers.map(member => (
                                            <button
                                                key={member.id}
                                                onClick={() => toggleMemberSelection(member.id)}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                                    selectedMembersToShare.includes(member.id)
                                                        ? 'bg-slate-600 text-white'
                                                        : 'hover:bg-slate-700 text-slate-300'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                    selectedMembersToShare.includes(member.id)
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-slate-600 text-slate-300'
                                                }`}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium">{member.name}</p>
                                                    {member.role && (
                                                        <p className="text-xs text-slate-500">{member.role}</p>
                                                    )}
                                                </div>
                                                {selectedMembersToShare.includes(member.id) && (
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={shareInternally}
                                disabled={selectedMembersToShare.length === 0 || sharingInProgress}
                                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {sharingInProgress ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Compartilhando...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4" />
                                        Compartilhar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
