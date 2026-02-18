/**
 * Comando /quem - Consulta detalhes de uma entidade
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const quemCommand: Command = {
    name: 'quem',
    aliases: ['who', 'perfil', 'profile'],
    description: 'Consultar perfil detalhado de uma entidade',
    
    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { supabase, sendMessage } = deps;
        const { chatId, args } = ctx;
        
        const query = args?.trim();
        
        if (!query) {
            await sendMessage(chatId, `👤 **CONSULTA DE ENTIDADE**
${VISUAL.separator}

📝 **Como usar:**
\`/quem [nome]\`

💡 **O que você pode consultar:**
• Pessoas (JOÃO SILVA)
• Veículos (ABC-1234)
• Telefones (11999999999)
• Organizações

🔎 **Exemplos:**
• \`/quem João\`
• \`/quem ABC-1234\`
• \`/quem 11999\``);
            return;
        }
        
        // Buscar entidade
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, vulgo, properties, observations,
                investigation:intelink_investigations(id, title)
            `)
            .or(`name.ilike.%${query}%,vulgo.ilike.%${query}%`)
            .limit(5);
        
        if (!entities || entities.length === 0) {
            await sendMessage(chatId, `❌ Nenhuma entidade encontrada para: "${query}"

💡 Tente:
• Usar parte do nome
• Verificar a grafia
• \`/buscar\` para busca mais ampla`);
            return;
        }
        
        // Se encontrou exatamente uma, mostrar detalhes
        if (entities.length === 1) {
            const ent = entities[0];
            await showEntityDetails(chatId, ent, deps);
            return;
        }
        
        // Se encontrou várias, mostrar lista
        let response = `👥 **Múltiplos resultados para:** "${query}"
${VISUAL.separator}

`;
        entities.forEach((ent, i) => {
            const typeInfo = VISUAL.getType(ent.type);
            response += `${i + 1}. ${typeInfo.icon} **${ent.name}**\n`;
            response += `   \`/quem ${ent.name}\`\n\n`;
        });
        
        response += `${VISUAL.separatorShort}\n`;
        response += `Selecione uma entidade pelo nome completo.`;
        
        await sendMessage(chatId, response);
    }
};

async function showEntityDetails(chatId: number, ent: any, deps: CommandDependencies) {
    const { supabase, sendMessage } = deps;
    const typeInfo = VISUAL.getType(ent.type);
    const invTitle = (ent.investigation as any)?.title || 'N/A';
    
    let response = `${typeInfo.icon} **${ent.name}**${ent.vulgo ? ` (${ent.vulgo})` : ''}
${VISUAL.separator}

📌 **Tipo:** ${typeInfo.label}
📁 **Operação:** ${invTitle}

`;
    
    // Propriedades
    if (ent.properties) {
        const props = ent.properties as Record<string, any>;
        response += `**📋 DADOS:**\n`;
        if (props.cpf) response += `• CPF: ${props.cpf}\n`;
        if (props.rg) response += `• RG: ${props.rg}\n`;
        if (props.birth_date) response += `• Nascimento: ${props.birth_date}\n`;
        if (props.phone) response += `• Telefone: ${props.phone}\n`;
        if (props.address) response += `• Endereço: ${props.address}\n`;
        if (props.plate) response += `• Placa: ${props.plate}\n`;
        if (props.brand) response += `• Marca: ${props.brand}\n`;
        if (props.model) response += `• Modelo: ${props.model}\n`;
        if (props.color) response += `• Cor: ${props.color}\n`;
        response += '\n';
    }
    
    // Observações
    if (ent.observations) {
        response += `**📝 OBSERVAÇÕES:**\n${ent.observations}\n\n`;
    }
    
    // Buscar relacionamentos
    const { data: rels } = await supabase
        .from('intelink_relationships')
        .select(`
            type, description,
            source:intelink_entities!source_id(name),
            target:intelink_entities!target_id(name)
        `)
        .or(`source_id.eq.${ent.id},target_id.eq.${ent.id}`)
        .limit(5);
    
    if (rels && rels.length > 0) {
        response += `**🔗 VÍNCULOS:**\n`;
        rels.forEach(r => {
            const other = (r.source as any)?.name === ent.name 
                ? (r.target as any)?.name 
                : (r.source as any)?.name;
            response += `• ${r.type}: ${other}\n`;
        });
        response += '\n';
    }
    
    response += `${VISUAL.separatorShort}\n`;
    response += `👉 \`/grafo ${ent.name.split(' ')[0]}\` - Ver conexões`;
    
    await sendMessage(chatId, response);
}
