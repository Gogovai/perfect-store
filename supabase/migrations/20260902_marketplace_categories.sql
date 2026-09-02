-- Normalize the marketplace category catalogue to the production names used by the storefront.
-- Idempotent so it can safely be applied to a fresh environment or an existing database.

UPDATE public.categories
SET name = 'Computers & Accessories',
    slug = 'computers-accessories',
    description = 'Laptops, desktops, monitors, networking, storage and computer accessories.',
    updated_at = now()
WHERE slug = 'computers';

UPDATE public.categories
SET name = 'Home & Kitchen',
    slug = 'home-kitchen',
    description = 'Furniture, kitchenware, home essentials and household products.',
    updated_at = now()
WHERE slug = 'home-living';

UPDATE public.categories
SET name = 'Sports & Fitness',
    slug = 'sports-fitness',
    description = 'Fitness equipment, sports gear, activewear and outdoor essentials.',
    updated_at = now()
WHERE slug = 'sports-outdoors';

UPDATE public.categories
SET name = 'Baby Products',
    slug = 'baby-products',
    description = 'Baby care, feeding, nursery and children essentials.',
    updated_at = now()
WHERE slug = 'baby-kids';

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Groceries', 'groceries', 'Everyday food, pantry staples, beverages and household consumables.', true, 11),
  ('Office & School', 'office-school', 'Stationery, school supplies, office equipment and workspace essentials.', true, 12),
  ('Appliances', 'appliances', 'Kitchen, home and personal appliances for everyday living.', true, 13)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();
