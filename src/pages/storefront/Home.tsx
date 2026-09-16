import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCategories, useProducts } from '@/hooks/useCatalog';
import {
  fetchHomepageSections,
  fetchActiveBanners,
  type HomepageSection,
} from '@/services/settings.service';
import { formatPrice, computeDiscountPercent } from '@/utils/currency';

function isSectionEnabled(
  sections: HomepageSection[] | undefined,
  key: string,
): boolean {
  const section = sections?.find((s) => s.section_key === key);
  return section ? section.is_enabled : true;
}

export function Home() {
  const { locale, t } = useLanguage();
  const location = useLocation();

  const orderConfirmed = (
    location.state as { orderConfirmed?: string } | null
  )?.orderConfirmed;

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const { data: allProducts, isLoading: productsLoading } = useProducts({
    sort: 'newest',
  });

  const { data: sections } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: fetchHomepageSections,
  });

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: fetchActiveBanners,
  });

  const sectionList = sections as unknown as HomepageSection[] | undefined;

  const heroSection = sectionList?.find(
    (s) => s.section_key === 'hero',
  );

  const heroEnabled = heroSection
    ? heroSection.is_enabled
    : true;

  const heroTitle =
    (heroSection?.content?.[`title_${locale}`] as string) ||
    (locale === 'ar'
      ? 'جمالكِ، بأسلوب استثنائي'
      : 'Your Beauty, Elevated');

  const heroDescription =
    (heroSection?.content?.[`description_${locale}`] as string) ||
    (locale === 'ar'
      ? 'منتجات تجميل وعناية مختارة بعناية فائقة، لتجربة فاخرة تليق بكِ.'
      : 'Carefully curated beauty and care essentials — a premium experience made for you.');

  const heroButtonText =
    (heroSection?.content?.[`button_text_${locale}`] as string) ||
    (locale === 'ar' ? 'تسوقي الآن' : 'Shop Now');

  const heroButtonLink =
    (heroSection?.content?.button_link as string) ||
    '/products';

  // صورة الـ Hero التي يتم رفعها من لوحة التحكم
  const heroImageUrl =
    (heroSection?.content?.image_url as string) || '';

  const categoriesEnabled = isSectionEnabled(
    sectionList,
    'categories',
  );

  const bestSellersEnabled = isSectionEnabled(
    sectionList,
    'best_sellers',
  );

  const newArrivalsEnabled = isSectionEnabled(
    sectionList,
    'new_arrivals',
  );

  const specialOffersEnabled = isSectionEnabled(
    sectionList,
    'special_offers',
  );

  const bannersEnabled = isSectionEnabled(
    sectionList,
    'banners',
  );

  const bestSellerList = (allProducts ?? [])
    .filter((p) => p.is_best_seller)
    .slice(0, 4);

  const newArrivalList = (allProducts ?? [])
    .filter((p) => p.is_new_arrival)
    .slice(0, 4);

  const specialOfferList = (allProducts ?? [])
    .filter(
      (p) =>
        p.sale_price != null &&
        p.sale_price < p.price,
    )
    .slice(0, 4);

  return (
    <div>
      {orderConfirmed && (
        <div className="border-b border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} />

            {locale === 'ar'
              ? 'تم استلام طلبك بنجاح، سيتم التواصل معكِ قريبًا لتأكيد التفاصيل.'
              : 'Your order was placed successfully — we will contact you soon to confirm details.'}
          </span>
        </div>
      )}

      {/* Hero */}
      {heroEnabled && (
        <section className="relative overflow-hidden border-b border-surface-border">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
            
            <div className="gold-frame p-6 md:p-8">
              <p className="mb-3 text-xs font-medium tracking-[0.2em] text-gold">
                {locale === 'ar'
                  ? 'وصل حديثًا'
                  : 'NEW ARRIVALS'}
              </p>

              <h1 className="font-display text-4xl leading-tight text-ivory md:text-6xl">
                {heroTitle}
              </h1>

              <p className="mt-4 max-w-md text-ivory-muted">
                {heroDescription}
              </p>

              <div className="mt-8 flex gap-3">
                <Link
                  to={heroButtonLink}
                  className={buttonClasses('primary', 'lg')}
                >
                  {heroButtonText}
                </Link>

                <Link
                  to="/categories"
                  className={buttonClasses('secondary', 'lg')}
                >
                  {locale === 'ar'
                    ? 'استكشفي الأقسام'
                    : 'Browse Categories'}
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="aspect-[4/5] w-full overflow-hidden rounded-md bg-gradient-to-br from-surface-2 to-surface">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt={
                    locale === 'ar'
                      ? 'صورة القسم الرئيسي'
                      : 'Hero'
                  }
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      'none';
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-ivory-faint">
                  {locale === 'ar'
                    ? 'لا توجد صورة للقسم الرئيسي'
                    : 'No hero image'}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* Promotional banners */}
      {bannersEnabled &&
        banners &&
        banners.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
            <div
              className={`grid gap-4 ${
                banners.length > 1
                  ? 'sm:grid-cols-2'
                  : ''
              }`}
            >
              {banners.map((banner) => {
                const content = (
                  <div className="group relative aspect-[21/9] overflow-hidden rounded-md sm:aspect-[16/7]">
                    <img
                      src={banner.image_url}
                      alt={
                        pickLocalized(
                          banner,
                          'title',
                          locale,
                        ) || ''
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {(banner.title_ar ||
                      banner.title_en) && (
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 to-transparent p-5">
                        <span className="font-display text-lg text-ivory">
                          {pickLocalized(
                            banner,
                            'title',
                            locale,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );

                return banner.link_url ? (
                  <Link
                    key={banner.id}
                    to={banner.link_url}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={banner.id}>
                    {content}
                  </div>
                );
              })}
            </div>
          </section>
        )}

      {/* Categories */}
      {categoriesEnabled && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <h2 className="font-display text-2xl text-ivory">
            {locale === 'ar'
              ? 'تسوقي حسب القسم'
              : 'Shop by Category'}
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            {categoriesLoading &&
              Array.from({ length: 5 }).map(
                (_, i) => (
                  <Card
                    key={i}
                    className="aspect-square animate-pulse bg-surface-2"
                  />
                ),
              )}

            {!categoriesLoading &&
              categories?.length === 0 && (
                <p className="col-span-full text-sm text-ivory-muted">
                  {locale === 'ar'
                    ? 'لا توجد تصنيفات بعد.'
                    : 'No categories yet.'}
                </p>
              )}

            {categories?.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
              >
                <Card className="group flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden p-4 text-center transition-colors hover:border-gold">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={pickLocalized(
                        cat,
                        'name',
                        locale,
                      )}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-surface-2 transition-colors group-hover:bg-gold/15" />
                  )}

                  <span className="text-sm text-ivory-muted group-hover:text-gold">
                    {pickLocalized(
                      cat,
                      'name',
                      locale,
                    )}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellersEnabled && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ivory">
              {locale === 'ar'
                ? 'الأكثر مبيعًا'
                : 'Best Sellers'}
            </h2>

            <Link
              to="/products"
              className="text-sm text-gold hover:underline"
            >
              {t.common.viewAll}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {productsLoading &&
              Array.from({ length: 4 }).map(
                (_, i) => (
                  <ProductCardSkeleton key={i} />
                ),
              )}

            {!productsLoading &&
              bestSellerList.length === 0 && (
                <EmptyState
                  title={
                    locale === 'ar'
                      ? 'لا توجد منتجات مميزة بعد'
                      : 'No best sellers yet'
                  }
                  description={
                    locale === 'ar'
                      ? 'حدد منتجات "الأكثر مبيعًا" من لوحة التحكم لتظهر هنا.'
                      : 'Mark products as "Best Seller" from the dashboard to feature them here.'
                  }
                />
              )}

            {bestSellerList.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivalsEnabled && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ivory">
              {locale === 'ar'
                ? 'وصل حديثًا'
                : 'New Arrivals'}
            </h2>

            <Link
              to="/products"
              className="text-sm text-gold hover:underline"
            >
              {t.common.viewAll}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {productsLoading &&
              Array.from({ length: 4 }).map(
                (_, i) => (
                  <ProductCardSkeleton key={i} />
                ),
              )}

            {!productsLoading &&
              newArrivalList.length === 0 && (
                <EmptyState
                  title={
                    locale === 'ar'
                      ? 'لا توجد منتجات جديدة بعد'
                      : 'No new arrivals yet'
                  }
                />
              )}

            {newArrivalList.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </section>
      )}

      {/* Special offers */}
      {specialOffersEnabled && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="font-display text-2xl text-ivory">
              {locale === 'ar'
                ? 'عروض خاصة'
                : 'Special Offers'}
            </h2>

            {specialOfferList.length > 0 && (
              <Badge tone="rose">
                {locale === 'ar'
                  ? 'لفترة محدودة'
                  : 'Limited time'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {productsLoading &&
              Array.from({ length: 4 }).map(
                (_, i) => (
                  <ProductCardSkeleton key={i} />
                ),
              )}

            {!productsLoading &&
              specialOfferList.length === 0 && (
                <EmptyState
                  title={
                    locale === 'ar'
                      ? 'لا توجد عروض حاليًا'
                      : 'No offers right now'
                  }
                  description={
                    locale === 'ar'
                      ? 'أضيفي سعر خصم للمنتجات من لوحة التحكم لتظهر هنا.'
                      : 'Add a sale price to products from the dashboard to feature them here.'
                  }
                />
              )}

            {specialOfferList.map((p) => (
              <div key={p.id}>
                <ProductCard product={p} />

                <p className="mt-1 text-xs text-rose">
                  {locale === 'ar'
                    ? 'وفري'
                    : 'Save'}{' '}
                  {formatPrice(
                    p.price -
                      (p.sale_price ?? p.price),
                    locale,
                  )}{' '}
                  (
                  {computeDiscountPercent(
                    p.price,
                    p.sale_price,
                  )}
                  %)
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}