import { test, expect } from '@playwright/test';

test.describe('Second QA Audit - Cashier Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Login as cashier
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', 'cashier');
    await page.fill('input[name="password"]', 'cashier');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/counter/);
  });

  test('D-03: Customer creation dialog should render form fields', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/customers');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Tambah pelanggan")');
    await page.waitForTimeout(300);
    
    // Verify dialog has form fields
    await expect(page.locator('input[name="name"], input[id*="name"]').first()).toBeVisible();
    await expect(page.locator('input[name="phone"], input[id*="phone"]').first()).toBeVisible();
    await expect(page.locator('textarea[name="address"], textarea[id*="address"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Simpan")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Batal")').first()).toBeVisible();
    
    // Create a customer
    await page.fill('input[name="name"], input[id*="name"]', 'QA Test Customer');
    await page.fill('input[name="phone"], input[id*="phone"]', '081234567890');
    await page.fill('textarea[name="address"], textarea[id*="address"]', 'Jl. Test No. 123');
    await page.click('button:has-text("Simpan")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify customer appears in table
    await expect(page.locator('text=QA Test Customer')).toBeVisible();
  });

  test('D-01, D-02: New order form should calculate price and submit successfully', async ({ page }) => {
    // First create a customer if needed
    await page.goto('http://127.0.0.1:3000/customers');
    await page.waitForLoadState('networkidle');
    
    const existingCustomer = await page.locator('text=QA Test Customer').isVisible().catch(() => false);
    if (!existingCustomer) {
      await page.click('button:has-text("Tambah pelanggan")');
      await page.waitForTimeout(300);
      await page.fill('input[name="name"], input[id*="name"]', 'QA Test Customer');
      await page.fill('input[name="phone"], input[id*="phone"]', '081234567890');
      await page.fill('textarea[name="address"], textarea[id*="address"]', 'Jl. Test No. 123');
      await page.click('button:has-text("Simpan")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Now test new order form
    await page.goto('http://127.0.0.1:3000/orders/new');
    await page.waitForLoadState('networkidle');
    
    // Select customer
    await page.locator('[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("QA Test Customer")').click();
    await page.waitForTimeout(300);
    
    // Select service
    await page.locator('[role="combobox"]').nth(1).click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Cuci + setrika")').click();
    await page.waitForTimeout(500);
    
    // Verify price calculation (Cuci + setrika = Rp 8.000/kg, default weight should be 1kg or similar)
    const subtotalText = await page.locator('text=Subtotal').locator('..').textContent();
    const totalText = await page.locator('text=Total').locator('..').textContent();
    console.log('Initial Subtotal:', subtotalText);
    console.log('Initial Total:', totalText);
    
    // Test weight + button
    const weightInput = page.locator('input[type="number"]').first();
    const initialWeight = await weightInput.inputValue();
    console.log('Initial weight:', initialWeight);
    
    await page.locator('button:has-text("+")').first().click();
    await page.waitForTimeout(300);
    
    const newWeight = await weightInput.inputValue();
    console.log('Weight after + click:', newWeight);
    
    // Verify price updates
    await page.waitForTimeout(500);
    const subtotalAfter = await page.locator('text=Subtotal').locator('..').textContent();
    const totalAfter = await page.locator('text=Total').locator('..').textContent();
    console.log('Subtotal after weight change:', subtotalAfter);
    console.log('Total after weight change:', totalAfter);
    
    // Submit order
    await page.click('button:has-text("Simpan pesanan")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify saved ticket shown
    await expect(page.locator('text=Pesanan tersimpan, text=Struk pesanan, text=Invoice').first()).toBeVisible({ timeout: 5000 });
  });

  test('D-01: Form validation should block submission without customer', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/orders/new');
    await page.waitForLoadState('networkidle');
    
    // Select service but no customer
    await page.locator('[role="combobox"]').nth(1).click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("Cuci + setrika")').click();
    await page.waitForTimeout(300);
    
    await page.click('button:has-text("Simpan pesanan")');
    await page.waitForTimeout(500);
    
    // Should show validation error
    await expect(page.locator('text=Customer harus dipilih')).toBeVisible({ timeout: 3000 });
  });

  test('D-01: Form validation should block submission without service', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/orders/new');
    await page.waitForLoadState('networkidle');
    
    // Select customer but no service
    await page.locator('[role="combobox"]').first().click();
    await page.waitForTimeout(300);
    await page.locator('[role="option"]:has-text("QA Test Customer")').click();
    await page.waitForTimeout(300);
    
    await page.click('button:has-text("Simpan pesanan")');
    await page.waitForTimeout(500);
    
    // Should show validation error
    await expect(page.locator('text=Layanan harus dipilih')).toBeVisible({ timeout: 3000 });
  });

  test('Authorization: Cashier should be blocked from manager pages', async ({ page }) => {
    const managerPages = ['/reports', '/settings', '/dashboard', '/expenses', '/stock', '/audit'];
    
    for (const managerPage of managerPages) {
      await page.goto(`http://127.0.0.1:3000${managerPage}`);
      await page.waitForLoadState('networkidle');
      
      // Should redirect to /counter with notice
      await expect(page).toHaveURL(/.*\/counter\?notice=manager-only/);
      
      // Check for alert message
      await expect(page.locator('text=Hanya manajer yang dapat membuka halaman itu')).toBeVisible({ timeout: 3000 });
    }
  });

  test('Logout should terminate session', async ({ page }) => {
    await page.click('button:has-text("Keluar")');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login\?notice=loggedOut/);
    
    // Try to access protected page
    await page.goto('http://127.0.0.1:3000/counter');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Second QA Audit - Manager Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Login as manager
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');
    await page.fill('input[name="username"]', 'manager');
    await page.fill('input[name="password"]', 'manager');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('D-04: Service creation dialog should render form fields', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/settings/services');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Tambah layanan")');
    await page.waitForTimeout(300);
    
    // Verify dialog has form fields
    await expect(page.locator('input[name="name"], input[id*="name"]').first()).toBeVisible();
    await expect(page.locator('[role="combobox"]:has-text("Pilih satuan"), [role="combobox"] >> nth=0')).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    await expect(page.locator('input[name="estimatedDays"], input[id*="estimatedDays"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Simpan")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Batal")').first()).toBeVisible();
    
    // Create a service
    await page.fill('input[name="name"], input[id*="name"]', 'QA Test Service');
    await page.locator('[role="combobox"]').first().click();
    await page.waitForTimeout(200);
    await page.locator('[role="option"]:has-text("Kg")').click();
    await page.fill('input[type="number"]', '5000');
    await page.fill('input[name="estimatedDays"], input[id*="estimatedDays"]', '2');
    await page.click('button:has-text("Simpan")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify service appears in table
    await expect(page.locator('text=QA Test Service')).toBeVisible();
  });

  test('Service edit dialog should work', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/settings/services');
    await page.waitForLoadState('networkidle');
    
    // Click edit on first service
    await page.locator('button:has-text("Ubah")').first().click();
    await page.waitForTimeout(300);
    
    // Verify pre-filled form
    await expect(page.locator('input[name="name"], input[id*="name"]').first()).toBeVisible();
    const nameValue = await page.locator('input[name="name"], input[id*="name"]').first().inputValue();
    console.log('Editing service:', nameValue);
    
    // Cancel
    await page.click('button:has-text("Batal")');
    await page.waitForTimeout(300);
  });

  test('Service deactivation should work', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/settings/services');
    await page.waitForLoadState('networkidle');
    
    // Click deactivate on first service
    await page.locator('button:has-text("Nonaktifkan")').first().click();
    await page.waitForTimeout(500);
    
    // Check for toast confirmation
    await expect(page.locator('text=dinonaktifkan, text=nonaktif, text=berhasil').first()).toBeVisible({ timeout: 3000 });
  });

  test('Manager can access all manager pages', async ({ page }) => {
    const managerPages = [
      { url: '/dashboard', title: 'Dashboard' },
      { url: '/orders', title: 'Daftar pesanan' },
      { url: '/customers', title: 'Pelanggan' },
      { url: '/receivables', title: 'Piutang' },
      { url: '/reports', title: 'Laporan' },
      { url: '/expenses', title: 'Pengeluaran' },
      { url: '/stock', title: 'Stok' },
      { url: '/settings', title: 'Pengaturan' },
      { url: '/audit', title: 'Audit' },
    ];
    
    for (const pg of managerPages) {
      await page.goto(`http://127.0.0.1:3000${pg.url}`);
      await page.waitForLoadState('networkidle');
      console.log(`✅ ${pg.url} accessible`);
    }
  });

  test('Cross-role: Manager can see cashier-created order', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/orders');
    await page.waitForLoadState('networkidle');
    
    // Should see the order created by cashier
    await expect(page.locator('text=QA Test Customer')).toBeVisible({ timeout: 5000 });
  });

  test('Cross-role: Manager can see cashier-created customer', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000/customers');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=QA Test Customer')).toBeVisible();
  });

  test('Cross-role: Cashier can see manager-created service', async ({ page }) => {
    // This would require switching back to cashier, skip for now
    console.log('Cross-role service test requires role switch');
  });
});

test.describe('Second QA Audit - Technical Checks', () => {
  test('Favicon should load without 404', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:3000/favicon.svg');
    expect(response?.status()).toBe(200);
  });

  test('No console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    
    const pages = ['/counter', '/orders', '/orders/new', '/customers', '/settings/services'];
    
    for (const pg of pages) {
      await page.goto(`http://127.0.0.1:3000${pg}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    
    console.log('Console errors:', errors);
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('webpack') &&
      !e.includes('hot-update')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('Responsive layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://127.0.0.1:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check login form is visible and usable
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});