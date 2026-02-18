/**
 * Chat Types - Shared interfaces for chat components
 */

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sender_id?: string;
    sender_name?: string;
}

export interface Investigation {
    id: string;
    title: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role?: string;
    rank?: string;
    whatsapp?: string;
    phone?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    mode: string;
    message_count: number;
    created_at: string;
    investigation?: { title: string };
    shared_with?: string[];
    can_interact?: boolean;
    shared_at?: string;
}

export interface Toast {
    message: string;
    type: 'success' | 'error';
}
