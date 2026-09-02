import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const images = {
  // ── Electronics (3 photos, each unique) ──
  'electronics/phones.jpg':      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=88',   // iPhone close-up
  'electronics/laptop.jpg':      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88',   // MacBook on desk
  'electronics/headphones.jpg':  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1200&q=88',   // Over-ear headphones

  // ── Phones & Tablets (3 unique) ──
  'phones-tablets/phone.jpg':    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1200&q=88',   // Phone on table
  'phones-tablets/tablet.jpg':   'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=88',   // iPad flat lay
  'phones-tablets/watch.jpg':    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88',   // Smartwatch

  // ── Computers & Accessories (3 unique) ──
  'computers-accessories/laptop.jpg':   'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88',  // Laptop open
  'computers-accessories/monitor.jpg':  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=88',  // Ultrawide monitor
  'computers-accessories/keyboard.jpg': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=88',  // Mechanical keyboard

  // ── Fashion (3 unique) ──
  'fashion/clothing.jpg': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=88',  // White t-shirts
  'fashion/shoes.jpg':    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=88',  // Red sneakers
  'fashion/bags.jpg':     'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=88',  // Leather bag

  // ── Home & Kitchen (3 unique) ──
  'home-kitchen/kitchen.jpg':  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=88',  // Modern kitchen
  'home-kitchen/cookware.jpg': 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=1200&q=88',  // Pots and pans
  'home-kitchen/home.jpg':     'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=88',  // Living room

  // ── Beauty & Personal Care (3 unique) ──
  'beauty-personal-care/skincare.jpg': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=88',  // Skincare bottles
  'beauty-personal-care/beauty.jpg':   'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=88',  // Makeup palette
  'beauty-personal-care/care.jpg':     'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=88',  // Perfume bottle

  // ── Health (3 unique) ──
  'health/wellness.jpg': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=88',  // Stethoscope
  'health/care.jpg':     'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=88',  // Medicine capsules
  'health/medical.jpg':  'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=1200&q=88',  // Medical kit

  // ── Sports & Fitness (3 unique) ──
  'sports-fitness/running.jpg': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=88',  // Runner
  'sports-fitness/fitness.jpg': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88',  // Dumbbells
  'sports-fitness/sports.jpg':  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=88',  // Basketball

  // ── Automotive (3 unique) ──
  'automotive/vehicle.jpg':    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=88',  // SUV
  'automotive/car.jpg':        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=88',  // Sports car
  'automotive/accessories.jpg':'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=88',  // Car interior

  // ── Baby Products (3 unique) ──
  'baby-products/baby.jpg':  'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=88',  // Baby clothes
  'baby-products/care.jpg':  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=88',  // Baby care
  'baby-products/toys.jpg':  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=88',  // Colorful toys

  // ── Groceries (3 unique — adding a third) ──
  'groceries/fresh.jpg':  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=88',  // Fresh produce
  'groceries/pantry.jpg': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=88',  // Pantry shelf
  'groceries/drinks.jpg': 'https://images.unsplash.com/photo-1546636889-ba9fdd63583e?auto=format&fit=crop&w=1200&q=88',  // Beverages

  // ── Office & School (3 unique) ──
  'office-school/office.jpg':     'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=88',  // Modern desk
  'office-school/stationery.jpg': 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=88',  // Pens & notebooks
  'office-school/school.jpg':     'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=88',  // Backpack & books

  // ── Appliances (3 unique — no duplicates with home-kitchen) ──
  'appliances/kitchen.jpg':        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=88',  // Microwave
  'appliances/washing-machine.jpg':'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1200&q=88',  // Washing machine
  'appliances/home-appliance.jpg': 'https://images.unsplash.com/photo-1567748157439-651aca2ff064?auto=format&fit=crop&w=1200&q=88',  // Vacuum cleaner
};

const root = join(process.cwd(), 'public', 'product-images');

for (const [relativePath, url] of Object.entries(images)) {
  const destination = join(root, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  const response = await fetch(url, { headers: { 'User-Agent': 'perfect-store-product-assets/1.0' } });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) throw new Error(`Expected an image from ${url}, received ${contentType || 'unknown content type'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, bytes);
  console.log(`Downloaded ${relativePath} (${bytes.length} bytes)`);
}

console.log(`\nDone — downloaded ${Object.keys(images).length} unique product/category photographs.`);
