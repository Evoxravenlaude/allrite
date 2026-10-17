-- Allrite Boutique and Lifestyle: database schema
-- Run this once in the Supabase SQL editor (or any PostgreSQL 15+ database).
-- All amounts are whole naira. Paystack amounts are converted to kobo in code.


create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('owner', 'manager', 'sales')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  phone text not null default '',
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  department text not null check (department in ('fashion', 'furniture')),
  category text not null,
  name text not null,
  description text not null default '',
  details text not null default '',
  care text not null default '',
  price integer not null check (price >= 0),
  images jsonb not null default '[]'::jsonb,
  width_cm integer,
  depth_cm integer,
  height_cm integer,
  materials text not null default '',
  finishes text not null default '',
  availability text not null default 'ready' check (availability in ('ready', 'made_to_order')),
  lead_time_weeks integer,
  allow_deposit boolean not null default false,
  is_new boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null default '',
  colour text not null default '',
  barcode text not null unique,
  stock integer not null default 0 check (stock >= 0),
  low_stock_at integer not null default 2,
  sort integer not null default 0
);
create index if not exists variants_product_idx on variants(product_id);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fashion_fee integer not null default 0,
  furniture_fee integer not null default 0,
  active boolean not null default true,
  sort integer not null default 0
);

create sequence if not exists order_number_seq start 10001;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('AR-' || nextval('order_number_seq')::text),
  channel text not null check (channel in ('online', 'counter', 'showroom')),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'received', 'preparing', 'sent', 'delivered', 'collected', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'deposit_paid', 'paid', 'refunded')),
  payment_method text check (payment_method in ('paystack', 'cash', 'transfer', 'pos_card')),
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null default '',
  email text not null default '',
  phone text not null default '',
  fulfilment text not null default 'delivery' check (fulfilment in ('delivery', 'collection', 'in_store')),
  zone_id uuid references delivery_zones(id) on delete set null,
  zone_name text not null default '',
  address text not null default '',
  gift_message text not null default '',
  is_gift boolean not null default false,
  subtotal integer not null default 0,
  delivery_fee integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  amount_paid integer not null default 0,
  pay_deposit boolean not null default false,
  staff_id uuid references staff(id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz
);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists orders_customer_idx on orders(customer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references variants(id) on delete set null,
  department text not null,
  name text not null,
  size text not null default '',
  colour text not null default '',
  price integer not null,
  qty integer not null check (qty > 0)
);
create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  kind text not null check (kind in ('initial', 'balance')),
  reference text not null unique,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references variants(id) on delete cascade,
  change integer not null,
  reason text not null check (reason in ('sale', 'reserve', 'release', 'restock', 'adjustment')),
  order_id uuid references orders(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists viewings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null default '',
  name text not null,
  email text not null default '',
  phone text not null default '',
  preferred_at timestamptz not null,
  note text not null default '',
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists saved_items (
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

-- The website talks to the database only from the server, with the service connection.
-- Row level security is switched on with no public policies, so the public Supabase API cannot read or change anything.
alter table settings enable row level security;
alter table staff enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table variants enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table stock_movements enable row level security;
alter table viewings enable row level security;
alter table saved_items enable row level security;
