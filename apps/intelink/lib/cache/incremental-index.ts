/**
 * Incremental Index
 * 
 * Índice em tempo real que atualiza automaticamente quando entidades mudam.
 * Suporta operações de busca rápida e sincronização com o backend.
 * 
 * @example
 * const index = new IncrementalIndex();
 * index.addEntity({ id: '1', name: 'JOAO SILVA', type: 'PERSON' });
 * const results = index.search('JOAO');
 */

import { getEntityFilter } from './bloom-filter';

// ============================================================================
// TYPES
// ============================================================================

export interface IndexedEntity {
    id: string;
    name: string;
    type: string;
    investigationId?: string;
    metadata?: Record<string, any>;
    indexedAt: number;
    tokens: string[];
}

export interface SearchResult {
    entity: IndexedEntity;
    score: number;
    matchedTokens: string[];
}

export interface IndexStats {
    totalEntities: number;
    byType: Record<string, number>;
    byInvestigation: Record<string, number>;
    lastUpdate: number;
    memoryEstimateKB: number;
}

// ============================================================================
// INCREMENTAL INDEX
// ============================================================================

export class IncrementalIndex {
    private entities: Map<string, IndexedEntity> = new Map();
    private invertedIndex: Map<string, Set<string>> = new Map(); // token -> entity IDs
    private typeIndex: Map<string, Set<string>> = new Map(); // type -> entity IDs
    private investigationIndex: Map<string, Set<string>> = new Map(); // inv ID -> entity IDs
    private lastUpdate: number = 0;
    private updateListeners: Set<(entity: IndexedEntity, action: 'add' | 'update' | 'delete') => void> = new Set();

    /**
     * Tokenize text for indexing
     */
    private tokenize(text: string): string[] {
        return text
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .split(/\s+/)
            .filter(t => t.length >= 2)
            .map(t => t.replace(/[^A-Z0-9]/g, ''));
    }

    /**
     * Add an entity to the index
     */
    addEntity(entity: Omit<IndexedEntity, 'indexedAt' | 'tokens'>): void {
        const tokens = this.tokenize(entity.name);
        const indexedEntity: IndexedEntity = {
            ...entity,
            tokens,
            indexedAt: Date.now(),
        };

        // Remove old entry if exists (for updates)
        if (this.entities.has(entity.id)) {
            this.removeEntity(entity.id, false);
        }

        // Add to main store
        this.entities.set(entity.id, indexedEntity);

        // Add to inverted index
        for (const token of tokens) {
            if (!this.invertedIndex.has(token)) {
                this.invertedIndex.set(token, new Set());
            }
            this.invertedIndex.get(token)!.add(entity.id);
        }

        // Add to type index
        if (!this.typeIndex.has(entity.type)) {
            this.typeIndex.set(entity.type, new Set());
        }
        this.typeIndex.get(entity.type)!.add(entity.id);

        // Add to investigation index
        if (entity.investigationId) {
            if (!this.investigationIndex.has(entity.investigationId)) {
                this.investigationIndex.set(entity.investigationId, new Set());
            }
            this.investigationIndex.get(entity.investigationId)!.add(entity.id);
        }

        // Add to bloom filter
        getEntityFilter().addEntity(entity.name, entity.type);

        this.lastUpdate = Date.now();
        this.notifyListeners(indexedEntity, 'add');
    }

    /**
     * Remove an entity from the index
     */
    removeEntity(id: string, notify: boolean = true): boolean {
        const entity = this.entities.get(id);
        if (!entity) return false;

        // Remove from inverted index
        for (const token of entity.tokens) {
            this.invertedIndex.get(token)?.delete(id);
            if (this.invertedIndex.get(token)?.size === 0) {
                this.invertedIndex.delete(token);
            }
        }

        // Remove from type index
        this.typeIndex.get(entity.type)?.delete(id);

        // Remove from investigation index
        if (entity.investigationId) {
            this.investigationIndex.get(entity.investigationId)?.delete(id);
        }

        // Remove from main store
        this.entities.delete(id);

        this.lastUpdate = Date.now();
        if (notify) {
            this.notifyListeners(entity, 'delete');
        }

        return true;
    }

    /**
     * Update an entity in the index
     */
    updateEntity(id: string, updates: Partial<Omit<IndexedEntity, 'id' | 'indexedAt' | 'tokens'>>): boolean {
        const entity = this.entities.get(id);
        if (!entity) return false;

        const updatedEntity = { ...entity, ...updates };
        this.addEntity(updatedEntity); // Re-index
        this.notifyListeners(updatedEntity as IndexedEntity, 'update');

        return true;
    }

    /**
     * Get an entity by ID
     */
    getEntity(id: string): IndexedEntity | null {
        return this.entities.get(id) ?? null;
    }

    /**
     * Search entities by text
     */
    search(query: string, options?: {
        type?: string;
        investigationId?: string;
        limit?: number;
    }): SearchResult[] {
        const tokens = this.tokenize(query);
        if (tokens.length === 0) return [];

        const limit = options?.limit ?? 20;
        const candidateScores: Map<string, { score: number; matchedTokens: string[] }> = new Map();

        // Find candidates from inverted index
        for (const token of tokens) {
            // Exact match
            const exactMatches = this.invertedIndex.get(token);
            if (exactMatches) {
                for (const id of exactMatches) {
                    if (!candidateScores.has(id)) {
                        candidateScores.set(id, { score: 0, matchedTokens: [] });
                    }
                    const candidate = candidateScores.get(id)!;
                    candidate.score += 2; // Exact match bonus
                    candidate.matchedTokens.push(token);
                }
            }

            // Prefix match
            for (const [indexToken, ids] of this.invertedIndex) {
                if (indexToken.startsWith(token) && indexToken !== token) {
                    for (const id of ids) {
                        if (!candidateScores.has(id)) {
                            candidateScores.set(id, { score: 0, matchedTokens: [] });
                        }
                        const candidate = candidateScores.get(id)!;
                        candidate.score += 1; // Prefix match
                        if (!candidate.matchedTokens.includes(indexToken)) {
                            candidate.matchedTokens.push(indexToken);
                        }
                    }
                }
            }
        }

        // Filter by type and investigation
        let results: SearchResult[] = [];
        for (const [id, { score, matchedTokens }] of candidateScores) {
            const entity = this.entities.get(id);
            if (!entity) continue;

            if (options?.type && entity.type !== options.type) continue;
            if (options?.investigationId && entity.investigationId !== options.investigationId) continue;

            results.push({ entity, score, matchedTokens });
        }

        // Sort by score and limit
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Get entities by type
     */
    getByType(type: string): IndexedEntity[] {
        const ids = this.typeIndex.get(type);
        if (!ids) return [];
        return Array.from(ids)
            .map(id => this.entities.get(id)!)
            .filter(Boolean);
    }

    /**
     * Get entities by investigation
     */
    getByInvestigation(investigationId: string): IndexedEntity[] {
        const ids = this.investigationIndex.get(investigationId);
        if (!ids) return [];
        return Array.from(ids)
            .map(id => this.entities.get(id)!)
            .filter(Boolean);
    }

    /**
     * Check if entity might exist (using bloom filter)
     */
    mightExist(name: string, type?: string): boolean {
        return getEntityFilter().mightHaveEntity(name, type);
    }

    /**
     * Batch add entities
     */
    addMany(entities: Array<Omit<IndexedEntity, 'indexedAt' | 'tokens'>>): void {
        for (const entity of entities) {
            this.addEntity(entity);
        }
    }

    /**
     * Clear the index
     */
    clear(): void {
        this.entities.clear();
        this.invertedIndex.clear();
        this.typeIndex.clear();
        this.investigationIndex.clear();
        this.lastUpdate = Date.now();
    }

    /**
     * Get index statistics
     */
    getStats(): IndexStats {
        const byType: Record<string, number> = {};
        for (const [type, ids] of this.typeIndex) {
            byType[type] = ids.size;
        }

        const byInvestigation: Record<string, number> = {};
        for (const [invId, ids] of this.investigationIndex) {
            byInvestigation[invId] = ids.size;
        }

        // Estimate memory usage
        const avgTokensPerEntity = 3;
        const avgTokenLength = 8;
        const memoryPerEntity = 200 + avgTokensPerEntity * avgTokenLength;

        return {
            totalEntities: this.entities.size,
            byType,
            byInvestigation,
            lastUpdate: this.lastUpdate,
            memoryEstimateKB: Math.round((this.entities.size * memoryPerEntity) / 1024),
        };
    }

    /**
     * Subscribe to index updates
     */
    onUpdate(callback: (entity: IndexedEntity, action: 'add' | 'update' | 'delete') => void): () => void {
        this.updateListeners.add(callback);
        return () => this.updateListeners.delete(callback);
    }

    /**
     * Notify listeners of updates
     */
    private notifyListeners(entity: IndexedEntity, action: 'add' | 'update' | 'delete'): void {
        for (const listener of this.updateListeners) {
            try {
                listener(entity, action);
            } catch (error) {
                console.error('[IncrementalIndex] Listener error:', error);
            }
        }
    }

    /**
     * Export index to JSON
     */
    export(): string {
        return JSON.stringify({
            entities: Array.from(this.entities.values()),
            lastUpdate: this.lastUpdate,
        });
    }

    /**
     * Import index from JSON
     */
    import(json: string): void {
        const data = JSON.parse(json);
        this.clear();
        for (const entity of data.entities) {
            this.addEntity(entity);
        }
    }

    /**
     * Sync with backend
     */
    async syncWithBackend(apiEndpoint: string = '/api/entities'): Promise<number> {
        try {
            const response = await fetch(`${apiEndpoint}?since=${this.lastUpdate}`);
            if (!response.ok) throw new Error('Sync failed');

            const data = await response.json();
            let count = 0;

            for (const entity of data.entities || []) {
                if (entity.deleted) {
                    this.removeEntity(entity.id);
                } else {
                    this.addEntity(entity);
                }
                count++;
            }

            return count;
        } catch (error) {
            console.error('[IncrementalIndex] Sync error:', error);
            return 0;
        }
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: IncrementalIndex | null = null;

export function getIncrementalIndex(): IncrementalIndex {
    if (!instance) {
        instance = new IncrementalIndex();
    }
    return instance;
}

export default IncrementalIndex;
