-- NEXUS MARKET SCHEMA (Prefix: nexusmkt_)

-- 1. Profiles (Extends Supabase Auth)
create table public.nexusmkt_profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('consumer', 'merchant', 'admin', 'courier')) default 'consumer',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Merchants (Supermarkets/Stores)
create table public.nexusmkt_merchants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.nexusmkt_profiles(id),
  name text not null,
  slug text unique not null,
  logo_url text,
  banner_url text,
  address jsonb, -- { street, number, zip, city, lat, lng }
  settings jsonb, -- { delivery_radius, min_order, theme_colors }
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products (Global Catalog possible, but usually store-specific or linked to a global base)
create table public.nexusmkt_products (
  id uuid default uuid_generate_v4() primary key,
  merchant_id uuid references public.nexusmkt_merchants(id) not null,
  name text not null,
  description text,
  category text, -- 'produce', 'bakery', 'meat', etc.
  price decimal(10,2) not null,
  promotional_price decimal(10,2),
  image_url text,
  barcode text,
  stock_quantity integer default 0,
  unit text default 'un', -- 'kg', 'un', 'l'
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orders
create table public.nexusmkt_orders (
  id uuid default uuid_generate_v4() primary key,
  consumer_id uuid references public.nexusmkt_profiles(id) not null,
  merchant_id uuid references public.nexusmkt_merchants(id) not null,
  status text check (status in ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')) default 'pending',
  total_amount decimal(10,2) not null,
  delivery_fee decimal(10,2) default 0,
  items jsonb not null, -- Snapshot of items at time of purchase
  delivery_address jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Examples)
alter table public.nexusmkt_profiles enable row level security;
alter table public.nexusmkt_merchants enable row level security;
alter table public.nexusmkt_products enable row level security;
alter table public.nexusmkt_orders enable row level security;

-- Profiles: Users can read/update their own
create policy "Users can view own profile" on public.nexusmkt_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.nexusmkt_profiles for update using (auth.uid() = id);

-- Merchants: Public read, Owner update
create policy "Merchants are viewable by everyone" on public.nexusmkt_merchants for select using (true);

-- Products: Public read
create policy "Products are viewable by everyone" on public.nexusmkt_products for select using (true);
