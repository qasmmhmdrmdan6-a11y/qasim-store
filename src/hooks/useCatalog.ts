import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductBySlug, fetchRelatedProducts, type ProductFilters } from '@/services/products.service';
import { fetchActiveCategories } from '@/services/categories.service';
import { fetchStoreSettings } from '@/services/settings.service';

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useRelatedProducts(categoryId: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: ['related-products', categoryId, excludeId],
    queryFn: () => fetchRelatedProducts(categoryId as string, excludeId as string),
    enabled: !!categoryId && !!excludeId,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchActiveCategories,
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: fetchStoreSettings,
    staleTime: 5 * 60_000,
  });
}
