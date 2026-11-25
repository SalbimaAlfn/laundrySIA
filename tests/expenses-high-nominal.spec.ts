import { test, expect } from '@playwright/test';

test.describe('Expenses - high nominal entry', () => {
  test.beforeEach(async ({ page }) => {
    // Login as manager
    await page.goto('http://127.0.0.1:3001');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', 'manager');
    await page.fill('input[name="password"]', 'ChangeMe-Manager1');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('manager can save an expense with a high nominal (thousand separators)', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/expenses');
    await page.waitForLoadState('networkidle');

    // Open the add expense form
    await page.click('button:has-text("Tambah pengeluaran")');
    await page.waitForTimeout(300);

    // Fill category (already defaults), amount with thousand separators (rupiah style)
    await page.fill('input[name="amount"]', '10.000.000');

    // Submit
    await page.click('button:has-text("Simpan")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should show success toast, not a validation error
    await expect(page.locator('text=Jumlah terlalu besar, text=Amount is too large, text=Jumlah')).not.toBeVisible();
    await expect(page.locator('text=Pengeluaran ditambahkan, text=Expense added')).toBeVisible({ timeout: 5000 });

    // The high nominal should appear in the list (formatted)
    await expect(page.locator('text=Rp 10.000.000')).toBeVisible({ timeout: 5000 });
  });

  test('high nominal without separators is also accepted', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/expenses');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Tambah pengeluaran")');
    await page.waitForTimeout(300);

    await page.fill('input[name="amount"]', '50000000');
    await page.click('button:has-text("Simpan")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Pengeluaran ditambahkan, text=Expense added')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Rp 50.000.000')).toBeVisible({ timeout: 5000 });
  });
});
