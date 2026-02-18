/**
 * 🚀 Cache Module
 * 
 * Sistema de cache em múltiplas camadas (SOTA):
 * - L1: In-Memory (entity-cache.ts)
 * - L2: IndexedDB (indexed-db-cache.ts)
 * - L3: PostgreSQL (backend)
 * 
 * Estruturas auxiliares:
 * - Bloom Filter: Verificação rápida de existência
 * - Embedding Cache: Vetores para similaridade
 * - Incremental Index: Busca em tempo real
 */

// L1: In-Memory Cache
export * from './entity-cache';

// L2: IndexedDB Cache
export * from './indexed-db-cache';

// Bloom Filter
export * from './bloom-filter';

// Embedding Cache
export * from './embedding-cache';

// Incremental Index
export * from './incremental-index';
