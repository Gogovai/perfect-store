import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// ── Mapping: picsum seed → real Unsplash URL ──────────────────
const URL_MAP = {
  // ── Store logos & banners ──
  'techhub-logo':        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop&q=80',
  'techhub-banner':      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=200&fit=crop&q=80',
  'fashion-ave-logo':    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop&q=80',
  'fashion-ave-banner':  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&q=80',
  'home-ess-logo':       'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&q=80',
  'home-ess-banner':     'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=200&fit=crop&q=80',
  'beauty-palace-logo':  'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=200&h=200&fit=crop&q=80',
  'beauty-palace-banner':'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=200&fit=crop&q=80',
  'gadget-world-logo':   'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop&q=80',
  'gadget-world-banner': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=200&fit=crop&q=80',
  'accra-market-logo':   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&q=80',
  'accra-market-banner': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=200&fit=crop&q=80',
  'kumasi-fashion-logo': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop&q=80',
  'kumasi-fashion-banner':'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop&q=80',
  'fitzone-logo':        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&q=80',
  'fitzone-banner':      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop&q=80',

  // ── Phones & Tablets ──
  'samsung-a15':    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop&q=80',
  'samsung-a15-2':  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop&q=80',
  'iphone-14':      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop&q=80',
  'iphone-14-2':    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop&q=80',
  'tecno-spark':    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80',
  'infinix-hot40':  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&q=80',

  // ── Computers ──
  'hp-laptop-15':    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80',
  'hp-laptop-15-2':  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop&q=80',
  'lenovo-slim3':    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80',
  'dell-inspiron':   'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=80',
  'logitech-mk270': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop&q=80',
  'canon-pixma':     'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop&q=80',

  // ── Audio ──
  'jbl-tune520':     'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop&q=80',
  'galaxy-buds-fe':  'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=800&h=800&fit=crop&q=80',
  'anker-soundcore': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop&q=80',
  'jbl-clip4':       'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop&q=80',

  // ── Fashion ──
  'mens-polo':        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80',
  'mens-chinos':      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop&q=80',
  'mens-denim':       'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop&q=80',
  'mens-sneakers':    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80',
  'womens-ankara':    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop&q=80',
  'womens-blouse':    'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=800&fit=crop&q=80',
  'womens-palazzo':   'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=800&fit=crop&q=80',
  'womens-sandals':   'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=800&fit=crop&q=80',

  // ── Accessories ──
  'mens-wallet':       'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop&q=80',
  'womens-crossbody':  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&q=80',
  'sports-watch':      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80',
  'aviator-sunglasses':'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&q=80',

  // ── Home & Kitchen ──
  'cookware-set':    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop&q=80',
  'moulinex-blender':'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop&q=80',
  'electric-kettle': 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=800&fit=crop&q=80',
  'food-flask':      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop&q=80',

  // ── Furniture ──
  'office-chair':  'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&h=800&fit=crop&q=80',
  'standing-desk': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&h=800&fit=crop&q=80',

  // ── Beauty ──
  'shea-butter':     'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop&q=80',
  'vitamin-c-serum': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop&q=80',
  'kids-sunscreen':  'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop&q=80',
  'moroccanoil':     'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop&q=80',

  // ── Health ──
  'multivitamin':     'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=800&fit=crop&q=80',
  'bp-monitor':       'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=800&fit=crop&q=80',
  'resistance-bands': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=800&fit=crop&q=80',

  // ── Sports ──
  'dumbbells':    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop&q=80',
  'yoga-mat':     'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop&q=80',
  'football-fifa':'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=800&fit=crop&q=80',

  // ── Groceries ──
  'basmati-rice':   'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&q=80',
  'raw-honey':      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=800&fit=crop&q=80',
  'instant-coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=800&h=800&fit=crop&q=80',
  'coconut-oil':    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop&q=80',

  // ── Baby ──
  'baby-stroller': 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&h=800&fit=crop&q=80',
  'lego-classic':  'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=800&fit=crop&q=80',
  'kids-jacket':   'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&h=800&fit=crop&q=80',

  // ── Automotive ──
  'car-vacuum':    'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&h=800&fit=crop&q=80',
  'dash-cam':      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&h=800&fit=crop&q=80',
  'tyre-gauge':    'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&h=800&fit=crop&q=80',
  'car-mount':     'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=800&h=800&fit=crop&q=80',
};

// ── Read file ────────────────────────────────────────────────
const seedPath = join(process.cwd(), 'supabase', 'seed', 'seed-catalogue.sql');
let content = await readFile(seedPath, 'utf-8');

// ── Replace all picsum.photos URLs ───────────────────────────
let replaced = 0;
let missed = 0;

content = content.replace(/https:\/\/picsum\.photos\/seed\/([a-z0-9_-]+)\/\d+\/\d+/g, (match, seed) => {
  const replacement = URL_MAP[seed];
  if (replacement) {
    replaced++;
    return replacement;
  }
  missed++;
  console.warn(`⚠ No mapping for seed: ${seed}`);
  return match;
});

await writeFile(seedPath, content, 'utf-8');

console.log(`\n✅ Replaced ${replaced} URLs with real Unsplash photos.`);
if (missed > 0) console.log(`⚠ ${missed} URLs could not be mapped (kept as-is).`);
