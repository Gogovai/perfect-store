# Perfect Store — Ghana Multi-Vendor Marketplace

Perfect Store is a production-oriented multi-vendor ecommerce marketplace for Ghana built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase and Zustand.

## Implemented

- Supabase SSR authentication with customer, seller and admin roles
- Product catalogue, categories, search, filtering, variants and seller storefront data
- Guest/local cart with authenticated database synchronization
- Address CRUD and delivery selection
- Atomic order creation with authoritative pricing and inventory reservation
- Product-level and variant-level inventory protection
- Order history, order detail, confirmation and cancellation
- Seller application and administrator approval workflow
- Seller product creation, inventory and variant management
- Seller order lifecycle management
- Administrator seller, customer, product, order and review moderation
- Coupon administration
- Verified customer reviews with product rating aggregation
- Customer notifications inbox
- Paystack initialization and transaction verification hooks
- Cash on delivery and bank-transfer payment-method records
- Shipping records and lifecycle updates
- RLS and server-side authorization boundaries
- GitHub Actions lint and production-build checks

## Payment configuration

Paystack online checkout is implemented but requires a server-side secret. Configure these environment variables in the deployment environment when the merchant account is ready:

```text
PAYSTACK_SECRET_KEY=your_server_side_paystack_secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Never expose `PAYSTACK_SECRET_KEY` to browser code.

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

The administrator dashboard provides seller approval/rejection/suspension, customer activation control, product publication/rejection, order status management, review moderation and navigation to coupon administration.

## Security

All sensitive mutations are validated server-side. Database RLS policies enforce customer ownership, seller isolation and administrator access. Order creation/cancellation and seller/admin status transitions are implemented as authorization-aware PostgreSQL functions. Payment verification is performed server-side against the provider response and the stored order amount.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

The repository CI runs `npm ci`, `npm run lint` and `npm run build` on pushes and pull requests to `main`.

## Data policy

The repository does not rely on random `picsum.photos` catalogue imagery or fake seller credentials. Product images should be supplied by legitimate sellers through approved product-image URLs/storage. The connected production database currently has no legitimate seller accounts or catalogue products, so no fake seller or customer account is created just to manufacture marketplace activity.
