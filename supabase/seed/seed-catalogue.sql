-- ============================================================
-- Perfect Store: Marketplace Seed Data
-- Run this ENTIRE script in Supabase SQL Editor (postgres user)
-- It is idempotent: safe to run multiple times.
-- ============================================================

-- Step 1: Get the first user as owner for sellers
DO $$
DECLARE
  v_owner uuid;
  v_seller_tech uuid;
  v_seller_fashion uuid;
  v_seller_home uuid;
  v_seller_beauty uuid;
  v_seller_gadget uuid;
  v_seller_market uuid;
  v_seller_kumasi uuid;
  v_seller_fitzone uuid;
  v_cat_phones uuid;
  v_cat_computers uuid;
  v_cat_mens uuid;
  v_cat_womens uuid;
  v_cat_accessories uuid;
  v_cat_audio uuid;
  v_cat_kitchen uuid;
  v_cat_furniture uuid;
  v_cat_beauty uuid;
  v_cat_health uuid;
  v_cat_sports uuid;
  v_cat_grocery uuid;
  v_cat_baby uuid;
  v_cat_auto uuid;
  v_prod uuid;
BEGIN
  -- Get first user
  SELECT id INTO v_owner FROM profiles ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Register a user first.';
  END IF;

  -- Make first user admin
  UPDATE profiles SET role = 'admin' WHERE id = v_owner;

  -- Get existing category IDs
  SELECT id INTO v_cat_phones FROM categories WHERE slug = 'phones-tablets';
  SELECT id INTO v_cat_computers FROM categories WHERE slug = 'computers-accessories';
  SELECT id INTO v_cat_beauty FROM categories WHERE slug = 'beauty-personal-care';
  SELECT id INTO v_cat_health FROM categories WHERE slug = 'health';
  SELECT id INTO v_cat_sports FROM categories WHERE slug = 'sports-fitness';
  SELECT id INTO v_cat_grocery FROM categories WHERE slug = 'groceries';
  SELECT id INTO v_cat_baby FROM categories WHERE slug = 'baby-products';
  SELECT id INTO v_cat_auto FROM categories WHERE slug = 'automotive';

  -- Create subcategories if they don't exist
  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Audio & Speakers', 'audio-speakers', 'Headphones, earbuds, and speakers', id, 4, true
  FROM categories WHERE slug = 'electronics' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'audio-speakers');

  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Mens Fashion', 'mens-fashion', 'Mens clothing and footwear', id, 2, true
  FROM categories WHERE slug = 'fashion' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'mens-fashion');

  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Womens Fashion', 'womens-fashion', 'Womens clothing and footwear', id, 3, true
  FROM categories WHERE slug = 'fashion' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'womens-fashion');

  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Bags & Accessories', 'bags-accessories', 'Handbags, watches, and jewellery', id, 4, true
  FROM categories WHERE slug = 'fashion' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bags-accessories');

  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Kitchen & Dining', 'kitchen-dining', 'Cookware, appliances, and dining', id, 2, true
  FROM categories WHERE slug = 'home-kitchen' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'kitchen-dining');

  INSERT INTO categories (name, slug, description, parent_id, sort_order, is_active)
  SELECT 'Furniture', 'furniture', 'Sofas, tables, chairs, and beds', id, 3, true
  FROM categories WHERE slug = 'home-kitchen' AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'furniture');

  -- Get subcategory IDs
  SELECT id INTO v_cat_audio FROM categories WHERE slug = 'audio-speakers';
  SELECT id INTO v_cat_mens FROM categories WHERE slug = 'mens-fashion';
  SELECT id INTO v_cat_womens FROM categories WHERE slug = 'womens-fashion';
  SELECT id INTO v_cat_accessories FROM categories WHERE slug = 'bags-accessories';
  SELECT id INTO v_cat_kitchen FROM categories WHERE slug = 'kitchen-dining';
  SELECT id INTO v_cat_furniture FROM categories WHERE slug = 'furniture';

  -- ========== SELLERS ==========
  INSERT INTO sellers (store_name, slug, owner_id, description, logo_url, banner_url, status, commission_rate, phone, email)
  SELECT * FROM (VALUES
    ('TechHub Ghana', 'techhub-ghana', v_owner, 'Trusted electronics and gadgets in Accra.', 'https://picsum.photos/seed/techhub-logo/200/200', 'https://picsum.photos/seed/techhub-banner/400/200', 'active'::text, 0.1, '+233501234567', 'contact@techhub.com'),
    ('Fashion Avenue', 'fashion-avenue', v_owner, 'Trendy fashion for men and women.', 'https://picsum.photos/seed/fashion-ave-logo/200/200', 'https://picsum.photos/seed/fashion-ave-banner/400/200', 'active'::text, 0.1, '+233502345678', 'contact@fashionave.com'),
    ('Home Essentials', 'home-essentials', v_owner, 'Quality home and kitchen products.', 'https://picsum.photos/seed/home-ess-logo/200/200', 'https://picsum.photos/seed/home-ess-banner/400/200', 'active'::text, 0.1, '+233503456789', 'contact@homeess.com'),
    ('Beauty Palace', 'beauty-palace', v_owner, 'Premium beauty and skincare products.', 'https://picsum.photos/seed/beauty-palace-logo/200/200', 'https://picsum.photos/seed/beauty-palace-banner/400/200', 'active'::text, 0.1, '+233504567890', 'contact@beautypalace.com'),
    ('Gadget World', 'gadget-world', v_owner, 'Latest gadgets and tech accessories.', 'https://picsum.photos/seed/gadget-world-logo/200/200', 'https://picsum.photos/seed/gadget-world-banner/400/200', 'active'::text, 0.1, '+233505678901', 'contact@gadgetworld.com'),
    ('Accra Market', 'accra-market', v_owner, 'One-stop shop for everyday essentials.', 'https://picsum.photos/seed/accra-market-logo/200/200', 'https://picsum.photos/seed/accra-market-banner/400/200', 'active'::text, 0.1, '+233506789012', 'contact@accramarket.com'),
    ('Kumasi Fashion House', 'kumasi-fashion', v_owner, 'Authentic Ghanaian fashion from Kumasi.', 'https://picsum.photos/seed/kumasi-fashion-logo/200/200', 'https://picsum.photos/seed/kumasi-fashion-banner/400/200', 'active'::text, 0.1, '+233507890123', 'contact@kumasifashion.com'),
    ('FitZone Sports', 'fitzone-sports', v_owner, 'Sports equipment and fitness gear.', 'https://picsum.photos/seed/fitzone-logo/200/200', 'https://picsum.photos/seed/fitzone-banner/400/200', 'active'::text, 0.1, '+233508901234', 'contact@fitzone.com')
  ) AS v(store_name, slug, owner_id, description, logo_url, banner_url, status, commission_rate, phone, email)
  WHERE NOT EXISTS (SELECT 1 FROM sellers s WHERE s.slug = v.slug);

  -- Get seller IDs
  SELECT id INTO v_seller_tech FROM sellers WHERE slug = 'techhub-ghana';
  SELECT id INTO v_seller_fashion FROM sellers WHERE slug = 'fashion-avenue';
  SELECT id INTO v_seller_home FROM sellers WHERE slug = 'home-essentials';
  SELECT id INTO v_seller_beauty FROM sellers WHERE slug = 'beauty-palace';
  SELECT id INTO v_seller_gadget FROM sellers WHERE slug = 'gadget-world';
  SELECT id INTO v_seller_market FROM sellers WHERE slug = 'accra-market';
  SELECT id INTO v_seller_kumasi FROM sellers WHERE slug = 'kumasi-fashion';
  SELECT id INTO v_seller_fitzone FROM sellers WHERE slug = 'fitzone-sports';

  -- ========== PHONES & TABLETS ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-a15') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Samsung Galaxy A15', 'samsung-galaxy-a15', 'Vibrant 6.5 inch Super AMOLED display, 50MP triple camera, 5000mAh battery. Perfect for everyday use.', '6.5 inch AMOLED, 50MP camera, 5000mAh', 'Samsung', 1899, 2199, v_cat_phones, v_seller_tech, 'active', 'GHS', true, 4.2, 15) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/samsung-a15/800/800', 'Samsung Galaxy A15', 0, true), (v_prod, 'https://picsum.photos/seed/samsung-a15-2/800/800', 'Samsung Galaxy A15 back', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 85, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'iphone-14-128gb') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'iPhone 14 128GB', 'iphone-14-128gb', 'A15 Bionic chip, 6.1 inch Super Retina XDR display, 12MP dual-camera system.', '6.1 inch Super Retina, A15 Bionic, 12MP', 'Apple', 5499, 5999, v_cat_phones, v_seller_tech, 'active', 'GHS', true, 4.5, 23) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/iphone-14/800/800', 'iPhone 14', 0, true), (v_prod, 'https://picsum.photos/seed/iphone-14-2/800/800', 'iPhone 14 back', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'tecno-spark-20-pro') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Tecno Spark 20 Pro', 'tecno-spark-20-pro', '6.78 inch FHD+ display, 108MP AI camera, MediaTek Helio G99, 256GB storage.', '6.78 inch FHD+, 108MP, 256GB', 'Tecno', 1699, 1899, v_cat_phones, v_seller_gadget, 'active', 'GHS', false, 4.0, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/tecno-spark/800/800', 'Tecno Spark 20 Pro', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 120, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'infinix-hot-40-pro') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Infinix Hot 40 Pro', 'infinix-hot-40-pro', '6.78 inch 120Hz display, 108MP camera, 5000mAh, 45W fast charging.', '6.78 inch 120Hz, 108MP, 45W', 'Infinix', 1399, 1599, v_cat_phones, v_seller_gadget, 'active', 'GHS', false, 3.9, 12) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/infinix-hot40/800/800', 'Infinix Hot 40 Pro', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 95, 0, 5);
  END IF;

  -- ========== COMPUTERS ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'hp-laptop-15s') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'HP Laptop 15s-fq5000', 'hp-laptop-15s', '15.6 inch FHD, Intel Core i5-1235U, 8GB RAM, 512GB SSD. Sleek design with long battery life.', '15.6 inch FHD, Core i5, 8GB RAM, 512GB SSD', 'HP', 4499, 4999, v_cat_computers, v_seller_tech, 'active', 'GHS', true, 4.3, 7) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/hp-laptop-15/800/800', 'HP Laptop 15s', 0, true), (v_prod, 'https://picsum.photos/seed/hp-laptop-15-2/800/800', 'HP Laptop keyboard', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 25, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lenovo-ideapad-slim') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Lenovo IdeaPad Slim 3', 'lenovo-ideapad-slim', '14 inch FHD IPS, AMD Ryzen 5, 8GB RAM, 256GB SSD. Lightweight at 1.43kg.', '14 inch FHD IPS, Ryzen 5, 8GB RAM', 'Lenovo', 3299, 3699, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 4.1, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/lenovo-slim3/800/800', 'Lenovo IdeaPad Slim 3', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 35, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'dell-inspiron-15') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Dell Inspiron 15 3520', 'dell-inspiron-15', '15.6 inch HD, Intel Core i3-1215U, 4GB RAM, 256GB SSD. Budget-friendly laptop.', '15.6 inch HD, Core i3, 4GB RAM, 256GB SSD', 'Dell', 2799, NULL, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 3.9, 4) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dell-inspiron/800/800', 'Dell Inspiron 15', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'logitech-mk270') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Logitech MK270 Wireless Combo', 'logitech-mk270', 'Wireless keyboard and mouse combo, 2.4GHz, 24-month battery.', 'Wireless combo, 2.4GHz, 24-month battery', 'Logitech', 299, 399, v_cat_computers, v_seller_gadget, 'active', 'GHS', false, 4.3, 14) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/logitech-mk270/800/800', 'Logitech MK270', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'canon-pixma-g3420') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Canon PIXMA G3420 Printer', 'canon-pixma-g3420', 'Wireless MegaTank printer with print, copy, scan. 6000 black pages.', 'MegaTank, WiFi, print/copy/scan', 'Canon', 1899, 2199, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 4.2, 3) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/canon-pixma/800/800', 'Canon PIXMA G3420', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  -- ========== AUDIO ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'jbl-tune-520bt') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'JBL Tune 520BT Headphones', 'jbl-tune-520bt', 'Pure Bass sound, 57hr battery, foldable, multipoint connection.', 'Pure Bass, 57hr battery, foldable', 'JBL', 499, 649, v_cat_audio, v_seller_tech, 'active', 'GHS', false, 4.4, 18) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/jbl-tune520/800/800', 'JBL Tune 520BT', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-buds-fe') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Samsung Galaxy Buds FE', 'samsung-galaxy-buds-fe', 'True wireless earbuds with ANC, rich bass, 6hr battery (30hr with case).', 'ANC, 6hr battery, IPX2', 'Samsung', 699, 899, v_cat_audio, v_seller_tech, 'active', 'GHS', true, 4.3, 10) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/galaxy-buds-fe/800/800', 'Samsung Galaxy Buds FE', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 55, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'anker-soundcore-2') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Anker Soundcore 2 Speaker', 'anker-soundcore-2', '12W stereo, IPX7 waterproof, 24hr playtime.', '12W stereo, IPX7 waterproof, 24hr', 'Anker', 399, 549, v_cat_audio, v_seller_gadget, 'active', 'GHS', false, 4.2, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/anker-soundcore/800/800', 'Anker Soundcore 2', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 70, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'jbl-clip-4') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'JBL Clip 4 Portable Speaker', 'jbl-clip-4', 'IP67 waterproof, carabiner clip, 10hr playtime.', 'IP67, carabiner, 10hr play', 'JBL', 349, 449, v_cat_audio, v_seller_tech, 'active', 'GHS', false, 4.1, 6) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/jbl-clip4/800/800', 'JBL Clip 4', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 5);
  END IF;

  -- ========== MENS FASHION ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-classic-polo') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Mens Classic Polo Shirt', 'mens-classic-polo', 'Premium cotton polo, breathable pique, ribbed collar.', 'Premium cotton, classic fit', 'Local Brand', 149, 199, v_cat_mens, v_seller_fashion, 'active', 'GHS', false, 4.0, 22) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-polo/800/800', 'Mens Polo Shirt', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-chino-trousers') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Mens Chino Trousers', 'mens-chino-trousers', 'Slim-fit, stretch cotton twill, flat front.', 'Slim-fit, stretch cotton', 'Local Brand', 229, NULL, v_cat_mens, v_seller_fashion, 'active', 'GHS', false, 4.0, 10) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-chinos/800/800', 'Mens Chinos', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-denim-jacket') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Mens Denim Jacket', 'mens-denim-jacket', 'Classic denim, medium wash, button front, 100% cotton.', 'Classic denim, medium wash', 'Local Brand', 349, 449, v_cat_mens, v_seller_kumasi, 'active', 'GHS', true, 4.2, 9) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-denim/800/800', 'Mens Denim Jacket', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-running-sneakers') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Mens Running Sneakers', 'mens-running-sneakers', 'Lightweight mesh, responsive cushioning, rubber outsole.', 'Lightweight mesh, responsive cushioning', 'SportMax', 299, 399, v_cat_mens, v_seller_fitzone, 'active', 'GHS', false, 4.1, 7) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-sneakers/800/800', 'Mens Sneakers', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  -- ========== WOMENS FASHION ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-ankara-dress') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Womens Ankara Print Dress', 'womens-ankara-dress', 'African wax print, fitted bodice, flared skirt. Made in Ghana.', 'Ankara print, Made in Ghana', 'Accra Threads', 299, NULL, v_cat_womens, v_seller_kumasi, 'active', 'GHS', true, 4.6, 14) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-ankara/800/800', 'Womens Ankara Dress', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-casual-blouse') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Womens Casual Blouse', 'womens-casual-blouse', 'Chiffon, V-neck, 3/4 bell sleeves. Relaxed fit.', 'Chiffon, V-neck, bell sleeves', 'Local Brand', 179, 229, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 3.8, 6) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-blouse/800/800', 'Womens Blouse', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-palazzo-pants') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Womens Palazzo Pants', 'womens-palazzo-pants', 'High-waist, wide leg, elastic waistband.', 'High-waist, wide leg, flowy', 'Local Brand', 249, 329, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 3.9, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-palazzo/800/800', 'Palazzo Pants', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 90, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-platform-sandals') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Womens Platform Sandals', 'womens-platform-sandals', 'Cushioned insole, adjustable ankle strap, EVA sole.', 'Platform sole, cushioned', 'Stride', 199, 279, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 3.7, 4) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-sandals/800/800', 'Womens Sandals', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 70, 0, 5);
  END IF;

  -- ========== ACCESSORIES ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-leather-wallet') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Mens Leather Wallet', 'mens-leather-wallet', 'Full-grain leather, RFID blocking, 8 card slots.', 'Genuine leather, RFID blocking', 'LeatherCraft', 189, 249, v_cat_accessories, v_seller_fashion, 'active', 'GHS', false, 4.4, 13) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-wallet/800/800', 'Leather Wallet', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 120, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-crossbody-bag') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Womens Crossbody Bag', 'womens-crossbody-bag', 'Faux leather, adjustable strap, multiple compartments.', 'Faux leather, adjustable strap', 'BagHouse', 159, 219, v_cat_accessories, v_seller_fashion, 'active', 'GHS', false, 4.0, 7) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-crossbody/800/800', 'Crossbody Bag', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 110, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'unisex-sports-watch') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Digital Sports Watch', 'unisex-sports-watch', 'Stopwatch, alarm, backlight, 50m water resistant.', 'Digital, stopwatch, 50m WR', 'TimeTech', 129, 179, v_cat_accessories, v_seller_gadget, 'active', 'GHS', false, 4.0, 9) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/sports-watch/800/800', 'Digital Sports Watch', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 90, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'aviator-sunglasses') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Aviator Sunglasses UV400', 'aviator-sunglasses', 'UV400 protection, metal frame, adjustable nose pads.', 'UV400 protection, metal frame', 'OpticPlus', 99, 149, v_cat_accessories, v_seller_gadget, 'active', 'GHS', false, 4.1, 6) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/aviator-sunglasses/800/800', 'Aviator Sunglasses', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  -- ========== KITCHEN ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'nonstick-cookware-set') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Non-Stick Cookware Set 5pc', 'nonstick-cookware-set', 'Five-piece set: frying pan, saucepan, stock pot. Induction-compatible.', '5-piece, non-stick, induction', 'HomeChef', 499, 699, v_cat_kitchen, v_seller_home, 'active', 'GHS', true, 4.1, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/cookware-set/800/800', 'Cookware Set', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 30, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'moulinex-blender') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Moulinex 3-in-1 Blender', 'moulinex-blender', '500W, 1.5L glass jar, grinder + chopper attachments.', '500W, 1.5L glass jar, grinder', 'Moulinex', 399, 549, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 4.0, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/moulinex-blender/800/800', 'Moulinex Blender', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 35, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'electric-kettle-2l') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Electric Kettle 2L', 'electric-kettle-2l', 'Fast-boil 2L, 3000W, auto shut-off, BPA-free.', '2L, 3000W, auto shut-off', 'BrewMaster', 199, 279, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 4.2, 9) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/electric-kettle/800/800', 'Electric Kettle', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'insulated-food-flask') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Insulated Food Flask 1L', 'insulated-food-flask', 'Vacuum insulated, keeps food hot 12hr. 1L stainless steel.', '1L, vacuum insulated, 12hr heat', 'ThermoKing', 149, 199, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 4.1, 6) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/food-flask/800/800', 'Food Flask', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  -- ========== FURNITURE ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ergonomic-office-chair') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Ergonomic Office Chair', 'ergonomic-office-chair', 'Adjustable with lumbar support, mesh back, 150kg capacity.', 'Ergonomic, mesh, lumbar support', 'ComfortZone', 1299, 1599, v_cat_furniture, v_seller_home, 'active', 'GHS', true, 4.5, 12) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/office-chair/800/800', 'Office Chair', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 15, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'standing-desk') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Standing Desk 120x60cm', 'standing-desk', 'Electric adjustable, bamboo top, memory preset.', 'Electric adjustable, bamboo, 120x60cm', 'WorkFit', 2499, 2999, v_cat_furniture, v_seller_home, 'active', 'GHS', false, 4.4, 2) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/standing-desk/800/800', 'Standing Desk', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 10, 0, 2);
  END IF;

  -- ========== BEAUTY ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'shea-moisture-shea-butter') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Shea Moisture Raw Shea Butter', 'shea-moisture-shea-butter', '100% organic raw shea butter from Ghana. 400g.', '100% organic, unrefined, 400g', 'Shea Moisture', 89, NULL, v_cat_beauty, v_seller_beauty, 'active', 'GHS', true, 4.7, 30) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/shea-butter/800/800', 'Shea Butter', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'vitamin-c-serum') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Vitamin C Brightening Serum', 'vitamin-c-serum', '20% Vitamin C with hyaluronic acid. 30ml.', '20% Vitamin C, 30ml, brightening', 'GlowSkin', 149, 199, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 4.4, 11) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/vitamin-c-serum/800/800', 'Vitamin C Serum', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'kids-sunscreen-spf50') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Kids Sunscreen SPF 50+', 'kids-sunscreen-spf50', 'Mineral sunscreen for children. SPF 50+, water-resistant. 150ml.', 'SPF 50+, mineral, water-resistant', 'SunGuard', 79, 99, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 4.5, 9) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/kids-sunscreen/800/800', 'Kids Sunscreen', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 180, 0, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'moroccanoil-treatment') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Moroccanoil Treatment Oil', 'moroccanoil-treatment', 'Argan oil hair treatment. All hair types. 100ml.', 'Argan oil, all hair types, 100ml', 'Moroccanoil', 249, 329, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 4.6, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/moroccanoil/800/800', 'Moroccanoil', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  -- ========== HEALTH ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'multivitamin-tablets') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Multivitamin Tablets 60ct', 'multivitamin-tablets', '23 essential nutrients. One-a-day. 60 tablets.', '23 nutrients, one-a-day, 60 tablets', 'VitaPlus', 89, 119, v_cat_health, v_seller_market, 'active', 'GHS', false, 4.0, 10) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/multivitamin/800/800', 'Multivitamin', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'digital-bp-monitor') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Digital Blood Pressure Monitor', 'digital-bp-monitor', 'Automatic upper arm, LCD, 120 readings. Irregular heartbeat detection.', 'Automatic, LCD, 120 readings', 'HealthTrack', 299, 399, v_cat_health, v_seller_market, 'active', 'GHS', false, 4.3, 7) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/bp-monitor/800/800', 'BP Monitor', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'resistance-bands-set') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Resistance Bands Set 5pc', 'resistance-bands-set', '5 levels (5-50 lbs), natural latex, door anchor + bag.', '5 levels, latex, door anchor', 'FitPro', 79, 119, v_cat_health, v_seller_fitzone, 'active', 'GHS', false, 4.1, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/resistance-bands/800/800', 'Resistance Bands', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

  -- ========== SPORTS ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'adjustable-dumbbells') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Adjustable Dumbbell Set 20kg', 'adjustable-dumbbells', '2.5-20kg each, quick-change, anti-slip grip.', '2.5-20kg adjustable, anti-slip', 'IronPower', 899, 1199, v_cat_sports, v_seller_fitzone, 'active', 'GHS', true, 4.3, 6) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dumbbells/800/800', 'Dumbbells', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'yoga-mat-6mm') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Yoga Mat 6mm Non-Slip', 'yoga-mat-6mm', '6mm TPE, non-slip both sides, eco-friendly.', '6mm TPE, non-slip, eco-friendly', 'ZenFit', 99, 149, v_cat_sports, v_seller_fitzone, 'active', 'GHS', false, 4.2, 15) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/yoga-mat/800/800', 'Yoga Mat', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'football-size5') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Football Size 5 FIFA Quality', 'football-size5', 'FIFA Quality Pro, machine-stitched, butyl bladder.', 'Size 5, FIFA Quality, machine-stitched', 'ProBall', 199, 279, v_cat_sports, v_seller_fitzone, 'active', 'GHS', false, 4.3, 11) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/football-fifa/800/800', 'Football', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 10);
  END IF;

  -- ========== GROCERY ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'basmati-rice-5kg') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Premium Basmati Rice 5kg', 'basmati-rice-5kg', 'Long grain aged basmati. Aromatic, fluffy, non-sticky.', '5kg, long grain, aged, aromatic', 'TropicalGold', 89, NULL, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 4.1, 25) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/basmati-rice/800/800', 'Basmati Rice', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 300, 0, 30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'organic-honey-500ml') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Organic Raw Honey 500ml', 'organic-honey-500ml', 'Pure raw honey from Ghanaian beekeepers. 500ml glass jar.', '500ml, pure raw, from Ghana', 'NatureGold', 69, 89, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 4.5, 18) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/raw-honey/800/800', 'Raw Honey', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'instant-coffee-200g') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Instant Coffee 200g', 'instant-coffee-200g', 'Premium freeze-dried, 100% Arabica. 200g resealable.', '200g, freeze-dried, 100% Arabica', 'CafePure', 59, 79, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 4.0, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/instant-coffee/800/800', 'Instant Coffee', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 250, 0, 25);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'coconut-oil-1l') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Coconut Oil 1L', 'coconut-oil-1l', 'Virgin cold-pressed, organic, multi-purpose. 1L.', '1L, virgin cold-pressed, multi-purpose', 'CoCoNatura', 59, 79, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 4.2, 14) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/coconut-oil/800/800', 'Coconut Oil', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  -- ========== BABY ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'baby-stroller-2in1') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Baby Stroller 2-in-1', 'baby-stroller-2in1', 'Carrycot and seat modes. Lightweight aluminium, one-hand fold.', '2-in-1, aluminium, one-hand fold', 'LittleJoy', 899, 1199, v_cat_baby, v_seller_home, 'active', 'GHS', true, 4.4, 8) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/baby-stroller/800/800', 'Baby Stroller', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lego-classic-484') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'LEGO Classic Bricks 484pc', 'lego-classic-484', 'Medium creative brick box, 484 pieces in 35 colours.', '484 pieces, 35 colours', 'LEGO', 299, 399, v_cat_baby, v_seller_gadget, 'active', 'GHS', false, 4.7, 20) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/lego-classic/800/800', 'LEGO Classic', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'kids-waterproof-jacket') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Kids Waterproof Jacket', 'kids-waterproof-jacket', 'Lightweight waterproof jacket, reflective details, ages 4-12.', 'Waterproof, reflective, ages 4-12', 'KidShield', 149, 199, v_cat_baby, v_seller_fashion, 'active', 'GHS', false, 4.1, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/kids-jacket/800/800', 'Kids Jacket', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  -- ========== AUTOMOTIVE ==========
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'car-vacuum-12v') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Car Vacuum Cleaner 12V', 'car-vacuum-12v', 'Portable 12V, 4500Pa, HEPA filter, 4.5m cord.', '12V, 4500Pa, HEPA, 4.5m cord', 'AutoClean', 149, 229, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 3.9, 4) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/car-vacuum/800/800', 'Car Vacuum', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 50, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'dash-cam-1080p') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Dash Cam 1080P', 'dash-cam-1080p', 'Full HD, 170 degree wide-angle, night vision. Includes 32GB SD card.', '1080P, 170 degree, night vision', 'RoadGuard', 299, 449, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 4.1, 5) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dash-cam/800/800', 'Dash Cam', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'tyre-pressure-gauge') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Tyre Pressure Gauge Digital', 'tyre-pressure-gauge', 'Digital, 0-150 PSI, backlit LCD. Includes battery.', 'Digital, 0-150 PSI, backlit LCD', 'TyreCheck', 49, 79, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 4.0, 3) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/tyre-gauge/800/800', 'Tyre Gauge', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'car-phone-mount') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Car Phone Holder Mount', 'car-phone-mount', 'Universal, one-hand operation, 360 rotation, strong suction.', 'Universal, 360 degree, strong suction', 'AutoMount', 59, 89, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 4.1, 7) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/car-mount/800/800', 'Car Phone Mount', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

END $$;

-- Verify results
SELECT
  (SELECT count(*) FROM sellers) AS total_sellers,
  (SELECT count(*) FROM products) AS total_products,
  (SELECT count(*) FROM categories) AS total_categories,
  (SELECT count(*) FROM product_images) AS total_images,
  (SELECT count(*) FROM inventory) AS total_inventory;
