import 'dotenv/config';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.E2E_BASE_URL || 'https://perfect-store-mu.vercel.app';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const now = Date.now();
const PASSWORD = 'DebugPass!234';
const CUST = `e2e-dbg-${now}@example.com`;
const email = CUST;

async function main() {
  const { data: su } = await anon.auth.signUp({ email, password: PASSWORD, options: { data: { first_name: 'Dbg', last_name: 'Cust' } } });
  const custId = su.user.id;
  const { data: cat } = await svc.from('categories').select('id').limit(1).maybeSingle();
  const { data: sell } = await svc.from('sellers').select('id').eq('status', 'active').limit(1).maybeSingle();
  const { data: p } = await svc.from('products').insert({
    name: `DBG Prod ${now}`, slug: `dbg-prod-${now}`, description: 'x', short_description: 'x',
    brand: 'DBG', base_price: 60, category_id: cat?.id ?? null, seller_id: sell?.id,
    status: 'active', currency: 'GHS', is_featured: false, rating_average: 0, review_count: 0,
  }).select('id').single();
  await svc.from('inventory').insert({ product_id: p.id, quantity: 5, reserved_quantity: 0, low_stock_threshold: 1 });
  await svc.from('addresses').insert({
    user_id: custId, label: 'Home', recipient_name: 'Dbg', phone: '+233501234567',
    address_line1: '1 Test Rd', city: 'Accra', region: 'Greater Accra', country: 'Ghana', is_default: true,
  });
  const { data: cart } = await svc.from('carts').insert({ user_id: custId, currency: 'GHS' }).select('id').single();
  await svc.from('cart_items').insert({ cart_id: cart.id, product_id: p.id, quantity: 1, unit_price: 60 });

  const chrome = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome'].find((x) => existsSync(x));
  const browser = await puppeteer.launch({ headless: true, executablePath: chrome, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const consoleMsgs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleMsgs.push(m.text()); });
  page.on('pageerror', (e) => consoleMsgs.push('PAGEERROR: ' + e.message));

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', PASSWORD);
  await page.evaluate(() => {
    const f = [...document.querySelectorAll('form')].find((x) => x.querySelector('input[name="password"]'));
    const b = [...f.querySelectorAll('button')].filter((x) => x.type !== 'button').pop() || f.querySelector('button');
    b.click();
  });
  await sleep(4000);
  console.log('URL after login:', await page.evaluate(() => window.location.href));

  // Replicate validateCheckout server reads with a customer session to find RLS gaps
  {
    const { data: si } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
    const s = createClient(url, anonKey, { auth: { persistSession: false } });
    await s.auth.setSession({ access_token: si.session.access_token, refresh_token: si.session.refresh_token });
    const cAll = await s.from('carts').select('id,created_at').eq('user_id', si.user.id);
    console.log('all carts for user:', cAll.error ? 'ERR ' + cAll.error.message : JSON.stringify(cAll.data));
    const c1 = await s.from('carts').select('id').eq('user_id', si.user.id).single();
    console.log('cart read:', c1.error ? 'ERR ' + c1.error.message : 'ok ' + c1.data?.id);
    if (c1.data) {
      const c2 = await s.from('cart_items').select('id,quantity').eq('cart_id', c1.data.id);
      console.log('cart_items read:', c2.error ? 'ERR ' + c2.error.message : 'ok ' + (c2.data?.length || 0) + ' rows');
      const c3 = await s.from('cart_items').select('id,quantity,products!inner(id,name)').eq('cart_id', c1.data.id);
      console.log('cart_items join products:', c3.error ? 'ERR ' + c3.error.message : 'ok ' + (c3.data?.length || 0) + ' rows');
    }
    const a = await s.from('addresses').select('id').eq('user_id', si.user.id);
    console.log('addresses read:', a.error ? 'ERR ' + a.error.message : 'ok ' + (a.data?.length || 0) + ' rows');
  }

  // Drive the REAL path: open a live storefront product, add it to the cart
  await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(5000);
  const slug = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/products/"]');
    return a ? a.getAttribute('href').split('/products/')[1] : null;
  });
  console.log('first product slug from /products:', slug);
  if (!slug) {
    const pt = await page.evaluate(() => document.body.innerText.slice(0, 600));
    console.log('--- logged-in /products body ---\n' + pt + '\n---');
    const u2 = await page.evaluate(() => window.location.href);
    console.log('URL:', u2);
  }
  if (slug) {
    await page.goto(`${BASE_URL}/products/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await sleep(5000);
    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 700));
    const addBtn = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Add to Cart'));
      if (b) { b.click(); return true; }
      return false;
    });
    console.log('clicked add-to-cart:', addBtn);
    console.log('--- product page body (700) ---\n' + pageText + '\n---');
    await sleep(6000);
    const added = await page.evaluate(() => document.body.innerText.includes('Added to Cart'));
    console.log('added feedback:', added);
  }

  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(9000);
  console.log('URL at checkout:', await page.evaluate(() => window.location.href));
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('--- checkout body ---\n' + bodyText + '\n---');
  const placeBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Place Order');
    return b ? { found: true, disabled: b.disabled } : { found: false };
  });
  console.log('Place Order button:', JSON.stringify(placeBtn));
  const addressSelected = await page.evaluate(() => document.body.innerText.includes('Home') || document.body.innerText.includes('Test Rd'));
  console.log('address visible:', addressSelected);
  const itemsVisible = await page.evaluate(() => document.body.innerText.includes('DBG Prod'));
  console.log('cart item visible:', itemsVisible);
  const errText = await page.evaluate(() => {
    const t = document.body.innerText;
    const m = t.match(/[^\n]*(error|unavailable|failed|unable|couldn|alert)[^\n]*/i);
    return m ? m[0] : null;
  });
  console.log('any error text:', errText);

  if (placeBtn.found && !placeBtn.disabled) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Place Order');
      b.click();
    });
    await sleep(9000);
    console.log('URL after click:', await page.evaluate(() => window.location.href));
    const postErr = await page.evaluate(() => {
      const t = document.body.innerText;
      const m = t.match(/[^\n]*(couldn|error|unavailable|unable|alert|review)[^\n]*/i);
      return m ? m[0].slice(0, 300) : null;
    });
    console.log('post-click error text:', postErr);
    const snippet = await page.evaluate(() => document.body.innerText.slice(0, 900));
    console.log('--- body snippet ---\n' + snippet);
  }
  console.log('console errors:', consoleMsgs.slice(0, 8));
  await browser.close();

  // cleanup this debug run
  const { data: carts } = await svc.from('carts').select('id').eq('user_id', custId);
  for (const c of carts || []) { await svc.from('cart_items').delete().eq('cart_id', c.id); await svc.from('carts').delete().eq('id', c.id); }
  await svc.from('addresses').delete().eq('user_id', custId);
  await svc.from('inventory').delete().eq('product_id', p.id);
  await svc.from('products').delete().eq('id', p.id);
  await svc.from('notifications').delete().eq('user_id', custId);
  await svc.from('profiles').delete().eq('id', custId);
  await svc.auth.admin.deleteUser(custId);
  process.exit(0);
}
main().catch((e) => { console.error('probe error:', e); process.exit(1); });
