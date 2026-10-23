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

## Current cleanup status (2026-10-23)

Completed on the draft branch `feature/single-store-hubtel`:

- Removed seller navigation and public storefront presentation; legacy seller URLs redirect to the shop.
- Disabled seller-application RPC access and set commission calculations to zero through new, data-preserving migrations.
- Restricted public catalogue queries, admin product creation/publication, and order creation to clothing, footwear, and fashion-accessory categories.
- Removed unused seller metadata from cart, wishlist, checkout, product display, and customer order presentation where it was not needed.
- Replaced hard-coded checkout shipping prices with configured, address-matched delivery rates.
- Removed disconnected campaigns/coupons admin screens and a broken image-sync workflow that referenced a missing script.
- Removed unused admin API routes and stale constants; renamed static homepage content so it is not confused with database campaigns.
- Rewrote the seed README to stop directing operators to missing demo seed files.

Still incomplete and release-blocking:

- Legacy tables, columns, types, triggers and RLS policies still reference sellers, seller finance, and marketplace concepts. They are retained intentionally until a reviewed migration can preserve existing product/order history and replace those dependencies.
- Hubtel endpoint, callback payload, transaction verification, currency validation and idempotency still need to be checked against the exact official API enabled for the merchant account and tested with real sandbox transactions.
- Run the latest CI result for this exact commit; then review build/lint output and fix any remaining failures.
- Run the read-only live schema audit, confirm all delivery zones/rates are configured, and test the full customer/admin flows against a non-production Supabase project.
- Do not merge or deploy until the remaining schema, payment and security checks pass.

## Immediate next actions

1. Finish lint and production-build verification for the latest commit on this draft PR.
2. Review and apply the new migrations only in a confirmed non-production Supabase project first.
3. Verify Hubtel's exact merchant API flow and callback/transaction verification against official documentation.
4. Audit RLS, roles, storage policies, order privacy, inventory concurrency, and remaining legacy seller references.
5. Complete checkout, order, delivery and admin smoke tests before considering merge or production deployment.
