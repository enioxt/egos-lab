/**
 * Builder Hub TypeScript Types
 * Auto-extracted from Supabase schema (hub_* tables)
 */

// ── Enums ──
export type HubProjectStatus = 'draft' | 'functioning' | 'in_progress' | 'stuck' | 'seeking_help' | 'archived';
export type HubProjectVisibility = 'public' | 'unlisted' | 'private';
export type HubHelpStatus = 'open' | 'needs_info' | 'in_progress' | 'solved' | 'closed';
export type HubHelpType = 'bug' | 'setup' | 'keys' | 'billing' | 'performance' | 'architecture' | 'feature';
export type HubLegalTaskType = 'checklist' | 'prompt' | 'playbook' | 'snippet';

// ── Tables ──
export interface HubProfile {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  github_username: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubProject {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string | null;
  github_url: string;
  github_repo: string;
  status: HubProjectStatus;
  visibility: HubProjectVisibility;
  tags: string[];
  tech_stack: string[];
  readme_html: string | null;
  star_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  owner?: HubProfile;
}

export interface HubProjectRunbook {
  id: string;
  project_id: string;
  prerequisites: string | null;
  install_steps: string | null;
  run_command: string | null;
  env_template: string | null;
  keys_needed: KeyNeeded[];
  estimated_monthly_cost: string | null;
  docker_available: boolean;
  notes: string | null;
  updated_at: string;
}

export interface KeyNeeded {
  name: string;
  where_to_get: string;
  estimated_cost: string;
  required: boolean;
}

export interface HubStar {
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface HubFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface HubHelpRequest {
  id: string;
  project_id: string;
  author_id: string;
  title: string;
  type: HubHelpType;
  status: HubHelpStatus;
  body: string;
  accepted_comment_id: string | null;
  comment_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  author?: HubProfile;
  project?: HubProject;
}

export interface HubHelpComment {
  id: string;
  help_request_id: string;
  author_id: string;
  body: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  author?: HubProfile;
}

export interface HubProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  // Joined
  author?: HubProfile;
}

export interface HubLegalLabTask {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: HubLegalTaskType;
  content: string;
  order_index: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  prerequisites: string[];
  created_at: string;
}

export interface HubLegalLabProgress {
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}
