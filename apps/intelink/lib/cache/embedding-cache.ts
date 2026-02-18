/**
 * Embedding Cache
 * 
 * Cache de vetores de embedding para similaridade semântica.
 * Evita recalcular embeddings para textos já processados.
 * 
 * @example
 * const cache = new EmbeddingCache();
 * cache.set('JOAO SILVA', [0.1, 0.2, 0.3, ...]);
 * const embedding = cache.get('JOAO SILVA');
 * const similar = cache.findSimilar([0.1, 0.2, 0.3], 0.8);
 */

import { getCache as getIndexedDBCache } from './indexed-db-cache';

// ============================================================================
// TYPES
// ============================================================================

export interface EmbeddingEntry {
    text: string;
    embedding: number[];
    norm?: number; // Pre-computed L2 norm for faster similarity
    createdAt: number;
}

export interface SimilarityResult {
    text: string;
    embedding: number[];
    similarity: number;
}

// ============================================================================
// EMBEDDING CACHE
// ============================================================================

export class EmbeddingCache {
    private cache: Map<string, EmbeddingEntry> = new Map();
    private maxSize: number;
    private dimension: number;

    constructor(maxSize: number = 5000, dimension: number = 768) {
        this.maxSize = maxSize;
        this.dimension = dimension;
    }

    /**
     * Normalize text for consistent keys
     */
    private normalizeKey(text: string): string {
        return text
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Compute L2 norm of a vector
     */
    private computeNorm(embedding: number[]): number {
        let sum = 0;
        for (const val of embedding) {
            sum += val * val;
        }
        return Math.sqrt(sum);
    }

    /**
     * Compute cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[], normA?: number, normB?: number): number {
        if (a.length !== b.length) {
            throw new Error('Embedding dimensions must match');
        }

        let dotProduct = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
        }

        const na = normA ?? this.computeNorm(a);
        const nb = normB ?? this.computeNorm(b);

        if (na === 0 || nb === 0) return 0;
        return dotProduct / (na * nb);
    }

    /**
     * Add an embedding to the cache
     */
    set(text: string, embedding: number[]): void {
        const key = this.normalizeKey(text);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            text,
            embedding,
            norm: this.computeNorm(embedding),
            createdAt: Date.now(),
        });
    }

    /**
     * Get an embedding from the cache
     */
    get(text: string): number[] | null {
        const key = this.normalizeKey(text);
        const entry = this.cache.get(key);
        return entry?.embedding ?? null;
    }

    /**
     * Check if an embedding exists
     */
    has(text: string): boolean {
        const key = this.normalizeKey(text);
        return this.cache.has(key);
    }

    /**
     * Delete an embedding
     */
    delete(text: string): boolean {
        const key = this.normalizeKey(text);
        return this.cache.delete(key);
    }

    /**
     * Find similar embeddings
     */
    findSimilar(
        embedding: number[],
        threshold: number = 0.8,
        limit: number = 10
    ): SimilarityResult[] {
        const results: SimilarityResult[] = [];
        const queryNorm = this.computeNorm(embedding);

        for (const entry of this.cache.values()) {
            const similarity = this.cosineSimilarity(
                embedding,
                entry.embedding,
                queryNorm,
                entry.norm
            );

            if (similarity >= threshold) {
                results.push({
                    text: entry.text,
                    embedding: entry.embedding,
                    similarity,
                });
            }
        }

        // Sort by similarity (descending) and limit
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Find the most similar embedding
     */
    findMostSimilar(embedding: number[]): SimilarityResult | null {
        const results = this.findSimilar(embedding, 0, 1);
        return results[0] ?? null;
    }

    /**
     * Batch add embeddings
     */
    setMany(entries: Array<{ text: string; embedding: number[] }>): void {
        for (const entry of entries) {
            this.set(entry.text, entry.embedding);
        }
    }

    /**
     * Get all texts in cache
     */
    getAllTexts(): string[] {
        return Array.from(this.cache.values()).map(e => e.text);
    }

    /**
     * Get cache size
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats(): {
        size: number;
        maxSize: number;
        dimension: number;
        oldestEntry: number;
        newestEntry: number;
        memoryEstimateKB: number;
    } {
        const entries = Array.from(this.cache.values());
        const memoryPerEntry = this.dimension * 8 + 100; // 8 bytes per float + overhead

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            dimension: this.dimension,
            oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.createdAt)) : 0,
            newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.createdAt)) : 0,
            memoryEstimateKB: Math.round((this.cache.size * memoryPerEntry) / 1024),
        };
    }

    /**
     * Export cache to JSON (for persistence)
     */
    export(): string {
        const data = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            ...entry,
        }));
        return JSON.stringify(data);
    }

    /**
     * Import cache from JSON
     */
    import(json: string): void {
        const data = JSON.parse(json);
        this.cache.clear();
        for (const item of data) {
            this.cache.set(item.key, {
                text: item.text,
                embedding: item.embedding,
                norm: item.norm,
                createdAt: item.createdAt,
            });
        }
    }

    /**
     * Persist to IndexedDB
     */
    async persist(): Promise<void> {
        const idbCache = getIndexedDBCache();
        await idbCache.set('embedding_cache', this.export(), 24 * 60 * 60 * 1000); // 24h TTL
    }

    /**
     * Load from IndexedDB
     */
    async load(): Promise<boolean> {
        try {
            const idbCache = getIndexedDBCache();
            const data = await idbCache.get<string>('embedding_cache');
            if (data) {
                this.import(data);
                return true;
            }
        } catch (error) {
            console.warn('[EmbeddingCache] Failed to load from IndexedDB:', error);
        }
        return false;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultCache: EmbeddingCache | null = null;

export function getEmbeddingCache(): EmbeddingCache {
    if (!defaultCache) {
        defaultCache = new EmbeddingCache();
    }
    return defaultCache;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute embedding for text using OpenAI-compatible API
 */
export async function computeEmbedding(
    text: string,
    apiEndpoint: string = '/api/embeddings'
): Promise<number[]> {
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
}

/**
 * Get or compute embedding (uses cache)
 */
export async function getOrComputeEmbedding(
    text: string,
    apiEndpoint?: string
): Promise<number[]> {
    const cache = getEmbeddingCache();
    
    // Check cache first
    const cached = cache.get(text);
    if (cached) {
        return cached;
    }

    // Compute and cache
    const embedding = await computeEmbedding(text, apiEndpoint);
    cache.set(text, embedding);
    
    return embedding;
}

export default EmbeddingCache;
