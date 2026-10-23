// Read-only audit of the single-store clothing shop's live Supabase schema.
// This script never creates, updates, or deletes production records.
// Usage: node scripts/audit-live.mjs (loads .env.local via dotenv).
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const results = [];

function report(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'CHECK'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function probe(table, columns) {
  const { error } = await admin.from(table).select(columns).limit(1);
  report(`schema: ${table}`, !error, error?.message ?? 'columns accessible');
}

console.log('=== Store schema checks (read-only) ===');
await probe('profiles', 'id,role,is_active,first_name,last_name,phone,avatar_url');
await probe('categories', 'id,name,slug,is_active,parent_id');
await probe('products', 'id,category_id,name,slug,status,base_price,compare_at_price,currency');
await probe('product_images', 'id,product_id,url,is_primary');
await probe('product_variants', 'id,product_id,name,price,is_active');
await probe('inventory', 'product_id,quantity,reserved_quantity');
await probe('carts', 'id,user_id,currency');
await probe('cart_items', 'id,cart_id,product_id,variant_id,quantity');
await probe('addresses', 'id,user_id,recipient_name,phone,address_line1,city,region,country');
await probe('orders', 'id,order_number,customer_id,status,total_amount,currency,shipping_address');
await probe('order_items', 'id,order_id,product_id,product_name,quantity,total_price');
await probe('payments', 'id,order_id,provider,provider_reference,status,amount,currency,paid_at,metadata');
await probe('returns', 'id,order_id,customer_id,status,reason_code');
await probe('reviews', 'id,product_id,customer_id,rating,is_published');
await probe('support_tickets', 'id,customer_id,subject,status,order_id');
await probe('notifications', 'id,user_id,type,title,read_at');

console.log('\n=== Storefront public visibility ===');
for (const [name, table] of [
  ['public products', 'products'],
  ['public categories', 'categories'],
  ['public product images', 'product_images'],
]) {
  const { error } = await anon.from(table).select('id').limit(1);
  report(name, !error, error?.message ?? 'anonymous read permitted');
}

console.log('\n=== Clothing catalogue and payment configuration ===');
const { data: categories, error: categoryError } = await admin
  .from('categories')
  .select('id,name,slug')
  .eq('is_active', true);
if (categoryError) {
  report('active categories query', false, categoryError.message);
} else {
  const clothing = (categories ?? []).filter((category) =>
    /fashion|clothing|apparel|menswear|womenswear|men[' -]?s|women[' -]?s|footwear|shoes|accessor|bags|traditional|ankara/i.test(`${category.name} ${category.slug}`)
  );
  report('active clothing categories', clothing.length > 0, `${clothing.length} matching category/categories`);
  const ids = clothing.map((category) => category.id);
  if (ids.length) {
    const { count, error } = await admin.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active').in('category_id', ids);
    report('active clothing products', !error && (count ?? 0) > 0, error?.message ?? `${count ?? 0} active product(s)`);
  } else {
    report('active clothing products', false, 'Add clothing categories before publishing products.');
  }
}
report('Hubtel credentials configured', Boolean(process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET && process.env.HUBTEL_MERCHANT_ACCOUNT_ID));
report('store contact details configured', Boolean(process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL || process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE));

const failed = results.filter((item) => !item.ok);
console.log(`\nAudit complete: ${results.length - failed.length} passed, ${failed.length} checks need attention.`);
if (failed.length) process.exitCode = 1;
