import { test, expect } from '@playwright/test';

test('Check if required files for tokenizer and onnx model are loaded and served to the page', async ({ page }) => {
  const requests: [] = [];
  page.on('response', (res) => {
    if (
      res.url().endsWith('vocab_all_18k.json') ||
      res.url().endsWith('mail_180226_02.onnx') ||
      res.url().endsWith('tokenizer.wasm') ||
      res.url().endsWith('merges_all_18k.txt')
    )
      requests.push([res.url(), res.status()]);
  });
  await page.goto('/spam-demo');
  await page.waitForLoadState('networkidle');
  console.log(requests);
  await expect(requests.length == 5).toBe(true);
  await expect(requests.every((x) => x[1] == 200)).toBe(true);
});

test('Button click ham', async ({ page }) => {
  await page.goto('/spam-demo');
  await page.click('#evaluate');
  await expect(page.locator('#result')).toHaveText('This mail is: ham');
  await expect(page.locator('#output')).toContainText('');
});

test('Button click spam', async ({ page }) => {
  await page.goto('/spam-demo');
  await page.fill(
    '#mailInput',
    'MULTA NO PAGADA - bloque de vehiculos Saludos Cordiales Tienes una multa pendiente Se ha identificado en nuestro sistema una multa de trafico no pagada dirigida a usted o su vehiculo.',
  );
  await page.click('#evaluate');
  await expect(page.locator('#result')).toHaveText('This mail is: spam');
  await expect(page.locator('#output')).toContainText('Your document was labeled as');
});

test('Button should not show explanation if ham after spam', async ({ page }) => {
  await page.goto('/spam-demo');
  await page.fill(
    '#mailInput',
    'MULTA NO PAGADA - bloque de vehiculos Saludos Cordiales Tienes una multa pendiente Se ha identificado en nuestro sistema una multa de trafico no pagada dirigida a usted o su vehiculo.',
  );
  await page.click('#evaluate');
  await page.fill('#mailInput', 'Content of the message...');
  await page.click('#evaluate');
  await expect(page.locator('#result')).toHaveText('This mail is: ham');
  await expect(page.locator('#output')).toContainText('');
});
