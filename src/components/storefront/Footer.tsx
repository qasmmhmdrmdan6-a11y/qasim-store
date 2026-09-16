import { useLanguage } from '@/i18n/LanguageProvider';

export function Footer({ storeName = 'QASIM Store' }: { storeName?: string }) {
  const { locale } = useLanguage();

  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <h3 className="font-display text-lg text-ivory">{storeName}</h3>
          <p className="mt-2 max-w-xs text-sm text-ivory-muted">
            {locale === 'ar'
              ? 'وجهتك للجمال والعناية الفاخرة، منتجات أصلية ومختارة بعناية.'
              : 'Your destination for beauty and premium care — authentic, curated products.'}
          </p>
        </div>
        <div className="text-sm text-ivory-muted">
          {locale === 'ar' ? 'روابط سريعة' : 'Quick Links'}
        </div>
        <div className="text-sm text-ivory-muted">
          {locale === 'ar' ? 'تواصل معنا' : 'Contact'}
        </div>
      </div>
      <div className="border-t border-surface-border py-4 text-center text-xs text-ivory-faint">
        © {new Date().getFullYear()} {storeName}
      </div>
    </footer>
  );
}
