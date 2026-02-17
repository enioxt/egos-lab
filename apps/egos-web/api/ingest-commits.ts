/**
 * AI-Enriched Commit Ingestion Endpoint
 * 
 * Fetches commits from GitHub, analyzes with Gemini 2.0 Flash via OpenRouter,
 * and stores enriched data in Supabase. Can be called by:
 * - GitHub webhook (on push)
 * - Vercel cron (scheduled)
 * - Manual trigger (POST /api/ingest-commits)
 * 
 * Env vars (set in Vercel dashboard):
 * - SUPABASE_URL (egos-lab project)
 * - SUPABASE_SERVICE_ROLE_KEY
 * - GITHUB_TOKEN
 * - OPENROUTER_API_KEY
 */

import type { VercelRequest, VercelResponse } from './_types';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = 'google/gemini-2.0-flash-001';

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
  stats?: { additions: number; deletions: number; total: number };
  files?: { filename: string; status: string; additions: number; deletions: number }[];
}

interface EnrichedCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo: string;
  // AI enrichment fields
  category: string;
  tags: string[];
  summary: string;
  tech_debt_flag: boolean;
  backlog_items: string[];
  impact_score: number;
}

interface AIAnalysis {
  commits: {
    sha: string;
    category: string;
    tags: string[];
    summary: string;
    tech_debt: boolean;
    backlog_items: string[];
    impact_score: number;
  }[];
  timeline_insights: string;
  governance_notes: string[];
}

async function fetchGitHubCommits(repo: string, perPage = 30): Promise<GitHubCommit[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?per_page=${perPage}`,
    { headers }
  );
  if (!res.ok) return [];
  return res.json();
}

async function analyzeCommitsWithAI(commits: GitHubCommit[], repo: string): Promise<AIAnalysis | null> {
  if (!OPENROUTER_API_KEY || commits.length === 0) return null;

  const commitList = commits.map(c => ({
    sha: c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    author: c.commit.author?.name || 'Unknown',
    date: c.commit.author?.date || '',
  }));

  const systemPrompt = `You are EGOS Intelligence, an AI that analyzes git commit history for software projects.
You classify commits, detect patterns, identify technical debt, and suggest backlog items.

Categories: feat, fix, docs, refactor, security, infra, test, chore, perf
Tags: examples: auth, ui, api, database, agent, deploy, ci, dx, ux, config

Rules:
- Be precise and technical
- impact_score: 1-10 based on scope and importance
- tech_debt: true only if commit message suggests shortcuts, TODOs, or workarounds
- backlog_items: concrete follow-up tasks suggested by the commit pattern
- governance_notes: any SSOT violations, duplicate patterns, or governance concerns
- timeline_insights: 1-2 sentence summary of the project trajectory

Respond ONLY in valid JSON.`;

  const userPrompt = `Analyze these ${commits.length} commits from ${repo}:

${JSON.stringify(commitList, null, 2)}

Return JSON:
{
  "commits": [{ "sha": "abc1234", "category": "feat", "tags": ["agent", "platform"], "summary": "one line", "tech_debt": false, "backlog_items": [], "impact_score": 7 }],
  "timeline_insights": "...",
  "governance_notes": []
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://egos.ia.br',
        'X-Title': 'EGOS Activity Intelligence',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.error('OpenRouter error:', await res.text());
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as AIAnalysis;
  } catch (err) {
    console.error('AI analysis error:', err);
    return null;
  }
}

async function upsertToSupabase(commits: EnrichedCommit[]): Promise<number> {
  if (!SUPABASE_URL || !SUPABASE_KEY || commits.length === 0) return 0;

  let upserted = 0;
  for (const commit of commits) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/commits`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        sha: commit.sha.slice(0, 7),
        message: commit.message.split('\n')[0],
        author: commit.author,
        date: commit.date,
        url: commit.url,
        repo: commit.repo,
      }),
    });
    if (res.ok) upserted++;
  }
  return upserted;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const repos = ['enioxt/egos-lab'];
  const results: Record<string, unknown> = {};

  for (const repo of repos) {
    const commits = await fetchGitHubCommits(repo);
    if (commits.length === 0) {
      results[repo] = { fetched: 0, enriched: 0, stored: 0 };
      continue;
    }

    // AI enrichment
    const analysis = await analyzeCommitsWithAI(commits, repo);

    // Build enriched commits
    const enriched: EnrichedCommit[] = commits.map(c => {
      const sha7 = c.sha.slice(0, 7);
      const aiData = analysis?.commits.find(a => a.sha === sha7);

      return {
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name || 'Unknown',
        date: c.commit.author?.date || new Date().toISOString(),
        url: c.html_url,
        repo,
        category: aiData?.category || 'chore',
        tags: aiData?.tags || [],
        summary: aiData?.summary || c.commit.message.split('\n')[0],
        tech_debt_flag: aiData?.tech_debt || false,
        backlog_items: aiData?.backlog_items || [],
        impact_score: aiData?.impact_score || 5,
      };
    });

    // Store in Supabase
    const stored = await upsertToSupabase(enriched);

    results[repo] = {
      fetched: commits.length,
      enriched: analysis ? analysis.commits.length : 0,
      stored,
      timeline_insights: analysis?.timeline_insights || null,
      governance_notes: analysis?.governance_notes || [],
    };
  }

  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
