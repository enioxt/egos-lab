/**
 * Comando /vincular - Vincula Telegram ao membro pelo telefone
 * 
 * Uso: /vincular 34991234567
 * 
 * Este comando permite que um membro vincule seu Telegram
 * ao sistema Intelink para receber OTPs e notificações.
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const vincularCommand: Command = {
    name: 'vincular',
    aliases: ['link', 'conectar'],
    description: 'Vincula seu Telegram ao sistema pelo número de telefone',
    privateOnly: true, // Only works in private chat for security
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, userId, args, username, message } = ctx;
        
        // Extract first_name from message if available
        const firstName = message?.from?.first_name || '';
        const lastName = message?.from?.last_name || '';
        
        // Se não passou telefone, mostra instruções
        if (!args?.trim()) {
            await sendMessage(chatId, `🔗 **VINCULAR TELEGRAM**
${VISUAL.separator}

Para vincular seu Telegram ao sistema, envie:

\`/vincular SEU_TELEFONE\`

**Exemplo:**
\`/vincular 34991234567\`

${VISUAL.separatorShort}
ℹ️ Use apenas números, sem espaços ou caracteres especiais.
⚠️ O telefone deve estar cadastrado no sistema.`);
            return;
        }
        
        // Normaliza o telefone (remove tudo que não é número)
        const phone = args.replace(/\D/g, '');
        
        if (phone.length < 10 || phone.length > 13) {
            await sendMessage(chatId, `❌ **Telefone inválido**

O número informado não parece válido.
Use apenas números, no formato: \`34991234567\`

📞 Informe DDD + número (10 ou 11 dígitos)`);
            return;
        }
        
        console.log('[Vincular] Attempting to link phone:', phone, 'to chatId:', chatId);
        
        // Busca membro pelo telefone
        const { data: member, error } = await supabase
            .from('intelink_unit_members')
            .select('id, name, phone, telegram_chat_id, telegram_user_id, telegram_username')
            .eq('phone', phone)
            .maybeSingle();
        
        if (error) {
            console.error('[Vincular] Error:', error);
            await sendMessage(chatId, `❌ **Erro interno**

Não foi possível buscar o cadastro. Tente novamente.`);
            return;
        }
        
        if (!member) {
            await sendMessage(chatId, `❌ **Telefone não cadastrado**

O número \`${phone}\` não está cadastrado no sistema.

🔹 Verifique se digitou corretamente
🔹 Entre em contato com o administrador para ser cadastrado`);
            return;
        }
        
        // Verifica se já está vinculado a outro Telegram
        if (member.telegram_chat_id && member.telegram_chat_id !== String(chatId)) {
            await sendMessage(chatId, `⚠️ **Já vinculado**

Este número já está vinculado a outro Telegram.

Se você trocou de número ou conta, peça ao administrador para desvincular o anterior.`);
            return;
        }
        
        // Já está vinculado ao mesmo chat
        if (member.telegram_chat_id === String(chatId)) {
            await sendMessage(chatId, `✅ **Já vinculado!**

Seu Telegram já está vinculado a este número.

👤 ${member.name}
📞 ${phone}

Você já pode fazer login no sistema web.`);
            return;
        }
        
        // Faz a vinculação
        const telegramUsername = username || `${firstName || ''} ${lastName || ''}`.trim() || null;
        
        const { error: updateError } = await supabase
            .from('intelink_unit_members')
            .update({
                telegram_chat_id: String(chatId),
                telegram_user_id: String(userId),
                telegram_username: telegramUsername
            })
            .eq('id', member.id);
        
        if (updateError) {
            console.error('[Vincular] Update error:', updateError);
            await sendMessage(chatId, `❌ **Erro ao vincular**

Não foi possível completar a vinculação. Tente novamente.`);
            return;
        }
        
        console.log('[Vincular] Successfully linked:', member.name, 'to chatId:', chatId);
        
        await sendMessage(chatId, `✅ **Telegram vinculado com sucesso!**
${VISUAL.separator}

👤 **${member.name}**
📞 ${phone}
💬 Chat ID: ${chatId}

${VISUAL.separatorShort}
🔐 Agora você pode fazer login no sistema web.
📲 Você receberá códigos OTP por aqui.

🌐 **Acesse:** https://intelink.ia.br/auth`);
    }
};
