import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/domain';

export async function fetchActiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

// ---------------------------------------------------------------------------
// Admin-only operations (RLS enforces the admin check server-side)
// ---------------------------------------------------------------------------

export interface CategoryInput {
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export async function fetchAllCategoriesForAdmin(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(input).select().single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<void> {
  const { error } = await supabase.from('categories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadCategoryImage(categorySlug: string, file: File): Promise<string> {
  const path = `categories/${categorySlug}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('site-assets').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
  return data.publicUrl;
}
