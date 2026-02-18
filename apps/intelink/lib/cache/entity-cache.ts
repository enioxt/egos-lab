/**
 * 🚀 Entity Cache - L1 In-Memory Cache
 * 
 * Cache em memória para entidades do sistema.
 * Usado para acelerar operações de matching sem ir ao banco.
 * 
 * Estratégia: LRU (Least Recently Used) com TTL
 */

// Tipos
export interface CachedEntity {
    id: string;
    name: string;
    type: string;
    normalizedValues: {
        cpf?: string;      // Sem pontuação
        cnpj?: string;     // Sem pontuação
        placa?: string;    // Uppercase
        phone?: string;    // Só dígitos
    };
    investigationId?: string;
    metadata?: Record<string, any>;
    cachedAt: number;
    accessCount: number;
}

interface CacheEntry {
    entity: CachedEntity;
    expiresAt: number;
}

interface CacheConfig {
    maxSize: number;
    ttlMs: number;
}

const DEFAULT_CONFIG: CacheConfig = {
    maxSize: 1000,
    ttlMs: 30 * 60 * 1000 // 30 minutes
};

// Global cache instance (singleton pattern for serverless)
let cacheInstance: EntityCache | null = null;

/**
 * Entity Cache Class
 */
class EntityCache {
    private cache: Map<string, CacheEntry> = new Map();
    private config: CacheConfig;
    
    // Index maps for fast lookup by normalized value
    private cpfIndex: Map<string, string> = new Map(); // cpf -> entityId
    private cnpjIndex: Map<string, string> = new Map();
    private placaIndex: Map<string, string> = new Map();
    private phoneIndex: Map<string, string> = new Map();
    
    constructor(config: Partial<CacheConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    /**
     * Add entity to cache
     */
    set(entity: Omit<CachedEntity, 'cachedAt' | 'accessCount'>): void {
        const now = Date.now();
        
        // Evict if at capacity
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }
        
        const cachedEntity: CachedEntity = {
            ...entity,
            cachedAt: now,
            accessCount: 0
        };
        
        const entry: CacheEntry = {
            entity: cachedEntity,
            expiresAt: now + this.config.ttlMs
        };
        
        this.cache.set(entity.id, entry);
        
        // Update indexes
        if (entity.normalizedValues.cpf) {
            this.cpfIndex.set(entity.normalizedValues.cpf, entity.id);
        }
        if (entity.normalizedValues.cnpj) {
            this.cnpjIndex.set(entity.normalizedValues.cnpj, entity.id);
        }
        if (entity.normalizedValues.placa) {
            this.placaIndex.set(entity.normalizedValues.placa, entity.id);
        }
        if (entity.normalizedValues.phone) {
            this.phoneIndex.set(entity.normalizedValues.phone, entity.id);
        }
    }
    
    /**
     * Get entity by ID
     */
    get(id: string): CachedEntity | null {
        const entry = this.cache.get(id);
        
        if (!entry) return null;
        
        // Check TTL
        if (Date.now() > entry.expiresAt) {
            this.delete(id);
            return null;
        }
        
        // Update access count (LRU tracking)
        entry.entity.accessCount++;
        
        return entry.entity;
    }
    
    /**
     * Find by CPF (instant lookup)
     */
    findByCPF(cpf: string): CachedEntity | null {
        const normalized = cpf.replace(/\D/g, '');
        const entityId = this.cpfIndex.get(normalized);
        return entityId ? this.get(entityId) : null;
    }
    
    /**
     * Find by CNPJ (instant lookup)
     */
    findByCNPJ(cnpj: string): CachedEntity | null {
        const normalized = cnpj.replace(/\D/g, '');
        const entityId = this.cnpjIndex.get(normalized);
        return entityId ? this.get(entityId) : null;
    }
    
    /**
     * Find by Placa (instant lookup)
     */
    findByPlaca(placa: string): CachedEntity | null {
        const normalized = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const entityId = this.placaIndex.get(normalized);
        return entityId ? this.get(entityId) : null;
    }
    
    /**
     * Find by Phone (instant lookup)
     */
    findByPhone(phone: string): CachedEntity | null {
        const normalized = phone.replace(/\D/g, '');
        const entityId = this.phoneIndex.get(normalized);
        return entityId ? this.get(entityId) : null;
    }
    
    /**
     * Delete entity from cache
     */
    delete(id: string): boolean {
        const entry = this.cache.get(id);
        
        if (!entry) return false;
        
        // Remove from indexes
        const nv = entry.entity.normalizedValues;
        if (nv.cpf) this.cpfIndex.delete(nv.cpf);
        if (nv.cnpj) this.cnpjIndex.delete(nv.cnpj);
        if (nv.placa) this.placaIndex.delete(nv.placa);
        if (nv.phone) this.phoneIndex.delete(nv.phone);
        
        return this.cache.delete(id);
    }
    
    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let lruId: string | null = null;
        let lruScore = Infinity;
        
        for (const [id, entry] of this.cache.entries()) {
            // Score = accessCount / age (higher = more recently used)
            const age = Date.now() - entry.entity.cachedAt;
            const score = entry.entity.accessCount / (age + 1);
            
            if (score < lruScore) {
                lruScore = score;
                lruId = id;
            }
        }
        
        if (lruId) {
            this.delete(lruId);
        }
    }
    
    /**
     * Clear expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;
        
        for (const [id, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.delete(id);
                removed++;
            }
        }
        
        return removed;
    }
    
    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.cpfIndex.clear();
        this.cnpjIndex.clear();
        this.placaIndex.clear();
        this.phoneIndex.clear();
    }
    
    /**
     * Get cache stats
     */
    stats(): {
        size: number;
        maxSize: number;
        utilization: number;
        indexes: {
            cpf: number;
            cnpj: number;
            placa: number;
            phone: number;
        };
    } {
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            utilization: Math.round((this.cache.size / this.config.maxSize) * 100),
            indexes: {
                cpf: this.cpfIndex.size,
                cnpj: this.cnpjIndex.size,
                placa: this.placaIndex.size,
                phone: this.phoneIndex.size
            }
        };
    }
    
    /**
     * Bulk load entities (for warming cache)
     */
    bulkLoad(entities: Omit<CachedEntity, 'cachedAt' | 'accessCount'>[]): number {
        let loaded = 0;
        
        for (const entity of entities) {
            if (this.cache.size >= this.config.maxSize) break;
            this.set(entity);
            loaded++;
        }
        
        return loaded;
    }
    
    /**
     * Check if value exists (for Bloom Filter simulation)
     */
    has(type: 'cpf' | 'cnpj' | 'placa' | 'phone', value: string): boolean {
        const normalized = value.replace(/\D/g, '');
        
        switch (type) {
            case 'cpf': return this.cpfIndex.has(normalized);
            case 'cnpj': return this.cnpjIndex.has(normalized);
            case 'placa': return this.placaIndex.has(value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
            case 'phone': return this.phoneIndex.has(normalized);
            default: return false;
        }
    }
}

// Singleton getter
export function getEntityCache(config?: Partial<CacheConfig>): EntityCache {
    if (!cacheInstance) {
        cacheInstance = new EntityCache(config);
        
        // Auto-cleanup every 5 minutes
        if (typeof setInterval !== 'undefined') {
            setInterval(() => {
                cacheInstance?.cleanup();
            }, 5 * 60 * 1000);
        }
    }
    return cacheInstance;
}

// Helper: Normalize entity for caching
export function normalizeForCache(entity: {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
    investigation_id?: string;
}): Omit<CachedEntity, 'cachedAt' | 'accessCount'> {
    const metadata = entity.metadata || {};
    
    return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        investigationId: entity.investigation_id,
        metadata,
        normalizedValues: {
            cpf: metadata.cpf?.replace(/\D/g, ''),
            cnpj: metadata.cnpj?.replace(/\D/g, ''),
            placa: metadata.placa?.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            phone: metadata.telefone?.replace(/\D/g, '') || metadata.phone?.replace(/\D/g, ''),
        }
    };
}
