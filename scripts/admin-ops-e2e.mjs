// Browser-driven admin-operations E2E for Perfect Store.
// Exercises the /admin/dashboard moderation buttons (which PATCH the admin API
// routes rewired in the production audit) and the /admin/coupons form, then
// verifies each action's server-side effect (RPC role-flip, notifications,
// audit logs, status columns) through the service-role key.
//
// Usage:
//   E2E_BASE_URL=https://perfect-store-mu.vercel.app node scripts/admin-ops-e2e.mjs
// Requires .env.local with the live Supabase credentials (dotenv) and
// puppeteer-core (devDependency).
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

// --- tiny helpers ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function poll(fn, ms = 25000, step = 500) {
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

async function waitHome(page, ms = 20000) {
  return poll(async () => {
    const p = await page.evaluate(() => new URL(window.location.href).pathname);
    return p === '/';
  }, ms, 400);
}

async function waitPath(page, path, ms = 20000) {
  return poll(async () => {
    const p = await page.evaluate(() => new URL(window.location.href).pathname);
    return p === path;
  }, ms, 400);
}

// Anchor on the element holding `uniqueText`, climb to its row (nearest
// ancestor that contains buttons — same boundary rowHasStatus uses), then click
// the enabled button with exact label `buttonText` inside that row.
async function clickRowButton(page, uniqueText, buttonText) {
  return page.evaluate(
    ({ uniqueText, buttonText }) => {
      const candidates = [...document.querySelectorAll('p, span, div')].filter(
        (el) =>
          el.textContent &&
          el.textContent.length <= 400 &&
          el.textContent.includes(uniqueText)
      );
      for (const c of candidates) {
        let row = c;
        while (row && row !== document.body && !row.querySelector('button')) {
          row = row.parentElement;
        }
        if (!row || row === document.body) continue;
        const b = [...row.querySelectorAll('button')].find(
          (x) => x.textContent.trim() === buttonText && !x.disabled
        );
        if (b) {
          b.click();
          return true;
        }
      }
      return false;
    },
    { uniqueText, buttonText }
  );
}

// Does the row containing `uniqueText` show `· status` in its meta line?
async function rowHasStatus(page, uniqueText, status) {
  return page.evaluate(
    ({ uniqueText, status }) => {
      const all = [...document.querySelectorAll('p, span, div')];
      for (const el of all) {
        if (!el.textContent || el.textContent.length > 400) continue;
        if (!el.textContent.includes(uniqueText)) continue;
        // climb to the row container (nearest ancestor holding a button)
        let row = el;
        while (row && row !== document.body && !row.querySelector('button')) {
          row = row.parentElement;
        }
        if (row && row.querySelector('button') && row.textContent.includes(`· ${status}`)) {
          return true;
        }
      }
      return false;
    },
    { uniqueText, status }
  );
}

async function waitRowStatus(page, uniqueText, status, ms = 30000) {
  return poll(() => rowHasStatus(page, uniqueText, status), ms, 500);
}

// Fill a React-controlled input by going through the native value setter.
async function setNativeValue(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 30000 });
  await page.$eval(
    selector,
    (el, v) => {
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
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

// --- test data ---
const now = Date.now();
const PASSWORD = 'OpsPass!234';
const ADMIN = { email: `e2e-ops-admin-${now}@example.com`, password: PASSWORD };
const SELLER = { email: `e2e-ops-seller-${now}@example.com`, password: PASSWORD };
const CUST = { email: `e2e-ops-cust-${now}@example.com`, password: PASSWORD };
const storeName = `E2E Ops Store ${now}`;
const storeSlug = `e2e-ops-store-${now}`;
const productName = `E2E Ops Product ${now}`;
const productSlug = `e2e-ops-product-${now}`;
const couponCodeRaw = `E2EOP${now}`.slice(0, 24);
const couponCode = couponCodeRaw.toUpperCase();

const created = { users: [], sellerId: null, productId: null, couponId: null };

async function signup(email) {
  const { data, error } = await anon.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { first_name: 'E2E', last_name: 'Ops' } },
  });
  if (error) throw new Error(`signUp ${email}: ${error.message}`);
  created.users.push({ email, userId: data.user.id });
  return data.user.id;
}

async function seed() {
  // Admin
  const adminId = await signup(ADMIN.email);
  const { error: ar } = await svc
    .from('profiles')
    .update({ role: 'admin', updated_at: new Date().toISOString() })
    .eq('id', adminId);
  if (ar) throw new Error(`admin role: ${ar.message}`);

  // Seller applicant (pending sellers row, owner still a customer)
  const sellerOwnerId = await signup(SELLER.email);
  const { data: sRow, error: sr } = await svc
    .from('sellers')
    .insert({
      owner_id: sellerOwnerId,
      store_name: storeName,
      slug: storeSlug,
      email: SELLER.email,
      status: 'pending',
      commission_rate: 10,
    })
    .select('id')
    .single();
  if (sr) throw new Error(`sellers insert: ${sr.message}`);
  created.sellerId = sRow.id;

  // A pending_review product owned by the seller
  const { data: cat } = await svc.from('categories').select('id').limit(1).maybeSingle();
  const { data: pRow, error: pr } = await svc
    .from('products')
    .insert({
      name: productName,
      slug: productSlug,
      description: `E2E product for moderation — ${now}`,
      short_description: 'E2E moderation product',
      brand: 'E2E',
      base_price: 25,
      compare_at_price: 30,
      category_id: cat?.id ?? null,
      seller_id: created.sellerId,
      status: 'pending_review',
      currency: 'GHS',
      is_featured: false,
      rating_average: 0,
      review_count: 0,
    })
    .select('id')
    .single();
  if (pr) throw new Error(`products insert: ${pr.message}`);
  created.productId = pRow.id;

  // Customer to deactivate/activate
  await signup(CUST.email);
}

async function dbSeller() {
  const { data, error } = await svc.from('sellers').select('status').eq('id', created.sellerId).single();
  if (error) throw error;
  return data.status;
}

async function dbOwnerRole() {
  const ownerId = created.users.find((u) => u.email === SELLER.email).userId;
  const { data, error } = await svc.from('profiles').select('role').eq('id', ownerId).single();
  if (error) throw error;
  return data.role;
}

async function dbProduct() {
  const { data, error } = await svc.from('products').select('status').eq('id', created.productId).single();
  if (error) throw error;
  return data.status;
}

async function dbCustomerActive() {
  const custId = created.users.find((u) => u.email === CUST.email).userId;
  const { data, error } = await svc.from('profiles').select('is_active').eq('id', custId).single();
  if (error) throw error;
  return data.is_active;
}

async function dbNotifications(ownerId) {
  const { data, error } = await svc
    .from('notifications')
    .select('title,data')
    .eq('user_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbAudit() {
  const { data, error } = await svc
    .from('audit_logs')
    .select('action,entity_id,new_data')
    .eq('entity_id', created.sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function dbCoupon() {
  const { data, error } = await svc.from('coupons').select('*').eq('id', created.couponId).maybeSingle();
  if (error) throw error;
  return data;
}

async function main() {
  await seed();

  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  if (!chrome) throw new Error('Chrome not found');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chrome,
    args: ['--no-first-run', '--disable-extensions', '--no-sandbox'],
  });

  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();

  try {
    // ---- 0. Admin login -> /admin/dashboard ----
    await login(page, ADMIN.email, ADMIN.password);
    const onDash = await waitUrl(page, '/admin/dashboard', 40000);
    const dashText = onDash ? await waitForText(page, 'Marketplace Control Center', 30000) : false;
    const sellerVisible = dashText ? await waitForText(page, storeName, 45000) : false;
    const productVisible = sellerVisible ? await waitForText(page, productName, 30000) : false;
    const custVisible = productVisible ? await waitForText(page, CUST.email, 30000) : false;
    record('0. Admin reaches /admin/dashboard; rows render', onDash && dashText && sellerVisible && productVisible && custVisible,
      `dash=${onDash && dashText} sellerRow=${sellerVisible} productRow=${productVisible} custRow=${custVisible}`);

    const ownerId = created.users.find((u) => u.email === SELLER.email).userId;

    // ---- 1. Approve seller ----
    {
      const clicked = await poll(() => clickRowButton(page, storeName, 'Approve'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Seller marked active.', 20000) : false;
      const db = banner ? await poll(async () => (await dbSeller()) === 'active', 20000) : false;
      const role = db ? await poll(async () => (await dbOwnerRole()) === 'seller', 15000) : false;
      const notif = role ? await dbNotifications(ownerId) : [];
      const hasNotif = notif.some((n) => n.title === 'Seller application updated');
      const ui = await waitRowStatus(page, storeName, 'active', 30000);
      record('1. Approve seller (RPC role-flip + notification)', clicked && banner && db && role && hasNotif && ui,
        `banner=${banner} db=active:${db} role=seller:${role} notified=${hasNotif} ui=${ui}`);
    }

    // ---- 2. Suspend seller ----
    {
      const clicked = await poll(() => clickRowButton(page, storeName, 'Suspend'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Seller marked suspended.', 20000) : false;
      const db = banner ? await poll(async () => (await dbSeller()) === 'suspended', 20000) : false;
      const ui = await waitRowStatus(page, storeName, 'suspended', 30000);
      const audit = await dbAudit();
      const hasAudit = audit.some((a) => a.action === 'seller_status_updated');
      record('2. Suspend seller (+ audit log)', clicked && banner && db && ui && hasAudit,
        `banner=${banner} db=suspended:${db} ui=${ui} audit=${hasAudit}`);
    }

    // ---- 3. Reject seller (role back to customer) ----
    {
      const clicked = await poll(() => clickRowButton(page, storeName, 'Reject'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Seller marked rejected.', 20000) : false;
      const db = banner ? await poll(async () => (await dbSeller()) === 'rejected', 20000) : false;
      const role = db ? await poll(async () => (await dbOwnerRole()) === 'customer', 15000) : false;
      const ui = await waitRowStatus(page, storeName, 'rejected', 30000);
      record('3. Reject seller (role back to customer)', clicked && banner && db && role && ui,
        `banner=${banner} db=rejected:${db} role=customer:${role} ui=${ui}`);
    }

    // ---- 4. Publish product ----
    {
      const clicked = await poll(() => clickRowButton(page, productName, 'Publish'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Product marked active.', 20000) : false;
      const db = banner ? await poll(async () => (await dbProduct()) === 'active', 20000) : false;
      const ui = await waitRowStatus(page, productName, 'active', 30000);
      record('4. Publish product', clicked && banner && db && ui,
        `banner=${banner} db=active:${db} ui=${ui}`);
    }

    // ---- 5. Reject product ----
    {
      const clicked = await poll(() => clickRowButton(page, productName, 'Reject'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Product marked rejected.', 20000) : false;
      const db = banner ? await poll(async () => (await dbProduct()) === 'rejected', 20000) : false;
      const ui = await waitRowStatus(page, productName, 'rejected', 30000);
      record('5. Reject product', clicked && banner && db && ui,
        `banner=${banner} db=rejected:${db} ui=${ui}`);
    }

    // ---- 6. Deactivate customer ----
    {
      const clicked = await poll(() => clickRowButton(page, CUST.email, 'Deactivate'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Customer deactivated.', 20000) : false;
      const db = banner ? await poll(async () => (await dbCustomerActive()) === false, 20000) : false;
      const btnFlips = db ? await waitForText(page, 'Activate', 20000) : false;
      record('6. Deactivate customer', clicked && banner && db && btnFlips,
        `banner=${banner} db=inactive:${db} button-flipped=${btnFlips}`);
    }

    // ---- 7. Reactivate customer ----
    {
      const clicked = await poll(() => clickRowButton(page, CUST.email, 'Activate'), 15000, 600);
      const banner = clicked ? await waitForText(page, 'Customer activated.', 20000) : false;
      const db = banner ? await poll(async () => (await dbCustomerActive()) === true, 20000) : false;
      record('7. Reactivate customer', clicked && banner && db, `banner=${banner} db=active:${db}`);
    }

    // ---- 8. Create coupon via /admin/coupons ----
    {
      await goto(page, '/admin/coupons');
      const rendered = await page.waitForSelector('input[placeholder="Code"]', { timeout: 30000 }).then(() => true).catch(() => false);
      if (rendered) {
        await fill(page, 'input[placeholder="Code"]', couponCodeRaw);
        await fill(page, 'input[placeholder="Discount value"]', '10');
        await fill(page, 'input[placeholder="Max uses"]', '5');
        const tomorrow = new Date(Date.now() + 2 * 86400000);
        const pad = (n) => String(n).padStart(2, '0');
        await setNativeValue(
          page,
          'input[type="datetime-local"]',
          `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`
        );
        const clicked = await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Create coupon');
          if (b) { b.click(); return true; }
          return false;
        });
        const banner = clicked ? await waitForText(page, 'Coupon created', 20000) : false;
        // find the created row by reading the DB id, then confirm UI lists it
        const dbRow = banner
          ? await poll(async () => {
              const { data } = await svc.from('coupons').select('id').eq('code', couponCode).maybeSingle();
              return data || null;
            }, 20000)
          : null;
        created.couponId = dbRow?.id ?? null;
        const ui = banner && created.couponId ? await waitForText(page, couponCode, 20000) : false;
        const c = created.couponId ? await dbCoupon() : null;
        const okDb =
          c &&
          c.code === couponCode &&
          c.discount_type === 'percentage' &&
          Number(c.discount_value) === 10 &&
          c.usage_limit === 5 &&
          c.used_count === 0 &&
          c.is_active === true &&
          !!c.expires_at;
        const uiUses = ui ? await waitForText(page, 'used 0/5', 15000) : false;
        record('8. Create coupon (live-schema columns)', clicked && banner && !!dbRow && okDb && ui && uiUses,
          `banner=${banner} db-row=${!!dbRow} cols=${okDb} ui=${ui && uiUses}`);
      } else {
        record('8. Create coupon (live-schema columns)', false, 'coupon form did not render');
      }
    }

    // ---- 9. Edge gate: rejected seller (now role=customer) blocked from /admin ----
    {
      const ctx2 = await browser.createBrowserContext();
      const p2 = await ctx2.newPage();
      await login(p2, SELLER.email, PASSWORD);
      await waitUrl(p2, '/login', 10000).catch(() => {}); // ignore redirects
      await waitHome(p2, 30000);
      await goto(p2, '/admin/dashboard');
      const bounced = await waitHome(p2, 20000);
      record('9. Rejected applicant blocked from /admin at the edge', bounced, bounced ? 'redirected to /' : 'reached /admin/dashboard!');
      await ctx2.close();
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  return passed === results.length ? 0 : 1;
}

// --- cleanup (always runs; dependency order: audit_logs -> sellers before
// their owner profiles, then the auth users). Failures are reported, not
// swallowed, so a leak is loud instead of silent. ---
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
  if (created.productId) await del('products', svc.from('products').delete().eq('id', created.productId));
  if (created.couponId) await del('coupons', svc.from('coupons').delete().eq('id', created.couponId));
  if (created.sellerId) {
    // audit_logs.entity_id references sellers, so clear audit rows first.
    await del('audit_logs', svc.from('audit_logs').delete().eq('entity_id', created.sellerId));
    await del('seller_business_profiles', svc.from('seller_business_profiles').delete().eq('seller_id', created.sellerId));
    await del('sellers', svc.from('sellers').delete().eq('id', created.sellerId));
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
  .then((code) => cleanup().then(() => process.exit(code)))
  .catch(async (e) => {
    console.error('E2E harness error:', e.message);
    await cleanup();
    process.exit(1);
  });
