import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { localSupabaseEnv, localRequest } from '../../scripts/local-supabase-env.mjs';

test.describe('local Auth + real browser — TEST-002 partial', () => {
  const env = localSupabaseEnv();
  const marker = randomBytes(4).toString('hex');
  const adminUsername = 'lb_admin_' + marker;
  const teacherUsername = 'lb_guru_' + marker;
  const originalPassword = randomBytes(22).toString('base64url') + 'Ab12!';
  const changedPassword = randomBytes(22).toString('base64url') + 'Cd34!';
  const created = [];

  test.beforeAll(async () => {
    const auth = await localRequest(env.url, env.serviceKey, '/auth/v1/admin/users', {
      method: 'POST',
      body: {
        email: adminUsername + '@accounts.invalid',
        password: originalPassword,
        email_confirm: true,
      },
    });
    assert.equal(auth.ok, true, 'Synthetic local admin creation must work');
    created.push(auth.data.id);
    const profile = await localRequest(env.url, env.serviceKey, '/rest/v1/profiles', {
      method: 'POST',
      body: {
        id: auth.data.id,
        username: adminUsername,
        display_name: 'Admin Lokal',
        role: 'admin',
        active: true,
        must_change_password: false,
      },
    });
    assert.equal(profile.ok, true);
  });
  test.afterAll(async () => {
    // Cleanup synthetic credentials without putting them in browser traces/logs.
    const profiles = await localRequest(
      env.url,
      env.serviceKey,
      '/rest/v1/profiles?select=id&username=eq.' + teacherUsername,
    );
    if (profiles.ok && Array.isArray(profiles.data)) {
      for (const profile of profiles.data) created.push(profile.id);
    }
    for (const id of new Set(created)) {
      const deleted = await localRequest(env.url, env.serviceKey, '/auth/v1/admin/users/' + id, {
        method: 'DELETE',
      });
      assert.equal(deleted.ok, true, 'Synthetic user cleanup must work');
    }
  });

  async function login(page, name, password) {
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(name);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Masuk' }).click();
  }

  test('admin provision → teacher pending → change password → reset/deactivate', async ({
    page,
  }) => {
    await login(page, adminUsername, originalPassword);
    await expect(page).toHaveURL(/\/akun$/);
    await expect(page.getByRole('heading', { name: 'Halo, ' + adminUsername })).toBeVisible();
    await page.getByRole('link', { name: 'Kelola akun guru dan siswa' }).click();
    await expect(page.getByRole('heading', { name: 'Kelola akun' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Username baru' }).fill(teacherUsername);
    await page.getByRole('textbox', { name: 'Nama tampilan' }).fill('Guru Sintetis');
    await page.getByRole('combobox', { name: 'Peran' }).selectOption('teacher');
    await page.getByRole('button', { name: 'Buat akun' }).click();
    const oneTime = page.locator('.lb-one-time-secret code');
    await expect(oneTime).toBeVisible();
    const temporaryPassword = await oneTime.innerText();
    assert.ok(temporaryPassword.length >= 12);
    const teacherId = await page.getByRole('textbox', { name: 'ID akun' }).inputValue();
    assert.match(teacherId, /^[0-9a-f-]{36}$/i);
    await page.getByRole('button', { name: 'Sembunyikan' }).click();
    await expect(
      page.locator('.lb-account-list').getByText('Guru Sintetis', { exact: true }),
    ).toBeVisible();

    await page.goto('/akun');
    await page.getByRole('button', { name: 'Keluar' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await login(page, teacherUsername, temporaryPassword);
    await expect(page).toHaveURL(/\/ganti-password$/);
    await page.goto('/admin/akun');
    await expect(page).toHaveURL(/\/ganti-password$/);
    await page.getByLabel('Password lama').fill(temporaryPassword);
    await page.getByLabel('Password baru (12 karakter atau lebih)').fill(changedPassword);
    await page.getByRole('button', { name: 'Simpan password baru' }).click();
    await expect(page).toHaveURL(/\/akun$/);
    await expect(page.getByText('Role: Guru.')).toBeVisible();
    await page.goto('/admin/akun');
    await expect(page).toHaveURL(/\/akun$/);

    // Session storage is deliberately memory-only: reload demands a fresh login.
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await login(page, adminUsername, originalPassword);
    await expect(page).toHaveURL(/\/akun$/);
    await page.getByRole('link', { name: 'Kelola akun guru dan siswa' }).click();
    await expect(page.getByRole('textbox', { name: 'ID akun' })).toHaveCount(1);
    await page.getByRole('textbox', { name: 'ID akun' }).fill(teacherId);
    await page.getByRole('combobox', { name: 'Tindakan' }).selectOption('reset-password');
    await page.getByRole('button', { name: 'Jalankan' }).click();
    await expect(oneTime).toBeVisible();
    const resetPassword = await oneTime.innerText();
    assert.ok(resetPassword.length >= 12);
    await page.getByRole('button', { name: 'Sembunyikan' }).click();

    await page.getByRole('textbox', { name: 'ID akun' }).fill(teacherId);
    await page.getByRole('combobox', { name: 'Tindakan' }).selectOption('deactivate');
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Jalankan' }).click();
    await expect(page.locator('.lb-account-list').getByText(/Nonaktif/)).toBeVisible();
    await page.goto('/akun');
    await page.getByRole('button', { name: 'Keluar' }).click();
    await login(page, teacherUsername, resetPassword);
    await expect(page.getByRole('alert')).toContainText('Akun tidak aktif');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login with incorrect password cannot reach account dashboard', async ({ page }) => {
    await login(page, adminUsername, 'IncorrectPassword123!');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
