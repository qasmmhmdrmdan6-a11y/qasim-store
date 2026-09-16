import type { Locale } from '@/i18n/dictionary';

/** Formats a number as an EGP price string, e.g. 349 -> "٣٤٩ ج.م" (ar) / "349 EGP" (en) */
export function formatPrice(amount: number, locale: Locale = 'ar'): string {
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: 2,
  }).format(amount);

  return locale === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`;
}

/** Computes discount percentage from an original and sale price. Returns 0 if no discount. */
export function computeDiscountPercent(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
