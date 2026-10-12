import { expect, test } from '@playwright/test';

test('komponen memiliki mapping kategori, minimum target sentuh, dan tidak overflow', async ({
  page,
}, testInfo) => {
  await page.goto('/__ui');
  await expect(page.getByRole('heading', { name: 'Uji komponen LayarBelajar' })).toBeVisible();

  for (const [kind, expected] of [
    ['material', 'rgb(191, 219, 254)'],
    ['exercise', 'rgb(253, 230, 138)'],
    ['worksheet', 'rgb(191, 232, 213)'],
    ['game', 'rgb(221, 214, 254)'],
  ]) {
    await expect(page.locator('.card-art.kind-' + kind)).toHaveCSS('background-color', expected);
  }

  const measures = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.lb-button, .lb-chip, .lb-answer-option'),
    ).filter((button) => button.getClientRects().length > 0);
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      minHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
      bodyWidth: document.body.scrollWidth,
    };
  });
  expect(measures.documentWidth).toBeLessThanOrEqual(measures.viewportWidth);
  expect(measures.bodyWidth).toBeLessThanOrEqual(measures.viewportWidth);
  expect(measures.minHeight).toBeGreaterThanOrEqual(44);

  const imagePath = testInfo.outputPath('ui-components.png');
  await page.screenshot({ path: imagePath, fullPage: true, animations: 'disabled' });
  await testInfo.attach('ui-components-visual-review', {
    path: imagePath,
    contentType: 'image/png',
  });
});

test('aksesibilitas tombol, input, chip, pilihan dan dialog', async ({ page }) => {
  await page.goto('/__ui');
  await expect(page.getByRole('button', { name: 'Memproses' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Memproses' })).toHaveAttribute(
    'aria-busy',
    'true',
  );
  await expect(page.getByRole('textbox', { name: 'Judul wajib' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(page.getByText('Judul wajib diisi')).toBeVisible();

  const chip = page.getByRole('button', { name: /Materi/ });
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'false');

  const answer = page.getByRole('button', { name: /Pilihan A/ });
  await answer.click();
  await expect(answer).toHaveAttribute('aria-pressed', 'true');
  await expect(answer.getByText('✓')).toBeVisible();

  const trigger = page.getByRole('button', { name: 'Buka dialog' });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Contoh dialog' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Tutup' })).toBeFocused();
  await page.keyboard.press('Tab');
  const focusStillInDialog = await page.evaluate(() => {
    const modal = document.querySelector('dialog');
    return Boolean(
      modal && (modal === document.activeElement || modal.contains(document.activeElement)),
    );
  });
  expect(focusStillInDialog).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const node = document.activeElement;
    return node instanceof HTMLElement ? getComputedStyle(node).outlineWidth : '';
  });
  expect(focused).toBe('3px');
});

test('prefers-reduced-motion dan print meniadakan animasi serta bayangan', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/__ui');
  const button = page.getByRole('button', { name: 'Utama' });
  await expect(button).toHaveCSS('transition-duration', '0s');

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await expect(page.locator('.lb-card').first()).toHaveCSS('box-shadow', 'none');
  await expect(page.locator('.site-header')).toHaveCSS('display', 'none');
});
