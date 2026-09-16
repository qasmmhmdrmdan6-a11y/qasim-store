export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'vodafone_cash' | 'cash_on_delivery';

export type PaymentStatus = 'pending_review' | 'paid' | 'rejected' | 'cod';

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  sale_price: number | null;
  category_id: string;
  stock_quantity: number;
  sku: string | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
}

export interface CartLine {
  product: Pick<Product, 'id' | 'slug' | 'name_ar' | 'name_en' | 'price' | 'sale_price' | 'stock_quantity'> & {
    image_url?: string | null;
  };
  quantity: number;
}

export interface StoreSettings {
  store_name_ar: string;
  store_name_en: string;
  logo_url: string | null;
  description_ar: string;
  description_en: string;
  phone: string;
  email: string;
  address: string;
  social_links: { platform: string; url: string }[];
  currency: 'EGP';
  shipping_fee: number;
  vodafone_cash_number: string;
  payment_methods_enabled: PaymentMethod[];
}

export const EGYPT_GOVERNORATES_AR = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر',
  'قنا', 'شمال سيناء', 'سوهاج',
] as const;
