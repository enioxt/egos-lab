'use client';

/**
 * Chat Page - /chat
 * 
 * New conversation page. Uses ChatLayout shell and just renders messages.
 * Supports debate mode via query params (?debate=true&investigation=ID&context=TEXT)
 * 
 * @version 1.1.0 - Added Tsun-Cha Debate Protocol support
 */

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatMessages } from '@/components/chat';
import { useChat } from '@/providers/ChatContext';

export const dynamic = 'force-dynamic';

function ChatPageContent() {
    const searchParams = useSearchParams();
    const { setInput, setSelectedInv, investigations } = useChat();
    
    // Handle debate mode from query params
    useEffect(() => {
        const isDebate = searchParams.get('debate') === 'true';
        const investigationId = searchParams.get('investigation');
        const context = searchParams.get('context');
        
        if (isDebate && investigationId) {
            // Auto-select the investigation
            setSelectedInv(investigationId);
            
            // Set initial debate prompt
            if (context) {
                const decodedContext = decodeURIComponent(context);
                const debatePrompt = `🔍 **MODO DEBATE ATIVADO**

A IA gerou esta síntese sobre a operação:
"${decodedContext}..."

Quero questionar: Esta análise está correta? Há algo que possa estar errado ou incompleto?`;
                
                setTimeout(() => setInput(debatePrompt), 500);
            }
        }
    }, [searchParams, investigations]);
    
    // The ChatLayout provides sidebar, header, input
    // This page only renders the messages area
    return <ChatMessages />;
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>}>
            <ChatPageContent />
        </Suspense>
    );
}
