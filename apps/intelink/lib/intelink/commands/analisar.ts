/**
 * Analisar Command - INTELINK Bot
 * 
 * Executa análise de rede para detectar pontes e padrões
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';

export const analisarCommand: Command = {
    name: 'analisar',
    aliases: ['analyze', 'analysis', 'bridge'],
    description: 'Analisar rede e detectar pontes',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, userId } = ctx;
        const { supabase, sendMessage } = deps;

        // Buscar operação ativa do usuário
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('investigation_id, investigation:intelink_investigations(id, title)')
            .eq('user_id', userId)
            .single();

        if (!session?.investigation_id) {
            await sendMessage(chatId, `⚠️ **Selecione uma operação primeiro**

Use \`/investigacoes\` para listar e selecionar.`);
            return;
        }

        const invTitle = (session as any).investigation?.title || 'Operação';

        await sendMessage(chatId, `🔍 **Analisando rede...**\n\n📂 ${invTitle}\n\n⏳ Aguarde...`);

        // Buscar entidades
        const { data: entities } = await supabase
            .from('intelink_entities')
            .select('id, name, type')
            .eq('investigation_id', session.investigation_id);

        // Buscar relacionamentos
        const { data: relationships } = await supabase
            .from('intelink_relationships')
            .select('source_id, target_id, type')
            .eq('investigation_id', session.investigation_id);

        if (!entities || entities.length === 0) {
            await sendMessage(chatId, `📭 **Operação vazia**

Não há entidades para analisar.

💡 Use \`/inserir\` ou \`/modelo\` para adicionar dados.`);
            return;
        }

        if (!relationships || relationships.length === 0) {
            await sendMessage(chatId, `⚠️ **Sem relacionamentos**

Há ${entities.length} entidades, mas nenhum vínculo.

💡 Adicione relacionamentos para análise de rede.`);
            return;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // ANÁLISE: Degree Centrality (conectividade)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const degreeMap = new Map<string, number>();
        
        for (const rel of relationships) {
            degreeMap.set(rel.source_id, (degreeMap.get(rel.source_id) || 0) + 1);
            degreeMap.set(rel.target_id, (degreeMap.get(rel.target_id) || 0) + 1);
        }

        // Ordenar por grau (mais conectados primeiro)
        const sortedByDegree = Array.from(degreeMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Mapear IDs para nomes
        const entityMap = new Map(entities.map(e => [e.id, e]));

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // FORMATAÇÃO DO RESULTADO
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        let msg = `🕸️ **ANÁLISE DE REDE**
${VISUAL.separator}
📂 **${invTitle}**

📊 **Estatísticas:**
• Entidades: ${entities.length}
• Vínculos: ${relationships.length}
• Densidade: ${(relationships.length / (entities.length * (entities.length - 1) / 2) * 100).toFixed(1)}%

${VISUAL.separatorShort}
🌉 **TOP CONECTORES (Pontes Potenciais):**

`;

        for (let i = 0; i < sortedByDegree.length; i++) {
            const [entityId, degree] = sortedByDegree[i];
            const entity = entityMap.get(entityId);
            if (!entity) continue;

            const typeInfo = VISUAL.getType(entity.type);
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '•';
            
            msg += `${medal} ${typeInfo.icon} **${entity.name}**\n`;
            msg += `   ${degree} conexão(ões)\n`;
        }

        // Identificar clusters (grupos isolados)
        const visited = new Set<string>();
        let clusters = 0;
        
        const dfs = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            
            for (const rel of relationships) {
                if (rel.source_id === nodeId) dfs(rel.target_id);
                if (rel.target_id === nodeId) dfs(rel.source_id);
            }
        };

        for (const entity of entities) {
            if (!visited.has(entity.id)) {
                dfs(entity.id);
                clusters++;
            }
        }

        msg += `
${VISUAL.separatorShort}
🔗 **Componentes Conectados:** ${clusters}
${clusters > 1 ? `⚠️ Há ${clusters} grupos isolados na rede.` : '✅ Rede totalmente conectada.'}

${VISUAL.separatorShort}
👉 \`/grafo [nome]\` - Ver conexões de uma entidade
👉 \`/quem [nome]\` - Perfil detalhado
🌐 [Dashboard Visual](http://localhost:3001/graph/${session.investigation_id})`;

        await sendMessage(chatId, msg);
    }
};
