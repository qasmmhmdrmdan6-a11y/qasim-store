-- ============================================================================
-- QASIM Store — Initial Schema (Phase 2)
-- ============================================================================
-- Design principles:
--   1. Public (anon) role can only READ active/public-facing data.
--   2. Only authenticated admins (rows in admin_users) can write anything.
--   3. Orders are created by anon/public via a SECURITY DEFINER function
--      (create_order), never via direct table INSERT — this lets us
--      validate stock + recompute totals server-side before committing,
--      so a client can never dictate its own price.
--   4. No secrets live here. This file is safe to commit to the repo.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- admin_users
-- Maps a Supabase Auth user (auth.uid()) to admin status. The store owner's
-- account is created once via Supabase Auth (dashboard or SQL), then a row
-- is inserted here to grant them admin privileges. There is no self-signup.
-- ---------------------------------------------------------------------------
create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Helper used inside RLS policies throughout this file.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_active_sort on categories (is_active, sort_order);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  description_ar text not null default '',
  description_en text not null default '',
  slug text not null unique,
  price numeric(10, 2) not null check (price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or (sale_price >= 0 and sale_price <= price)),
  category_id uuid not null references categories (id) on delete restrict,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  sku text,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_category on products (category_id);
create index idx_products_active on products (is_active);
create index idx_products_flags on products (is_featured, is_best_seller, is_new_arrival);
create index idx_products_name_search on products using gin (
  to_tsvector('simple', coalesce(name_ar, '') || ' ' || coalesce(name_en, ''))
);

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_product_images_product on product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- store_settings — single-row table (id is always 1)
-- ---------------------------------------------------------------------------
create table store_settings (
  id integer primary key default 1 check (id = 1),
  store_name_ar text not null default 'QASIM Store',
  store_name_en text not null default 'QASIM Store',
  logo_url text,
  description_ar text not null default '',
  description_en text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  social_links jsonb not null default '[]',
  currency text not null default 'EGP',
  shipping_fee numeric(10, 2) not null default 50 check (shipping_fee >= 0),
  vodafone_cash_number text not null default '',
  payment_methods_enabled text[] not null default array['vodafone_cash', 'cash_on_delivery'],
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- homepage_sections — controls which storefront sections show, in what order
-- ---------------------------------------------------------------------------
create table homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique, -- 'announcement_bar' | 'hero' | 'categories' | 'best_sellers' | 'new_arrivals' | 'special_offers' | 'banners'
  title_ar text,
  title_en text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  -- Free-form JSON payload for section-specific fields (hero title/desc/cta/
  -- image, announcement bar text, etc.) so we don't need a table-per-section.
  content jsonb not null default '{}'
);

-- ---------------------------------------------------------------------------
-- banners — promotional homepage banners, independent of homepage_sections
-- ---------------------------------------------------------------------------
create table banners (
  id uuid primary key default gen_random_uuid(),
  title_ar text,
  title_en text,
  image_url text not null,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  customer_name text not null,
  phone text not null,
  governorate text not null,
  address text not null,
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('vodafone_cash', 'cash_on_delivery')),
  payment_status text not null default 'pending_review'
    check (payment_status in ('pending_review', 'paid', 'rejected', 'cod')),
  payment_receipt_url text, -- optional uploaded Vodafone Cash receipt screenshot
  order_status text not null default 'new'
    check (order_status in ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on orders (order_status);
create index idx_orders_payment_status on orders (payment_status);
create index idx_orders_created on orders (created_at desc);

-- ---------------------------------------------------------------------------
-- order_items — snapshot of product name/price at time of purchase, so later
-- edits to a product never rewrite order history.
-- ---------------------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name_ar text not null,
  product_name_en text not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index idx_order_items_order on order_items (order_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table admin_users enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table store_settings enable row level security;
alter table homepage_sections enable row level security;
alter table banners enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- admin_users: only an admin can read the admin list; nobody writes via API
-- (managed by the project owner directly in SQL / Supabase dashboard).
create policy "admins can read admin_users" on admin_users
  for select using (is_admin());

-- categories: public can read active categories; only admins write.
create policy "public can read active categories" on categories
  for select using (is_active = true or is_admin());
create policy "admins manage categories" on categories
  for insert with check (is_admin());
create policy "admins update categories" on categories
  for update using (is_admin());
create policy "admins delete categories" on categories
  for delete using (is_admin());

-- products: public can read active products; only admins write.
create policy "public can read active products" on products
  for select using (is_active = true or is_admin());
create policy "admins manage products" on products
  for insert with check (is_admin());
create policy "admins update products" on products
  for update using (is_admin());
create policy "admins delete products" on products
  for delete using (is_admin());

-- product_images: follow visibility of parent product.
create policy "public can read images of visible products" on product_images
  for select using (
    is_admin() or exists (
      select 1 from products p where p.id = product_id and p.is_active = true
    )
  );
create policy "admins manage product_images" on product_images
  for insert with check (is_admin());
create policy "admins update product_images" on product_images
  for update using (is_admin());
create policy "admins delete product_images" on product_images
  for delete using (is_admin());

-- store_settings: publicly readable (storefront needs it), only admins write.
create policy "public can read store_settings" on store_settings
  for select using (true);
create policy "admins update store_settings" on store_settings
  for update using (is_admin());

-- homepage_sections: publicly readable, only admins write.
create policy "public can read homepage_sections" on homepage_sections
  for select using (true);
create policy "admins manage homepage_sections" on homepage_sections
  for insert with check (is_admin());
create policy "admins update homepage_sections" on homepage_sections
  for update using (is_admin());
create policy "admins delete homepage_sections" on homepage_sections
  for delete using (is_admin());

-- banners: public reads active ones, only admins write.
create policy "public can read active banners" on banners
  for select using (is_active = true or is_admin());
create policy "admins manage banners" on banners
  for insert with check (is_admin());
create policy "admins update banners" on banners
  for update using (is_admin());
create policy "admins delete banners" on banners
  for delete using (is_admin());

-- orders: guests CANNOT read, insert, or update orders directly — creation
-- happens only through the create_order() function below (security definer),
-- and only admins can read/update afterwards. This is what prevents a guest
-- from browsing other people's orders or editing order status/payment.
create policy "admins read orders" on orders
  for select using (is_admin());
create policy "admins update orders" on orders
  for update using (is_admin());
-- Deliberately: no insert/delete policy for anon — all inserts go through
-- create_order(), which runs as the function owner and bypasses RLS safely
-- because it fully controls what gets written.

create policy "admins read order_items" on order_items
  for select using (is_admin());
-- No public insert/update/delete policies here either, for the same reason.

-- ---------------------------------------------------------------------------
-- create_order(): the ONLY way an order gets created.
-- Runs with the function owner's privileges (security definer) so it can
-- insert into orders/order_items despite RLS, but it recomputes every price
-- from the products table itself — the client-submitted cart is only used
-- for product_id + quantity, never for price. This is what stops price/stock
-- tampering from the browser.
-- ---------------------------------------------------------------------------
create type order_line_input as (
  product_id uuid,
  quantity integer
);

create or replace function create_order(
  p_customer_name text,
  p_phone text,
  p_governorate text,
  p_address text,
  p_notes text,
  p_payment_method text,
  p_lines order_line_input[]
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_subtotal numeric(10, 2) := 0;
  v_shipping numeric(10, 2);
  v_line order_line_input;
  v_product products%rowtype;
  v_line_total numeric(10, 2);
  v_payment_status text;
begin
  if p_lines is null or array_length(p_lines, 1) is null then
    raise exception 'Order must contain at least one item';
  end if;

  if p_payment_method not in ('vodafone_cash', 'cash_on_delivery') then
    raise exception 'Invalid payment method';
  end if;

  select shipping_fee into v_shipping from store_settings where id = 1;

  v_order_id := gen_random_uuid();
  v_payment_status := case when p_payment_method = 'cash_on_delivery' then 'cod' else 'pending_review' end;

  -- Lock each product row while we check stock, so two simultaneous orders
  -- can't both oversell the same last unit.
  foreach v_line in array p_lines loop
    select * into v_product from products where id = v_line.product_id for update;

    if not found or v_product.is_active = false then
      raise exception 'Product % is not available', v_line.product_id;
    end if;
    if v_line.quantity < 1 then
      raise exception 'Invalid quantity for product %', v_line.product_id;
    end if;
    if v_product.stock_quantity < v_line.quantity then
      raise exception 'Insufficient stock for product %', v_product.name_en;
    end if;

    v_line_total := coalesce(v_product.sale_price, v_product.price) * v_line.quantity;
    v_subtotal := v_subtotal + v_line_total;

    update products set stock_quantity = stock_quantity - v_line.quantity where id = v_product.id;

    insert into order_items (order_id, product_id, product_name_ar, product_name_en, unit_price, quantity, line_total)
    values (
      v_order_id, v_product.id, v_product.name_ar, v_product.name_en,
      coalesce(v_product.sale_price, v_product.price), v_line.quantity, v_line_total
    );
  end loop;

  insert into orders (
    id, customer_name, phone, governorate, address, notes,
    subtotal, shipping_fee, total, payment_method, payment_status
  ) values (
    v_order_id, p_customer_name, p_phone, p_governorate, p_address, p_notes,
    v_subtotal, v_shipping, v_subtotal + v_shipping, p_payment_method, v_payment_status
  );

  return v_order_id;
end;
$$;

-- Allow anon/authenticated to call the function (RLS on the underlying
-- tables still applies to everything EXCEPT what this function does
-- internally as its owner).
grant execute on function create_order to anon, authenticated;

-- ---------------------------------------------------------------------------
-- attach_payment_receipt(): lets the guest who just placed a Vodafone Cash
-- order attach their uploaded receipt's storage path to that exact order.
-- Deliberately narrow: it can only set payment_receipt_url on a row that is
-- still 'pending_review', and touches nothing else — a guest still can never
-- change order_status, payment_status, totals, or read other orders.
-- ---------------------------------------------------------------------------
create or replace function attach_payment_receipt(p_order_id uuid, p_storage_path text)
returns void
language plpgsql
security definer
as $$
begin
  update orders
  set payment_receipt_url = p_storage_path
  where id = p_order_id and payment_status = 'pending_review';

  if not found then
    raise exception 'Order not found or not eligible for a receipt upload';
  end if;
end;
$$;

grant execute on function attach_payment_receipt to anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();
