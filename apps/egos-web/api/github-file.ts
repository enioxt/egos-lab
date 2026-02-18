import type { VercelRequest, VercelResponse } from './_types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = req.query.path as string;
  if (!path) {
    return res.status(400).json({ error: 'path query param required' });
  }

  // Only allow reading specific safe paths
  const ALLOWED_PREFIXES = ['.guarani/', '.windsurfrules', 'CONTRIBUTING', 'README', 'docs/'];
  const isAllowed = ALLOWED_PREFIXES.some(p => path.startsWith(p));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Path not allowed' });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/enioxt/egos-lab/contents/${encodeURIComponent(path)}`,
      { headers }
    );

    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: 'File not found' });
    }

    const content = await ghRes.text();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
    return res.status(200).json({ path, content });
  } catch (err) {
    console.error('GitHub file API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
