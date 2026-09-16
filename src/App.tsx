import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { RequireAdmin } from '@/components/admin/RequireAdmin';

import { StorefrontLayout } from '@/layouts/StorefrontLayout';

import { Home } from '@/pages/storefront/Home';
import { ProductList } from '@/pages/storefront/ProductList';
import { ProductDetails } from '@/pages/storefront/ProductDetails';
import { Categories } from '@/pages/storefront/Categories';
import { Cart } from '@/pages/storefront/Cart';
import { Checkout } from '@/pages/storefront/Checkout';
import { NotFound } from '@/pages/storefront/NotFound';

// The admin dashboard is a separate code-split chunk — customers browsing
// the storefront never download it.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('@/pages/admin/Login').then((m) => ({ default: m.AdminLogin })));
const AdminOverview = lazy(() => import('@/pages/admin/Overview').then((m) => ({ default: m.AdminOverview })));
const AdminProducts = lazy(() => import('@/pages/admin/Products').then((m) => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('@/pages/admin/Categories').then((m) => ({ default: m.AdminCategories })));
const AdminOrders = lazy(() => import('@/pages/admin/Orders').then((m) => ({ default: m.AdminOrders })));
const AdminInventory = lazy(() => import('@/pages/admin/Inventory').then((m) => ({ default: m.AdminInventory })));
const AdminHomepageEditor = lazy(() =>
  import('@/pages/admin/HomepageEditor').then((m) => ({ default: m.AdminHomepageEditor })),
);
const AdminBanners = lazy(() => import('@/pages/admin/Banners').then((m) => ({ default: m.AdminBanners })));
const AdminSettings = lazy(() => import('@/pages/admin/Settings').then((m) => ({ default: m.AdminSettings })));

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink text-ivory-muted">
      جاري التحميل...
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            {/* Storefront */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetails />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            {/* Admin — code-split behind Suspense so it never loads for storefront visitors */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminLogin />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                </Suspense>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="homepage" element={<AdminHomepageEditor />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#141217',
              color: '#f4efe8',
              border: '1px solid #2a2630',
            },
          }}
        />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
