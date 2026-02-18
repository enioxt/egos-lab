-- NEXUS MARKET SCHEMA (Updated for AI Audit - Idempotent)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Extends Supabase Auth)
create table if not exists public.nexusmkt_profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('consumer', 'merchant', 'admin', 'courier')) default 'consumer',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Merchants
create table if not exists public.nexusmkt_merchants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.nexusmkt_profiles(id),
  name text not null,
  slug text unique not null,
  logo_url text,
  banner_url text,
  address jsonb,
  settings jsonb,
  integration_config jsonb, 
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products
create table if not exists public.nexusmkt_products (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references public.nexusmkt_merchants(id) not null,
  external_id text,
  name text not null,
  description text,
  category text, 
  price decimal(10,2) not null,
  promotional_price decimal(10,2),
  image_url text,
  barcode text,
  stock_quantity integer default 0,
  unit text default 'un',
  
  -- AI / Quality Control Fields
  expiry_date date,
  nutritional_info jsonb,
  data_quality_score integer default 0,
  ai_suggestions jsonb,
  last_audited_at timestamp with time zone,
  
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add AI fields if they don't exist (Migration logic)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'nexusmkt_products' and column_name = 'data_quality_score') then
        alter table public.nexusmkt_products add column data_quality_score integer default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'nexusmkt_products' and column_name = 'ai_suggestions') then
        alter table public.nexusmkt_products add column ai_suggestions jsonb;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'nexusmkt_products' and column_name = 'expiry_date') then
        alter table public.nexusmkt_products add column expiry_date date;
    end if;
end $$;

-- 4. Orders
create table if not exists public.nexusmkt_orders (
  id uuid default uuid_generate_v4() primary key,
  consumer_id uuid references public.nexusmkt_profiles(id) not null,
  merchant_id uuid references public.nexusmkt_merchants(id) not null,
  status text check (status in ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')) default 'pending',
  total_amount decimal(10,2) not null,
  delivery_fee decimal(10,2) default 0,
  items jsonb not null, 
  delivery_address jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Idempotent)
alter table public.nexusmkt_profiles enable row level security;
alter table public.nexusmkt_merchants enable row level security;
alter table public.nexusmkt_products enable row level security;
alter table public.nexusmkt_orders enable row level security;

-- Drop existing policies to recreate them (simplest way to ensure correctness)
drop policy if exists "Users can view own profile" on public.nexusmkt_profiles;
create policy "Users can view own profile" on public.nexusmkt_profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.nexusmkt_profiles;
create policy "Users can update own profile" on public.nexusmkt_profiles for update using (auth.uid() = id);

drop policy if exists "Merchants are viewable by everyone" on public.nexusmkt_merchants;
create policy "Merchants are viewable by everyone" on public.nexusmkt_merchants for select using (true);

drop policy if exists "Products are viewable by everyone" on public.nexusmkt_products;
create policy "Products are viewable by everyone" on public.nexusmkt_products for select using (true);
