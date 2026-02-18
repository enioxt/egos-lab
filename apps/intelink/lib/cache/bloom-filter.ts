/**
 * Bloom Filter
 * 
 * Estrutura de dados probabilística para verificação rápida "existe ou não".
 * Usado para pré-filtrar entidades antes de queries mais pesadas.
 * 
 * - False positives: possíveis (low probability)
 * - False negatives: NUNCA (se diz que não existe, realmente não existe)
 * 
 * @example
 * const filter = new BloomFilter(10000, 0.01); // 10k items, 1% false positive
 * filter.add('JOAO SILVA');
 * filter.mightContain('JOAO SILVA'); // true
 * filter.mightContain('MARIA SANTOS'); // false (definitely not in set)
 */

// ============================================================================
// BLOOM FILTER IMPLEMENTATION
// ============================================================================

export class BloomFilter {
    private bitArray: Uint8Array;
    private size: number;
    private hashCount: number;
    private itemCount: number = 0;

    /**
     * Create a new Bloom Filter
     * @param expectedItems Expected number of items to store
     * @param falsePositiveRate Target false positive rate (0.01 = 1%)
     */
    constructor(expectedItems: number = 10000, falsePositiveRate: number = 0.01) {
        // Calculate optimal size and hash count
        // m = -n * ln(p) / (ln(2)^2)
        // k = (m/n) * ln(2)
        
        const ln2 = Math.LN2;
        const ln2Squared = ln2 * ln2;
        
        this.size = Math.ceil(-expectedItems * Math.log(falsePositiveRate) / ln2Squared);
        this.hashCount = Math.ceil((this.size / expectedItems) * ln2);
        
        // Ensure minimum values
        this.size = Math.max(this.size, 64);
        this.hashCount = Math.max(this.hashCount, 1);
        
        // Create bit array (using Uint8Array, each element holds 8 bits)
        this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
    }

    /**
     * Hash function using FNV-1a algorithm
     */
    private hash1(str: string): number {
        let hash = 2166136261; // FNV offset basis
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0; // FNV prime, keep as unsigned 32-bit
        }
        return hash;
    }

    /**
     * Second hash function using djb2
     */
    private hash2(str: string): number {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        }
        return hash >>> 0; // Keep as unsigned 32-bit
    }

    /**
     * Get the bit positions for a given value
     */
    private getPositions(value: string): number[] {
        const h1 = this.hash1(value);
        const h2 = this.hash2(value);
        const positions: number[] = [];
        
        for (let i = 0; i < this.hashCount; i++) {
            // Double hashing technique: h(i) = h1 + i*h2
            const pos = Math.abs((h1 + i * h2) % this.size);
            positions.push(pos);
        }
        
        return positions;
    }

    /**
     * Set a bit at a given position
     */
    private setBit(pos: number): void {
        const byteIndex = Math.floor(pos / 8);
        const bitIndex = pos % 8;
        this.bitArray[byteIndex] |= (1 << bitIndex);
    }

    /**
     * Check if a bit is set at a given position
     */
    private getBit(pos: number): boolean {
        const byteIndex = Math.floor(pos / 8);
        const bitIndex = pos % 8;
        return (this.bitArray[byteIndex] & (1 << bitIndex)) !== 0;
    }

    /**
     * Add an item to the filter
     */
    add(value: string): void {
        const normalized = this.normalize(value);
        const positions = this.getPositions(normalized);
        
        for (const pos of positions) {
            this.setBit(pos);
        }
        
        this.itemCount++;
    }

    /**
     * Add multiple items
     */
    addAll(values: string[]): void {
        for (const value of values) {
            this.add(value);
        }
    }

    /**
     * Check if an item might be in the set
     * - Returns true: item MIGHT be in the set (could be false positive)
     * - Returns false: item is DEFINITELY NOT in the set
     */
    mightContain(value: string): boolean {
        const normalized = this.normalize(value);
        const positions = this.getPositions(normalized);
        
        for (const pos of positions) {
            if (!this.getBit(pos)) {
                return false; // Definitely not in set
            }
        }
        
        return true; // Might be in set
    }

    /**
     * Normalize a string for consistent hashing
     */
    private normalize(value: string): string {
        return value
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Get current fill ratio (how full the filter is)
     */
    getFillRatio(): number {
        let setBits = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.getBit(i)) setBits++;
        }
        return setBits / this.size;
    }

    /**
     * Get estimated false positive rate based on current fill
     */
    getEstimatedFalsePositiveRate(): number {
        const fillRatio = this.getFillRatio();
        return Math.pow(fillRatio, this.hashCount);
    }

    /**
     * Get filter statistics
     */
    getStats(): {
        size: number;
        hashCount: number;
        itemCount: number;
        fillRatio: number;
        estimatedFPR: number;
        memorySizeBytes: number;
    } {
        return {
            size: this.size,
            hashCount: this.hashCount,
            itemCount: this.itemCount,
            fillRatio: this.getFillRatio(),
            estimatedFPR: this.getEstimatedFalsePositiveRate(),
            memorySizeBytes: this.bitArray.length,
        };
    }

    /**
     * Clear the filter
     */
    clear(): void {
        this.bitArray.fill(0);
        this.itemCount = 0;
    }

    /**
     * Export filter to base64 string (for persistence)
     */
    export(): string {
        const data = {
            size: this.size,
            hashCount: this.hashCount,
            itemCount: this.itemCount,
            bits: Buffer.from(this.bitArray).toString('base64'),
        };
        return JSON.stringify(data);
    }

    /**
     * Import filter from base64 string
     */
    static import(data: string): BloomFilter {
        const parsed = JSON.parse(data);
        const filter = new BloomFilter(1, 0.01); // Temporary, will be overwritten
        
        filter.size = parsed.size;
        filter.hashCount = parsed.hashCount;
        filter.itemCount = parsed.itemCount;
        filter.bitArray = new Uint8Array(Buffer.from(parsed.bits, 'base64'));
        
        return filter;
    }
}

// ============================================================================
// PRE-BUILT FILTERS FOR COMMON USE CASES
// ============================================================================

/**
 * Entity name filter for quick "already exists" checks
 */
export class EntityBloomFilter extends BloomFilter {
    constructor(expectedEntities: number = 50000) {
        super(expectedEntities, 0.001); // 0.1% false positive for entities
    }

    addEntity(name: string, type?: string): void {
        this.add(name);
        if (type) {
            this.add(`${type}:${name}`);
        }
    }

    mightHaveEntity(name: string, type?: string): boolean {
        if (type) {
            return this.mightContain(`${type}:${name}`);
        }
        return this.mightContain(name);
    }
}

/**
 * Document hash filter for deduplication
 */
export class DocumentBloomFilter extends BloomFilter {
    constructor(expectedDocs: number = 10000) {
        super(expectedDocs, 0.0001); // 0.01% false positive for documents
    }

    addDocument(hash: string): void {
        this.add(hash);
    }

    mightHaveDocument(hash: string): boolean {
        return this.mightContain(hash);
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let entityFilter: EntityBloomFilter | null = null;
let documentFilter: DocumentBloomFilter | null = null;

export function getEntityFilter(): EntityBloomFilter {
    if (!entityFilter) {
        entityFilter = new EntityBloomFilter();
    }
    return entityFilter;
}

export function getDocumentFilter(): DocumentBloomFilter {
    if (!documentFilter) {
        documentFilter = new DocumentBloomFilter();
    }
    return documentFilter;
}

export default BloomFilter;
