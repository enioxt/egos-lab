import type { VercelRequest, VercelResponse } from './_types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const username = req.query.username as string;
  if (!username) {
    return res.status(400).json({ error: 'username query param required' });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    // Fetch user's public repos (sorted by recently pushed)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=12&type=owner`,
      { headers }
    );
    if (!reposRes.ok) {
      return res.status(reposRes.status).json({ error: 'GitHub API error' });
    }
    const repos = await reposRes.json();

    // Fetch user's recent events (public activity)
    const eventsRes = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=10`,
      { headers }
    );
    const events = eventsRes.ok ? await eventsRes.json() : [];

    // Check if user has contributed to egos-lab
    const egosCommitsRes = await fetch(
      `https://api.github.com/repos/enioxt/egos-lab/commits?author=${username}&per_page=5`,
      { headers }
    );
    const egosCommits = egosCommitsRes.ok ? await egosCommitsRes.json() : [];

    // Check open issues by user on egos-lab
    const egosIssuesRes = await fetch(
      `https://api.github.com/repos/enioxt/egos-lab/issues?creator=${username}&state=open&per_page=5`,
      { headers }
    );
    const egosIssues = egosIssuesRes.ok ? await egosIssuesRes.json() : [];

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    return res.status(200).json({
      repos: repos.map((r: Record<string, unknown>) => ({
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
        pushed_at: r.pushed_at,
        topics: r.topics,
        fork: r.fork,
      })),
      events: events.slice(0, 10).map((e: Record<string, unknown>) => ({
        type: e.type,
        repo: (e.repo as Record<string, unknown>)?.name,
        created_at: e.created_at,
      })),
      egosContributions: {
        commits: egosCommits.length || 0,
        issues: egosIssues.length || 0,
        commitList: Array.isArray(egosCommits) ? egosCommits.slice(0, 3).map((c: Record<string, unknown>) => ({
          sha: c.sha,
          message: (c.commit as Record<string, unknown>)?.message,
          date: ((c.commit as Record<string, unknown>)?.author as Record<string, unknown>)?.date,
        })) : [],
      },
    });
  } catch (err) {
    console.error('GitHub user API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
