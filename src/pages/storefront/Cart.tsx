import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useLanguage, pickLocalized } from '@/i18n/LanguageProvider';
import { useCartStore } from '@/store/cartStore';
import { useStoreSettings } from '@/hooks/useCatalog';
import { formatPrice } from '@/utils/currency';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function Cart() {
  const { locale, t } = useLanguage();
  const { lines, setQuantity, removeLine } = useCartStore();
  const { data: settings } = useStoreSettings();

  const subtotal = lines.reduce(
    (sum, l) => sum + (l.product.sale_price ?? l.product.price) * l.quantity,
    0,
  );
  const shipping = lines.length > 0 ? settings?.shipping_fee ?? 0 : 0;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 md:px-6">
        <EmptyState
          title={locale === 'ar' ? 'سلتكِ فارغة' : 'Your cart is empty'}
          description={locale === 'ar' ? 'أضيفي بعض المنتجات لتظهر هنا.' : 'Add some products to see them here.'}
          action={
            <Link to="/products" className={buttonClasses('primary', 'md')}>
              {locale === 'ar' ? 'تصفحي المنتجات' : 'Browse Products'}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-display text-2xl text-ivory">{t.nav.cart}</h1>

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <div className="flex-1 divide-y divide-surface-border">
          {lines.map((line) => {
            const name = pickLocalized(line.product, 'name', locale);
            const unitPrice = line.product.sale_price ?? line.product.price;
            return (
              <div key={line.product.id} className="flex items-center gap-4 py-4">
                <img
                  src={line.product.image_url ?? 'https://placehold.co/200x250/141217/b9975b?text=QASIM'}
                  alt={name}
                  className="h-20 w-16 rounded-sm object-cover"
                />
                <div className="flex-1">
                  <Link to={`/products/${line.product.slug}`} className="text-sm text-ivory hover:text-gold">
                    {name}
                  </Link>
                  <p className="mt-1 text-sm text-gold">{formatPrice(unitPrice, locale)}</p>
                </div>
                <div className="flex items-center rounded-sm border border-surface-border">
                  <button
                    onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                    className="p-2 text-ivory-muted hover:text-gold"
                    aria-label="decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm text-ivory">{line.quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(line.product.id, Math.min(line.product.stock_quantity, line.quantity + 1))
                    }
                    className="p-2 text-ivory-muted hover:text-gold"
                    aria-label="increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeLine(line.product.id)}
                  className="p-2 text-ivory-faint hover:text-danger"
                  aria-label="remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <aside className="w-full shrink-0 rounded-md border border-surface-border bg-surface p-5 md:w-72">
          <div className="flex justify-between text-sm text-ivory-muted">
            <span>{t.checkout.subtotal}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-ivory-muted">
            <span>{t.checkout.shipping}</span>
            <span>{formatPrice(shipping, locale)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-surface-border pt-4 text-base font-medium text-ivory">
            <span>{t.checkout.total}</span>
            <span className="text-gold">{formatPrice(total, locale)}</span>
          </div>
          <Link to="/checkout" className={buttonClasses('primary', 'lg', 'mt-6 w-full')}>
            {t.checkout.placeOrder}
          </Link>
        </aside>
      </div>
    </div>
  );
}
