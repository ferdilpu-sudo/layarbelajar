import { expect, test } from '@playwright/test';

test('katalog publik dapat dicari, difilter, direset dan tanpa overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mau belajar apa hari ini?' })).toBeVisible();
  await expect(page.getByText('6 contoh konten ditemukan.')).toBeVisible();
  await page.getByRole('searchbox', { name: 'Cari materi atau topik' }).fill('pecahan');
  await expect(page.getByText('1 contoh konten ditemukan.')).toBeVisible();
  await page.getByRole('button', { name: 'Game' }).click();
  await expect(page.getByText('Belum ada konten yang cocok')).toBeVisible();
  await page.getByRole('button', { name: 'Tampilkan semua' }).click();
  await expect(page.getByText('6 contoh konten ditemukan.')).toBeVisible();
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(noOverflow).toBeTruthy();
});

test('draf tidak tersedia lewat URL publik', async ({ page }) => {
  await page.goto('/konten/rahasia-draf');
  await expect(page.getByText('Konten tidak ditemukan atau belum diterbitkan.')).toBeVisible();
});
