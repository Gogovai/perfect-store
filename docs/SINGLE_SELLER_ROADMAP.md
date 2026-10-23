# Personal Clothing Store — Single-Seller Implementation Plan

## Non-negotiable product decisions

- **Single seller only:** this is one clothing shop owned and operated by the repository owner. It is not a marketplace.
- **Payments: Hubtel only:** integrate Hubtel for supported Ghanaian Mobile Money and card checkout. Do not implement Paystack or another payment provider as a fallback.
- **Market:** Ghana-wide delivery, prices in Ghana cedis (GHS), Ghanaian phone/address fields.
- **Products:** men's and women's clothing, including sizes, colours, variant SKUs, photos, sale prices and variant-level stock.
- **Brand:** store name is not decided yet. Keep name, logo, contact details and policy content configurable.

## Repository baseline

The existing repository is a Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Supabase commerce application. Its README describes customer authentication, catalogue/search/variants, cart, checkout/order creation, order history, admin and seller workflows, payment integrations, shipping lifecycle, reviews, returns/refunds and RLS protections. Audit actual implementation before relying on any README claim.

Adapt the existing app rather than building a second app. Preserve useful customer and admin features, but remove marketplace behavior from the product, interface, authorization model and business logic.

## Required single-store transformation

Remove or refactor all marketplace/multi-vendor functionality, including:
- Seller registration/application, seller approval and seller-specific onboarding.
- Public seller storefronts, seller profiles and seller-switching experiences.
- Seller commissions, payouts, seller wallets/ledgers and vendor settlement reports.
- Multi-seller carts, seller-based order splitting, vendor-specific fulfillment and vendor advertising.
- Seller roles and seller-scoped product/order permissions that are no longer needed.

Replace these with:
- One store owner/admin who manages the entire catalogue, inventory, promotions, orders, delivery settings and store settings.
- One customer-facing shop identity and a unified cart/order checkout.
- Server-enforced owner/admin authorization; public registration must never grant administrator access.
- One order fulfillment workflow owned by the store.
- No hidden multi-vendor dependencies left in customer routes, server actions, database constraints, RLS policies, seeds, tests or documentation.

Do not blindly delete database tables or run destructive migrations. First map dependencies and existing data, then make reviewed migrations that preserve customer/order history and remove or neutralize marketplace-only behavior safely.

## Customer experience

- Responsive, polished storefront inspired by the usability of major shopping sites without copying their branding.
- Homepage, men's and women's categories, search, filters, sorting, new arrivals, promotions and featured products.
- Product pages with multiple photos, descriptions, size/colour choices, SKU, variant stock, price/sale price and availability.
- Cart, wishlist, secure checkout, customer account, order history, order details, cancellation rules, reviews and support/contact pages.
- Ghanaian cedi (GHS), Ghanaian phone number, region/city, delivery address and delivery notes.
- Configurable nationwide delivery zones, fees and estimated delivery messaging.

## Milestones

### M0 — Audit and safe setup
- Inspect routes, components, server actions/API routes, Supabase migrations, RLS, storage policies, auth roles, tests, package scripts and existing payment code.
- Run install, lint, type-check, tests and production build; record baseline failures before changing code.
- Identify all multi-vendor assumptions and trace them through UI, application logic, database and policies.
- Identify the exact Hubtel products/API flow supported by the merchant account and current integration. Do not guess endpoints or payloads.
- Confirm target Supabase and Vercel projects before applying migrations or deploying.
- Ensure secrets are absent from Git history/current files and maintain a placeholder-only .env.example.

**Exit criteria:** dependency map, safe migration plan, verified build/test baseline and Hubtel integration requirements documented.

### M1 — Storefront and branding
- Make store name, logo, contact/support details, social links, returns policy and homepage content configurable.
- Remove seller-facing marketplace navigation and replace it with single-store navigation.
- Polish mobile/desktop homepage, categories, product listing/detail, search, filters and sorting.
- Use real owner-provided product information; never fabricate inventory, reviews or sales counts.

### M2 — Owner-only product and inventory administration
- Admin CRUD for products, categories, photos, sizes/colours/SKUs, prices, promotions, stock and publication state.
- Secure image upload and Supabase Storage policies.
- Variant-level stock is authoritative; prevent negative inventory and overselling.
- Remove seller dashboard and seller-scoped product management; the store owner sees and manages all store products.

### M3 — Cart and Ghana checkout
- Recompute prices, discounts, delivery fees and totals on the server.
- Collect customer name, phone, region/city, address and delivery instructions.
- Use a unified single-store cart and order. Create orders and reserve inventory atomically where supported, with idempotency to prevent duplicates.
- Keep order details private to the owner/admin and the relevant customer.

### M4 — Hubtel payments only
- Integrate Hubtel as the sole online payment provider for the payment methods enabled for the merchant account, including supported Ghanaian Mobile Money and cards.
- Verify the current Hubtel API documentation and merchant capabilities before implementing. Use the appropriate Hubtel checkout/collection flow and server-side transaction verification/callback handling.
- Keep Hubtel secret credentials server-side only. Never commit them, put them in NEXT_PUBLIC variables, or expose them to browser code.
- Validate order reference, amount, currency, status and transaction identifiers. Treat callbacks as untrusted until verified according to Hubtel's documented flow.
- Make callbacks/webhooks idempotent and safe for retries, duplicate notifications and delayed responses.
- Never mark an order paid because the browser returns to a success page. Do not simulate payment success.
- Remove Paystack-specific code, variables, callback URLs, UI, dependencies and documentation after tracing and replacing their usage. Do not leave Paystack as a fallback.
- If Hubtel credentials/account approval are not configured, show a clear setup/pending state and keep live payments disabled.

**Exit criteria:** documented Hubtel flow and tested success, failure, cancellation, duplicate callback and delayed callback scenarios in the appropriate test environment.

### M5 — Orders and Ghana delivery
- One owner dashboard for all orders, payment state, fulfillment, customer contact and delivery status.
- Status history for pending payment, confirmed, processing, dispatched, out for delivery, delivered, cancelled and returned/refunded as applicable.
- Customer tracking must reveal only that customer's order, using authentication or an appropriately secure reference/verification method.
- Configure Ghana delivery fees and estimates. Do not claim a courier integration unless it is actually connected.

### M6 — Security, accessibility and QA
- Review Supabase RLS for every customer-owned table and owner/admin-only action.
- Ensure public signup cannot assign admin access and remove obsolete seller-role grants/permissions.
- Audit session handling, server authorization, storage access, service-role usage, payment verification and order privacy.
- Test inventory concurrency, checkout manipulation, discount abuse, cancellation/refund transitions and Hubtel callback replay.
- Test mobile navigation, forms, loading/empty/error states, accessibility and responsive layouts.
- Run lint, type-check, tests and production build; fix release-blocking failures.
- Enable appropriate Supabase auth protections and production redirect URLs.

### M7 — Vercel launch
- Connect the confirmed GitHub repository to the intended Vercel project.
- Configure separate development, preview and production environment variables.
- Apply reviewed Supabase migrations only to the confirmed project; verify RLS, storage and auth settings.
- Configure Hubtel production credentials and callback/return URLs according to current Hubtel documentation and the merchant account.
- Add the final domain after the store name is decided; verify HTTPS, metadata and SEO.
- Run end-to-end production smoke tests before public marketing.

## Environment configuration

Inspect the current code and then update .env.example to match the actual SDK/API usage. Expected categories include:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY or the publishable-key name used by the project
- SUPABASE_SERVICE_ROLE_KEY — server-only
- Hubtel server-side client ID, client secret, merchant/account identifiers and other values only where required by the verified Hubtel integration; use names consistent with the actual implementation and official Hubtel docs
- NEXT_PUBLIC_SITE_URL — canonical app URL

Never invent Hubtel environment variable names before confirming the selected API flow. Never paste real credentials into commits, issues, chat messages or client-side code. Configure secrets through Supabase/Vercel settings.

## Definition of done

The store is not launch-ready merely because it builds. It must be demonstrably single-seller across UI, code and authorization; the owner must manage all products and orders; customer prices/stock/payment state must be server-controlled; Hubtel must be the only online payment provider and be verified server-side; Ghana delivery configuration must work; order privacy and inventory concurrency must be tested; no secrets may be committed; and production smoke tests must pass.

## Current implementation and verification status (2026-10-23)

### Merged into `main`

- PR #5 removed public seller/storefront presentation and cleaned the single-owner clothing storefront.
- PR #6 added CI gates for dependency audit, TypeScript, unit tests, lint and production build.
- PR #7 hardened Hubtel callback retries and payment/order reconciliation.
- PR #8 removed seller attribution requirements for new products/orders, made seller attribution nullable while preserving historical rows, added storefront RLS policies, guarded legacy seller-order triggers, improved payment retry safety, and restricted sensitive RPC privileges.
- PR #9 revoked execution for unused marketplace-era RPCs.
- PR #10 enforced clothing-only validation in cart sync, add-to-cart and existing-cart display.
- PR #11 documented the verified deployment and security blockers.
- PR #12 enforced Ghana-only order addresses, supported delivery methods and cart quantity limits at the database boundary.
- PR #13 hid Hubtel until production credentials exist, prevented unusable online-payment orders, and aligned checkout fallback fees and free-shipping totals.

### Verified

- Latest `main` commit: `18a8ea8be8d82349f217b875bf94ea8c864f400f`.
- GitHub CI passed for the latest feature PRs; CI for the latest merge commit is running: [latest main CI](https://github.com/Gogovai/perfect-store/actions/runs/39953349716).
- Eight single-store/security migrations were applied successfully to the connected Supabase `ecommerce-marketplace` project.
- Database checks confirm `products.seller_id` and `order_items.seller_id` are nullable, legacy seller-order triggers ignore null seller IDs, and order delivery methods, Ghana shipping countries, and cart quantities are constrained and validated.
- Seller application and commission RPCs cannot be executed by anon/authenticated clients; unused marketplace RPCs have been revoked.
- Supabase security advisor no longer reports anon-executable SECURITY DEFINER RPCs among the checked findings. Six authenticated SECURITY DEFINER RPC warnings remain for order, admin-status, return, review and order-party operations; these should retain their authorization checks.
- Public product queries and server cart actions filter/reject unrelated categories. Historical product, seller, order and finance rows have not been deleted.

### Still release-blocking

1. **Vercel production deployment is stale.** The newest verified production deployment is still on an older commit. Vercel reported the build rate limit is active and to retry after 24 hours. GitHub CI passing does not mean the latest code is live.
2. **Hubtel credentials are absent from Vercel.** Production currently has no `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`, or `HUBTEL_MERCHANT_ACCOUNT_ID` variables. The checkout UI now hides Hubtel and server actions reject Hubtel orders until the owner configures real merchant credentials.
3. **Hubtel sandbox has not been exercised.** The request/response contract and transaction status lookup must be confirmed against the exact API enabled for the merchant account. Test success, failure, cancellation, duplicate callbacks, delayed callbacks, amount/currency mismatch, and retries before enabling live payments.
4. **Delivery zones/rates are not configured.** Supabase currently has no active delivery zones or shipping rates. Checkout temporarily preserves the existing behavior (GHS 15 standard, GHS 35 express, free at GHS 200 subtotal) and clearly labels these as temporary defaults. Configure actual owner-approved nationwide rates in Admin → Logistics before launch.
5. **Supabase leaked-password protection is disabled.** Enable it in Supabase Auth settings and verify allowed redirect URLs before public launch.
6. **Real catalogue readiness remains unverified.** The database has legacy products across unrelated categories; storefront queries filter the catalogue and checkout rejects non-fashion categories, but the owner must review displayed clothing inventory, photos, prices, stock and product descriptions before launch.
7. **Live customer/admin smoke tests remain outstanding.** Test sign-in, address management, cart, checkout, COD, Hubtel, order history, cancellation, inventory reservation, admin product CRUD, image upload, order fulfillment, delivery configuration and authorization boundaries on the latest deployed build.

### Next actions

1. Configure the real Hubtel merchant credentials in Vercel production and confirm the merchant API version.
2. Configure owner-approved delivery zones/rates in Admin → Logistics.
3. Enable Supabase leaked-password protection.
4. After Vercel's rate limit clears, deploy the current `main` commit and verify the exact deployment SHA.
5. Run the end-to-end customer/admin and Hubtel sandbox test matrix against that deployment.
6. Review remaining authenticated SECURITY DEFINER functions and resolve the six advisor warnings where possible without breaking legitimate order, return, review or admin flows.
7. Replace any demo/legacy product content with real owner-approved inventory and complete a final accessibility/mobile QA pass.

**Launch status: not yet confirmed production-ready.** Code quality gates pass and the single-store database migrations are applied, but the current production deployment is stale, Hubtel is not configured in Vercel, delivery rates need owner configuration, and live transaction/customer-flow testing remains outstanding.
