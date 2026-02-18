/**
 * IndexedDB Cache (L2 Cache)
 * 
 * Persistência de dados no browser para sessões longas.
 * Complementa o cache L1 in-memory para dados que sobrevivem refresh.
 * 
 * @example
 * const cache = new IndexedDBCache('intelink-cache');
 * await cache.set('entities', data, 60 * 60 * 1000); // 1 hour TTL
 * const data = await cache.get('entities');
 */

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
    key: string;
    value: T;
    expiresAt: number;
    createdAt: number;
    size?: number;
}

interface CacheStats {
    entries: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
}

// ============================================================================
// INDEXED DB CACHE
// ============================================================================

export class IndexedDBCache {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;
    private version: number;

    constructor(dbName: string = 'intelink-cache', version: number = 1) {
        this.dbName = dbName;
        this.storeName = 'cache';
        this.version = version;
    }

    /**
     * Initialize the database
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (typeof window === 'undefined' || !window.indexedDB) {
            console.warn('[IndexedDBCache] IndexedDB not available');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[IndexedDBCache] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('expiresAt', 'expiresAt', { unique: false });
                }
            };
        });
    }

    /**
     * Get a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        await this.init();
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onerror = () => {
                console.error('[IndexedDBCache] Get error:', request.error);
                resolve(null);
            };

            request.onsuccess = () => {
                const entry = request.result as CacheEntry<T> | undefined;
                
                if (!entry) {
                    resolve(null);
                    return;
                }

                // Check expiration
                if (entry.expiresAt < Date.now()) {
                    this.delete(key); // Clean up expired entry
                    resolve(null);
                    return;
                }

                resolve(entry.value);
            };
        });
    }

    /**
     * Set a value in cache
     */
    async set<T>(key: string, value: T, ttlMs: number = 30 * 60 * 1000): Promise<void> {
        await this.init();
        if (!this.db) return;

        const entry: CacheEntry<T> = {
            key,
            value,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now(),
            size: JSON.stringify(value).length,
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(entry);

            request.onerror = () => {
                console.error('[IndexedDBCache] Set error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    /**
     * Delete a value from cache
     */
    async delete(key: string): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onerror = () => {
                console.error('[IndexedDBCache] Delete error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    /**
     * Clear all cache entries
     */
    async clear(): Promise<void> {
        await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => {
                console.error('[IndexedDBCache] Clear error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve();
            };
        });
    }

    /**
     * Remove expired entries
     */
    async cleanup(): Promise<number> {
        await this.init();
        if (!this.db) return 0;

        const now = Date.now();
        let deletedCount = 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('expiresAt');
            const range = IDBKeyRange.upperBound(now);
            const request = index.openCursor(range);

            request.onerror = () => {
                console.error('[IndexedDBCache] Cleanup error:', request.error);
                resolve(deletedCount);
            };

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    resolve(deletedCount);
                }
            };
        });
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<CacheStats> {
        await this.init();
        if (!this.db) {
            return { entries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => {
                console.error('[IndexedDBCache] Stats error:', request.error);
                resolve({ entries: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 });
            };

            request.onsuccess = () => {
                const entries = request.result as CacheEntry<any>[];
                const validEntries = entries.filter(e => e.expiresAt > Date.now());
                
                const stats: CacheStats = {
                    entries: validEntries.length,
                    totalSize: validEntries.reduce((acc, e) => acc + (e.size || 0), 0),
                    oldestEntry: validEntries.length > 0 
                        ? Math.min(...validEntries.map(e => e.createdAt))
                        : 0,
                    newestEntry: validEntries.length > 0
                        ? Math.max(...validEntries.map(e => e.createdAt))
                        : 0,
                };
                
                resolve(stats);
            };
        });
    }

    /**
     * Check if a key exists (without fetching value)
     */
    async has(key: string): Promise<boolean> {
        const value = await this.get(key);
        return value !== null;
    }

    /**
     * Get or set with factory function
     */
    async getOrSet<T>(
        key: string, 
        factory: () => Promise<T>, 
        ttlMs?: number
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;

        const value = await factory();
        await this.set(key, value, ttlMs);
        return value;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultCache: IndexedDBCache | null = null;

export function getCache(): IndexedDBCache {
    if (!defaultCache) {
        defaultCache = new IndexedDBCache();
    }
    return defaultCache;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function cacheGet<T>(key: string): Promise<T | null> {
    return getCache().get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    return getCache().set(key, value, ttlMs);
}

export async function cacheDelete(key: string): Promise<void> {
    return getCache().delete(key);
}

export async function cacheClear(): Promise<void> {
    return getCache().clear();
}

export default IndexedDBCache;
