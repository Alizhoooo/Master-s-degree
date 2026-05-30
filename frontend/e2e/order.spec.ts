import { test, expect } from '@playwright/test';

test('тапсырыс жасау: логин → форма толтыру → тапсырыс жіберу', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@supplyflow.kz');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Redirect to dashboard
  await page.waitForURL('/');
  await expect(page.locator('text=Бүгінгі шолу')).toBeVisible();

  // 2. Go to Orders page via nav
  await page.click('text=Тапсырыстар');
  await page.waitForURL('/orders');
  await expect(page.locator('text=Тапсырыстар')).toBeVisible();

  // 3. Open create order modal
  await page.click('text=Жаңа тапсырыс');

  // 4. Fill the form
  const customerSelect = page.locator('.mantine-Modal-content .mantine-Select').first();
  await customerSelect.click();
  await customerSelect.locator('input').fill('ЖШС');
  await page.keyboard.press('Enter');

  const productSelect = page.locator('.mantine-Modal-content .mantine-Select').nth(1);
  await productSelect.click();
  await productSelect.locator('input').fill('Өнім');
  await page.keyboard.press('Enter');

  await page.fill('input[placeholder="Мекенжайды енгізіңіз"]', 'Тест мекенжай, 123');

  // 5. Submit order
  await page.click('button:has-text("Тапсырыс жасау")');

  // 6. Success notification appears
  await expect(page.locator('.mantine-Notification-title')).toHaveText('Сәтті');
});
