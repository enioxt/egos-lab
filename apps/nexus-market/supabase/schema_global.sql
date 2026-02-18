-- NEXUS MARKET SCHEMA (Global Catalog & AI Photo Hunting)

-- 5. Global Catalog (The "Golden Record")
-- This table stores validated product data shared across all merchants.
-- Usually keyed by EAN (Barcode).
create table if not exists public.nexusmkt_global_catalog (
  ean text primary key,
  name text not null,
  description text,
  brand text,
  image_url text, -- The "Gold" image
  category text,
  
  -- AI Metadata
  ai_generated_image boolean default false,
  image_source text, -- 'web_search', 'provider_x', 'nano_banana_gen'
  data_quality_score integer default 100,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Global Catalog
alter table public.nexusmkt_global_catalog enable row level security;

-- Everyone can read the global catalog
create policy "Global Catalog is viewable by everyone" on public.nexusmkt_global_catalog for select using (true);
-- Only admin/service_role can update (for now)
-- (We'll use service role in our import scripts)
