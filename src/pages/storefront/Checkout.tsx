import { useEffect, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCartStore } from '@/store/cartStore';
import { useStoreSettings } from '@/hooks/useCatalog';
import { createOrder, uploadPaymentReceipt } from '@/services/orders.service';
import { formatPrice } from '@/utils/currency';
import { buttonClasses } from '@/components/ui/Button';
import { EGYPT_GOVERNORATES_AR, type PaymentMethod } from '@/types/domain';

const EGYPT_PHONE_RE = /^01[0125][0-9]{8}$/;

export function Checkout() {
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const { lines, clear } = useCartStore();
  const { data: settings } = useStoreSettings();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!settings) return;
    if (!settings.payment_methods_enabled.includes(paymentMethod)) {
      setPaymentMethod(settings.payment_methods_enabled[0] ?? 'cash_on_delivery');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  if (lines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const subtotal = lines.reduce((sum, l) => sum + (l.product.sale_price ?? l.product.price) * l.quantity, 0);
  const shipping = settings?.shipping_fee ?? 0;
  const total = subtotal + shipping;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!customerName.trim()) next.customerName = locale === 'ar' ? 'الاسم مطلوب' : 'Name is required';
    if (!EGYPT_PHONE_RE.test(phone)) {
      next.phone = locale === 'ar' ? 'رقم هاتف غير صحيح' : 'Invalid phone number';
    }
    if (!governorate) next.governorate = locale === 'ar' ? 'اختاري المحافظة' : 'Select a governorate';
    if (!address.trim() || address.trim().length < 10) {
      next.address = locale === 'ar' ? 'الرجاء إدخال عنوان تفصيلي' : 'Please enter a detailed address';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const orderId = await createOrder({
        customerName,
        phone,
        governorate,
        address,
        notes: notes || undefined,
        paymentMethod,
        lines,
      });

      if (paymentMethod === 'vodafone_cash' && receiptFile) {
        try {
          await uploadPaymentReceipt(orderId, receiptFile);
        } catch {
          // Order already exists; a missing receipt just means the admin
          // will ask for it — don't block order confirmation over this.
          toast.error(locale === 'ar' ? 'تم إنشاء الطلب لكن تعذر رفع الإيصال' : 'Order created but receipt upload failed');
        }
      }

      clear();
      navigate('/', { state: { orderConfirmed: orderId } });
      toast.success(locale === 'ar' ? 'تم تأكيد طلبك بنجاح' : 'Your order has been placed');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : locale === 'ar'
            ? 'حدث خطأ أثناء إنشاء الطلب'
            : 'Something went wrong placing your order',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="font-display text-2xl text-ivory">{t.checkout.guestCheckout}</h1>

      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <Field label={t.checkout.fullName} error={errors.customerName}>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label={t.checkout.phone} error={errors.phone}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
              className={inputClass}
            />
          </Field>

          <Field label={t.checkout.governorate} error={errors.governorate}>
            <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className={inputClass}>
              <option value="">{locale === 'ar' ? 'اختاري المحافظة' : 'Select governorate'}</option>
              {EGYPT_GOVERNORATES_AR.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t.checkout.address} error={errors.address}>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label={t.checkout.notes}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
          </Field>

          {/* Payment method */}
          <div>
            <p className="mb-2 text-sm text-ivory-muted">{locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</p>
            <div className="flex flex-col gap-2">
              {(!settings || settings.payment_methods_enabled.includes('cash_on_delivery')) && (
                <PaymentOption
                  selected={paymentMethod === 'cash_on_delivery'}
                  onSelect={() => setPaymentMethod('cash_on_delivery')}
                  label={t.paymentStatus.cashOnDelivery}
                />
              )}
              {(!settings || settings.payment_methods_enabled.includes('vodafone_cash')) && (
                <PaymentOption
                  selected={paymentMethod === 'vodafone_cash'}
                  onSelect={() => setPaymentMethod('vodafone_cash')}
                  label="Vodafone Cash"
                />
              )}
            </div>

            {paymentMethod === 'vodafone_cash' && settings && (
              <div className="mt-3 rounded-sm border border-gold/30 bg-gold/5 p-4 text-sm text-ivory-muted">
                <p>
                  {locale === 'ar' ? 'حوّلي المبلغ إلى رقم المحفظة: ' : 'Transfer the amount to wallet number: '}
                  <span dir="ltr" className="font-medium text-gold">
                    {settings.vodafone_cash_number}
                  </span>
                </p>
                <p className="mt-2">
                  {locale === 'ar'
                    ? 'بعد التحويل، ارفعي صورة إيصال التحويل (اختياري). سيتم مراجعة الدفع من الإدارة قبل تأكيد الطلب.'
                    : 'After transferring, upload a screenshot of the receipt (optional). Payment will be reviewed by the store before confirmation.'}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  className="mt-3 text-xs text-ivory-muted"
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className={buttonClasses('primary', 'lg', 'w-full')}>
            {isSubmitting ? t.common.loading : t.checkout.placeOrder}
          </button>
        </form>

        {/* Summary */}
        <aside className="h-fit w-full shrink-0 rounded-md border border-surface-border bg-surface p-5 md:w-72">
          <h2 className="mb-3 text-sm font-medium text-ivory">{locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</h2>
          <div className="space-y-2 text-sm text-ivory-muted">
            {lines.map((l) => (
              <div key={l.product.id} className="flex justify-between">
                <span className="line-clamp-1">
                  {locale === 'ar' ? l.product.name_ar : l.product.name_en} × {l.quantity}
                </span>
                <span>{formatPrice((l.product.sale_price ?? l.product.price) * l.quantity, locale)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-surface-border pt-4 text-sm text-ivory-muted">
            <span>{t.checkout.subtotal}</span>
            <span>{formatPrice(subtotal, locale)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-ivory-muted">
            <span>{t.checkout.shipping}</span>
            <span>{formatPrice(shipping, locale)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-medium text-ivory">
            <span>{t.checkout.total}</span>
            <span className="text-gold">{formatPrice(total, locale)}</span>
          </div>
        </aside>
      </div>

      <Link to="/cart" className="mt-6 inline-block text-sm text-ivory-muted hover:text-gold">
        {locale === 'ar' ? '← العودة للسلة' : '← Back to cart'}
      </Link>
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ivory-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

function PaymentOption({
  selected,
  onSelect,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-start text-sm transition-colors ${
        selected ? 'border-gold text-gold' : 'border-surface-border text-ivory-muted hover:border-ivory-faint'
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border ${selected ? 'border-gold bg-gold' : 'border-surface-border'}`}
      />
      {label}
    </button>
  );
}
