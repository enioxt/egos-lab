'use client';

/**
 * ChatMessages - Área de mensagens com paleta sóbria
 * Cores: slate-700/800/900, sem gradientes coloridos
 */

import { User, Bot, Network, Building2, MessageSquare, Sparkles } from 'lucide-react';
import { useChat } from '@/providers/ChatContext';
import ChatGraphWidget, { parseGraphFromContent } from './ChatGraphWidget';

export function ChatMessages() {
    const {
        messages,
        loading,
        selectedInv,
        isCentralMode,
        messagesEndRef,
        investigations,
        setInput,
    } = useChat();
    
    // Handle suggestion click - set input text
    const handleSuggestionClick = (text: string) => {
        setInput(text);
    };
    
    // Empty state quando nenhuma operação selecionada
    if (!selectedInv) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                        <Network className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Selecione uma Operação</h3>
                    <p className="text-slate-400 text-sm">
                        Escolha uma operação no seletor acima para iniciar uma conversa.
                    </p>
                </div>
            </div>
        );
    }
    
    // Empty state quando sem mensagens
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                <div className="text-center max-w-xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                        {isCentralMode ? (
                            <Building2 className="w-10 h-10 text-cyan-400" />
                        ) : (
                            <MessageSquare className="w-10 h-10 text-cyan-400" />
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                        {isCentralMode ? 'Central de Inteligência' : 'Chat de Operação'}
                    </h3>
                    <p className="text-slate-300 text-base mb-8 leading-relaxed">
                        {isCentralMode 
                            ? `Acesso a ${investigations.length} operações. Identifique padrões e conexões entre casos.`
                            : 'Faça perguntas sobre a operação. Tenho acesso a entidades, evidências e relacionamentos.'
                        }
                    </p>
                    
                    {/* Sugestões - Clicáveis */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        {(isCentralMode ? [
                            'Quais operações têm entidades em comum?',
                            'Existe algum padrão entre os casos?',
                        ] : [
                            'Quem são os principais envolvidos?',
                            'Quais são as conexões mais relevantes?',
                        ]).map((suggestion, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="group px-4 py-2.5 bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-600 hover:border-cyan-500/50 rounded-xl text-sm text-slate-200 hover:text-cyan-300 transition-all duration-200 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    // Lista de mensagens
    return (
        <div className="flex-1 overflow-y-auto bg-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-slate-400" />
                            </div>
                        )}
                        
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                            msg.role === 'user' 
                                ? 'bg-slate-700 text-white' 
                                : 'bg-slate-800 text-slate-200'
                        }`}>
                            {/* Parse and render graph widgets in AI responses */}
                            {msg.role === 'assistant' ? (() => {
                                const { textBefore, graphData, textAfter } = parseGraphFromContent(msg.content);
                                return (
                                    <>
                                        {textBefore && (
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {textBefore}
                                            </div>
                                        )}
                                        {graphData && (
                                            <div className="my-3">
                                                <ChatGraphWidget data={graphData} />
                                            </div>
                                        )}
                                        {textAfter && (
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {textAfter}
                                            </div>
                                        )}
                                        {!textBefore && !graphData && !textAfter && (
                                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {msg.content}
                                            </div>
                                        )}
                                    </>
                                );
                            })() : (
                                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </div>
                            )}
                            <div className="text-xs text-slate-500 mt-2">
                                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-300" />
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Loading indicator */}
                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="bg-slate-800 rounded-xl px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
