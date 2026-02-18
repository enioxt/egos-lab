'use client';

/**
 * Chat Session Page - /chat/[sessionId]
 * 
 * Existing conversation page. Uses ChatLayout shell and just renders messages.
 * The ChatContext detects the sessionId from URL and loads the session.
 * 
 * ~25 lines - massive reduction from original implementation!
 */

import { ChatMessages } from '@/components/chat';

export default function ChatSessionPage() {
    // The ChatContext in layout.tsx detects the sessionId from URL
    // and automatically loads the session
    // This page only renders the messages area
    return <ChatMessages />;
}
