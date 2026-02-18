/**
 * INTELINK - Law Synchronization Service
 * 
 * Integrates with official Brazilian government APIs to keep
 * criminal articles database up-to-date.
 * 
 * Sources:
 * - Senado Federal: https://legis.senado.leg.br/dadosabertos/
 * - Câmara dos Deputados: https://dadosabertos.camara.leg.br/
 * - Planalto (scraping): https://www.planalto.gov.br/
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LawUpdate {
    lawId: string;
    lawName: string;
    currentVersion: string;
    lastChecked: Date;
    hasUpdates: boolean;
    changes?: string[];
}

export interface SyncResult {
    success: boolean;
    checkedAt: Date;
    lawsChecked: number;
    updatesFound: number;
    updates: LawUpdate[];
    errors: string[];
}

export interface SenadoNorma {
    CodigoNorma: string;
    SiglaTipoNorma: string;
    NumeroNorma: string;
    AnoNorma: string;
    DescricaoTipoNorma: string;
    DataNorma: string;
    DescricaoObjetivo?: string;
    UrlTextoOriginal?: string;
    UrlTextoCompilado?: string;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const SENADO_API = 'https://legis.senado.leg.br/dadosabertos';
const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';

// Laws we track for updates
const TRACKED_LAWS = [
    { id: 'CP', sigla: 'DEL', numero: '2848', ano: '1940', name: 'Código Penal' },
    { id: 'LEI_DROGAS', sigla: 'LEI', numero: '11343', ano: '2006', name: 'Lei de Drogas' },
    { id: 'MARIA_PENHA', sigla: 'LEI', numero: '11340', ano: '2006', name: 'Lei Maria da Penha' },
    { id: 'ARMAS', sigla: 'LEI', numero: '10826', ano: '2003', name: 'Estatuto do Desarmamento' },
    { id: 'ORCRIM', sigla: 'LEI', numero: '12850', ano: '2013', name: 'Lei de Organizações Criminosas' },
    { id: 'LAVAGEM', sigla: 'LEI', numero: '9613', ano: '1998', name: 'Lei de Lavagem de Dinheiro' },
    { id: 'CPP', sigla: 'DEL', numero: '3689', ano: '1941', name: 'Código de Processo Penal' },
    { id: 'ECA', sigla: 'LEI', numero: '8069', ano: '1990', name: 'Estatuto da Criança e Adolescente' },
];

// ============================================================================
// SYNC VERSION STORAGE (local file-based)
// ============================================================================

interface SyncMetadata {
    lastSync: string;
    versions: Record<string, string>;
}

let syncMetadata: SyncMetadata = {
    lastSync: new Date(0).toISOString(),
    versions: {}
};

// ============================================================================
// SENADO API INTEGRATION
// ============================================================================

/**
 * Fetch law info from Senado Dados Abertos
 */
async function fetchSenadoNorma(sigla: string, numero: string, ano: string): Promise<SenadoNorma | null> {
    try {
        const url = `${SENADO_API}/norma/${sigla}/${numero}/${ano}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`[LawSync] Senado API returned ${response.status} for ${sigla} ${numero}/${ano}`);
            return null;
        }

        const data = await response.json();
        return data?.DetalheNorma?.Norma || null;
    } catch (error: any) {
        console.error(`[LawSync] Error fetching from Senado:`, error.message);
        return null;
    }
}

/**
 * Search for recent updates to a law
 */
async function searchLawUpdates(lawName: string): Promise<any[]> {
    try {
        const url = `${SENADO_API}/materia/pesquisa/lista?palavraChave=${encodeURIComponent(lawName)}&ano=${new Date().getFullYear()}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data?.PesquisaBasica?.Materias?.Materia || [];
    } catch (error) {
        return [];
    }
}

// ============================================================================
// PLANALTO SCRAPING (for latest text versions)
// ============================================================================

/**
 * Get the last modification date of a law from Planalto
 * Uses HEAD request to check Last-Modified header
 */
async function getPlanaltoLastModified(lawId: string): Promise<string | null> {
    const urls: Record<string, string> = {
        'CP': 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm',
        'LEI_DROGAS': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm',
        'MARIA_PENHA': 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm',
        'ARMAS': 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm',
        'ORCRIM': 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm',
        'LAVAGEM': 'https://www.planalto.gov.br/ccivil_03/leis/l9613.htm',
    };

    const url = urls[lawId];
    if (!url) return null;

    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.headers.get('last-modified');
    } catch (error) {
        return null;
    }
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

/**
 * Check for updates to all tracked laws
 */
export async function syncLaws(): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        checkedAt: new Date(),
        lawsChecked: 0,
        updatesFound: 0,
        updates: [],
        errors: []
    };

    console.log('[LawSync] Starting law synchronization...');

    for (const law of TRACKED_LAWS) {
        try {
            result.lawsChecked++;

            // Check Planalto for last modification
            const lastModified = await getPlanaltoLastModified(law.id);
            const storedVersion = syncMetadata.versions[law.id] || '';
            
            const update: LawUpdate = {
                lawId: law.id,
                lawName: law.name,
                currentVersion: lastModified || 'unknown',
                lastChecked: new Date(),
                hasUpdates: false
            };

            // Compare versions
            if (lastModified && lastModified !== storedVersion) {
                update.hasUpdates = true;
                result.updatesFound++;
                
                // Search for related legislative updates
                const relatedUpdates = await searchLawUpdates(law.name);
                if (relatedUpdates.length > 0) {
                    update.changes = relatedUpdates.slice(0, 3).map((m: any) => 
                        `${m.SiglaTipoMateria} ${m.NumeroMateria}/${m.AnoMateria}: ${m.EmentaMateria?.substring(0, 100)}...`
                    );
                }

                // Update stored version
                syncMetadata.versions[law.id] = lastModified;
            }

            result.updates.push(update);

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error: any) {
            result.errors.push(`${law.name}: ${error.message}`);
        }
    }

    syncMetadata.lastSync = new Date().toISOString();
    
    console.log(`[LawSync] Complete. Checked: ${result.lawsChecked}, Updates: ${result.updatesFound}`);
    
    return result;
}

/**
 * Get sync status without checking for updates
 */
export function getSyncStatus(): { lastSync: string; trackedLaws: number } {
    return {
        lastSync: syncMetadata.lastSync,
        trackedLaws: TRACKED_LAWS.length
    };
}

/**
 * Get list of tracked laws
 */
export function getTrackedLaws() {
    return TRACKED_LAWS.map(law => ({
        id: law.id,
        name: law.name,
        sigla: law.sigla,
        numero: law.numero,
        ano: law.ano,
        lastVersion: syncMetadata.versions[law.id] || null
    }));
}

// ============================================================================
// CONTEXT7 INTEGRATION (for library docs)
// ============================================================================

/**
 * Get up-to-date documentation using Context7 MCP pattern
 * This would be called by the MCP, not directly
 */
export function getContext7Query(topic: string): string {
    return `Brazilian criminal law ${topic} latest updates 2024 2025`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    syncLaws,
    getSyncStatus,
    getTrackedLaws,
    TRACKED_LAWS
};
