/**
 * Data Quality Scanner API
 * 
 * Escaneia entidades em busca de erros de cadastro:
 * 1. CPF duplicado (CRÍTICO)
 * 2. CPF inválido (dígito verificador)
 * 3. Filiação duplicada (mesma mãe/pai + CPF diferente)
 * 4. Telefone duplicado
 * 5. Nome muito curto (< 2 palavras)
 * 6. Endereço incompleto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, successResponse, errorResponse } from '@/lib/api-utils';
import { withSecurity, AuthContext } from '@/lib/api-security';
import { isValidCPF } from '@/lib/masks';

interface QualityIssue {
    type: 'cpf_duplicate' | 'cpf_invalid' | 'filiation_duplicate' | 'phone_duplicate' | 'short_name' | 'incomplete_address';
    severity: 'critical' | 'high' | 'medium' | 'low';
    entityId: string;
    entityName: string;
    entityType: string;
    investigationId: string;
    investigationTitle?: string;
    description: string;
    suggestion?: string;
    relatedEntityId?: string;
    relatedEntityName?: string;
}

function normalize(str: string | null | undefined): string {
    if (!str) return '';
    return str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
}

async function handlePost(req: NextRequest, auth: AuthContext): Promise<NextResponse> {
    try {
        const supabase = getSupabaseAdmin();
        const issues: QualityIssue[] = [];

        // Buscar todas as entidades PERSON
        const { data: persons, error } = await supabase
            .from('intelink_entities')
            .select(`
                id, name, type, metadata,
                investigation_id,
                investigation:intelink_investigations(id, title)
            `)
            .eq('type', 'PERSON')
            .limit(1000);

        if (error) throw error;

        const entities = persons || [];
        
        // Mapas para detecção de duplicatas
        const cpfMap = new Map<string, typeof entities[0][]>();
        const phoneMap = new Map<string, typeof entities[0][]>();
        const filiationMap = new Map<string, typeof entities[0][]>();

        for (const entity of entities) {
            const meta = entity.metadata || {};
            const inv = entity.investigation as any;
            
            // 1. Indexar por CPF
            if (meta.cpf) {
                const cpfNorm = normalize(meta.cpf);
                if (!cpfMap.has(cpfNorm)) cpfMap.set(cpfNorm, []);
                cpfMap.get(cpfNorm)!.push(entity);
            }

            // 2. Verificar CPF inválido
            if (meta.cpf && !isValidCPF(meta.cpf)) {
                issues.push({
                    type: 'cpf_invalid',
                    severity: 'high',
                    entityId: entity.id,
                    entityName: entity.name,
                    entityType: entity.type,
                    investigationId: entity.investigation_id,
                    investigationTitle: inv?.title,
                    description: `CPF inválido: ${meta.cpf} (dígito verificador incorreto)`,
                    suggestion: 'Verifique se o CPF foi digitado corretamente'
                });
            }

            // 3. Indexar por telefone
            if (meta.telefone) {
                const phoneNorm = normalize(meta.telefone);
                if (phoneNorm.length >= 10) {
                    if (!phoneMap.has(phoneNorm)) phoneMap.set(phoneNorm, []);
                    phoneMap.get(phoneNorm)!.push(entity);
                }
            }

            // 4. Indexar por filiação (mãe)
            if (meta.mae) {
                const maeNorm = normalize(meta.mae);
                if (maeNorm.length > 5) {
                    if (!filiationMap.has(maeNorm)) filiationMap.set(maeNorm, []);
                    filiationMap.get(maeNorm)!.push(entity);
                }
            }

            // 5. Nome muito curto
            const nameParts = entity.name.trim().split(/\s+/);
            if (nameParts.length < 2 || entity.name.length < 5) {
                issues.push({
                    type: 'short_name',
                    severity: 'medium',
                    entityId: entity.id,
                    entityName: entity.name,
                    entityType: entity.type,
                    investigationId: entity.investigation_id,
                    investigationTitle: inv?.title,
                    description: `Nome incompleto: "${entity.name}" (menos de 2 palavras)`,
                    suggestion: 'Adicione o nome completo da pessoa'
                });
            }

            // 6. Endereço incompleto
            if (meta.endereco && !meta.cidade) {
                issues.push({
                    type: 'incomplete_address',
                    severity: 'low',
                    entityId: entity.id,
                    entityName: entity.name,
                    entityType: entity.type,
                    investigationId: entity.investigation_id,
                    investigationTitle: inv?.title,
                    description: `Endereço sem cidade: ${meta.endereco}`,
                    suggestion: 'Adicione a cidade ao endereço'
                });
            }
        }

        // Detectar CPFs duplicados (CRÍTICO)
        for (const [cpf, ents] of cpfMap) {
            if (ents.length > 1) {
                // Verificar se os nomes são diferentes
                const names = ents.map(e => normalize(e.name));
                const uniqueNames = new Set(names);
                
                for (let i = 0; i < ents.length; i++) {
                    for (let j = i + 1; j < ents.length; j++) {
                        const inv1 = ents[i].investigation as any;
                        const inv2 = ents[j].investigation as any;
                        
                        issues.push({
                            type: 'cpf_duplicate',
                            severity: 'critical',
                            entityId: ents[i].id,
                            entityName: ents[i].name,
                            entityType: 'PERSON',
                            investigationId: ents[i].investigation_id,
                            investigationTitle: inv1?.title,
                            description: `CPF duplicado: ${ents[i].metadata?.cpf || cpf}`,
                            suggestion: uniqueNames.size > 1 
                                ? 'ERRO: CPF idêntico com nomes diferentes. Corrija um dos cadastros.'
                                : 'Possível duplicata. Considere mesclar as entidades.',
                            relatedEntityId: ents[j].id,
                            relatedEntityName: ents[j].name
                        });
                    }
                }
            }
        }

        // Detectar telefones duplicados
        for (const [phone, ents] of phoneMap) {
            if (ents.length > 1) {
                for (let i = 0; i < ents.length; i++) {
                    for (let j = i + 1; j < ents.length; j++) {
                        const inv1 = ents[i].investigation as any;
                        issues.push({
                            type: 'phone_duplicate',
                            severity: 'medium',
                            entityId: ents[i].id,
                            entityName: ents[i].name,
                            entityType: 'PERSON',
                            investigationId: ents[i].investigation_id,
                            investigationTitle: inv1?.title,
                            description: `Telefone duplicado: ${ents[i].metadata?.telefone}`,
                            suggestion: 'Pode indicar mesma pessoa ou erro de cadastro',
                            relatedEntityId: ents[j].id,
                            relatedEntityName: ents[j].name
                        });
                    }
                }
            }
        }

        // Detectar mesma filiação com CPF diferente
        for (const [mae, ents] of filiationMap) {
            if (ents.length > 1) {
                // Verificar se têm CPFs diferentes
                const withCpf = ents.filter(e => e.metadata?.cpf);
                if (withCpf.length > 1) {
                    const cpfs = new Set(withCpf.map(e => normalize(e.metadata?.cpf)));
                    if (cpfs.size > 1) {
                        const inv1 = withCpf[0].investigation as any;
                        issues.push({
                            type: 'filiation_duplicate',
                            severity: 'high',
                            entityId: withCpf[0].id,
                            entityName: withCpf[0].name,
                            entityType: 'PERSON',
                            investigationId: withCpf[0].investigation_id,
                            investigationTitle: inv1?.title,
                            description: `Mesma mãe mas CPFs diferentes`,
                            suggestion: 'Verifique se são pessoas diferentes ou erro de cadastro',
                            relatedEntityId: withCpf[1].id,
                            relatedEntityName: withCpf[1].name
                        });
                    }
                }
            }
        }

        // Ordenar por severidade
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return successResponse({
            issues,
            summary: {
                total: issues.length,
                critical: issues.filter(i => i.severity === 'critical').length,
                high: issues.filter(i => i.severity === 'high').length,
                medium: issues.filter(i => i.severity === 'medium').length,
                low: issues.filter(i => i.severity === 'low').length,
                scannedEntities: entities.length
            }
        });

    } catch (e: any) {
        console.error('[Jobs Scan API] Error:', e);
        return errorResponse(e.message || 'Erro ao escanear dados');
    }
}

// Protected: Only unit_admin+ can run scans
export const POST = withSecurity(handlePost, { requiredRole: 'unit_admin' });
