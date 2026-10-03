# Velaash — Live Codebase & Database Audit Report

**Date of audit:** 2 October 2026 (all findings re-verified live on this date)
**Branches:** `preview` (HEAD `d9545f0`), `master` identical to `preview`
**Method:** Code inspection of the actual repo, live queries against the production Supabase project (`rusllomzfhwhbyiakjvr.supabase.co`) using the configured service-role key, a live check of the Google OAuth provider endpoint, and `tsc --noEmit` (passes cleanly). No previous phase summary was trusted unless re-verified in code/DB here.

**Legend:** ✅ WORKING · ⚠️ PARTIAL · ❌ BROKEN · 🚫 NOT BUILT

---

## 0. Current Environment & Config State (verified from `.env.local` + live)

| Integration | Configured value (type) | Status |
|---|---|---|
| Supabase | real URL `rusllomzfhwhbyiakjvr.supabase.co` + real anon & service-role keys | ✅ LIVE (queries executed successfully) |
| Razorpay key | `rzp_test_Tie69c75ThxhcY` + secret | ⚠️ **TEST key only** — hits the real Razorpay *test* API, not live |
| Razorpay webhook secret | `test_razorpay_webhook_secret_velaash_67890` | ❌ placeholder — real webhooks cannot validate |
| Resend | real `re_eMBeFqni_…` key, from `orders@velaash.in` | ⚠️ key real, but **domain verification unconfirmed**; sandbox `@example.com` recipients still mocked |
| Shiprocket | `your_shiprocket_login_email@example.com` / placeholder | ❌ NOT CONFIGURED → logistics layer runs in **mock mode** |
| Upstash | placeholder URL | ❌ NOT CONFIGURED → rate limiting falls back to in-memory |
| Sentry DSN | placeholder `your-public-key…` | ⚠️ client **not reporting** (DSN gate skips); `SENTRY_AUTH_TOKEN`/org/project are real (source-map upload only) |
| GA4 / Meta Pixel | empty | 🚫 not configured (correctly gated) |
| Microsoft Clarity | environment setting | ✅ code now requires consent and excludes `/admin/*` |
| Google OAuth | enabled — live check: `302 → accounts.google.com… client_id=331379868860-…` | ✅ **CONFIRMED ENABLED** live |

---

## SECTION 1 — CUSTOMER-FACING FLOW

### 1.1 Homepage — ✅ WORKING (with a branding caveat)
- `app/page.tsx` fetches real data: `getNavigationCategories()`, `getSiteSettings()`, `getHomepageSections()` and renders sections **in DB display order**.
- Live DB has **8 active homepage sections**: `hero_banner`, `occasion_strip`, `category_grid`, `featured_products`, `couture_spotlight`, `testimonials`, `value_strip`, `newsletter` — all with content. `page.tsx` has a render case for each (no `custom_html` in DB).
- Trust strip (`value_strip`), featured products (auto mode, `is_featured`), and newsletter section all present.
- ⚠️ **Caveat:** hero slides, category tiles, and product images are largely **Unsplash stock images** (external URLs), not real branded photography.
- ✅ Newsletter signup now uses a validated Server Action and `newsletter_subscribers`; apply the new migration before enabling it against the live database.

### 1.2 Shop / Category browsing — ✅ WORKING
- `app/(shop)/shop/page.tsx` → `getProducts()` (`features/products/queries/get-products.ts`) applies size/color/price/in-stock/search filters, multiple sort modes, and URL-param pagination, all compiled to actual Postgres queries (`.order("base_price")`, `.lte/.gte`, `.eq`). Facets (`availableFilters`) are computed from live rows. `tsc` passes. Functional against the real DB (18 products).

### 1.3 Product detail page — ⚠️ PARTIAL
- Gallery, variant/size/color selection, stock status, size guide, related products, reviews (with `submit-review.ts`), and WhatsApp enquiry are all wired (`features/products/components/product-detail-view.tsx`). ✅
- **Pincode checker is NOT a real Shiprocket call.** It calls `/api/shiprocket/serviceability` → `checkServiceability()`. Because `SHIPROCKET_EMAIL` is a placeholder, `isShiprocketConfigured()` returns `false` and the route returns **mock/degraded** results (`isLive:false`, ~7-day estimate). No live rate is fetched.

### 1.4 Wishlist — ✅ WORKING
- `features/wishlist/store/wishlist-store.ts` (optimistic toggle + rollback), server actions, header badge, DB-backed persistence (`wishlists` table). Currently **0 rows** (nothing saved yet); login↔wishlist sync initialized in `layout.tsx`. Works.

### 1.5 Cart — ✅ WORKING
- `revalidate-cart-action.ts` re-validates price, availability, and **caps quantity to available stock** on load; re-validates the applied coupon against the new subtotal. `cart-suggestions.ts` returns category-based recommendations. Coupon application uses `validate-coupon-action.ts` against the live `coupons` table. Free-shipping progress driven by `shippingPolicy` from site settings.

### 1.6 Checkout — ✅ WORKING
- Guest checkout (`create-order-action.ts`) with server-authoritative price recompute, atomic order creation via RPC `create_checkout_order_atomic`, idempotency key, coupon revalidation, and **COD enforcement server-side** (`cod_enabled`, `cod_max_order_value` → `COD_UNAVAILABLE`) and in UI (`payment-method-step.tsx`). Shipping method is fixed to `"standard"` (no live courier-rate selection since Shiprocket is unconfigured).

### 1.7 Razorpay — ⚠️ PARTIAL (test keys only)
- Uses a **real test key**, so order creation via `lib/razorpay.ts` hits the genuine Razorpay test API (not mocked). Signature verification (`verifyRazorpayPaymentSignature`) and the `/api/webhooks/razorpay` HMAC verification are correct (`timingSafeEqual`).
- ❌ **Not deployable live:** `RAZORPAY_KEY_SECRET` and webhook secret are test/placeholder. `lib/production-guard.ts` **fails the production build** unless `ALLOW_TEST_KEYS=true`, precisely to prevent shipping with test keys. Live funds cannot currently be captured in a production build.

### 1.8 Order confirmation page — ✅ WORKING
- Access control implemented as designed: FULL access via session token (HTTP-only cookie + `?token=`), or logged-in ownership; otherwise **MASKED** (`maskPhoneNumber`, `maskEmail`, `maskStreetAddress`) in `features/checkout/queries/get-order-by-number.ts`. Support contact now comes from `site_settings.store_profile`.

### 1.9 Transactional emails — ⚠️ PARTIAL (wired, delivery unverified)
- `lib/email/resend.ts` uses the real `re_` key and will attempt genuine sends to non-`@example.com` addresses. Order-confirmation (COD path), paid-confirmation (`send-paid-order-confirmation.ts`), and payment-failed (webhook) are all wired.
- ⚠️ Cannot confirm `orders@velaash.in` is verified in Resend (not visible from code); until then real-customer delivery is not proven end-to-end. Test emails (`@example.com`, `@example-velaash.in`) are deliberately mocked.

### 1.10 Account area — ✅ WORKING
- **OTP login** (email, `sendOtpAction`/`verifyOtpAction`) + **Google OAuth** — `signInWithGoogleAction` + `/account/auth/callback`. Google is **confirmed enabled live** (see §0).
- Order history, order detail + customer cancellation (blocked for paid/dispatched orders via migration `20261002000020`), addresses CRUD, wishlist, **buy-again** (`buy-again-action.ts`) all present.

### 1.11 Track-order & size-guide — ✅ WORKING (mock caveat)
- `/track-order` guest lookup enforces rate limiting + uniform error + PII masking. Tracking data is **mock** (`SRMOCK…` AWB returns simulated status) because Shiprocket is unconfigured.
- `/size-guide` uses `getAllCategorySizeCharts` (DB + default charts).

### 1.12 Content pages — ✅ WORKING (Contact form wired)
- About, Contact, FAQ, Shipping & Returns, Privacy, Terms, Terms-conditions all render. Contact form (`submit-contact-form-action.ts`) has honeypot spam protection and **sends via Resend** to the store email (mock for test domains). Public contact links and copy now resolve from the store profile; WhatsApp URLs derive from its number.

### 1.13 Cookie consent & analytics gating — ✅ FIXED
- GA4 and Meta Pixel are correctly gated behind `consent === "all"` in `features/analytics/components/analytics-scripts.tsx`. ✅
- Clarity now uses the same consent and environment-variable gate; all customer analytics are excluded from `/admin/*` routes.

---

## SECTION 2 — ADMIN PANEL

### 2.1 Admin login + RBAC — ✅ WORKING (re-verified server-side)
- Admin login is email+password → Supabase Auth → strict check of `admin_users` (revokes session + generic error if not an admin). `requireAdmin()` / `requireOwner()` are called at the top of **every owner-scoped server action** (settings, coupons, homepage, staff, products) and admin queries. `getAdminDashboardData` **withholds financial metrics for `staff`** at the query boundary. Middleware protects `/admin/*`. RLS in `20260929000002_admin_users.sql` permits only `is_admin_owner()` to insert/update/delete. **Confirmed enforced in current code, not just by old tests.**

### 2.2 Dashboard — ✅ WORKING
- `get-admin-dashboard.ts` computes pending/needs-action/low-stock/total counts, recent 10 orders, low-stock variant alerts, and (owner-only) revenue/AOV + 14-day sales trend. Renders metric cards, chart, recent orders, low-stock alerts.

### 2.3 Product management — ✅ WORKING
- List (TanStack table), create/edit form, variant manager, image uploader (Supabase Storage), stock quick-edit, **CSV import modal** (`csv-import-modal.tsx`), product actions server-gated.

### 2.4 Category management — ✅ WORKING
- Tree view, drag-and-drop reorder (dnd-kit), size-chart editor, category actions (server-gated). Live DB has 24 categories (6 top-level + 18 sub).

### 2.5 Order management — ✅ WORKING (Shiprocket in mock)
- Status updates with strict state machine (`canTransitionStatus`), tracking entry, **push-to-Shiprocket** (`pushToShiprocketAction`) — runs in **mock mode** (no real AWB) since Shiprocket is unconfigured; invoice PDF via `/api/admin/orders/[orderNumber]/invoice` (react-pdf, GST-aware); owner-only refund action (`manage_refunds`); cancellation blocked for paid orders.

### 2.6 Coupon management — ✅ WORKING
- Create/edit/delete modals, live discount preview math, usage tracking. Live DB has 4 active coupons (e.g. `VELAASH10` usage_count 89).

### 2.7 Homepage builder — ✅ WORKING
- Section sortable reorder / add / edit; on save it revalidates `/` so changes reflect on the live homepage (same `homepage_sections` table the homepage reads).

### 2.8 Site settings — ✅ WORKING (mechanism re-verified)
- All sub-sections present in `settings-actions.ts`: store profile, social, shipping, returns, payments (COD + Razorpay toggles), tax/GST, announcement bar, SEO, Shiprocket logistics, page banners. Each upserts a `site_settings` row and `revalidatePath`s the customer, cart, checkout, and shop pages. The homepage/header/pages read these live. Note: analytics IDs come from **env vars, not the settings UI**. I re-verified the write→revalidate path in code rather than trusting the old Phase 5F report.

### 2.9 Staff management — ✅ WORKING
- Add / change-role / remove with hard guards: `requireOwner()` plus "you cannot modify/remove your own account" (lockout prevention). Live DB: 1 owner + 1 staff.

---

## SECTION 3 — CROSS-CUTTING CONCERNS

### 3.1 Security — ✅ WORKING
- RLS enabled with policies in the migration SQL for `admin_users`, `orders`, `order_items`, `order_status_history`, `site_settings`, `products`/`variants`, `coupons`, `categories`, etc., backed by `SECURITY DEFINER` `is_admin()` / `is_admin_owner()`. `lib/supabase/admin.ts` (service-role) is server-only with a browser-import runtime guard and documented per-call justification. Razorpay payment + webhook signatures use HMAC-SHA256 with constant-time comparison. All confirmed in current code.

### 3.2 Data consistency — ⚠️ THIS IS IMPORTANT — test data present
- The live DB is **not clean** for launch. From live queries: **12 orders** — all appear to be test data (e.g. `VEL-2026-00021/00022` → `arulraj8637@gmail.com` / `velaash15@gmail.com`, several `*@example.com`); mock Razorpay IDs (`order_mock_…`, `pay_test_client_callback_999`); mock Shiprocket orders (`sr_mock_…`); tracking `SRMOCK…` with courier `*(Simulated)`; a cancelled `razorpay/pending` test order (`VEL-2026-00020`). Coupon `usage_count`s are inflated by testing (e.g. `VELAASH10`=89). 14 `customers`, 7 `reviews` are largely seeded/test. These should be deleted/archived and seeded orders stripped before any real launch.

### 3.3 Environment/config — see §0 table. Summary: only Supabase (real) and Google OAuth (confirmed) are fully live; **Shiprocket, Upstash, live Razorpay keys, Resend domain verification, Sentry DSN, GA4 and Meta are not**. Clarity code now honors consent and excludes admin routes.

### 3.4 Known unresolved items
- ✅ Analytics consent bypass fixed; no hardcoded Clarity fallback remains, and analytics do not render on admin routes.
- ❌ Shiprocket / Upstash / live Razorpay / GA4 / Meta / Sentry DSN are unconfigured (mock/no-op).
- ⚠️ Production build will **fail** while Razorpay test keys / placeholder webhook secret are set (intentional guard; blocks go-live until real keys).
- ✅ Newsletter signups persist to `newsletter_subscribers`; owner-only admin list and CSV export are available.
- ⚠️ Apply migrations `20261002000021` and `20261002000022` before newsletter persistence and cleanup of legacy duplicate WhatsApp settings are active in the live database.
- ⚠️ 12 test orders + inflated coupon counters + seeded customers/reviews remain in the live DB.
- ✅ Public contact identity is sourced from `site_settings.store_profile`; WhatsApp links derive from the configured number.
- ⚠️ Hero/category/product imagery is Unsplash stock, not real product photography.

---

## SECTION 4 — SUMMARY

### Prioritized — ❌ BROKEN / 🚫 NOT BUILT that matter for a working store
1. **Live payments:** only **Razorpay TEST keys** configured; production build deliberately fails without live keys. Cannot take a real paid order today. (❌)
2. **Webhook secret** is a placeholder → server-to-server payment confirmation cannot be trusted in production. (❌)
3. **Shiprocket logistics not configured** → no real pincode serviceability, real rates, AWB generation, or tracking; everything is mock/simulated. (❌)
4. **Sentry client not reporting** (placeholder DSN). (⚠️ — not blocking, but the monitoring that was "configured" isn't live)

### Prioritized — ⚠️ PARTIAL needing attention before trusting real customers
- Clean the **test database records** (12 orders, inflated coupon counters, seeded customers/reviews).
- Verify **Resend domain (`orders@velaash.in`)**, else customer emails won't deliver.
- Real product photography + brand assets (currently Unsplash).
- Apply newsletter and contact-normalization migrations to the live project.

### Honest verdict — is this safe to accept a real paying customer's order today?
**No.** The storefront, cart, checkout logic, admin panel, RBAC and RLS are functional and compile cleanly, and Google OAuth is genuinely enabled. But the payment layer is running on **Razorpay test keys** (and the build guard correctly refuses a production build with them), the webhook secret is a placeholder, **Shiprocket is entirely unconfigured** (so no real shipping/rates/tracking after checkout), transactional email delivery to a real customer is unproven, and the database is full of **test orders/records**. The analytics consent bypass is fixed in code; the newsletter and contact-normalization migrations still need applying. This remains a **pre-launch/test build**, not yet a live store.