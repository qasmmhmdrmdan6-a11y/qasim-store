import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fetchHomepageSections,
  upsertHomepageSection,
  type HomepageSection,
} from '@/services/settings.service';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface AnnouncementContent {
  text_ar: string;
  text_en: string;
}

interface HeroContent {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  button_text_ar: string;
  button_text_en: string;
  button_link: string;
  image_url: string;
}

export function AdminHomepageEditor() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: fetchHomepageSections,
  });

  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  const [announcement, setAnnouncement] =
    useState<AnnouncementContent>({
      text_ar: '',
      text_en: '',
    });

  const [heroEnabled, setHeroEnabled] = useState(true);

  const [hero, setHero] = useState<HeroContent>({
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    button_text_ar: '',
    button_text_en: '',
    button_link: '/products',
    image_url: '',
  });

  const [heroImageFile, setHeroImageFile] =
    useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [simpleSections, setSimpleSections] =
    useState<Record<string, boolean>>({
      categories: true,
      best_sellers: true,
      new_arrivals: true,
      special_offers: true,
      banners: true,
    });

  const SIMPLE_SECTION_LABELS: Record<string, string> = {
    categories: 'قسم التصنيفات',
    best_sellers: 'قسم الأكثر مبيعًا',
    new_arrivals: 'قسم وصل حديثًا',
    special_offers: 'قسم العروض الخاصة',
    banners: 'قسم البانرات الترويجية',
  };

  useEffect(() => {
    if (!sections) return;

    const list = sections as unknown as HomepageSection[];

    const ann = list.find(
      (s) => s.section_key === 'announcement_bar',
    );

    if (ann) {
      setAnnouncementEnabled(ann.is_enabled);

      setAnnouncement({
        text_ar:
          (ann.content?.text_ar as string) ??
          'خصومات تصل إلى 50% وأكثر',
        text_en:
          (ann.content?.text_en as string) ??
          'Discounts up to 50% and more',
      });
    }

    const heroSection = list.find(
      (s) => s.section_key === 'hero',
    );

    if (heroSection) {
      setHeroEnabled(heroSection.is_enabled);

      setHero({
        title_ar:
          (heroSection.content?.title_ar as string) ?? '',
        title_en:
          (heroSection.content?.title_en as string) ?? '',
        description_ar:
          (heroSection.content?.description_ar as string) ?? '',
        description_en:
          (heroSection.content?.description_en as string) ?? '',
        button_text_ar:
          (heroSection.content?.button_text_ar as string) ?? '',
        button_text_en:
          (heroSection.content?.button_text_en as string) ?? '',
        button_link:
          (heroSection.content?.button_link as string) ??
          '/products',
        image_url:
          (heroSection.content?.image_url as string) ?? '',
      });
    }
  }, [sections]);

  useEffect(() => {
    if (!sections) return;

    const list = sections as unknown as HomepageSection[];

    setSimpleSections((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next)) {
        const found = list.find(
          (s) => s.section_key === key,
        );

        if (found) {
          next[key] = found.is_enabled;
        }
      }

      return next;
    });
  }, [sections]);

  async function uploadHeroImage() {
    if (!heroImageFile) {
      return hero.image_url;
    }

    setIsUploading(true);

    try {
      const fileExt =
        heroImageFile.name.split('.').pop()?.toLowerCase() ||
        'jpg';

      const fileName = `hero-${Date.now()}.${fileExt}`;

      const filePath = `hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, heroImageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: heroImageFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('تعذر الحصول على رابط الصورة');
      }

      setHero((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));

      setHeroImageFile(null);

      toast.success('تم رفع صورة القسم الرئيسي');

      return data.publicUrl;
    } catch (err) {
      console.error(err);

      toast.error(
        err instanceof Error
          ? err.message
          : 'تعذر رفع صورة القسم الرئيسي',
      );

      throw err;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      let imageUrl = hero.image_url;

      if (heroImageFile) {
        imageUrl = await uploadHeroImage();
      }

      await upsertHomepageSection({
        section_key: 'announcement_bar',
        is_enabled: announcementEnabled,
        content: announcement,
        sort_order: 0,
      });

      await upsertHomepageSection({
        section_key: 'hero',
        is_enabled: heroEnabled,
        content: {
          ...hero,
          image_url: imageUrl,
        },
        sort_order: 1,
      });

      const sortOrders: Record<string, number> = {
        categories: 2,
        best_sellers: 3,
        new_arrivals: 4,
        special_offers: 5,
        banners: 6,
      };

      for (const [key, enabled] of Object.entries(
        simpleSections,
      )) {
        await upsertHomepageSection({
          section_key: key,
          is_enabled: enabled,
          content: {},
          sort_order: sortOrders[key] ?? 9,
        });
      }

      setHero((prev) => ({
        ...prev,
        image_url: imageUrl,
      }));

      await queryClient.invalidateQueries({
        queryKey: ['homepage-sections'],
      });

      toast.success('تم حفظ التغييرات');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'تعذر الحفظ',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-ivory-muted">
        جاري التحميل...
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl text-ivory">
        إدارة الصفحة الرئيسية
      </h1>

      {/* شريط الإعلانات */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gold">
            شريط الإعلانات
          </h3>

          <ToggleLabel
            checked={announcementEnabled}
            onChange={setAnnouncementEnabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="النص (عربي)"
            value={announcement.text_ar}
            onChange={(v) =>
              setAnnouncement({
                ...announcement,
                text_ar: v,
              })
            }
          />

          <Field
            label="Text (English)"
            value={announcement.text_en}
            onChange={(v) =>
              setAnnouncement({
                ...announcement,
                text_en: v,
              })
            }
            dir="ltr"
          />
        </div>
      </Card>

      {/* Hero */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gold">
            القسم الرئيسي (Hero)
          </h3>

          <ToggleLabel
            checked={heroEnabled}
            onChange={setHeroEnabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="العنوان (عربي)"
            value={hero.title_ar}
            onChange={(v) =>
              setHero({
                ...hero,
                title_ar: v,
              })
            }
          />

          <Field
            label="Title (English)"
            value={hero.title_en}
            onChange={(v) =>
              setHero({
                ...hero,
                title_en: v,
              })
            }
            dir="ltr"
          />

          <Field
            label="الوصف (عربي)"
            value={hero.description_ar}
            onChange={(v) =>
              setHero({
                ...hero,
                description_ar: v,
              })
            }
          />

          <Field
            label="Description (English)"
            value={hero.description_en}
            onChange={(v) =>
              setHero({
                ...hero,
                description_en: v,
              })
            }
            dir="ltr"
          />

          <Field
            label="نص الزر (عربي)"
            value={hero.button_text_ar}
            onChange={(v) =>
              setHero({
                ...hero,
                button_text_ar: v,
              })
            }
          />

          <Field
            label="Button Text (English)"
            value={hero.button_text_en}
            onChange={(v) =>
              setHero({
                ...hero,
                button_text_en: v,
              })
            }
            dir="ltr"
          />

          <Field
            label="رابط الزر"
            value={hero.button_link}
            onChange={(v) =>
              setHero({
                ...hero,
                button_link: v,
              })
            }
            dir="ltr"
          />
        </div>

        {/* Hero Image */}
        <div className="space-y-3 border-t border-surface-border pt-4">
          <label className="block">
            <span className="mb-2 block text-sm text-ivory-muted">
              صورة القسم الرئيسي
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setHeroImageFile(file);
              }}
              className="block w-full cursor-pointer rounded-sm border border-surface-border bg-surface-2 px-3 py-2 text-sm text-ivory"
            />
          </label>

          {heroImageFile && (
            <p className="text-xs text-ivory-muted">
              الصورة المختارة: {heroImageFile.name}
            </p>
          )}

          {hero.image_url && (
            <div className="overflow-hidden rounded-sm border border-surface-border">
              <img
                src={hero.image_url}
                alt="Hero preview"
                className="h-48 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <p className="text-xs text-ivory-faint">
            اختر صورة من جهازك، ثم اضغط حفظ التغييرات.
          </p>
        </div>
      </Card>

      {/* أقسام الصفحة الرئيسية */}
      <Card className="space-y-4 p-6">
        <h3 className="text-sm font-medium text-gold">
          أقسام الصفحة الرئيسية
        </h3>

        <p className="text-xs text-ivory-faint">
          يمكنكِ إظهار أو إخفاء أي قسم من الصفحة الرئيسية.
          لإدارة محتوى البانرات نفسها، انتقلي إلى صفحة{' '}
          <Link
            to="/admin/banners"
            className="text-gold hover:underline"
          >
            البانرات
          </Link>
          .
        </p>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SIMPLE_SECTION_LABELS).map(
            ([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-sm text-ivory-muted"
              >
                <input
                  type="checkbox"
                  checked={simpleSections[key] ?? true}
                  onChange={(e) =>
                    setSimpleSections({
                      ...simpleSections,
                      [key]: e.target.checked,
                    })
                  }
                  className="accent-gold"
                />

                {label}
              </label>
            ),
          )}
        </div>
      </Card>

      {/* حفظ */}
      <button
        onClick={handleSave}
        disabled={isSaving || isUploading}
        className={buttonClasses(
          'primary',
          'md',
          'w-full',
        )}
      >
        {isUploading
          ? 'جاري رفع الصورة...'
          : isSaving
            ? 'جاري الحفظ...'
            : 'حفظ التغييرات'}
      </button>
    </div>
  );
}

function ToggleLabel({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ivory-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-gold"
      />

      ظاهر
    </label>
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
      <span className="mb-1.5 block text-sm text-ivory-muted">
        {label}
      </span>

      <input
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-sm text-ivory outline-none focus:border-gold"
      />
    </label>
  );
}