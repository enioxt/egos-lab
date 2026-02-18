/**
 * Document Type Detector
 * 
 * Detecta automaticamente o tipo de documento e avisa
 * se há discrepância com o tipo selecionado pelo usuário
 * 
 * @version 1.0.0
 * @updated 2025-12-04
 */

import { DocumentType, DocumentTypeDetection } from '../types';

// Padrões de detecção por tipo de documento
const DETECTION_PATTERNS: Record<DocumentType, RegExp[]> = {
    reds: [
        /REDS\s*[:-]?\s*\d+/i,
        /Registro de Eventos de Defesa Social/i,
        /Boletim de Ocorr[êe]ncia/i,
        /B\.?O\.?\s*[:-]?\s*\d+/i,
        /NATUREZA\s*[:-]/i,
        /LOCAL\s+DO\s+FATO/i,
        /HIST[ÓO]RICO\s+DO\s+FATO/i,
        /ENVOLVIDOS/i,
        /AUTOR\s+DO\s+FATO/i,
        /V[ÍI]TIMA/i,
    ],
    cs: [
        /Comunica[çc][ãa]o de Servi[çc]o/i,
        /C\.?S\.?\s*[:-]?\s*\d+/i,
        /AN[ÁA]LISE\s+INVESTIGATIVA/i,
        /HIP[ÓO]TESE/i,
        /INTELIG[ÊE]NCIA\s+POLICIAL/i,
        /LEVANTAMENTO/i,
        /DILIG[ÊE]NCIA\s+SUGERIDA/i,
    ],
    inquerito: [
        /INQU[ÉE]RITO\s+POLICIAL/i,
        /I\.?P\.?\s*[:-]?\s*\d+/i,
        /PROCEDIMENTO\s+INVESTIGAT[ÓO]RIO/i,
        /RELAT[ÓO]RIO\s+FINAL/i,
        /AUTO\s+DE\s+PRIS[ÃA]O/i,
        /INDICIAMENTO/i,
    ],
    depoimento: [
        /TERMO\s+DE\s+DECLARA[ÇC][ÃA]O/i,
        /TERMO\s+DE\s+DEPOIMENTO/i,
        /OITIVA/i,
        /INTERROGAT[ÓO]RIO/i,
        /QUALIFICA[ÇC][ÃA]O\s+DO\s+DEPOENTE/i,
        /AOS\s+COSTUMES\s+DISSE/i,
        /INQUIRIDO\s+SOBRE/i,
        /DECLAROU\s+QUE/i,
    ],
    laudo_pericial: [
        /LAUDO\s+PERICIAL/i,
        /LAUDO\s+DE\s+PER[ÍI]CIA/i,
        /EXAME\s+PERICIAL/i,
        /PARECER\s+T[ÉE]CNICO/i,
        /CONCLUS[ÃA]O\s+PERICIAL/i,
        /PERITO\s+CRIMINAL/i,
        /METODOLOGIA/i,
        /QUESITOS/i,
    ],
    laudo_medico: [
        /EXAME\s+DE\s+CORPO\s+DE\s+DELITO/i,
        /LAUDO\s+CADAV[ÉE]RICO/i,
        /NECROPSIA/i,
        /IML/i,
        /INSTITUTO\s+M[ÉE]DICO\s+LEGAL/i,
        /LES[ÕO]ES\s+CORPORAIS/i,
        /CAUSA\s+MORTIS/i,
        /EXAME\s+TOXICOL[ÓO]GICO/i,
    ],
    audio: [
        /TRANSCRI[ÇC][ÃA]O/i,
        /INTERCEPTA[ÇC][ÃA]O\s+TELEF[ÔO]NICA/i,
        /ESCUTA/i,
        /GRAVA[ÇC][ÃA]O/i,
    ],
    livre: [] // Tipo genérico, não tem padrões específicos
};

// Pesos para cada padrão (alguns são mais específicos)
const PATTERN_WEIGHTS: Partial<Record<DocumentType, number>> = {
    reds: 1.5,      // Muito comum, precisa de mais indicadores
    inquerito: 2.0, // Específico
    depoimento: 2.0,
    laudo_pericial: 2.0,
    laudo_medico: 2.0,
};

/**
 * Detecta o tipo de documento baseado no conteúdo
 */
export function detectDocumentType(
    text: string, 
    userSelectedType: DocumentType
): DocumentTypeDetection {
    const scores: Record<DocumentType, { score: number; matches: string[] }> = {
        reds: { score: 0, matches: [] },
        cs: { score: 0, matches: [] },
        inquerito: { score: 0, matches: [] },
        depoimento: { score: 0, matches: [] },
        laudo_pericial: { score: 0, matches: [] },
        laudo_medico: { score: 0, matches: [] },
        audio: { score: 0, matches: [] },
        livre: { score: 0, matches: [] },
    };

    // Analisar primeiros 2000 caracteres (geralmente contém identificação)
    const sampleText = text.slice(0, 2000);

    // Testar cada padrão
    for (const [docType, patterns] of Object.entries(DETECTION_PATTERNS)) {
        const weight = PATTERN_WEIGHTS[docType as DocumentType] || 1.0;
        
        for (const pattern of patterns) {
            const match = sampleText.match(pattern);
            if (match) {
                scores[docType as DocumentType].score += weight;
                scores[docType as DocumentType].matches.push(match[0]);
            }
        }
    }

    // Encontrar tipo com maior score
    let maxScore = 0;
    let detectedType: DocumentType = 'livre';
    const indicators: string[] = [];

    for (const [docType, data] of Object.entries(scores)) {
        if (data.score > maxScore) {
            maxScore = data.score;
            detectedType = docType as DocumentType;
            indicators.push(...data.matches);
        }
    }

    // Calcular confiança
    let confidence: 'high' | 'medium' | 'low';
    if (maxScore >= 4) {
        confidence = 'high';
    } else if (maxScore >= 2) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    // Verificar discrepância
    const mismatch = detectedType !== userSelectedType && confidence !== 'low';

    return {
        detected_type: detectedType,
        confidence,
        indicators: [...new Set(indicators)].slice(0, 5), // Top 5 únicos
        suggested_type: mismatch ? detectedType : undefined,
        user_selected_type: userSelectedType,
        mismatch
    };
}

/**
 * Gera mensagem de aviso para o usuário em caso de discrepância
 */
export function generateMismatchWarning(detection: DocumentTypeDetection): string | null {
    if (!detection.mismatch) return null;

    const typeLabels: Record<DocumentType, string> = {
        reds: 'REDS/Boletim de Ocorrência',
        cs: 'Comunicação de Serviço',
        inquerito: 'Inquérito Policial',
        depoimento: 'Oitiva/Depoimento',
        laudo_pericial: 'Laudo Pericial',
        laudo_medico: 'Exame Médico/IML',
        audio: 'Transcrição de Áudio',
        livre: 'Texto Livre'
    };

    return `⚠️ Atenção: O documento parece ser "${typeLabels[detection.detected_type]}" mas você selecionou "${typeLabels[detection.user_selected_type]}".

Indicadores encontrados: ${detection.indicators.join(', ')}

O sistema irá usar prompts diferentes para cada tipo. Deseja:
1. Processar como ${typeLabels[detection.detected_type]} (recomendado)
2. Processar como ${typeLabels[detection.user_selected_type]} (sua escolha original)`;
}
