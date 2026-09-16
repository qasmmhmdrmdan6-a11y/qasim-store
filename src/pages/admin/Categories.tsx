import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import {
  fetchAllCategoriesForAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  type CategoryInput,
} from '@/services/categories.service';
import { buttonClasses } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { Category } from '@/types/domain';

const emptyForm: CategoryInput = {
  name_ar: '',
  name_en: '',
  slug: '',
  image_url: null,
  sort_order: 0,
  is_active: true,
};

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchAllCategoriesForAdmin,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: (categories?.length ?? 0) + 1 });
    setImageFile(null);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setForm({
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      slug: cat.slug,
      image_url: cat.image_url,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setImageFile(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name_ar || !form.name_en) {
      toast.error('الرجاء إدخال اسم التصنيف باللغتين');
      return;
    }
    setIsSaving(true);
    try {
      const slug = form.slug || slugify(form.name_en);
      let imageUrl = form.image_url;
      if (imageFile) {
        imageUrl = await uploadCategoryImage(slug, imageFile);
      }
      const payload = { ...form, slug, image_url: imageUrl };

      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }

      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editingId ? 'تم تحديث التصنيف' : 'تم إضافة التصنيف');
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
      await deleteCategory(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('تم حذف التصنيف');
    } catch {
      toast.error('تعذر الحذف — تأكدي من عدم وجود منتجات مرتبطة بهذا التصنيف');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleActive(cat: Category) {
    try {
      await updateCategory(cat.id, { is_active: !cat.is_active });
      await queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch {
      toast.error('تعذر تحديث الحالة');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ivory">التصنيفات</h1>
        <button onClick={openCreate} className={buttonClasses('primary', 'md')}>
          <Plus size={16} className="me-1" /> إضافة تصنيف
        </button>
      </div>

      {isLoading && <p className="text-sm text-ivory-muted">جاري التحميل...</p>}
      {!isLoading && categories?.length === 0 && (
        <EmptyState title="لا توجد تصنيفات بعد" description="أضيفي أول تصنيف لتنظيم منتجاتك." />
      )}

      {categories && categories.length > 0 && (
        <Card className="divide-y divide-surface-border">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 p-3">
              <GripVertical size={16} className="text-ivory-faint" />
              <img
                src={cat.image_url ?? 'https://placehold.co/60x60/141217/b9975b?text=—'}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm text-ivory">{cat.name_ar}</p>
                <p className="text-xs text-ivory-faint">{cat.name_en} · /{cat.slug}</p>
              </div>
              <button onClick={() => toggleActive(cat)}>
                <Badge tone={cat.is_active ? 'success' : 'neutral'}>{cat.is_active ? 'ظاهر' : 'مخفي'}</Badge>
              </button>
              <button onClick={() => openEdit(cat)} className="text-ivory-muted hover:text-gold">
                <Pencil size={16} />
              </button>
              <button onClick={() => setDeleteTarget(cat)} className="text-ivory-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <AdminModal open={modalOpen} title={editingId ? 'تعديل التصنيف' : 'إضافة تصنيف'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ivory-muted">الاسم بالعربية</span>
              <input
                value={form.name_ar}
                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ivory-muted">Name (English)</span>
              <input
                dir="ltr"
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-ivory-muted">ترتيب الظهور</span>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              className={inputClass}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm text-ivory-muted">الصورة</span>
            <div className="flex items-center gap-3">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : form.image_url ?? 'https://placehold.co/60x60/141217/b9975b?text=—'}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-xs text-ivory-muted" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ivory-muted">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-gold"
            />
            ظاهر في المتجر
          </label>

          <button onClick={handleSave} disabled={isSaving} className={buttonClasses('primary', 'md', 'w-full')}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </AdminModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف التصنيف"
        description={`هل أنتِ متأكدة من حذف "${deleteTarget?.name_ar}"؟`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold';
