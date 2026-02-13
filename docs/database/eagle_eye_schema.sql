-- Eagle Eye Database Schema (Supabase)

-- 1. Gazettes Table
-- Stores metadata about analyzed gazettes
create table if not exists eagle_eye_gazettes (
  id uuid default gen_random_uuid() primary key,
  territory_id text not null,
  territory_name text not null,
  state_code text not null,
  date date not null,
  url text,
  txt_url text,
  scanned_at timestamp with time zone default now(),
  raw_text_length integer,
  analysis_cost_usd numeric(10, 5),
  
  -- Unique constraint to prevent duplicate scans
  unique(territory_id, date)
);

-- 2. Opportunities Table
-- Stores identified opportunities from gazettes
create table if not exists eagle_eye_opportunities (
  id uuid default gen_random_uuid() primary key,
  gazette_id uuid references eagle_eye_gazettes(id) on delete cascade,
  pattern_id text not null,
  pattern_name text not null,
  confidence integer not null,
  urgency text check (urgency in ('critical', 'high', 'medium', 'low')),
  matched_keywords text[],
  ai_reasoning text,
  effective_date date,
  action_deadline date,
  
  -- Enrichment data (JSONB for flexibility)
  enrichment_data jsonb,
  
  created_at timestamp with time zone default now()
);

-- Indexes for dashboard performance
create index if not exists idx_gazettes_date on eagle_eye_gazettes(date desc);
create index if not exists idx_gazettes_territory on eagle_eye_gazettes(territory_id);
create index if not exists idx_opportunities_urgency on eagle_eye_opportunities(urgency);
create index if not exists idx_opportunities_pattern on eagle_eye_opportunities(pattern_id);
