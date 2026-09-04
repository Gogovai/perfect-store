/**
 * Flash-sale scheduler.
 *
 * The day is divided into time windows (default: 6 × 4-hour blocks).
 * Each window shows a different subset of products, selected with a
 * deterministic seeded shuffle so every visitor sees the same items
 * within a window, and items rotate automatically when the window changes.
 *
 * The pool is built from real catalogue products (passed in by the caller),
 * so every flash-sale card links to a product that actually exists. When the
 * catalogue is empty the section renders nothing.
 */

import type { FlashSaleItem } from './campaigns';

/**
 * A real product that can appear in a flash-sale window.
 */
export type FlashSalePoolProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
};

// ── Schedule configuration ──────────────────────────────────────
const WINDOWS_PER_DAY = 6;          // 6 sale windows per day
const WINDOW_HOURS   = 24 / WINDOWS_PER_DAY; // 4 hours each
const ITEMS_PER_WINDOW = 10;        // products shown per window
const MIN_DISCOUNT_PERCENT = 15;    // flash-sale discount range
const MAX_DISCOUNT_PERCENT = 40;

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
  /** The products featured in this window. */
  items: FlashSaleItem[];
  /** When the current window ends (countdown target). */
  endsAt: Date;
  /** Whole seconds remaining until `endsAt`, computed when the window was resolved. */
  secondsLeft: number;
  /** 0-based index of the current window today. */
  windowIndex: number;
}

/**
 * Compute which products are on flash sale right now and when the
 * current window ends.  Pure function of the current time and the
 * real catalogue pool — no I/O.
 */
export function getFlashSaleWindow(
  pool: FlashSalePoolProduct[],
  now: Date = new Date()
): FlashSaleWindow {
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

  const shuffled = seededShuffle(pool, rng);
  const items = shuffled.slice(0, ITEMS_PER_WINDOW).map((product) => {
    // Deterministic per-product discount within the configured range.
    const discountPercent =
      MIN_DISCOUNT_PERCENT +
      Math.floor(rng() * (MAX_DISCOUNT_PERCENT - MIN_DISCOUNT_PERCENT + 1));
    const salePrice =
      Math.round((product.price * (100 - discountPercent) / 100) * 100) / 100;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      originalPrice: product.price,
      salePrice,
      discountPercent,
    };
  });

  const secondsLeft = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));

  return { items, endsAt, secondsLeft, windowIndex };
}