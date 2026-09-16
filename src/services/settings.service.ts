import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/types/domain';

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw error;

  return data as unknown as StoreSettings;
}

export async function updateStoreSettings(
  patch: Partial<StoreSettings>,
) {
  const { data, error } = await supabase
    .from('store_settings')
    .update(patch)
    .eq('id', 1)
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      'لم يتم حفظ الإعدادات فعليًا. الحساب الحالي غير مسجّل كأدمن في جدول admin_users، لذلك رفضت قاعدة البيانات التعديل.',
    );
  }
}

/** Fetches active/enabled banners for the storefront. */
export async function fetchActiveBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []) as BannerRecord[];
}

export interface BannerRecord {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BannerInput {
  title_ar: string | null;
  title_en: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export async function fetchAllBannersForAdmin(): Promise<BannerRecord[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []) as BannerRecord[];
}

export async function createBanner(input: BannerInput) {
  const { error } = await supabase
    .from('banners')
    .insert(input);

  if (error) throw error;
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>,
) {
  const { error } = await supabase
    .from('banners')
    .update(input)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBanner(id: string) {
  const { error } = await supabase
    .from('banners')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadBannerImage(file: File): Promise<string> {
  const path = `banners/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('site-assets')
    .upload(path, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from('site-assets')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function fetchHomepageSections() {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title_ar: string | null;
  title_en: string | null;
  is_enabled: boolean;
  sort_order: number;
  content: Record<string, unknown>;
}

/** Upserts a homepage section by its unique section_key (announcement_bar, hero, etc). */
export async function upsertHomepageSection(
  section: Partial<Omit<HomepageSection, 'content'>> & {
    section_key: string;
    content?: object;
  },
) {
  const { error } = await supabase
    .from('homepage_sections')
    .upsert(section, { onConflict: 'section_key' });

  if (error) throw error;
}