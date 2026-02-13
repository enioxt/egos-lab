/**
 * 📂 Idea Categorizer — Sort docs/plans/ into proper categories
 * 
 * Categories:
 *   business/  — Actionable business/product ideas
 *   tech/      — Tech research, frameworks, architecture
 *   personal/  — Personal growth, spirituality, family
 *   police/    — Police/investigation work
 *   archive/   — Noise, duplicates, unrelated
 * 
 * Usage: npx tsx scripts/categorize_ideas.ts
 */

import { readdirSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const PLANS_DIR = join(import.meta.dirname ?? '.', '..', 'docs', 'plans');

// ═══════════════════════════════════════════════════════════
// Category rules (by filename pattern matching)
// ═══════════════════════════════════════════════════════════

interface CategoryRule {
    category: string;
    patterns: RegExp[];
}

const RULES: CategoryRule[] = [
    // ── PERSONAL (clear personal/spiritual/family topics) ──
    {
        category: 'personal',
        patterns: [
            /krishna|dharma|espiritual|despertar/i,
            /ansiedade|silêncio máximo|meditaç/i,
            /szondi|jung|inconsciente|individuação/i,
            /blue zones|vida nas/i,
            /filho|criança|presentes.*criança|presentes.*filho|educativos/i,
            /sereias.*sexualidade|poder transformador da mulher/i,
            /ego e despertar|rito de passagem|autoconfiança|menos aprovação/i,
            /desintoxicação algorítmica/i,
            /ciclo de autossabotagem/i,
            /neuroplasticidade infantil/i,
            /superdotação.*notívagos|hipersensibilidade/i,
            /retrospectiva psicológico/i,
            /festival coletivo de música/i,
            /canais.*youtube.*famíl|canais educativos/i,
            /manga.*psicodelia|arte.*psicodélic/i,
            /criando conceito artístico/i,
            /desmistificando.*marxista/i,
            /roteiro.*estudo.*atlas|atlas.*revolta/i,
            /melhores entrevistas intelectuais/i,
            /solução fase elétrica.*lego/i,
            /clash royale|deck clash/i,
            /rickdaum.*cowboy/i,
            /advogado do diabo/i,
            /estatísticas.*mortalidade.*encarceramento/i,
            /maconha.*esquizofrenia/i,
            /guia.*estudo.*ultra.aprendizado/i,
            /dicas.*controle.*ansiedade/i,
            /estado de silêncio/i,
            /canais.*youtube/i,
            /gene foxp3/i,
            /habeas corpus.*cultivo/i,
            /guia saeco|dicas.*moedor/i,
            /robôs mais atuais/i,
            /governo milei/i,
            /stf.*controvérsias|stf.*decisões/i,
            /isenções fiscais estaduais/i,
            /astrologia/i,
            /terapeutas de casal/i,
            /problemas.*resoluções financeiras/i,
            /ofertas black friday/i,
            /organizar e melhorar ideias/i,
        ],
    },

    // ── POLICE (investigation/career) ──
    {
        category: 'police',
        patterns: [
            /investigador|investigação|salários baixos.*responsabilidade/i,
            /valorização.*investigador/i,
            /TEPT.*polici|polici.*TEPT/i,
            /pesquisa TEPT/i,
            /relatório.*investigação.*criminal/i,
            /rastreamento.*suspeitos/i,
            /lavagem de dinheiro|rede familiar/i,
            /telemáticos.*instagram/i,
            /construção.*tanque.*furtivo/i,
            /DEPIX.*privacidade/i,
        ],
    },

    // ── TECH (frameworks, AI, architecture) ──
    {
        category: 'tech',
        patterns: [
            /agente.*workflows.*mcp|integrando.*mcp|agentes.*mcp/i,
            /frameworks.*agentes.*ia|sdks.*agentes/i,
            /prompt engineering|meta prompt|aprimorando prompt/i,
            /arquitetura.*agent.centric|transformação.*agent/i,
            /nexus.*plataformas|node.*frameworks/i,
            /workflow.*qa.*automatizado/i,
            /padrão agents\.md/i,
            /plano.*ação.*sistema.*padrões/i,
            /organização.*tarefas.*agente/i,
            /otimizando agente.*inteligência/i,
            /análise.*repositório fantasma/i,
            /contratos inteligentes.*base/i,
            /combate.*ataques sybil/i,
            /fluxo anônimo.*conflito.*ids/i,
            /governança.*reputação dinâmica/i,
            /echelon prime/i,
            /análise detalhada.*tana/i,
            /espiral de escuta/i,
            /chat.*ia.*intelink/i,
            /egos.*melhorias|egos.*tokenomics|egos.*ética|egos.*protocolo/i,
            /vamos falar sobre meta prompts/i,
            /industrial prompt/i,
            /refinando.*ia ética/i,
            /análise github/i,
            /construindo agente.*dota/i,
            /desenvolvedor full stack/i,
            /desbloqueio.*consultoria ia/i,
            /construindo plataforma financeira/i,
            /ia.*gargalos|ia.*riscos|ia.*estratégia/i,
            /ia.*diálogo.*resolução/i,
            /análise.*projeto.*risco.*ia/i,
        ],
    },

    // ── BUSINESS (product/startup/commerce ideas) ──
    {
        category: 'business',
        patterns: [
            /plataforma saas|saas com ia/i,
            /plataformas.*compras|compras patos/i,
            /cloud legal|protótipo cloud/i,
            /chacreamento/i,
            /estoque baratas|soluções.*estoque/i,
            /análise.*gastos|ferramenta.*gastos/i,
            /pagamentos asaas|integração asaas/i,
            /registro.*marca.*inpi/i,
            /nota fiscal|nfc-e/i,
            /revisor jornalístico/i,
            /análise.*post.*mercado/i,
            /cálculo roe|roe.*insumos/i,
            /instrutorgo|app.*autoescola/i,
            /plano de negócios/i,
            /frozen food|negócio.*alimentos/i,
            /cardápio.*cafeteria|cardápio.*reorganização|cafeterias.*ponta/i,
            /importação.*kimonos/i,
            /proposta.*expansão.*steak/i,
            /proposta.*parceria.*lucros/i,
            /negociação.*compartilhamento/i,
            /projeção.*parcelas/i,
            /custos.*cursos.*agronômicos/i,
            /oficina automotiva/i,
            /ferramenta.*anti.fraude|anti.fraude.*cripto/i,
            /detecção.*comentários/i,
            /diálogo escalável/i,
            /criar apk controle/i,
            /agentes.*branding.*design/i,
            /melhorando.*qe/i,
        ],
    },
];

// ═══════════════════════════════════════════════════════════
// Categorizer
// ═══════════════════════════════════════════════════════════

function categorize(filename: string): string {
    for (const rule of RULES) {
        for (const pattern of rule.patterns) {
            if (pattern.test(filename)) {
                return rule.category;
            }
        }
    }
    // Grok files without descriptive names → archive
    if (/^Grok-_\d+/i.test(filename)) return 'archive';

    return 'archive'; // Default uncategorized → archive
}

function run(): void {
    console.log('📂 Idea Categorizer — Sorting docs/plans/');
    console.log('═══════════════════════════════════════════════════════════');

    const categories = ['business', 'tech', 'personal', 'police', 'archive'];
    for (const cat of categories) {
        mkdirSync(join(PLANS_DIR, cat), { recursive: true });
    }

    const files = readdirSync(PLANS_DIR).filter(f => f.endsWith('.md'));
    const stats: Record<string, number> = { business: 0, tech: 0, personal: 0, police: 0, archive: 0 };

    for (const file of files) {
        const category = categorize(file);
        stats[category]++;

        const source = join(PLANS_DIR, file);
        const target = join(PLANS_DIR, category, file);

        if (!existsSync(target)) {
            renameSync(source, target);
        }

        const emoji = { business: '💼', tech: '⚙️', personal: '🧘', police: '🔍', archive: '📦' }[category] ?? '❓';
        console.log(`${emoji} [${category.toUpperCase().padEnd(8)}] ${file}`);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Category Summary:');
    console.log(`   💼 Business:  ${stats.business}`);
    console.log(`   ⚙️  Tech:      ${stats.tech}`);
    console.log(`   🧘 Personal:  ${stats.personal}`);
    console.log(`   🔍 Police:    ${stats.police}`);
    console.log(`   📦 Archive:   ${stats.archive}`);
    console.log(`   Total:        ${files.length}`);
}

run();
