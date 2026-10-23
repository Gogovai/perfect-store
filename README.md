# Perfect Store — Single-Seller Clothing Store

A single-owner online clothing shop for men's and women's fashion, built with Next.js, React, TypeScript, Tailwind CSS and Supabase. Customers can browse products, select size/colour variants, add items to a unified cart, place orders and track their purchases. The owner manages the catalogue, stock, promotions, delivery settings and all orders.

This is **not a multi-vendor marketplace**. Seller onboarding, seller storefronts, seller commissions and seller payouts are being removed/refactored as part of the single-store migration.

## Product requirements

- Ghana-wide delivery and GHS pricing.
- Men's and women's fashion, including size/colour variants and variant-level stock.
- Secure customer accounts, cart, checkout, order history and order tracking.
- Owner-only product, inventory, order and store settings.
- **Hubtel is the only intended online payment provider.** Paystack is not a fallback.
- Store branding remains configurable until the final store name and logo are chosen.

## Technology

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage and Row Level Security
- Vercel deployment
- Hubtel payments, subject to merchant account enablement and verification against current Hubtel documentation

## Environment variables

Required Supabase configuration:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Hubtel configuration is being finalized against the exact payment API enabled for the merchant account. Example server-side variable placeholders are documented in `.env.example`; confirm names and required account identifiers before production configuration. Never expose Hubtel secrets or the Supabase service-role key to browser code or commit real credentials.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Implementation roadmap

See [docs/SINGLE_SELLER_ROADMAP.md](docs/SINGLE_SELLER_ROADMAP.md) for milestones, migration safety, Hubtel payment requirements and launch criteria.

## Important safety notes

- Do not delete production tables or order history as part of the single-store migration.
- Public sign-up must never grant administrator access.
- Recalculate prices, discounts, delivery fees and totals on the server.
- Verify Hubtel payment status on the server; never trust a browser redirect as proof of payment.
- Test inventory concurrency, order privacy, callback retries and failed/cancelled payments before launch.
- Do not deploy to a production Supabase/Vercel project until the target project is confirmed and the reviewed migrations pass.
