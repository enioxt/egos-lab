/**
 * Script para gerar cenários de Cross-Case Analysis
 * 
 * Cria entidades que aparecem em MÚLTIPLAS operações com diferentes papéis
 * para demonstrar a capacidade de análise cruzada do Intelink
 * 
 * INSTRUÇÕES:
 *   cd apps/intelink
 *   npx ts-node scripts/generate-cross-case-scenarios.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// CENÁRIOS DE CROSS-CASE ANALYSIS
// ============================================

interface CrossCaseScenario {
    name: string;
    description: string;
    person: {
        name: string;
        cpf: string;
        rg: string;
        data_nascimento: string;
        mae: string;
        pai: string;
        telefone: string;
        endereco: string;
        bairro: string;
        cidade: string;
    };
    appearances: Array<{
        investigation_title: string;
        role: string; // SUSPEITO, VITIMA, TESTEMUNHA, INVESTIGADO
        relation_type: string; // Criminal, Familiar, Endereço, Veículo, Financeiro
        details: string;
    }>;
}

const CROSS_CASE_SCENARIOS: CrossCaseScenario[] = [
    {
        name: "MARIA SILVA SANTOS",
        description: "Aparece como testemunha em 3 casos, vítima em 1, e é irmã de suspeito em outro",
        person: {
            name: "Maria Silva Santos",
            cpf: "123.456.789-00",
            rg: "MG-12.345.678-9",
            data_nascimento: "1985-03-15",
            mae: "Ana Maria Silva",
            pai: "José Santos",
            telefone: "(31) 99876-5432",
            endereco: "Rua das Palmeiras, 456",
            bairro: "Centro",
            cidade: "Belo Horizonte"
        },
        appearances: [
            { investigation_title: "Operação Serpente", role: "TESTEMUNHA", relation_type: "Criminal", details: "Testemunhou assalto em via pública" },
            { investigation_title: "Operação Hidra", role: "TESTEMUNHA", relation_type: "Criminal", details: "Viu fuga de suspeitos" },
            { investigation_title: "Operação Fênix", role: "VITIMA", relation_type: "Criminal", details: "Vítima de estelionato" },
            { investigation_title: "Operação Centauro", role: "FAMILIAR", relation_type: "Familiar", details: "Irmã do investigado principal (Carlos Santos)" },
            { investigation_title: "Operação Eclipse", role: "TESTEMUNHA", relation_type: "Endereço", details: "Mora no mesmo prédio do suspeito" }
        ]
    },
    {
        name: "CARLOS EDUARDO FERREIRA",
        description: "Suspeito em 4 operações diferentes - possível membro de organização",
        person: {
            name: "Carlos Eduardo Ferreira",
            cpf: "987.654.321-00",
            rg: "MG-98.765.432-1",
            data_nascimento: "1980-07-22",
            mae: "Rosa Ferreira",
            pai: "Eduardo Ferreira",
            telefone: "(31) 98765-4321",
            endereco: "Avenida Brasil, 1500",
            bairro: "Bairro Industrial",
            cidade: "Contagem"
        },
        appearances: [
            { investigation_title: "Operação Tempestade", role: "SUSPEITO", relation_type: "Criminal", details: "Suspeito de tráfico de drogas" },
            { investigation_title: "Operação Trovão", role: "SUSPEITO", relation_type: "Criminal", details: "Suspeito de receptação" },
            { investigation_title: "Operação Relâmpago", role: "INVESTIGADO", relation_type: "Criminal", details: "Investigado por lavagem de dinheiro" },
            { investigation_title: "Operação Ciclone", role: "SUSPEITO", relation_type: "Financeiro", details: "Transferências suspeitas para empresa de fachada" }
        ]
    },
    {
        name: "EMPRESA COMÉRCIO RÁPIDO LTDA",
        description: "Empresa que aparece em múltiplas operações - possível fachada",
        person: {
            name: "Comércio Rápido LTDA",
            cpf: "12.345.678/0001-90", // CNPJ
            rg: "",
            data_nascimento: "2015-01-10",
            mae: "",
            pai: "",
            telefone: "(31) 3333-4444",
            endereco: "Rua do Comércio, 100",
            bairro: "Centro",
            cidade: "Belo Horizonte"
        },
        appearances: [
            { investigation_title: "Operação Ciclone", role: "FACHADA", relation_type: "Financeiro", details: "Empresa usada para lavagem de dinheiro" },
            { investigation_title: "Operação Meteoro", role: "FACHADA", relation_type: "Financeiro", details: "Recebeu depósitos suspeitos" },
            { investigation_title: "Operação Cometa", role: "INVESTIGADO", relation_type: "Financeiro", details: "Notas fiscais fraudulentas" }
        ]
    },
    {
        name: "VEÍCULO PLACA ABC1D23",
        description: "Veículo usado em múltiplos crimes - roubado",
        person: {
            name: "Honda Civic Preto ABC1D23",
            cpf: "",
            rg: "",
            data_nascimento: "",
            mae: "",
            pai: "",
            telefone: "",
            endereco: "",
            bairro: "",
            cidade: ""
        },
        appearances: [
            { investigation_title: "Operação Serpente", role: "EVIDÊNCIA", relation_type: "Veículo", details: "Veículo usado na fuga após assalto" },
            { investigation_title: "Operação Aurora", role: "EVIDÊNCIA", relation_type: "Veículo", details: "Mesmo veículo visto em outro assalto" },
            { investigation_title: "Operação Dragão", role: "EVIDÊNCIA", relation_type: "Veículo", details: "Veículo roubado, RENAVAM clonado" }
        ]
    },
    {
        name: "ENDEREÇO RUA DAS FLORES 123",
        description: "Endereço que aparece em múltiplas operações",
        person: {
            name: "Rua das Flores, 123 - Centro - BH",
            cpf: "",
            rg: "",
            data_nascimento: "",
            mae: "",
            pai: "",
            telefone: "",
            endereco: "Rua das Flores, 123",
            bairro: "Centro",
            cidade: "Belo Horizonte"
        },
        appearances: [
            { investigation_title: "Operação Lobo", role: "LOCAL_DO_CRIME", relation_type: "Endereço", details: "Local onde ocorreu homicídio" },
            { investigation_title: "Operação Pantera", role: "RESIDÊNCIA", relation_type: "Endereço", details: "Residência do suspeito" },
            { investigation_title: "Operação Tigre", role: "PONTO_DE_VENDA", relation_type: "Endereço", details: "Ponto de venda de drogas" }
        ]
    },
    {
        name: "TELEFONE 31987654321",
        description: "Telefone que aparece em múltiplas operações",
        person: {
            name: "Telefone (31) 98765-4321",
            cpf: "",
            rg: "",
            data_nascimento: "",
            mae: "",
            pai: "",
            telefone: "(31) 98765-4321",
            endereco: "",
            bairro: "",
            cidade: ""
        },
        appearances: [
            { investigation_title: "Operação Tempestade", role: "COMUNICAÇÃO", relation_type: "Telefônico", details: "Telefone usado para coordenar tráfico" },
            { investigation_title: "Operação Trovão", role: "COMUNICAÇÃO", relation_type: "Telefônico", details: "Mesmo número em interceptação" },
            { investigation_title: "Operação Furacão", role: "COMUNICAÇÃO", relation_type: "Telefônico", details: "Contato frequente com líder da quadrilha" }
        ]
    },
    {
        name: "ADRIANA CARVALHO SOUZA",
        description: "Vítima recorrente - possível informante ou pessoa em situação de vulnerabilidade",
        person: {
            name: "Adriana Carvalho Souza",
            cpf: "456.789.123-00",
            rg: "MG-45.678.912-3",
            data_nascimento: "1990-11-25",
            mae: "Joana Carvalho",
            pai: "Pedro Souza",
            telefone: "(31) 99999-1111",
            endereco: "Rua das Acácias, 789",
            bairro: "Jardim América",
            cidade: "Belo Horizonte"
        },
        appearances: [
            { investigation_title: "Operação Lobo", role: "VITIMA", relation_type: "Criminal", details: "Vítima de violência doméstica" },
            { investigation_title: "Operação Raposa", role: "TESTEMUNHA", relation_type: "Criminal", details: "Testemunha de ameaça" },
            { investigation_title: "Operação Falcão", role: "VITIMA", relation_type: "Criminal", details: "Vítima de extorsão" },
            { investigation_title: "Operação Gavião", role: "INFORMANTE", relation_type: "Criminal", details: "Forneceu informações sobre quadrilha" }
        ]
    },
    {
        name: "RAFAEL SANTOS OLIVEIRA",
        description: "Conexão familiar com múltiplos investigados",
        person: {
            name: "Rafael Santos Oliveira",
            cpf: "789.123.456-00",
            rg: "MG-78.912.345-6",
            data_nascimento: "1975-05-10",
            mae: "Maria Oliveira",
            pai: "Antonio Santos",
            telefone: "(31) 98888-2222",
            endereco: "Avenida Principal, 500",
            bairro: "Centro",
            cidade: "Betim"
        },
        appearances: [
            { investigation_title: "Operação Hidra", role: "PAI", relation_type: "Familiar", details: "Pai do suspeito principal" },
            { investigation_title: "Operação Medusa", role: "TIO", relation_type: "Familiar", details: "Tio de outro investigado" },
            { investigation_title: "Operação Cérbero", role: "TESTEMUNHA", relation_type: "Criminal", details: "Testemunha de defesa" },
            { investigation_title: "Operação Grifo", role: "FINANCIADOR", relation_type: "Financeiro", details: "Pagou fiança de suspeito" }
        ]
    }
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getEntityType(scenario: CrossCaseScenario): string {
    const name = scenario.person.name.toLowerCase();
    if (name.includes('ltda') || name.includes('eireli') || name.includes('s/a')) return 'COMPANY';
    if (name.includes('placa') || name.includes('civic') || name.includes('gol') || name.includes('polo')) return 'VEHICLE';
    if (name.includes('rua') || name.includes('avenida') || name.includes('endereço')) return 'LOCATION';
    if (name.includes('telefone') || name.includes('(31)')) return 'PHONE';
    return 'PERSON';
}

// ============================================
// MAIN
// ============================================

async function generateCrossCaseScenarios() {
    console.log('🚀 Gerando cenários de Cross-Case Analysis...\n');

    // Get existing investigations
    const { data: investigations, error: invError } = await supabase
        .from('intelink_investigations')
        .select('id, title')
        .limit(100);

    if (invError || !investigations) {
        console.error('❌ Erro ao buscar operações:', invError?.message);
        return;
    }

    console.log(`📁 ${investigations.length} operações encontradas\n`);

    // Create a map of investigation titles to IDs
    const invMap = new Map(investigations.map(inv => [inv.title, inv.id]));

    let created = 0;
    let linked = 0;

    for (const scenario of CROSS_CASE_SCENARIOS) {
        console.log(`\n👤 Processando: ${scenario.name}`);
        console.log(`   ${scenario.description}`);

        const entityType = getEntityType(scenario);
        
        // For each appearance, create or link the entity
        for (const appearance of scenario.appearances) {
            // Find matching investigation
            let investigationId: string | undefined;
            
            // Try exact match first
            investigationId = invMap.get(appearance.investigation_title);
            
            // If not found, try partial match
            if (!investigationId) {
                for (const [title, id] of invMap) {
                    if (title.toLowerCase().includes(appearance.investigation_title.toLowerCase().replace('operação ', ''))) {
                        investigationId = id;
                        break;
                    }
                }
            }

            // If still not found, create a new investigation
            if (!investigationId) {
                const { data: newInv, error: newInvError } = await supabase
                    .from('intelink_investigations')
                    .insert({
                        title: appearance.investigation_title,
                        description: `Operação ${appearance.investigation_title}`,
                        status: 'active',
                        unit_id: investigations[0]?.id ? (await supabase.from('intelink_investigations').select('unit_id').eq('id', investigations[0].id).single()).data?.unit_id : null
                    })
                    .select('id')
                    .single();

                if (newInvError) {
                    console.log(`   ⚠️ Não foi possível criar operação: ${appearance.investigation_title}`);
                    continue;
                }
                investigationId = newInv.id;
                invMap.set(appearance.investigation_title, investigationId);
                console.log(`   📁 Criada operação: ${appearance.investigation_title}`);
            }

            // Create entity in this investigation
            const metadata: Record<string, any> = {
                role: appearance.role,
                relation_type: appearance.relation_type,
                details: appearance.details,
                cross_case: true
            };

            // Add person-specific metadata
            if (entityType === 'PERSON') {
                if (scenario.person.cpf) metadata.cpf = scenario.person.cpf;
                if (scenario.person.rg) metadata.rg = scenario.person.rg;
                if (scenario.person.data_nascimento) metadata.data_nascimento = scenario.person.data_nascimento;
                if (scenario.person.mae) metadata.mae = scenario.person.mae;
                if (scenario.person.pai) metadata.pai = scenario.person.pai;
                if (scenario.person.telefone) metadata.telefone = scenario.person.telefone;
                if (scenario.person.endereco) metadata.endereco = scenario.person.endereco;
                if (scenario.person.bairro) metadata.bairro = scenario.person.bairro;
                if (scenario.person.cidade) metadata.cidade = scenario.person.cidade;
            } else if (entityType === 'COMPANY') {
                metadata.cnpj = scenario.person.cpf; // CNPJ stored in cpf field
                if (scenario.person.telefone) metadata.telefone = scenario.person.telefone;
                if (scenario.person.endereco) metadata.endereco = scenario.person.endereco;
                if (scenario.person.cidade) metadata.cidade = scenario.person.cidade;
            } else if (entityType === 'VEHICLE') {
                const plateMatch = scenario.person.name.match(/[A-Z]{3}\d[A-Z]\d{2}/);
                if (plateMatch) metadata.placa = plateMatch[0];
                metadata.situacao = 'Investigado';
            } else if (entityType === 'LOCATION') {
                if (scenario.person.endereco) metadata.endereco = scenario.person.endereco;
                if (scenario.person.bairro) metadata.bairro = scenario.person.bairro;
                if (scenario.person.cidade) metadata.cidade = scenario.person.cidade;
            }

            // Insert entity
            const { error: entityError } = await supabase
                .from('intelink_entities')
                .insert({
                    investigation_id: investigationId,
                    type: entityType === 'PHONE' ? 'PERSON' : entityType, // Phone as person for now
                    name: scenario.person.name,
                    metadata
                });

            if (entityError) {
                console.log(`   ⚠️ Erro ao criar entidade: ${entityError.message}`);
                continue;
            }

            created++;
            linked++;
            console.log(`   ✅ ${appearance.role} em ${appearance.investigation_title} (${appearance.relation_type})`);
        }
    }

    console.log('\n═══════════════════════════════════════════');
    console.log('📊 RESUMO DA GERAÇÃO');
    console.log('═══════════════════════════════════════════');
    console.log(`   Cenários processados: ${CROSS_CASE_SCENARIOS.length}`);
    console.log(`   Entidades criadas: ${created}`);
    console.log(`   Vínculos cross-case: ${linked}`);
    
    // Final stats
    const { count: entCount } = await supabase.from('intelink_entities').select('*', { count: 'exact', head: true });
    const { count: invCount } = await supabase.from('intelink_investigations').select('*', { count: 'exact', head: true });
    
    console.log('\n📈 STATUS DO BANCO:');
    console.log(`   Operações: ${invCount}`);
    console.log(`   Entidades: ${entCount}`);
    console.log('\n🎉 Cenários de Cross-Case Analysis prontos para teste!');
}

generateCrossCaseScenarios().catch(console.error);
