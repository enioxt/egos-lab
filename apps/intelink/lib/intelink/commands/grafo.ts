/**
 * Grafo Command - INTELINK Bot
 * 
 * Mostra conexões de uma entidade em formato visual
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const grafoCommand: Command = {
    name: 'grafo',
    aliases: ['graph'],
    description: 'Ver conexões de uma entidade',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, args } = ctx;
        const { supabase, sendMessage } = deps;

        const startNodeName = args.trim();

        // Se não passou nome, mostrar ajuda
        if (!startNodeName) {
            await sendMessage(chatId, `🕸️ **GRAFO DE CONEXÕES**
${VISUAL.separator}

📝 **Como usar:**
\`/grafo [nome]\`

💡 **Exemplos:**
• \`/grafo Carlos\` - Conexões de Carlos
• \`/grafo Honda\` - Conexões do veículo
• \`/grafo Flores\` - Conexões do endereço

ℹ️ Mostra todas as conexões diretas (1º grau) da entidade.`);
            return;
        }

        // BUSCA GLOBAL - não requer operação ativa
        const { data: startNode, error } = await supabase
            .from('intelink_entities')
            .select('id, name, type, investigation_id')
            .ilike('name', `%${startNodeName}%`)
            .limit(1)
            .single();

        if (error || !startNode) {
            await sendMessage(chatId, `🚫 Entidade "${startNodeName}" não encontrada.

💡 **Dicas:**
• Verifique a grafia
• Use parte do nome
• Use \`/buscar ${startNodeName}\` para buscar`);
            return;
        }

        // Buscar todas as conexões (1º grau)
        const { data: connections } = await supabase
            .from('intelink_relationships')
            .select(`
                id,
                type,
                description,
                source:source_id(id, name, type),
                target:target_id(id, name, type)
            `)
            .or(`source_id.eq.${startNode.id},target_id.eq.${startNode.id}`)
            .limit(20);

        const typeInfo = VISUAL.getType(startNode.type);
        let msg = `🕸️ **GRAFO: ${startNode.name}**
${VISUAL.separator}
${typeInfo.icon} **Tipo:** ${typeInfo.label}

`;

        if (!connections || connections.length === 0) {
            msg += `ℹ️ Nenhuma conexão encontrada para esta entidade.

💡 Use \`/inserir\` para adicionar relacionamentos.`;
        } else {
            msg += `🔗 **${connections.length} conexão(ões):**\n\n`;

            // Agrupar por tipo de relacionamento
            const grouped: Record<string, any[]> = {};
            for (const conn of connections) {
                const relType = conn.type || 'RELACIONADO';
                if (!grouped[relType]) grouped[relType] = [];
                grouped[relType].push(conn);
            }

            for (const [relType, conns] of Object.entries(grouped)) {
                msg += `**${relType}:**\n`;
                
                for (const conn of conns) {
                    const source = conn.source as any;
                    const target = conn.target as any;
                    
                    // Determinar o "outro" nó
                    const other = source?.id === startNode.id ? target : source;
                    if (!other) continue;

                    const otherTypeInfo = VISUAL.getType(other.type);
                    msg += `  ${otherTypeInfo.icon} ${other.name}`;
                    
                    if (conn.description) {
                        msg += `\n    _${conn.description}_`;
                    }
                    msg += '\n';
                }
                msg += '\n';
            }
        }

        // Smart links
        msg += `${VISUAL.separatorShort}
👉 \`/quem ${startNode.name}\` - Perfil completo
👉 \`/buscar ${startNode.name.split(' ')[0]}\` - Buscar relacionados`;

        await sendMessage(chatId, msg);
    }
};
