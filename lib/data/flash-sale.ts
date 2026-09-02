/**
 * Flash-sale scheduler.
 *
 * The day is divided into time windows (default: 6 × 4-hour blocks).
 * Each window shows a different subset of products, selected with a
 * deterministic seeded shuffle so every visitor sees the same items
 * within a window, and items rotate automatically when the window changes.
 *
 * No database or cron job is required — the schedule is computed from
 * the current server time.
 */

import type { FlashSaleItem } from './campaigns';

// ── Product pool ────────────────────────────────────────────────
// All products that can appear in flash sales.
const PRODUCT_POOL: FlashSaleItem[] = [
  { id:'flash-1',  name:'Samsung Galaxy A15',            originalPrice:2199, salePrice:1699, imageUrl:'/product-images/phones-tablets/phone.jpg',        discountPercent:23, slug:'samsung-galaxy-a15' },
  { id:'flash-2',  name:'iPhone 14 128GB',               originalPrice:5999, salePrice:5199, imageUrl:'/product-images/electronics/phones.jpg',          discountPercent:13, slug:'iphone-14-128gb' },
  { id:'flash-3',  name:'JBL Tune 520BT Headphones',     originalPrice:649,  salePrice:449,  imageUrl:'/product-images/electronics/headphones.jpg',      discountPercent:31, slug:'jbl-tune-520bt' },
  { id:'flash-4',  name:'HP Laptop 15s-fq5000',          originalPrice:4999, salePrice:4199, imageUrl:'/product-images/computers-accessories/laptop.jpg', discountPercent:16, slug:'hp-laptop-15s' },
  { id:'flash-5',  name:'Mens Denim Jacket',             originalPrice:449,  salePrice:299,  imageUrl:'/product-images/fashion/clothing.jpg',             discountPercent:33, slug:'mens-denim-jacket' },
  { id:'flash-6',  name:'Mens Running Sneakers',         originalPrice:399,  salePrice:269,  imageUrl:'/product-images/fashion/shoes.jpg',               discountPercent:33, slug:'mens-running-sneakers' },
  { id:'flash-7',  name:'Non-Stick Cookware Set 5pc',    originalPrice:699,  salePrice:499,  imageUrl:'/product-images/home-kitchen/cookware.jpg',        discountPercent:29, slug:'nonstick-cookware-set' },
  { id:'flash-8',  name:'Shea Moisture Raw Shea Butter', originalPrice:119,  salePrice:79,   imageUrl:'/product-images/beauty-personal-care/skincare.jpg',discountPercent:34, slug:'shea-moisture-shea-butter' },
  { id:'flash-9',  name:'Adjustable Dumbbell Set 20kg',  originalPrice:1199, salePrice:849,  imageUrl:'/product-images/sports-fitness/fitness.jpg',       discountPercent:29, slug:'adjustable-dumbbells' },
  { id:'flash-10', name:'Baby Stroller 2-in-1',          originalPrice:1199, salePrice:849,  imageUrl:'/product-images/baby-products/baby.jpg',           discountPercent:29, slug:'baby-stroller-2in1' },
  { id:'flash-11', name:'Tecno Spark 20 Pro',            originalPrice:1899, salePrice:1499, imageUrl:'/product-images/phones-tablets/phone.jpg',         discountPercent:21, slug:'tecno-spark-20-pro' },
  { id:'flash-12', name:'Lenovo IdeaPad Slim 3',         originalPrice:3699, salePrice:2999, imageUrl:'/product-images/computers-accessories/laptop.jpg',  discountPercent:19, slug:'lenovo-ideapad-slim' },
  { id:'flash-13', name:'Mens Classic Polo Shirt',       originalPrice:199,  salePrice:129,  imageUrl:'/product-images/fashion/clothing.jpg',             discountPercent:35, slug:'mens-classic-polo' },
  { id:'flash-14', name:'Womens Ankara Print Dress',     originalPrice:399,  salePrice:279,  imageUrl:'/product-images/fashion/bags.jpg',                 discountPercent:30, slug:'womens-ankara-dress' },
  { id:'flash-15', name:'Electric Kettle 2L',            originalPrice:279,  salePrice:179,  imageUrl:'/product-images/home-kitchen/cookware.jpg',        discountPercent:36, slug:'electric-kettle-2l' },
  { id:'flash-16', name:'Vitamin C Brightening Serum',   originalPrice:199,  salePrice:139,  imageUrl:'/product-images/beauty-personal-care/beauty.jpg',  discountPercent:30, slug:'vitamin-c-serum' },
  { id:'flash-17', name:'Yoga Mat 6mm Non-Slip',         originalPrice:149,  salePrice:89,   imageUrl:'/product-images/sports-fitness/fitness.jpg',       discountPercent:40, slug:'yoga-mat-6mm' },
  { id:'flash-18', name:'LEGO Classic Bricks 484pc',     originalPrice:399,  salePrice:279,  imageUrl:'/product-images/baby-products/toys.jpg',           discountPercent:30, slug:'lego-classic-484' },
  { id:'flash-19', name:'Moulinex 3-in-1 Blender',       originalPrice:549,  salePrice:379,  imageUrl:'/product-images/appliances/kitchen.jpg',           discountPercent:31, slug:'moulinex-blender' },
  { id:'flash-20', name:'Digital Sports Watch',          originalPrice:179,  salePrice:119,  imageUrl:'/product-images/phones-tablets/watch.jpg',         discountPercent:34, slug:'unisex-sports-watch' },
];

// ── Schedule configuration ──────────────────────────────────────
const WINDOWS_PER_DAY = 6;          // 6 sale windows per day
const WINDOW_HOURS   = 24 / WINDOWS_PER_DAY; // 4 hours each
const ITEMS_PER_WINDOW = 10;        // products shown per window

// ── Seeded PRNG (mulberry32) ────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Deterministic Fisher-Yates shuffle ──────────────────────────
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Public API ──────────────────────────────────────────────────
export interface FlashSaleWindow {
  /** The 10 products featured in this window. */
  items: FlashSaleItem[];
  /** When the current window ends (countdown target). */
  endsAt: Date;
  /** 0-based index of the current window today. */
  windowIndex: number;
}

/**
 * Compute which products are on flash sale right now and when the
 * current window ends.  Pure function of the current time — no I/O.
 */
export function getCurrentFlashSale(now: Date = new Date()): FlashSaleWindow {
  // Flatten to UTC day position (0–1) using local time so the
  // schedule matches the visitor's timezone.
  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const dayProgress  = secondsToday / 86400;

  const windowIndex = Math.min(
    Math.floor(dayProgress * WINDOWS_PER_DAY),
    WINDOWS_PER_DAY - 1,
  );

  // End of current window
  const windowEndSeconds = (windowIndex + 1) * WINDOW_HOURS * 3600;
  const endsAt = new Date(now);
  endsAt.setHours(0, 0, 0, 0);
  endsAt.setSeconds(windowEndSeconds);

  // Seed = YYYYMMDD * 100 + windowIndex → same seed all day per window
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const seed  = year * 10000 + month * 100 + day;
  const rng   = mulberry32(seed * 100 + windowIndex);

  const shuffled = seededShuffle(PRODUCT_POOL, rng);
  const items    = shuffled.slice(0, ITEMS_PER_WINDOW);

  return { items, endsAt, windowIndex };
}
