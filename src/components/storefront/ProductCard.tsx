import { Link } from 'react-router-dom';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, computeDiscountPercent } from '@/utils/currency';
import type { Product } from '@/types/domain';

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useLanguage();
  const name = pickLocalized(product, 'name', locale);
  const image = product.images?.[0]?.url ?? 'https://placehold.co/600x750/141217/b9975b?text=QASIM';
  const discount = computeDiscountPercent(product.price, product.sale_price);
  const isOut = product.stock_quantity <= 0;
  const isLow = !isOut && product.stock_quantity <= 5;

  return (
    <Link to={`/products/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-surface-2">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {discount > 0 && <Badge tone="rose">-{discount}%</Badge>}
          {product.is_new_arrival && <Badge tone="gold">{locale === 'ar' ? 'جديد' : 'New'}</Badge>}
        </div>
        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
            <span className="text-sm text-ivory-muted">{t.common.outOfStock}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="line-clamp-1 text-sm text-ivory group-hover:text-gold">{name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-medium text-gold">
            {formatPrice(product.sale_price ?? product.price, locale)}
          </span>
          {product.sale_price && (
            <span className="text-xs text-ivory-faint line-through">
              {formatPrice(product.price, locale)}
            </span>
          )}
        </div>
        {isLow && <p className="mt-1 text-xs text-rose">{t.common.lowStock}</p>}
      </div>
    </Link>
  );
}
