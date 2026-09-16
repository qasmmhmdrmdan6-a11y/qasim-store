-- ============================================================================
-- QASIM Store — Storage setup (Phase 2)
-- ============================================================================
-- Two public-read buckets: product images and general site assets (logo,
-- hero image, banners). Public read is required so <img> tags work without
-- signed URLs. Writes are admin-only, and the client enforces file-type /
-- size limits before upload as a first line of defense (do not rely on this
-- alone — Supabase Storage also supports server-side size limits per bucket,
-- configured in the dashboard: Storage → product-images → Edit bucket).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- Payment receipts are sensitive (customer screenshots) so this bucket is
-- PRIVATE: a guest can upload their own receipt at checkout, but only an
-- admin can list/view/download receipts (via a signed URL in the dashboard).
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- Public read for both buckets.
create policy "public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "public can view site assets"
  on storage.objects for select
  using (bucket_id = 'site-assets');

-- Only admins can upload/update/delete. Relies on the is_admin() helper
-- defined in 0001_init.sql.
create policy "admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "admins can update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

create policy "admins can upload site assets"
  on storage.objects for insert
  with check (bucket_id = 'site-assets' and is_admin());

create policy "admins can update site assets"
  on storage.objects for update
  using (bucket_id = 'site-assets' and is_admin());

create policy "admins can delete site assets"
  on storage.objects for delete
  using (bucket_id = 'site-assets' and is_admin());

-- payment-receipts: anyone (a guest at checkout) may upload a receipt, but
-- nobody but an admin can read the bucket back. Uploads are write-only from
-- the customer's point of view — they never get a browsable URL for it.
create policy "anyone can upload a payment receipt"
  on storage.objects for insert
  with check (bucket_id = 'payment-receipts');

create policy "admins can view payment receipts"
  on storage.objects for select
  using (bucket_id = 'payment-receipts' and is_admin());

create policy "admins can delete payment receipts"
  on storage.objects for delete
  using (bucket_id = 'payment-receipts' and is_admin());
