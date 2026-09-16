import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchStoreSettings, updateStoreSettings } from '@/services/settings.service';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { StoreSettings } from '@/types/domain';

export function AdminSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['store-settings'], queryFn: fetchStoreSettings });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSave() {
    if (!form) return;
    setIsSaving(true);
    try {
      await updateStoreSettings(form);
      await queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('تم حفظ الإعدادات');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !form) {
    return <p className="text-sm text-ivory-muted">جاري التحميل...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-2xl text-ivory">إعدادات المتجر</h1>

      <Card className="space-y-5 p-6">
        <Section title="الهوية">
          <div className="grid grid-cols-2 gap-3">
            <Field label="اسم المتجر (عربي)" value={form.store_name_ar} onChange={(v) => setForm({ ...form, store_name_ar: v })} />
            <Field label="Store Name (English)" value={form.store_name_en} onChange={(v) => setForm({ ...form, store_name_en: v })} dir="ltr" />
          </div>
        </Section>

        <Section title="الوصف">
          <div className="grid grid-cols-2 gap-3">
            <TextAreaField label="الوصف (عربي)" value={form.description_ar} onChange={(v) => setForm({ ...form, description_ar: v })} />
            <TextAreaField label="Description (English)" value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} dir="ltr" />
          </div>
        </Section>

        <Section title="التواصل">
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم الهاتف" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} dir="ltr" />
            <Field label="البريد الإلكتروني" value={form.email} onChange={(v) => setForm({ ...form, email: v })} dir="ltr" />
          </div>
          <Field label="العنوان" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </Section>

        <Section title="الشحن والدفع">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="رسوم الشحن (ج.م)"
              value={String(form.shipping_fee)}
              onChange={(v) => setForm({ ...form, shipping_fee: Number(v) || 0 })}
              dir="ltr"
            />
            <Field
              label="رقم محفظة Vodafone Cash"
              value={form.vodafone_cash_number}
              onChange={(v) => setForm({ ...form, vodafone_cash_number: v })}
              dir="ltr"
            />
          </div>
          <div>
            <span className="mb-2 block text-sm text-ivory-muted">طرق الدفع المفعّلة</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-ivory-muted">
                <input
                  type="checkbox"
                  checked={form.payment_methods_enabled.includes('cash_on_delivery')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_methods_enabled: e.target.checked
                        ? [...form.payment_methods_enabled, 'cash_on_delivery']
                        : form.payment_methods_enabled.filter((m) => m !== 'cash_on_delivery'),
                    })
                  }
                  className="accent-gold"
                />
                الدفع عند الاستلام
              </label>
              <label className="flex items-center gap-2 text-sm text-ivory-muted">
                <input
                  type="checkbox"
                  checked={form.payment_methods_enabled.includes('vodafone_cash')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payment_methods_enabled: e.target.checked
                        ? [...form.payment_methods_enabled, 'vodafone_cash']
                        : form.payment_methods_enabled.filter((m) => m !== 'vodafone_cash'),
                    })
                  }
                  className="accent-gold"
                />
                Vodafone Cash
              </label>
            </div>
          </div>
        </Section>

        <button onClick={handleSave} disabled={isSaving} className={buttonClasses('primary', 'md', 'w-full')}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-gold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ivory-muted">{label}</span>
      <input
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ivory-muted">{label}</span>
      <textarea
        dir={dir}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold"
      />
    </label>
  );
}
