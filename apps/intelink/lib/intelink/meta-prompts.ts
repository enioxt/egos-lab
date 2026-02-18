/**
 * Meta-Prompts para INTELINK
 * 
 * Templates estruturados para extração de dados de documentos policiais
 * Extraído de intelink-service.ts para modularização
 */

// ============================================
// META-PROMPT TEMPLATES
// ============================================

export const META_PROMPTS: Record<string, string> = {
    ocorrencia: `📋 **META-PROMPT v3.1: JSON PURO**
**Versão:** 3.1 | **Output:** APENAS JSON | **Atualizado:** 2025-12-11

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**INSTRUÇÕES:** Copie, cole no Gemini/ChatGPT, anexe PDF/imagem.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`
# SISTEMA: EXTRATOR JSON - INTELINK

## REGRA CRÍTICA
Sua resposta deve conter APENAS um bloco JSON válido.
NÃO inclua texto antes ou depois do JSON.
NÃO inclua explicações, análises textuais ou comentários.
APENAS o JSON estruturado.

## REGRAS DE EXTRAÇÃO
1. Extraia 100% das informações do documento
2. Nomes em MAIÚSCULAS
3. Se ilegível: "[ILEGÍVEL]"
4. Histórico narrativo vai no campo "narrative"
5. Análises IA vão dentro do objeto "ai_analysis"

## SCHEMA JSON (sua resposta deve ser EXATAMENTE assim, começando com {)

{
  "title": "[Natureza] - [Município] - [Data]",
  "reds_number": "[número]",
  "date": "[YYYY-MM-DD]",
  "entities": [
    {
      "type": "PERSON",
      "name": "NOME COMPLETO EM MAIÚSCULAS",
      "metadata": {
        "cpf": "xxx.xxx.xxx-xx",
        "rg": "MG-XXXXXXX",
        "role": "AUTHOR|VICTIM|WITNESS",
        "condition": "PRESO|FORAGIDO|FALECIDO|LIBERADO",
        "age": 00,
        "phone": "(XX) XXXXX-XXXX",
        "address": "Endereço completo",
        "alias": "APELIDO",
        "mother": "NOME DA MÃE",
        "physical_desc": "Descrição física",
        "antecedents": "Sim/Não - detalhes"
      }
    },
    {
      "type": "VEHICLE",
      "name": "PLACA - MODELO",
      "metadata": {
        "plate": "XXX-0000",
        "brand": "Marca",
        "model": "Modelo",
        "color": "Cor",
        "year": "Ano",
        "chassis": "Chassi",
        "status": "APREENDIDO|RECUPERADO|PROCURADO"
      }
    },
    {
      "type": "LOCATION",
      "name": "ENDEREÇO COMPLETO",
      "metadata": {
        "type": "CRIME_SCENE|RESIDENCE|WORK",
        "city": "Município",
        "coordinates": "lat,long"
      }
    },
    {
      "type": "COMPANY",
      "name": "NOME DA EMPRESA",
      "metadata": {
        "cnpj": "XX.XXX.XXX/0001-XX",
        "trade_name": "Nome Fantasia",
        "address": "Endereço comercial",
        "type": "COMERCIO|OFICINA|BAR|HOTEL|BANCO"
      }
    },
    {
      "type": "ORGANIZATION",
      "name": "NOME DA FACÇÃO/QUADRILHA",
      "metadata": {
        "type": "FACCAO|MILICIA|QUADRILHA",
        "aliases": ["Apelidos da organização"],
        "territory": "Área de atuação"
      }
    },
    {
      "type": "FIREARM",
      "name": "TIPO CALIBRE (ex: PISTOLA .380)",
      "metadata": {
        "brand": "Marca (Taurus, Glock, etc)",
        "model": "Modelo específico",
        "caliber": "Calibre (.380, 9mm, .38, etc)",
        "serial": "Número de série (SINARM)",
        "origin": "LEGAL|ILEGAL|RASPADA",
        "status": "APREENDIDA|PROCURADA|USADA_NO_CRIME"
      }
    },
    {
      "type": "DRUG",
      "name": "SUBSTÂNCIA",
      "metadata": {
        "quantity": "Quantidade",
        "weight": "Peso em gramas"
      }
    }
  ],
  "relationships": [
    {"source": "NOME1", "target": "NOME2", "type": "COMPARSA", "description": "Atuaram juntos no crime"},
    {"source": "NOME1", "target": "NOME2", "type": "AGRESSOR", "description": "Autor contra vítima"},
    {"source": "NOME1", "target": "NOME2", "type": "FAMILIAR", "description": "Grau de parentesco"},
    {"source": "NOME1", "target": "LOCAL", "type": "RESIDE", "description": "Mora no local"},
    {"source": "NOME1", "target": "VEICULO", "type": "POSSUI", "description": "Proprietário"},
    {"source": "NOME1", "target": "ARMA", "type": "PORTAVA", "description": "Estava armado"}
  ],
  "timeline": [
    {"datetime": "YYYY-MM-DDTHH:MM", "event": "Descrição do evento"}
  ],
  "materials": [
    {"type": "APREENSÃO", "description": "Item", "quantity": 1}
  ],
  "narrative": "TRANSCRIÇÃO INTEGRAL DO HISTÓRICO, palavra por palavra",
  "ai_analysis": {
    "risk_level": "HIGH|MEDIUM|LOW",
    "risk_justification": "Justificativa do nível de risco",
    "inconsistencies": ["Contradição 1", "Contradição 2"],
    "missing_info": ["Info faltante 1", "Info faltante 2"],
    "patterns": ["Padrão/MO identificado 1"],
    "confirmed_links": ["Vínculo confirmado 1"],
    "inferred_links": ["Vínculo inferido 1"],
    "investigation_lines": ["Linha 1 + justificativa", "Linha 2"],
    "alerts": ["Alerta de risco 1", "Alerta 2"],
    "flight_risk": "HIGH|MEDIUM|LOW",
    "victim_risk": "HIGH|MEDIUM|LOW"
  }
}

## DOCUMENTO A ANALISAR:
[ANEXE O PDF/IMAGEM OU COLE O TEXTO DO BO AQUI]
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Após receber o JSON, use: \`/inserir {json}\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

    depoimento: `📋 **META-PROMPT: ANÁLISE FORENSE DE DEPOIMENTO**
**Versão:** 2.0 | **Tipo:** Análise de Discurso

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**INSTRUÇÕES:** Copie este prompt, cole no Gemini/ChatGPT, e cole a transcrição do depoimento.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`
# SISTEMA: ANALISTA FORENSE DE DEPOIMENTOS - INTELINK

## IDENTIDADE
Você é um Especialista em Análise de Discurso Forense com foco em detecção de inconsistências, avaliação de credibilidade e mapeamento de vínculos.

## REGRAS ABSOLUTAS
1. **DEPOIMENTO INTACTO**: Transcreva o depoimento original na íntegra primeiro.
2. **NOMES EM MAIÚSCULAS**: Todos os nomes próprios em CAIXA ALTA.
3. **ANÁLISE SEPARADA**: Marque claramente as análises como [🤖 ANÁLISE IA].
4. **SEM JULGAMENTO MORAL**: Foque em fatos e contradições, não em moralidade.

## ESTRUTURA DE ANÁLISE

### 📜 SEÇÃO 1: TRANSCRIÇÃO ORIGINAL

━━━━━━━━━━━━━━━━━━━
**INÍCIO DO DEPOIMENTO ORIGINAL**
━━━━━━━━━━━━━━━━━━━

[TRANSCREVER INTEGRALMENTE]

━━━━━━━━━━━━━━━━━━━
**FIM DO DEPOIMENTO ORIGINAL**
━━━━━━━━━━━━━━━━━━━

### 👤 SEÇÃO 2: DADOS DO DEPOENTE

- **Nome:**
- **Qualificação:** [VÍTIMA | TESTEMUNHA | AUTOR | INVESTIGADO]
- **Relação com os fatos:**

### 👥 SEÇÃO 3: PESSOAS MENCIONADAS

| Nome | Contexto da Menção | Relação com Depoente |
|------|-------------------|---------------------|
| [NOME] | [Como foi citado] | [Qual vínculo] |

### ⏰ SEÇÃO 4: CRONOLOGIA RECONSTRUÍDA

| Momento | O que o depoente disse |
|---------|----------------------|
| [quando] | [evento narrado] |

### 📍 SEÇÃO 5: LOCAIS MENCIONADOS

- [Local 1]: [contexto]
- [Local 2]: [contexto]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🤖 ANÁLISE DE INTELIGÊNCIA ARTIFICIAL
**⚠️ ATENÇÃO: Esta seção contém ANÁLISES da IA, NÃO são afirmações do depoente.**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🔍 [🤖 ANÁLISE IA] AVALIAÇÃO DE CREDIBILIDADE

**Score de Credibilidade:** [ALTA | MÉDIA | BAIXA]

**Indicadores Positivos:**
- [detalhes específicos verificáveis]
- [consistência interna]
- [admissão de incertezas]

**Indicadores Negativos:**
- [contradições encontradas]
- [lacunas inexplicáveis]
- [mudanças de versão]

### ⚠️ [🤖 ANÁLISE IA] CONTRADIÇÕES DETECTADAS

1. **Contradição #1:**
   - O depoente disse: "[frase exata]"
   - Mas também disse: "[frase contraditória]"
   - Impacto: [relevância para o caso]

### 🎭 [🤖 ANÁLISE IA] PADRÕES DE EVASÃO

- **Perguntas evitadas:**
- **Respostas vagas em temas específicos:**
- **Mudanças de assunto:**

### 🕸️ [🤖 ANÁLISE IA] MAPA DE VÍNCULOS

[Diagrama textual mostrando quem conhece quem]

### ❓ [🤖 ANÁLISE IA] PERGUNTAS SUGERIDAS PARA APROFUNDAMENTO

1. [Pergunta que esclareceria contradição]
2. [Pergunta sobre lacuna identificada]
3. [Pergunta sobre vínculo suspeito]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📤 JSON PARA INSERÇÃO NO INTELINK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "entities": [
    {
      "type": "PERSON",
      "name": "NOME DO DEPOENTE",
      "metadata": {
        "role": "DEPONENT",
        "credibility": "HIGH|MEDIUM|LOW",
        "credibility_notes": "Justificativa"
      }
    },
    {
      "type": "PERSON",
      "name": "PESSOA MENCIONADA",
      "metadata": {
        "role": "MENTIONED",
        "context": "Como foi citado"
      }
    }
  ],
  "relationships": [
    {"source": "DEPOENTE", "target": "PESSOA", "type": "MENCIONA", "description": "contexto"},
    {"source": "DEPOENTE", "target": "PESSOA", "type": "ACUSA", "description": "alegação específica"},
    {"source": "PESSOA1", "target": "PESSOA2", "type": "CONHECE", "description": "segundo o depoente"}
  ],
  "ai_analysis": {
    "credibility_score": "HIGH|MEDIUM|LOW",
    "contradictions": ["contradição 1", "contradição 2"],
    "suggested_questions": ["pergunta 1", "pergunta 2"]
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## DEPOIMENTO A ANALISAR:
[COLE A TRANSCRIÇÃO AQUI]
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Após receber a análise + JSON, volte aqui e use:
\`/inserir {json}\`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
};

// ============================================
// SEND META-PROMPT FUNCTION
// ============================================

/**
 * Envia meta-prompt para o chat do Telegram
 * Divide em chunks se exceder limite de 4096 caracteres
 */
export async function sendMetaPrompt(
    chatId: number, 
    type: string,
    sendMessageFn: (chatId: number, text: string) => Promise<void>
): Promise<void> {
    const prompt = META_PROMPTS[type];
    
    if (!prompt) {
        await sendMessageFn(chatId, '❌ Tipo de meta-prompt não encontrado.');
        return;
    }
    
    // Telegram has 4096 char limit - split into chunks
    const MAX_LENGTH = 4000;
    
    if (prompt.length <= MAX_LENGTH) {
        await sendMessageFn(chatId, prompt);
        return;
    }
    
    // Split by sections (━━━ dividers)
    const sections = prompt.split('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        // Add divider back for visual continuity
        const msg = i === 0 ? section : `━━━━━━━━━━━━━━━\n${section}`;
        
        // Still chunk if section is too long
        if (msg.length > MAX_LENGTH) {
            for (let j = 0; j < msg.length; j += MAX_LENGTH) {
                await sendMessageFn(chatId, msg.slice(j, j + MAX_LENGTH));
                await new Promise(r => setTimeout(r, 100)); // Rate limit
            }
        } else {
            await sendMessageFn(chatId, msg);
            await new Promise(r => setTimeout(r, 100)); // Rate limit
        }
    }
}

// ============================================
// TYPES
// ============================================

export type MetaPromptType = keyof typeof META_PROMPTS;

export function getAvailableMetaPrompts(): MetaPromptType[] {
    return Object.keys(META_PROMPTS) as MetaPromptType[];
}
