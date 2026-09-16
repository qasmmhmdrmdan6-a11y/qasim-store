import { Link } from 'react-router-dom';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { useCategories } from '@/hooks/useCatalog';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export function Categories() {
  const { locale } = useLanguage();
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-ivory">
        {locale === 'ar' ? 'كل التصنيفات' : 'All Categories'}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        {!isLoading && categories?.length === 0 && (
          <div className="col-span-full">
            <EmptyState title={locale === 'ar' ? 'لا توجد تصنيفات بعد' : 'No categories yet'} />
          </div>
        )}
        {categories?.map((cat) => (
          <Link key={cat.id} to={`/products?category=${cat.id}`}>
            <Card className="group flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden p-4 text-center transition-colors hover:border-gold">
              {cat.image_url ? (
                <img
                  src={cat.image_url}
                  alt={pickLocalized(cat, 'name', locale)}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-surface-2 transition-colors group-hover:bg-gold/15" />
              )}
              <span className="text-sm text-ivory-muted group-hover:text-gold">
                {pickLocalized(cat, 'name', locale)}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
