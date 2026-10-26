-- The single-store storefront deliberately exposes only active products owned by
-- the platform/admin and assigned to active clothing categories. Legacy seed/catalog
-- data was still marked owner_type='seller', which meant the RLS policies correctly
-- hid every clothing product. Promote only active products in approved clothing and
-- fashion-accessory categories; keep non-clothing and inactive/rejected products hidden.
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
      AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
        '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
  );

COMMIT;
