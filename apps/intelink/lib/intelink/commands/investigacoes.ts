/**
 * Comando /investigacoes - Lista operações do usuário
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const investigacoesCommand: Command = {
    name: 'investigacoes',
    aliases: ['investigacao', 'investigation', 'caso', 'casos'],
    description: 'Listar e selecionar operações',
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, userId, args } = ctx;
        
        if (!userId) {
            await sendMessage(chatId, '⚠️ Não foi possível identificar o usuário.');
            return;
        }

        const name = args?.trim();
        
        // Se passou nome, selecionar operação
        if (name) {
            // Buscar operação pelo nome
            const { data: inv } = await supabase
                .from('intelink_investigations')
                .select('id, title')
                .ilike('title', `%${name}%`)
                .limit(1)
                .single();
            
            if (!inv) {
                await sendMessage(chatId, `❌ Operação "${name}" não encontrada.\n\nUse \`/investigacoes\` para ver a lista.`);
                return;
            }
            
            // Salvar na sessão do usuário
            await supabase
                .from('intelink_sessions')
                .upsert({
                    user_id: userId,
                    investigation_id: inv.id,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
            await sendMessage(chatId, `✅ **Operação selecionada:**\n\n📁 ${inv.title}\n\n💡 Agora você pode usar comandos como:\n• \`/exportar\` - Ver todos os dados\n• \`/buscar\` - Buscar entidades\n• \`/quem [nome]\` - Consultar pessoa`);
            return;
        }
        
        // Buscar operações do usuário
        const { data: sessions } = await supabase
            .from('intelink_sessions')
            .select('investigation_id')
            .eq('user_id', userId);
        
        const invIds = sessions?.map(s => s.investigation_id).filter(Boolean) || [];
        
        // Buscar operações
        let query = supabase
            .from('intelink_investigations')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(10);
        
        // Se usuário tem sessões, priorizar essas
        if (invIds.length > 0) {
            query = query.in('id', invIds);
        }
        
        const { data: investigations } = await query;
        
        if (!investigations || investigations.length === 0) {
            await sendMessage(chatId, `📭 **Nenhuma operação encontrada**\n${VISUAL.separator}\n\nVocê pode criar uma nova pelo dashboard:\n🌐 http://localhost:3001/investigation/new`);
            return;
        }
        
        let response = `📋 **INVESTIGAÇÕES**\n${VISUAL.separator}\n\n`;
        
        investigations.forEach((inv, i) => {
            const status = inv.status === 'active' ? '🟢' : inv.status === 'closed' ? '🔴' : '🟡';
            const date = new Date(inv.created_at).toLocaleDateString('pt-BR');
            response += `${status} **${inv.title}**\n`;
            response += `   📅 ${date}\n\n`;
        });
        
        response += `${VISUAL.separatorShort}\n`;
        response += `💡 Para selecionar: \`/investigacoes [nome]\`\n`;
        response += `🌐 Dashboard: http://localhost:3001`;
        
        await sendMessage(chatId, response);
    }
};
