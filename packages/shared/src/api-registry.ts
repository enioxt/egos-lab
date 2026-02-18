/**
 * API Registry — SSOT for all ecosystem routes
 * 
 * Improved from carteira-livre's pattern:
 * - Single typed registry (no duplicate markdown + code)
 * - Multi-app support (egos-web, agents, eagle-eye, nexus)
 * - Automation level tracking (full_auto, auto_review, human_ai, human_only)
 * - Agent integration (which agent can handle this route)
 * - Status tracking (active, planned, deprecated, dead)
 * 
 * Usage:
 *   import { API_REGISTRY, searchRoutes, getRoutesByApp } from '@egos/shared/api-registry';
 */

// ── Types ──────────────────────────────────────────────────────────────

export type AppName = 'egos-web' | 'agents' | 'eagle-eye' | 'nexus' | 'supabase';

export type RouteStatus = 'active' | 'planned' | 'deprecated' | 'dead';

export type AutomationLevel =
  | 'full_auto'    // No human needed (cron, webhook, agent)
  | 'auto_review'  // Agent does work, human approves
  | 'human_ai'     // Human triggers, AI enriches
  | 'human_only';  // Pure CRUD, no AI

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteCategory =
  | 'auth'
  | 'projects'
  | 'help'
  | 'users'
  | 'legal'
  | 'chat'
  | 'agents'
  | 'analytics'
  | 'webhooks'
  | 'cron'
  | 'admin'
  | 'registry'
  | 'osint'
  | 'market';

export interface RouteEntry {
  path: string;
  methods: HttpMethod[];
  app: AppName;
  category: RouteCategory;
  description: string;
  auth: boolean;
  status: RouteStatus;
  automation: AutomationLevel;
  agent?: string;          // Agent ID that can handle this (from agents/registry)
  rateLimit?: string;      // e.g. "10/min", "100/hour"
  costPerCall?: string;    // e.g. "$0.001", "free"
  tags?: string[];
}

// ── Registry ───────────────────────────────────────────────────────────

export const API_REGISTRY: RouteEntry[] = [
  // ═══════════════════════════════════════════════════════════
  // EGOS-WEB — Serverless API Routes (Vercel)
  // ═══════════════════════════════════════════════════════════

  // ── Chat ──
  {
    path: '/api/chat',
    methods: ['POST'],
    app: 'egos-web',
    category: 'chat',
    description: 'SSOT chatbot — answers questions about the EGOS ecosystem',
    auth: false,
    status: 'active',
    automation: 'human_ai',
    agent: 'ai_verifier',
    rateLimit: '10/min',
    costPerCall: '$0.001',
    tags: ['ai', 'gemini', 'openrouter'],
  },

  // ── GitHub Integration ──
  {
    path: '/api/github-commits',
    methods: ['GET'],
    app: 'egos-web',
    category: 'analytics',
    description: 'Fetch recent commits from GitHub repos',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    tags: ['github'],
  },
  {
    path: '/api/ingest-commits',
    methods: ['POST'],
    app: 'egos-web',
    category: 'analytics',
    description: 'Process and store commits with AI analysis',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    costPerCall: '$0.002',
    tags: ['github', 'ai'],
  },

  // ── Registry ──
  {
    path: '/api/registry',
    methods: ['GET'],
    app: 'egos-web',
    category: 'registry',
    description: 'Serve the API registry (this catalog) as JSON',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    tags: ['meta', 'ssot'],
  },

  // ═══════════════════════════════════════════════════════════
  // EGOS-WEB — Planned Hub API Routes
  // ═══════════════════════════════════════════════════════════

  // ── Projects ──
  {
    path: '/api/projects',
    methods: ['GET', 'POST'],
    app: 'egos-web',
    category: 'projects',
    description: 'List projects (GET) or create project (POST)',
    auth: true,
    status: 'planned',
    automation: 'human_ai',
    agent: 'code_reviewer',
    tags: ['hub', 'crud'],
  },
  {
    path: '/api/projects/:slug',
    methods: ['GET', 'PUT', 'DELETE'],
    app: 'egos-web',
    category: 'projects',
    description: 'Get, update, or delete a project by slug',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'crud'],
  },
  {
    path: '/api/projects/:slug/star',
    methods: ['POST', 'DELETE'],
    app: 'egos-web',
    category: 'projects',
    description: 'Star or unstar a project',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'social'],
  },
  {
    path: '/api/projects/:slug/enrich',
    methods: ['POST'],
    app: 'egos-web',
    category: 'projects',
    description: 'AI-enrich project: detect stack, fetch README, analyze',
    auth: true,
    status: 'planned',
    automation: 'auto_review',
    agent: 'code_reviewer',
    costPerCall: '$0.005',
    tags: ['hub', 'ai', 'enrichment'],
  },

  // ── Help Requests ──
  {
    path: '/api/help',
    methods: ['GET', 'POST'],
    app: 'egos-web',
    category: 'help',
    description: 'List help requests or create one',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'crud'],
  },
  {
    path: '/api/help/:id',
    methods: ['GET', 'PUT'],
    app: 'egos-web',
    category: 'help',
    description: 'Get or update a help request',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'crud'],
  },
  {
    path: '/api/help/:id/comments',
    methods: ['GET', 'POST'],
    app: 'egos-web',
    category: 'help',
    description: 'List or add comments to a help request',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'crud'],
  },
  {
    path: '/api/help/:id/accept',
    methods: ['POST'],
    app: 'egos-web',
    category: 'help',
    description: 'Accept a comment as the solution',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub'],
  },

  // ── Users ──
  {
    path: '/api/users/:handle',
    methods: ['GET'],
    app: 'egos-web',
    category: 'users',
    description: 'Get user public profile',
    auth: false,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'profile'],
  },
  {
    path: '/api/users/me',
    methods: ['GET', 'PUT'],
    app: 'egos-web',
    category: 'users',
    description: 'Get or update current user profile',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'profile'],
  },

  // ── Legal Lab ──
  {
    path: '/api/legal/tasks',
    methods: ['GET'],
    app: 'egos-web',
    category: 'legal',
    description: 'List all LegalLab microtasks',
    auth: false,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'onboarding'],
  },
  {
    path: '/api/legal/progress',
    methods: ['GET', 'POST'],
    app: 'egos-web',
    category: 'legal',
    description: 'Get or update user progress on LegalLab tasks',
    auth: true,
    status: 'planned',
    automation: 'human_only',
    tags: ['hub', 'onboarding'],
  },

  // ═══════════════════════════════════════════════════════════
  // AGENTS — CLI/API Bridge (planned)
  // ═══════════════════════════════════════════════════════════

  {
    path: '/api/agents',
    methods: ['GET'],
    app: 'agents',
    category: 'agents',
    description: 'List all registered agents with status',
    auth: false,
    status: 'planned',
    automation: 'full_auto',
    tags: ['meta', 'agents'],
  },
  {
    path: '/api/agents/:id/run',
    methods: ['POST'],
    app: 'agents',
    category: 'agents',
    description: 'Trigger an agent run (dry-run or exec)',
    auth: true,
    status: 'planned',
    automation: 'auto_review',
    tags: ['agents', 'orchestration'],
  },
  {
    path: '/api/agents/:id/results',
    methods: ['GET'],
    app: 'agents',
    category: 'agents',
    description: 'Get latest results from an agent run',
    auth: false,
    status: 'planned',
    automation: 'full_auto',
    tags: ['agents'],
  },
  {
    path: '/api/agents/orchestrate',
    methods: ['POST'],
    app: 'agents',
    category: 'agents',
    description: 'Run multiple agents in sequence/parallel (orchestrator)',
    auth: true,
    status: 'planned',
    automation: 'auto_review',
    tags: ['agents', 'orchestration'],
  },

  // ═══════════════════════════════════════════════════════════
  // WEBHOOKS & CRON (planned)
  // ═══════════════════════════════════════════════════════════

  {
    path: '/api/webhooks/github',
    methods: ['POST'],
    app: 'egos-web',
    category: 'webhooks',
    description: 'GitHub webhook — auto-update project on push',
    auth: false,
    status: 'planned',
    automation: 'full_auto',
    tags: ['github', 'webhook'],
  },
  {
    path: '/api/cron/sync-stars',
    methods: ['GET'],
    app: 'egos-web',
    category: 'cron',
    description: 'Sync GitHub star counts for all projects',
    auth: true,
    status: 'planned',
    automation: 'full_auto',
    rateLimit: '1/hour',
    tags: ['cron', 'github'],
  },
  {
    path: '/api/cron/agent-health',
    methods: ['GET'],
    app: 'egos-web',
    category: 'cron',
    description: 'Run agent health checks and store results',
    auth: true,
    status: 'planned',
    automation: 'full_auto',
    rateLimit: '1/day',
    tags: ['cron', 'agents'],
  },

  // ═══════════════════════════════════════════════════════════
  // EAGLE-EYE — OSINT (planned API exposure)
  // ═══════════════════════════════════════════════════════════

  {
    path: '/api/osint/gazette',
    methods: ['GET'],
    app: 'eagle-eye',
    category: 'osint',
    description: 'Search official gazettes via Querido Diário API',
    auth: false,
    status: 'planned',
    automation: 'human_ai',
    tags: ['osint', 'gazette'],
  },
  {
    path: '/api/osint/analyze',
    methods: ['POST'],
    app: 'eagle-eye',
    category: 'osint',
    description: 'AI analysis of gazette findings',
    auth: true,
    status: 'planned',
    automation: 'auto_review',
    costPerCall: '$0.003',
    tags: ['osint', 'ai'],
  },

  // ═══════════════════════════════════════════════════════════
  // SUPABASE — Edge Functions & Triggers
  // ═══════════════════════════════════════════════════════════

  {
    path: 'trigger:hub_create_profile',
    methods: ['POST'],
    app: 'supabase',
    category: 'auth',
    description: 'Auto-create hub_profiles on user signup (DB trigger)',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    tags: ['trigger', 'auth'],
  },
  {
    path: 'trigger:hub_star_count',
    methods: ['POST'],
    app: 'supabase',
    category: 'projects',
    description: 'Update star_count on hub_stars insert/delete (DB trigger)',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    tags: ['trigger', 'counter'],
  },
  {
    path: 'trigger:hub_comment_count',
    methods: ['POST'],
    app: 'supabase',
    category: 'help',
    description: 'Update comment_count on hub_help_comments insert/delete (DB trigger)',
    auth: false,
    status: 'active',
    automation: 'full_auto',
    tags: ['trigger', 'counter'],
  },
];

// ── Query Functions ────────────────────────────────────────────────────

export function searchRoutes(query: string): RouteEntry[] {
  const q = query.toLowerCase();
  return API_REGISTRY.filter(
    (r) =>
      r.path.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.includes(q) ||
      r.tags?.some((t) => t.includes(q))
  );
}

export function getRoutesByApp(app: AppName): RouteEntry[] {
  return API_REGISTRY.filter((r) => r.app === app);
}

export function getRoutesByCategory(category: RouteCategory): RouteEntry[] {
  return API_REGISTRY.filter((r) => r.category === category);
}

export function getRoutesByStatus(status: RouteStatus): RouteEntry[] {
  return API_REGISTRY.filter((r) => r.status === status);
}

export function getRoutesByAutomation(level: AutomationLevel): RouteEntry[] {
  return API_REGISTRY.filter((r) => r.automation === level);
}

export function getRegistryStats() {
  const byApp: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byAutomation: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const r of API_REGISTRY) {
    byApp[r.app] = (byApp[r.app] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byAutomation[r.automation] = (byAutomation[r.automation] || 0) + 1;
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  }

  return {
    total: API_REGISTRY.length,
    byApp,
    byStatus,
    byAutomation,
    byCategory,
    authenticated: API_REGISTRY.filter((r) => r.auth).length,
    public: API_REGISTRY.filter((r) => !r.auth).length,
    withAgent: API_REGISTRY.filter((r) => r.agent).length,
  };
}
