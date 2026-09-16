import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useCartStore } from '@/store/cartStore';

export function Navbar({ storeName = 'QASIM Store' }: { storeName?: string }) {
  const { t, locale, toggleLocale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/products', label: t.nav.products },
    { href: '/categories', label: t.nav.categories },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <button
          className="p-1 text-ivory md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="font-display text-xl tracking-wide text-ivory">
          {storeName}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-ivory-muted transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button aria-label={t.nav.search} className="hidden text-ivory-muted hover:text-gold md:block">
            <Search size={19} />
          </button>
          <button
            onClick={toggleLocale}
            className="text-xs font-medium text-ivory-muted hover:text-gold"
          >
            {locale === 'ar' ? 'EN' : 'AR'}
          </button>
          <Link to="/cart" className="relative text-ivory-muted hover:text-gold" aria-label={t.nav.cart}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-surface-border px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-sm px-2 py-2.5 text-sm text-ivory-muted hover:bg-surface-2 hover:text-gold"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
