// Browser-driven authentication E2E for Perfect Store.
// Requires: a local dev server on the BASE_URL, puppeteer-core (--no-save),
// and .env.local with the live Supabase credentials (dotenv).
//
// Usage:
//   E2E_BASE_URL=http://localhost:3000 node scripts/auth-e2e.mjs
import 'dotenv/config';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

const results = [];
const created = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

// --- helpers ---
async function fill(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 25000 });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, value);
}

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function bodyHas(page, text) {
  return page.evaluate((t) => document.body.innerText.includes(t), text);
}

async function waitForText(page, text, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await bodyHas(page, text)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function waitUrl(page, fragment, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const href = await page.evaluate(() => window.location.href);
    if (href.includes(fragment)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

// Wait until the pathname is exactly the site root (login/register actions
// redirect there for customers). Substring checks would match every page.
async function waitHome(page, ms = 20000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const p = await page.evaluate(() => new URL(window.location.href).pathname);
    if (p === '/') return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function submitForm(page) {
  // Header renders search forms before the auth form; target the form with
  // named auth inputs, then click its submit button (Button has no explicit
  // type; skip password-eye toggles which are type="button").
  await page.evaluate(() => {
    const forms = [...document.querySelectorAll('form')];
    const form = forms.find((f) =>
      ['firstName', 'email', 'password', 'confirmPassword'].some((n) => f.querySelector(`input[name="${n}"]`))
    );
    if (!form) return;
    const btns = [...form.querySelectorAll('button')].filter((b) => b.type !== 'button');
    const btn = btns.length ? btns[btns.length - 1] : form.querySelector('button');
    if (btn) btn.click();
  });
}

async function register(page, { email, password, terms = true }) {
  await goto(page, '/register');
  await fill(page, 'input[name="firstName"]', 'E2E');
  await fill(page, 'input[name="lastName"]', 'Test');
  await fill(page, 'input[name="email"]', email);
  await fill(page, 'input[name="phone"]', '+233501234567');
  await fill(page, 'input[name="password"]', password);
  await fill(page, 'input[name="confirmPassword"]', password);
  if (terms) await page.click('input[name="acceptTerms"]');
  await submitForm(page);
}

async function login(page, email, password) {
  await goto(page, '/login');
  await fill(page, 'input[name="email"]', email);
  await fill(page, 'input[name="password"]', password);
  await submitForm(page);
}

const now = Date.now();
const PASSWORD = 'StrongPass!234';
const c1 = { email: `e2e-c1-${now}@example.com`, password: PASSWORD };
const termsEmail = `e2e-terms-${now}@example.com`;
const adminUser = { email: `e2e-admin-${now}@example.com`, password: PASSWORD };
const sellerUser = { email: `e2e-seller-${now}@example.com`, password: PASSWORD };

async function createUserViaApi(email, password) {
  const { data, error } = await anon.auth.signUp({
    email,
    password,
    options: { data: { first_name: 'E2E', last_name: 'Test' } },
  });
  if (error) throw error;
  created.push({ email, userId: data.user.id });
  return data.user.id;
}

async function main() {
  const chrome = CHROME_PATHS.find((p) => existsSync(p));
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chrome,
    args: ['--no-first-run', '--disable-extensions', '--no-sandbox'],
  });

  let regPage = null;
  let regCtx = null;

  try {
    // ---- 1. Register new customer ----
    {
      regCtx = await browser.createBrowserContext();
      regPage = await regCtx.newPage();
      await register(regPage, c1);
      const ok = await waitForText(regPage, 'Account created successfully', 20000);
      const redirected = ok ? await waitUrl(regPage, '/login', 8000) : false;
      record('1. Register new customer', ok && redirected, ok ? (redirected ? 'success + auto-redirect to /login' : 'success but no auto-redirect') : 'no success panel');
    }

    // ---- 2. Registration validation ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await goto(page, '/register');
      // Values pass the browser's native HTML5 checks but must fail the zod
      // schema (e.g. 'a@b' is a valid HTML5 email but invalid per zod).
      await fill(page, 'input[name="firstName"]', 'A');
      await fill(page, 'input[name="lastName"]', 'B');
      await fill(page, 'input[name="email"]', 'a@b');
      await fill(page, 'input[name="phone"]', '123');
      await fill(page, 'input[name="password"]', 'short');
      await fill(page, 'input[name="confirmPassword"]', 'different');
      await page.click('input[name="acceptTerms"]');
      await submitForm(page);
      await new Promise((r) => setTimeout(r, 2500));
      const errs = [
        'First name must be at least 2 characters',
        'Please enter a valid email address',
        'Please enter a valid Ghana phone number',
        'Password must contain at least one uppercase letter',
        'Passwords do not match',
      ];
      const found = [];
      for (const e of errs) if (await bodyHas(page, e)) found.push(e);
      record('2. Registration validation', found.length >= 4, `${found.length}/5 errors shown`);
      await ctx.close();
    }

    // ---- 3. Terms validation ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await register(page, { email: termsEmail, password: PASSWORD, terms: false });
      const shown = await waitForText(page, 'You must accept the terms and conditions', 20000);
      const { error: loginErr } = await anon.auth.signInWithPassword({ email: termsEmail, password: PASSWORD });
      record('3. Terms validation', shown && !!loginErr, shown ? (loginErr ? 'blocked + no account created' : 'error shown but account exists!') : 'terms error not shown');
      await ctx.close();
    }

    // ---- 4. Duplicate email ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await register(page, c1);
      const shown = await waitForText(page, 'An account with this email already exists', 20000);
      record('4. Duplicate email', shown, shown ? 'blocked with existing-account message' : 'duplicate not blocked');
      await ctx.close();
    }

    // ---- 5. Immediate login after registration ----
    {
      // Same browser context that just registered; page is on /login after redirect.
      await goto(regPage, '/login');
      await fill(regPage, 'input[name="email"]', c1.email);
      await fill(regPage, 'input[name="password"]', c1.password);
      await submitForm(regPage);
      const home = await waitHome(regPage, 20000);
      await goto(regPage, '/account');
      const ok = await waitForText(regPage, 'My Account', 20000);
      record('5. Immediate login after registration', home && ok, ok ? 'session works on /account' : 'login failed');
    }

    // ---- 6. Invalid password ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, c1.email, 'WrongPass!999');
      const shown = await waitForText(page, 'Invalid email or password', 20000);
      record('6. Invalid password', shown, shown ? 'generic error shown' : 'no error');
      await ctx.close();
    }

    // ---- 7. Invalid email ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      // 'a@b' passes the browser's native type=email check but fails the zod
      // schema, so the server action runs and returns the field error.
      await login(page, 'a@b', PASSWORD);
      const shown = await waitForText(page, 'Please enter a valid email address', 20000);
      record('7. Invalid email', shown, shown ? 'field error shown' : 'no field error');
      await ctx.close();
    }

    // ---- 8. Logout ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, c1.email, c1.password);
      await waitHome(page, 20000);
      await goto(page, '/account');
      await page.waitForSelector('form', { timeout: 15000 });
      const clicked = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('Sign out'));
        if (b) {
          b.click();
          return true;
        }
        return false;
      });
      if (!clicked) record('8. Logout', false, 'sign-out button not found');
      await waitHome(page, 20000);
      await goto(page, '/account');
      const loggedOut = await waitUrl(page, '/login', 15000);
      record('8. Logout', loggedOut, loggedOut ? 'session cleared; /account redirects to /login' : 'still logged in');
      await ctx.close();
    }

    // ---- 9. Login again ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, c1.email, c1.password);
      await waitHome(page, 20000);
      await goto(page, '/account');
      const ok = await waitForText(page, 'My Account', 20000);
      record('9. Login again', ok, ok ? 'session works after second login' : 'login failed');
      await ctx.close();
    }

    // ---- 10. Forgot password (no enumeration) ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await goto(page, '/forgot-password');
      await fill(page, 'input[name="email"]', 'definitely-not-registered@example.com');
      await submitForm(page);
      const shown = await waitForText(page, 'Check your email', 20000);
      record('10. Forgot password (unknown email)', shown, shown ? 'same success message (no enumeration)' : 'no success message');
      await ctx.close();
    }

    // ---- 11. Reset password (graceful without session) ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await goto(page, '/reset-password');
      const formRendered = await page.waitForSelector('input[name="password"]', { timeout: 15000 }).then(() => true).catch(() => false);
      if (formRendered) {
        await fill(page, 'input[name="password"]', 'NewStrong!456');
        await fill(page, 'input[name="confirmPassword"]', 'NewStrong!456');
        await submitForm(page);
        const err = await waitForText(page, 'Unable to reset password', 20000);
        record('11. Reset password without session', err, err ? 'graceful error (full flow needs the emailed link)' : 'no graceful error');
      } else {
        record('11. Reset password without session', false, 'form did not render');
      }
      await ctx.close();
    }

    // ---- 12. Protected account route (logged out) ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await goto(page, '/account');
      const redirected = await waitUrl(page, '/login', 15000);
      const hasParam = redirected && (await page.evaluate(() => window.location.href.includes('redirect=%2Faccount')));
      record('12. Protected /account redirect', hasParam, hasParam ? '/login?redirect=/account' : redirected ? 'redirect without param' : 'no redirect');
      await ctx.close();
    }

    // ---- 13/14. Unauthorized admin/seller access as customer ----
    {
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, c1.email, c1.password);
      await waitHome(page, 20000);
      await goto(page, '/admin');
      const adminBlocked = await waitHome(page, 10000);
      record('13. Customer blocked from /admin', adminBlocked, adminBlocked ? 'redirected to /' : 'reached /admin!');
      await goto(page, '/seller');
      const sellerBlocked = await waitHome(page, 10000);
      record('14. Customer blocked from /seller', sellerBlocked, sellerBlocked ? 'redirected to /' : 'reached /seller!');
      await goto(page, '/seller/apply');
      const applyText = await bodyHas(page, 'Sell on Perfect Store');
      record('14b. /seller/apply still public', applyText, applyText ? 'application page renders' : 'page did not render');
      await ctx.close();
    }

    // ---- 15. Admin login redirect ----
    {
      const userId = await createUserViaApi(adminUser.email, adminUser.password);
      await svc.from('profiles').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('id', userId);
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, adminUser.email, adminUser.password);
      const ok = await waitUrl(page, '/admin/dashboard', 20000);
      record('15. Admin login redirects to /admin/dashboard', ok, ok ? 'redirect ok' : 'no admin redirect');
      await ctx.close();
    }

    // ---- 16. Seller login redirect ----
    {
      const userId = await createUserViaApi(sellerUser.email, sellerUser.password);
      await svc.from('profiles').update({ role: 'seller', updated_at: new Date().toISOString() }).eq('id', userId);
      await svc.from('sellers').insert({
        owner_id: userId, store_name: `E2E Store ${now}`, slug: `e2e-store-${now}`,
        status: 'active', commission_rate: 10, email: sellerUser.email,
      }).select('id').single();
      const ctx = await browser.createBrowserContext();
      const page = await ctx.newPage();
      await login(page, sellerUser.email, sellerUser.password);
      const ok = await waitUrl(page, '/seller/dashboard', 20000);
      record('16. Seller login redirects to /seller/dashboard', ok, ok ? 'redirect ok' : 'no seller redirect');
      await ctx.close();
    }
  } finally {
    if (regCtx) await regCtx.close().catch(() => {});
    await browser.close();
  }

  // Cleanup test users/rows.
  for (const u of created) {
    if (u.userId) {
      for (const q of [
        svc.from('sellers').delete().eq('owner_id', u.userId),
        svc.from('profiles').delete().eq('id', u.userId),
      ]) {
        try { await q; } catch {}
      }
      try { await svc.auth.admin.deleteUser(u.userId); } catch {}
    }
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} tests passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('E2E harness error:', e.message);
  process.exit(1);
});