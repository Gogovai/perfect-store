// Apply supabase/seed/seed-catalogue.sql to a Supabase project through the
// PostgREST API using the service-role key (bypasses RLS). Idempotent:
// products that already exist (same slug) are skipped.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/apply-seed.mjs
// (dotenv is loaded so .env.local values are picked up automatically.)
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// ---------- SQL helpers ----------
function unwrapParens(text) {
  const t = text.trim();
  if (!t.startsWith('(')) return null;
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (ch === "'") {
        if (t[i + 1] === "'") i++;
        else inStr = false;
      }
      continue;
    }
    if (ch === "'") inStr = true;
    else if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return t.slice(1, i);
    }
  }
  throw new Error('Unbalanced parentheses in: ' + t.slice(0, 80));
}

function splitTopLevel(text) {
  const out = [];
  let cur = '';
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      cur += ch;
      if (ch === "'") {
        if (text[i + 1] === "'") {
          cur += text[i + 1];
          i++;
        } else inStr = false;
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
      cur += ch;
    } else if (ch === '(') {
      depth++;
      cur += ch;
    } else if (ch === ')') {
      depth--;
      cur += ch;
    } else if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseValue(raw) {
  const v = raw.trim();
  if (v === 'NULL') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (v === 'v_prod') return { prodRef: true };
  if (v.startsWith('v_cat_')) return { catRef: v };
  if (v.startsWith('v_seller_')) return { sellerRef: v };
  if (v === 'gen_random_uuid()') return { generated: true };
  throw new Error('Cannot parse SQL value: ' + v.slice(0, 60));
}

// ---------- Parse the seed file ----------
const sql = await readFile(new URL('../supabase/seed/seed-catalogue.sql', import.meta.url), 'utf-8');

const catRefs = new Map();
for (const m of sql.matchAll(/SELECT id INTO (v_cat_\w+) FROM categories WHERE slug = '([^']+)'/g)) {
  catRefs.set(m[1], m[2]);
}
const sellerRefs = new Map();
for (const m of sql.matchAll(/SELECT id INTO (v_seller_\w+) FROM sellers WHERE slug = '([^']+)'/g)) {
  sellerRefs.set(m[1], m[2]);
}

const subcategories = [];
for (const m of sql.matchAll(
  /INSERT INTO categories \(name, slug, description, parent_id, sort_order, is_active\)\s*SELECT\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*id,\s*(\d+),\s*true\s*FROM categories WHERE slug = '([^']+)'/g
)) {
  subcategories.push({
    name: m[1].replace(/''/g, "'"),
    slug: m[2],
    description: m[3].replace(/''/g, "'"),
    sortOrder: Number(m[4]),
    parentSlug: m[5],
  });
}

const products = [];
const blockRe = /IF NOT EXISTS \(SELECT 1 FROM products WHERE slug = '([^']+)'\) THEN([\s\S]*?)END IF;/g;
for (const block of sql.matchAll(blockRe)) {
  const slug = block[1];
  const body = block[2];

  const prodMatch = body.match(/INSERT INTO products \(([^)]*)\)\s*VALUES\s*([\s\S]*?)\s*RETURNING id INTO v_prod;/);
  if (!prodMatch) throw new Error('No products INSERT in block for ' + slug);
  const values = splitTopLevel(unwrapParens(prodMatch[2])).map(parseValue);

  const images = [];
  const imgRe = /INSERT INTO product_images \(([^)]*)\)\s*VALUES\s*([\s\S]*?);/g;
  for (const im of body.matchAll(imgRe)) {
    const groups = splitTopLevel(im[2]);
    for (const g of groups) {
      const vals = splitTopLevel(unwrapParens(g)).map(parseValue);
      // (v_prod, url, alt_text, sort_order, is_primary)
      images.push({
        url: vals[1],
        alt_text: vals[2],
        sort_order: vals[3],
        is_primary: vals[4],
      });
    }
  }

  let inventory = null;
  const invMatch = body.match(/INSERT INTO inventory \(([^)]*)\)\s*VALUES\s*([\s\S]*?);/);
  if (invMatch) {
    const vals = splitTopLevel(unwrapParens(invMatch[2])).map(parseValue);
    // (v_prod, quantity, reserved_quantity, low_stock_threshold)
    inventory = { quantity: vals[1], reserved_quantity: vals[2], low_stock_threshold: vals[3] };
  }

  // products columns: id, name, slug, description, short_description, brand,
  // base_price, compare_at_price, category_id, seller_id, status, currency,
  // is_featured, rating_average, review_count
  products.push({
    slug,
    name: values[1],
    description: values[3],
    short_description: values[4],
    brand: values[5],
    base_price: values[6],
    compare_at_price: values[7],
    categoryRef: values[8]?.catRef ?? null,
    sellerRef: values[9]?.sellerRef ?? null,
    status: values[10],
    currency: values[11],
    is_featured: values[12],
    rating_average: values[13],
    review_count: values[14],
    images,
    inventory,
  });
}

console.log(
  `Parsed ${products.length} products, ${subcategories.length} subcategories, ` +
    `${catRefs.size} category refs, ${sellerRefs.size} seller refs.`
);

// ---------- Apply ----------
async function fetchMap(table, slugCol) {
  const { data, error } = await sb.from(table).select(`id, ${slugCol}`);
  if (error) throw new Error(`${table} fetch failed: ${error.message}`);
  return new Map(data.map((r) => [r[slugCol], r.id]));
}

const categoryMap = await fetchMap('categories', 'slug');
const sellerMap = await fetchMap('sellers', 'slug');

let createdSubs = 0;
for (const sub of subcategories) {
  if (categoryMap.has(sub.slug)) continue;
  const parentId = categoryMap.get(sub.parentSlug);
  if (!parentId) {
    console.warn(`⚠ Parent category '${sub.parentSlug}' missing; skipping subcategory '${sub.slug}'`);
    continue;
  }
  const { error } = await sb.from('categories').insert({
    name: sub.name,
    slug: sub.slug,
    description: sub.description,
    parent_id: parentId,
    sort_order: sub.sortOrder,
    is_active: true,
  });
  if (error) throw new Error(`Subcategory '${sub.slug}' insert failed: ${error.message}`);
  categoryMap.set(sub.slug, sub.name); // placeholder; re-fetch below
  createdSubs++;
}
if (createdSubs > 0) {
  // re-fetch to get real ids of newly created subcategories
  const { data } = await sb.from('categories').select('id, slug');
  data.forEach((r) => categoryMap.set(r.slug, r.id));
}

let inserted = 0;
let skipped = 0;
let failed = 0;

for (const p of products) {
  const existing = await sb.from('products').select('id').eq('slug', p.slug).maybeSingle();
  if (existing.data) {
    skipped++;
    continue;
  }
  const categoryId = p.categoryRef ? categoryMap.get(catRefs.get(p.categoryRef)) ?? null : null;
  const sellerId = p.sellerRef ? sellerMap.get(sellerRefs.get(p.sellerRef)) : null;
  if (!sellerId) {
    console.warn(`⚠ Seller ref '${p.sellerRef}' (${sellerRefs.get(p.sellerRef)}) unresolved; skipping '${p.slug}'`);
    failed++;
    continue;
  }
  if (p.categoryRef && !categoryId) {
    console.warn(`⚠ Category ref '${p.categoryRef}' (${catRefs.get(p.categoryRef)}) unresolved; skipping '${p.slug}'`);
    failed++;
    continue;
  }

  const { data: created, error } = await sb
    .from('products')
    .insert({
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      brand: p.brand,
      base_price: p.base_price,
      compare_at_price: p.compare_at_price,
      category_id: categoryId,
      seller_id: sellerId,
      status: p.status,
      currency: p.currency,
      is_featured: p.is_featured,
      rating_average: p.rating_average,
      review_count: p.review_count,
    })
    .select('id')
    .single();
  if (error || !created) {
    console.warn(`⚠ Insert failed for '${p.slug}': ${error?.message}`);
    failed++;
    continue;
  }

  const productId = created.id;
  if (p.images.length > 0) {
    const { error: imgErr } = await sb.from('product_images').insert(
      p.images.map((img) => ({ ...img, product_id: productId }))
    );
    if (imgErr) throw new Error(`Images failed for '${p.slug}': ${imgErr.message}`);
  }
  if (p.inventory) {
    const { error: invErr } = await sb.from('inventory').insert({
      product_id: productId,
      quantity: p.inventory.quantity,
      reserved_quantity: p.inventory.reserved_quantity,
      low_stock_threshold: p.inventory.low_stock_threshold,
    });
    if (invErr) throw new Error(`Inventory failed for '${p.slug}': ${invErr.message}`);
  }
  inserted++;
}

console.log(`\nDone. Subcategories created: ${createdSubs}, products inserted: ${inserted}, skipped: ${skipped}, failed: ${failed}.`);

const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
const { count: imgCount } = await sb.from('product_images').select('*', { count: 'exact', head: true });
const { count: invCount } = await sb.from('inventory').select('*', { count: 'exact', head: true });
console.log(`DB totals → products: ${count}, images: ${imgCount}, inventory: ${invCount}.`);