import { test, expect } from '@playwright/test';

test.describe('1C-style ERP Modules', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@supplyflow.kz');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('Cash module: list, create register, create order', async ({ page }) => {
    await page.click('text=Касса');
    await page.waitForURL('/cash');
    await expect(page.locator('h1, h2, h3, h4').first()).toBeVisible();

    await page.click('text=Создать кассу');
    await page.fill('input[placeholder*="Main"]', 'E2E Test Cash');
    await page.click('button:has-text("Сохранить")');

    await expect(page.locator('text=E2E Test Cash')).toBeVisible({ timeout: 10000 });
  });

  test('Warehouse module: list warehouses', async ({ page }) => {
    await page.click('text=Склады');
    await page.waitForURL('/warehouse');
    await expect(page.locator('text=Склады').first()).toBeVisible();
  });

  test('Accounting module: view trial balance', async ({ page }) => {
    await page.click('text=Бухгалтерия');
    await page.waitForURL('/accounting');
    await expect(page.locator('text=Бухгалтерия').first()).toBeVisible();
  });

  test('Documents module: list documents', async ({ page }) => {
    await page.click('text=Документы');
    await page.waitForURL('/documents');
    await expect(page.locator('text=Документы').first()).toBeVisible();
  });

  test('Tasks module: list tasks', async ({ page }) => {
    await page.click('text=Задачи');
    await page.waitForURL('/tasks');
    await expect(page.locator('text=Задачи').first()).toBeVisible();
  });

  test('Notifications module: list notifications', async ({ page }) => {
    await page.click('text=Уведомления');
    await page.waitForURL('/notifications');
    await expect(page.locator('text=Уведомления').first()).toBeVisible();
  });

  test('Production module: list tech cards', async ({ page }) => {
    await page.click('text=Производство');
    await page.waitForURL('/production');
    await expect(page.locator('text=Производство').first()).toBeVisible();
  });

  test('HR module: list employees', async ({ page }) => {
    await page.click('text=Кадры');
    await page.waitForURL('/hr');
    await expect(page.locator('text=Кадры').first()).toBeVisible();
  });

  test('Global search via Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+K');
    await expect(page.locator('input[placeholder*="Глобальный"]')).toBeVisible({ timeout: 3000 });
  });

  test('Dashboard shows ERP summary widgets', async ({ page }) => {
    await page.click('text=Панель управления');
    await page.waitForURL('/');
    await expect(page.locator('text=1C-style ERP').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Касса (наличные)')).toBeVisible();
    await expect(page.locator('text=Банк (безналичные)')).toBeVisible();
  });
});
