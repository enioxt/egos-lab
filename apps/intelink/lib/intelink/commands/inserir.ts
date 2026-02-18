/**
 * Inserir Command - INTELINK Bot
 * 
 * Insere entidades e relacionamentos via JSON
 */

import { Command, CommandContext, CommandDependencies, VISUAL } from './types';
import OpenAI from 'openai';
import { checkRhoBeforeWrite } from '@/lib/rho-governance';

// Initialize OpenAI for embeddings
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'sk-placeholder',
    baseURL: "https://openrouter.ai/api/v1"
});

// Generate embedding for entity/relationship
async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0].embedding;
    } catch {
        return null;
    }
}

const TUTORIAL = `📥 **INSERÇÃO DE DADOS - GUIA COMPLETO**
━━━━━━━━━━━━━━━━━━━━━━━━

**O QUE SÃO ENTIDADES?**
Entidades são os elementos que compõem uma operação:
• 👤 **PERSON** - Pessoas (suspeitos, vítimas, testemunhas)
• 🚗 **VEHICLE** - Veículos (carros, motos, placas)
• 📍 **LOCATION** - Locais (endereços, estabelecimentos)
• 🏢 **ORGANIZATION** - Organizações (empresas, gangues)
• 🔫 **WEAPON** - Armas
• 📱 **PHONE** - Telefones
• 📄 **DOCUMENT** - Documentos (REDS, IPL)

───────────
**COMO INSERIR (2 Métodos):**

**📋 Método 1: Meta-Prompt (Recomendado)**
Use \`/modelo ocorrencia\` para obter um prompt pronto.
Cole no ChatGPT/Gemini junto com seus dados brutos.
A IA formata automaticamente!

**✍️ Método 2: JSON Manual**
\`\`\`
/inserir {
  "entities": [
    {"type": "PERSON", "name": "CARLOS JOSÉ", "metadata": {"cpf": "123.456.789-00", "role": "suspeito"}},
    {"type": "VEHICLE", "name": "Honda Civic", "metadata": {"plate": "ABC-1234", "color": "preto"}}
  ],
  "relationships": [
    {"source": "CARLOS JOSÉ", "target": "Honda Civic", "type": "PROPRIETARIO", "description": "Dono do veículo"}
  ]
}
\`\`\`

───────────
**📝 POCKET PROMPT (Copie e cole no ChatGPT):**

_"Atue como Escrivão de Polícia Digital. Vou passar dados de uma ocorrência. Extraia entidades no JSON padrão Intelink:_
_{entities: [{type, name, metadata}], relationships: [{source, target, type}]}_
_Corrija erros de português. Identifique o que falta."_

───────────
**DICAS:**
• Nomes sempre em MAIÚSCULAS
• Datas no formato DD/MM/AAAA
• CPF com pontuação: 123.456.789-00
• Placa com hífen: ABC-1234

👉 \`/modelo ocorrencia\` - Gerar meta-prompt
👉 \`/investigacoes\` - Selecionar operação primeiro`;

export const inserirCommand: Command = {
    name: 'inserir',
    aliases: ['ingest', 'add'],
    description: 'Inserir entidades e relacionamentos via JSON',

    async execute(ctx: CommandContext, deps: CommandDependencies): Promise<void> {
        const { chatId, userId, args, message } = ctx;
        const { supabase, sendMessage } = deps;

        const jsonStr = args.trim();

        // Se não passou JSON, mostrar tutorial
        if (!jsonStr || !jsonStr.startsWith('{')) {
            await sendMessage(chatId, TUTORIAL);
            return;
        }

        // Verificar operação ativa
        const { data: session } = await supabase
            .from('intelink_sessions')
            .select('investigation_id, investigation:intelink_investigations(id, title)')
            .eq('user_id', userId)
            .single();

        if (!session?.investigation_id) {
            await sendMessage(chatId, `⚠️ Selecione uma operação primeiro: \`/investigacoes\`

💡 _Dica: Cada usuário tem sua própria sessão._`);
            return;
        }

        try {
            // Limpar JSON de caracteres especiais do Telegram
            let cleanJson = jsonStr
                .replace(/[\u201C\u201D]/g, '"') // Aspas curvas → retas
                .replace(/[\u2018\u2019]/g, "'") // Apóstrofos curvos → retos
                .replace(/\n/g, ' ')
                .replace(/\t/g, ' ')
                .trim();

            // Extrair JSON se tiver texto antes
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanJson = jsonMatch[0];
            }

            const data = JSON.parse(cleanJson);
            const investigationId = session.investigation_id;
            const stats = { entities: 0, relationships: 0 };

            // Inserir entidades
            if (data.entities && Array.isArray(data.entities)) {
                for (const ent of data.entities) {
                    const embedding = await generateEmbedding(`${ent.name}: ${JSON.stringify(ent.metadata)}`);
                    const { data: insertedEnt } = await supabase
                        .from('intelink_entities')
                        .insert([{
                            investigation_id: investigationId,
                            type: ent.type || 'OTHER',
                            name: ent.name,
                            metadata: ent.metadata || {},
                            embedding,
                            // Source tracking: comando Telegram
                            source_type: 'telegram',
                            source_context: `Comando /inserir via Telegram`,
                        }])
                        .select()
                        .single();
                    if (insertedEnt) stats.entities++;
                }
            }

            // Inserir relacionamentos
            if (data.relationships && Array.isArray(data.relationships)) {
                for (const rel of data.relationships) {
                    const { data: sourceEnt } = await supabase
                        .from('intelink_entities')
                        .select('id')
                        .eq('investigation_id', investigationId)
                        .eq('name', rel.source)
                        .single();

                    const { data: targetEnt } = await supabase
                        .from('intelink_entities')
                        .select('id')
                        .eq('investigation_id', investigationId)
                        .eq('name', rel.target)
                        .single();

                    if (sourceEnt && targetEnt) {
                        // Check Rho Governance before creating relationship
                        const rhoDecision = await checkRhoBeforeWrite({
                            investigationId,
                            sourceEntityId: sourceEnt.id,
                            targetEntityId: targetEnt.id,
                            relationshipType: rel.type,
                            actorId: String(userId),
                            actorName: message?.from?.first_name || 'Telegram User'
                        });

                        // Log warnings but don't block (default policy)
                        if (rhoDecision.warnings.length > 0) {
                            console.log(`[RhoGovernance] Warnings for ${rel.source}->${rel.target}:`, rhoDecision.warnings);
                        }

                        // Create relationship (governance logged the decision)
                        const embedding = await generateEmbedding(
                            `${rel.type} connection between ${rel.source} and ${rel.target}: ${rel.description}`
                        );
                        await supabase.from('intelink_relationships').insert([{
                            investigation_id: investigationId,
                            source_id: sourceEnt.id,
                            target_id: targetEnt.id,
                            type: rel.type,
                            description: rel.description,
                            embedding
                        }]);
                        stats.relationships++;
                    }
                }
            }

            // Resposta
            const invTitle = (session as any).investigation?.title || 'Operação';
            await sendMessage(chatId, `✅ **Ingestão Concluída!**
${VISUAL.separator}

📂 **${invTitle}**

📊 **Inseridos:**
• 👥 Entidades: ${stats.entities}
• 🔗 Relacionamentos: ${stats.relationships}

👉 \`/exportar\` - Ver todos os dados
👉 \`/grafo\` - Visualizar conexões`);

            // Notificar grupos (se inserido via chat privado)
            if (message?.chat?.type === 'private' && stats.entities > 0) {
                const { data: groups } = await supabase
                    .from('intelink_group_config')
                    .select('group_chat_id, group_name')
                    .eq('notify_new_entities', true);

                if (groups && groups.length > 0) {
                    const userName = message?.from?.first_name || message?.from?.username || 'Membro';

                    const entityTypes = data.entities?.reduce((acc: Record<string, number>, e: any) => {
                        acc[e.type] = (acc[e.type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>) || {};

                    const typeSummary = Object.entries(entityTypes)
                        .map(([type, count]) => {
                            const info = VISUAL.getType(type);
                            return `${info.icon} ${count} ${info.label}`;
                        })
                        .join(', ');

                    for (const group of groups) {
                        const notification = `📢 **NOVOS DADOS ADICIONADOS**
${VISUAL.separator}

👤 **${userName}** inseriu dados em:
📂 **${invTitle}**

📊 **Resumo:** ${typeSummary}
🔗 ${stats.relationships} vínculo(s)

💡 Use \`/exportar\` para ver todos os dados.`;

                        await sendMessage(group.group_chat_id, notification);
                    }
                }
            }

        } catch (e) {
            console.error('[inserirCommand] Error:', e);
            await sendMessage(chatId, `❌ Erro ao processar JSON. Verifique a formatação.

💡 _Dica: Use /modelo ocorrencia e cole no ChatGPT primeiro._`);
        }
    }
};
