import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  fetchAllBannersForAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  type BannerInput,
  type BannerRecord,
} from '@/services/settings.service';
import { buttonClasses } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

const emptyForm: BannerInput = {
  title_ar: '',
  title_en: '',
  image_url: '',
  link_url: '',
  is_active: true,
  sort_order: 0,
};

export function AdminBanners() {
  const queryClient = useQueryClient();
  const { data: banners, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: fetchAllBannersForAdmin });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerInput>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BannerRecord | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: (banners?.length ?? 0) + 1 });
    setImageFile(null);
    setModalOpen(true);
  }

  function openEdit(banner: BannerRecord) {
    setEditingId(banner.id);
    setForm({
      title_ar: banner.title_ar,
      title_en: banner.title_en,
      image_url: banner.image_url,
      link_url: banner.link_url,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setImageFile(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!imageFile && !form.image_url) {
      toast.error('الرجاء اختيار صورة للبانر');
      return;
    }
    setIsSaving(true);
    try {
      let imageUrl = form.image_url;
      if (imageFile) imageUrl = await uploadBannerImage(imageFile);
      const payload = { ...form, image_url: imageUrl };

      if (editingId) await updateBanner(editingId, payload);
      else await createBanner(payload);

      await queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editingId ? 'تم تحديث البانر' : 'تم إضافة البانر');
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
      await deleteBanner(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('تم حذف البانر');
    } catch {
      toast.error('تعذر الحذف');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleActive(banner: BannerRecord) {
    try {
      await updateBanner(banner.id, { is_active: !banner.is_active });
      await queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    } catch {
      toast.error('تعذر تحديث الحالة');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-ivory">البانرات الترويجية</h1>
        <button onClick={openCreate} className={buttonClasses('primary', 'md')}>
          <Plus size={16} className="me-1" /> إضافة بانر
        </button>
      </div>

      {isLoading && <p className="text-sm text-ivory-muted">جاري التحميل...</p>}
      {!isLoading && banners?.length === 0 && (
        <EmptyState title="لا توجد بانرات بعد" description="أضيفي بانرات ترويجية لتظهر في الصفحة الرئيسية." />
      )}

      {banners && banners.length > 0 && (
        <Card className="divide-y divide-surface-border">
          {banners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-3 p-3">
              <img src={banner.image_url} alt="" className="h-14 w-24 rounded-sm object-cover" />
              <div className="flex-1">
                <p className="text-sm text-ivory">{banner.title_ar || '(بدون عنوان)'}</p>
                <p className="text-xs text-ivory-faint">{banner.link_url}</p>
              </div>
              <button onClick={() => toggleActive(banner)}>
                <Badge tone={banner.is_active ? 'success' : 'neutral'}>{banner.is_active ? 'ظاهر' : 'مخفي'}</Badge>
              </button>
              <button onClick={() => openEdit(banner)} className="text-ivory-muted hover:text-gold">
                <Pencil size={16} />
              </button>
              <button onClick={() => setDeleteTarget(banner)} className="text-ivory-muted hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <AdminModal open={modalOpen} title={editingId ? 'تعديل البانر' : 'إضافة بانر'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-ivory-muted">العنوان (عربي)</span>
              <input
                value={form.title_ar ?? ''}
                onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ivory-muted">Title (English)</span>
              <input
                dir="ltr"
                value={form.title_en ?? ''}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-ivory-muted">الرابط عند الضغط (اختياري)</span>
            <input
              dir="ltr"
              value={form.link_url ?? ''}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="/products?category=..."
              className={inputClass}
            />
          </label>

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
                src={imageFile ? URL.createObjectURL(imageFile) : form.image_url || 'https://placehold.co/120x70/141217/b9975b?text=—'}
                alt=""
                className="h-14 w-24 rounded-sm object-cover"
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
        title="حذف البانر"
        description="هل أنتِ متأكدة من حذف هذا البانر؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const inputClass =
  'w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold';
