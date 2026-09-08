DO $do$
DECLARE
  v_admin_seller_id uuid;
  v_product_id uuid;
  v_category_id uuid;
BEGIN
  -- Get or create admin seller
  SELECT id INTO v_admin_seller_id FROM public.sellers
  WHERE slug LIKE 'marketplace-admin-%' AND status = 'active' LIMIT 1;

  IF v_admin_seller_id IS NULL THEN
    INSERT INTO public.sellers (owner_id, store_name, slug, status, commission_rate)
    SELECT id, 'Marketplace Admin', 'marketplace-admin-' || substr(id::text, 1, 8), 'active', 0
    FROM public.profiles WHERE role = 'admin' LIMIT 1
    RETURNING id INTO v_admin_seller_id;
  END IF;

  IF v_admin_seller_id IS NULL THEN
    RAISE NOTICE 'No admin user found; skipping test product seed';
    RETURN;
  END IF;

  -- Get a valid category
  SELECT id INTO v_category_id FROM public.categories WHERE is_active = true ORDER BY sort_order LIMIT 1;
  IF v_category_id IS NULL THEN
    RAISE NOTICE 'No active categories found; skipping test product seed';
    RETURN;
  END IF;

  -- Check if test product already exists
  SELECT id INTO v_product_id FROM public.products WHERE slug = 'test-marketplace-product';
  IF v_product_id IS NOT NULL THEN
    RAISE NOTICE 'Test product already exists with id %; skipping', v_product_id;
    RETURN;
  END IF;

  -- Create test product
  INSERT INTO public.products (
    seller_id, category_id, name, slug, description, short_description,
    sku, brand, base_price, compare_at_price, status, currency,
    is_featured, owner_type
  ) VALUES (
    v_admin_seller_id, v_category_id,
    'Test Marketplace Product', 'test-marketplace-product',
    'This is a test product to verify the complete marketplace lifecycle.',
    'Test product for marketplace verification',
    'TEST-001', 'Marketplace',
    50.00, 75.00, 'active', 'GHS',
    true, 'admin'
  ) RETURNING id INTO v_product_id;

  -- Create inventory (upsert if exists)
  INSERT INTO public.inventory (product_id, quantity, reserved_quantity, low_stock_threshold)
  VALUES (v_product_id, 100, 0, 10)
  ON CONFLICT (product_id) DO UPDATE SET quantity = 100, reserved_quantity = 0, low_stock_threshold = 10, updated_at = now();

  -- Create product image (skip if exists)
  INSERT INTO public.product_images (product_id, url, alt_text, sort_order, is_primary)
  VALUES (v_product_id, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Test Product Image', 0, true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test product created: id=%, seller=%, category=%', v_product_id, v_admin_seller_id, v_category_id;
END $do$;
