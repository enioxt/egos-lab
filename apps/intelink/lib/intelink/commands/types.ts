/**
 * Command Pattern Types - INTELINK Bot
 * 
 * Tipos base para o sistema de comandos do bot Telegram
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONTEXT
// ============================================

export interface CommandContext {
    /** Chat ID do Telegram */
    chatId: number;
    /** ID do usuário */
    userId: number;
    /** Username do usuário */
    username: string;
    /** Texto do comando (sem o /) */
    text: string;
    /** Argumentos do comando (após o comando) */
    args: string;
    /** Tipo do chat (private, group, supergroup) */
    chatType: 'private' | 'group' | 'supergroup' | 'channel';
    /** Mensagem original completa */
    message: any;
}

export interface CommandDependencies {
    supabase: SupabaseClient;
    sendMessage: (chatId: number, text: string, replyMarkup?: any) => Promise<void>;
    sendMessageHTML: (chatId: number, text: string, replyMarkup?: any) => Promise<void>;
    sendMessageWithButtons: (chatId: number, text: string, buttons: any[][]) => Promise<void>;
    botToken: string;
}

// ============================================
// COMMAND INTERFACE
// ============================================

export interface Command {
    /** Nome do comando (sem /) */
    name: string;
    /** Aliases para o comando */
    aliases?: string[];
    /** Descrição do comando */
    description: string;
    /** Requer chat privado? */
    privateOnly?: boolean;
    /** Executa o comando */
    execute(ctx: CommandContext, deps: CommandDependencies): Promise<void>;
}

// ============================================
// COMMAND RESULT
// ============================================

export interface CommandResult {
    success: boolean;
    message?: string;
    data?: any;
}

// ============================================
// VISUAL CONFIG
// ============================================

export const VISUAL = {
    separator: '━━━━━━━━━━━━━━━━━━━━━━━━',
    separatorShort: '───────────',
    formatName: (name: string) => name?.toUpperCase() || 'ANÔNIMO',
    getType: (type: string) => {
        const types: Record<string, { icon: string; label: string }> = {
            'PERSON': { icon: '👤', label: 'PESSOA' },
            'VEHICLE': { icon: '🚗', label: 'VEÍCULO' },
            'PHONE': { icon: '📱', label: 'TELEFONE' },
            'LOCATION': { icon: '📍', label: 'LOCAL' },
            'ORGANIZATION': { icon: '🏢', label: 'ORGANIZAÇÃO' },
            'COMPANY': { icon: '🏪', label: 'EMPRESA' },
            'FIREARM': { icon: '🔫', label: 'ARMA' },
        };
        return types[type] || { icon: '📌', label: type };
    }
};
