#!/usr/bin/env node
/**
 * INTELINK Document Extraction Test (Full)
 * Tests PDF extraction + LLM analysis with multiple models
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '../apps/intelink/.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val.length) {
            process.env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MODELS = [
    { name: 'Gemini 2.0 Flash', model_id: 'google/gemini-2.0-flash-exp:free', max_tokens: 8192 },
    { name: 'GPT-4o Mini', model_id: 'openai/gpt-4o-mini', max_tokens: 4096 },
    { name: 'Llama 3.3 70B', model_id: 'meta-llama/llama-3.3-70b-instruct', max_tokens: 4096 },
    { name: 'DeepSeek V3', model_id: 'deepseek/deepseek-chat', max_tokens: 4096 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SYSTEM_PROMPT = `Você é um Analista de Inteligência Criminal Sênior especializado em análise de documentos policiais brasileiros.

Sua tarefa é extrair TODAS as entidades e relacionamentos de documentos como:
- REDS (Registro de Eventos de Defesa Social) - Ocorrências da PM/PC/Bombeiros de MG
- Relatórios de Serviço / Boletins de Ocorrência
- Depoimentos
- Comunicações Internas

REGRAS DE EXTRAÇÃO:

1. ENTIDADES (extraia TODAS que encontrar):
   - PERSON: Nome completo, CPF, RG, vulgo/apelido, papel (suspeito, vítima, testemunha, autor, policial)
   - VEHICLE: Placa, modelo, cor, marca, chassi, renavam
   - LOCATION: Endereço completo, bairro, cidade, coordenadas se houver
   - ORGANIZATION: Nome, CNPJ, tipo (empresa, facção, quadrilha)
   - FIREARM: Tipo, calibre, marca, número de série
   - PHONE: Número completo com DDD

2. RELACIONAMENTOS:
   - Identifique TODAS as conexões entre entidades
   - Tipos: DRIVING, OWNER, ACCOMPLICE, VICTIM_OF, SEEN_AT, LIVES_AT, WORKS_AT, FAMILY, PHONE_CONTACT, SUSPECT_OF, WITNESS_OF

3. INSIGHTS:
   - Padrões suspeitos
   - Possíveis conexões com outros crimes
   - Informações que merecem investigação adicional

FORMATO DE SAÍDA (JSON estrito):
{
  "document_type": "reds|boletim|relatorio|depoimento|comunicacao",
  "numero_ocorrencia": "número do BO se houver",
  "data_fato": "data do fato",
  "natureza": "tipo do crime",
  "summary": "Resumo executivo em 2-3 frases",
  "entities": [
    {
      "type": "PERSON|VEHICLE|LOCATION|ORGANIZATION|FIREARM|PHONE",
      "name": "NOME EM MAIÚSCULAS",
      "role": "suspeito|vítima|testemunha|autor|policial|proprietário",
      "confidence": 0.95,
      "metadata": {
        "cpf": "000.000.000-00",
        "rg": "MG-00.000.000",
        "vulgo": "APELIDO",
        "idade": 30,
        "telefone": "(31) 99999-9999",
        "endereco": "Rua...",
        "placa": "ABC1D23",
        "descricao": "características físicas ou outras informações"
      }
    }
  ],
  "relationships": [
    {
      "source": "NOME ENTIDADE 1",
      "target": "NOME ENTIDADE 2",
      "type": "ACCOMPLICE|SUSPECT_OF|VICTIM_OF|WITNESS_OF|FAMILY|...",
      "description": "Contexto da relação",
      "confidence": 0.9
    }
  ],
  "timeline": [
    {
      "datetime": "2025-01-15 14:30",
      "description": "O que aconteceu",
      "entities_involved": ["NOME1", "NOME2"]
    }
  ],
  "insights": ["Insight 1", "Insight 2"],
  "warnings": ["Dado incompleto 1", "CPF inválido"]
}

IMPORTANTE:
- Retorne APENAS o JSON, sem markdown, sem explicações
- Use MAIÚSCULAS para nomes
- Confidence: 1.0 = dado explícito, 0.7 = inferido
- NÃO invente dados`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PDF EXTRACTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function extractTextFromPDF(filePath) {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    
    return { text: fullText, pages: doc.numPages };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LLM CALL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function callLLM(text, model) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');
    
    const start = Date.now();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://intelink.app',
            'X-Title': 'Intelink Document Extraction'
        },
        body: JSON.stringify({
            model: model.model_id,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Analise o Boletim de Ocorrência abaixo e extraia todas as informações:\n\n${text}` }
            ],
            max_tokens: model.max_tokens,
            temperature: 0.1
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const elapsed = Date.now() - start;
    
    // Parse JSON
    let parsed;
    try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        parsed = JSON.parse(jsonStr.trim());
    } catch (e) {
        parsed = { error: 'JSON parse failed', raw: content.substring(0, 1000) };
    }
    
    return { ...parsed, _model: model.name, _time_ms: elapsed, _tokens: data.usage };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRINT RESULTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function printResult(result) {
    if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
        if (result.raw) console.log(`   Raw: ${result.raw.substring(0, 200)}...`);
        return;
    }
    
    console.log(`   ⏱️  ${result._time_ms}ms`);
    console.log(`   📋 Tipo: ${result.document_type || 'N/A'}`);
    console.log(`   🔢 BO: ${result.numero_ocorrencia || 'N/A'}`);
    console.log(`   📅 Data: ${result.data_fato || 'N/A'}`);
    console.log(`   ⚖️  Natureza: ${result.natureza || 'N/A'}`);
    console.log(`   📝 Resumo: ${(result.summary || '').substring(0, 200)}...`);
    
    console.log(`\n   👥 ENTIDADES (${result.entities?.length || 0}):`);
    (result.entities || []).forEach(e => {
        console.log(`      [${e.type}] ${e.name} (${e.role || 'N/A'}) - conf: ${e.confidence}`);
        if (e.metadata) {
            const meta = Object.entries(e.metadata)
                .filter(([k, v]) => v && v !== 'N/A' && v !== '')
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
            if (meta) console.log(`         ${meta}`);
        }
    });
    
    console.log(`\n   🔗 RELACIONAMENTOS (${result.relationships?.length || 0}):`);
    (result.relationships || []).forEach(r => {
        console.log(`      ${r.source} → [${r.type}] → ${r.target}`);
        if (r.description) console.log(`         "${r.description}"`);
    });
    
    if (result.timeline?.length) {
        console.log(`\n   ⏰ TIMELINE (${result.timeline.length}):`);
        result.timeline.forEach(t => {
            console.log(`      ${t.datetime || 'N/A'}: ${t.description}`);
        });
    }
    
    if (result.insights?.length) {
        console.log(`\n   💡 INSIGHTS:`);
        result.insights.forEach(i => console.log(`      • ${i}`));
    }
    
    if (result.warnings?.length) {
        console.log(`\n   ⚠️  WARNINGS:`);
        result.warnings.forEach(w => console.log(`      • ${w}`));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
    console.log('\n🔍 INTELINK Document Extraction Test\n');
    console.log('═'.repeat(60));
    
    // Check API key
    if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not set!');
        process.exit(1);
    }
    console.log('✅ OpenRouter API key configured\n');
    
    // Test files
    const testFiles = [
        '/home/enio/Downloads/relatorio.pdf',
        '/home/enio/Downloads/relatorio1.pdf',
        '/home/enio/Downloads/relatorio2.pdf',
    ].filter(f => fs.existsSync(f));
    
    console.log(`📄 Found ${testFiles.length} test PDFs\n`);
    
    const allResults = {};
    
    // Test each file with each model
    for (const filePath of testFiles) {
        const fileName = path.basename(filePath);
        console.log('\n' + '═'.repeat(60));
        console.log(`📄 ${fileName}`);
        console.log('═'.repeat(60));
        
        // Extract text
        console.log('\n📖 Extracting text...');
        let text, pages;
        try {
            const extracted = await extractTextFromPDF(filePath);
            text = extracted.text;
            pages = extracted.pages;
            console.log(`   ✅ ${pages} pages, ${text.length} characters`);
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
            continue;
        }
        
        allResults[fileName] = { text_length: text.length, pages, models: {} };
        
        // Test with each model
        for (const model of MODELS) {
            console.log(`\n🤖 ${model.name}`);
            console.log('-'.repeat(40));
            
            try {
                const result = await callLLM(text, model);
                allResults[fileName].models[model.name] = result;
                printResult(result);
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
                allResults[fileName].models[model.name] = { error: e.message };
            }
            
            // Rate limit
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    
    // Test Free Mode
    console.log('\n' + '═'.repeat(60));
    console.log('📝 MODO LIVRE (Free Mode)');
    console.log('═'.repeat(60));
    
    const freeText = `
    Ontem por volta das 15h, eu estava na Praça Sete quando vi o JOÃO DA SILVA, 
    vulgo "JOÃOZINHO", que mora na Rua das Flores, 123, Bairro Centro, BH.
    Ele estava acompanhado de uma mulher chamada MARIA SOUZA, sua namorada.
    Os dois entraram em um GOL PRATA, placa ABC-1D23.
    João é conhecido por tráfico na região e já foi preso antes por 157 (roubo).
    O telefone dele é (31) 99999-8888.
    Ouvi ele falando que ia encontrar o PEDRO SILVA no bar do Zé, na Rua Augusta, 456.
    `;
    
    console.log('\n📝 Texto de entrada:');
    console.log(freeText);
    
    const model = MODELS[0];
    console.log(`\n🤖 Testing with ${model.name}...`);
    
    try {
        const result = await callLLM(freeText, model);
        printResult(result);
        allResults['FREE_MODE'] = result;
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
    
    // Save results
    const outputPath = path.join(__dirname, `extraction-results-${Date.now()}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
    console.log(`\n📁 Results saved to: ${outputPath}`);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Test Complete!');
    console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);
