/**
 * INTELINK - Diligence Suggestions System
 * 
 * Suggests investigative actions based on:
 * - Type of crime
 * - Current evidence status
 * - Missing information
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DiligenceSuggestion {
    id: string;
    category: 'DOCUMENTAL' | 'TESTEMUNHAL' | 'PERICIAL' | 'OPERACIONAL' | 'TECNOLOGICA';
    title: string;
    description: string;
    priority: 'ALTA' | 'MEDIA' | 'BAIXA';
    legalBasis?: string;
    deadline?: string;
    responsible?: string;
}

export interface InvestigationContext {
    crimeType: string;
    hasVictimStatement: boolean;
    hasSuspectStatement: boolean;
    hasWitnesses: boolean;
    hasDocumentaryEvidence: boolean;
    hasTechnicalEvidence: boolean;
    hasPhoneData: boolean;
    hasBankData: boolean;
    hasVideoEvidence: boolean;
    hasForensicEvidence: boolean;
    suspectsIdentified: boolean;
    vehicleInvolved: boolean;
    weaponInvolved: boolean;
    drugInvolved: boolean;
}

// ============================================================================
// DILIGENCE DATABASE BY CRIME TYPE
// ============================================================================

const DILIGENCES_BY_CRIME: Record<string, DiligenceSuggestion[]> = {
    // ========================================================================
    // CRIMES CONTRA A PESSOA
    // ========================================================================
    'HOMICIDIO': [
        {
            id: 'hom-1',
            category: 'PERICIAL',
            title: 'Exame de Corpo de Delito',
            description: 'Requisitar exame necroscópico ao IML, incluindo coleta de DNA e projéteis',
            priority: 'ALTA',
            legalBasis: 'Art. 158 CPP',
            deadline: '24h'
        },
        {
            id: 'hom-2',
            category: 'PERICIAL',
            title: 'Perícia de Local',
            description: 'Acionar perícia técnica para levantamento do local do crime',
            priority: 'ALTA',
            legalBasis: 'Art. 169 CPP',
            deadline: 'Imediato'
        },
        {
            id: 'hom-3',
            category: 'TECNOLOGICA',
            title: 'Requisição de Imagens',
            description: 'Solicitar imagens de câmeras de segurança públicas e privadas na região',
            priority: 'ALTA',
            deadline: '48h'
        },
        {
            id: 'hom-4',
            category: 'TESTEMUNHAL',
            title: 'Oitiva de Testemunhas',
            description: 'Identificar e ouvir testemunhas presenciais e informantes',
            priority: 'ALTA',
            legalBasis: 'Art. 201-210 CPP'
        },
        {
            id: 'hom-5',
            category: 'PERICIAL',
            title: 'Exame de Balística',
            description: 'Encaminhar projéteis e estojos para exame balístico comparativo',
            priority: 'ALTA',
            legalBasis: 'Art. 175 CPP'
        }
    ],

    'LESAO_CORPORAL': [
        {
            id: 'les-1',
            category: 'PERICIAL',
            title: 'Exame de Corpo de Delito',
            description: 'Requisitar exame de lesões corporais ao IML',
            priority: 'ALTA',
            legalBasis: 'Art. 158 CPP',
            deadline: '72h (antes da cicatrização)'
        },
        {
            id: 'les-2',
            category: 'TESTEMUNHAL',
            title: 'Oitiva da Vítima',
            description: 'Colher declarações detalhadas da vítima sobre a dinâmica da agressão',
            priority: 'ALTA'
        },
        {
            id: 'les-3',
            category: 'DOCUMENTAL',
            title: 'Prontuário Médico',
            description: 'Requisitar prontuário médico se vítima foi atendida em hospital',
            priority: 'MEDIA'
        }
    ],

    // ========================================================================
    // CRIMES CONTRA O PATRIMÔNIO
    // ========================================================================
    'ROUBO': [
        {
            id: 'rob-1',
            category: 'TESTEMUNHAL',
            title: 'Reconhecimento Fotográfico',
            description: 'Mostrar álbum fotográfico à vítima para reconhecimento de suspeitos',
            priority: 'ALTA',
            legalBasis: 'Art. 226 CPP'
        },
        {
            id: 'rob-2',
            category: 'TECNOLOGICA',
            title: 'Rastreamento de Celular',
            description: 'Requisitar ERBs e rastreamento do celular subtraído via IMEI',
            priority: 'ALTA',
            legalBasis: 'Art. 13 Lei 9.296/96'
        },
        {
            id: 'rob-3',
            category: 'TECNOLOGICA',
            title: 'Câmeras de Segurança',
            description: 'Solicitar imagens de câmeras no trajeto de fuga',
            priority: 'ALTA',
            deadline: '48h'
        },
        {
            id: 'rob-4',
            category: 'OPERACIONAL',
            title: 'Consulta SINESP/INFOSEG',
            description: 'Consultar antecedentes de suspeitos identificados',
            priority: 'MEDIA'
        },
        {
            id: 'rob-5',
            category: 'PERICIAL',
            title: 'Exame de Arma',
            description: 'Se arma for apreendida, encaminhar para perícia balística',
            priority: 'MEDIA',
            legalBasis: 'Art. 175 CPP'
        }
    ],

    'FURTO': [
        {
            id: 'fur-1',
            category: 'TECNOLOGICA',
            title: 'Câmeras de Segurança',
            description: 'Requisitar imagens do local e redondezas',
            priority: 'ALTA',
            deadline: '48h'
        },
        {
            id: 'fur-2',
            category: 'PERICIAL',
            title: 'Perícia de Arrombamento',
            description: 'Acionar perícia se houver arrombamento',
            priority: 'MEDIA'
        },
        {
            id: 'fur-3',
            category: 'OPERACIONAL',
            title: 'Consulta de Receptadores',
            description: 'Verificar locais conhecidos de receptação na região',
            priority: 'MEDIA'
        }
    ],

    'ESTELIONATO': [
        {
            id: 'est-1',
            category: 'DOCUMENTAL',
            title: 'Extrato Bancário',
            description: 'Requisitar extratos e comprovantes de transferência',
            priority: 'ALTA',
            legalBasis: 'LC 105/2001'
        },
        {
            id: 'est-2',
            category: 'TECNOLOGICA',
            title: 'Dados de IP',
            description: 'Requisitar logs de acesso e IPs usados nas transações',
            priority: 'ALTA',
            legalBasis: 'Marco Civil da Internet'
        },
        {
            id: 'est-3',
            category: 'DOCUMENTAL',
            title: 'Prints de Conversas',
            description: 'Coletar e autenticar prints de conversas WhatsApp/Telegram',
            priority: 'ALTA'
        },
        {
            id: 'est-4',
            category: 'PERICIAL',
            title: 'Perícia em Documentos',
            description: 'Exame grafotécnico se houver assinaturas falsas',
            priority: 'MEDIA',
            legalBasis: 'Art. 174 CPP'
        }
    ],

    // ========================================================================
    // CRIMES DE DROGAS
    // ========================================================================
    'TRAFICO': [
        {
            id: 'trf-1',
            category: 'PERICIAL',
            title: 'Laudo Toxicológico',
            description: 'Encaminhar substância apreendida para exame definitivo',
            priority: 'ALTA',
            legalBasis: 'Art. 50 Lei 11.343/2006'
        },
        {
            id: 'trf-2',
            category: 'TECNOLOGICA',
            title: 'Extração de Celular',
            description: 'Perícia em smartphone para mapear rede de contatos',
            priority: 'ALTA',
            legalBasis: 'Art. 240 CPP (busca)'
        },
        {
            id: 'trf-3',
            category: 'DOCUMENTAL',
            title: 'Quebra de Sigilo Bancário',
            description: 'Requisitar movimentação financeira para identificar lavagem',
            priority: 'ALTA',
            legalBasis: 'LC 105/2001'
        },
        {
            id: 'trf-4',
            category: 'OPERACIONAL',
            title: 'Identificação de Rede',
            description: 'Mapear fornecedores e compradores via interceptação',
            priority: 'ALTA',
            legalBasis: 'Lei 9.296/96'
        }
    ],

    // ========================================================================
    // VIOLÊNCIA DOMÉSTICA
    // ========================================================================
    'VIOLENCIA_DOMESTICA': [
        {
            id: 'vd-1',
            category: 'TESTEMUNHAL',
            title: 'Oitiva da Vítima',
            description: 'Colher declarações em sala especial, se disponível',
            priority: 'ALTA',
            legalBasis: 'Art. 11 Lei 11.340/2006'
        },
        {
            id: 'vd-2',
            category: 'DOCUMENTAL',
            title: 'Medidas Protetivas',
            description: 'Encaminhar pedido de medidas protetivas ao Juizado',
            priority: 'ALTA',
            legalBasis: 'Art. 22 Lei 11.340/2006',
            deadline: '48h'
        },
        {
            id: 'vd-3',
            category: 'PERICIAL',
            title: 'Exame de Lesões',
            description: 'Requisitar exame de corpo de delito',
            priority: 'ALTA',
            legalBasis: 'Art. 158 CPP'
        },
        {
            id: 'vd-4',
            category: 'OPERACIONAL',
            title: 'Notificação ao Agressor',
            description: 'Notificar agressor das medidas protetivas deferidas',
            priority: 'ALTA'
        }
    ]
};

// ============================================================================
// GENERIC DILIGENCES (apply to any crime)
// ============================================================================

const GENERIC_DILIGENCES: Record<string, DiligenceSuggestion[]> = {
    'no_victim_statement': [
        {
            id: 'gen-1',
            category: 'TESTEMUNHAL',
            title: 'Oitiva da Vítima',
            description: 'Intimar e ouvir a vítima sobre os fatos',
            priority: 'ALTA',
            legalBasis: 'Art. 201 CPP'
        }
    ],
    'no_suspect_statement': [
        {
            id: 'gen-2',
            category: 'TESTEMUNHAL',
            title: 'Interrogatório do Suspeito',
            description: 'Intimar suspeito para interrogatório, com advogado',
            priority: 'MEDIA',
            legalBasis: 'Art. 185-196 CPP'
        }
    ],
    'no_witnesses': [
        {
            id: 'gen-3',
            category: 'TESTEMUNHAL',
            title: 'Identificação de Testemunhas',
            description: 'Diligências para identificar testemunhas presenciais',
            priority: 'MEDIA'
        }
    ],
    'vehicle_involved': [
        {
            id: 'gen-4',
            category: 'DOCUMENTAL',
            title: 'Consulta DETRAN',
            description: 'Consultar dados do veículo e proprietário via DETRAN',
            priority: 'ALTA'
        }
    ],
    'weapon_involved': [
        {
            id: 'gen-5',
            category: 'PERICIAL',
            title: 'Perícia em Arma',
            description: 'Encaminhar arma para exame pericial e confronto balístico',
            priority: 'ALTA',
            legalBasis: 'Art. 175 CPP'
        }
    ],
    'no_phone_data': [
        {
            id: 'gen-6',
            category: 'TECNOLOGICA',
            title: 'Requisição de ERBs',
            description: 'Solicitar dados de ERBs para localização de suspeitos',
            priority: 'MEDIA',
            legalBasis: 'Lei 9.296/96'
        }
    ],
    'no_bank_data': [
        {
            id: 'gen-7',
            category: 'DOCUMENTAL',
            title: 'Quebra de Sigilo Bancário',
            description: 'Representar por quebra de sigilo bancário',
            priority: 'MEDIA',
            legalBasis: 'LC 105/2001'
        }
    ]
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export function suggestDiligences(context: InvestigationContext): DiligenceSuggestion[] {
    const suggestions: DiligenceSuggestion[] = [];
    const addedIds = new Set<string>();

    // 1. Add crime-specific diligences
    const crimeKey = context.crimeType.toUpperCase().replace(/\s+/g, '_');
    const crimeDiligences = DILIGENCES_BY_CRIME[crimeKey] || [];
    
    for (const d of crimeDiligences) {
        if (!addedIds.has(d.id)) {
            suggestions.push(d);
            addedIds.add(d.id);
        }
    }

    // 2. Add generic diligences based on missing evidence
    if (!context.hasVictimStatement) {
        GENERIC_DILIGENCES['no_victim_statement']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (!context.hasSuspectStatement && context.suspectsIdentified) {
        GENERIC_DILIGENCES['no_suspect_statement']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (!context.hasWitnesses) {
        GENERIC_DILIGENCES['no_witnesses']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (context.vehicleInvolved) {
        GENERIC_DILIGENCES['vehicle_involved']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (context.weaponInvolved) {
        GENERIC_DILIGENCES['weapon_involved']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (!context.hasPhoneData) {
        GENERIC_DILIGENCES['no_phone_data']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    if (!context.hasBankData && (crimeKey === 'ESTELIONATO' || crimeKey === 'TRAFICO')) {
        GENERIC_DILIGENCES['no_bank_data']?.forEach(d => {
            if (!addedIds.has(d.id)) {
                suggestions.push(d);
                addedIds.add(d.id);
            }
        });
    }

    // 3. Sort by priority
    const priorityOrder = { 'ALTA': 0, 'MEDIA': 1, 'BAIXA': 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return suggestions;
}

// ============================================================================
// FORMAT FOR DISPLAY
// ============================================================================

export function formatDiligenceSuggestions(suggestions: DiligenceSuggestion[]): string {
    if (suggestions.length === 0) {
        return 'NENHUMA DILIGÊNCIA SUGERIDA\n\nTodas as diligências básicas já foram realizadas.';
    }

    let output = 'DILIGÊNCIAS SUGERIDAS\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // Group by priority
    const alta = suggestions.filter(s => s.priority === 'ALTA');
    const media = suggestions.filter(s => s.priority === 'MEDIA');
    const baixa = suggestions.filter(s => s.priority === 'BAIXA');

    if (alta.length > 0) {
        output += 'PRIORIDADE ALTA\n';
        output += '━━━━━━━━━━━━━━━━\n';
        for (const d of alta) {
            output += `- ${d.title}\n`;
            output += `  ${d.description}\n`;
            if (d.legalBasis) output += `  Fundamentação: ${d.legalBasis}\n`;
            if (d.deadline) output += `  Prazo: ${d.deadline}\n`;
            output += '\n';
        }
    }

    if (media.length > 0) {
        output += 'PRIORIDADE MÉDIA\n';
        output += '━━━━━━━━━━━━━━━━\n';
        for (const d of media) {
            output += `- ${d.title}\n`;
            output += `  ${d.description}\n`;
            if (d.legalBasis) output += `  Fundamentação: ${d.legalBasis}\n`;
            output += '\n';
        }
    }

    if (baixa.length > 0) {
        output += 'PRIORIDADE BAIXA\n';
        output += '━━━━━━━━━━━━━━━━\n';
        for (const d of baixa) {
            output += `- ${d.title}: ${d.description}\n`;
        }
    }

    return output;
}

export default {
    suggestDiligences,
    formatDiligenceSuggestions
};
