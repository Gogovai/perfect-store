# Perfect Store — Ghana Multi-Vendor Marketplace

Perfect Store is a production-oriented multi-vendor ecommerce marketplace for Ghana built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase and Zustand.

## Implemented

- Supabase SSR authentication with customer, seller and admin roles
- Product catalogue, categories, search, filtering, variants and seller storefront data
- Guest/local cart with authenticated database synchronization
- Address CRUD and delivery selection
- Atomic order creation with authoritative pricing and inventory reservation
- Product-level and variant-level inventory protection
- Order history, order detail, order confirmation and cancellation
- Seller application and administrator approval workflow
- Seller product creation, inventory and variant management
- Seller order lifecycle management
- Administrator seller, customer, product, order and review moderation
- Coupon administration
- Verified customer reviews with product rating aggregation
- Customer notifications inbox
- Paystack initialization and server-side transaction verification hooks
- Cash on delivery and Paystack payment-method records
- Shipping records and lifecycle updates
- RLS and server-side authorization boundaries
- GitHub Actions lint and production-build checks
- Production security/performance hardening for privileged RPCs, foreign keys and auth RLS expressions

## Payment configuration

Paystack online checkout is implemented but requires a merchant account and server-side secret. Configure these environment variables in the deployment environment when the merchant account is ready:

```text
PAYSTACK_SECRET_KEY=your_server_side_paystack_secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Never expose `PAYSTACK_SECRET_KEY` to browser code. Cash on delivery does not require Paystack.

## Required Supabase variables

```text
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

The service-role key is server-only and must never be committed.

## Marketplace workflow

```text
Register/Login
  → Browse categories/search
  → Product detail
  → Cart/Wishlist
  → Checkout
  → Address
  → Delivery
  → Payment method
  → Place order
  → Inventory reservation
  → Order confirmation
  → Order history/detail
  → Seller/Admin lifecycle updates
  → Delivery
  → Verified review
```

## Seller workflow

```text
Customer account
  → Seller application
  → Admin review
  → Seller activation
  → Create product
  → Product review/approval
  → Inventory/variants
  → Receive orders
  → Process/ship/deliver
```

## Admin workflow

The administrator dashboard provides seller approval/rejection/suspension, customer activation control, product publication/rejection, order status management, review moderation, category management and coupon administration.

## Commercial data policy

The application does not manufacture fake seller/customer accounts, fake reviews, fake orders, or random catalogue imagery. Products require a legitimate approved seller because `products.seller_id` is mandatory and seller ownership is enforced by the database.

The connected Supabase production database currently contains 13 active categories but **0 approved sellers and 0 catalogue products**. This is intentional: populating the live marketplace with invented seller identities or fake inventory would make the catalogue unsuitable for commercial use. Once a real seller is approved, products can be entered through the seller dashboard and published by an administrator.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

The repository CI runs `npm ci`, `npm run lint` and `npm run build` on pushes and pull requests to `main`.

## Deployment checklist

Before opening the store to customers:

1. Configure the production Supabase environment variables.
2. Provision at least one legitimate administrator account securely through Supabase Auth.
3. Have real sellers apply through `/seller/apply` and approve them from the admin dashboard.
4. Add real products, prices, stock, variants and seller-supplied product images.
5. Configure `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL` before enabling online payment.
6. Configure the production domain and hosting environment.
7. Test registration, seller approval, catalogue browsing, cart, checkout, COD, Paystack, order lifecycle, cancellation and reviews with real test accounts before launch.
8. Enable leaked-password protection in Supabase Auth before production launch.
