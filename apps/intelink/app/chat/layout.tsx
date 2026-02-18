'use client';

/**
 * Chat Layout - Persistent Shell (ChatGPT style)
 * 
 * Layout:
 * - Sidebar esquerdo: sempre visível, com histórico e ações
 * - Header: minimalista, apenas seletor de operação
 * - Messages: área central que muda entre rotas
 * - Input: fixo na parte inferior
 */

import { Suspense } from 'react';
import { ChatProvider } from '@/providers/ChatContext';
import { ChatSidebar, ChatHeader, ChatInput } from '@/components/chat';
import { Loader2 } from 'lucide-react';

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <ChatProvider>
            <div className="min-h-screen bg-slate-900 text-white flex">
                {/* Sidebar - Sempre visível */}
                <ChatSidebar />
                
                {/* Main Content */}
                <main className="flex-1 flex flex-col min-h-screen">
                    {/* Header Minimalista */}
                    <ChatHeader />
                    
                    {/* Messages Area */}
                    {children}
                    
                    {/* Input Fixo */}
                    <ChatInput />
                </main>
            </div>
        </ChatProvider>
    );
}

function ChatLoading() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
    );
}

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<ChatLoading />}>
            <ChatLayoutContent>{children}</ChatLayoutContent>
        </Suspense>
    );
}
