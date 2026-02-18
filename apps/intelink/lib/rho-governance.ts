/**
 * Rho Governance Layer
 * 
 * Intercepts write operations to relationships and enforces
 * centralization limits based on the Rho Protocol.
 * 
 * @version 1.0.0
 * @updated 2025-12-09
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface RhoPolicy {
    maxRhoScore: number;           // Max allowed Rho (default: 0.1)
    maxEntityConnections: number;  // Max connections per entity (default: 20)
    warnThreshold: number;         // Warning threshold (default: 0.05)
    blockOnCritical: boolean;      // Block writes on critical Rho (default: false)
}

export interface RhoDecision {
    authorized: boolean;
    reason: string;
    currentRho: number;
    projectedRho: number;
    warnings: string[];
    policy: RhoPolicy;
}

export interface WriteIntent {
    investigationId: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: string;
    actorId: string;
    actorName?: string;
}

// ============================================================================
// DEFAULT POLICY
// ============================================================================

const DEFAULT_POLICY: RhoPolicy = {
    maxRhoScore: 0.10,        // 10% max centralization
    maxEntityConnections: 20, // No single entity should have > 20 connections
    warnThreshold: 0.05,      // Warn at 5%
    blockOnCritical: false    // Don't block by default, just warn
};

// ============================================================================
// RHO GOVERNANCE CLASS
// ============================================================================

export class RhoGovernance {
    private supabase: ReturnType<typeof createClient>;
    private policy: RhoPolicy;

    constructor(
        supabaseUrl: string,
        supabaseKey: string,
        policy: Partial<RhoPolicy> = {}
    ) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.policy = { ...DEFAULT_POLICY, ...policy };
    }

    /**
     * Evaluate if a relationship write should be authorized
     */
    async evaluateWrite(intent: WriteIntent): Promise<RhoDecision> {
        const warnings: string[] = [];
        
        // 1. Get current Rho score
        const { data: currentSnapshot } = await this.supabase
            .from('intelink_rho_snapshots')
            .select('rho_score, rho_status, total_entities, total_relationships')
            .eq('investigation_id', intent.investigationId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single() as { data: { rho_score: number; rho_status: string; total_entities: number; total_relationships: number } | null };

        const currentRho = currentSnapshot?.rho_score || 0;
        const currentStatus = currentSnapshot?.rho_status || 'healthy';
        const totalRelationships = currentSnapshot?.total_relationships || 0;

        // 2. Count existing connections for source and target
        const [sourceCount, targetCount] = await Promise.all([
            this.getEntityConnectionCount(intent.investigationId, intent.sourceEntityId),
            this.getEntityConnectionCount(intent.investigationId, intent.targetEntityId)
        ]);

        // 3. Project new Rho (simplified estimation)
        // Adding a connection to a high-degree node increases centralization
        const maxConnections = Math.max(sourceCount, targetCount) + 1;
        const n = currentSnapshot?.total_entities || 10;
        const projectedRho = this.estimateRho(maxConnections, n, totalRelationships + 1);

        // 4. Apply policy checks
        let authorized = true;
        let reason = 'Authorized: Write complies with Rho policy';

        // Check max connections per entity
        if (sourceCount >= this.policy.maxEntityConnections) {
            warnings.push(`Source entity has ${sourceCount} connections (limit: ${this.policy.maxEntityConnections})`);
            if (this.policy.blockOnCritical) {
                authorized = false;
                reason = `Denied: Source entity exceeds max connections (${sourceCount}/${this.policy.maxEntityConnections})`;
            }
        }

        if (targetCount >= this.policy.maxEntityConnections) {
            warnings.push(`Target entity has ${targetCount} connections (limit: ${this.policy.maxEntityConnections})`);
            if (this.policy.blockOnCritical) {
                authorized = false;
                reason = `Denied: Target entity exceeds max connections (${targetCount}/${this.policy.maxEntityConnections})`;
            }
        }

        // Check Rho threshold
        if (projectedRho >= this.policy.maxRhoScore) {
            warnings.push(`Projected Rho (${(projectedRho * 100).toFixed(2)}%) exceeds max (${(this.policy.maxRhoScore * 100).toFixed(0)}%)`);
            if (this.policy.blockOnCritical) {
                authorized = false;
                reason = `Denied: Rho would exceed maximum allowed (${(projectedRho * 100).toFixed(2)}% > ${(this.policy.maxRhoScore * 100).toFixed(0)}%)`;
            }
        }

        // Check warning threshold
        if (projectedRho >= this.policy.warnThreshold && projectedRho < this.policy.maxRhoScore) {
            warnings.push(`Rho approaching critical level (${(projectedRho * 100).toFixed(2)}%)`);
        }

        // Check current status
        if (currentStatus === 'critical' || currentStatus === 'extreme') {
            warnings.push(`Investigation already in ${currentStatus.toUpperCase()} status`);
        }

        // 5. Log the decision
        await this.logDecision(intent, {
            authorized,
            reason,
            currentRho: Number(currentRho),
            projectedRho,
            warnings,
            policy: this.policy
        });

        return {
            authorized,
            reason,
            currentRho: Number(currentRho),
            projectedRho,
            warnings,
            policy: this.policy
        };
    }

    /**
     * Get connection count for an entity
     */
    private async getEntityConnectionCount(investigationId: string, entityId: string): Promise<number> {
        const { count } = await this.supabase
            .from('intelink_relationships')
            .select('*', { count: 'exact', head: true })
            .eq('investigation_id', investigationId)
            .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);

        return count || 0;
    }

    /**
     * Estimate Rho score (simplified Herfindahl-like calculation)
     */
    private estimateRho(maxDegree: number, totalNodes: number, totalEdges: number): number {
        if (totalNodes <= 1 || totalEdges <= 0) return 0;
        
        // Simplified: (maxDegree / totalEdges)^2
        // This approximates how concentrated the network is
        const share = maxDegree / (totalEdges * 2); // *2 because edges counted twice
        return Math.min(share * share * totalNodes, 1);
    }

    /**
     * Log decision to audit trail
     */
    private async logDecision(intent: WriteIntent, decision: RhoDecision): Promise<void> {
        try {
            // Use any type to bypass Supabase type generation issues
            await (this.supabase.from('intelink_audit_logs') as any).insert({
                action: 'rho_governance_decision',
                actor_id: intent.actorId,
                actor_name: intent.actorName || 'Unknown',
                target_type: 'relationship',
                target_id: `${intent.sourceEntityId}->${intent.targetEntityId}`,
                details: {
                    investigation_id: intent.investigationId,
                    relationship_type: intent.relationshipType,
                    decision: decision.authorized ? 'authorized' : 'denied',
                    reason: decision.reason,
                    current_rho: decision.currentRho,
                    projected_rho: decision.projectedRho,
                    warnings: decision.warnings,
                    policy: decision.policy
                }
            });
        } catch (error) {
            console.error('[RhoGovernance] Failed to log decision:', error);
        }
    }

    /**
     * Get policy summary
     */
    getPolicySummary(): string {
        return `Rho Policy: Max ${(this.policy.maxRhoScore * 100).toFixed(0)}%, ` +
               `Max ${this.policy.maxEntityConnections} connections/entity, ` +
               `Warn at ${(this.policy.warnThreshold * 100).toFixed(0)}%, ` +
               `Block: ${this.policy.blockOnCritical ? 'ON' : 'OFF'}`;
    }
}

// ============================================================================
// SINGLETON HELPER
// ============================================================================

let governanceInstance: RhoGovernance | null = null;

export function getRhoGovernance(
    policy?: Partial<RhoPolicy>
): RhoGovernance {
    if (!governanceInstance) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        governanceInstance = new RhoGovernance(url, key, policy);
    }
    return governanceInstance;
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Middleware to check Rho before creating relationships
 * Use in API routes: await checkRhoBeforeWrite(intent)
 */
export async function checkRhoBeforeWrite(intent: WriteIntent): Promise<RhoDecision> {
    const governance = getRhoGovernance();
    return governance.evaluateWrite(intent);
}
