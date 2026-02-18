import type { VercelRequest, VercelResponse } from './_types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GHCommitItem {
  sha: string;
  commit: { message: string; author: { name: string; date: string } };
  html_url: string;
  author?: { login: string; avatar_url: string } | null;
  stats?: { additions: number; deletions: number; total: number };
  files?: { filename: string; additions: number; deletions: number; status: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const listRes = await fetch(
      'https://api.github.com/repos/enioxt/egos-lab/commits?per_page=30',
      { headers }
    );

    if (!listRes.ok) {
      return res.status(listRes.status).json({ error: 'GitHub API error' });
    }

    const list: GHCommitItem[] = await listRes.json();

    const detailed = await Promise.all(
      list.slice(0, 30).map(async (c: GHCommitItem) => {
        try {
          const detailRes = await fetch(
            `https://api.github.com/repos/enioxt/egos-lab/commits/${c.sha}`,
            { headers }
          );
          if (detailRes.ok) {
            const detail: GHCommitItem = await detailRes.json();
            return {
              sha: c.sha,
              message: c.commit.message,
              author: c.commit.author.name,
              author_login: c.author?.login || null,
              author_avatar: c.author?.avatar_url || null,
              date: c.commit.author.date,
              url: c.html_url,
              stats: detail.stats || { additions: 0, deletions: 0, total: 0 },
              files: (detail.files || []).slice(0, 20).map((f) => ({
                filename: f.filename,
                additions: f.additions,
                deletions: f.deletions,
                status: f.status,
              })),
            };
          }
        } catch { /* ignore individual commit errors */ }
        return {
          sha: c.sha,
          message: c.commit.message,
          author: c.commit.author.name,
          author_login: c.author?.login || null,
          author_avatar: c.author?.avatar_url || null,
          date: c.commit.author.date,
          url: c.html_url,
          stats: { additions: 0, deletions: 0, total: 0 },
          files: [],
        };
      })
    );

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(detailed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('GitHub proxy error:', msg);
    return res.status(500).json({ error: msg });
  }
}
