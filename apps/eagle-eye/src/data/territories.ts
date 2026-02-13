/**
 * 🏙️ Eagle Eye — High Value Territories
 * 
 * Focus on Capitals and Major Economic Hubs to maximize ROI.
 * IDs based on Querido Diário API format (IBGE code usually).
 */

export interface Territory {
    id: string;
    name: string;
    state: string;
    tier: 'metropolis' | 'capital' | 'hub';
}

// Top 20 Economic Hubs + Capitals
export const PRIORITY_TERRITORIES: Territory[] = [
    // Southeast
    { id: '3550308', name: 'São Paulo', state: 'SP', tier: 'metropolis' },
    { id: '3304557', name: 'Rio de Janeiro', state: 'RJ', tier: 'metropolis' },
    { id: '3106200', name: 'Belo Horizonte', state: 'MG', tier: 'metropolis' },
    { id: '3509502', name: 'Campinas', state: 'SP', tier: 'hub' },
    { id: '3518800', name: 'Guarulhos', state: 'SP', tier: 'hub' },
    { id: '3548708', name: 'São Bernardo do Campo', state: 'SP', tier: 'hub' },

    // South
    { id: '4106902', name: 'Curitiba', state: 'PR', tier: 'capital' },
    { id: '4314902', name: 'Porto Alegre', state: 'RS', tier: 'capital' },
    { id: '4205407', name: 'Florianópolis', state: 'SC', tier: 'capital' },

    // Midwest
    { id: '5300108', name: 'Brasília', state: 'DF', tier: 'metropolis' },
    { id: '5208707', name: 'Goiânia', state: 'GO', tier: 'capital' },

    // Northeast
    { id: '2927408', name: 'Salvador', state: 'BA', tier: 'capital' },
    { id: '2611606', name: 'Recife', state: 'PE', tier: 'capital' },
    { id: '2304400', name: 'Fortaleza', state: 'CE', tier: 'capital' },

    // North
    { id: '1302603', name: 'Manaus', state: 'AM', tier: 'hub' },
];

export function getTerritoryIds(): string[] {
    return PRIORITY_TERRITORIES.map(t => t.id);
}
