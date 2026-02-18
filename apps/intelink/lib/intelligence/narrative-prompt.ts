/**
 * Narrative Dossier Prompt - Intelligence Lab
 * 
 * System prompt for generating narrative intelligence reports
 * from aggregated entity graph data.
 * 
 * @module intelligence/narrative-prompt
 * @version 1.0.0
 */

import type { DossierResult } from './graph-aggregator';

// ============================================
// SYSTEM PROMPT
// ============================================

export const NARRATIVE_DOSSIER_SYSTEM_PROMPT = `# SISTEMA: GERADOR DE DOSSIÊ NARRATIVO - INTELINK

## IDENTIDADE
Você é um Analista de Inteligência Policial especializado em compilar informações de múltiplas fontes em relatórios executivos para delegados e promotores.

## OBJETIVO
Receber um JSON com todos os dados agregados sobre uma ENTIDADE (pessoa, veículo, organização) e gerar um DOSSIÊ NARRATIVO completo em formato Markdown.

## REGRAS ABSOLUTAS
1. **FIDELIDADE:** Não invente informações. Se algo não está no JSON, não inclua.
2. **LINGUAGEM:** Formal, objetiva, estilo relatório policial brasileiro.
3. **NOMES:** Sempre em MAIÚSCULAS.
4. **ANÁLISE IA:** Sempre marcar claramente como [🤖 ANÁLISE IA].
5. **SEM JULGAMENTO:** Não afirme culpa. Use "suspeito de", "envolvido em", "vinculado a".
6. **DATAS:** Formato brasileiro (DD/MM/AAAA).

## ESTRUTURA DO RELATÓRIO

O relatório deve seguir EXATAMENTE esta estrutura:

---

# DOSSIÊ DE INTELIGÊNCIA
**Alvo:** [NOME] | **Tipo:** [TIPO] | **Gerado em:** [DATA ATUAL]

## 1. QUALIFICAÇÃO DO ALVO

[Descrição narrativa dos dados básicos: nome, tipo, CPF se disponível, filiação, endereço, etc.]

## 2. HISTÓRICO DE ENVOLVIMENTOS

O alvo aparece em [N] investigação(ões) no sistema Intelink:

### 2.1 [Nome da Operação] ([Data])
[Papel do alvo na operação. Descrição dos fatos.]

[Repetir para cada operação...]

## 3. REDE DE VÍNCULOS

O alvo possui [N] vínculo(s) mapeado(s):

| Tipo | Nome | Relação | Operação |
|------|------|---------|----------|
[tabela com vínculos]

### 3.1 [🤖 ANÁLISE IA] Análise da Rede
[Parágrafo narrativo explicando os vínculos mais relevantes e possíveis conexões.]

## 4. LINHA DO TEMPO

| Data | Evento | Operação |
|------|--------|----------|
[tabela com eventos cronológicos]

## 5. EVIDÊNCIAS VINCULADAS

| Tipo | Descrição | Operação |
|------|-----------|----------|
[tabela com evidências]

## 6. [🤖 ANÁLISE IA] ANÁLISE DE RISCO

**Nível de Risco:** [ALTO/MÉDIO/BAIXO]

**Fatores Considerados:**
- [fator 1]
- [fator 2]

**Recomendações:**
- [recomendação 1]
- [recomendação 2]

---

*Dossiê gerado automaticamente pelo Intelink em [DATA/HORA]. As análises marcadas com [🤖 ANÁLISE IA] devem ser validadas por analista humano.*

---

## CONTEXTO ADICIONAL

- Se houver CROSS-CASE MATCHES (mesma entidade em outras operações), destaque isso como descoberta importante.
- Se o alvo tiver muitos vínculos com ORGANIZAÇÕES criminosas, eleve o nível de risco.
- Se houver lacunas (poucos dados), mencione explicitamente: "Informações limitadas sobre..."
`;

// ============================================
// BUILD PROMPT CONTEXT
// ============================================

/**
 * Converts DossierResult to a context string for the LLM
 */
export function buildDossierContext(dossier: DossierResult): string {
    const sections: string[] = [];

    // Header
    sections.push('# DADOS DO ALVO PARA ANÁLISE');
    sections.push('');
    
    // Target info
    sections.push('## ENTIDADE PRINCIPAL');
    sections.push(`- **Nome:** ${dossier.target.name}`);
    sections.push(`- **Tipo:** ${dossier.target.type}`);
    sections.push(`- **ID:** ${dossier.target.id}`);
    
    const meta = dossier.target.metadata || {};
    if (Object.keys(meta).length > 0) {
        sections.push('- **Metadados:**');
        Object.entries(meta).forEach(([key, value]) => {
            if (value && value !== '') {
                sections.push(`  - ${key}: ${value}`);
            }
        });
    }
    sections.push('');

    // Cross-case matches
    if (dossier.cross_case_matches.length > 0) {
        sections.push('## ⚠️ CORRESPONDÊNCIAS CROSS-CASE (IMPORTANTE!)');
        sections.push(`Esta entidade aparece em ${dossier.cross_case_matches.length + 1} investigações diferentes:`);
        dossier.cross_case_matches.forEach(match => {
            sections.push(`- **${match.name}** na operação "${match.investigation_title}"`);
        });
        sections.push('');
    }

    // Appearances
    if (dossier.appearances.length > 0) {
        sections.push('## INVESTIGAÇÕES VINCULADAS');
        dossier.appearances.forEach((app, idx) => {
            const date = app.date ? new Date(app.date).toLocaleDateString('pt-BR') : 'Data desconhecida';
            const role = app.entity_role ? ` (${app.entity_role})` : '';
            sections.push(`${idx + 1}. **${app.investigation_title}**${role} - ${date} - Status: ${app.status}`);
        });
        sections.push('');
    }

    // Relationships
    if (dossier.relationships.length > 0) {
        sections.push('## VÍNCULOS E CONEXÕES');
        dossier.relationships.forEach(rel => {
            const desc = rel.description ? ` - "${rel.description}"` : '';
            sections.push(`- ${rel.source_name} (${rel.source_type}) → **${rel.relationship_type}** → ${rel.target_name} (${rel.target_type})${desc} [${rel.investigation_title}]`);
        });
        sections.push('');
    }

    // Timeline
    if (dossier.timeline.length > 0) {
        sections.push('## LINHA DO TEMPO');
        dossier.timeline.forEach(event => {
            const date = event.date ? new Date(event.date).toLocaleDateString('pt-BR') : '??/??/????';
            sections.push(`- ${date}: ${event.event} [${event.investigation_title}]`);
        });
        sections.push('');
    }

    // Evidences
    if (dossier.evidences.length > 0) {
        sections.push('## EVIDÊNCIAS');
        dossier.evidences.forEach(ev => {
            sections.push(`- [${ev.type}] ${ev.description} [${ev.investigation_title}]`);
        });
        sections.push('');
    }

    // Stats
    sections.push('## ESTATÍSTICAS');
    sections.push(`- Total de investigações: ${dossier.stats.total_investigations}`);
    sections.push(`- Total de vínculos: ${dossier.stats.total_relationships}`);
    sections.push(`- Total de evidências: ${dossier.stats.total_evidences}`);
    sections.push(`- Correspondências cross-case: ${dossier.stats.cross_case_matches}`);
    sections.push('');

    sections.push('---');
    sections.push('Gere o DOSSIÊ NARRATIVO completo baseado nos dados acima.');

    return sections.join('\n');
}

// ============================================
// FALLBACK NARRATIVE (No LLM)
// ============================================

/**
 * Generate a simple narrative without LLM (fallback)
 */
export function generateFallbackNarrative(dossier: DossierResult): string {
    const now = new Date().toLocaleString('pt-BR');
    const meta = dossier.target.metadata || {};
    
    let narrative = `# DOSSIÊ DE INTELIGÊNCIA

**Alvo:** ${dossier.target.name} | **Tipo:** ${dossier.target.type} | **Gerado em:** ${now}

---

## 1. QUALIFICAÇÃO DO ALVO

**${dossier.target.name}** é uma entidade do tipo **${dossier.target.type}** registrada no sistema Intelink.

`;

    // Add metadata if available
    if (meta.cpf) narrative += `- **CPF:** ${meta.cpf}\n`;
    if (meta.rg) narrative += `- **RG:** ${meta.rg}\n`;
    if (meta.mother || meta.mae) narrative += `- **Filiação:** ${meta.mother || meta.mae}\n`;
    if (meta.address || meta.endereco) narrative += `- **Endereço:** ${meta.address || meta.endereco}\n`;
    if (meta.phone || meta.telefone) narrative += `- **Telefone:** ${meta.phone || meta.telefone}\n`;
    if (meta.placa || meta.plate) narrative += `- **Placa:** ${meta.placa || meta.plate}\n`;

    // Cross-case alert
    if (dossier.cross_case_matches.length > 0) {
        narrative += `
---

## ⚠️ ALERTA: CORRESPONDÊNCIA CROSS-CASE

Esta entidade foi encontrada em **${dossier.stats.total_investigations} investigações diferentes**:

`;
        dossier.cross_case_matches.forEach(match => {
            narrative += `- **${match.investigation_title}**\n`;
        });
    }

    // Appearances
    narrative += `
---

## 2. HISTÓRICO DE ENVOLVIMENTOS

O alvo aparece em **${dossier.stats.total_investigations}** investigação(ões):

`;
    dossier.appearances.forEach((app, idx) => {
        const date = app.date ? new Date(app.date).toLocaleDateString('pt-BR') : 'Data desconhecida';
        narrative += `### 2.${idx + 1} ${app.investigation_title}\n`;
        narrative += `- **Data:** ${date}\n`;
        narrative += `- **Status:** ${app.status}\n`;
        if (app.entity_role) narrative += `- **Papel:** ${app.entity_role}\n`;
        narrative += '\n';
    });

    // Relationships
    if (dossier.relationships.length > 0) {
        narrative += `---

## 3. REDE DE VÍNCULOS

O alvo possui **${dossier.stats.total_relationships}** vínculo(s) mapeado(s):

| Tipo | Nome | Relação | Operação |
|------|------|---------|----------|
`;
        dossier.relationships.forEach(rel => {
            narrative += `| ${rel.target_type} | ${rel.target_name} | ${rel.relationship_type} | ${rel.investigation_title} |\n`;
        });
    }

    // Timeline
    if (dossier.timeline.length > 0) {
        narrative += `
---

## 4. LINHA DO TEMPO

| Data | Evento | Operação |
|------|--------|----------|
`;
        dossier.timeline.forEach(event => {
            const date = event.date ? new Date(event.date).toLocaleDateString('pt-BR') : '??/??/????';
            narrative += `| ${date} | ${event.event} | ${event.investigation_title} |\n`;
        });
    }

    // Evidences
    if (dossier.evidences.length > 0) {
        narrative += `
---

## 5. EVIDÊNCIAS VINCULADAS

| Tipo | Descrição | Operação |
|------|-----------|----------|
`;
        dossier.evidences.forEach(ev => {
            narrative += `| ${ev.type} | ${ev.description} | ${ev.investigation_title} |\n`;
        });
    }

    // Footer
    narrative += `
---

*Dossiê gerado automaticamente pelo Intelink em ${now}.*
*Para análise de risco com IA, utilize o modo "Gerar com IA".*
`;

    return narrative;
}
