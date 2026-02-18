/**
 * Investigations Management para INTELINK Bot
 * 
 * Funções para listar, selecionar e exibir operações
 * Extraído de intelink-service.ts para modularização
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface InvestigationDeps {
    supabase: SupabaseClient;
    sendMessage: (chatId: number, text: string, replyMarkup?: any) => Promise<void>;
}

export const TYPE_TRANSLATION: Record<string, string> = {
    'PERSON': '👤 Pessoa',
    'VEHICLE': '🚗 Veículo',
    'LOCATION': '📍 Local',
    'ORGANIZATION': '🏢 Organização',
    'PHONE': '📱 Telefone',
    'COMPANY': '🏪 Empresa',
    'FIREARM': '🔫 Arma',
    'OTHER': '📎 Outro'
};

// ============================================
// LIST INVESTIGATIONS
// ============================================

/**
 * Lista todas as operações disponíveis para seleção
 */
export async function listUserInvestigations(
    chatId: number,
    deps: InvestigationDeps
): Promise<void> {
    const { supabase, sendMessage } = deps;
    
    const { data: investigations } = await supabase
        .from('intelink_investigations')
        .select('id, title, status, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10);

    if (!investigations || investigations.length === 0) {
        await sendMessage(chatId, '📭 **Nenhuma operação encontrada.**\n\nCrie uma nova com:\n`/investigacao Nome do Caso`');
        return;
    }

    // Build inline keyboard with investigations
    const buttons = investigations.map(inv => ([{
        text: `📁 ${inv.title} (${inv.status})`,
        callback_data: `select_inv_${inv.id}`
    }]));

    await sendMessage(chatId, '📂 **Selecione uma Operação:**', {
        inline_keyboard: [...buttons, [{ text: '➕ Criar Nova', callback_data: 'menu_main' }]]
    });
}

// ============================================
// SELECT INVESTIGATION
// ============================================

/**
 * Seleciona uma operação e mostra resumo completo
 */
export async function selectInvestigation(
    chatId: number, 
    investigationId: string,
    deps: InvestigationDeps
): Promise<void> {
    const { supabase, sendMessage } = deps;
    
    const { data: inv } = await supabase
        .from('intelink_investigations')
        .select('title, status, created_at')
        .eq('id', investigationId)
        .single();

    if (!inv) {
        await sendMessage(chatId, '❌ Operação não encontrada.');
        return;
    }

    // Update session
    await supabase.from('intelink_sessions').upsert({
        chat_id: chatId,
        investigation_id: investigationId,
        updated_at: new Date().toISOString()
    });

    // Get stats for this investigation
    const { count: entityCount } = await supabase.from('intelink_entities').select('*', { count: 'exact', head: true }).eq('investigation_id', investigationId);
    const { count: relCount } = await supabase.from('intelink_relationships').select('*', { count: 'exact', head: true }).eq('investigation_id', investigationId);
    const { count: evCount } = await supabase.from('intelink_evidence').select('*', { count: 'exact', head: true }).eq('investigation_id', investigationId);

    // Get top entities
    const { data: topEntities } = await supabase
        .from('intelink_entities')
        .select('id, name, type')
        .eq('investigation_id', investigationId)
        .limit(5);

    const createdDate = new Date(inv.created_at).toLocaleDateString('pt-BR');

    const summary = `✅ **Caso Selecionado:** ${inv.title}

━━━━━━━━━━━━━━━━━━━
📊 **Resumo:**
• Entidades: ${entityCount || 0}
• Vínculos: ${relCount || 0}
• Evidências: ${evCount || 0}
• Criado em: ${createdDate}
• Status: ${inv.status === 'active' ? '🟢 Ativo' : '⚪ Arquivado'}

━━━━━━━━━━━━━━━━━━━
🔗 **Links Rápidos:**
• [📊 Dashboard](http://localhost:3001/dashboard)
• [🕸️ Ver Grafo](http://localhost:3001/graph/${investigationId})`;

    // Build entity buttons
    const entityButtons = topEntities?.map(e => ([{
        text: `${TYPE_TRANSLATION[e.type]?.split(' ')[0] || '📎'} ${e.name}`,
        callback_data: `entity_${e.id}`
    }])) || [];

    await sendMessage(chatId, summary);
    
    // Send entities as clickable buttons
    if (topEntities && topEntities.length > 0) {
        await sendMessage(chatId, `👥 **Entidades (clique para ver detalhes):**`, {
            inline_keyboard: [
                ...entityButtons,
                [{ text: "━━━ Ações ━━━", callback_data: "noop" }],
                [{ text: "📥 Inserir", callback_data: "menu_prompts" }, { text: "🔍 Buscar", callback_data: "search_prompt" }],
                [{ text: "🕸️ Grafo", callback_data: "search_graph" }, { text: "🌉 Pontes", callback_data: "analyze_bridge" }],
                [{ text: "📂 Trocar Caso", callback_data: "case_select" }]
            ]
        });
    } else {
        await sendMessage(chatId, `📭 _Nenhuma entidade cadastrada ainda._\n\nUse \`/inserir\` para adicionar dados.`, {
            inline_keyboard: [
                [{ text: "📥 Inserir Dados", callback_data: "menu_prompts" }],
                [{ text: "📂 Trocar Caso", callback_data: "case_select" }]
            ]
        });
    }
}

// ============================================
// SHOW ENTITY DETAILS
// ============================================

/**
 * Exibe detalhes completos de uma entidade com vínculos
 */
export async function showEntityDetails(
    chatId: number, 
    entityId: string,
    deps: InvestigationDeps
): Promise<void> {
    const { supabase, sendMessage } = deps;
    
    // Get entity
    const { data: entity } = await supabase
        .from('intelink_entities')
        .select('*')
        .eq('id', entityId)
        .single();

    if (!entity) {
        await sendMessage(chatId, '❌ Entidade não encontrada.');
        return;
    }

    // Get all relationships for this entity
    const { data: relationships } = await supabase
        .from('intelink_relationships')
        .select('type, description, target:target_id(id, name, type), source:source_id(id, name, type)')
        .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

    const typePt = TYPE_TRANSLATION[entity.type] || '📎 Outro';
    
    let details = `${typePt.split(' ')[0]} **${entity.name}**
━━━━━━━━━━━━━━━━━━━
📋 **Tipo:** ${typePt}`;

    // Show metadata
    if (entity.metadata && Object.keys(entity.metadata).length > 0) {
        details += `\n\n📄 **Dados:**`;
        for (const [key, value] of Object.entries(entity.metadata)) {
            details += `\n• ${key}: ${value}`;
        }
    }

    // Show relationships
    if (relationships && relationships.length > 0) {
        details += `\n\n━━━━━━━━━━━━━━━━━━━\n🔗 **Vínculos (${relationships.length}):**`;
        
        for (const rel of relationships) {
            const source = rel.source as any;
            const target = rel.target as any;
            const isSource = source?.id === entityId;
            const otherEntity = isSource ? target : source;
            const direction = isSource ? '→' : '←';
            const otherType = TYPE_TRANSLATION[otherEntity?.type]?.split(' ')[0] || '📎';
            
            details += `\n\n${direction} **${rel.type}** ${otherType} ${otherEntity?.name || 'Desconhecido'}`;
            if (rel.description) {
                details += `\n   _${rel.description}_`;
            }
        }
    } else {
        details += `\n\n⚠️ _Nenhum vínculo cadastrado_`;
    }

    // Get related entities for quick navigation
    const relatedButtons = relationships?.slice(0, 4).map(rel => {
        const source = rel.source as any;
        const target = rel.target as any;
        const otherEntity = source?.id === entityId ? target : source;
        const otherType = TYPE_TRANSLATION[otherEntity?.type]?.split(' ')[0] || '📎';
        return [{
            text: `${otherType} ${otherEntity?.name?.substring(0, 20) || '?'}`,
            callback_data: `entity_${otherEntity?.id}`
        }];
    }) || [];

    await sendMessage(chatId, details, {
        inline_keyboard: [
            ...(relatedButtons.length > 0 ? [[{ text: "━━━ Navegação Rápida ━━━", callback_data: "noop" }]] : []),
            ...relatedButtons,
            [{ text: "🔙 Voltar ao Caso", callback_data: "case_back" }]
        ]
    });
}
