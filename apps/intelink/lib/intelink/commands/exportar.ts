/**
 * Comando /exportar - Exporta dados da operação
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const exportarCommand: Command = {
    name: 'exportar',
    aliases: ['export', 'dump'],
    description: 'Exportar todos os dados da operação ativa',
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, userId } = ctx;
        
        // Buscar sessão do usuário
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('investigation_id')
            .eq('user_id', userId)
            .single();
        
        if (!session?.investigation_id) {
            await sendMessage(chatId, '⚠️ Selecione uma operação primeiro: `/investigacoes`');
            return;
        }
        
        // Buscar dados da operação
        const { data: inv } = await supabase
            .from('intelink_investigations')
            .select('id, title, status, created_at')
            .eq('id', session.investigation_id)
            .single();
        
        if (!inv) {
            await sendMessage(chatId, '❌ Operação não encontrada.');
            return;
        }
        
        // Buscar entidades
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type, vulgo, properties')
            .eq('investigation_id', session.investigation_id);
        
        // Buscar relacionamentos
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('id, type, description, source_id, target_id')
            .eq('investigation_id', session.investigation_id);
        
        // Agrupar entidades por tipo
        const byType: Record<string, any[]> = {};
        entities?.forEach(e => {
            if (!byType[e.type]) byType[e.type] = [];
            byType[e.type].push(e);
        });
        
        // Montar resposta
        let response = `📊 **EXPORTAÇÃO: ${inv.title}**
${VISUAL.separator}

📅 Criado: ${new Date(inv.created_at).toLocaleDateString('pt-BR')}
📌 Status: ${inv.status === 'active' ? '🟢 Ativo' : '🔴 Fechado'}

`;
        
        // Estatísticas
        response += `**📈 ESTATÍSTICAS:**\n`;
        response += `• Entidades: ${entities?.length || 0}\n`;
        response += `• Vínculos: ${relationships?.length || 0}\n\n`;
        
        // Listar por tipo
        response += `**📋 ENTIDADES POR TIPO:**\n`;
        Object.entries(byType).forEach(([type, ents]) => {
            const typeInfo = VISUAL.getType(type);
            response += `\n${typeInfo.icon} **${typeInfo.label}** (${ents.length})\n`;
            ents.slice(0, 5).forEach(e => {
                response += `• ${e.name}${e.vulgo ? ` (${e.vulgo})` : ''}\n`;
            });
            if (ents.length > 5) {
                response += `_... e mais ${ents.length - 5}_\n`;
            }
        });
        
        response += `\n${VISUAL.separatorShort}\n`;
        response += `🌐 Ver completo: http://localhost:3001/investigation/${inv.id}`;
        
        await sendMessage(chatId, response);
    }
};
