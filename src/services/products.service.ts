import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/domain';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  onSaleOnly?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'discount';
}

/** Fetches active products for the storefront, with optional filters/sort. */
export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, images:product_images(*)')
    .eq('is_active', true);

  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.search) query = query.textSearch('name_ar', filters.search, { type: 'plain' });
  if (filters.minPrice != null) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice != null) query = query.lte('price', filters.maxPrice);
  if (filters.onSaleOnly) query = query.not('sale_price', 'is', null);

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as Product | null;
}

export async function fetchRelatedProducts(categoryId: string, excludeId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*)')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .neq('id', excludeId)
    .limit(4);

  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

// ---------------------------------------------------------------------------
// Admin-only operations below. RLS on the products/product_images tables
// rejects these unless the caller is signed in and present in admin_users —
// this file doesn't need to re-check that, Postgres already will.
// ---------------------------------------------------------------------------

export interface ProductInput {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  slug: string;
  price: number;
  sale_price: number | null;
  category_id: string;
  stock_quantity: number;
  sku: string | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
}

/** Fetches ALL products (including inactive) for the admin product list. */
export async function fetchAllProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Product[];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select().single();
  if (error) throw error;
  return data as unknown as Product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function addProductImage(productId: string, url: string, sortOrder = 0): Promise<void> {
  const { error } = await supabase.from('product_images').insert({ product_id: productId, url, sort_order: sortOrder });
  if (error) throw error;
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  if (error) throw error;
}

/** Uploads a product photo to the public product-images bucket, returns its public URL. */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const path = `${productId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
