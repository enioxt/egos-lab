import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/registry — Serve the API registry as JSON
 * 
 * Query params:
 *   ?q=search    — Full-text search
 *   ?app=egos-web — Filter by app
 *   ?status=active — Filter by status
 *   ?category=projects — Filter by category
 *   ?automation=full_auto — Filter by automation level
 *   ?stats=true  — Return only stats summary
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Dynamic import to avoid bundling issues
  // The registry is defined in packages/shared but we inline it here for Vercel serverless
  const registry = getRegistry();

  const { q, app, status, category, automation, stats } = req.query;

  // Stats-only mode
  if (stats === 'true') {
    const byApp: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byAutomation: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const r of registry) {
      byApp[r.app] = (byApp[r.app] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byAutomation[r.automation] = (byAutomation[r.automation] || 0) + 1;
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    }

    return res.status(200).json({
      total: registry.length,
      byApp,
      byStatus,
      byAutomation,
      byCategory,
      authenticated: registry.filter((r: any) => r.auth).length,
      public: registry.filter((r: any) => !r.auth).length,
      withAgent: registry.filter((r: any) => r.agent).length,
    });
  }

  // Filter
  let filtered = registry;

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (r: any) =>
        r.path.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.category.includes(query) ||
        r.tags?.some((t: string) => t.includes(query))
    );
  }

  if (app && typeof app === 'string') {
    filtered = filtered.filter((r: any) => r.app === app);
  }

  if (status && typeof status === 'string') {
    filtered = filtered.filter((r: any) => r.status === status);
  }

  if (category && typeof category === 'string') {
    filtered = filtered.filter((r: any) => r.category === category);
  }

  if (automation && typeof automation === 'string') {
    filtered = filtered.filter((r: any) => r.automation === automation);
  }

  return res.status(200).json({
    total: filtered.length,
    routes: filtered,
  });
}

// Inline registry to avoid cross-package import issues in Vercel serverless
function getRegistry() {
  // This mirrors packages/shared/src/api-registry.ts
  // In a monorepo with proper build, you'd import directly
  return [
    { path: '/api/chat', methods: ['POST'], app: 'egos-web', category: 'chat', description: 'SSOT chatbot — answers questions about EGOS ecosystem', auth: false, status: 'active', automation: 'human_ai', agent: 'ai_verifier', rateLimit: '10/min', costPerCall: '$0.001', tags: ['ai', 'gemini'] },
    { path: '/api/github-commits', methods: ['GET'], app: 'egos-web', category: 'analytics', description: 'Fetch recent commits from GitHub repos', auth: false, status: 'active', automation: 'full_auto', tags: ['github'] },
    { path: '/api/ingest-commits', methods: ['POST'], app: 'egos-web', category: 'analytics', description: 'Process and store commits with AI analysis', auth: false, status: 'active', automation: 'full_auto', costPerCall: '$0.002', tags: ['github', 'ai'] },
    { path: '/api/registry', methods: ['GET'], app: 'egos-web', category: 'registry', description: 'Serve the API registry as JSON', auth: false, status: 'active', automation: 'full_auto', tags: ['meta', 'ssot'] },
    { path: '/api/projects', methods: ['GET', 'POST'], app: 'egos-web', category: 'projects', description: 'List or create projects', auth: true, status: 'planned', automation: 'human_ai', agent: 'code_reviewer', tags: ['hub'] },
    { path: '/api/projects/:slug', methods: ['GET', 'PUT', 'DELETE'], app: 'egos-web', category: 'projects', description: 'CRUD project by slug', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/projects/:slug/star', methods: ['POST', 'DELETE'], app: 'egos-web', category: 'projects', description: 'Star/unstar project', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/projects/:slug/enrich', methods: ['POST'], app: 'egos-web', category: 'projects', description: 'AI-enrich: detect stack, fetch README', auth: true, status: 'planned', automation: 'auto_review', agent: 'code_reviewer', costPerCall: '$0.005', tags: ['hub', 'ai'] },
    { path: '/api/help', methods: ['GET', 'POST'], app: 'egos-web', category: 'help', description: 'List or create help requests', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/help/:id', methods: ['GET', 'PUT'], app: 'egos-web', category: 'help', description: 'Get or update help request', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/help/:id/comments', methods: ['GET', 'POST'], app: 'egos-web', category: 'help', description: 'Comments on help request', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/help/:id/accept', methods: ['POST'], app: 'egos-web', category: 'help', description: 'Accept solution', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/users/:handle', methods: ['GET'], app: 'egos-web', category: 'users', description: 'Public user profile', auth: false, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/users/me', methods: ['GET', 'PUT'], app: 'egos-web', category: 'users', description: 'Current user profile', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/legal/tasks', methods: ['GET'], app: 'egos-web', category: 'legal', description: 'LegalLab microtasks', auth: false, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/legal/progress', methods: ['GET', 'POST'], app: 'egos-web', category: 'legal', description: 'User progress on LegalLab', auth: true, status: 'planned', automation: 'human_only', tags: ['hub'] },
    { path: '/api/agents', methods: ['GET'], app: 'agents', category: 'agents', description: 'List registered agents', auth: false, status: 'planned', automation: 'full_auto', tags: ['agents'] },
    { path: '/api/agents/:id/run', methods: ['POST'], app: 'agents', category: 'agents', description: 'Trigger agent run', auth: true, status: 'planned', automation: 'auto_review', tags: ['agents'] },
    { path: '/api/agents/:id/results', methods: ['GET'], app: 'agents', category: 'agents', description: 'Get agent results', auth: false, status: 'planned', automation: 'full_auto', tags: ['agents'] },
    { path: '/api/agents/orchestrate', methods: ['POST'], app: 'agents', category: 'agents', description: 'Run agents in sequence/parallel', auth: true, status: 'planned', automation: 'auto_review', tags: ['agents'] },
    { path: '/api/webhooks/github', methods: ['POST'], app: 'egos-web', category: 'webhooks', description: 'GitHub webhook — auto-update on push', auth: false, status: 'planned', automation: 'full_auto', tags: ['github'] },
    { path: '/api/cron/sync-stars', methods: ['GET'], app: 'egos-web', category: 'cron', description: 'Sync GitHub star counts', auth: true, status: 'planned', automation: 'full_auto', tags: ['cron'] },
    { path: '/api/cron/agent-health', methods: ['GET'], app: 'egos-web', category: 'cron', description: 'Agent health checks', auth: true, status: 'planned', automation: 'full_auto', tags: ['cron'] },
    { path: '/api/osint/gazette', methods: ['GET'], app: 'eagle-eye', category: 'osint', description: 'Search official gazettes', auth: false, status: 'planned', automation: 'human_ai', tags: ['osint'] },
    { path: '/api/osint/analyze', methods: ['POST'], app: 'eagle-eye', category: 'osint', description: 'AI analysis of gazette findings', auth: true, status: 'planned', automation: 'auto_review', costPerCall: '$0.003', tags: ['osint', 'ai'] },
    { path: 'trigger:hub_create_profile', methods: ['POST'], app: 'supabase', category: 'auth', description: 'Auto-create profile on signup', auth: false, status: 'active', automation: 'full_auto', tags: ['trigger'] },
    { path: 'trigger:hub_star_count', methods: ['POST'], app: 'supabase', category: 'projects', description: 'Update star_count on star/unstar', auth: false, status: 'active', automation: 'full_auto', tags: ['trigger'] },
    { path: 'trigger:hub_comment_count', methods: ['POST'], app: 'supabase', category: 'help', description: 'Update comment_count on comment add/remove', auth: false, status: 'active', automation: 'full_auto', tags: ['trigger'] },
  ];
}
