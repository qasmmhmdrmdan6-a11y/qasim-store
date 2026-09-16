# QASIM Store

متجر إلكتروني مصري لمستحضرات التجميل والعناية بالبشرة والشعر والعطور والعناية الشخصية.
Dark Luxury design · React + TypeScript + Vite + Tailwind CSS v4 + Supabase.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Fast dev/build, strong typing, no framework lock-in |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | Design tokens live in `src/index.css`, no separate config drift |
| Data / Auth / Storage | Supabase (Postgres + Auth + Storage + RLS) | One free-tier backend covers everything the spec needs — no custom server |
| State | Zustand (cart) + TanStack Query (server data) | Small, no boilerplate, good caching defaults |
| Routing | React Router v7 | Standard, code-splits cleanly with `lazy()` |

No Node/Express backend was added. Every privileged operation (order pricing,
stock decrement, admin writes) is enforced by Postgres itself — via Row Level
Security policies and two `SECURITY DEFINER` functions (`create_order`,
`attach_payment_receipt`) — so there is nothing for a separate server to do
that Postgres can't already do more safely.

---

## 2. Folder structure

```
src/
  components/
    ui/            design-system primitives (Button, Badge, Card, Skeleton, EmptyState)
    storefront/    Navbar, Footer, AnnouncementBar, product/category cards…
    admin/         RequireAdmin guard, dashboard widgets
  layouts/         StorefrontLayout, AdminLayout
  pages/
    storefront/    Home, ProductList, ProductDetails, Categories, Cart, Checkout…
    admin/         Login, Overview, Products, Categories, Orders, Inventory,
                    HomepageEditor, Settings
  hooks/           useAdminAuth, (cart/product hooks land alongside their pages)
  services/        one file per resource — products/categories/orders/settings.
                    These are the ONLY place Supabase queries are written.
  lib/             supabase.ts (typed client, anon key only)
  store/           cartStore.ts (Zustand)
  types/           domain.ts (frontend types), database.types.ts (generated)
  i18n/            dictionary.ts (static UI strings ar/en) + LanguageProvider
  utils/           currency.ts, etc.
supabase/
  migrations/      0001_init.sql (schema + RLS + create_order), 0002_storage.sql
  seed.sql         demo catalog — run manually, SKU-prefixed "DEMO-" for easy bulk delete
```

---

## 3. Database schema (Phase 2 deliverable, already written)

Tables: `admin_users`, `categories`, `products`, `product_images`,
`store_settings` (single row), `homepage_sections`, `banners`, `orders`,
`order_items`.

Full DDL + RLS policies: **`supabase/migrations/0001_init.sql`**
Storage buckets + policies: **`supabase/migrations/0002_storage.sql`**

### RLS model (the short version)

- **Public/anon** can only `SELECT` rows marked active (`is_active = true`)
  on `categories`, `products`, `product_images`, `banners`, and can always
  read `store_settings` / `homepage_sections` (the storefront needs these).
- **Public/anon can never** `INSERT`/`UPDATE`/`DELETE` any table directly,
  and can never `SELECT` from `orders` or `order_items` at all.
- **Admins** (rows in `admin_users`, matched via `auth.uid()`) can read/write
  everything, gated by an `is_admin()` SQL helper used in every policy.
- **Orders are never inserted directly.** The frontend calls the
  `create_order(...)` Postgres function, which:
  1. Row-locks each product (`FOR UPDATE`) to prevent overselling in a race,
  2. Re-reads price/stock from `products` itself — the client only supplies
     `product_id` + `quantity`, never a price or total,
  3. Rejects out-of-stock or inactive products,
  4. Decrements stock and inserts `orders` + `order_items` atomically.

  This is what satisfies "لا تعتبر totals القادمة من العميل" (Section 35) —
  a modified browser request cannot change what gets charged.
- A second function, `attach_payment_receipt(order_id, path)`, lets a guest
  attach their uploaded Vodafone Cash receipt to *their own* just-created
  order and nothing else — it can't touch order/payment status.

### Storage buckets

- `product-images` (public read) — product photos.
- `site-assets` (public read) — logo, hero image, banners.
- `payment-receipts` (**private**) — guests can upload, only admins can
  view (via signed URL), since these are customer payment screenshots.

---

## 4. Auth

Supabase Auth (email/password), no self-signup UI. The store owner's account
is created once (Supabase Dashboard → Authentication, or SQL), then a row is
inserted into `admin_users` to grant dashboard access:

```sql
insert into admin_users (user_id) values ('<the auth.users.id>');
```

Frontend flow: `/admin/login` → `supabase.auth.signInWithPassword()` →
`RequireAdmin` (in `src/components/admin/RequireAdmin.tsx`) checks both an
active session *and* `admin_users` membership before rendering
`/admin/*`. No service_role key, no secrets, anywhere in frontend code.

---

## 5. Order & payment flow

1. Guest checkout (no account) → `Checkout` page collects name/phone/
   governorate/address/notes + payment method.
2. `createOrder()` (`src/services/orders.service.ts`) calls
   `create_order(...)`. Order is created with:
   - `payment_status = 'cod'` for Cash on Delivery, or
   - `payment_status = 'pending_review'` for Vodafone Cash.
3. For Vodafone Cash, the customer optionally uploads a receipt screenshot,
   attached via `attach_payment_receipt()`.
4. Admin reviews pending Vodafone Cash orders in the dashboard and marks
   `payment_status` as `paid` or `rejected` manually — **the app never
   claims to verify Vodafone Cash automatically**, because no such API
   exists for this integration.
5. Admin progresses `order_status` through: طلب جديد → تم التأكيد → قيد
   التجهيز → تم الشحن → تم التسليم (or تم الإلغاء at any point).

---

## 6. Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

To stand up the backend itself:

1. Create a free Supabase project.
2. Run `supabase/migrations/0001_init.sql`, then `0002_storage.sql`, in the
   SQL editor (in that order).
3. Optionally run `supabase/seed.sql` for demo products.
4. Create your admin user in Authentication, then insert it into
   `admin_users` (see §4).
5. Regenerate real types: `npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts`.

```bash
npm run build   # tsc -b && vite build — currently passes cleanly
```

---

## 7. Development phases

- [x] **Phase 1** — Project setup, architecture, design system, folder structure, routing skeleton, base UI components.
- [x] **Phase 2** — Supabase schema, RLS, storage policies, seed data, service layer.
- [x] **Phase 3** — Authentication + Admin Dashboard foundation (login, `RequireAdmin` guard, responsive sidebar + mobile drawer nav).
- [x] **Phase 4** — Product/category/inventory management UI (full CRUD, image upload/delete, stock quick-edit).
- [x] **Phase 5** — Storefront + Homepage wired to live data (categories, best sellers, new arrivals, special offers, banners, CMS hero/announcement).
- [x] **Phase 6** — Product details + Search + Filters.
- [x] **Phase 7** — Cart + Checkout UI, guest checkout, Egypt governorate/phone validation.
- [x] **Phase 8** — Orders admin UI + payment review workflow (confirm/reject Vodafone Cash, signed-URL receipt viewing, order status progression).
- [x] **Phase 9** — Homepage CMS (hero, announcement bar, per-section show/hide toggles) + Banners CRUD + Store Settings (identity, contact, shipping fee, Vodafone number, payment method toggles).
- [ ] **Phase 10** — Security review pass against a *live* Supabase project (schema/RLS have been re-audited on paper twice, but never exercised against real data/auth in this sandbox — no network access to supabase.co here).
- [~] **Phase 11** — Responsive + RTL pass done by review of Tailwind breakpoints across every page (mobile admin nav added, tables scroll horizontally, forms stack); not yet verified in an actual mobile browser/device.
- [ ] **Phase 12** — SEO basics (meta tags beyond the base description, sitemap, robots.txt) + deployment dry run.

**Not yet built:** a dedicated `/orders/:id` confirmation page (currently a banner on Home after checkout); per-governorate shipping rates (flat fee only, as originally scoped); admin can't reorder categories/banners by drag, only by numeric `sort_order` field.

---

## 8. Deployment

Static build (`npm run build` → `dist/`), deployable to any static host
(Vercel, Netlify, Cloudflare Pages). Set the two `VITE_*` env vars in the
host's dashboard. No server process required — Supabase is the only external
service, and its free tier covers this project's initial scale.
