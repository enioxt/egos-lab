/**
 * Script para verificar as entidades com mais conexões no banco
 * Uso: npx tsx scripts/audit/check-top-connections.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env from apps/intelink
dotenv.config({ path: './apps/intelink/.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('🔍 Buscando entidades com mais conexões...\n');

    // 1. Buscar todas as entidades
    const { data: entities, error: entitiesError } = await supabase
        .from('intelink_entities')
        .select('id, name, type, investigation_id');

    if (entitiesError) {
        console.error('Erro ao buscar entidades:', entitiesError);
        return;
    }

    // 2. Buscar todos os relacionamentos
    const { data: relationships, error: relError } = await supabase
        .from('intelink_relationships')
        .select('id, source_id, target_id, type');

    if (relError) {
        console.error('Erro ao buscar relacionamentos:', relError);
        return;
    }

    // 3. Buscar investigações
    const { data: investigations } = await supabase
        .from('intelink_investigations')
        .select('id, title');

    const invMap = new Map(investigations?.map(i => [i.id, i.title]) || []);

    // 4. Contar conexões por entidade
    const connectionCount = new Map<string, number>();
    
    relationships?.forEach(rel => {
        connectionCount.set(rel.source_id, (connectionCount.get(rel.source_id) || 0) + 1);
        connectionCount.set(rel.target_id, (connectionCount.get(rel.target_id) || 0) + 1);
    });

    // 5. Criar ranking
    const ranking = entities?.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        investigation: invMap.get(e.investigation_id) || 'N/A',
        connections: connectionCount.get(e.id) || 0
    }))
    .filter(e => e.connections > 0)
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 15);

    // 6. Exibir resultados
    console.log('📊 TOP 15 ENTIDADES COM MAIS CONEXÕES:\n');
    console.log('=' .repeat(100));
    console.log(`${'#'.padEnd(3)} | ${'Nome'.padEnd(30)} | ${'Tipo'.padEnd(12)} | ${'Conexões'.padEnd(10)} | Operação`);
    console.log('=' .repeat(100));

    ranking?.forEach((e, i) => {
        console.log(
            `${(i + 1).toString().padEnd(3)} | ${e.name.substring(0, 28).padEnd(30)} | ${e.type.padEnd(12)} | ${e.connections.toString().padEnd(10)} | ${e.investigation}`
        );
    });

    console.log('=' .repeat(100));

    // 7. Estatísticas gerais
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log(`   Total de entidades: ${entities?.length || 0}`);
    console.log(`   Total de relacionamentos: ${relationships?.length || 0}`);
    console.log(`   Entidades com conexões: ${connectionCount.size}`);
    console.log(`   Entidades isoladas: ${(entities?.length || 0) - connectionCount.size}`);

    // 8. Gerar URLs para teste
    console.log('\n🧪 URLS PARA TESTE MANUAL:\n');
    ranking?.slice(0, 5).forEach((e, i) => {
        console.log(`${i + 1}. ${e.name} (${e.connections} conexões)`);
        console.log(`   → Buscar por: "${e.name}" na GlobalSearch`);
        console.log(`   → Verificar modal mostra ${e.connections} conexões`);
        console.log('');
    });

    // 9. Gerar JSON para referência
    const output = {
        timestamp: new Date().toISOString(),
        top15: ranking,
        stats: {
            totalEntities: entities?.length || 0,
            totalRelationships: relationships?.length || 0,
            entitiesWithConnections: connectionCount.size
        }
    };

    console.log('\n📄 JSON para referência:');
    console.log(JSON.stringify(output, null, 2));
}

main().catch(console.error);
