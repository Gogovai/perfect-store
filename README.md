# Perfect Store — Ghana Multi-Vendor Marketplace

A production-quality multi-vendor ecommerce marketplace for Ghana, built with Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase, and Zustand.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with SSR
- **State:** Zustand (client-side cart)
- **Validation:** Zod
- **Forms:** React Hook Form

## Features

### Authentication
- Email/password registration and login
- Password reset flow
- Role-based access (customer, seller, admin)
- Server-side session management via Supabase SSR

### Storefront
- Product catalog with categories
- Product detail pages with variants
- Product search and filtering
- Seller storefronts
- Responsive design (mobile-first)

### Cart & Checkout
- Guest cart (localStorage) with DB sync on login
- Server-validated checkout
- Authoritative server-side pricing
- Address management (CRUD)
- Delivery method selection
- Atomic order creation via PostgreSQL RPC

### Order Lifecycle (Phase 7)
- **Real order creation** — atomic database function handles validation, pricing, order/ item creation, inventory reservation, and cart cleanup in a single transaction
- **Inventory protection** — database-level atomic reservation prevents overselling; supports both product-level and variant-level inventory
- **Shipping snapshots** — immutable address data stored on the order, unaffected by future address edits
- **Multi-vendor orders** — one order can contain products from multiple sellers
- **Order history** — customers can view all past orders with status, items, and totals
- **Order detail** — full order view with status timeline, items, delivery info, and payment status
- **Order confirmation** — post-checkout success page with complete order summary
- **Order cancellation** — customers can cancel pending/confirmed orders with automatic inventory release
- **Pending payment** — orders start as "pending" with no payment gateway; payment integration is planned for a future phase

### Security
- Row Level Security (RLS) on all tables
- Cart item ownership verification
- Order ownership enforcement
- Seller isolation for order items
- Server-side price and inventory validation
- Service-role client restricted to server-side only

## Order Flow

```
Cart → Checkout → Select Address → Select Delivery → Review → Place Order
    → Order Created (atomic) → Cart Cleared → Inventory Reserved
    → Order Confirmation → Order History → Order Detail/Tracking
```

### Order Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Order received, awaiting confirmation. Payment not yet processed. |
| `confirmed` | Order confirmed by the system/seller. |
| `processing` | Order is being prepared for shipment. |
| `shipped` | Order has been shipped. |
| `delivered` | Order has been delivered. |
| `cancelled` | Order was cancelled by customer or admin. |
| `refunded` | Order was refunded. |

### Payment Status

Payment gateway integration is **not yet implemented**. All orders currently have a `pending` payment record. The architecture is ready for a payment provider (Paystack, Flutterwave, Mobile Money, etc.) to be plugged in during a future phase.

## Database Schema

### Tables

- `profiles` — User profiles with roles
- `sellers` — Seller shop information
- `products` — Product catalog
- `product_images` — Product images
- `product_variants` — Product variants (size, color, etc.)
- `inventory` — Product-level inventory tracking
- `variant_inventory` — Variant-level inventory tracking
- `addresses` — Customer shipping addresses
- `carts` — Shopping carts
- `cart_items` — Cart line items
- `wishlists` — Customer wishlists
- `wishlist_items` — Wishlist items
- `orders` — Customer orders with shipping snapshots
- `order_items` — Order line items with product/seller snapshots
- `payments` — Payment records (pending until gateway integration)
- `shipments` — Shipment tracking
- `reviews` — Product reviews
- `coupons` — Discount coupons
- `order_coupons` — Applied coupons
- `seller_payouts` — Seller payout records
- `notifications` — User notifications
- `audit_logs` — Audit trail

### Key Database Functions

- `create_order()` — Atomic order creation with validation, inventory reservation, and cart cleanup
- `cancel_order()` — Atomic order cancellation with inventory release

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client and should only be used in server-side code.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm run start   # Production server
npm run lint    # ESLint
```

## Project Structure

```
app/
├── (auth)/              # Auth pages (login, register, reset)
├── (storefront)/        # Storefront routes
│   ├── cart/            # Cart page & actions
│   ├── categories/      # Category pages
│   ├── checkout/        # Checkout page & actions
│   ├── products/        # Product pages
│   └── search/          # Search page
├── account/             # Account pages
│   ├── addresses/       # Address management
│   └── orders/          # Order history, detail, confirmation
├── admin/               # Admin dashboard (future)
├── seller/              # Seller dashboard (future)
├── api/                 # API routes
├── auth/                # Auth callback
├── layout.tsx           # Root layout
└── page.tsx             # Homepage
components/
├── admin/               # Admin components
├── cart/                # Cart components
├── categories/          # Category components
├── checkout/            # Checkout components
├── home/                # Homepage components
├── layout/              # Layout components (Header, Footer)
├── products/            # Product components
├── search/              # Search components
├── seller/              # Seller components
├── ui/                  # Shared UI components
└── wishlist/            # Wishlist components
lib/
├── config/              # Configuration (delivery methods)
├── data/                # Data layer
├── queries/             # Database queries
├── supabase/            # Supabase clients (server, client, admin, proxy)
├── utils/               # Utilities (formatting, order, cn)
└── validations/         # Zod schemas
stores/
└── cart.ts              # Zustand cart store (localStorage)
types/
├── database.ts          # Supabase database types
└── index.ts             # Type re-exports
supabase/
├── migrations/          # SQL migrations
└── seed/                # Seed data
```

## Future Phases

- **Phase 8:** Payment gateway integration (Paystack, Flutterwave, Mobile Money)
- **Phase 9:** Seller dashboard with order management
- **Phase 10:** Admin dashboard with order/product/user management
- **Phase 11:** Reviews and ratings
- **Phase 12:** Notifications and email
