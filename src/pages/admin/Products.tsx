import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import {
  fetchAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  type ProductInput,
} from '@/services/products.service';
import { fetchActiveCategories } from '@/services/categories.service';
import { formatPrice } from '@/utils/currency';
import { buttonClasses } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { Product } from '@/types/domain';

const emptyForm: ProductInput = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  slug: '',
  price: 0,
  sale_price: null,
  category_id: '',
  stock_quantity: 0,
  sku: '',
  is_featured: false,
  is_best_seller: false,
  is_new_arrival: false,
  is_active: true,
};

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: fetchAllProductsForAdmin,
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchActiveCategories });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPendingImages([]);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name_ar: product.name_ar,
      name_en: product.name_en,
      description_ar: product.description_ar,
      description_en: product.description_en,
      slug: (product as unknown as { slug: string }).slug ?? slugify(product.name_en),
      price: product.price,
      sale_price: product.sale_price,
      category_id: product.category_id,
      stock_quantity: product.stock_quantity,
      sku: product.sku,
      is_featured: product.is_featured,
      is_best_seller: product.is_best_seller,
      is_new_arrival: product.is_new_arrival,
      is_active: product.is_active,
    });
    setPendingImages([]);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name_ar || !form.name_en || !form.category_id || form.price <= 0) {
      toast.error('الرجاء إكمال الحقول المطلوبة (الاسم، التصنيف، السعر)');
      return;
    }

    setIsSaving(true);
    try {
      let productId = editingId;
      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        const created = await createProduct({ ...form, slug: form.slug || slugify(form.name_en) });
        productId = created.id;
      }

      if (productId && pendingImages.length > 0) {
        for (const file of pendingImages) {
          const url = await uploadProductImage(productId, file);
          await import('@/services/products.service').then((m) => m.addProductImage(productId!, url));
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(editingId ? 'تم تحديث المنتج' : 'تم إضافة المنتج');
      setModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم حذف المنتج');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر الحذف');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleRemoveExistingImage(imageId: string) {
    try {
      await deleteProductImage(imageId);
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('تم حذف الصورة');
    } catch {
      toast.error('تعذر حذف الصورة');
    }
  }

  const editingProduct = editingId ? products?.find((p) => p.id === editingId) : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ivory">المنتجات</h1>
        <button onClick={openCreate} className={buttonClasses('primary', 'md')}>
          <Plus size={16} className="me-1" /> إضافة منتج
        </button>
      </div>

      {isLoading && <p className="text-sm text-ivory-muted">جاري التحميل...</p>}

      {!isLoading && products?.length === 0 && (
        <EmptyState title="لا توجد منتجات بعد" description="ابدئي بإضافة أول منتج في متجرك." />
      )}

      {products && products.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-start text-ivory-faint">
                <th className="p-3 text-start">المنتج</th>
                <th className="p-3 text-start">التصنيف</th>
                <th className="p-3 text-start">السعر</th>
                <th className="p-3 text-start">المخزون</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-surface-border last:border-0">
                  <td className="flex items-center gap-3 p-3">
                    <img
                      src={product.images?.[0]?.url ?? 'https://placehold.co/80x100/141217/b9975b?text=—'}
                      alt=""
                      className="h-12 w-10 rounded-sm object-cover"
                    />
                    <div>
                      <p className="text-ivory">{product.name_ar}</p>
                      <p className="text-xs text-ivory-faint">{product.sku}</p>
                    </div>
                  </td>
                  <td className="p-3 text-ivory-muted">
                    {categories?.find((c) => c.id === product.category_id)?.name_ar ?? '—'}
                  </td>
                  <td className="p-3 text-ivory-muted">
                    {formatPrice(product.sale_price ?? product.price, 'ar')}
                    {product.sale_price && (
                      <span className="ms-1 text-xs text-ivory-faint line-through">
                        {formatPrice(product.price, 'ar')}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {product.stock_quantity === 0 ? (
                      <Badge tone="danger">غير متوفر</Badge>
                    ) : product.stock_quantity <= 5 ? (
                      <Badge tone="rose">{product.stock_quantity} — منخفض</Badge>
                    ) : (
                      <span className="text-ivory-muted">{product.stock_quantity}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge tone={product.is_active ? 'success' : 'neutral'}>
                      {product.is_active ? 'ظاهر' : 'مخفي'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="text-ivory-muted hover:text-gold">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="text-ivory-muted hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <AdminModal open={modalOpen} title={editingId ? 'تعديل المنتج' : 'إضافة منتج'} onClose={() => setModalOpen(false)}>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="الاسم بالعربية" value={form.name_ar} onChange={(v) => setForm({ ...form, name_ar: v })} />
            <TextField label="Name (English)" value={form.name_en} onChange={(v) => setForm({ ...form, name_en: v })} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextArea label="الوصف بالعربية" value={form.description_ar} onChange={(v) => setForm({ ...form, description_ar: v })} />
            <TextArea label="Description (English)" value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} dir="ltr" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ivory-muted">التصنيف</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className={selectClass}
            >
              <option value="">اختر التصنيف</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumberField label="السعر" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <NumberField
              label="سعر الخصم"
              value={form.sale_price ?? ''}
              onChange={(v) => setForm({ ...form, sale_price: v === 0 ? null : v })}
              allowEmpty
            />
            <NumberField label="الكمية" value={form.stock_quantity} onChange={(v) => setForm({ ...form, stock_quantity: v })} />
          </div>

          <TextField label="SKU (اختياري)" value={form.sku ?? ''} onChange={(v) => setForm({ ...form, sku: v })} dir="ltr" />

          <div className="grid grid-cols-2 gap-2">
            <CheckField label="منتج مميز" checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
            <CheckField label="الأكثر مبيعًا" checked={form.is_best_seller} onChange={(v) => setForm({ ...form, is_best_seller: v })} />
            <CheckField label="وصل حديثًا" checked={form.is_new_arrival} onChange={(v) => setForm({ ...form, is_new_arrival: v })} />
            <CheckField label="ظاهر في المتجر" checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          </div>

          {/* Images */}
          <div>
            <label className="mb-1.5 block text-sm text-ivory-muted">الصور</label>
            <div className="flex flex-wrap gap-2">
              {editingProduct?.images?.map((img) => (
                <div key={img.id} className="relative">
                  <img src={img.url} alt="" className="h-16 w-16 rounded-sm object-cover" />
                  <button
                    onClick={() => handleRemoveExistingImage(img.id)}
                    className="absolute -top-1.5 -end-1.5 rounded-full bg-danger p-0.5 text-ivory"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              {pendingImages.map((file, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-sm border border-gold/40">
                  <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-sm border border-dashed border-surface-border text-ivory-faint hover:border-gold hover:text-gold">
                <ImagePlus size={18} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setPendingImages(Array.from(e.target.files ?? []))}
                />
              </label>
            </div>
          </div>

          <button onClick={handleSave} disabled={isSaving} className={buttonClasses('primary', 'md', 'w-full')}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف المنتج"
        description={`هل أنتِ متأكدة من حذف "${deleteTarget?.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const selectClass =
  'w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold';

function TextField({
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
      <input dir={dir} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} />
    </label>
  );
}

function TextArea({
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
      <textarea dir={dir} rows={2} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  allowEmpty,
}: {
  label: string;
  value: number | '';
  onChange: (v: number) => void;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-ivory-muted">{label}</span>
      <input
        type="number"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value === '' && allowEmpty ? 0 : Number(e.target.value))}
        className={selectClass}
      />
    </label>
  );
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ivory-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-gold" />
      {label}
    </label>
  );
}
