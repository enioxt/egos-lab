/**
 * Mycelium Event Bus — Unit Tests
 * 
 * Tests: emit/subscribe, wildcard matching, once(), history, stats, reset.
 * Run: bun test agents/runtime/__tests__/event-bus.test.ts
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createBus, Topics, type MyceliumEvent, type FindingPayload } from '../event-bus';

describe('MyceliumBus', () => {
    let bus: ReturnType<typeof createBus>;

    beforeEach(() => {
        bus = createBus({ maxHistory: 100 });
    });

    // ── Emit & Subscribe ──────────────────────────────────────

    it('should deliver events to matching subscribers', () => {
        const received: MyceliumEvent[] = [];
        bus.on('security.finding', (e) => received.push(e));

        bus.emit('security.finding', { severity: 'error' }, 'test-agent', 'corr-1');

        expect(received.length).toBe(1);
        expect(received[0].topic).toBe('security.finding');
        expect(received[0].source).toBe('test-agent');
        expect(received[0].correlationId).toBe('corr-1');
    });

    it('should NOT deliver events to non-matching subscribers', () => {
        const received: MyceliumEvent[] = [];
        bus.on('qa.regression', (e) => received.push(e));

        bus.emit('security.finding', { severity: 'error' }, 'test-agent', 'corr-1');

        expect(received.length).toBe(0);
    });

    // ── Wildcard Matching ─────────────────────────────────────

    it('should support wildcard suffix patterns (security.*)', () => {
        const received: MyceliumEvent[] = [];
        bus.on('security.*', (e) => received.push(e));

        bus.emit('security.finding', {}, 'a', 'c');
        bus.emit('security.jailbreak', {}, 'a', 'c');
        bus.emit('qa.regression', {}, 'a', 'c');

        expect(received.length).toBe(2);
        expect(received[0].topic).toBe('security.finding');
        expect(received[1].topic).toBe('security.jailbreak');
    });

    it('should support wildcard prefix patterns (*.critical)', () => {
        const received: MyceliumEvent[] = [];
        bus.on('*.critical', (e) => received.push(e));

        bus.emit('security.critical', {}, 'a', 'c');
        bus.emit('qa.critical', {}, 'a', 'c');
        bus.emit('qa.regression', {}, 'a', 'c');

        expect(received.length).toBe(2);
    });

    it('should support catch-all wildcard (*)', () => {
        const received: MyceliumEvent[] = [];
        bus.on('*', (e) => received.push(e));

        bus.emit('security.finding', {}, 'a', 'c');
        bus.emit('qa.regression', {}, 'a', 'c');
        bus.emit('agent.completed', {}, 'a', 'c');

        expect(received.length).toBe(3);
    });

    // ── Once ──────────────────────────────────────────────────

    it('should resolve once() with the first matching event', async () => {
        const promise = bus.once<FindingPayload>('security.finding');

        // Emit after the subscription is registered (microtask)
        queueMicrotask(() => {
            bus.emit('security.finding', { severity: 'error', category: 'test', message: 'found' }, 'a', 'c');
        });

        const event = await promise;
        expect(event.topic).toBe('security.finding');
        expect(event.payload.severity).toBe('error');
    });

    it('should auto-remove once subscription after first event', () => {
        // Use the bus's once under the hood: subscribe with once pattern
        let count = 0;
        const promise = bus.once('test.topic');
        promise.then(() => count++);

        // After first emit, the handler should be removed
        bus.emit('test.topic', {}, 'a', 'c');
        // Second emit should not increment count
        bus.emit('test.topic', {}, 'a', 'c');

        // The subscriber count should be 0 after once fires
        expect(bus.stats().subscribers).toBe(0);
    });

    // ── Unsubscribe ───────────────────────────────────────────

    it('should stop delivering events after off()', () => {
        const received: MyceliumEvent[] = [];
        const sub = bus.on('test.topic', (e) => received.push(e));

        bus.emit('test.topic', {}, 'a', 'c');
        bus.off(sub);
        bus.emit('test.topic', {}, 'a', 'c');

        expect(received.length).toBe(1);
    });

    // ── History ───────────────────────────────────────────────

    it('should maintain event history', () => {
        bus.emit('a.b', {}, 'a', 'c');
        bus.emit('c.d', {}, 'a', 'c');

        const history = bus.getHistory();
        expect(history.length).toBe(2);
    });

    it('should filter history by topic pattern', () => {
        bus.emit('security.finding', {}, 'a', 'c');
        bus.emit('qa.regression', {}, 'a', 'c');
        bus.emit('security.jailbreak', {}, 'a', 'c');

        const securityEvents = bus.getHistory({ topic: 'security.*' });
        expect(securityEvents.length).toBe(2);
    });

    it('should filter history by source', () => {
        bus.emit('a.b', {}, 'agent-1', 'c');
        bus.emit('a.b', {}, 'agent-2', 'c');
        bus.emit('a.b', {}, 'agent-1', 'c');

        const agent1Events = bus.getHistory({ source: 'agent-1' });
        expect(agent1Events.length).toBe(2);
    });

    it('should respect history limit', () => {
        bus.emit('a.b', {}, 'a', 'c');
        bus.emit('a.b', {}, 'a', 'c');
        bus.emit('a.b', {}, 'a', 'c');

        const limited = bus.getHistory({ limit: 2 });
        expect(limited.length).toBe(2);
    });

    // ── Stats ─────────────────────────────────────────────────

    it('should compute correct stats', () => {
        bus.on('test.*', () => { });
        bus.on('other.*', () => { });

        bus.emit('test.a', {}, 'agent-1', 'c');
        bus.emit('test.b', {}, 'agent-1', 'c');
        bus.emit('other.c', {}, 'agent-2', 'c');

        const stats = bus.stats();
        expect(stats.total).toBe(3);
        expect(stats.byTopic['test.a']).toBe(1);
        expect(stats.byTopic['test.b']).toBe(1);
        expect(stats.bySource['agent-1']).toBe(2);
        expect(stats.bySource['agent-2']).toBe(1);
        expect(stats.subscribers).toBe(2);
    });

    // ── Reset ─────────────────────────────────────────────────

    it('should clear history and subscriptions on reset()', () => {
        bus.on('test.*', () => { });
        bus.emit('test.a', {}, 'a', 'c');

        bus.reset();

        expect(bus.getHistory().length).toBe(0);
        expect(bus.stats().subscribers).toBe(0);
    });

    // ── Topic Constants ───────────────────────────────────────

    it('should export well-known topic constants', () => {
        expect(Topics.SECURITY_FINDING).toBe('security.finding');
        expect(Topics.QA_REGRESSION).toBe('qa.regression');
        expect(Topics.AGENT_COMPLETED).toBe('agent.completed');
        expect(Topics.ARCH_DRIFT).toBe('architecture.drift');
        expect(Topics.KNOWLEDGE_HARVESTED).toBe('knowledge.harvested');
    });

    // ── Max History Cap ───────────────────────────────────────

    it('should cap history at maxHistory', () => {
        const smallBus = createBus({ maxHistory: 3 });

        smallBus.emit('a.a', {}, 'a', 'c');
        smallBus.emit('a.b', {}, 'a', 'c');
        smallBus.emit('a.c', {}, 'a', 'c');
        smallBus.emit('a.d', {}, 'a', 'c');
        smallBus.emit('a.e', {}, 'a', 'c');

        const history = smallBus.getHistory();
        expect(history.length).toBe(3);
        expect(history[0].topic).toBe('a.c'); // oldest 2 evicted
    });

    // ── Error Handling ────────────────────────────────────────

    it('should not crash when a handler throws', () => {
        bus.on('test.error', () => {
            throw new Error('handler crash');
        });

        // Should not throw
        expect(() => {
            bus.emit('test.error', {}, 'a', 'c');
        }).not.toThrow();
    });

    // ── Multiple Subscribers ──────────────────────────────────

    it('should deliver to multiple subscribers for same pattern', () => {
        let count = 0;
        bus.on('multi.test', () => count++);
        bus.on('multi.test', () => count++);
        bus.on('multi.test', () => count++);

        bus.emit('multi.test', {}, 'a', 'c');
        expect(count).toBe(3);
    });
});
