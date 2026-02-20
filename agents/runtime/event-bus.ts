/**
 * Mycelium Event Bus — Inter-Agent Communication System
 * 
 * Zero-dependency, TypeScript-native event bus for the EGOS Agentic Platform.
 * Synthesizes patterns from Google A2A, LangGraph, AutoGen, and MCP.
 * 
 * Features:
 * - Typed events with topic namespacing (e.g. "security.finding", "qa.regression")
 * - Wildcard subscriptions ("security.*", "*.critical")
 * - JSONL audit trail for complete event forensics
 * - Sync-first execution; Redis-ready for distributed mode
 * - Conditional routing via topic matching
 * 
 * @module Mycelium
 */

import { randomUUID } from 'crypto';
import { appendFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ─── Types ────────────────────────────────────────────────────

export interface MyceliumEvent<T = unknown> {
    id: string;
    topic: string;
    source: string;
    correlationId: string;
    timestamp: string;
    payload: T;
    metadata?: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (event: MyceliumEvent<T>) => void | Promise<void>;

export interface Subscription {
    id: string;
    pattern: string;
    handler: EventHandler;
    agentId?: string;
    once?: boolean;
}

export interface EventFilter {
    topic?: string;
    source?: string;
    correlationId?: string;
    since?: string;
    limit?: number;
}

// ─── Well-Known Event Payloads ────────────────────────────────

export interface FindingPayload {
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: string;
    message: string;
    file?: string;
    line?: number;
    suggestion?: string;
}

export interface RegressionPayload {
    test: string;
    before: 'pass' | 'fail';
    after: 'pass' | 'fail';
}

export interface DriftPayload {
    file: string;
    rule: string;
    expected: string;
    actual: string;
}

export interface AgentCompletedPayload {
    agentId: string;
    status: 'pass' | 'fail' | 'skip' | 'error';
    durationMs: number;
    findingsCount: number;
}

// ─── Topic Matching ───────────────────────────────────────────

/**
 * Matches a topic against a glob-like pattern.
 * Supports:
 *   "security.*"     → matches "security.finding", "security.jailbreak"
 *   "*.critical"     → matches "security.critical", "qa.critical"
 *   "security.finding" → exact match
 *   "*"              → matches everything
 */
function matchTopic(pattern: string, topic: string): boolean {
    if (pattern === '*') return true;
    if (pattern === topic) return true;

    const patternParts = pattern.split('.');
    const topicParts = topic.split('.');

    if (patternParts.length !== topicParts.length) return false;

    return patternParts.every((pp, i) => pp === '*' || pp === topicParts[i]);
}

// ─── Mycelium Bus ─────────────────────────────────────────────

const EGOS_ROOT = join(import.meta.dir, '..', '..');
const LOG_DIR = join(EGOS_ROOT, 'agents', '.logs');
const EVENT_LOG = join(LOG_DIR, 'events.jsonl');

export class MyceliumBus {
    private subscriptions: Map<string, Subscription> = new Map();
    private history: MyceliumEvent[] = [];
    private maxHistory: number;

    constructor(options?: { maxHistory?: number }) {
        this.maxHistory = options?.maxHistory ?? 1000;
        if (!existsSync(LOG_DIR)) {
            mkdirSync(LOG_DIR, { recursive: true });
        }
    }

    /**
     * Emit a typed event to all matching subscribers.
     */
    emit<T = unknown>(
        topic: string,
        payload: T,
        source: string,
        correlationId: string,
        metadata?: Record<string, unknown>
    ): MyceliumEvent<T> {
        const event: MyceliumEvent<T> = {
            id: randomUUID(),
            topic,
            source,
            correlationId,
            timestamp: new Date().toISOString(),
            payload,
            metadata,
        };

        // Persist to JSONL audit trail
        this.persistEvent(event);

        // Store in memory history
        this.history.push(event as MyceliumEvent);
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(-this.maxHistory);
        }

        // Dispatch to matching subscribers
        const toRemove: string[] = [];
        for (const [id, sub] of this.subscriptions) {
            if (matchTopic(sub.pattern, topic)) {
                try {
                    sub.handler(event as MyceliumEvent);
                } catch (err) {
                    console.error(`[MYCELIUM] Handler error for ${sub.pattern}:`, err);
                }
                if (sub.once) {
                    toRemove.push(id);
                }
            }
        }

        // Cleanup one-shot subscriptions
        for (const id of toRemove) {
            this.subscriptions.delete(id);
        }

        return event;
    }

    /**
     * Subscribe to events matching a glob pattern.
     * Returns a Subscription that can be passed to off().
     */
    on<T = unknown>(pattern: string, handler: EventHandler<T>, agentId?: string): Subscription {
        const sub: Subscription = {
            id: randomUUID(),
            pattern,
            handler: handler as EventHandler,
            agentId,
        };
        this.subscriptions.set(sub.id, sub);
        return sub;
    }

    /**
     * Subscribe to the next single event matching a pattern.
     * Returns a promise that resolves with the event.
     */
    once<T = unknown>(pattern: string): Promise<MyceliumEvent<T>> {
        return new Promise((resolve) => {
            const sub: Subscription = {
                id: randomUUID(),
                pattern,
                handler: (event) => resolve(event as MyceliumEvent<T>),
                once: true,
            };
            this.subscriptions.set(sub.id, sub);
        });
    }

    /**
     * Unsubscribe from events.
     */
    off(sub: Subscription): void {
        this.subscriptions.delete(sub.id);
    }

    /**
     * Get event history with optional filtering.
     */
    getHistory(filter?: EventFilter): MyceliumEvent[] {
        let events = [...this.history];

        if (filter?.topic) {
            events = events.filter(e => matchTopic(filter.topic!, e.topic));
        }
        if (filter?.source) {
            events = events.filter(e => e.source === filter.source);
        }
        if (filter?.correlationId) {
            events = events.filter(e => e.correlationId === filter.correlationId);
        }
        if (filter?.since) {
            events = events.filter(e => e.timestamp >= filter.since!);
        }
        if (filter?.limit) {
            events = events.slice(-filter.limit);
        }

        return events;
    }

    /**
     * Get summary statistics for the current bus session.
     */
    stats(): { total: number; byTopic: Record<string, number>; bySource: Record<string, number>; subscribers: number } {
        const byTopic: Record<string, number> = {};
        const bySource: Record<string, number> = {};

        for (const event of this.history) {
            byTopic[event.topic] = (byTopic[event.topic] || 0) + 1;
            bySource[event.source] = (bySource[event.source] || 0) + 1;
        }

        return {
            total: this.history.length,
            byTopic,
            bySource,
            subscribers: this.subscriptions.size,
        };
    }

    /**
     * Reset the bus (clear history and subscriptions).
     * Use between orchestrator runs.
     */
    reset(): void {
        this.history = [];
        this.subscriptions.clear();
    }

    // ── Private ─────────────────────────────────────────────────

    private persistEvent(event: MyceliumEvent): void {
        try {
            const line = JSON.stringify(event) + '\n';
            appendFileSync(EVENT_LOG, line);
        } catch {
            // Non-blocking: event bus should never crash the agent
        }
    }
}

// ─── Singleton ────────────────────────────────────────────────

let _globalBus: MyceliumBus | null = null;

/**
 * Get or create the global Mycelium bus instance.
 * Used by the orchestrator to share a single bus across all agents.
 */
export function getGlobalBus(): MyceliumBus {
    if (!_globalBus) {
        _globalBus = new MyceliumBus();
    }
    return _globalBus;
}

/**
 * Create a fresh bus instance (for testing or isolated runs).
 */
export function createBus(options?: { maxHistory?: number }): MyceliumBus {
    return new MyceliumBus(options);
}

// ─── Topic Constants ──────────────────────────────────────────

export const Topics = {
    // Security
    SECURITY_FINDING: 'security.finding',
    SECURITY_JAILBREAK: 'security.jailbreak',
    SECURITY_SECRET: 'security.secret',

    // QA
    QA_REGRESSION: 'qa.regression',
    QA_DEAD_CODE: 'qa.dead_code',
    QA_CONTRACT_FAIL: 'qa.contract_fail',

    // Architecture
    ARCH_DRIFT: 'architecture.drift',
    ARCH_DEP_CONFLICT: 'architecture.dep_conflict',
    ARCH_SSOT_VIOLATION: 'architecture.ssot_violation',

    // Knowledge
    KNOWLEDGE_HARVESTED: 'knowledge.harvested',
    KNOWLEDGE_PATTERN: 'knowledge.pattern',

    // Agent Lifecycle
    AGENT_STARTED: 'agent.started',
    AGENT_COMPLETED: 'agent.completed',
    AGENT_FAILED: 'agent.failed',
} as const;

export type TopicKey = keyof typeof Topics;
export type TopicValue = typeof Topics[TopicKey];
