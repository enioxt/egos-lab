import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & { body: Record<string, unknown>; query: Record<string, string> };
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  setHeader: (name: string, value: string) => VercelResponse;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
    const response = await fetch(
      'https://api.github.com/repos/enioxt/egos-lab/commits?per_page=12',
      { headers }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'GitHub API error' });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('GitHub proxy error:', msg);
    return res.status(500).json({ error: msg });
  }
}
