import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fetchHomepageSections, type HomepageSection } from '@/services/settings.service';

export function AnnouncementBar() {
  const { locale } = useLanguage();
  const { data: sections } = useQuery({ queryKey: ['homepage-sections'], queryFn: fetchHomepageSections });

  const section = (sections as unknown as HomepageSection[] | undefined)?.find(
    (s) => s.section_key === 'announcement_bar',
  );

  const textAr = (section?.content?.text_ar as string) ?? 'خصومات تصل إلى 50% وأكثر';
  const textEn = (section?.content?.text_en as string) ?? 'Discounts up to 50% and more';
  const enabled = section ? section.is_enabled : true;

  if (!enabled) return null;

  return (
    <div className="border-b border-surface-border bg-surface py-2 text-center text-xs tracking-wide text-gold">
      {locale === 'ar' ? textAr : textEn}
    </div>
  );
}
