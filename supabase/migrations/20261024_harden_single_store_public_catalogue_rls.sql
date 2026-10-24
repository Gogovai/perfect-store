-- Close marketplace-era permissive RLS policies that still exposed seller-owned
-- products and unrestricted inventory through the public Supabase API.
-- Keep historical rows/tables intact; only the public catalogue and admin write paths change.
BEGIN;

-- Public category discovery is limited to active clothing/fashion categories.
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_single_store_public_read
  ON public.categories
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND lower(COALESCE(name, '') || ' ' || COALESCE(slug, '')) ~*
      '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
  );

-- Remove the old permissive product policy: PostgreSQL combines permissive policies
-- with OR, so adding a restrictive-looking policy alone would not be sufficient.
DROP POLICY IF EXISTS products_public_select ON public.products;
DROP POLICY IF EXISTS products_seller_insert ON public.products;
DROP POLICY IF EXISTS products_seller_update ON public.products;
DROP POLICY IF EXISTS products_seller_delete ON public.products;
DROP POLICY IF EXISTS products_single_store_public_read ON public.products;
CREATE POLICY products_single_store_public_read
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND owner_type IN ('admin', 'platform')
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id
        AND c.is_active = true
        AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
          '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
    )
  );
CREATE POLICY products_admin_manage
  ON public.products
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Product images and variants follow the same public visibility rule.
DROP POLICY IF EXISTS product_images_public_select ON public.product_images;
DROP POLICY IF EXISTS product_images_seller_manage ON public.product_images;
DROP POLICY IF EXISTS product_images_single_store_public_read ON public.product_images;
CREATE POLICY product_images_single_store_public_read
  ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
    WHERE p.id = product_id
      AND p.status = 'active'
      AND p.owner_type IN ('admin', 'platform')
      AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
        '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
  ));
CREATE POLICY product_images_admin_manage
  ON public.product_images
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS variants_public_select ON public.product_variants;
DROP POLICY IF EXISTS variants_seller_manage ON public.product_variants;
DROP POLICY IF EXISTS product_variants_single_store_public_read ON public.product_variants;
CREATE POLICY product_variants_single_store_public_read
  ON public.product_variants
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.products p
      JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
      WHERE p.id = product_id
        AND p.status = 'active'
        AND p.owner_type IN ('admin', 'platform')
        AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
          '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
    )
  );
CREATE POLICY product_variants_admin_manage
  ON public.product_variants
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Stock levels are no longer world-readable. Only stock attached to a visible,
-- active single-store clothing product is readable; all stock mutations are admin-only.
DROP POLICY IF EXISTS inventory_public_select ON public.inventory;
DROP POLICY IF EXISTS inventory_seller_manage ON public.inventory;
CREATE POLICY inventory_single_store_public_read
  ON public.inventory
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
    WHERE p.id = product_id
      AND p.status = 'active'
      AND p.owner_type IN ('admin', 'platform')
      AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
        '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
  ));
CREATE POLICY inventory_admin_manage
  ON public.inventory
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS variant_inventory_public_select ON public.variant_inventory;
DROP POLICY IF EXISTS variant_inventory_seller_manage ON public.variant_inventory;
CREATE POLICY variant_inventory_single_store_public_read
  ON public.variant_inventory
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    JOIN public.categories c ON c.id = p.category_id AND c.is_active = true
    WHERE v.id = variant_id
      AND v.is_active = true
      AND p.status = 'active'
      AND p.owner_type IN ('admin', 'platform')
      AND lower(COALESCE(c.name, '') || ' ' || COALESCE(c.slug, '')) ~*
        '\\m(fashion|clothing|apparel|menswear|womenswear|men.?s|women.?s|men|women|footwear|shoes?|sandals?|boots?|sneakers?|accessor\\w*|bags?|traditional|ankara|dresses?|gowns?|shirts?|t.?shirts?|tops?|blouses?|jeans?|denim|trousers?|pants?|shorts?|skirts?|jackets?|coats?|suits?|blazers?|hoodies?|sweaters?|jumpers?|cardigans?|knitwear|underwear|lingerie|swimwear|activewear|sportswear|socks?|belts?|hats?|caps?|wallets?)\\M'
  ));
CREATE POLICY variant_inventory_admin_manage
  ON public.variant_inventory
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

COMMIT;
