-- ============================================================================
-- QASIM Store — Fix demo images that point at placehold.co (SVG)
-- ============================================================================
-- Run this ONCE if you already ran the old version of seed.sql and your
-- categories/products currently show placehold.co URLs (these return SVG,
-- which is why images weren't rendering as real photos).
--
-- This only touches rows that still have the old placehold.co URLs — real
-- photos you've since uploaded through the admin dashboard are left alone.
-- Safe to run multiple times.
-- ============================================================================

update categories
set image_url = 'https://picsum.photos/seed/qasim-' || slug || '/600/600'
where image_url like 'https://placehold.co/%';

update product_images
set url = 'https://picsum.photos/seed/qasim-' || (select slug from products where products.id = product_images.product_id) || '/800/1000'
where url like 'https://placehold.co/%';

update banners
set image_url = 'https://picsum.photos/seed/qasim-banner-' || id::text || '/1200/500'
where image_url like 'https://placehold.co/%';