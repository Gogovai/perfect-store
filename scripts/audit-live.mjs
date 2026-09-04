// Read-only(ish) production audit against the connected Supabase project.
//
// Checks:
//   1. Public schema dump (tables + RPCs exposed via PostgREST OpenAPI)
//   2. Storefront visibility with the anon key
//   3. Existence of privileged RPCs (via service-role error messages)
//   4. Data presence/counts (service role)
//   5. Registration -> immediate login flow (creates a throwaway user,
//      then deletes it via the admin API so no data is left behind)
//
// Usage:
//   node scripts/audit-live.mjs
// (dotenv loads .env.local automatically.)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY');
  process.exit(1);
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

const out = (label, value) => console.log(`${label.padEnd(46)} ${value}`);

console.log('=== 1. COLUMN PROBES (service role; selects a known set of columns) ===');
const probes = [
  ['profiles', ['id','role','is_active','email','first_name','last_name','phone','avatar_url']],
  ['sellers', ['id','owner_id','store_name','slug','status','commission_rate','email']],
  ['products', ['id','seller_id','category_id','name','slug','status','base_price','rating_average','review_count']],
  ['orders', ['id','order_number','customer_id','status','total_amount','subtotal','shipping_fee','discount_amount','delivery_method','delivery_method_name','notes','shipping_address','placed_at']],
  ['payments', ['id','order_id','provider','provider_reference','status','amount','currency','paid_at','metadata']],
  ['coupons', ['id','code','description','discount_type','discount_value','minimum_order_amount','maximum_discount_amount','usage_limit','used_count','starts_at','expires_at','is_active']],
  ['audit_logs', ['id','actor_id','action','entity_type','entity_id','old_data','new_data']],
  ['support_tickets', ['id','customer_id','seller_id','subject','category','priority','status','order_id','assigned_to']],
  ['support_messages', ['id','ticket_id','sender_id','message','internal_note']],
  ['returns', ['id','order_id','customer_id','status','reason_code','reason','customer_notes']],
  ['return_items', ['id','return_id','order_item_id','quantity','condition','resolution']],
  ['inventory', ['product_id','quantity','reserved_quantity','low_stock_threshold']],
  ['variant_inventory', ['variant_id','quantity','reserved_quantity']],
  ['notifications', ['id','user_id','type','title','message','data','read_at']],
  ['reviews', ['id','product_id','customer_id','order_item_id','rating','title','body','is_published','is_verified_purchase']],
];
for (const [table, cols] of probes) {
  const { data, error } = await svc.from(table).select(cols.join(',')).limit(1);
  if (error) {
    out(`columns(${table})`, `ERROR: ${error.message.slice(0, 120)}`);
  } else {
    out(`columns(${table})`, `ok (${data.length ? 'row present' : 'empty table'})`);
  }
}

console.log('\n=== 1b. LEGACY COLUMN GUARDS (old names must NOT exist) ===');
// Regression guards: repo code used to target these columns; a live DB that
// still has them (or code that reintroduces them) should fail loudly.
const legacyCols = {
  coupons: ['valid_from', 'valid_until', 'max_uses', 'current_uses'],
  audit_logs: ['user_id', 'changes'],
  notifications: ['is_read'],
};
for (const [table, cols] of Object.entries(legacyCols)) {
  for (const col of cols) {
    const { error } = await svc.from(table).select(col).limit(1);
    const gone = !!error && /does not exist/.test(error.message);
    out(`legacy ${table}.${col}`, gone ? 'absent (good)' : `PRESENT — repo must not use it`);
  }
}

console.log('\n=== 2. STOREFRONT VISIBILITY (anon key) ===');
const vis = [
  ['products (anon)', anon.from('products').select('id').limit(1)],
  ['sellers (anon)', anon.from('sellers').select('id').limit(1)],
  ['categories (anon)', anon.from('categories').select('id').limit(1)],
  ['product_images (anon)', anon.from('product_images').select('id').limit(1)],
  ['reviews (anon)', anon.from('reviews').select('id').limit(1)],
];
for (const [label, q] of vis) {
  const { data, error } = await q;
  out(label, error ? `ERROR: ${error.message}` : `ok (${data.length} row(s))`);
}

console.log('\n=== 3. RPC EXISTENCE (service role; error text reveals presence) ===');
const rpcs = [
  ['admin_set_seller_status', { p_seller_id: '00000000-0000-0000-0000-000000000000', p_status: 'active' }],
  ['admin_set_order_status', { p_order_id: '00000000-0000-0000-0000-000000000000', p_status: 'pending' }],
  ['create_order', { p_address_id: '00000000-0000-0000-0000-000000000000', p_delivery_method: 'standard' }],
  ['cancel_order', { p_order_id: '00000000-0000-0000-0000-000000000000' }],
  ['submit_seller_application', { p_store_name: 'x', p_description: null, p_phone: null, p_email: null }],
  ['submit_product_review', { p_product_id: '00000000-0000-0000-0000-000000000000', p_order_item_id: '00000000-0000-0000-0000-000000000000', p_rating: 5, p_title: 'x', p_body: 'x' }],
  ['validate_coupon', { p_code: 'NOPE', p_order_amount: 100 }],
  ['get_product_available_quantity', { p_product_id: '00000000-0000-0000-0000-000000000000' }],
  ['request_order_return', { p_order_id: '00000000-0000-0000-0000-000000000000', p_reason_code: 'x' }],
  ['refresh_seller_daily_metrics', { p_seller_id: '00000000-0000-0000-0000-000000000000', p_metric_date: '2026-01-01' }],
];
for (const [name, args] of rpcs) {
  const { error } = await svc.rpc(name, args);
  const msg = error?.message ?? 'no error';
  const exists = !msg.includes('Could not find the function') && !msg.includes('PGRST202');
  out(`rpc(${name})`, exists ? `EXISTS (${msg.slice(0, 60)})` : `MISSING`);
}

console.log('\n=== 4. DATA COUNTS (service role) ===');
const counts = [
  ['profiles', svc.from('profiles').select('id', { count: 'exact', head: true })],
  ['profiles.role=admin', svc.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')],
  ['profiles.role=seller', svc.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller')],
  ['profiles.role=customer', svc.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer')],
  ['sellers', svc.from('sellers').select('id', { count: 'exact', head: true })],
  ['sellers.active', svc.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'active')],
  ['products', svc.from('products').select('id', { count: 'exact', head: true })],
  ['products.active', svc.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active')],
  ['products.pending_review', svc.from('products').select('id', { count: 'exact', head: true }).eq('status', 'pending_review')],
  ['categories', svc.from('categories').select('id', { count: 'exact', head: true })],
  ['orders', svc.from('orders').select('id', { count: 'exact', head: true })],
  ['orders.pending', svc.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')],
  ['payments', svc.from('payments').select('id', { count: 'exact', head: true })],
  ['cart_items', svc.from('cart_items').select('id', { count: 'exact', head: true })],
  ['inventory rows', svc.from('inventory').select('product_id', { count: 'exact', head: true })],
  ['reviews', svc.from('reviews').select('id', { count: 'exact', head: true })],
  ['support_tickets', svc.from('support_tickets').select('id', { count: 'exact', head: true })],
  ['returns', svc.from('returns').select('id', { count: 'exact', head: true })],
  ['notifications', svc.from('notifications').select('id', { count: 'exact', head: true })],
];
for (const [label, q] of counts) {
  const { count, error } = await q;
  out(`count(${label})`, error ? `ERROR: ${error.message}` : String(count ?? 0));
}

console.log('\n=== 4b. RLS RECURSION CHECK (order tables must be readable) ===');
const rlsTests = [
  ['orders (anon)', anon.from('orders').select('id').limit(1)],
  ['order_items (anon)', anon.from('order_items').select('id').limit(1)],
  ['payments (anon)', anon.from('payments').select('id').limit(1)],
  ['shipments (anon)', anon.from('shipments').select('id').limit(1)],
  ['orders (svc)', svc.from('orders').select('id').limit(1)],
  ['shipments (svc)', svc.from('shipments').select('id').limit(1)],
];
for (const [label, q] of rlsTests) {
  const { error } = await q;
  const msg = error?.message ?? 'ok';
  const ok = !msg.includes('infinite recursion') && !msg.includes('permission denied');
  out(`rls(${label})`, ok ? 'ok' : `PROBLEM: ${msg.slice(0, 70)}`);
}

console.log('\n=== 4c. KEY COLUMN PROBES (service role) ===');
const colProbes = [
  ['coupons', ['code','discount_type','discount_value','minimum_order_amount','maximum_discount_amount','usage_limit','used_count','starts_at','expires_at']],
  ['audit_logs', ['actor_id','action','entity_type','entity_id','old_data','new_data']],
  ['notifications', ['user_id','type','title','message','data','read_at']],
  ['seller_order_groups', ['order_id','seller_id','status']],
];
for (const [table, cols] of colProbes) {
  const bad = [];
  for (const col of cols) {
    const { error } = await svc.from(table).select(col).limit(1);
    if (error && /does not exist/.test(error.message)) bad.push(col);
  }
  out(`columns(${table})`, bad.length ? `MISMATCH: ${bad.join(', ')}` : 'ok');
}

console.log('\n=== 5. REGISTRATION -> IMMEDIATE LOGIN (throwaway user, deleted after) ===');
const email = `audit-${Date.now()}@example.com`;
const password = 'AuditTest!234';
const { data: signedUp, error: signUpError } = await anon.auth.signUp({
  email,
  password,
  options: { data: { first_name: 'Audit', last_name: 'Temp' } },
});
if (signUpError) {
  out('signup', `ERROR: ${signUpError.message}`);
} else {
  out('signup', `ok (user ${signedUp.user?.id})`);
  const { data: signedIn, error: loginError } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  out('immediate login', loginError ? `FAILED: ${loginError.message}` : `ok (user ${signedIn.user?.id})`);
  // Clean up the throwaway user.
  if (signedUp.user?.id) {
    const { error: delError } = await svc.auth.admin.deleteUser(signedUp.user.id);
    out('cleanup delete', delError ? `ERROR: ${delError.message}` : 'ok');
  }
}

console.log('\nAudit complete.');