// Browser-driven order-lifecycle E2E for Perfect Store.
//
// Covers the order path the production audit rewired and hardened:
//   1. UI checkout (real create_order server path) for a TWO-SELLER order
//   2. Per-seller fulfilment via the /seller/orders console — each seller can
//      only advance their own seller_order_groups row; the aggregate order
//      status must NOT reach 'delivered' until EVERY seller's group has
//      delivered (and one seller can never cancel/refund the whole order)
//   3. Admin whole-order status change (admin_set_order_status) from
//      /admin/dashboard, with audit-log + notification side effects
//
// Every stage is verified in the database through the service-role key, and
// all seeded rows are removed afterwards (dependency-ordered cleanup).
//
// Usage:
//   E2E_BASE_URL=https://perfect-store-mu.vercel.app node scripts/order-lifecycle-e2e.mjs
// Requires .env.local with the live Supabase credentials and puppeteer-core.
import 'dotenv/config';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.E2E_BASE_URL || 'https://perfect-store-mu.vercel.app';
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, ms = 30000, step = 500) {
  const start = Date.now();
  let last;
  while (Date.now() - start < ms) {
    last = await fn();
    if (last) return last;
    await sleep(step);
  }
  return last;
}
async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: 90000 });
}
async function fill(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, value);
}
async function bodyHas(page, text) {
  return page.evaluate((t) => document.body.innerText.includes(t), text);
}
async function waitForText(page, text, ms = 30000) {
  return poll(() => bodyHas(page, text), ms, 400);
}
async function waitUrl(page, fragment, ms = 30000) {
  return poll(async () => {
    const href = await page.evaluate(() => window.location.href);
    return href.includes(fragment);
  }, ms, 400);
}

async function submitAuthForm(page) {
  await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')];
    const form = forms.find((f) =>
      ['email', 'password'].some((n) => f.querySelector(`input[name="${n}"]`))
    );
    if (!form) return;
    const btns = [...form.querySelectorAll('button')].filter((b) => b.type !== 'button');
    const btn = btns.length ? btns[btns.length - 1] : form.querySelector('button');
    if (btn) btn.click();
  });
}
async function login(page, email, password) {
  await goto(page, '/login');
  await fill(page, 'input[name="email"]', email);
  await fill(page, 'input[name="password"]', password);
  await submitAuthForm(page);
}

// Set a React-controlled <select> value the way a user would.
async function setSelectValue(page, rowOrderNumber, value) {
  return page.evaluate(
    ({ rowOrderNumber, value }) => {
      const rows = [...document.querySelectorAll('select')];
      for (const sel of rows) {
        // the row is the nearest ancestor that also shows the order number
        let el = sel.parentElement;
        while (el && el !== document.body && !el.textContent.includes(rowOrderNumber)) {
          el = el.parentElement;
        }
        if (!el || el === document.body) continue;
        const proto = HTMLSelectElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(sel, value);
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    },
    { rowOrderNumber, value }
  );
}

async function currentSelectValue(page, rowOrderNumber) {
  return page.evaluate((n) => {
    const sels = [...document.querySelectorAll('select')];
    for (const sel of sels) {
      let el = sel.parentElement;
      while (el && el !== document.body && !el.textContent.includes(n)) {
        el = el.parentElement;
      }
      if (el && el !== document.body) return sel.value;
    }
    return null;
  }, rowOrderNumber);
}

// --- DB helpers (service role) ---
const dbOrder = async (id) => {
  const { data, error } = await svc.from('orders').select('*').eq('id', id).single();
  if (error) throw new Error(`orders read: ${error.message}`);
  return data;
};
const dbGroups = async (id) => {
  const { data, error } = await svc.from('seller_order_groups').select('seller_id,status,subtotal').eq('order_id', id);
  if (error) throw new Error(`groups read: ${error.message}`);
  return data;
};
const dbGroupStatus = async (id, sellerId) => {
  const { data, error } = await svc
    .from('seller_order_groups').select('status').eq('order_id', id).eq('seller_id', sellerId).single();
  if (error) throw new Error(`group read: ${error.message}`);
  return data.status;
};
const dbShipments = async (id) => {
  const { data, error } = await svc.from('shipments').select('seller_id,status,shipped_at,delivered_at').eq('order_id', id);
  if (error) throw new Error(`shipments read: ${error.message}`);
  return data;
};
const dbItems = async (id) => {
  const { data, error } = await svc.from('order_items').select('seller_id,product_name,quantity,total_price').eq('order_id', id);
  if (error) throw new Error(`items read: ${error.message}`);
  return data;
};
const dbNotifications = async (userId, type) => {
  let q = svc.from('notifications').select('title,message').eq('user_id', userId).order('created_at', { ascending: false });
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw new Error(`notifications read: ${error.message}`);
  return data;
};

// --- test data ---
const now = Date.now();
const PASSWORD = 'Lifecycle!234';
const CUST = { email: `e2e-lc-cust-${now}@example.com`, password: PASSWORD };
const ADMA = { email: `e2e-lc-admin-${now}@example.com`, password: PASSWORD };
const SA = { email: `e2e-lc-sa-${now}@example.com`, password: PASSWORD };
const SB = { email: `e2e-lc-sb-${now}@example.com`, password: PASSWORD };
const storeA = `E2E Fulfil A ${now}`;
const storeB = `E2E Fulfil B ${now}`;
const prodA = `E2E Prod A ${now}`;
const prodB = `E2E Prod B ${now}`;
const prodC = `E2E Prod C ${now}`;

const created = { users: [], sellerAId: null, sellerBId: null, products: [], orders: [], addressId: null, cartIds: [] };

async function signup(email) {
  const { data, error } = await anon.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { first_name: 'E2E', last_name: 'Lifecycle' } },
  });
  if (error) throw new Error(`signUp ${email}: ${error.message}`);
  created.users.push({ email, userId: data.user.id });
  return data.user.id;
}

async function loginSession(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return data.session;
}

async function seed() {
  const adminId = await signup(ADMA.email);
  const { error: ar } = await svc.from('profiles').update({ role: 'admin' }).eq('id', adminId);
  if (ar) throw new Error(`admin role: ${ar.message}`);

  // Two active sellers
  const custId = await signup(CUST.email);
  const ownerA = await signup(SA.email);
  const ownerB = await signup(SB.email);
  for (const o of [ownerA, ownerB]) {
    const { error: pr } = await svc.from('profiles').update({ role: 'seller' }).eq('id', o);
    if (pr) throw new Error(`seller role: ${pr.message}`);
  }
  const { data: sellerA } = await svc.from('sellers').insert({
    owner_id: ownerA, store_name: storeA, slug: `e2e-fulfil-a-${now}`,
    email: SA.email, status: 'active', commission_rate: 10,
  }).select('id').single();
  created.sellerAId = sellerA.id;
  const { data: sellerB } = await svc.from('sellers').insert({
    owner_id: ownerB, store_name: storeB, slug: `e2e-fulfil-b-${now}`,
    email: SB.email, status: 'active', commission_rate: 10,
  }).select('id').single();
  created.sellerBId = sellerB.id;

  // One product per seller + one for the admin-cancel order
  const { data: cat } = await svc.from('categories').select('id').limit(1).maybeSingle();
  async function addProduct(name, slug, sellerId, price) {
    const { data: p } = await svc.from('products').insert({
      name, slug, description: 'E2E lifecycle product', short_description: 'E2E lifecycle',
      brand: 'E2E', base_price: price, compare_at_price: price + 5, category_id: cat?.id ?? null,
      seller_id: sellerId, status: 'active', currency: 'GHS', is_featured: false,
      rating_average: 0, review_count: 0,
    }).select('id').single();
    const { error: ie } = await svc.from('inventory').insert({
      product_id: p.id, quantity: 5, reserved_quantity: 0, low_stock_threshold: 1,
    });
    if (ie) throw new Error(`inventory: ${ie.message}`);
    created.products.push(p.id);
    return p.id;
  }
  const pa = await addProduct(prodA, `e2e-prod-a-${now}`, created.sellerAId, 60);
  const pb = await addProduct(prodB, `e2e-prod-b-${now}`, created.sellerBId, 90);
  const pc = await addProduct(prodC, `e2e-prod-c-${now}`, created.sellerBId, 30);

  // Customer: one address + a cart
  const { data: addr } = await svc.from('addresses').insert({
    user_id: custId, label: 'Home', recipient_name: 'E2E Customer', phone: '+233501234567',
    address_line1: '12 Test Street', city: 'Accra', region: 'Greater Accra',
    country: 'Ghana', postal_code: null, delivery_instructions: null, is_default: true,
  }).select('id').single();
  created.addressId = addr.id;

  const { data: cart } = await svc.from('carts').insert({ user_id: custId, currency: 'GHS' }).select('id').single();
  created.cartIds.push(cart.id);
  const { error: cae } = await svc.from('cart_items').insert([
    { cart_id: cart.id, product_id: pa, quantity: 1, unit_price: 60 },
    { cart_id: cart.id, product_id: pb, quantity: 1, unit_price: 90 },
  ]);
  if (cae) throw new Error(`cart_items: ${cae.message}`);

  return { custId, pa, pb, pc, cartId: cart.id };
}

async function main() {
  const seedData = await seed();

  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  if (!chrome) throw new Error('Chrome not found');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chrome,
    args: ['--no-first-run', '--disable-extensions', '--no-sandbox'],
  });

  let order1Id = null;
  let order1Number = null;
  let order2Id = null;
  let order2Number = null;
  const custId = created.users.find((u) => u.email === CUST.email).userId;
  const pushOrder = (id) => { if (id) created.orders.push(id); };

  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  try {
    // ================= UI CHECKOUT =================
    {
      await login(page, CUST.email, PASSWORD);
      const onCheckout = await waitUrl(page, '/', 30000);
      await goto(page, '/checkout');
      const placeBtn = await page
        .waitForFunction(
          () => {
            const b = [...document.querySelectorAll('button')].find((x) =>
              x.textContent.trim() === 'Place Order' && !x.disabled
            );
            return !!b;
          },
          { timeout: 45000 }
        )
        .then(() => true)
        .catch(() => false);
      if (placeBtn) {
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find(
            (x) => x.textContent.trim() === 'Place Order'
          );
          if (b) b.click();
        });
      }
      const success = placeBtn ? await waitUrl(page, '/success', 45000) : false;
      // order1 id from the URL
      if (success) {
        const m = await page.evaluate(() => window.location.pathname.match(/\/orders\/([0-9a-f-]{36})\/success/));      order1Id = m ? m[1] : null;
    }
    pushOrder(order1Id);
      const o1 = order1Id ? await dbOrder(order1Id) : null;
      order1Number = o1?.order_number ?? null;
      const okBase =
        o1 &&
        o1.status === 'pending' &&
        Number(o1.subtotal) === 150 &&
        Number(o1.shipping_fee) === 15 &&
        Number(o1.total_amount) === 165 &&
        o1.currency === 'GHS' &&
        o1.delivery_method === 'standard';
      const items = order1Id ? await dbItems(order1Id) : [];
      const itemSellers = [...new Set(items.map((i) => i.seller_id))].sort();
      const okItems = items.length === 2 && itemSellers.length === 2;
      const groups = order1Id ? await dbGroups(order1Id) : [];
      const okGroups =
        groups.length === 2 &&
        groups.every((g) => g.status === 'pending') &&
        groups.some((g) => g.seller_id === created.sellerAId && Number(g.subtotal) === 60) &&
        groups.some((g) => g.seller_id === created.sellerBId && Number(g.subtotal) === 90);
      const { data: pay } = order1Id
        ? await svc.from('payments').select('provider,status,amount').eq('order_id', order1Id).single().catch(() => ({ data: null }))
        : { data: null };
      const okPay = pay && pay.provider === 'cash_on_delivery' && Number(pay.amount) === 165;
      const notifs = custId ? await dbNotifications(custId, 'order_status') : [];
      record('1. UI checkout places 2-seller order', success && okBase && okItems && okGroups && okPay && notifs.length >= 1,
        `order=${order1Number} totals=${okBase} items2xSeller=${okItems} groups2xPending=${okGroups} codPay=${okPay}`);
    }

    // ============ CUSTOMER SEES ORDER ============
    {
      await goto(page, '/account/orders');
      const listed = order1Number ? await waitForText(page, order1Number, 30000) : false;
      const badge = listed ? await waitForText(page, 'Pending', 10000) : false;
      record('2. Customer order history lists order as Pending', listed && badge, `listed=${listed} badge=${badge}`);
    }

    // ============ GUARD RAILS (direct RPC, seller A) ============
    {
      const sess = await loginSession(SA.email);
      const s = createClient(url, anonKey, { auth: { persistSession: false } });
      s.auth.setSession(sess);
      const r1 = await s.rpc('seller_set_order_status', { p_order_id: order1Id, p_status: 'shipped' });
      const blockedShip = !!r1.error && r1.error.message.includes('must be processing before shipping');
      const r2 = await s.rpc('seller_set_order_status', { p_order_id: order1Id, p_status: 'cancelled' });
      const blockedCancel = !!r2.error && r2.error.message.includes('Invalid seller order status');
      const g = await dbGroupStatus(order1Id, created.sellerAId);
      const stillPending = g === 'pending';
      record('3. Seller cannot skip stages or cancel an order', blockedShip && blockedCancel && stillPending,
        `skip-shipped-blocked=${blockedShip} cancel-blocked=${blockedCancel} groupStillPending=${stillPending}`);
    }

    // ============ SELLER A CONSOLE + PER-SELLER PROGRESSION ============
    const advance = async (sellerEmail, orderId, orderNumber, stages, sellerLabel) => {
      const c = await browser.createBrowserContext();
      const p = await c.newPage();
      const out = {};
      await login(p, sellerEmail, PASSWORD);
      await waitUrl(p, '/', 30000);
      await goto(p, '/seller/orders');
      out.visible = orderNumber ? await waitForText(p, orderNumber, 30000) : false;
      out.otherHidden = !(await bodyHas(p, sellerLabel === 'A' ? prodB : prodA));
      for (const stage of stages) {
        const changed = await setSelectValue(p, orderNumber, stage);
        const dbOk = changed
          ? await poll(async () => {
              try { return (await dbGroupStatus(orderId, sellerLabel === 'A' ? created.sellerAId : created.sellerBId)) === stage; }
              catch { return false; }
            }, 25000)
          : false;
        const uiOk = dbOk
          ? await poll(async () => (await currentSelectValue(p, orderNumber)) === stage, 15000, 600)
          : false;
        out[stage] = dbOk && uiOk;
        if (!dbOk) break;
        await sleep(1200); // let the console reload between transitions
      }
      await c.close();
      return out;
    };

    const stages = ['confirmed', 'processing', 'shipped', 'out_for_delivery'];
    let aOut = null;
    let bOut = null;
    {
      aOut = await advance(SA.email, order1Id, order1Number, stages, 'A');
      const aOk = aOut.visible && aOut.otherHidden && stages.every((s) => aOut[s]);
      // A reached out_for_delivery; B is still pending → aggregate must not be delivered
      const aggAfterA = await dbOrder(order1Id);
      record('4. Seller A console: own order, own items only; advances to out_for_delivery', aOk,
        `visible=${aOut.visible} no-other-seller-items=${aOut.otherHidden} steps=${stages.filter((s) => aOut[s]).length}/${stages.length}`);
      record('4b. Order NOT delivered while seller B has not fulfilled', aggAfterA.status !== 'delivered',
        `order.status=${aggAfterA.status}`);
    }
    {
      bOut = await advance(SB.email, order1Id, order1Number, stages, 'B');
      const bOk = bOut.visible && bOut.otherHidden && stages.every((s) => bOut[s]);
      const agg = await dbOrder(order1Id);
      record('5. Seller B console: own order, own items only; advances to out_for_delivery', bOk && agg.status === 'out_for_delivery',
        `visible=${bOut.visible} no-other-seller-items=${bOut.otherHidden} steps=${stages.filter((s) => bOut[s]).length}/${stages.length} aggregate=${agg.status}`);
    }

    // ============ FINAL DELIVERY: A then B ============
    {
      const c = await browser.createBrowserContext();
      const p = await c.newPage();
      await login(p, SA.email, PASSWORD);
      await waitUrl(p, '/', 30000);
      await goto(p, '/seller/orders');
      await waitForText(p, order1Number, 30000);
      const changed = await setSelectValue(p, order1Number, 'delivered');
      const aDelivered = changed
        ? await poll(async () => (await dbGroupStatus(order1Id, created.sellerAId)) === 'delivered', 25000)
        : false;
      const aggMid = await dbOrder(order1Id);
      // B is out_for_delivery → aggregate must remain out_for_delivery
      const safe = aggMid.status === 'out_for_delivery';
      await c.close();
      record('6. Seller A delivers own portion; order stays out_for_delivery', aDelivered && safe,
        `groupA=delivered:${aDelivered} aggregate=${aggMid.status} (NOT delivered: ${safe})`);

      const c2 = await browser.createBrowserContext();
      const p2 = await c2.newPage();
      await login(p2, SB.email, PASSWORD);
      await waitUrl(p2, '/', 30000);
      await goto(p2, '/seller/orders');
      await waitForText(p2, order1Number, 30000);
      const changed2 = await setSelectValue(p2, order1Number, 'delivered');
      const bDelivered = changed2
        ? await poll(async () => (await dbGroupStatus(order1Id, created.sellerBId)) === 'delivered', 25000)
        : false;
      const aggEnd = await dbOrder(order1Id);
      const ships = await dbShipments(order1Id);
      const shipsOk =
        ships.length === 2 &&
        ships.every((s) => s.status === 'delivered' && !!s.delivered_at && !!s.shipped_at);
      const notifs = custId ? await dbNotifications(custId, 'order_status') : [];
      const notifOk = notifs.some((n) => n.message.includes('delivered'));
      await c2.close();
      record('7. Order delivered once ALL sellers delivered (sync + shipments + notify)', bDelivered && aggEnd.status === 'delivered' && shipsOk && notifOk,
        `aggregate=${aggEnd.status} shipments2xDelivered=${shipsOk} customerNotified=${notifOk}`);
    }

    // ============ CUSTOMER ORDER DETAIL UI ============
    {
      await goto(page, `/account/orders/${order1Id}`);
      const shown = await waitForText(page, 'Delivered', 30000);
      const tracking = await goto(page, `/account/orders/${order1Id}/tracking`);
      const shipShown = tracking ? await waitForText(page, 'delivered', 15000) : false;
      record('8. Customer order detail shows Delivered (+ tracking page renders)', shown && shipShown,
        `detail=${shown} tracking=${shipShown}`);
    }

    // ============ ORDER #2 (single seller B) for the admin flow ============
    {
      // seed a fresh cart and place through the same server RPC the app calls
      const sess = await loginSession(CUST.email);
      const s = createClient(url, anonKey, { auth: { persistSession: false } });
      s.auth.setSession(sess);
      const { data: cart2 } = await svc.from('carts').insert({ user_id: custId, currency: 'GHS' }).select('id').single();
      created.cartIds.push(cart2.id);
      const { error: cae } = await svc.from('cart_items').insert({ cart_id: cart2.id, product_id: seedData.pc, quantity: 1, unit_price: 30 });
      if (cae) throw new Error(`cart2 items: ${cae.message}`);
      const { data: rpc, error: re } = await s.rpc('create_order', { p_address_id: created.addressId, p_delivery_method: 'standard' });
      if (re) throw new Error(`create_order #2: ${re.message}`);
      order2Id = rpc.order_id;
      order2Number = rpc.order_number;
      pushOrder(order2Id);
      const o2 = await dbOrder(order2Id);
      const groups2 = await dbGroups(order2Id);
      const ok2 =
        o2.status === 'pending' &&
        groups2.length === 1 &&
        groups2[0].seller_id === created.sellerBId &&
        groups2[0].status === 'pending';
      record('9. Order #2 placed (single-seller, group row created)', ok2,
        `order=${order2Number} group=${ok2}`);
    }

    // ============ ADMIN WHOLE-ORDER STATUS CHANGE ============
    {
      const c = await browser.createBrowserContext();
      const p = await c.newPage();
      await login(p, ADMA.email, PASSWORD);
      const onDash = await waitUrl(p, '/admin/dashboard', 40000);
      const rowShown = onDash ? await waitForText(p, order2Number, 45000) : false;
      const changed = rowShown ? await setSelectValue(p, order2Number, 'cancelled') : false;
      const banner = changed ? await waitForText(p, 'Order marked cancelled.', 25000) : false;
      const db = banner
        ? await poll(async () => (await dbOrder(order2Id)).status === 'cancelled', 25000)
        : false;
      const { data: audit } = await svc
        .from('audit_logs')
        .select('action,old_data,new_data')
        .eq('entity_id', order2Id)
        .order('created_at', { ascending: false });
      const auditOk = (audit || []).some(
        (a) => a.action === 'order_status_updated' && a.new_data?.status === 'cancelled' && a.old_data?.status === 'pending'
      );
      const notifs = custId ? await dbNotifications(custId, 'order_status') : [];
      const notifOk = notifs.some((n) => n.message.includes('cancelled'));
      await c.close();
      record('10. Admin marks whole order cancelled (audit + notification)', rowShown && banner && db && auditOk && notifOk,
        `banner=${banner} db=cancelled:${db} audit=${auditOk} notified=${notifOk}`);
    }

    // ============ GUARD: seller A is not a party to order #2 ============
    {
      const sess = await loginSession(SA.email);
      const s = createClient(url, anonKey, { auth: { persistSession: false } });
      s.auth.setSession(sess);
      const { error } = await s.rpc('seller_set_order_status', { p_order_id: order2Id, p_status: 'confirmed' });
      const blocked = !!error && error.message.includes('Order not found');
      record('11. Non-party seller blocked from another seller\'s order', blocked,
        blocked ? `rpc error: ${error.message}` : 'seller reached another seller\'s order!');
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  return passed === results.length ? 0 : 1;
}

// --- cleanup (dependency order, loud on failure) ---
async function cleanup() {
  const problems = [];
  async function del(label, q) {
    try {
      const { error } = await q;
      if (error) problems.push(`${label}: ${error.message}`);
    } catch (e) {
      problems.push(`${label}: ${e.message}`);
    }
  }
  const custId = created.users.find((u) => u.email === CUST.email)?.userId;
  for (const oid of created.orders) {
    await del(`audit_logs(order ${oid})`, svc.from('audit_logs').delete().eq('entity_id', oid));
    await del(`payments(order ${oid})`, svc.from('payments').delete().eq('order_id', oid));
    await del(`shipments(order ${oid})`, svc.from('shipments').delete().eq('order_id', oid));
    await del(`order_items(order ${oid})`, svc.from('order_items').delete().eq('order_id', oid));
    await del(`orders(${oid})`, svc.from('orders').delete().eq('id', oid)); // cascades seller_order_groups
  }
  if (custId) {
    // carts/addresses before products (cart_items FK -> products)
    for (const cid of created.cartIds) {
      await del('cart_items', svc.from('cart_items').delete().eq('cart_id', cid));
      await del(`carts(${cid})`, svc.from('carts').delete().eq('id', cid));
    }
    await del('addresses', svc.from('addresses').delete().eq('user_id', custId));
  }
  for (const pid of created.products) {
    await del(`inventory(${pid})`, svc.from('inventory').delete().eq('product_id', pid));
    await del(`products(${pid})`, svc.from('products').delete().eq('id', pid));
  }
  for (const sid of [created.sellerAId, created.sellerBId]) {
    if (!sid) continue;
    await del(`audit_logs(seller ${sid})`, svc.from('audit_logs').delete().eq('entity_id', sid));
    await del('seller_business_profiles', svc.from('seller_business_profiles').delete().eq('seller_id', sid));
    await del(`sellers(${sid})`, svc.from('sellers').delete().eq('id', sid));
  }
  for (const u of created.users) {
    await del(`notifications(${u.email})`, svc.from('notifications').delete().eq('user_id', u.userId));
    await del(`profiles(${u.email})`, svc.from('profiles').delete().eq('id', u.userId));
    await del(`auth(${u.email})`, svc.auth.admin.deleteUser(u.userId));
  }
  if (problems.length) {
    console.error('\nCleanup left residual rows:');
    for (const p of problems) console.error('  -', p);
  }
}

main()
  .then((code) => {
    return cleanup().then(() => process.exit(code));
  })
  .catch(async (e) => {
    console.error('E2E harness error:', e.message);
    await cleanup();
    process.exit(1);
  });
