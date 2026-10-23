# Personal Clothing Store — Single-Seller Implementation Plan

## Project goal

Turn this Next.js + Supabase storefront into a polished single-seller clothing store for men's and women's fashion, with nationwide delivery across Ghana. The store name is undecided; keep branding configurable rather than hard-coding a final brand.

## Repository baseline

The existing `perfect-store` repository already contains a substantial Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Supabase commerce implementation. The README reports customer authentication, product catalogue/search/variants, cart, address and delivery selection, order creation with server-side pricing and inventory reservation, order history, admin and seller workflows, Paystack verification, cash on delivery, shipping lifecycle, reviews, returns/refunds, and RLS protections.

This project should adapt that baseline instead of starting a second app from scratch. The current app is described as multi-vendor; the main product decision is to simplify it to a single merchant while preserving security and useful commerce functionality.

## Target customer experience

- Responsive desktop and mobile storefront inspired by marketplace usability, without copying Jumia, Kikuu or AliExpress branding.
- Search, category navigation, filters, product cards, new arrivals, promotions and featured products.
- Men's and women's clothing, product photos, size/colour variants, SKU and stock per variant, sale prices and clear availability.
- Cart, wishlist, guest-to-account cart merge, Ghanaian checkout details, delivery fees, payment status and order tracking.
- Customer account, order history, order detail, cancellation rules, reviews and support/contact pages.
- Ghanaian cedi (GHS) pricing and Ghana-wide delivery zones/fees, configurable by the store owner.

## Single-seller scope

- One store owner/admin manages every product, variant, price, promotion and inventory quantity.
- Remove seller application, seller approval, seller storefront, seller payout/ledger, multi-seller commission and seller advertising flows from the customer-facing experience. Preserve them only if needed for a future marketplace mode; do not let them complicate the single-store MVP.
- Customers must never be able to write product prices, payment status, stock quantities, discounts or privileged roles.
- Create a secure first-admin provisioning procedure; do not rely on a public signup form to grant admin access.

## Milestones

### M0 — Baseline audit and safe setup
- Inspect the current route map, Supabase migrations, RLS policies, server actions/API routes, payment callback and environment variables.
- Run install, lint, type-check (if configured), tests and production build; record existing failures before making changes.
- Confirm the target Supabase project and Vercel project before applying migrations or deploying.
- Ensure secrets are not committed; maintain a complete `.env.example` with placeholders only.

**Exit criteria:** reproducible baseline and a list of known gaps, with no production data or credentials exposed.

### M1 — Single-seller storefront and branding
- Make store name, logo, support details, social links, delivery/returns policy and homepage content configurable.
- Polish homepage, navigation, category pages, search/filter/sort, product detail and mobile layout.
- Use real merchant-supplied photos and product information; do not invent live inventory, reviews or sales figures.
- Add useful loading, empty, validation, not-found and error states.

**Exit criteria:** customer can browse, search and inspect real products comfortably on phone and desktop.

### M2 — Product and inventory administration
- Admin CRUD for products, categories, images, sizes/colours/SKUs, regular/sale prices, stock and publication state.
- Validate image type/size and protect upload paths; use Supabase Storage policies.
- Keep variant-level stock authoritative and prevent negative inventory/race-condition overselling.

**Exit criteria:** owner can independently publish and update products without editing code or database rows manually.

### M3 — Cart and Ghana checkout
- Validate cart quantities and recompute prices, discounts, delivery fees and totals on the server.
- Collect customer name, phone, region/city, address and delivery notes; make Ghana-wide delivery rates configurable.
- Create orders atomically with inventory reservation and idempotent handling to avoid duplicate orders.
- Support guest checkout only if it can be implemented without weakening order privacy.

**Exit criteria:** order totals cannot be manipulated from the browser and simultaneous checkouts cannot oversell stock.

### M4 — Payments
- Integrate Paystack for supported Ghanaian Mobile Money and card methods, subject to merchant approval and account capabilities.
- Keep secret keys server-side only. Verify transactions server-side or via authenticated webhook/callback; validate amount, currency, reference and order ownership.
- Make webhook/callback processing idempotent. Never mark an order paid based only on a browser redirect.
- Keep cash on delivery optional and distinguish unpaid, pending, paid, failed, refunded and COD states accurately.
- Until credentials are configured, show a clear sandbox/setup state; never simulate a successful live payment.

**Exit criteria:** successful, failed, cancelled, repeated and delayed payment notifications are tested safely.

### M5 — Orders and delivery tracking
- Owner dashboard for new orders, payment state, fulfillment, delivery status and customer contact.
- Status history: pending payment, confirmed, processing, dispatched, out for delivery, delivered, cancelled and returned/refunded as applicable.
- Customer tracking page must only expose that customer's orders, with an opaque reference and appropriate authentication/verification.
- Configure delivery fees and estimated delivery messaging by region; do not promise courier integrations that are not connected.

**Exit criteria:** owner can fulfill an order and the customer can see accurate status changes.

### M6 — Security, accessibility and QA
- Review Supabase RLS on every customer-owned table and admin-only action.
- Check admin role provisioning, session handling, authorization on server routes/actions, storage access and service-role key usage.
- Test checkout, stock reservation, discounts, cancellation/refund transitions, webhook replay, order privacy and mobile navigation.
- Run lint, type-check, tests and production build; fix all release-blocking failures.
- Enable Supabase leaked-password protection and configure auth redirect URLs for the production domain.

**Exit criteria:** documented QA pass, known limitations listed, and no unresolved critical security issue.

### M7 — Vercel launch
- Connect the confirmed GitHub repository to Vercel and verify the production branch/build settings.
- Configure environment variables separately for development, preview and production.
- Apply reviewed Supabase migrations to the intended project; verify storage buckets, RLS, auth URLs and payment callback URLs.
- Attach a chosen domain after the store name is decided; configure HTTPS and metadata/SEO.
- Test production smoke flows with low-risk test transactions before public marketing.

**Exit criteria:** successful production deployment and end-to-end checkout/order tracking verification.

## Required configuration

Use `.env.example` as the authoritative variable-name checklist. Typical values include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key, depending on current client setup)
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to browser
- `PAYSTACK_SECRET_KEY` — server-only
- `NEXT_PUBLIC_SITE_URL` — canonical app URL

Do not paste real credentials into commits, issues, chat messages or client-side code. Add secrets through the Supabase/Vercel environment-variable interfaces.

## Definition of done

The site is not launch-ready merely because it builds. Launch requires: real product catalogue; owner-only admin; correct server-side price/stock checks; verified payment state; accurate Ghana delivery configuration; secure order privacy; tested status transitions; no committed secrets; successful production build; and a production smoke test.

## Immediate next actions

1. Audit the existing app routes and Supabase migrations and run baseline checks.
2. Identify every multi-vendor assumption and map it to the single-seller design.
3. Implement the single-seller UI and admin workflows without destructive database changes.
4. Review security and checkout behavior before connecting production payment credentials.
5. Deploy only after the owner confirms the intended Supabase and Vercel projects.
