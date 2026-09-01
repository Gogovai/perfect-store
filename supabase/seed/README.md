# Seed / Demo Data

This directory contains seed data for development and demo purposes.

## Structure

- `categories.sql` — Category seed data (with placeholder image URLs)
- `README.md` — This file

## Usage

### Loading seed data

1. Set up your Supabase project
2. Run the migrations first
3. Execute the seed SQL in the Supabase SQL Editor or via CLI:

```bash
supabase db seed
```

### Important notes

- **All product data in seed files is DEMO DATA** — not real marketplace inventory
- Image URLs use legitimate placeholder services (picsum.photos)
- Replace placeholder URLs with real Supabase Storage URLs in production
- Seller data is synthetic and does not represent real businesses
- Prices are arbitrary and do not reflect real market values

### Adding new seed data

When adding seed data:
1. Mark all entries clearly as `-- DEMO DATA` in SQL comments
2. Use legitimate, freely-licensed placeholder images
3. Do not use copyrighted product images from real brands
4. Ensure all foreign key relationships are valid

### Storage paths (for when uploads are implemented)

```
products/{product_id}/      — Product images
categories/{category_id}/   — Category images
sellers/{seller_id}/        — Seller logos and banners
campaigns/{campaign_id}/    — Campaign/promotional images
avatars/{user_id}/          — User avatars
```

### Replacing demo data

To replace demo data with real data:
1. Ensure Supabase Storage buckets are created
2. Upload real images via the seller dashboard (Phase 6+)
3. Update product/category/seller records with real image URLs
4. Remove or archive demo data
