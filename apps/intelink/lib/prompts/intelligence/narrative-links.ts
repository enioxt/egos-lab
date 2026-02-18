/**
 * Narrative Relationship Extractor Prompt
 * 
 * Extrai vínculos subjetivos de narrativas policiais.
 * Identifica relações não-objetivas como: testemunhas, suspeitos,
 * alibis, denunciantes, etc.
 * 
 * @id intelligence.narrative-links
 * @version 1.0.0
 * @model google/gemini-2.0-flash-001
 * @updated 2025-12-15
 */

// ============================================
// PROMPT CONFIG
// ============================================

export const promptConfig = {
    id: 'intelligence.narrative-links',
    name: 'Narrative Relationship Extractor',
    version: '1.0.0',
    model: 'google/gemini-2.0-flash-001',
    temperature: 0,
    maxTokens: 3000,
};

// ============================================
// RELATIONSHIP TYPES
// ============================================

export const NARRATIVE_LINK_TYPES = {
    // Vínculos de testemunho
    WITNESS_OF: 'Testemunhou',
    INFORMED_BY: 'Informado por',
    REPORTED_BY: 'Relatado por',
    
    // Vínculos de suspeita
    SUSPECT_IN: 'Suspeito em',
    ACCUSED_BY: 'Acusado por',
    IMPLICATED_IN: 'Implicado em',
    
    // Vínculos de vítima
    VICTIM_OF: 'Vítima de',
    ATTACKED_BY: 'Atacado por',
    THREATENED_BY: 'Ameaçado por',
    
    // Vínculos de alibi
    ALIBI_FOR: 'Álibi para',
    VOUCHED_FOR: 'Abonou',
    
    // Vínculos de fuga
    FLED_WITH: 'Fugiu com',
    HARBORED_BY: 'Acolhido por',
    
    // Vínculos de posse
    POSSESSED: 'Possuía',
    SEIZED_FROM: 'Apreendido de',
    
    // Vínculos de comunicação
    CONTACTED: 'Contatou',
    RECEIVED_FROM: 'Recebeu de',
    
    // Vínculos de localização
    PRESENT_AT: 'Presente em',
    FLED_TO: 'Fugiu para',
    RESIDED_AT: 'Residia em',
};

// ============================================
// SYSTEM PROMPT
// ============================================

export const NARRATIVE_LINKS_PROMPT = `Você é um analista criminal especializado em extrair vínculos de narrativas policiais brasileiras.

TEXTO PARA ANÁLISE:
{text}

Analise o texto e extraia TODOS os vínculos narrativos entre pessoas, locais, objetos e eventos.

## TIPOS DE VÍNCULOS A EXTRAIR:

1. **TESTEMUNHO**
   - WITNESS_OF: Pessoa que presenciou um fato
   - INFORMED_BY: Informação obtida de alguém
   - REPORTED_BY: Quem fez a denúncia/comunicação

2. **SUSPEITA/ACUSAÇÃO**
   - SUSPECT_IN: Suspeito de envolvimento
   - ACCUSED_BY: Acusado por alguém
   - IMPLICATED_IN: Mencionado como envolvido

3. **VÍTIMA**
   - VICTIM_OF: Vítima de crime/ação
   - ATTACKED_BY: Agredido por
   - THREATENED_BY: Ameaçado por

4. **ALIBI/DEFESA**
   - ALIBI_FOR: Forneceu álibi para
   - VOUCHED_FOR: Confirmou versão de

5. **FUGA/EVASÃO**
   - FLED_WITH: Fugiu junto com
   - HARBORED_BY: Foi acolhido/escondido por

6. **POSSE/APREENSÃO**
   - POSSESSED: Estava de posse de
   - SEIZED_FROM: Objeto apreendido de

7. **LOCALIZAÇÃO**
   - PRESENT_AT: Estava presente em local
   - FLED_TO: Fugiu para local
   - RESIDED_AT: Morava/residia em

## INSTRUÇÕES:

1. Extraia TODAS as relações implícitas e explícitas
2. Para cada vínculo, indique:
   - Quem/O quê (source)
   - Tipo de vínculo
   - Com quem/O quê (target)
   - Trecho que fundamenta
   - Nível de confiança (0.5-1.0)

3. NÃO extraia vínculos objetivos como:
   - Filiação (pai, mãe)
   - Parentesco direto
   - Endereço residencial fixo

4. FOQUE em vínculos narrativos/contextuais

Responda APENAS em JSON válido:
{
  "relationships": [
    {
      "source": "Nome da pessoa/entidade origem",
      "source_type": "PERSON|VEHICLE|LOCATION|OBJECT|EVENT",
      "target": "Nome da pessoa/entidade destino",
      "target_type": "PERSON|VEHICLE|LOCATION|OBJECT|EVENT",
      "type": "WITNESS_OF|SUSPECT_IN|VICTIM_OF|etc",
      "type_label": "Label em português",
      "evidence": "Trecho do texto que fundamenta",
      "confidence": 0.5-1.0,
      "context": "Contexto adicional se relevante"
    }
  ],
  "summary": "Resumo das principais conexões encontradas",
  "key_actors": ["Lista dos principais envolvidos"],
  "confidence": 0.0-1.0
}`;

// ============================================
// TYPES
// ============================================

export interface NarrativeRelationship {
    source: string;
    source_type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'OBJECT' | 'EVENT';
    target: string;
    target_type: 'PERSON' | 'VEHICLE' | 'LOCATION' | 'OBJECT' | 'EVENT';
    type: keyof typeof NARRATIVE_LINK_TYPES;
    type_label: string;
    evidence: string;
    confidence: number;
    context?: string;
}

export interface NarrativeLinksResult {
    relationships: NarrativeRelationship[];
    summary: string;
    key_actors: string[];
    confidence: number;
}

// ============================================
// BUILDER FUNCTION
// ============================================

export function buildNarrativeLinksPrompt(text: string): string {
    return NARRATIVE_LINKS_PROMPT.replace('{text}', text);
}

// ============================================
// PARSER FUNCTION
// ============================================

export function parseNarrativeLinksResult(content: string): NarrativeLinksResult {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    return JSON.parse(jsonStr);
}
