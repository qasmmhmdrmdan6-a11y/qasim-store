import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { useCategories, useProducts } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductFilters } from '@/services/products.service';

export function ProductList() {
  const { locale } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');

  const categoryId = searchParams.get('category') ?? undefined;
  const sort = (searchParams.get('sort') as ProductFilters['sort']) ?? 'newest';
  const onSaleOnly = searchParams.get('sale') === '1';
  const search = searchParams.get('q') ?? undefined;

  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({ categoryId, sort, onSaleOnly, search });

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  const activeCategoryName = useMemo(() => {
    const cat = categories?.find((c) => c.id === categoryId);
    return cat ? pickLocalized(cat, 'name', locale) : null;
  }, [categories, categoryId, locale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-ivory">
        {activeCategoryName ?? (locale === 'ar' ? 'كل المنتجات' : 'All Products')}
      </h1>

      {/* Search */}
      <form
        className="mt-6 flex max-w-md items-center gap-2 rounded-sm border border-surface-border bg-surface-2 px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          updateParam('q', searchInput || null);
        }}
      >
        <Search size={16} className="text-ivory-faint" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={locale === 'ar' ? 'ابحثي عن منتج...' : 'Search products...'}
          className="w-full bg-transparent text-sm text-ivory outline-none placeholder:text-ivory-faint"
        />
      </form>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Filters sidebar */}
        <aside className="flex shrink-0 flex-row flex-wrap gap-4 md:w-56 md:flex-col">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-ivory-faint">
              {locale === 'ar' ? 'التصنيف' : 'Category'}
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => updateParam('category', null)}
                className={`text-start text-sm ${!categoryId ? 'text-gold' : 'text-ivory-muted hover:text-ivory'}`}
              >
                {locale === 'ar' ? 'الكل' : 'All'}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam('category', cat.id)}
                  className={`text-start text-sm ${
                    categoryId === cat.id ? 'text-gold' : 'text-ivory-muted hover:text-ivory'
                  }`}
                >
                  {pickLocalized(cat, 'name', locale)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ivory-muted">
            <input
              type="checkbox"
              checked={onSaleOnly}
              onChange={(e) => updateParam('sale', e.target.checked ? '1' : null)}
              className="accent-gold"
            />
            {locale === 'ar' ? 'عروض فقط' : 'On sale only'}
          </label>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 flex justify-end">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-sm border border-surface-border bg-surface-2 px-3 py-2 text-sm text-ivory outline-none focus:border-gold"
            >
              <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
              <option value="price_asc">{locale === 'ar' ? 'السعر: من الأقل' : 'Price: Low to High'}</option>
              <option value="price_desc">{locale === 'ar' ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {isLoading && Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            {!isLoading && products?.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  title={locale === 'ar' ? 'لا توجد نتائج' : 'No results'}
                  description={locale === 'ar' ? 'جربي تغيير الفلاتر أو البحث بكلمة أخرى.' : 'Try different filters or search terms.'}
                />
              </div>
            )}
            {products?.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
