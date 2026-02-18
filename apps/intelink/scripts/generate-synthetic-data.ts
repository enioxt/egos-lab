/**
 * Script para gerar dados sintéticos para o Intelink
 * 
 * INSTRUÇÕES:
 * 1. Execute:
 *    cd apps/intelink
 *    npx ts-node scripts/generate-synthetic-data.ts
 * 
 * 2. Opções:
 *    --count=30     Número de operações (default: 30)
 *    --cross=10     Entidades cross-reference (default: 10)
 *    --dry-run      Apenas mostra o que seria gerado
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultVal: number) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? parseInt(arg.split('=')[1]) : defaultVal;
};
const dryRun = args.includes('--dry-run');

const INVESTIGATION_COUNT = getArg('count', 30);
const CROSS_REF_COUNT = getArg('cross', 10);

// Environment
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENROUTER_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing environment variables');
    console.error('Required: OPENROUTER_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Investigation templates
const CASE_TEMPLATES = [
    { type: 'HOMICIDIO', prefix: 'Operação', keywords: ['vítima', 'arma de fogo', 'testemunha', 'local do crime'] },
    { type: 'TRAFICO', prefix: 'Operação', keywords: ['traficante', 'drogas', 'ponto de venda', 'fornecedor'] },
    { type: 'ORGANIZACAO_CRIMINOSA', prefix: 'Operação', keywords: ['líder', 'braço direito', 'financeiro', 'segurança'] },
    { type: 'ROUBO', prefix: 'Operação', keywords: ['assaltante', 'veículo', 'receptador', 'vítima'] },
    { type: 'ESTELIONATO', prefix: 'Operação', keywords: ['golpista', 'conta laranja', 'empresa de fachada', 'vítima'] },
    { type: 'CRIMES_CIBERNETICOS', prefix: 'Operação', keywords: ['hacker', 'servidor', 'criptomoeda', 'vítima'] },
];

// Brazilian first names and last names for realistic generation
const FIRST_NAMES = [
    'João', 'José', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas',
    'Maria', 'Ana', 'Francisca', 'Adriana', 'Juliana', 'Márcia', 'Fernanda', 'Patricia',
    'Rafael', 'Marcos', 'Luis', 'Gabriel', 'Bruno', 'Eduardo', 'Felipe', 'Ricardo',
    'Camila', 'Aline', 'Amanda', 'Bruna', 'Carla', 'Daniela', 'Sandra', 'Cláudia'
];

const LAST_NAMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
    'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
    'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade'
];

const CITIES = [
    'Belo Horizonte', 'Contagem', 'Betim', 'Uberlândia', 'Juiz de Fora',
    'Montes Claros', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas'
];

const NEIGHBORHOODS = [
    'Centro', 'Bairro Industrial', 'Jardim América', 'Vila Nova', 'Novo Horizonte',
    'Santa Maria', 'São José', 'Santo Antônio', 'Bom Pastor', 'Cidade Nova'
];

const STREETS = [
    'Rua das Flores', 'Avenida Brasil', 'Rua São Paulo', 'Avenida Getúlio Vargas',
    'Rua Bahia', 'Rua Minas Gerais', 'Avenida Amazonas', 'Rua Rio de Janeiro'
];

// Helper functions
function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateCPF(): string {
    // Generate valid format CPF (not real)
    const random = () => Math.floor(Math.random() * 10);
    const d1 = random(), d2 = random(), d3 = random();
    const d4 = random(), d5 = random(), d6 = random();
    const d7 = random(), d8 = random(), d9 = random();
    return `${d1}${d2}${d3}.${d4}${d5}${d6}.${d7}${d8}${d9}-${random()}${random()}`;
}

function generateRG(): string {
    const random = () => Math.floor(Math.random() * 10);
    return `MG-${random()}${random()}.${random()}${random()}${random()}.${random()}${random()}${random()}`;
}

function generatePhone(): string {
    const ddd = ['31', '32', '33', '34', '35', '37', '38'][Math.floor(Math.random() * 7)];
    const random = () => Math.floor(Math.random() * 10);
    return `(${ddd}) 9${random()}${random()}${random()}${random()}-${random()}${random()}${random()}${random()}`;
}

function generatePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const l = () => letters[Math.floor(Math.random() * 26)];
    const n = () => Math.floor(Math.random() * 10);
    return `${l()}${l()}${l()}${n()}${l()}${n()}${n()}`; // Mercosul format
}

function generateDate(minYearsAgo: number, maxYearsAgo: number): string {
    const now = new Date();
    const minDate = new Date(now.getFullYear() - maxYearsAgo, 0, 1);
    const maxDate = new Date(now.getFullYear() - minYearsAgo, 11, 31);
    const date = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
    return date.toISOString().split('T')[0];
}

function generatePerson(role: string = 'SUSPEITO'): any {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const motherLastName = randomElement(LAST_NAMES);

    return {
        type: 'PERSON',
        name: `${firstName} ${lastName}`,
        role,
        metadata: {
            cpf: generateCPF(),
            rg: generateRG(),
            data_nascimento: generateDate(25, 60),
            mae: `${randomElement(FIRST_NAMES)} ${motherLastName}`,
            pai: `${randomElement(FIRST_NAMES)} ${lastName}`,
            telefone: generatePhone(),
            endereco: `${randomElement(STREETS)}, ${Math.floor(Math.random() * 2000)}`,
            bairro: randomElement(NEIGHBORHOODS),
            cidade: randomElement(CITIES),
            profissao: randomElement(['Autônomo', 'Desempregado', 'Comerciante', 'Motorista', 'Pedreiro', 'Empresário']),
        }
    };
}

function generateVehicle(): any {
    const makes = ['Volkswagen', 'Fiat', 'Chevrolet', 'Ford', 'Honda', 'Toyota', 'Hyundai'];
    const models: Record<string, string[]> = {
        'Volkswagen': ['Gol', 'Voyage', 'Polo', 'Virtus', 'T-Cross'],
        'Fiat': ['Uno', 'Palio', 'Argo', 'Mobi', 'Strada'],
        'Chevrolet': ['Onix', 'Prisma', 'Cruze', 'Tracker', 'S10'],
        'Ford': ['Ka', 'Fiesta', 'EcoSport', 'Ranger'],
        'Honda': ['Civic', 'Fit', 'HR-V', 'City'],
        'Toyota': ['Corolla', 'Hilux', 'Yaris', 'SW4'],
        'Hyundai': ['HB20', 'Creta', 'Tucson'],
    };
    const colors = ['Prata', 'Preto', 'Branco', 'Vermelho', 'Azul', 'Cinza'];

    const make = randomElement(makes);
    const model = randomElement(models[make] || ['Modelo']);

    return {
        type: 'VEHICLE',
        name: `${make} ${model} ${randomElement(colors)}`,
        role: 'EVIDÊNCIA',
        metadata: {
            placa: generatePlate(),
            cor: randomElement(colors),
            ano: 2015 + Math.floor(Math.random() * 10),
            chassi: Array(17).fill(0).map(() => 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'[Math.floor(Math.random() * 33)]).join(''),
        }
    };
}

function generateLocation(): any {
    const city = randomElement(CITIES);
    const neighborhood = randomElement(NEIGHBORHOODS);
    const street = randomElement(STREETS);
    const number = Math.floor(Math.random() * 2000);

    return {
        type: 'LOCATION',
        name: `${street}, ${number} - ${neighborhood}`,
        role: 'LOCAL_DO_CRIME',
        metadata: {
            cidade: city,
            bairro: neighborhood,
            cep: `${30000 + Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            coordenadas: {
                lat: -19.9 + Math.random() * 0.2,
                lng: -44.0 + Math.random() * 0.2,
            }
        }
    };
}

function generateFirearm(): any {
    const types = ['Revólver', 'Pistola', 'Espingarda', 'Fuzil', 'Submetralhadora'];
    const calibers = ['.22', '.32', '.38', '.380', '9mm', '.40', '.45', '12 gauge'];
    const brands = ['Taurus', 'Imbel', 'Glock', 'Beretta', 'Smith & Wesson', 'Não identificada'];

    return {
        type: 'FIREARM',
        name: `${randomElement(types)} ${randomElement(calibers)}`,
        role: 'EVIDÊNCIA',
        metadata: {
            calibre: randomElement(calibers),
            marca: randomElement(brands),
            numero_serie: Math.random() > 0.3 ? `${randomElement(['AB', 'CD', 'EF', 'GH'])}${Math.floor(Math.random() * 1000000)}` : 'Raspado',
            situacao: randomElement(['Apreendida', 'Identificada', 'Procurada']),
        }
    };
}

function generateOrganization(): any {
    const types = ['Loja', 'Bar', 'Oficina', 'Empresa', 'Comércio'];
    const activities = ['Auto Peças', 'Materiais de Construção', 'Vestuário', 'Alimentos', 'Eletrônicos'];

    const type = randomElement(types);
    const activity = randomElement(activities);
    const city = randomElement(CITIES);

    return {
        type: 'ORGANIZATION',
        name: `${type} ${activity} ${city.split(' ')[0]}`,
        role: 'FACHADA',
        metadata: {
            cnpj: `${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}.${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}/0001-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
            endereco: `${randomElement(STREETS)}, ${Math.floor(Math.random() * 2000)}`,
            cidade: city,
        }
    };
}

// Generate investigation with LLM for narrative
async function generateInvestigationName(template: typeof CASE_TEMPLATES[0]): Promise<string> {
    const operationNames = [
        'Alcateia', 'Hydra', 'Raposa', 'Serpente', 'Falcão', 'Lobo', 'Pantera',
        'Tempestade', 'Trovão', 'Relâmpago', 'Furacão', 'Ciclone', 'Tornado',
        'Escorpião', 'Águia', 'Tigre', 'Cobra', 'Aranha', 'Corvo', 'Gavião',
        'Aurora', 'Eclipse', 'Meteoro', 'Cometa', 'Saturno', 'Marte', 'Vênus',
        'Fênix', 'Dragão', 'Grifo', 'Centauro', 'Medusa', 'Hidra', 'Cérbero'
    ];

    return `${template.prefix} ${randomElement(operationNames)}`;
}

// Main generation
async function generateSyntheticData() {
    console.log('🚀 Iniciando geração de dados sintéticos...');
    console.log(`📊 Operações: ${INVESTIGATION_COUNT}`);
    console.log(`🔗 Cross-references: ${CROSS_REF_COUNT}`);
    console.log(`📝 Dry run: ${dryRun ? 'Sim' : 'Não'}`);
    console.log('');

    // Get existing unit
    const { data: units } = await supabase
        .from('intelink_police_units')
        .select('id')
        .limit(1);

    if (!units || units.length === 0) {
        console.error('❌ Nenhuma delegacia encontrada. Crie uma delegacia primeiro.');
        process.exit(1);
    }
    const unitId = units[0].id;
    console.log(`🏛️ Usando delegacia: ${unitId}`);

    // Cross-reference entities (will appear in multiple investigations)
    const crossRefEntities: any[] = [];
    console.log(`\n🔗 Gerando ${CROSS_REF_COUNT} entidades cross-reference...`);
    for (let i = 0; i < CROSS_REF_COUNT; i++) {
        crossRefEntities.push(generatePerson(randomElement(['SUSPEITO', 'INVESTIGADO', 'TESTEMUNHA'])));
    }

    const investigations: any[] = [];
    const allEntities: any[] = [];
    const allRelationships: any[] = [];

    // Inject Demo Scenarios
    await injectScenarios(unitId, investigations);

    // Generate investigations
    for (let i = 0; i < INVESTIGATION_COUNT; i++) {
        const template = randomElement(CASE_TEMPLATES);
        const name = await generateInvestigationName(template);

        console.log(`\n📁 [${i + 1}/${INVESTIGATION_COUNT}] ${name} (${template.type})`);

        const investigation = {
            title: name,
            description: `Operação relacionada a ${template.type.toLowerCase().replace('_', ' ')}. Inquérito ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}/${new Date().getFullYear()}. ${template.keywords.join(', ')}.`,
            status: randomElement(['active', 'active', 'active', 'archived']),
            unit_id: unitId,
        };

        // Generate entities for this investigation
        const entityCount = 5 + Math.floor(Math.random() * 10); // 5-15 entities
        const entities: any[] = [];

        // Add cross-reference entity (20% chance per investigation)
        if (Math.random() < 0.3 && crossRefEntities.length > 0) {
            const crossRef = randomElement(crossRefEntities);
            entities.push({ ...crossRef, _isCrossRef: true });
            console.log(`  🔗 Cross-ref: ${crossRef.name}`);
        }

        // Generate new entities
        for (let j = entities.length; j < entityCount; j++) {
            const entityType = Math.random();
            let entity;
            if (entityType < 0.5) {
                entity = generatePerson(randomElement(['SUSPEITO', 'VITIMA', 'TESTEMUNHA', 'INVESTIGADO']));
            } else if (entityType < 0.7) {
                entity = generateVehicle();
            } else if (entityType < 0.85) {
                entity = generateLocation();
            } else if (entityType < 0.95) {
                entity = generateFirearm();
            } else {
                entity = generateOrganization();
            }
            entities.push(entity);
        }

        console.log(`  📌 ${entities.length} entidades`);

        // Generate relationships
        const relationships: any[] = [];
        const relationshipTypes = [
            'KNOWS', 'OWNS', 'LIVES_AT', 'WORKS_AT', 'RELATED_TO',
            'MEMBER_OF', 'WITNESSED', 'VICTIM_OF', 'SUSPECT_IN', 'FOUND_AT'
        ];

        // Create relationships between entities
        for (let j = 0; j < entities.length - 1; j++) {
            if (Math.random() < 0.6) { // 60% chance of relationship
                const targetIdx = j + 1 + Math.floor(Math.random() * (entities.length - j - 1));
                if (targetIdx < entities.length) {
                    relationships.push({
                        source_idx: j,
                        target_idx: targetIdx,
                        type: randomElement(relationshipTypes),
                        metadata: { peso: Math.floor(Math.random() * 10) + 1 }
                    });
                }
            }
        }

        console.log(`  🔗 ${relationships.length} relacionamentos`);

        investigations.push({
            investigation,
            entities,
            relationships
        });
    }

    // Save to database
    if (dryRun) {
        console.log('\n📝 DRY RUN - Dados NÃO foram salvos');
        console.log('\n📊 Resumo:');
        console.log(`  - ${investigations.length} operações`);
        console.log(`  - ${investigations.reduce((acc, inv) => acc + inv.entities.length, 0)} entidades`);
        console.log(`  - ${investigations.reduce((acc, inv) => acc + inv.relationships.length, 0)} relacionamentos`);
        return;
    }

    console.log('\n💾 Salvando no banco de dados...');

    for (const inv of investigations) {
        // Insert investigation
        const { data: insertedInv, error: invError } = await supabase
            .from('intelink_investigations')
            .insert(inv.investigation)
            .select()
            .single();

        if (invError) {
            console.error(`❌ Erro ao inserir operação: ${invError.message}`);
            continue;
        }

        // Insert entities
        const entityIdMap: Record<number, string> = {};
        for (let i = 0; i < inv.entities.length; i++) {
            const entity = inv.entities[i];
            // Add role to metadata
            const metadata = { ...entity.metadata, role: entity.role };
            const { data: insertedEntity, error: entityError } = await supabase
                .from('intelink_entities')
                .insert({
                    investigation_id: insertedInv.id,
                    type: entity.type,
                    name: entity.name,
                    metadata
                })
                .select()
                .single();

            if (entityError) {
                console.error(`❌ Erro ao inserir entidade: ${entityError.message}`);
                continue;
            }
            entityIdMap[i] = insertedEntity.id;
        }

        // Insert relationships
        for (const rel of inv.relationships) {
            const sourceId = entityIdMap[rel.source_idx];
            const targetId = entityIdMap[rel.target_idx];
            if (sourceId && targetId) {
                const { error: relError } = await supabase
                    .from('intelink_relationships')
                    .insert({
                        investigation_id: insertedInv.id,
                        source_id: sourceId,
                        target_id: targetId,
                        type: rel.type,
                        description: `Conexão ${rel.type} entre entidades`
                    });

                if (relError) {
                    console.error(`❌ Erro ao inserir relacionamento: ${relError.message}`);
                }
            }
        }

        console.log(`  ✅ ${inv.investigation.title}`);
    }

    console.log('\n🎉 Geração concluída!');

    // Final stats
    const { count: invCount } = await supabase.from('intelink_investigations').select('*', { count: 'exact', head: true });
    const { count: entCount } = await supabase.from('intelink_entities').select('*', { count: 'exact', head: true });
    const { count: relCount } = await supabase.from('intelink_relationships').select('*', { count: 'exact', head: true });

    console.log('\n📊 Status Final do Banco:');
    console.log(`  - Operações: ${invCount}`);
    console.log(`  - Entidades: ${entCount}`);
    console.log(`  - Relacionamentos: ${relCount}`);
}

// Helper for historical dates
function generateHistoricalDate(yearStart: number, yearEnd: number): string {
    const start = new Date(yearStart, 0, 1).getTime();
    const end = new Date(yearEnd, 11, 31).getTime();
    const date = new Date(start + Math.random() * (end - start));
    return date.toISOString().split('T')[0];
}

async function injectScenarios(unitId: string, investigations: any[]) {
    console.log('\n🎬 Injetando Cenários de Demo (Cold Case & Ghost Vehicle)...');

    // SCENARIO A: The Sleeping Aranha (Cold Case)
    // Case 1: 2008 Theft
    const caseA1 = {
        investigation: {
            title: 'Operação Teia Antiga (2008)',
            description: 'Furto qualificado em residência. Suspeito conhecido apenas como "Aranha" devido a tatuagem no cotovelo esquerdo. Inquérito 0042/2008.',
            status: 'archived',
            unit_id: unitId,
            created_at: generateHistoricalDate(2008, 2008),
        },
        entities: [
            {
                type: 'PERSON',
                name: 'João da Silva',
                role: 'SUSPEITO',
                metadata: {
                    alcunha: 'Aranha',
                    tatuagem: 'Teia de aranha no cotovelo esquerdo',
                    data_nascimento: '1985-05-15',
                    mae: 'Maria da Silva'
                }
            }
        ],
        relationships: []
    };

    // Case 2: 2025 Drug Trafficking
    const caseA2 = {
        investigation: {
            title: 'Operação Veneno (2025)',
            description: 'Tráfico internacional. Líder da organização conhecido como "O Chefe". Escutas revelam que ele menciona seu passado como "Aranha".',
            status: 'active',
            unit_id: unitId
        },
        entities: [
            {
                type: 'PERSON',
                name: 'O Chefe (Identidade Desconhecida)',
                role: 'ALVO_PRINCIPAL',
                metadata: {
                    alcunha: 'Aranha',
                    obs: 'Líder da facção. Possível vínculo com crimes antigos.'
                }
            }
        ],
        relationships: []
    };

    // SCENARIO B: Ghost Vehicle (Cross-Case)
    // Case 3: Homicide
    const plate = 'ABC-1234';
    const caseB1 = {
        investigation: {
            title: 'Homicídio Belvedere',
            description: 'Homicídio doloso. Testemunhas viram um Corolla Preto fugindo do local.',
            status: 'active',
            unit_id: unitId
        },
        entities: [
            {
                type: 'VEHICLE',
                name: 'Toyota Corolla Preto',
                role: 'EVIDÊNCIA',
                metadata: {
                    placa: plate,
                    cor: 'Preto',
                    marca: 'Toyota',
                    modelo: 'Corolla'
                }
            }
        ],
        relationships: []
    };

    // Case 4: Robbery
    const caseB2 = {
        investigation: {
            title: 'Roubo a Banco Contagem',
            description: 'Assalto a agência. Veículo utilizado na fuga foi abandonado e incendiado parcialmente.',
            status: 'active',
            unit_id: unitId
        },
        entities: [
            {
                type: 'VEHICLE',
                name: 'Veículo de Fuga',
                role: 'EVIDÊNCIA',
                metadata: {
                    placa: plate, // SAME PLATE -> HIDDEN LINK
                    cor: 'Preto (Queimado)',
                    marca: 'Toyota',
                    modelo: 'Corolla'
                }
            }
        ],
        relationships: []
    };

    investigations.push(caseA1, caseA2, caseB1, caseB2);
    console.log('✅ Cenários A e B injetados na fila de geração.');
}

// Run
generateSyntheticData().catch(console.error);
