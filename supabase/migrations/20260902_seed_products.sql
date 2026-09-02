-- Seed: Real Ghana marketplace products
-- Uses raw SQL to bypass Supabase client permission issues.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).

-- ─── SELLERS ───────────────────────────────────────────────
DO $$
DECLARE
  v_seller_tech uuid;
  v_seller_fashion uuid;
  v_seller_home uuid;
  v_seller_beauty uuid;
  v_seller_gadget uuid;
  v_seller_market uuid;
  v_seller_kumasi uuid;
  v_seller_fitzone uuid;
  v_owner uuid;
  v_cat_electronics uuid;
  v_cat_phones uuid;
  v_cat_computers uuid;
  v_cat_fashion uuid;
  v_cat_mens uuid;
  v_cat_womens uuid;
  v_cat_home uuid;
  v_cat_kitchen uuid;
  v_cat_furniture uuid;
  v_cat_beauty uuid;
  v_cat_health uuid;
  v_cat_sports uuid;
  v_cat_grocery uuid;
  v_cat_baby uuid;
  v_cat_auto uuid;
  v_cat_audio uuid;
  v_cat_accessories uuid;
  v_prod uuid;
  v_img_id uuid;
  v_inv_id uuid;
BEGIN
  -- Get existing category IDs
  SELECT id INTO v_cat_electronics FROM categories WHERE slug = 'electronics';
  SELECT id INTO v_cat_phones FROM categories WHERE slug = 'phones-tablets';
  SELECT id INTO v_cat_computers FROM categories WHERE slug = 'computers-accessories';
  SELECT id INTO v_cat_fashion FROM categories WHERE slug = 'fashion';
  SELECT id INTO v_cat_home FROM categories WHERE slug = 'home-kitchen';
  SELECT id INTO v_cat_beauty FROM categories WHERE slug = 'beauty-personal-care';
  SELECT id INTO v_cat_health FROM categories WHERE slug = 'health';
  SELECT id INTO v_cat_sports FROM categories WHERE slug = 'sports-fitness';
  SELECT id INTO v_cat_grocery FROM categories WHERE slug = 'groceries';
  SELECT id INTO v_cat_baby FROM categories WHERE slug = 'baby-products';
  SELECT id INTO v_cat_auto FROM categories WHERE slug = 'automotive';

  -- Create subcategories
  INSERT INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
    (gen_random_uuid(), 'Phones & Tablets', 'phones-tablets-sub', 'Smartphones and tablets', v_cat_electronics, 2, true),
    (gen_random_uuid(), 'Computers & Laptops', 'computers-laptops', 'Laptops, desktops, and peripherals', v_cat_electronics, 3, true),
    (gen_random_uuid(), 'Audio & Speakers', 'audio-speakers', 'Headphones, earbuds, and speakers', v_cat_electronics, 4, true),
    (gen_random_uuid(), 'Men''s Fashion', 'mens-fashion', 'Men''s clothing and footwear', v_cat_fashion, 2, true),
    (gen_random_uuid(), 'Women''s Fashion', 'womens-fashion', 'Women''s clothing and footwear', v_cat_fashion, 3, true),
    (gen_random_uuid(), 'Bags & Accessories', 'bags-accessories', 'Handbags, watches, and jewellery', v_cat_fashion, 4, true),
    (gen_random_uuid(), 'Kitchen & Dining', 'kitchen-dining', 'Cookware, appliances, and dining', v_cat_home, 2, true),
    (gen_random_uuid(), 'Furniture', 'furniture', 'Sofas, tables, chairs, and beds', v_cat_home, 3, true),
    (gen_random_uuid(), 'Skincare & Haircare', 'skincare-haircare', 'Skincare, haircare, and personal care', v_cat_beauty, 2, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Get subcategory IDs
  SELECT id INTO v_cat_audio FROM categories WHERE slug = 'audio-speakers';
  SELECT id INTO v_cat_mens FROM categories WHERE slug = 'mens-fashion';
  SELECT id INTO v_cat_womens FROM categories WHERE slug = 'womens-fashion';
  SELECT id INTO v_cat_accessories FROM categories WHERE slug = 'bags-accessories';
  SELECT id INTO v_cat_kitchen FROM categories WHERE slug = 'kitchen-dining';
  SELECT id INTO v_cat_furniture FROM categories WHERE slug = 'furniture';

  -- Use first customer as seller owner (they become a seller)
  SELECT id INTO v_owner FROM profiles WHERE role = 'customer' LIMIT 1;
  IF v_owner IS NULL THEN
    v_owner := 'e38d03d3-c209-49d2-ae33-d738bf14a97d';
  END IF;

  -- Create sellers (skip if slug exists)
  INSERT INTO sellers (id, store_name, slug, owner_id, description, logo_url, banner_url, status, commission_rate, phone, email) VALUES
    (gen_random_uuid(), 'TechHub Ghana', 'techhub-ghana', v_owner, 'Your trusted source for electronics and gadgets in Accra.', 'https://picsum.photos/seed/techhub-logo/200/200', 'https://picsum.photos/seed/techhub-banner/400/200', 'active', 0.1, '+233501234567', 'contact@techhub.com'),
    (gen_random_uuid(), 'Fashion Avenue', 'fashion-avenue', v_owner, 'Trendy fashion for men and women. Accra-based, nationwide delivery.', 'https://picsum.photos/seed/fashion-ave-logo/200/200', 'https://picsum.photos/seed/fashion-ave-banner/400/200', 'active', 0.1, '+233502345678', 'contact@fashionave.com'),
    (gen_random_uuid(), 'Home Essentials', 'home-essentials', v_owner, 'Quality home and kitchen products at affordable prices.', 'https://picsum.photos/seed/home-ess-logo/200/200', 'https://picsum.photos/seed/home-ess-banner/400/200', 'active', 0.1, '+233503456789', 'contact@homeess.com'),
    (gen_random_uuid(), 'Beauty Palace', 'beauty-palace', v_owner, 'Premium beauty and skincare products from top brands.', 'https://picsum.photos/seed/beauty-palace-logo/200/200', 'https://picsum.photos/seed/beauty-palace-banner/400/200', 'active', 0.1, '+233504567890', 'contact@beautypalace.com'),
    (gen_random_uuid(), 'Gadget World', 'gadget-world', v_owner, 'Latest gadgets and tech accessories at competitive prices.', 'https://picsum.photos/seed/gadget-world-logo/200/200', 'https://picsum.photos/seed/gadget-world-banner/400/200', 'active', 0.1, '+233505678901', 'contact@gadgetworld.com'),
    (gen_random_uuid(), 'Accra Market', 'accra-market', v_owner, 'Your one-stop shop for everyday essentials and groceries.', 'https://picsum.photos/seed/accra-market-logo/200/200', 'https://picsum.photos/seed/accra-market-banner/400/200', 'active', 0.1, '+233506789012', 'contact@accramarket.com'),
    (gen_random_uuid(), 'Kumasi Fashion House', 'kumasi-fashion', v_owner, 'Authentic Ghanaian fashion and contemporary styles from Kumasi.', 'https://picsum.photos/seed/kumasi-fashion-logo/200/200', 'https://picsum.photos/seed/kumasi-fashion-banner/400/200', 'active', 0.1, '+233507890123', 'contact@kumasifashion.com'),
    (gen_random_uuid(), 'FitZone Sports', 'fitzone-sports', v_owner, 'Sports equipment, fitness gear, and athletic wear.', 'https://picsum.photos/seed/fitzone-logo/200/200', 'https://picsum.photos/seed/fitzone-banner/400/200', 'active', 0.1, '+233508901234', 'contact@fitzone.com')
  ON CONFLICT (slug) DO NOTHING;

  -- Get seller IDs
  SELECT id INTO v_seller_tech FROM sellers WHERE slug = 'techhub-ghana';
  SELECT id INTO v_seller_fashion FROM sellers WHERE slug = 'fashion-avenue';
  SELECT id INTO v_seller_home FROM sellers WHERE slug = 'home-essentials';
  SELECT id INTO v_seller_beauty FROM sellers WHERE slug = 'beauty-palace';
  SELECT id INTO v_seller_gadget FROM sellers WHERE slug = 'gadget-world';
  SELECT id INTO v_seller_market FROM sellers WHERE slug = 'accra-market';
  SELECT id INTO v_seller_kumasi FROM sellers WHERE slug = 'kumasi-fashion';
  SELECT id INTO v_seller_fitzone FROM sellers WHERE slug = 'fitzone-sports';

  -- ══════════════════════════════════════════════════════════
  -- PRODUCTS — helper pattern: insert product, get id, add images + inventory
  -- ══════════════════════════════════════════════════════════

  -- ── PHONES & TABLETS ──────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-a15') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Samsung Galaxy A15', 'samsung-galaxy-a15', 'The Samsung Galaxy A15 offers a vibrant 6.5" Super AMOLED display, 50MP triple camera, and long-lasting 5000mAh battery. Perfect for everyday use with smooth performance.', '6.5" AMOLED, 50MP camera, 5000mAh', 'Samsung', 1899, 2199, v_cat_phones, v_seller_tech, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/samsung-a15/800/800', 'Samsung Galaxy A15', 0, true), (v_prod, 'https://picsum.photos/seed/samsung-a15-2/800/800', 'Samsung Galaxy A15 side', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 85, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'iphone-14-128gb') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'iPhone 14 128GB', 'iphone-14-128gb', 'Experience the power of the A15 Bionic chip with the iPhone 14. 6.1" Super Retina XDR display, 12MP dual-camera system, and all-day battery life.', '6.1" Super Retina, A15 Bionic, 12MP', 'Apple', 5499, 5999, v_cat_phones, v_seller_tech, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/iphone-14/800/800', 'iPhone 14', 0, true), (v_prod, 'https://picsum.photos/seed/iphone-14-2/800/800', 'iPhone 14 back', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'tecno-spark-20-pro') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Tecno Spark 20 Pro', 'tecno-spark-20-pro', '6.78" FHD+ display, 108MP AI camera, MediaTek Helio G99 processor. 256GB storage and 8GB RAM for seamless multitasking.', '6.78" FHD+, 108MP, 256GB', 'Tecno', 1699, 1899, v_cat_phones, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/tecno-spark/800/800', 'Tecno Spark 20 Pro', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 120, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'infinix-hot-40-pro') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Infinix Hot 40 Pro', 'infinix-hot-40-pro', '6.78" 120Hz display, 108MP main camera, 5000mAh battery with 45W fast charging. Great value for money.', '6.78" 120Hz, 108MP, 45W fast charge', 'Infinix', 1399, 1599, v_cat_phones, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/infinix-hot40/800/800', 'Infinix Hot 40 Pro', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 95, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ipad-10th-gen') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'iPad 10th Gen 64GB', 'ipad-10th-gen', 'Colorful iPad with 10.9" Liquid Retina display, A14 Bionic chip, and Touch ID. Perfect for work, creativity, and entertainment.', '10.9" Liquid Retina, A14 chip', 'Apple', 4299, NULL, v_cat_phones, v_seller_tech, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/ipad-10th/800/800', 'iPad 10th Gen', 0, true), (v_prod, 'https://picsum.photos/seed/ipad-10th-2/800/800', 'iPad 10th Gen back', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 30, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-tab-a9') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Samsung Galaxy Tab A9', 'samsung-galaxy-tab-a9', 'Compact 8.7" tablet with Helio G99, 4GB RAM, 64GB storage. Great for browsing, streaming, and light productivity.', '8.7" display, Helio G99, 64GB', 'Samsung', 1299, 1499, v_cat_phones, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/samsung-tab-a9/800/800', 'Samsung Galaxy Tab A9', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  -- ── COMPUTERS ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'hp-laptop-15s') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'HP Laptop 15s-fq5000', 'hp-laptop-15s', '15.6" FHD, Intel Core i5-1235U, 8GB RAM, 512GB SSD. Sleek design with long battery life for productivity.', '15.6" FHD, Core i5, 8GB RAM, 512GB SSD', 'HP', 4499, 4999, v_cat_computers, v_seller_tech, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/hp-laptop-15/800/800', 'HP Laptop 15s', 0, true), (v_prod, 'https://picsum.photos/seed/hp-laptop-15-2/800/800', 'HP Laptop keyboard', 1, false);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 25, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lenovo-ideapad-slim') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Lenovo IdeaPad Slim 3', 'lenovo-ideapad-slim', '14" FHD IPS, AMD Ryzen 5, 8GB RAM, 256GB SSD. Lightweight at 1.43kg, perfect for students.', '14" FHD IPS, Ryzen 5, 8GB RAM', 'Lenovo', 3299, 3699, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/lenovo-slim3/800/800', 'Lenovo IdeaPad Slim 3', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 35, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'dell-inspiron-15') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Dell Inspiron 15 3520', 'dell-inspiron-15', '15.6" HD, Intel Core i3-1215U, 4GB RAM, 256GB SSD. Budget-friendly laptop for everyday computing.', '15.6" HD, Core i3, 4GB RAM, 256GB SSD', 'Dell', 2799, NULL, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dell-inspiron/800/800', 'Dell Inspiron 15', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'logitech-mk270') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Logitech MK270 Wireless Combo', 'logitech-mk270', 'Wireless keyboard and mouse combo with 2.4GHz connectivity. Full-size keyboard with number pad, 24-month battery.', 'Wireless combo, 2.4GHz, 24-month battery', 'Logitech', 299, 399, v_cat_computers, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/logitech-mk270/800/800', 'Logitech MK270', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'canon-pixma-g3420') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Canon PIXMA G3420 Printer', 'canon-pixma-g3420', 'Wireless MegaTank printer with print, copy, and scan. Refillable ink tanks: 6000 black / 7700 colour pages. WiFi and USB.', 'MegaTank, WiFi, print/copy/scan', 'Canon', 1899, 2199, v_cat_computers, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/canon-pixma/800/800', 'Canon PIXMA G3420', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  -- ── AUDIO ──────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'jbl-tune-520bt') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'JBL Tune 520BT Headphones', 'jbl-tune-520bt', 'JBL Pure Bass sound in lightweight on-ear design. Up to 57 hours battery, multipoint connection, foldable.', 'Pure Bass, 57hr battery, foldable', 'JBL', 499, 649, v_cat_audio, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/jbl-tune520/800/800', 'JBL Tune 520BT', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'samsung-galaxy-buds-fe') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Samsung Galaxy Buds FE', 'samsung-galaxy-buds-fe', 'True wireless earbuds with ANC, rich bass, 6hr listening time (30hr with case). IPX2 water resistant.', 'ANC, 6hr battery, IPX2', 'Samsung', 699, 899, v_cat_audio, v_seller_tech, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/galaxy-buds-fe/800/800', 'Samsung Galaxy Buds FE', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 55, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'anker-soundcore-2') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Anker Soundcore 2 Speaker', 'anker-soundcore-2', 'Portable Bluetooth speaker, 12W stereo sound, BassUp technology, IPX7 waterproof. 24-hour playtime.', '12W stereo, IPX7 waterproof, 24hr', 'Anker', 399, 549, v_cat_audio, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/anker-soundcore/800/800', 'Anker Soundcore 2', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 70, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'jbl-clip-4') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'JBL Clip 4 Portable Speaker', 'jbl-clip-4', 'Ultra-portable speaker with carabiner. IP67 waterproof and dustproof, 10hr playtime, JBL Pro Sound.', 'IP67, carabiner, 10hr play', 'JBL', 349, 449, v_cat_audio, v_seller_tech, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/jbl-clip4/800/800', 'JBL Clip 4', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 5);
  END IF;

  -- ── MEN'S FASHION ─────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-classic-polo') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Men''s Classic Polo Shirt', 'mens-classic-polo', 'Premium cotton polo shirt. Breathable pique fabric, ribbed collar, two-button placket. Navy, White, Green.', 'Premium cotton, classic fit', 'Local Brand', 149, 199, v_cat_mens, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-polo/800/800', 'Men''s Polo Shirt', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-chino-trousers') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Men''s Chino Trousers', 'mens-chino-trousers', 'Slim-fit chino trousers, stretch cotton twill. Flat front with side and back pockets.', 'Slim-fit, stretch cotton', 'Local Brand', 229, NULL, v_cat_mens, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-chinos/800/800', 'Men''s Chinos', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-denim-jacket') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Men''s Denim Jacket', 'mens-denim-jacket', 'Classic denim jacket, medium wash. Button front, chest pockets, adjustable waist tabs. 100% cotton denim.', 'Classic denim, medium wash', 'Local Brand', 349, 449, v_cat_mens, v_seller_kumasi, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-denim/800/800', 'Men''s Denim Jacket', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-running-sneakers') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Men''s Running Sneakers', 'mens-running-sneakers', 'Lightweight mesh sneakers with responsive cushioning and rubber outsole. Breathable upper, padded collar.', 'Lightweight mesh, responsive cushioning', 'SportMax', 299, 399, v_cat_mens, v_seller_fitzone, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-sneakers/800/800', 'Men''s Sneakers', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  -- ── WOMEN'S FASHION ───────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-ankara-dress') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Women''s Ankara Print Dress', 'womens-ankara-dress', 'Beautiful African wax print dress, fitted bodice and flared skirt. Bold geometric patterns. Made in Ghana.', 'Ankara print, fitted, Made in Ghana', 'Accra Threads', 299, NULL, v_cat_womens, v_seller_kumasi, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-ankara/800/800', 'Women''s Ankara Dress', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-casual-blouse') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Women''s Casual Blouse', 'womens-casual-blouse', 'Lightweight chiffon blouse, V-neck and 3/4 bell sleeves. Relaxed fit for work or casual outings.', 'Chiffon, V-neck, bell sleeves', 'Local Brand', 179, 229, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-blouse/800/800', 'Women''s Blouse', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-palazzo-pants') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Women''s Palazzo Pants', 'womens-palazzo-pants', 'High-waist palazzo pants, wide legs, elastic waistband. Flowy fabric, office to evening wear.', 'High-waist, wide leg, flowy', 'Local Brand', 249, 329, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-palazzo/800/800', 'Women''s Palazzo Pants', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 90, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-platform-sandals') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Women''s Platform Sandals', 'womens-platform-sandals', 'Comfortable platform sandals with cushioned insole and adjustable ankle strap. EVA sole. Black, Tan, Gold.', 'Platform sole, cushioned, ankle strap', 'Stride', 199, 279, v_cat_womens, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-sandals/800/800', 'Women''s Sandals', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 70, 0, 5);
  END IF;

  -- ── BAGS & ACCESSORIES ────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'mens-leather-wallet') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Men''s Genuine Leather Wallet', 'mens-leather-wallet', 'Full-grain leather bifold wallet with RFID blocking. 8 card slots, 2 note compartments, coin pocket. Gift box included.', 'Genuine leather, RFID blocking', 'LeatherCraft', 189, 249, v_cat_accessories, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/mens-wallet/800/800', 'Men''s Leather Wallet', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 120, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'womens-crossbody-bag') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Women''s Crossbody Bag', 'womens-crossbody-bag', 'Compact crossbody bag in faux leather, adjustable strap. Multiple compartments, minimalist design.', 'Faux leather, adjustable strap', 'BagHouse', 159, 219, v_cat_accessories, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/womens-crossbody/800/800', 'Women''s Crossbody Bag', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 110, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'unisex-sports-watch') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Unisex Digital Sports Watch', 'unisex-sports-watch', 'Digital sports watch with stopwatch, alarm, backlight, 50m water resistance. Resin case and silicone strap.', 'Digital, stopwatch, 50m water resistant', 'TimeTech', 129, 179, v_cat_accessories, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/sports-watch/800/800', 'Digital Sports Watch', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 90, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'aviator-sunglasses') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Aviator Sunglasses UV400', 'aviator-sunglasses', 'Classic aviator sunglasses, UV400 protection. Metal frame, adjustable nose pads. Includes hard case.', 'UV400 protection, metal frame', 'OpticPlus', 99, 149, v_cat_accessories, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/aviator-sunglasses/800/800', 'Aviator Sunglasses', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  -- ── KITCHEN & DINING ──────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'moulinex-blender') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Moulinex 3-in-1 Blender', 'moulinex-blender', 'Powerful 500W blender, 1.5L glass jar, grinder and chopper attachments. 2-speed control with pulse.', '500W, 1.5L glass jar, grinder + chopper', 'Moulinex', 399, 549, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/moulinex-blender/800/800', 'Moulinex Blender', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 35, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'nonstick-cookware-set') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Non-Stick Cookware Set (5pc)', 'nonstick-cookware-set', 'Five-piece non-stick set: frying pan, saucepan, stock pot. Induction-compatible, heat-resistant handles.', '5-piece, non-stick, induction', 'HomeChef', 499, 699, v_cat_kitchen, v_seller_home, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/cookware-set/800/800', 'Cookware Set', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 30, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'insulated-food-flask') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Insulated Food Flask 1L', 'insulated-food-flask', 'Double-wall vacuum insulated, keeps food hot 12hr. 1L capacity, stainless steel interior, leak-proof.', '1L, vacuum insulated, 12hr heat', 'ThermoKing', 149, 199, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/food-flask/800/800', 'Food Flask', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'electric-kettle-2l') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Electric Kettle 2L', 'electric-kettle-2l', 'Fast-boil 2L, 3000W. Auto shut-off, boil-dry protection, concealed heating element. BPA-free.', '2L, 3000W, auto shut-off, BPA-free', 'BrewMaster', 199, 279, v_cat_kitchen, v_seller_home, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/electric-kettle/800/800', 'Electric Kettle', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  -- ── FURNITURE ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'ergonomic-office-chair') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Ergonomic Office Chair', 'ergonomic-office-chair', 'Adjustable office chair with lumbar support, 2D armrests, breathable mesh. Supports 150kg. Height adjustable.', 'Ergonomic, mesh back, lumbar support', 'ComfortZone', 1299, 1599, v_cat_furniture, v_seller_home, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/office-chair/800/800', 'Office Chair', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 15, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'standing-desk') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Standing Desk 120x60cm', 'standing-desk', 'Electric adjustable height, bamboo top 120x60cm. Memory preset, cable tray. Height: 71-116cm.', 'Electric adjustable, bamboo, 120x60cm', 'WorkFit', 2499, 2999, v_cat_furniture, v_seller_home, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/standing-desk/800/800', 'Standing Desk', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 10, 0, 2);
  END IF;

  -- ── BEAUTY ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'shea-moisture-shea-butter') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Shea Moisture Raw Shea Butter', 'shea-moisture-shea-butter', '100% organic raw shea butter from Ghana. Deeply moisturises skin and hair. Unrefined, cold-pressed. 400g.', '100% organic, unrefined, 400g', 'Shea Moisture', 89, NULL, v_cat_beauty, v_seller_beauty, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/shea-butter/800/800', 'Shea Butter', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'vitamin-c-serum') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Vitamin C Brightening Serum', 'vitamin-c-serum', '20% Vitamin C with hyaluronic acid and Vitamin E. Fades dark spots, evens tone, boosts collagen. 30ml.', '20% Vitamin C, 30ml, brightening', 'GlowSkin', 149, 199, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/vitamin-c-serum/800/800', 'Vitamin C Serum', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'kids-sunscreen-spf50') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Kids Sunscreen SPF 50+', 'kids-sunscreen-spf50', 'Gentle mineral sunscreen for children. SPF 50+ broad spectrum, water-resistant 80min. 150ml.', 'SPF 50+, mineral, water-resistant', 'SunGuard', 79, 99, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/kids-sunscreen/800/800', 'Kids Sunscreen', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 180, 0, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'moroccanoil-treatment') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Moroccanoil Treatment Oil', 'moroccanoil-treatment', 'Argan oil hair treatment: detangles, speeds drying, boosts shine. All hair types. 100ml.', 'Argan oil, all hair types, 100ml', 'Moroccanoil', 249, 329, v_cat_beauty, v_seller_beauty, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/moroccanoil/800/800', 'Moroccanoil', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  -- ── HEALTH ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'multivitamin-tablets') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Multivitamin Tablets (60ct)', 'multivitamin-tablets', 'Complete daily multivitamin, 23 essential nutrients. Energy, immunity, overall health. One-a-day. 60 tablets.', '23 nutrients, one-a-day, 60 tablets', 'VitaPlus', 89, 119, v_cat_health, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/multivitamin/800/800', 'Multivitamin', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'digital-bp-monitor') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Digital Blood Pressure Monitor', 'digital-bp-monitor', 'Automatic upper arm BP monitor, large LCD. Stores 120 readings for 2 users. Irregular heartbeat detection.', 'Automatic, LCD, 120 readings', 'HealthTrack', 299, 399, v_cat_health, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/bp-monitor/800/800', 'BP Monitor', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'resistance-bands-set') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Resistance Bands Set (5pc)', 'resistance-bands-set', 'Five bands (5-50 lbs), natural latex, snap-resistant. Door anchor and carry bag included.', '5 levels, latex, door anchor', 'FitPro', 79, 119, v_cat_health, v_seller_fitzone, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/resistance-bands/800/800', 'Resistance Bands', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

  -- ── SPORTS ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'adjustable-dumbbells') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Adjustable Dumbbell Set (20kg)', 'adjustable-dumbbells', 'Adjustable 2.5-20kg each. Quick-change selector, anti-slip grip, compact storage. Home gym ideal.', '2.5-20kg adjustable, anti-slip', 'IronPower', 899, 1199, v_cat_sports, v_seller_fitzone, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dumbbells/800/800', 'Dumbbells', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'yoga-mat-6mm') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Yoga Mat 6mm Non-Slip', 'yoga-mat-6mm', 'Premium 6mm TPE yoga mat, non-slip both sides. Eco-friendly, carrying strap. 183x61cm.', '6mm TPE, non-slip, eco-friendly', 'ZenFit', 99, 149, v_cat_sports, v_seller_fitzone, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/yoga-mat/800/800', 'Yoga Mat', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 100, 0, 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'football-size5') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Football Size 5 (FIFA Quality)', 'football-size5', 'FIFA Quality Pro certified. Machine-stitched, butyl bladder, excellent air retention. Official size 5.', 'Size 5, FIFA Quality, machine-stitched', 'ProBall', 199, 279, v_cat_sports, v_seller_fitzone, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/football-fifa/800/800', 'Football', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 80, 0, 10);
  END IF;

  -- ── GROCERY ────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'basmati-rice-5kg') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Premium Basmati Rice 5kg', 'basmati-rice-5kg', 'Long grain aged basmati from India. Aromatic, fluffy, non-sticky. Perfect for jollof and biryani.', '5kg, long grain, aged, aromatic', 'TropicalGold', 89, NULL, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/basmati-rice/800/800', 'Basmati Rice', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 300, 0, 30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'organic-honey-500ml') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Organic Raw Honey 500ml', 'organic-honey-500ml', 'Pure unfiltered raw honey from Ghanaian beekeepers. Rich in antioxidants. 500ml glass jar, no additives.', '500ml, pure raw, from Ghana', 'NatureGold', 69, 89, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/raw-honey/800/800', 'Raw Honey', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'instant-coffee-200g') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Instant Coffee 200g', 'instant-coffee-200g', 'Premium freeze-dried, rich aroma, smooth taste. 100% Arabica beans. 200g resealable jar.', '200g, freeze-dried, 100% Arabica', 'CaféPure', 59, 79, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/instant-coffee/800/800', 'Instant Coffee', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 250, 0, 25);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'coconut-oil-1l') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Coconut Oil 1L', 'coconut-oil-1l', 'Virgin cold-pressed coconut oil. Multi-purpose: cooking, skin, hair. Organic, chemical-free. 1L bottle.', '1L, virgin cold-pressed, multi-purpose', 'CoCoNatura', 59, 79, v_cat_grocery, v_seller_market, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/coconut-oil/800/800', 'Coconut Oil', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  -- ── BABY & KIDS ────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'baby-stroller-2in1') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Baby Stroller 2-in-1', 'baby-stroller-2in1', 'Carrycot and seat modes. Lightweight aluminium, one-hand fold, large storage basket. Birth to 3 years.', '2-in-1, aluminium, one-hand fold', 'LittleJoy', 899, 1199, v_cat_baby, v_seller_home, 'active', 'GHS', true, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/baby-stroller/800/800', 'Baby Stroller', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 20, 0, 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'lego-classic-484') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'LEGO Classic Bricks (484pc)', 'lego-classic-484', 'Medium creative brick box, 484 pieces in 35 colours. Windows, doors, eyes, and wheels included.', '484 pieces, 35 colours', 'LEGO', 299, 399, v_cat_baby, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/lego-classic/800/800', 'LEGO Classic', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 40, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'kids-waterproof-jacket') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Kids Waterproof Jacket', 'kids-waterproof-jacket', 'Lightweight waterproof jacket. Reflective details, zip front, elasticated cuffs. Ages 4-12.', 'Waterproof, reflective, ages 4-12', 'KidShield', 149, 199, v_cat_baby, v_seller_fashion, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/kids-jacket/800/800', 'Kids Jacket', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 60, 0, 5);
  END IF;

  -- ── AUTOMOTIVE ─────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'car-vacuum-12v') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Car Vacuum Cleaner 12V', 'car-vacuum-12v', 'Portable 12V, 4500Pa suction. HEPA filter, 4.5m cord, multiple nozzles. Cleans seats, mats, dashboard.', '12V, 4500Pa, HEPA, 4.5m cord', 'AutoClean', 149, 229, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/car-vacuum/800/800', 'Car Vacuum', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 50, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'dash-cam-1080p') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Dash Cam 1080P', 'dash-cam-1080p', 'Full HD 1080P, 170° wide-angle lens. Loop recording, G-sensor, night vision. Includes 32GB SD card.', '1080P, 170° wide-angle, night vision', 'RoadGuard', 299, 449, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/dash-cam/800/800', 'Dash Cam', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 45, 0, 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'tyre-pressure-gauge') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Tyre Pressure Gauge Digital', 'tyre-pressure-gauge', 'Digital gauge, backlit LCD, 0-150 PSI. Includes battery. Compact, easy to use.', 'Digital, 0-150 PSI, backlit LCD', 'TyreCheck', 49, 79, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/tyre-gauge/800/800', 'Tyre Gauge', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 200, 0, 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM products WHERE slug = 'car-phone-mount') THEN
    INSERT INTO products (id, name, slug, description, short_description, brand, base_price, compare_at_price, category_id, seller_id, status, currency, is_featured, rating_average, review_count)
    VALUES (gen_random_uuid(), 'Car Phone Holder Mount', 'car-phone-mount', 'Universal car mount, one-hand operation. 360° rotation, strong suction, adjustable arm. 4.7-6.7".', 'Universal, 360°, strong suction', 'AutoMount', 59, 89, v_cat_auto, v_seller_gadget, 'active', 'GHS', false, 0, 0) RETURNING id INTO v_prod;
    INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES (v_prod, 'https://picsum.photos/seed/car-mount/800/800', 'Car Phone Mount', 0, true);
    INSERT INTO inventory (product_id, quantity, reserved_quantity, low_stock_threshold) VALUES (v_prod, 150, 0, 15);
  END IF;

END $$;

-- Summary
SELECT
  (SELECT count(*) FROM products) AS total_products,
  (SELECT count(*) FROM sellers) AS total_sellers,
  (SELECT count(*) FROM categories) AS total_categories,
  (SELECT count(*) FROM product_images) AS total_images,
  (SELECT count(*) FROM inventory) AS total_inventory;
