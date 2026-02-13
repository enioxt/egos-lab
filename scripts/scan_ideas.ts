/**
 * 🔍 Idea Scanner — Auto-ingest from compiladochats
 * 
 * Scans /home/enio/Downloads/compiladochats/ for new idea files
 * Classifies them as: business_idea | personal | noise
 * Copies business ideas to docs/plans/
 * 
 * Usage:
 *   npx tsx scripts/scan_ideas.ts          # Full scan
 *   npx tsx scripts/scan_ideas.ts --dry    # Dry run (no copies)
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename, extname } from 'node:path';

// ═══════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════

const SOURCE_DIR = '/home/enio/Downloads/compiladochats';
const TARGET_DIR = join(import.meta.dirname ?? '.', '..', 'docs', 'plans');
const MANIFEST_PATH = join(import.meta.dirname ?? '.', '..', '.idea-manifest.json');

// File patterns to scan (AI chat exports)
const SCAN_PATTERNS = [
    /^ChatGPT-.*\.md$/i,
    /^Gemini-.*\.md$/i,
    /^Claude-.*\.md$/i,
    /^Grok-.*\.md$/i,
    /^DeepSeek-.*\.md$/i,
];

// Files to always skip
const SKIP_EXTENSIONS = ['.pdf', '.zip', '.csv', '.xlsx', '.jnlp', '.txt', '.png', '.jpg', '.webp'];

// Business idea keywords (PT-BR)
const BUSINESS_KEYWORDS = [
    'saas', 'plataforma', 'licitação', 'marketplace', 'api',
    'startup', 'receita', 'monetização', 'mvp', 'produto',
    'negócio', 'empreendimento', 'compras', 'sistema',
    'automação', 'gestão', 'compliance', 'segurança',
    'inteligência artificial', 'ia', 'machine learning',
    'blockchain', 'fintech', 'edtech', 'healthtech',
    'cloud', 'integração', 'erp', 'crm',
];

const PERSONAL_KEYWORDS = [
    'ansiedade', 'meditação', 'espiritual', 'filho', 'criança',
    'presentes', 'música', 'festival', 'yoga', 'dharma',
    'krishna', 'silêncio', 'ego ', 'despertar',
    'blue zones', 'teste', 'dieta', 'educativos',
];

// ═══════════════════════════════════════════════════════════
// Manifest (tracks processed files by hash)
// ═══════════════════════════════════════════════════════════

interface ManifestEntry {
    filename: string;
    hash: string;
    classification: 'business_idea' | 'personal' | 'noise' | 'unclassified';
    scanned_at: string;
    copied: boolean;
    size_bytes: number;
}

interface Manifest {
    version: string;
    last_scan: string;
    source_dir: string;
    entries: Record<string, ManifestEntry>;
}

function loadManifest(): Manifest {
    if (existsSync(MANIFEST_PATH)) {
        return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    }
    return {
        version: '1.0.0',
        last_scan: '',
        source_dir: SOURCE_DIR,
        entries: {},
    };
}

function saveManifest(manifest: Manifest): void {
    manifest.last_scan = new Date().toISOString();
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function hashFile(filepath: string): string {
    const content = readFileSync(filepath);
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// ═══════════════════════════════════════════════════════════
// Classifier
// ═══════════════════════════════════════════════════════════

function classifyFile(filepath: string): 'business_idea' | 'personal' | 'noise' {
    const content = readFileSync(filepath, 'utf-8').toLowerCase();
    const filename = basename(filepath).toLowerCase();

    // Count keyword hits
    let businessScore = 0;
    let personalScore = 0;

    for (const kw of BUSINESS_KEYWORDS) {
        const regex = new RegExp(kw, 'gi');
        const matches = content.match(regex);
        if (matches) businessScore += matches.length;
    }

    for (const kw of PERSONAL_KEYWORDS) {
        const regex = new RegExp(kw, 'gi');
        const matches = content.match(regex);
        if (matches) personalScore += matches.length;
    }

    // Filename hints
    if (filename.includes('plataforma') || filename.includes('compras') || filename.includes('saas') || filename.includes('otimização')) {
        businessScore += 10;
    }
    if (filename.includes('ansiedade') || filename.includes('espiritual') || filename.includes('filho') || filename.includes('krishna')) {
        personalScore += 10;
    }

    // Classify
    if (businessScore > personalScore && businessScore > 3) return 'business_idea';
    if (personalScore > businessScore && personalScore > 3) return 'personal';

    // If short file (< 1KB), it's noise
    const stat = statSync(filepath);
    if (stat.size < 1024) return 'noise';

    // Ambiguous — lean towards business if any score
    if (businessScore > 0) return 'business_idea';
    return 'noise';
}

// ═══════════════════════════════════════════════════════════
// Scanner
// ═══════════════════════════════════════════════════════════

function scanIdeas(dryRun: boolean = false): void {
    console.log('🔍 Idea Scanner — compiladochats Auto-Ingestion');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📁 Source: ${SOURCE_DIR}`);
    console.log(`📂 Target: ${TARGET_DIR}`);
    console.log(`🏷️  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('');

    if (!existsSync(SOURCE_DIR)) {
        console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }

    const manifest = loadManifest();
    const files = readdirSync(SOURCE_DIR);

    let newFiles = 0;
    let businessIdeas = 0;
    let personalFiles = 0;
    let noiseFiles = 0;
    let alreadyScanned = 0;

    for (const file of files) {
        const ext = extname(file).toLowerCase();

        // Skip non-scannable files
        if (SKIP_EXTENSIONS.includes(ext)) continue;

        // Skip files that don't match AI chat patterns
        const matchesPattern = SCAN_PATTERNS.some(p => p.test(file));
        if (!matchesPattern) continue;

        const filepath = join(SOURCE_DIR, file);
        const hash = hashFile(filepath);

        // Skip already processed (by hash)
        if (manifest.entries[hash]) {
            alreadyScanned++;
            continue;
        }

        newFiles++;
        const stat = statSync(filepath);
        const classification = classifyFile(filepath);

        // Save to manifest
        manifest.entries[hash] = {
            filename: file,
            hash,
            classification,
            scanned_at: new Date().toISOString(),
            copied: false,
            size_bytes: stat.size,
        };

        const emoji = { business_idea: '💡', personal: '🧘', noise: '🗑️' }[classification];
        console.log(`${emoji} [${classification.toUpperCase().padEnd(14)}] ${file}`);

        // Copy business ideas to docs/plans/
        if (classification === 'business_idea') {
            businessIdeas++;
            const targetPath = join(TARGET_DIR, file);

            if (!existsSync(targetPath)) {
                if (!dryRun) {
                    copyFileSync(filepath, targetPath);
                    manifest.entries[hash].copied = true;
                    console.log(`   ✅ Copied to docs/plans/`);
                } else {
                    console.log(`   🔄 Would copy to docs/plans/`);
                }
            } else {
                console.log(`   ℹ️  Already exists in docs/plans/`);
                manifest.entries[hash].copied = true;
            }
        } else if (classification === 'personal') {
            personalFiles++;
        } else {
            noiseFiles++;
        }
    }

    // Save manifest
    if (!dryRun) {
        saveManifest(manifest);
    }

    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Scan Summary:');
    console.log(`   Total AI chat files scanned: ${newFiles + alreadyScanned}`);
    console.log(`   New files:          ${newFiles}`);
    console.log(`   Already processed:  ${alreadyScanned}`);
    console.log(`   💡 Business ideas:  ${businessIdeas}`);
    console.log(`   🧘 Personal:        ${personalFiles}`);
    console.log(`   🗑️  Noise:           ${noiseFiles}`);
    console.log(`   Total in manifest:  ${Object.keys(manifest.entries).length}`);

    if (dryRun) {
        console.log('\n⚠️  DRY RUN — no files were copied or manifest updated');
    }
}

// ═══════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════

const isDryRun = process.argv.includes('--dry');
scanIdeas(isDryRun);
