-- The single-store storefront deliberately exposes only active products owned by
-- the platform/admin and assigned to active clothing categories. Legacy seed/catalog
-- data was still marked owner_type='seller', which meant the RLS policies correctly
-- hid every clothing product. Promote only active products in the store's existing
-- fashion, men's fashion, women's fashion, and bags/accessories categories. Keep
-- unrelated marketplace categories and inactive/rejected products hidden.
BEGIN;

UPDATE public.products AS p
SET owner_type = 'platform',
    seller_id = NULL,
    updated_at = now()
WHERE p.status = 'active'
  AND p.owner_type = 'seller'
  AND EXISTS (
    SELECT 1
    FROM public.categories AS c
    WHERE c.id = p.category_id
      AND c.is_active = true
      AND c.slug IN ('fashion', 'mens-fashion', 'womens-fashion', 'bags-accessories')
  );

COMMIT;
