import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { validateConfig } from './hosted-auth-acceptance.mjs';

const CONFIRM = 'RUN_HOSTED_BROWSER_QA';
const WIDTHS = [360, 768, 1280, 1920];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function check(value, label) {
  if (!value) throw new Error('HOSTED_BROWSER_QA_FAILED: ' + label);
}

export function browserConfig(env) {
  check(env.STAGING_BROWSER_CONFIRM === CONFIRM, 'Explicit browser staging confirmation required.');
  // Keep a single audited identity for the project, origin and JWT role checks.
  return validateConfig({ ...env, STAGING_ACCEPTANCE_CONFIRM: 'RUN_SYNTHETIC_STAGING_ONLY' });
}

export async function hostedBrowserQa(
  env,
  { fetcher = fetch, browserType = chromium, log = console.log } = {},
) {
  const cfg = browserConfig(env);
  const nonce = randomBytes(5).toString('hex');
  const names = Object.fromEntries(
    ['admin', 'teacher', 'student'].map((role) => {
      const username = 'lbqa_' + nonce + '_' + role;
      return [role, { username, email: username + '@accounts.invalid' }];
    }),
  );
  const createdIds = new Set();
  let browser;
  let stage = 'preflight';
  let error = null;
  let mutated = false;

  async function api(path, { service = true, method = 'GET', body } = {}) {
    let response;
    const key = service ? cfg.service : cfg.anon;
    try {
      response = await fetcher(cfg.url + path, {
        method,
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error('HOSTED_BROWSER_QA_FAILED: Staging API request failed.');
    }
    check(response.status < 300 || response.status >= 400, 'Unexpected API redirect.');
    let data = null;
    try {
      data = await response.json();
    } catch {
      // Never print raw responses.
    }
    return { ok: response.ok, status: response.status, data };
  }

  async function users() {
    const response = await api('/auth/v1/admin/users?per_page=10&page=1');
    check(
      response.ok && Array.isArray(response.data?.users),
      'Read-only Auth inventory unavailable.',
    );
    return response.data.users;
  }

  async function profiles() {
    const response = await api('/rest/v1/profiles?select=id&limit=10');
    check(response.ok && Array.isArray(response.data), 'Read-only profile inventory unavailable.');
    return response.data;
  }

  async function withPage(width, task) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1920 ? 1080 : 900 },
      serviceWorkers: 'block',
      acceptDownloads: false,
    });
    let blocked = false;
    try {
      // Browser is not allowed to disclose temporary credentials to third-party origins.
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== cfg.origin && url.origin !== cfg.url) {
          blocked = true;
          await route.abort('blockedbyclient');
          return;
        }
        await route.continue();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(18000);
      await task(page);
      check(!blocked, 'Unexpected third-party browser request.');
    } finally {
      await context.close();
    }
  }

  async function login(page, identity, password) {
    await page.goto(cfg.origin + '/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: 'Username' }).fill(identity.username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk' }).click();
  }

  async function logout(page) {
    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page).toHaveURL(/\/login$/);
  }

  async function provisionInBrowser(page, role) {
    await page.getByRole('textbox', { name: 'Username baru' }).fill(names[role].username);
    await page.getByRole('textbox', { name: 'Nama tampilan' }).fill('Uji Sintetis ' + role);
    await page.getByRole('combobox', { name: 'Peran' }).selectOption(role);
    await page.getByRole('button', { name: 'Buat akun' }).click();
    const oneTime = page.locator('.lb-one-time-secret code');
    await expect(oneTime).toBeVisible();
    const password = await oneTime.innerText();
    const id = await page.getByRole('textbox', { name: 'ID akun' }).inputValue();
    check(
      typeof password === 'string' && password.length >= 12 && UUID.test(id),
      'UI provision response invalid.',
    );
    createdIds.add(id);
    await page.getByRole('button', { name: 'Sembunyikan' }).click();
    return password;
  }

  async function passwordFlow(role, width, originalPassword, expectedRole) {
    await withPage(width, async (page) => {
      await login(page, names[role], originalPassword);
      await expect(page).toHaveURL(/\/ganti-password$/);
      // SPA navigation checks that pending users cannot enter admin routes.
      await page.evaluate(() => {
        globalThis.history.pushState({}, '', '/admin/akun');
        globalThis.dispatchEvent(new globalThis.PopStateEvent('popstate'));
      });
      await expect(page).toHaveURL(/\/ganti-password$/);
      const nextPassword = randomBytes(24).toString('base64url') + 'Zz9!';
      await page.getByLabel('Password lama').fill(originalPassword);
      await page.getByLabel('Password baru (12 karakter atau lebih)').fill(nextPassword);
      await page.getByRole('button', { name: 'Simpan password baru' }).click();
      await expect(page).toHaveURL(/\/akun$/);
      await expect(page.getByText('Role: ' + expectedRole + '.')).toBeVisible();
      await page.evaluate(() => {
        globalThis.history.pushState({}, '', '/admin/akun');
        globalThis.dispatchEvent(new globalThis.PopStateEvent('popstate'));
      });
      await expect(page).toHaveURL(/\/akun$/);
      const storage = await page.evaluate(() => [localStorage.length, sessionStorage.length]);
      assert.deepEqual(storage, [0, 0]);
      await page.reload();
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  // Exactly bounded staging preflight; must be completed before any user mutation.
  check((await api('/auth/v1/health', { service: false })).status === 200, 'GoTrue health failed.');
  const settings = await api('/auth/v1/settings', { service: false });
  check(
    settings.ok &&
      settings.data?.disable_signup === true &&
      settings.data?.external?.email === true,
    'Auth policy unsafe.',
  );
  check((await users()).length === 0, 'Staging has pre-existing Auth users.');
  check((await profiles()).length === 0, 'Staging has pre-existing profiles.');
  let frontend;
  try {
    frontend = await fetcher(cfg.origin + '/login', {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('HOSTED_BROWSER_QA_FAILED: Pages login route unreachable.');
  }
  check(
    frontend.status === 200 && (frontend.headers.get('content-type') || '').includes('text/html'),
    'Pages login route unavailable.',
  );
  log('PASS hosted-browser preflight-healthy-empty-staging-pages');

  try {
    stage = 'admin-fixture';
    mutated = true;
    const adminPassword = randomBytes(24).toString('base64url') + 'Aa9!';
    const auth = await api('/auth/v1/admin/users', {
      method: 'POST',
      body: { email: names.admin.email, password: adminPassword, email_confirm: true },
    });
    check(auth.ok && UUID.test(auth.data?.id ?? ''), 'Synthetic admin Auth creation failed.');
    createdIds.add(auth.data.id);
    const profile = await api('/rest/v1/profiles', {
      method: 'POST',
      body: {
        id: auth.data.id,
        username: names.admin.username,
        display_name: 'Admin Browser Uji',
        role: 'admin',
        active: true,
        must_change_password: false,
      },
    });
    check(profile.ok, 'Synthetic admin profile creation failed.');

    stage = 'chromium-launch';
    browser = await browserType.launch({ headless: true });

    for (const width of WIDTHS) {
      stage = 'admin-viewport-' + width;
      await withPage(width, async (page) => {
        await login(page, names.admin, adminPassword);
        await expect(page).toHaveURL(/\/akun$/);
        await expect(
          page.getByRole('heading', { name: 'Halo, ' + names.admin.username }),
        ).toBeVisible();
        await expect(page.getByRole('link', { name: 'Kelola akun guru dan siswa' })).toBeVisible();
        await logout(page);
      });
      log('PASS hosted-browser admin-login-logout-' + width);
    }

    stage = 'admin-provision-ui';
    let teacherPassword, studentPassword;
    await withPage(1280, async (page) => {
      await login(page, names.admin, adminPassword);
      await expect(page).toHaveURL(/\/akun$/);
      await page.getByRole('link', { name: 'Kelola akun guru dan siswa' }).click();
      await expect(page.getByRole('heading', { name: 'Kelola akun' })).toBeVisible();
      teacherPassword = await provisionInBrowser(page, 'teacher');
      studentPassword = await provisionInBrowser(page, 'student');
      await page.getByRole('link', { name: /Kembali ke akun/ }).click();
      await logout(page);
    });
    log('PASS hosted-browser admin-ui-provision-teacher-student');

    stage = 'teacher-pending-change';
    await passwordFlow('teacher', 360, teacherPassword, 'Guru');
    log('PASS hosted-browser teacher-pending-password-role-denial');

    stage = 'student-pending-change';
    await passwordFlow('student', 768, studentPassword, 'Siswa');
    log('PASS hosted-browser student-pending-password-role-denial');
  } catch {
    error = new Error('HOSTED_BROWSER_QA_FAILED: ' + stage);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Cleanup still takes precedence.
      }
    }
    if (mutated) {
      try {
        // Recover identities created even when the UI response was lost.
        const found = await users();
        for (const user of found) {
          if (
            Object.values(names).some((item) => item.email === user.email) &&
            UUID.test(user.id ?? '')
          ) {
            createdIds.add(user.id);
          }
        }
        for (const id of createdIds) {
          const removed = await api('/auth/v1/admin/users/' + id, { method: 'DELETE' });
          check(removed.ok, 'Synthetic identity deletion failed.');
        }
        check((await users()).length === 0, 'Auth users remain after cleanup.');
        check((await profiles()).length === 0, 'Profiles remain after cleanup.');
        log('PASS hosted-browser cleanup-no-remaining-users');
      } catch {
        error = new Error(
          'HOSTED_BROWSER_QA_CLEANUP_BLOCKED: Inspect only lbqa_ identities on staging before any retry.',
        );
      }
    }
  }
  if (error) throw error;
  return WIDTHS.length + 5;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  hostedBrowserQa(process.env)
    .then((count) => console.log('HOSTED_BROWSER_AUTH_PASS: ' + count + ' bounded checks.'))
    .catch((error) => {
      const message = error instanceof Error ? error.message : '';
      console.error(
        message.startsWith('HOSTED_BROWSER_QA_')
          ? message
          : 'HOSTED_BROWSER_QA_FAILED: Unexpected error (details redacted).',
      );
      process.exitCode = 1;
    });
}
