-- ============================================================================
-- QASIM Store — Seed data (Phase 2 / run manually, NOT part of migrations)
-- ============================================================================
-- Run this once against your Supabase project (SQL editor) after applying
-- 0001_init.sql and 0002_storage.sql, to make the storefront look like a
-- real, populated store on first launch. Every seeded product's SKU is
-- prefixed "DEMO-" so the admin can filter and bulk-delete them later.
-- Image URLs point to placeholder.co — replace with real product photos
-- uploaded through the admin dashboard.
-- ============================================================================

insert into categories (name_ar, name_en, slug, image_url, sort_order) values
  ('العناية بالبشرة', 'Skincare', 'skincare', 'https://placehold.co/600x600/141217/b9975b?text=Skincare', 1),
  ('مستحضرات التجميل', 'Makeup', 'makeup', 'https://placehold.co/600x600/141217/b9975b?text=Makeup', 2),
  ('العناية بالشعر', 'Haircare', 'haircare', 'https://placehold.co/600x600/141217/b9975b?text=Haircare', 3),
  ('العطور', 'Perfumes', 'perfumes', 'https://placehold.co/600x600/141217/b9975b?text=Perfumes', 4),
  ('العناية الشخصية', 'Personal Care', 'personal-care', 'https://placehold.co/600x600/141217/b9975b?text=Personal+Care', 5);

-- Skincare
insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_featured, is_best_seller, is_new_arrival)
select
  'سيروم فيتامين سي', 'Vitamin C Serum',
  'سيروم مضاد للأكسدة يفتح البشرة ويوحد لونها.', 'Antioxidant serum that brightens and evens skin tone.',
  'vitamin-c-serum', 450, 349, id, 40, 'DEMO-SK-001', true, true, false
from categories where slug = 'skincare';

insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_new_arrival)
select
  'كريم مرطب بحمض الهيالورونيك', 'Hyaluronic Acid Moisturizer',
  'ترطيب عميق يدوم طوال اليوم لجميع أنواع البشرة.', 'Deep, all-day hydration for all skin types.',
  'hyaluronic-moisturizer', 320, null, id, 25, 'DEMO-SK-002', true
from categories where slug = 'skincare';

insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku)
select
  'غسول منظف للوجه', 'Gentle Facial Cleanser',
  'ينظف بعمق دون أن يجفف البشرة.', 'Deep cleans without stripping the skin.',
  'gentle-cleanser', 180, null, id, 60, 'DEMO-SK-003'
from categories where slug = 'skincare';

-- Makeup
insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_best_seller)
select
  'كريم أساس طويل الثبات', 'Long-Wear Foundation',
  'تغطية متوسطة إلى كاملة تدوم حتى 16 ساعة.', 'Medium-to-full coverage that lasts up to 16 hours.',
  'longwear-foundation', 520, 420, id, 30, 'DEMO-MU-001', true
from categories where slug = 'makeup';

insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku)
select
  'باليت ظلال عيون', 'Eyeshadow Palette',
  '12 لون بدرجات دافئة قابلة للمزج.', '12 blendable warm-toned shades.',
  'eyeshadow-palette', 390, null, id, 3, 'DEMO-MU-002'
from categories where slug = 'makeup';

-- Haircare
insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_new_arrival)
select
  'زيت الأرجان للشعر', 'Argan Hair Oil',
  'يغذي الشعر ويمنحه لمعانًا طبيعيًا.', 'Nourishes hair and adds natural shine.',
  'argan-hair-oil', 260, 210, id, 50, 'DEMO-HC-001', true
from categories where slug = 'haircare';

insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku)
select
  'شامبو خالٍ من الكبريتات', 'Sulfate-Free Shampoo',
  'تنظيف لطيف يحافظ على لون الشعر المصبوغ.', 'Gentle cleanse that preserves color-treated hair.',
  'sulfate-free-shampoo', 210, null, id, 0, 'DEMO-HC-002'
from categories where slug = 'haircare';

-- Perfumes
insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_featured, is_best_seller)
select
  'عطر أوود رويال', 'Oud Royal Eau de Parfum',
  'مزيج فاخر من العود والمسك، ثبات يدوم طويلًا.', 'A luxurious oud and musk blend with long-lasting projection.',
  'oud-royal-edp', 950, 760, id, 15, 'DEMO-PF-001', true, true
from categories where slug = 'perfumes';

insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku, is_new_arrival)
select
  'عطر أزهار الياسمين', 'Jasmine Bloom Eau de Toilette',
  'رائحة زهرية منعشة مناسبة للاستخدام اليومي.', 'A fresh floral scent perfect for everyday wear.',
  'jasmine-bloom-edt', 480, null, id, 22, 'DEMO-PF-002', true
from categories where slug = 'perfumes';

-- Personal care
insert into products (name_ar, name_en, description_ar, description_en, slug, price, sale_price, category_id, stock_quantity, sku)
select
  'صابون طبيعي بزيت الزيتون', 'Natural Olive Oil Soap',
  'صابون مغذٍ مصنوع يدويًا من زيت الزيتون النقي.', 'Handmade nourishing soap made with pure olive oil.',
  'olive-oil-soap', 90, null, id, 100, 'DEMO-PC-001'
from categories where slug = 'personal-care';

-- One demo placeholder image per product, so the storefront never shows a
-- broken <img>. Replace via the admin dashboard's image manager.
insert into product_images (product_id, url, sort_order)
select id, 'https://placehold.co/800x1000/141217/b9975b?text=' || replace(name_en, ' ', '+'), 0
from products where sku like 'DEMO-%';
