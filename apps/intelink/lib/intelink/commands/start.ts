/**
 * Comando /iniciar - Gera link de acesso ao dashboard
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';
import crypto from 'crypto';

function generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export const startCommand: Command = {
    name: 'iniciar',
    aliases: ['start'],
    description: 'Gera link de acesso ao dashboard web',
    privateOnly: true,

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessageHTML } = deps;
        
        // Generate access token for web dashboard
        const token = generateAccessToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        
        // Store token with user_id for security
        await supabase.from('intelink_sessions').upsert({
            chat_id: ctx.chatId,
            user_id: ctx.userId,
            username: ctx.username,
            access_token: token,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
        });

        // Use production URL for /iniciar
        const webUrl = `https://intelink-production.vercel.app/auth?token=${token}`;
        
        const welcomeMsg = `🕵️ <b>INTELINK ATIVADO</b>
━━━━━━━━━━━━━━━━━━━

Olá, <b>${VISUAL.formatName(ctx.username)}</b>!
Sistema de Inteligência Policial pronto.

───────────
📋 <b>COMANDOS PRINCIPAIS:</b>

• <code>/investigacoes</code> → Listar operações
• <code>/exportar</code> → Ver todos dados do caso
• <code>/buscar [termo]</code> → Busca inteligente
• <code>/analisar</code> → Análise de rede
• <code>/inserir {json}</code> → Adicionar dados
• <code>/modelo</code> → Templates de extração

───────────
🌐 <b>ACESSO WEB (24h):</b>
${webUrl}

<i>Copie o link acima e cole no navegador.</i>`;

        await sendMessageHTML(ctx.chatId, welcomeMsg, {
            inline_keyboard: [
                [{ text: "📂 Selecionar Caso", callback_data: "case_select" }],
                [{ text: "🔍 Buscar", callback_data: "search_prompt" }, { text: "🌉 Analisar", callback_data: "analyze_bridge" }],
                [{ text: "📥 Inserir Dados", callback_data: "menu_prompts" }]
            ]
        });
    }
};

export const devCommand: Command = {
    name: 'dev',
    aliases: [],
    description: 'Gera link de desenvolvimento (localhost)',
    privateOnly: true,

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessageHTML } = deps;
        
        const token = generateAccessToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await supabase.from('intelink_sessions').upsert({
            chat_id: ctx.chatId,
            user_id: ctx.userId,
            username: ctx.username,
            access_token: token,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
        });

        const webUrl = `http://localhost:3001/auth?token=${token}`;
        
        const devMsg = `🛠️ <b>AMBIENTE DE DESENVOLVIMENTO</b>
━━━━━━━━━━━━━━━━━━━

<b>${VISUAL.formatName(ctx.username)}</b>, link de desenvolvimento gerado.

🌐 <b>ACESSO LOCAL (24h):</b>
${webUrl}

<i>⚠️ Este link só funciona se você tiver o servidor rodando localmente.</i>`;

        await sendMessageHTML(ctx.chatId, devMsg);
    }
};

export default startCommand;
