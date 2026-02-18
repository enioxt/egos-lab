/**
 * Intelink Demo Data Seed Script
 * 
 * Creates 5 interconnected investigations with:
 * - 40+ entities (PERSON, VEHICLE, LOCATION, PHONE, ORGANIZATION, FIREARM)
 * - 60+ relationships between entities
 * - Cross-investigation links (shared persons, vehicles, locations)
 * - Evidence items per investigation
 * - Timeline events
 * - Cross-case alerts
 * 
 * All data is SYNTHETIC — no real PII.
 * 
 * Usage: npx tsx apps/intelink/scripts/seed-demo-data.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lhscgsqhiooyatkebose.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Set it as an env var.');
  process.exit(1);
}

// ═══ Helpers ═══
function uuid(): string {
  return crypto.randomUUID();
}

async function sql(query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
  // Use direct table insert instead
}

function normalizeKeys(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const allKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) allKeys.add(key);
  }
  return rows.map(row => {
    const normalized: Record<string, unknown> = {};
    for (const key of allKeys) {
      normalized[key] = key in row ? row[key] : null;
    }
    return normalized;
  });
}

async function insert(table: string, rows: Record<string, unknown>[]) {
  const normalized = normalizeKeys(rows);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(normalized),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ INSERT ${table} failed:`, err);
    throw new Error(`Insert ${table} failed: ${err}`);
  }
  return res.json();
}

// ═══ IDs (pre-generated for cross-referencing) ═══
const INV = {
  trafico: uuid(),
  homicidio: uuid(),
  lavagem: uuid(),
  furto_veiculos: uuid(),
  extorsao: uuid(),
};

// Shared entities — separate IDs per investigation (trigger detects cross-case via CPF/name)
const SHARED = {
  // CARLOS SILVA — appears in 4 investigations
  carlos_trafico: uuid(),
  carlos_homicidio: uuid(),
  carlos_lavagem: uuid(),
  carlos_extorsao: uuid(),
  // VW GOL PRETO — trafico + homicidio
  gol_trafico: uuid(),
  gol_homicidio: uuid(),
  // RUA MANGABEIRAS — trafico + homicidio + extorsao
  rua_trafico: uuid(),
  rua_homicidio: uuid(),
  rua_extorsao: uuid(),
  // TELEFONE CHEFE — trafico + lavagem + extorsao
  tel_trafico: uuid(),
  tel_lavagem: uuid(),
  tel_extorsao: uuid(),
  // AUTO PECAS JR — lavagem + furto
  pecas_lavagem: uuid(),
  pecas_furto: uuid(),
};

// Investigation-specific entities
const E = {
  // ── INV 1: Tráfico de Drogas ──
  marcos_souza: uuid(),
  juliana_reis: uuid(),
  felipe_gomes: uuid(),
  honda_civic_prata: uuid(),
  bar_esquina: uuid(),
  tel_marcos: uuid(),
  tel_juliana: uuid(),
  glock_19: uuid(),
  
  // ── INV 2: Homicídio ──
  vitor_mendes: uuid(),  // victim
  rafael_costa: uuid(),  // suspect
  amanda_oliveira: uuid(), // witness
  fiat_uno_branco: uuid(),
  hospital_municipal: uuid(),
  tel_rafael: uuid(),
  revolver_38: uuid(),
  
  // ── INV 3: Lavagem de Dinheiro ──
  patricia_almeida: uuid(),
  roberto_fernandes: uuid(),
  imobiliaria_central: uuid(),
  construtora_norte: uuid(),
  conta_bancaria_1: uuid(),
  bmw_x5_preto: uuid(),
  apto_luxo: uuid(),
  
  // ── INV 4: Furto de Veículos ──
  leandro_dias: uuid(),
  thiago_motta: uuid(),
  igor_santos: uuid(),
  galpao_industrial: uuid(),
  caminhao_guincho: uuid(),
  toyota_hilux: uuid(),
  tel_leandro: uuid(),
  
  // ── INV 5: Extorsão ──
  denise_barbosa: uuid(),  // victim
  wagner_lima: uuid(),     // suspect
  bruno_ferreira: uuid(),  // accomplice
  moto_yamaha: uuid(),
  padaria_sol: uuid(),
  tel_wagner: uuid(),
};

async function seed() {
  console.log('🌱 Starting Intelink demo data seed...\n');

  // ═══ 1. INVESTIGATIONS ═══
  console.log('📋 Creating 5 investigations...');
  await insert('intelink_investigations', [
    {
      id: INV.trafico,
      title: 'Operação Cerco Fechado',
      description: 'Investigação sobre rede de tráfico de drogas no bairro Mangabeiras. Grupo usa bar como fachada e veículos para distribuição. Líder identificado como CARLOS HENRIQUE DA SILVA.',
      status: 'active',
      crime_type: 'Tráfico de Drogas',
      crime_datetime: '2026-01-15T22:30:00Z',
      created_at: '2026-01-16T08:00:00Z',
      updated_at: '2026-02-15T14:00:00Z',
    },
    {
      id: INV.homicidio,
      title: 'Caso Vitor Mendes',
      description: 'Homicídio de VITOR MENDES DE OLIVEIRA, 28 anos, encontrado baleado na Rua Mangabeiras. Possível ligação com tráfico local. Veículo preto visto no local.',
      status: 'active',
      crime_type: 'Homicídio',
      crime_datetime: '2026-02-02T03:15:00Z',
      created_at: '2026-02-02T06:00:00Z',
      updated_at: '2026-02-16T10:00:00Z',
    },
    {
      id: INV.lavagem,
      title: 'Operação Fachada Limpa',
      description: 'Esquema de lavagem de dinheiro usando imobiliária e construtora. Valores incompatíveis detectados em transações de imóveis. Conexão com líder do tráfico no Mangabeiras.',
      status: 'active',
      crime_type: 'Lavagem de Dinheiro',
      crime_datetime: '2025-06-01T00:00:00Z',
      created_at: '2026-01-20T09:00:00Z',
      updated_at: '2026-02-14T16:00:00Z',
    },
    {
      id: INV.furto_veiculos,
      title: 'Operação Desmanche',
      description: 'Quadrilha especializada em furto e desmanche de veículos. Galpão industrial usado para desmontagem. Peças revendidas pela Auto Peças JR.',
      status: 'active',
      crime_type: 'Furto/Receptação',
      crime_datetime: '2025-11-01T00:00:00Z',
      created_at: '2025-12-01T10:00:00Z',
      updated_at: '2026-02-10T11:00:00Z',
    },
    {
      id: INV.extorsao,
      title: 'Caso Padaria Sol',
      description: 'Extorsão contra comerciantes na região do Mangabeiras. Vítimas obrigadas a pagar "proteção" semanal. Suspeitos ligados ao tráfico da região.',
      status: 'active',
      crime_type: 'Extorsão',
      crime_datetime: '2026-01-01T00:00:00Z',
      created_at: '2026-02-05T08:00:00Z',
      updated_at: '2026-02-17T09:00:00Z',
    },
  ]);

  // ═══ 2. ENTITIES ═══
  console.log('👤 Creating 40+ entities...');
  
  const entities = [
    // ── CARLOS SILVA in Tráfico ──
    { id: SHARED.carlos_trafico, investigation_id: INV.trafico, type: 'PERSON', name: 'CARLOS HENRIQUE DA SILVA',
      cpf: '111.222.333-44', birth_date: '1985-03-12', mother_name: 'MARIA APARECIDA DA SILVA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-000',
      occupation: 'Empresário (declarado)',
      metadata: { alias: 'Carlão', role: 'líder', antecedentes: ['Art. 33 Lei 11.343', 'Art. 157 CP'], status: 'foragido' }},
    // ── CARLOS SILVA in Homicídio ──
    { id: SHARED.carlos_homicidio, investigation_id: INV.homicidio, type: 'PERSON', name: 'CARLOS HENRIQUE DA SILVA',
      cpf: '111.222.333-44', birth_date: '1985-03-12', mother_name: 'MARIA APARECIDA DA SILVA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Carlão', role: 'mandante do crime' }},
    // ── CARLOS SILVA in Lavagem ──
    { id: SHARED.carlos_lavagem, investigation_id: INV.lavagem, type: 'PERSON', name: 'CARLOS HENRIQUE DA SILVA',
      cpf: '111.222.333-44', birth_date: '1985-03-12', mother_name: 'MARIA APARECIDA DA SILVA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Carlão', role: 'beneficiário oculto', patrimonio_oculto: 'R$ 12M estimado' }},
    // ── CARLOS SILVA in Extorsão ──
    { id: SHARED.carlos_extorsao, investigation_id: INV.extorsao, type: 'PERSON', name: 'CARLOS HENRIQUE DA SILVA',
      cpf: '111.222.333-44', birth_date: '1985-03-12', mother_name: 'MARIA APARECIDA DA SILVA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Carlão', role: 'mandante da extorsão' }},
    // ── GOL PRETO in Tráfico ──
    { id: SHARED.gol_trafico, investigation_id: INV.trafico, type: 'VEHICLE', name: 'VW Gol G6 Preto',
      brand: 'Volkswagen', model: 'Gol G6', color: 'Preto', year: 2019,
      chassis: '9BWAB05U0GP000001', renavam: '00123456789',
      metadata: { plate: 'HRK-4A21', situacao: 'circulação', observacoes: 'Vidros escuros, som alto' }},
    // ── GOL PRETO in Homicídio ──
    { id: SHARED.gol_homicidio, investigation_id: INV.homicidio, type: 'VEHICLE', name: 'VW Gol G6 Preto',
      brand: 'Volkswagen', model: 'Gol G6', color: 'Preto', year: 2019,
      metadata: { plate: 'HRK-4A21', situacao: 'visto no local do crime' }},
    // ── RUA MANGABEIRAS in Tráfico ──
    { id: SHARED.rua_trafico, investigation_id: INV.trafico, type: 'LOCATION', name: 'Rua das Mangabeiras, 450',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-020',
      latitude: -19.9420, longitude: -43.9290,
      metadata: { tipo: 'Ponto de distribuição', descricao: 'Esquina com Rua Caraça, próximo ao bar' }},
    // ── RUA MANGABEIRAS in Homicídio ──
    { id: SHARED.rua_homicidio, investigation_id: INV.homicidio, type: 'LOCATION', name: 'Rua das Mangabeiras, 450',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-020',
      latitude: -19.9420, longitude: -43.9290,
      metadata: { tipo: 'Local do crime', descricao: 'Vítima encontrada na calçada' }},
    // ── RUA MANGABEIRAS in Extorsão ──
    { id: SHARED.rua_extorsao, investigation_id: INV.extorsao, type: 'LOCATION', name: 'Rua das Mangabeiras, 450',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-020',
      latitude: -19.9420, longitude: -43.9290,
      metadata: { tipo: 'Área de extorsão', descricao: 'Região controlada pelo grupo' }},
    // ── TELEFONE CHEFE in Tráfico ──
    { id: SHARED.tel_trafico, investigation_id: INV.trafico, type: 'PHONE', name: '(31) 99876-5432',
      metadata: { operadora: 'Claro', titular: 'CARLOS HENRIQUE DA SILVA', tipo: 'celular', chip_pre_pago: false }},
    // ── TELEFONE CHEFE in Lavagem ──
    { id: SHARED.tel_lavagem, investigation_id: INV.lavagem, type: 'PHONE', name: '(31) 99876-5432',
      metadata: { operadora: 'Claro', titular: 'CARLOS HENRIQUE DA SILVA', tipo: 'celular' }},
    // ── TELEFONE CHEFE in Extorsão ──
    { id: SHARED.tel_extorsao, investigation_id: INV.extorsao, type: 'PHONE', name: '(31) 99876-5432',
      metadata: { operadora: 'Claro', titular: 'CARLOS HENRIQUE DA SILVA', tipo: 'celular' }},
    // ── AUTO PECAS JR in Lavagem ──
    { id: SHARED.pecas_lavagem, investigation_id: INV.lavagem, type: 'ORGANIZATION', name: 'Auto Peças JR Ltda',
      cnpj: '12.345.678/0001-90', city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      organization_type: 'Comércio',
      metadata: { responsavel: 'ROBERTO FERNANDES', faturamento_anual: 'R$ 2.400.000', funcionarios: 8 }},
    // ── AUTO PECAS JR in Furto ──
    { id: SHARED.pecas_furto, investigation_id: INV.furto_veiculos, type: 'ORGANIZATION', name: 'Auto Peças JR Ltda',
      cnpj: '12.345.678/0001-90', city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      organization_type: 'Comércio',
      metadata: { responsavel: 'ROBERTO FERNANDES', revenda_pecas_furtadas: true }},

    // ── INV 1: Tráfico ──
    { id: E.marcos_souza, investigation_id: INV.trafico, type: 'PERSON', name: 'MARCOS VINICIUS SOUZA',
      cpf: '222.333.444-55', birth_date: '1992-07-25', mother_name: 'SANDRA MARIA SOUZA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Marquinhos', role: 'distribuidor', antecedentes: ['Art. 33 Lei 11.343'] }},
    { id: E.juliana_reis, investigation_id: INV.trafico, type: 'PERSON', name: 'JULIANA REIS SANTOS',
      cpf: '333.444.555-66', birth_date: '1995-11-08',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Lourdes',
      metadata: { role: 'olheira', parentesco_carlos: 'namorada' }},
    { id: E.felipe_gomes, investigation_id: INV.trafico, type: 'PERSON', name: 'FELIPE AUGUSTO GOMES',
      cpf: '444.555.666-77', birth_date: '1998-01-30',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Felipão', role: 'aviãozinho' }},
    { id: E.honda_civic_prata, investigation_id: INV.trafico, type: 'VEHICLE', name: 'Honda Civic Prata',
      brand: 'Honda', model: 'Civic EXL', color: 'Prata', year: 2022,
      metadata: { plate: 'QRS-5B67', situacao: 'circulação', observacoes: 'Usado por Marcos para entregas' }},
    { id: E.bar_esquina, investigation_id: INV.trafico, type: 'LOCATION', name: 'Bar da Esquina',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-020',
      latitude: -19.9422, longitude: -43.9288,
      metadata: { tipo: 'Comércio/Fachada', cnpj_ficticio: '98.765.432/0001-10', horario: '18h-03h' }},
    { id: E.tel_marcos, investigation_id: INV.trafico, type: 'PHONE', name: '(31) 98765-1234',
      metadata: { operadora: 'Vivo', titular: 'MARCOS VINICIUS SOUZA', tipo: 'celular' }},
    { id: E.tel_juliana, investigation_id: INV.trafico, type: 'PHONE', name: '(31) 97654-3210',
      metadata: { operadora: 'Tim', titular: 'JULIANA REIS SANTOS', tipo: 'celular' }},
    { id: E.glock_19, investigation_id: INV.trafico, type: 'FIREARM', name: 'Pistola Glock 19 Gen5',
      metadata: { calibre: '9mm', numero_serie: 'XPTO-00001', situacao: 'apreendida', local_apreensao: 'Bar da Esquina' }},

    // ── INV 2: Homicídio ──
    { id: E.vitor_mendes, investigation_id: INV.homicidio, type: 'PERSON', name: 'VITOR MENDES DE OLIVEIRA',
      cpf: '555.666.777-88', birth_date: '1997-09-14', mother_name: 'CLAUDIA MENDES DE OLIVEIRA',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { role: 'vítima', causa_mortis: 'Projétil de arma de fogo', local_obito: 'Rua das Mangabeiras, 450' }},
    { id: E.rafael_costa, investigation_id: INV.homicidio, type: 'PERSON', name: 'RAFAEL AUGUSTO COSTA',
      cpf: '666.777.888-99', birth_date: '1990-04-20',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Serra',
      metadata: { alias: 'Rafa', role: 'suspeito principal', antecedentes: ['Art. 121 CP', 'Art. 14 Lei 10.826'] }},
    { id: E.amanda_oliveira, investigation_id: INV.homicidio, type: 'PERSON', name: 'AMANDA CRISTINA OLIVEIRA',
      cpf: '777.888.999-00', birth_date: '2000-12-05',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { role: 'testemunha', parentesco_vitima: 'irmã', depoimento: 'Ouviu disparos por volta das 3h. Viu veículo preto saindo em alta velocidade.' }},
    { id: E.fiat_uno_branco, investigation_id: INV.homicidio, type: 'VEHICLE', name: 'Fiat Uno Way Branco',
      brand: 'Fiat', model: 'Uno Way', color: 'Branco', year: 2018,
      metadata: { plate: 'MNO-3C45', situacao: 'circulação', proprietario: 'RAFAEL AUGUSTO COSTA' }},
    { id: E.hospital_municipal, investigation_id: INV.homicidio, type: 'LOCATION', name: 'Hospital Municipal Odilon Behrens',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'São Cristóvão',
      latitude: -19.9100, longitude: -43.9600,
      metadata: { tipo: 'Hospital', observacao: 'Vítima deu entrada em óbito' }},
    { id: E.tel_rafael, investigation_id: INV.homicidio, type: 'PHONE', name: '(31) 99111-2233',
      metadata: { operadora: 'Oi', titular: 'RAFAEL AUGUSTO COSTA', tipo: 'celular' }},
    { id: E.revolver_38, investigation_id: INV.homicidio, type: 'FIREARM', name: 'Revólver Taurus .38',
      metadata: { calibre: '.38 Special', numero_serie: 'TAU-38-7890', situacao: 'não localizada', compativel_projetil: true }},

    // ── INV 3: Lavagem ──
    { id: E.patricia_almeida, investigation_id: INV.lavagem, type: 'PERSON', name: 'PATRICIA ALMEIDA DUARTE',
      cpf: '888.999.000-11', birth_date: '1980-06-18',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi',
      occupation: 'Corretora de imóveis',
      metadata: { role: 'intermediária', creci: 'MG-12345', patrimonio_declarado: 'R$ 350.000', patrimonio_real_estimado: 'R$ 4.500.000' }},
    { id: E.roberto_fernandes, investigation_id: INV.lavagem, type: 'PERSON', name: 'ROBERTO FERNANDES JUNIOR',
      cpf: '999.000.111-22', birth_date: '1978-02-28',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      occupation: 'Empresário',
      metadata: { role: 'laranja/operador', parentesco_carlos: 'cunhado', empresas: ['Auto Peças JR Ltda', 'Construtora Norte LTDA'] }},
    { id: E.imobiliaria_central, investigation_id: INV.lavagem, type: 'ORGANIZATION', name: 'Imobiliária Central BH',
      cnpj: '23.456.789/0001-01', city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi',
      organization_type: 'Imobiliária',
      metadata: { responsavel: 'PATRICIA ALMEIDA DUARTE', transacoes_suspeitas: 12, valor_total_suspeito: 'R$ 8.700.000' }},
    { id: E.construtora_norte, investigation_id: INV.lavagem, type: 'ORGANIZATION', name: 'Construtora Norte LTDA',
      cnpj: '34.567.890/0001-12', city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      organization_type: 'Construção Civil',
      metadata: { responsavel: 'ROBERTO FERNANDES JUNIOR', obras_fantasma: 3, funcionarios_fantasma: 15 }},
    { id: E.bmw_x5_preto, investigation_id: INV.lavagem, type: 'VEHICLE', name: 'BMW X5 Preto',
      brand: 'BMW', model: 'X5 xDrive40i', color: 'Preto', year: 2024,
      metadata: { plate: 'TUV-6D89', proprietario: 'PATRICIA ALMEIDA DUARTE', valor: 'R$ 680.000', compra_a_vista: true }},
    { id: E.apto_luxo, investigation_id: INV.lavagem, type: 'LOCATION', name: 'Apartamento Cobertura - Savassi',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Savassi', cep: '30130-000',
      latitude: -19.9350, longitude: -43.9380,
      metadata: { tipo: 'Imóvel de luxo', valor: 'R$ 3.200.000', titular: 'CARLOS HENRIQUE DA SILVA', adquirido_via: 'Imobiliária Central BH' }},

    // ── INV 4: Furto de Veículos ──
    { id: E.leandro_dias, investigation_id: INV.furto_veiculos, type: 'PERSON', name: 'LEANDRO HENRIQUE DIAS',
      cpf: '100.200.300-40', birth_date: '1988-10-05',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      metadata: { alias: 'Lê', role: 'líder do desmanche', antecedentes: ['Art. 155 CP', 'Art. 180 CP'] }},
    { id: E.thiago_motta, investigation_id: INV.furto_veiculos, type: 'PERSON', name: 'THIAGO DE ALMEIDA MOTTA',
      cpf: '200.300.400-50', birth_date: '1993-05-17',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro',
      metadata: { alias: 'Motinha', role: 'executor de furtos' }},
    { id: E.igor_santos, investigation_id: INV.furto_veiculos, type: 'PERSON', name: 'IGOR PEREIRA SANTOS',
      cpf: '300.400.500-60', birth_date: '1996-08-22',
      city: 'Contagem', state: 'MG', neighborhood: 'Eldorado',
      metadata: { role: 'guincheiro', habilitacao: 'AB' }},
    { id: E.galpao_industrial, investigation_id: INV.furto_veiculos, type: 'LOCATION', name: 'Galpão Industrial - Barreiro',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Barreiro', cep: '30640-000',
      latitude: -19.9780, longitude: -44.0290,
      metadata: { tipo: 'Galpão de desmanche', area: '800m²', aluguel: 'ROBERTO FERNANDES JUNIOR' }},
    { id: E.caminhao_guincho, investigation_id: INV.furto_veiculos, type: 'VEHICLE', name: 'Caminhão Guincho Iveco',
      brand: 'Iveco', model: 'Daily 70C17', color: 'Branco', year: 2020,
      metadata: { plate: 'WXY-7E12', proprietario: 'Auto Peças JR Ltda', usado_para: 'transporte de veículos furtados' }},
    { id: E.toyota_hilux, investigation_id: INV.furto_veiculos, type: 'VEHICLE', name: 'Toyota Hilux SRX Branca',
      brand: 'Toyota', model: 'Hilux SRX 2.8', color: 'Branco', year: 2023,
      metadata: { plate: 'ZAB-8F34', situacao: 'furtada', proprietario_original: 'Vítima A.J.M.', data_furto: '2026-01-20' }},
    { id: E.tel_leandro, investigation_id: INV.furto_veiculos, type: 'PHONE', name: '(31) 98444-5566',
      metadata: { operadora: 'Claro', titular: 'LEANDRO HENRIQUE DIAS', tipo: 'celular' }},

    // ── INV 5: Extorsão ──
    { id: E.denise_barbosa, investigation_id: INV.extorsao, type: 'PERSON', name: 'DENISE BARBOSA LIMA',
      cpf: '400.500.600-70', birth_date: '1975-03-30',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      occupation: 'Comerciante',
      metadata: { role: 'vítima', estabelecimento: 'Padaria Sol', valor_pago: 'R$ 48.000 (total estimado)', periodo: '12 meses' }},
    { id: E.wagner_lima, investigation_id: INV.extorsao, type: 'PERSON', name: 'WAGNER LUIZ LIMA',
      cpf: '500.600.700-80', birth_date: '1991-12-10',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Waguinho', role: 'cobrador', antecedentes: ['Art. 158 CP', 'Art. 147 CP'], vinculo_carlos: 'subordinado' }},
    { id: E.bruno_ferreira, investigation_id: INV.extorsao, type: 'PERSON', name: 'BRUNO FERREIRA DOS ANJOS',
      cpf: '600.700.800-90', birth_date: '1994-07-04',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras',
      metadata: { alias: 'Brunão', role: 'intimidador', porte_fisico: 'grande', tatuagens: ['braço direito: leão'] }},
    { id: E.moto_yamaha, investigation_id: INV.extorsao, type: 'VEHICLE', name: 'Yamaha MT-07 Preta',
      brand: 'Yamaha', model: 'MT-07', color: 'Preto', year: 2023,
      metadata: { plate: 'CDE-9G56', proprietario: 'WAGNER LUIZ LIMA', usado_para: 'cobranças' }},
    { id: E.padaria_sol, investigation_id: INV.extorsao, type: 'LOCATION', name: 'Padaria Sol',
      city: 'Belo Horizonte', state: 'MG', neighborhood: 'Mangabeiras', cep: '30210-030',
      latitude: -19.9430, longitude: -43.9300,
      metadata: { tipo: 'Comércio (vítima)', proprietaria: 'DENISE BARBOSA LIMA', cnpj: '45.678.901/0001-23' }},
    { id: E.tel_wagner, investigation_id: INV.extorsao, type: 'PHONE', name: '(31) 98555-7788',
      metadata: { operadora: 'Vivo', titular: 'WAGNER LUIZ LIMA', tipo: 'celular' }},
  ];

  await insert('intelink_entities', entities);
  console.log(`   ✅ ${entities.length} entities created`);

  // ═══ 3. RELATIONSHIPS ═══
  console.log('🔗 Creating 60+ relationships...');
  
  const relationships = [
    // ── INV 1: Tráfico ──
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: E.marcos_souza, type: 'COMANDA', description: 'Carlos é o líder, Marcos distribui drogas sob suas ordens' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: E.juliana_reis, type: 'RELACIONAMENTO_AMOROSO', description: 'Juliana é namorada de Carlos e atua como olheira' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: E.felipe_gomes, type: 'COMANDA', description: 'Felipe é aviãozinho de Carlos' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: SHARED.gol_trafico, type: 'PROPRIETARIO', description: 'Veículo registrado em nome de terceiro mas utilizado por Carlos' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.marcos_souza, target_id: E.honda_civic_prata, type: 'UTILIZA', description: 'Marcos usa o Civic para entregas de drogas' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: E.bar_esquina, type: 'FREQUENTA', description: 'Bar usado como ponto de encontro e distribuição' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.marcos_souza, target_id: E.bar_esquina, type: 'FREQUENTA', description: 'Marcos faz entregas a partir do bar' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.bar_esquina, target_id: SHARED.rua_trafico, type: 'LOCALIZADO_EM', description: 'Bar fica na esquina da Rua Mangabeiras' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.carlos_trafico, target_id: SHARED.tel_trafico, type: 'TITULAR', description: 'Telefone principal de Carlos' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.marcos_souza, target_id: E.tel_marcos, type: 'TITULAR', description: 'Telefone de Marcos' },
    { id: uuid(), investigation_id: INV.trafico, source_id: SHARED.tel_trafico, target_id: E.tel_marcos, type: 'COMUNICACAO_FREQUENTE', description: '47 ligações em janeiro/2026, média 3min' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.glock_19, target_id: E.bar_esquina, type: 'APREENDIDA_EM', description: 'Glock apreendida durante operação no bar' },
    { id: uuid(), investigation_id: INV.trafico, source_id: E.felipe_gomes, target_id: SHARED.rua_trafico, type: 'RESIDE_PROXIMO', description: 'Felipe mora a 200m do ponto de distribuição' },

    // ── INV 2: Homicídio ──
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.rafael_costa, target_id: E.vitor_mendes, type: 'SUSPEITO_DE_HOMICIDIO', description: 'Rafael é o principal suspeito do assassinato de Vitor' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.vitor_mendes, target_id: SHARED.rua_homicidio, type: 'LOCAL_DO_CRIME', description: 'Vitor foi encontrado baleado na Rua das Mangabeiras, 450' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.amanda_oliveira, target_id: E.vitor_mendes, type: 'PARENTESCO', description: 'Amanda é irmã de Vitor' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.rafael_costa, target_id: E.fiat_uno_branco, type: 'PROPRIETARIO', description: 'Fiat Uno registrado em nome de Rafael' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: SHARED.gol_homicidio, target_id: SHARED.rua_homicidio, type: 'VISTO_NO_LOCAL', description: 'Gol preto visto saindo em alta velocidade após os disparos, conforme testemunha' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.rafael_costa, target_id: SHARED.carlos_homicidio, type: 'SUBORDINADO_A', description: 'Rafael presta serviços para Carlos (segurança/cobranças)' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.vitor_mendes, target_id: E.marcos_souza, type: 'DEVEDOR', description: 'Vitor devia R$ 15.000 a Marcos por drogas' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.rafael_costa, target_id: E.tel_rafael, type: 'TITULAR', description: 'Telefone de Rafael' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.tel_rafael, target_id: SHARED.carlos_homicidio, type: 'COMUNICACAO_FREQUENTE', description: 'Ligação de 2min às 03:05 na madrugada do crime para telefone de Carlos' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.revolver_38, target_id: E.vitor_mendes, type: 'ARMA_DO_CRIME', description: 'Projétil .38 retirado do corpo da vítima, compatível com Taurus .38' },
    { id: uuid(), investigation_id: INV.homicidio, source_id: E.vitor_mendes, target_id: E.hospital_municipal, type: 'ENCAMINHADO_PARA', description: 'Vítima levada ao hospital, chegou em óbito' },

    // ── INV 3: Lavagem ──
    { id: uuid(), investigation_id: INV.lavagem, source_id: SHARED.carlos_lavagem, target_id: E.roberto_fernandes, type: 'PARENTESCO', description: 'Roberto é cunhado de Carlos (casado com irmã)' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.roberto_fernandes, target_id: SHARED.pecas_lavagem, type: 'SOCIO', description: 'Roberto é sócio-gerente da Auto Peças JR' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.roberto_fernandes, target_id: E.construtora_norte, type: 'SOCIO', description: 'Roberto é sócio da Construtora Norte' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.patricia_almeida, target_id: E.imobiliaria_central, type: 'RESPONSAVEL', description: 'Patrícia é responsável pela Imobiliária Central' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: SHARED.carlos_lavagem, target_id: E.patricia_almeida, type: 'ASSOCIADO', description: 'Carlos usa Patrícia para comprar imóveis com dinheiro do tráfico' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.patricia_almeida, target_id: E.apto_luxo, type: 'INTERMEDIOU_COMPRA', description: 'Patrícia intermediou a compra da cobertura na Savassi' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: SHARED.carlos_lavagem, target_id: E.apto_luxo, type: 'PROPRIETARIO_OCULTO', description: 'Imóvel registrado em nome de Roberto mas usado por Carlos' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.patricia_almeida, target_id: E.bmw_x5_preto, type: 'PROPRIETARIO', description: 'BMW comprada à vista — patrimônio incompatível' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: E.construtora_norte, target_id: E.roberto_fernandes, type: 'EMPRESA_FACHADA', description: 'Construtora emite notas de obras inexistentes' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: SHARED.tel_lavagem, target_id: E.patricia_almeida, type: 'COMUNICACAO_FREQUENTE', description: '23 ligações em dezembro sobre "investimentos"' },
    { id: uuid(), investigation_id: INV.lavagem, source_id: SHARED.pecas_lavagem, target_id: E.construtora_norte, type: 'TRANSACAO_FINANCEIRA', description: 'Transferências suspeitas de R$ 1.2M entre as empresas' },

    // ── INV 4: Furto de Veículos ──
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.leandro_dias, target_id: E.thiago_motta, type: 'COMANDA', description: 'Leandro coordena os furtos, Thiago executa' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.leandro_dias, target_id: E.igor_santos, type: 'COMANDA', description: 'Igor opera o guincho para transporte' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.leandro_dias, target_id: E.galpao_industrial, type: 'OPERA', description: 'Leandro gerencia o galpão de desmanche' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.galpao_industrial, target_id: E.roberto_fernandes, type: 'ALUGADO_POR', description: 'Galpão alugado em nome de Roberto Fernandes (cunhado de Carlos)' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.igor_santos, target_id: E.caminhao_guincho, type: 'OPERA', description: 'Igor dirige o guincho da Auto Peças JR' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.caminhao_guincho, target_id: SHARED.pecas_furto, type: 'PERTENCE_A', description: 'Guincho registrado em nome da Auto Peças JR' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.thiago_motta, target_id: E.toyota_hilux, type: 'FURTOU', description: 'Thiago furtou a Hilux no Belvedere em 20/01/2026' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.toyota_hilux, target_id: E.galpao_industrial, type: 'LEVADO_PARA', description: 'Hilux levada para o galpão para desmanche' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: SHARED.pecas_furto, target_id: E.galpao_industrial, type: 'RECEBE_PECAS_DE', description: 'Peças desmanchadas vendidas pela Auto Peças JR' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.leandro_dias, target_id: E.tel_leandro, type: 'TITULAR', description: 'Telefone de Leandro' },
    { id: uuid(), investigation_id: INV.furto_veiculos, source_id: E.tel_leandro, target_id: SHARED.pecas_furto, type: 'COMUNICACAO_FREQUENTE', description: '15 ligações sobre "encomendas" em janeiro' },

    // ── INV 5: Extorsão ──
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.wagner_lima, target_id: E.denise_barbosa, type: 'EXTORQUE', description: 'Wagner cobra R$ 1.000/semana da Padaria Sol' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.bruno_ferreira, target_id: E.denise_barbosa, type: 'INTIMIDA', description: 'Bruno faz ameaças físicas quando há atraso no pagamento' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.wagner_lima, target_id: SHARED.carlos_extorsao, type: 'SUBORDINADO_A', description: 'Wagner atua sob ordens de Carlos para cobrar proteção' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.wagner_lima, target_id: E.bruno_ferreira, type: 'PARCEIRO_CRIME', description: 'Wagner e Bruno atuam juntos nas cobranças' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.wagner_lima, target_id: E.moto_yamaha, type: 'PROPRIETARIO', description: 'Wagner usa a MT-07 para as cobranças' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.moto_yamaha, target_id: E.padaria_sol, type: 'VISTA_EM', description: 'Moto vista estacionada em frente à padaria toda sexta-feira' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.padaria_sol, target_id: SHARED.rua_extorsao, type: 'LOCALIZADO_PROXIMO', description: 'Padaria a 300m do ponto de tráfico' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.wagner_lima, target_id: E.tel_wagner, type: 'TITULAR', description: 'Telefone de Wagner' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: E.tel_wagner, target_id: SHARED.tel_extorsao, type: 'COMUNICACAO_FREQUENTE', description: 'Ligações semanais para prestar contas das cobranças' },
    { id: uuid(), investigation_id: INV.extorsao, source_id: SHARED.tel_extorsao, target_id: E.tel_wagner, type: 'COMUNICACAO_FREQUENTE', description: 'Carlos dá ordens sobre novos alvos de extorsão' },
  ];

  await insert('intelink_relationships', relationships);
  console.log(`   ✅ ${relationships.length} relationships created`);

  // ═══ 4. EVIDENCE ═══
  console.log('📎 Creating evidence items...');
  
  const evidence = [
    { id: uuid(), investigation_id: INV.trafico, type: 'IMAGE', content_text: 'Foto de vigilância do Bar da Esquina mostrando CARLOS HENRIQUE e MARCOS VINICIUS em conversa. Data: 2026-01-18, 22:45.', metadata: { source: 'Câmera de vigilância', quality: 'boa' }},
    { id: uuid(), investigation_id: INV.trafico, type: 'AUDIO', content_text: 'Interceptação telefônica entre (31) 99876-5432 e (31) 98765-1234. Carlos instrui Marcos sobre entrega de 2kg no endereço do Barreiro.', metadata: { duracao: '4min32s', data: '2026-01-25' }},
    { id: uuid(), investigation_id: INV.trafico, type: 'DOCUMENT', content_text: 'Auto de apreensão: 500g de cocaína e Glock 19 no Bar da Esquina durante operação. 3 detidos.', metadata: { data: '2026-02-01', responsavel: 'Equipe Alfa' }},
    { id: uuid(), investigation_id: INV.homicidio, type: 'DOCUMENT', content_text: 'Laudo pericial: projétil calibre .38 Special extraído do corpo da vítima. Compatível com revólver Taurus. 3 disparos, 2 no tórax, 1 na cabeça.', metadata: { perito: 'Dr. Exame', laudo_n: 'LP-2026-00234' }},
    { id: uuid(), investigation_id: INV.homicidio, type: 'TEXT', content_text: 'Depoimento de AMANDA CRISTINA: "Ouvi 3 tiros por volta das 3h. Corri para a janela e vi um carro preto, parecia um Gol, saindo em alta velocidade. Não vi a placa."', metadata: { data: '2026-02-02', local: 'DHPP' }},
    { id: uuid(), investigation_id: INV.homicidio, type: 'VIDEO', content_text: 'Câmera de segurança da farmácia na Rua Caraça registrou VW Gol preto (placa parcial HRK-4***) às 03:12, sentido Savassi.', metadata: { camera_id: 'CAM-FARM-02', resolucao: '720p' }},
    { id: uuid(), investigation_id: INV.lavagem, type: 'DOCUMENT', content_text: 'Análise financeira: 12 transações imobiliárias totalizando R$ 8.7M em 18 meses. Todas intermediadas por Imobiliária Central. Compradores sem renda compatível.', metadata: { analista: 'COAF', referencia: 'RIF-2026-0089' }},
    { id: uuid(), investigation_id: INV.lavagem, type: 'DOCUMENT', content_text: 'Notas fiscais da Construtora Norte para 3 obras no Barreiro. Verificação in loco: nenhuma obra iniciada nos endereços declarados.', metadata: { data_verificacao: '2026-01-28' }},
    { id: uuid(), investigation_id: INV.furto_veiculos, type: 'IMAGE', content_text: 'Imagens aéreas (drone) do galpão no Barreiro mostrando 8 veículos em processo de desmanche. Data: 2026-02-05.', metadata: { fonte: 'Operação Desmanche', drone: 'DJI Mavic' }},
    { id: uuid(), investigation_id: INV.furto_veiculos, type: 'DOCUMENT', content_text: 'Relatório DETRAN: 23 veículos furtados nos últimos 6 meses na região. 5 tiveram peças identificadas na Auto Peças JR.', metadata: { periodo: 'ago/2025-jan/2026' }},
    { id: uuid(), investigation_id: INV.extorsao, type: 'TEXT', content_text: 'Depoimento de DENISE BARBOSA: "Há 1 ano dois homens vêm toda sexta cobrar R$ 1.000. Um deles disse que era ordem do Carlão. Se não pagar, fecham meu comércio."', metadata: { data: '2026-02-05', local: 'DHPP', sigilo: true }},
    { id: uuid(), investigation_id: INV.extorsao, type: 'VIDEO', content_text: 'Gravação da câmera da padaria: Wagner e Bruno chegam de moto (Yamaha MT-07, placa CDE-9G56) às 17:45 de sexta. Denise entrega envelope.', metadata: { data: '2026-02-07', duracao: '3min15s' }},
  ];

  await insert('intelink_evidence', evidence);
  console.log(`   ✅ ${evidence.length} evidence items created`);

  // ═══ 5. TIMELINE ═══
  console.log('📅 Creating timeline events...');

  const timeline = [
    { id: uuid(), investigation_id: INV.trafico, event_datetime: '2026-01-15T22:30:00Z', event_type: 'crime', title: 'Denúncia anônima', description: 'Disque-denúncia reporta ponto de venda de drogas na Rua das Mangabeiras', location: 'Rua das Mangabeiras, 450', importance: 'high' },
    { id: uuid(), investigation_id: INV.trafico, event_datetime: '2026-01-18T22:45:00Z', event_type: 'surveillance', title: 'Vigilância confirma atividade', description: 'Câmera flagra Carlos e Marcos no Bar da Esquina', location: 'Bar da Esquina', importance: 'high' },
    { id: uuid(), investigation_id: INV.trafico, event_datetime: '2026-02-01T06:00:00Z', event_type: 'operation', title: 'Operação Cerco Fechado', description: 'Apreensão de 500g de cocaína, Glock 19, 3 detidos. Carlos foge.', location: 'Bar da Esquina', importance: 'critical' },
    { id: uuid(), investigation_id: INV.homicidio, event_datetime: '2026-02-02T03:15:00Z', event_type: 'crime', title: 'Homicídio de Vitor Mendes', description: '3 disparos de arma de fogo. Vítima encontrada na calçada.', location: 'Rua das Mangabeiras, 450', importance: 'critical' },
    { id: uuid(), investigation_id: INV.homicidio, event_datetime: '2026-02-02T03:25:00Z', event_type: 'evidence', title: 'Câmera registra Gol preto', description: 'Farmácia na Rua Caraça registra VW Gol preto (HRK-4***) fugindo', location: 'Rua Caraça', importance: 'high' },
    { id: uuid(), investigation_id: INV.homicidio, event_datetime: '2026-02-02T03:05:00Z', event_type: 'communication', title: 'Ligação suspeita', description: 'Rafael liga para Carlos (2min) 10 minutos antes do crime', importance: 'critical' },
    { id: uuid(), investigation_id: INV.lavagem, event_datetime: '2025-06-15T00:00:00Z', event_type: 'financial', title: 'Primeira transação suspeita', description: 'Compra de apartamento R$ 1.2M via Imobiliária Central. Comprador sem renda.', location: 'Savassi', importance: 'high' },
    { id: uuid(), investigation_id: INV.lavagem, event_datetime: '2026-01-28T00:00:00Z', event_type: 'investigation', title: 'Verificação de obras fantasma', description: 'Visita aos 3 endereços declarados pela Construtora Norte. Nenhuma obra.', location: 'Barreiro', importance: 'high' },
    { id: uuid(), investigation_id: INV.furto_veiculos, event_datetime: '2026-01-20T02:00:00Z', event_type: 'crime', title: 'Furto da Hilux SRX', description: 'Toyota Hilux furtada no Belvedere. Proprietário: A.J.M.', location: 'Belvedere', importance: 'medium' },
    { id: uuid(), investigation_id: INV.furto_veiculos, event_datetime: '2026-02-05T14:00:00Z', event_type: 'operation', title: 'Operação Desmanche - Drone', description: 'Imagens aéreas confirmam 8 veículos sendo desmanchados no galpão', location: 'Galpão Industrial - Barreiro', importance: 'critical' },
    { id: uuid(), investigation_id: INV.extorsao, event_datetime: '2026-02-05T10:00:00Z', event_type: 'depoimento', title: 'Denise presta depoimento', description: 'Dona da Padaria Sol relata 12 meses de extorsão, R$ 48.000 pagos', importance: 'critical' },
    { id: uuid(), investigation_id: INV.extorsao, event_datetime: '2026-02-07T17:45:00Z', event_type: 'evidence', title: 'Flagrante em vídeo', description: 'Câmera registra Wagner e Bruno cobrando na padaria', location: 'Padaria Sol', importance: 'critical' },
  ];

  await insert('intelink_timeline', timeline);
  console.log(`   ✅ ${timeline.length} timeline events created`);

  // ═══ 6. CROSS-CASE ALERTS ═══
  // Auto-generated by check_entity_duplicates trigger when entities with same CPF/phone
  // are inserted across investigations. Let's count what the trigger created.
  const { count: alertCount } = await fetch(`${SUPABASE_URL}/rest/v1/intelink_cross_case_alerts?select=id`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY!, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
  }).then(r => r.json()).then((rows: unknown[]) => ({ count: rows.length }));
  console.log(`🔀 Cross-case alerts auto-generated by trigger: ${alertCount}`);

  // ═══ SUMMARY ═══
  console.log('\n═══════════════════════════════════════');
  console.log('✅ SEED COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`📋 Investigations: 5`);
  console.log(`👤 Entities: ${entities.length}`);
  console.log(`🔗 Relationships: ${relationships.length}`);
  console.log(`📎 Evidence: ${evidence.length}`);
  console.log(`📅 Timeline: ${timeline.length}`);
  console.log(`🔀 Cross-case alerts: ${alertCount} (auto-generated by trigger)`);
  console.log('\nCross-investigation links:');
  console.log('  • CARLOS SILVA → Tráfico + Homicídio + Lavagem + Extorsão (4 cases)');
  console.log('  • VW GOL PRETO → Tráfico + Homicídio (vehicle at crime scene)');
  console.log('  • RUA MANGABEIRAS → Tráfico + Homicídio + Extorsão (geographic)');
  console.log('  • TELEFONE CHEFE → Tráfico + Lavagem + Extorsão + Furtos (comms)');
  console.log('  • AUTO PEÇAS JR → Lavagem + Furtos (organization)');
  console.log('  • ROBERTO FERNANDES → Lavagem + Furtos (person)');
}

seed().catch(console.error);
