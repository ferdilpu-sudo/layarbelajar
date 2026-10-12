import { expect, test } from '@playwright/test';

test('login form is accessible and does not promise fake authentication without env', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Masuk ke LayarBelajar' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('textbox', { name: 'Username' }).fill('siswa_01');
  await page.getByLabel('Password', { exact: true }).fill('SyntheticPassword123');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toContainText('Supabase belum dikonfigurasi');
});

test('unauthenticated admin/account routes return user to login', async ({ page }) => {
  for (const path of ['/akun', '/ganti-password', '/admin/akun']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Masuk ke LayarBelajar' })).toBeVisible();
  }
});
