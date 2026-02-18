/**
 * API para Cross-Case Analysis
 * 
 * Retorna entidades que aparecem em MÚLTIPLAS operações
 * com detalhes sobre o papel em cada uma
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse, parseIntSafe } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';

// Labels em português
const TYPE_LABELS: Record<string, string> = {
    PERSON: 'Pessoa',
    VEHICLE: 'Veículo',
    LOCATION: 'Local',
    COMPANY: 'Empresa',
    ORGANIZATION: 'Org. Criminosa',
    FIREARM: 'Arma de Fogo',
    WEAPON: 'Arma',
};

const RELATION_ICONS: Record<string, string> = {
    Criminal: '🔴',
    Familiar: '👥',
    Endereço: '🏠',
    Veículo: '🚗',
    Financeiro: '💰',
    Telefônico: '📞',
    Temporal: '⏰',
};

interface CrossCaseEntity {
    id: string;
    name: string;
    type: string;
    typeLabel: string;
    investigationCount: number;
    appearances: Array<{
        investigationId: string;
        investigationTitle: string;
        role: string;
        relationType: string;
        relationIcon: string;
        details: string;
    }>;
    insight: string;
}

async function handleGet(request: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const minAppearances = parseIntSafe(searchParams.get('min_appearances'), 2);
        const limit = parseIntSafe(searchParams.get('limit'), 20);

        // 1. Find entities that appear in multiple investigations by name
        // Group by normalized name to find cross-case entities
        const { data: entities, error: entitiesError } = await supabase
            .from('intelink_entities')
            .select(`
                id,
                name,
                type,
                metadata,
                investigation_id,
                investigations:investigation_id (
                    id,
                    title
                )
            `)
            .order('name');

        if (entitiesError) {
            console.error('Error fetching entities:', entitiesError);
            return NextResponse.json({ error: entitiesError.message }, { status: 500 });
        }

        // 2. Group entities by normalized name
        const entityMap = new Map<string, CrossCaseEntity>();

        for (const entity of entities || []) {
            // Normalize name for matching
            const normalizedName = entity.name.toLowerCase().trim();
            
            const investigation = entity.investigations as any;
            const metadata = entity.metadata || {};
            const role = metadata.role || 'Não especificado';
            const relationType = metadata.relation_type || 'Criminal';
            const details = metadata.details || '';

            if (!entityMap.has(normalizedName)) {
                entityMap.set(normalizedName, {
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    typeLabel: TYPE_LABELS[entity.type] || entity.type,
                    investigationCount: 0,
                    appearances: [],
                    insight: ''
                });
            }

            const crossEntity = entityMap.get(normalizedName)!;
            
            // Check if this investigation is already added
            const existingAppearance = crossEntity.appearances.find(
                a => a.investigationId === investigation?.id
            );

            if (!existingAppearance && investigation) {
                crossEntity.appearances.push({
                    investigationId: investigation.id,
                    investigationTitle: investigation.title,
                    role: role,
                    relationType: relationType,
                    relationIcon: RELATION_ICONS[relationType] || '🔗',
                    details: details
                });
                crossEntity.investigationCount = crossEntity.appearances.length;
            }
        }

        // 3. Filter entities with minimum appearances and generate insights
        const crossCaseEntities: CrossCaseEntity[] = [];

        for (const [, entity] of entityMap) {
            if (entity.investigationCount >= minAppearances) {
                // Generate insight based on patterns
                entity.insight = generateInsight(entity);
                crossCaseEntities.push(entity);
            }
        }

        // 4. Sort by investigation count (most connected first)
        crossCaseEntities.sort((a, b) => b.investigationCount - a.investigationCount);

        // 5. Calculate stats
        const stats = {
            totalCrossCaseEntities: crossCaseEntities.length,
            maxAppearances: crossCaseEntities[0]?.investigationCount || 0,
            byType: {} as Record<string, number>,
            byRelation: {} as Record<string, number>,
        };

        for (const entity of crossCaseEntities) {
            stats.byType[entity.typeLabel] = (stats.byType[entity.typeLabel] || 0) + 1;
            for (const app of entity.appearances) {
                stats.byRelation[app.relationType] = (stats.byRelation[app.relationType] || 0) + 1;
            }
        }

        return NextResponse.json({
            crossCaseEntities: crossCaseEntities.slice(0, limit),
            stats,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Cross-case analysis error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateInsight(entity: CrossCaseEntity): string {
    const count = entity.investigationCount;
    const roles = [...new Set(entity.appearances.map(a => a.role))];
    const relations = [...new Set(entity.appearances.map(a => a.relationType))];

    // Check for suspicious patterns
    const isSuspectMultiple = entity.appearances.filter(a => 
        ['SUSPEITO', 'INVESTIGADO', 'AUTOR'].includes(a.role.toUpperCase())
    ).length >= 2;

    const isVictimMultiple = entity.appearances.filter(a => 
        ['VITIMA', 'VÍTIMA'].includes(a.role.toUpperCase())
    ).length >= 2;

    const hasFinancialConnection = relations.includes('Financeiro');
    const hasFamilyConnection = relations.includes('Familiar');

    // Generate contextual insight
    if (isSuspectMultiple) {
        return `⚠️ ALERTA: ${entity.typeLabel} aparece como suspeito/investigado em ${count} casos diferentes. Possível membro de organização criminosa.`;
    }
    
    if (isVictimMultiple) {
        return `🔍 ATENÇÃO: ${entity.typeLabel} é vítima recorrente em ${count} casos. Verificar situação de vulnerabilidade ou possível informante.`;
    }

    if (hasFinancialConnection && count >= 3) {
        return `💰 CONEXÃO FINANCEIRA: ${entity.typeLabel} conecta ${count} operações por vínculos financeiros. Verificar lavagem de dinheiro.`;
    }

    if (hasFamilyConnection) {
        return `👥 CONEXÃO FAMILIAR: ${entity.typeLabel} tem vínculos familiares com investigados em ${count} casos diferentes.`;
    }

    if (entity.type === 'VEHICLE') {
        return `🚗 VEÍCULO RECORRENTE: Aparece em ${count} operações. Verificar se é roubado/clonado.`;
    }

    if (entity.type === 'LOCATION') {
        return `📍 LOCAL CRÍTICO: Endereço aparece em ${count} operações. Possível ponto de encontro ou local de atividade criminosa.`;
    }

    if (entity.type === 'COMPANY') {
        return `🏢 EMPRESA SUSPEITA: Aparece em ${count} casos. Verificar se é empresa de fachada.`;
    }

    return `🔗 Esta ${entity.typeLabel.toLowerCase()} conecta ${count} operações diferentes. Analisar padrões.`;
}

// Protected: Only member+ can access cross-case analysis
export const GET = withSecurity(handleGet, { requiredRole: 'member' });
