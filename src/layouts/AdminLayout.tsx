import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ClipboardList,
  Boxes,
  Settings,
  LayoutTemplate,
  Image,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { signOutAdmin } from '@/hooks/useAdminAuth';

const navItems = [
  { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'المنتجات', icon: Package },
  { to: '/admin/categories', label: 'التصنيفات', icon: FolderTree },
  { to: '/admin/orders', label: 'الطلبات', icon: ClipboardList },
  { to: '/admin/inventory', label: 'المخزون', icon: Boxes },
  { to: '/admin/homepage', label: 'إدارة الصفحة الرئيسية', icon: LayoutTemplate },
  { to: '/admin/banners', label: 'البانرات', icon: Image },
  { to: '/admin/settings', label: 'إعدادات المتجر', icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors',
              isActive ? 'bg-gold/10 text-gold' : 'text-ivory-muted hover:bg-surface-2 hover:text-ivory',
            )
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
      <button
        onClick={() => signOutAdmin()}
        className="mt-4 flex items-center gap-3 rounded-sm px-3 py-2.5 text-start text-sm text-ivory-muted hover:bg-surface-2 hover:text-danger"
      >
        <LogOut size={18} />
        تسجيل الخروج
      </button>
    </nav>
  );
}

export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div dir="rtl" className="flex min-h-screen bg-ink text-ivory">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-e border-surface-border bg-surface md:flex">
        <div className="px-5 py-6 font-display text-lg">لوحة تحكم QASIM</div>
        <NavList />
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-surface-border bg-surface px-4 py-3 md:hidden">
          <span className="font-display text-base">لوحة تحكم QASIM</span>
          <button onClick={() => setMobileNavOpen(true)} aria-label="فتح القائمة" className="text-ivory-muted">
            <Menu size={22} />
          </button>
        </header>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-ink/80" />
            <div
              className="relative flex w-64 flex-col border-e border-surface-border bg-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-6">
                <span className="font-display text-lg">لوحة تحكم QASIM</span>
                <button onClick={() => setMobileNavOpen(false)} aria-label="إغلاق" className="text-ivory-muted">
                  <X size={20} />
                </button>
              </div>
              <NavList onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
