import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const images = {
  'electronics/phones.jpg': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88',
  'electronics/laptop.jpg': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88',
  'electronics/headphones.jpg': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=88',
  'phones-tablets/phone.jpg': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88',
  'phones-tablets/tablet.jpg': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=88',
  'phones-tablets/watch.jpg': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88',
  'computers-accessories/laptop.jpg': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88',
  'computers-accessories/monitor.jpg': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=88',
  'computers-accessories/keyboard.jpg': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=88',
  'fashion/clothing.jpg': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=88',
  'fashion/shoes.jpg': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=88',
  'fashion/bags.jpg': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=88',
  'home-kitchen/kitchen.jpg': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=88',
  'home-kitchen/cookware.jpg': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=88',
  'home-kitchen/home.jpg': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=88',
  'beauty-personal-care/skincare.jpg': 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=88',
  'beauty-personal-care/beauty.jpg': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=1200&q=88',
  'beauty-personal-care/care.jpg': 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1200&q=88',
  'health/wellness.jpg': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=88',
  'health/care.jpg': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=88',
  'health/medical.jpg': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=1200&q=88',
  'sports-fitness/running.jpg': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=88',
  'sports-fitness/fitness.jpg': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=88',
  'sports-fitness/sports.jpg': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=88',
  'automotive/vehicle.jpg': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=88',
  'automotive/car.jpg': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=88',
  'automotive/accessories.jpg': 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=88',
  'baby-products/baby.jpg': 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=88',
  'baby-products/care.jpg': 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=88',
  'baby-products/toys.jpg': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=1200&q=88',
  'groceries/fresh.jpg': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=88',
  'groceries/pantry.jpg': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=1200&q=88',
  'office-school/office.jpg': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=88',
  'office-school/stationery.jpg': 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=88',
  'office-school/school.jpg': 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=88',
  'appliances/kitchen.jpg': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=88',
  'appliances/washing-machine.jpg': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=88',
  'appliances/home-appliance.jpg': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=88',
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

console.log(`Downloaded ${Object.keys(images).length} real product/category photographs.`);
