/**
 * 🦅 Eagle Eye — Viability Analyst (The "Venture Capitalist" AI)
 * 
 * Deep dive analysis for specific opportunities.
 * Generates: MVP Plan, Cost Estimate, Viability Score, Competitor Intel.
 */

import { analyzeWithAI } from '@egos-lab/shared';
// Using 'any' for match objects since OpportunityMatch from shared is incomplete
import { fetchGazetteText } from './fetch_gazettes';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, "../../../docs/eagle-eye-results");
const VIABILITY_DIR = path.join(DATA_DIR, "viability");

if (!fs.existsSync(VIABILITY_DIR)) {
    fs.mkdirSync(VIABILITY_DIR, { recursive: true });
}

export interface ViabilityReport {
    opportunity_id: string;
    timestamp: string;
    executive_summary: string;
    viability_score: number; // 0-100
    mvp_roadmap: string[];
    tech_stack_recommendation: string[];
    estimated_budget: {
        traditional_dev_hours: number;
        traditional_cost_brl: number;
        ai_accelerated_dev_hours: number;
        ai_accelerated_cost_brl: number;
        potential_margin_brl: number;
    };
    execution_capability: {
        can_we_execute: boolean;
        team_needed: string[];
        partnership_recommendation: string;
    };
    market_analysis: {
        competitors: string[];
        monetization_strategy: string;
        risks: string[];
    };
}

function buildViabilityPrompt(): string {
    return `Você é um CTO e Venture Capitalist experiente, especializado em GovTech e Licitações.
Sua missão é analisar um edital/oportunidade pública e criar um PLANO DE NEGÓCIOS RÁPIDO para uma empresa de software.

### OBJETIVO
Determinar se vale a pena disputar essa licitação e, se sim, COMO ganhar e entregar.

### ANÁLISE REQUERIDA
1. **Resumo Executivo**: O que eles querem em português simples?
2. **Score de Viabilidade (0-100)**:
   - 0-40: Furada (Edital viciado, valor baixo, prazo impossível).
   - 41-70: Arriscado, mas possível.
   - 71-100: "Filé Mignon" (Boa margem, escopo claro).
3. **Roadmap MVP**: Quais as 3-5 features CRÍTICAS que o software TEM que ter para ser aceito?
4. **Estimativa de Custo (AI-Accelerated Valuation)**:
   - **Custo Tradicional**: Quanto custaria numa Software House comum (Dev Sênior R$ 150/h).
   - **Custo Eagle Eye (AI-Native)**: Quanto custa usando IAs geradoras de código (Cursor, Windsurf, Gemini). Considere 5x-10x de produtividade.
   - **Margem Potencial**: A diferença é o nosso lucro ou vantagem competitiva no preço.
5. **Capacidade de Execução (Nós podemos fazer?)**:
   - Baseado no escopo, nós (Time Eagle Eye: Fullstack JS, AI, Automation) conseguimos entregar?
   - "Sim", "Parcialmente (Precisa de parceiro)", "Não (Engenharia Civil/Outros)".

### FORMATO DE SAÍDA (JSON Puro)
{
  "executive_summary": "Resumo...",
  "viability_score": 85,
  "mvp_roadmap": ["Feature 1", "Feature 2"],
  "tech_stack_recommendation": ["Node.js", "React", "Postgres"],
  "estimated_budget": {
    "traditional_dev_hours": 400,
    "traditional_cost_brl": 60000,
    "ai_accelerated_dev_hours": 80, // ~5x mais rápido
    "ai_accelerated_cost_brl": 12000,
    "potential_margin_brl": 48000
  },
  "execution_capability": {
    "can_we_execute": true, // ou false
    "team_needed": ["Fullstack Dev", "AI Engineer"],
    "partnership_recommendation": "Nenhuma, fazemos in-house"
  },
  "market_analysis": {
    "competitors": ["Empresa A", "Empresa B"],
    "monetization_strategy": "SaaS B2G...",
    "risks": ["Risco 1"]
  }
}`;
}

export async function generateViabilityReport(match: any, fullText: string): Promise<ViabilityReport> {
    console.log(`🧠 Generating Viability Report for: ${match.pattern_name}...`);

    const truncatedText = fullText.substring(0, 20000); // 20k chars context

    const result = await analyzeWithAI({
        systemPrompt: buildViabilityPrompt(),
        userPrompt: `ANALISE ESTA OPORTUNIDADE:\n\nID: ${match.id}\nTítulo: ${match.pattern_name}\nOrgão: ${match.source_gazette?.territory_name}\n\nTEXTO DO EDITAL/DIÁRIO:\n${truncatedText}`,
        maxTokens: 4000,
        temperature: 0.4
    });

    try {
        const parsed = JSON.parse(result.content);
        return {
            opportunity_id: match.id || 'unknown',
            timestamp: new Date().toISOString(),
            ...parsed
        };
    } catch (e) {
        console.error("Failed to parse Viability Report JSON", e);
        throw new Error("AI output parsing failed");
    }
}

// ═══════════════════════════════════════════════════════════
// CLI Entry Point
// ═══════════════════════════════════════════════════════════

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const id = args[0]; // Pass ID or "latest"

    if (!id) {
        console.error("Usage: bun analyze_viability.ts <opportunity_id> | latest");
        process.exit(1);
    }

    // 1. Load Data
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json")).reverse();
    if (files.length === 0) {
        console.error("No data found.");
        process.exit(1);
    }

    // Load latest scan for simplicity (in real app, use ID to find globally)
    const latestScan = JSON.parse(fs.readFileSync(path.join(DATA_DIR, files[0]), 'utf-8'));
    let targetMatch: any = null;

    // Flatten to find ID
    const matches = latestScan.results.flatMap((r: any, rIdx: number) =>
        (r.matches || []).map((m: any, mIdx: number) => ({
            ...m,
            // Reconstruct ID logic from app.js if needed, or assume passed ID matches app.js ID
            // For CLI "latest", just pick the first one
            extracted_id: `0-${rIdx}-${mIdx}`,
            source_gazette: r.gazette
        }))
    );

    if (id === 'latest') {
        targetMatch = matches[0];
    } else {
        // TODO: Implement proper ID lookup across all files if needed
        // For now, simple check
        targetMatch = matches.find((m: any) => m.id === id || m.extracted_id === id);
    }

    if (!targetMatch) {
        console.error("Opportunity not found.");
        process.exit(1);
    }

    console.log(`Found: ${targetMatch.pattern_name} (${targetMatch.source_gazette?.territory_name})`);

    // 2. Fetch Full Text (if needed)
    let text = targetMatch.source_gazette?.text || "";
    if (text.length < 500 && targetMatch.source_gazette?.url) {
        // Try fetch if text is snippet
        try {
            text = await fetchGazetteText(targetMatch.source_gazette);
        } catch (e) {
            console.warn("Could not fetch full text, using snippet.");
        }
    }

    // 3. Analyze
    const report = await generateViabilityReport(targetMatch, text);

    // 4. Save
    const filename = path.join(VIABILITY_DIR, `${targetMatch.extracted_id || 'report'}.json`);
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));

    console.log("✅ Report Generated:");
    console.log(JSON.stringify(report, null, 2));
    console.log(`💾 Saved to: ${filename}`);
}
