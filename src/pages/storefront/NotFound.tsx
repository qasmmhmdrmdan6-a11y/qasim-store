import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { buttonClasses } from '@/components/ui/Button';

export function NotFound() {
  const { locale } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl text-gold">404</p>
      <h1 className="mt-4 text-xl text-ivory">
        {locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}
      </h1>
      <p className="mt-2 text-sm text-ivory-muted">
        {locale === 'ar' ? 'الرابط الذي حاولتِ الوصول إليه غير متاح.' : "The page you're looking for doesn't exist."}
      </p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
        {locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
      </Link>
    </div>
  );
}
