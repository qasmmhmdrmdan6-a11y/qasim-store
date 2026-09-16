import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Minus, Plus } from 'lucide-react';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { useProduct, useRelatedProducts } from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, computeDiscountPercent } from '@/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { locale, t } = useLanguage();
  const { data: product, isLoading } = useProduct(slug);
  const { data: related } = useRelatedProducts(product?.category_id, product?.id);
  const addLine = useCartStore((s) => s.addLine);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl text-ivory">
          {locale === 'ar' ? 'المنتج غير موجود' : 'Product not found'}
        </h1>
        <Link to="/products" className="mt-4 inline-block text-gold hover:underline">
          {locale === 'ar' ? 'العودة للمنتجات' : 'Back to products'}
        </Link>
      </div>
    );
  }

  const name = pickLocalized(product, 'name', locale);
  const description = pickLocalized(product, 'description', locale);
  const images = product.images?.length ? product.images : [{ id: 'placeholder', url: 'https://placehold.co/800x1000/141217/b9975b?text=QASIM', product_id: product.id, sort_order: 0 }];
  const discount = computeDiscountPercent(product.price, product.sale_price);
  const isOut = product.stock_quantity <= 0;
  const isLow = !isOut && product.stock_quantity <= 5;

  function handleAddToCart() {
    if (!product) return;
    addLine({
      product: {
        id: product.id,
        slug: product.slug,
        name_ar: product.name_ar,
        name_en: product.name_en,
        price: product.price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        image_url: images[0]?.url ?? null,
      },
      quantity,
    });
    toast.success(locale === 'ar' ? 'تمت الإضافة إلى السلة' : 'Added to cart');
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-sm bg-surface-2">
            <img src={images[activeImage].url} alt={name} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 overflow-hidden rounded-sm border ${
                    i === activeImage ? 'border-gold' : 'border-surface-border'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-3 flex gap-2">
            {discount > 0 && <Badge tone="rose">-{discount}%</Badge>}
            {product.is_new_arrival && <Badge tone="gold">{locale === 'ar' ? 'جديد' : 'New'}</Badge>}
          </div>
          <h1 className="font-display text-3xl text-ivory">{name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-medium text-gold">
              {formatPrice(product.sale_price ?? product.price, locale)}
            </span>
            {product.sale_price && (
              <span className="text-base text-ivory-faint line-through">{formatPrice(product.price, locale)}</span>
            )}
          </div>

          <p className="mt-4 leading-relaxed text-ivory-muted">{description}</p>

          <div className="mt-4">
            {isOut ? (
              <p className="text-sm text-danger">{t.common.outOfStock}</p>
            ) : isLow ? (
              <p className="text-sm text-rose">
                {t.common.lowStock} — {product.stock_quantity} {locale === 'ar' ? 'قطعة متبقية' : 'left'}
              </p>
            ) : (
              <p className="text-sm text-success">{locale === 'ar' ? 'متوفر' : 'In stock'}</p>
            )}
          </div>

          {!isOut && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-sm border border-surface-border">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-ivory-muted hover:text-gold"
                  aria-label="decrease"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-ivory">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                  className="p-2.5 text-ivory-muted hover:text-gold"
                  aria-label="increase"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button onClick={handleAddToCart} className={buttonClasses('primary', 'lg', 'flex-1')}>
                {t.common.addToCart}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-ivory">
            {locale === 'ar' ? 'قد يعجبكِ أيضًا' : 'You may also like'}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
