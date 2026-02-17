/**
 * RAG Ingestion Script — Fetches GitHub commits and inserts to Supabase via direct Postgres.
 * Bypasses PostgREST schema cache by using pg directly.
 *
 * Usage: bun apps/egos-web/scripts/ingest-commits.ts
 */

import pg from 'pg';
import { Octokit } from 'octokit';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD!;
const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN!;

const OWNER = 'enioxt';
const REPOS = ['egos-lab', 'carteira-livre'];
const EMBEDDING_DIM = 768;

// Direct Postgres connection (bypasses PostgREST cache)
const DB_HOST = 'db.lhscgsqhiooyatkebose.supabase.co';
const pool = new pg.Pool({
  host: DB_HOST,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

if (!DB_PASSWORD) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}
if (!GITHUB_TOKEN) {
  console.error('❌ Missing GITHUB_TOKEN');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function generateEmbedding(text: string): number[] {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase());
  const embedding = new Array(EMBEDDING_DIM).fill(0);

  for (let i = 0; i < data.length; i++) {
    const idx = i % EMBEDDING_DIM;
    embedding[idx] += data[i] * Math.sin(i * 0.1 + data[i] * 0.01);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  return embedding;
}

interface GHCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
}

async function fetchCommits(repo: string, perPage = 100): Promise<GHCommit[]> {
  console.log(`📡 Fetching commits from ${OWNER}/${repo}...`);
  try {
    const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner: OWNER,
      repo,
      per_page: perPage,
    });
    console.log(`  ✅ Got ${commits.length} commits from ${repo}`);
    return commits;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Error fetching ${repo}:`, msg);
    return [];
  }
}

async function upsertCommit(client: pg.PoolClient, commit: GHCommit, repo: string): Promise<boolean> {
  const text = `[${repo}] ${commit.commit.message}`;
  const embedding = generateEmbedding(text);
  const embeddingStr = `[${embedding.join(',')}]`;

  try {
    await client.query(
      `INSERT INTO public.commits (sha, message, author, date, url, repo, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
       ON CONFLICT (sha) DO UPDATE SET
         message = EXCLUDED.message,
         embedding = EXCLUDED.embedding`,
      [
        commit.sha,
        commit.commit.message.split('\n')[0],
        commit.commit.author?.name || 'Unknown',
        commit.commit.author?.date || new Date().toISOString(),
        commit.html_url,
        `${OWNER}/${repo}`,
        embeddingStr,
      ]
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Upsert failed for ${commit.sha.slice(0, 7)}:`, msg);
    return false;
  }
}

async function main() {
  console.log('🚀 EGOS Lab — Commit Ingestion Pipeline (Direct PG)');
  console.log('═══════════════════════════════════════════');
  console.log(`  DB Host: ${DB_HOST}`);
  console.log(`  Repos: ${REPOS.join(', ')}`);
  console.log('');

  const client = await pool.connect();
  let totalIngested = 0;
  let totalFailed = 0;

  try {
    for (const repo of REPOS) {
      const commits = await fetchCommits(repo);

      for (const commit of commits) {
        const success = await upsertCommit(client, commit, repo);
        if (success) {
          totalIngested++;
          process.stdout.write(`\r  📥 ${repo}: ${totalIngested} ingested`);
        } else {
          totalFailed++;
        }
      }
      console.log('');
    }

    // Count
    const { rows } = await client.query('SELECT count(*) FROM public.commits');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Done! Ingested: ${totalIngested} | Failed: ${totalFailed}`);
    console.log(`📊 Total commits in DB: ${rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
