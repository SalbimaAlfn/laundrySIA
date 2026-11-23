# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\second-qa-audit.spec.ts >> Second QA Audit - Manager Regression >> Cross-role: Manager can see cashier-created order
- Location: tests\second-qa-audit.spec.ts:260:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=QA Test Customer')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=QA Test Customer') with timeout 5000ms
  - waiting for locator('text=QA Test Customer')

```

```yaml
- link "Lewati ke konten":
  - /url: "#main-content"
- complementary:
  - link "LaundrySIA":
    - /url: /dashboard
  - navigation "Navigasi utama":
    - link "Dashboard":
      - /url: /dashboard
    - link "Counter":
      - /url: /counter
    - link "Pesanan":
      - /url: /orders
    - link "Pelanggan":
      - /url: /customers
    - link "Piutang":
      - /url: /receivables
    - link "Laporan":
      - /url: /reports
    - link "Pengeluaran":
      - /url: /expenses
    - link "Stok":
      - /url: /stock
    - link "Pengaturan":
      - /url: /settings
    - link "Audit":
      - /url: /audit
  - text: Manajer Manajer
  - button "Keluar"
- banner:
  - heading "Pesanan" [level=1]
  - search:
    - text: Cari pesanan atau pelanggan
    - searchbox "Cari pesanan atau pelanggan"
- main:
  - paragraph:
    - text: "Total pesanan:"
    - strong: "1"
    - text: pesanan
  - link "Pesanan baru":
    - /url: /orders/new
    - button "Pesanan baru"
  - combobox "Status":
    - option "Semua status" [selected]
    - option "Diterima"
    - option "Dicuci"
    - option "Pengeringan dan setrika"
    - option "Siap diambil"
    - option "Selesai"
  - textbox "Tanggal"
  - searchbox "Pelanggan"
  - searchbox "Invoice"
  - combobox "Pembayaran":
    - option "Semua pembayaran" [selected]
    - option "Belum dibayar"
    - option "Sebagian"
    - option "Dibayar"
  - button "Cari"
  - table "Daftar pesanan":
    - caption: Daftar pesanan
    - rowgroup:
      - row "Invoice Tanggal Pelanggan Total Dibayar Sisa Status":
        - columnheader "Invoice"
        - columnheader "Tanggal"
        - columnheader "Pelanggan"
        - columnheader "Total"
        - columnheader "Dibayar"
        - columnheader "Sisa"
        - columnheader "Status"
        - columnheader
    - rowgroup:
      - row "INV-20261122-001 22/11/2026 hari Rp 12.000 Rp 12.000 - Selesai Lihat":
        - cell "INV-20261122-001":
          - link "INV-20261122-001":
            - /url: /orders/1
        - cell "22/11/2026"
        - cell "hari"
        - cell "Rp 12.000"
        - cell "Rp 12.000"
        - cell "-"
        - cell "Selesai"
        - cell "Lihat":
          - link "Lihat":
            - /url: /orders/1
- alert
```

# Test source

```ts
  165 |     await page.waitForLoadState('networkidle');
  166 |     await expect(page).toHaveURL(/.*\/login/);
  167 |   });
  168 | });
  169 | 
  170 | test.describe('Second QA Audit - Manager Regression', () => {
  171 |   test.beforeEach(async ({ page }) => {
  172 |     // Login as manager
  173 |     await page.goto('http://127.0.0.1:3001');
  174 |     await page.waitForLoadState('networkidle');
  175 |     await page.fill('input[name="username"]', 'manager');
  176 |     await page.fill('input[name="password"]', 'ChangeMe-Manager1');
  177 |     await page.click('button[type="submit"]');
  178 |     await page.waitForLoadState('networkidle');
  179 |     await expect(page).toHaveURL(/.*\/dashboard/);
  180 |   });
  181 | 
  182 |   test('D-04: Service creation dialog should render form fields', async ({ page }) => {
  183 |     await page.goto('http://127.0.0.1:3001/settings/services');
  184 |     await page.waitForLoadState('networkidle');
  185 |     
  186 |     await page.click('button:has-text("Tambah layanan")');
  187 |     await page.waitForTimeout(1000);
  188 |     
  189 |     // Verify dialog has form fields
  190 |     await expect(page.locator('input[name="name"], input[id*="name"]')).toBeVisible();
  191 |     await expect(page.locator('select[name="unit"]')).toBeVisible();
  192 |     await expect(page.locator('input[id="service-price-add"]')).toBeVisible();
  193 |     await expect(page.locator('input[name="estimatedDays"], input[id*="estimatedDays"]')).toBeVisible();
  194 |     await expect(page.locator('button:has-text("Simpan")')).toBeVisible();
  195 |     await expect(page.locator('button:has-text("Batal")')).toBeVisible();
  196 |     
  197 |     // Create a service
  198 |     await page.fill('input[name="name"], input[id*="name"]', 'QA Test Service');
  199 |     await page.selectOption('select[name="unit"]', 'KG');
  200 |     await page.fill('input[id="service-price-add"]', '5000');
  201 |     await page.fill('input[name="estimatedDays"], input[id*="estimatedDays"]', '2');
  202 |     await page.click('button:has-text("Simpan")');
  203 |     await page.waitForLoadState('networkidle');
  204 |     await page.waitForTimeout(1000);
  205 |     
  206 |     // Verify service appears in table
  207 |     await expect(page.locator('text=QA Test Service')).toBeVisible();
  208 |   });
  209 | 
  210 |   test('Service edit dialog should work', async ({ page }) => {
  211 |     await page.goto('http://127.0.0.1:3001/settings/services');
  212 |     await page.waitForLoadState('networkidle');
  213 |     
  214 |     // Click edit on first service
  215 |     await page.locator('button:has-text("Ubah")').first().click();
  216 |     await page.waitForTimeout(500);
  217 |     
  218 |     // Verify pre-filled form
  219 |     await expect(page.locator('input[name="name"], input[id*="name"]')).toBeVisible();
  220 |     const nameValue = await page.locator('input[name="name"], input[id*="name"]').first().inputValue();
  221 |     console.log('Editing service:', nameValue);
  222 |     
  223 |     // Cancel
  224 |     await page.click('button:has-text("Batal")');
  225 |     await page.waitForTimeout(300);
  226 |   });
  227 | 
  228 |   test('Service deactivation should work', async ({ page }) => {
  229 |     await page.goto('http://127.0.0.1:3001/settings/services');
  230 |     await page.waitForLoadState('networkidle');
  231 |     
  232 |     // Click deactivate on first service
  233 |     await page.locator('button:has-text("Nonaktifkan")').first().click();
  234 |     await page.waitForTimeout(500);
  235 |     
  236 |     // Check for toast confirmation
  237 |     await expect(page.locator('text=dinonaktifkan, text=nonaktif, text=berhasil').first()).toBeVisible({ timeout: 3000 });
  238 |   });
  239 | 
  240 |   test('Manager can access all manager pages', async ({ page }) => {
  241 |     const managerPages = [
  242 |       { url: '/dashboard', title: 'Dashboard' },
  243 |       { url: '/orders', title: 'Daftar pesanan' },
  244 |       { url: '/customers', title: 'Pelanggan' },
  245 |       { url: '/receivables', title: 'Piutang' },
  246 |       { url: '/reports', title: 'Laporan' },
  247 |       { url: '/expenses', title: 'Pengeluaran' },
  248 |       { url: '/stock', title: 'Stok' },
  249 |       { url: '/settings', title: 'Pengaturan' },
  250 |       { url: '/audit', title: 'Audit' },
  251 |     ];
  252 |     
  253 |     for (const pg of managerPages) {
  254 |       await page.goto(`http://127.0.0.1:3001${pg.url}`);
  255 |       await page.waitForLoadState('networkidle');
  256 |       console.log(`✅ ${pg.url} accessible`);
  257 |     }
  258 |   });
  259 | 
  260 |   test('Cross-role: Manager can see cashier-created order', async ({ page }) => {
  261 |     await page.goto('http://127.0.0.1:3001/orders');
  262 |     await page.waitForLoadState('networkidle');
  263 |     
  264 |     // Should see the order created by cashier
> 265 |     await expect(page.locator('text=QA Test Customer')).toBeVisible({ timeout: 5000 });
      |                                                         ^ Error: expect(locator).toBeVisible() failed
  266 |   });
  267 | 
  268 |   test('Cross-role: Manager can see cashier-created customer', async ({ page }) => {
  269 |     await page.goto('http://127.0.0.1:3001/customers');
  270 |     await page.waitForLoadState('networkidle');
  271 |     
  272 |     await expect(page.locator('text=QA Test Customer')).toBeVisible();
  273 |   });
  274 | 
  275 |   test('Cross-role: Cashier can see manager-created service', async ({ page }) => {
  276 |     // This would require switching back to cashier, skip for now
  277 |     console.log('Cross-role service test requires role switch');
  278 |   });
  279 | });
  280 | 
  281 | test.describe('Second QA Audit - Technical Checks', () => {
  282 |   test('Favicon should load without 404', async ({ page }) => {
  283 |     const response = await page.goto('http://127.0.0.1:3001/favicon.svg');
  284 |     expect(response?.status()).toBe(200);
  285 |   });
  286 | 
  287 |   test('No console errors on main pages', async ({ page }) => {
  288 |     const errors: string[] = [];
  289 |     page.on('console', msg => {
  290 |       if (msg.type() === 'error') errors.push(msg.text());
  291 |     });
  292 |     page.on('pageerror', err => errors.push(err.message));
  293 |     
  294 |     const pages = ['/counter', '/orders', '/orders/new', '/customers', '/settings/services'];
  295 | 
  296 |     for (const pg of pages) {
  297 |       await page.goto(`http://127.0.0.1:3001${pg}`);
  298 |       await page.waitForLoadState('networkidle');
  299 |       await page.waitForTimeout(500);
  300 |     }
  301 |     
  302 |     console.log('Console errors:', errors);
  303 |     // Filter out known non-critical errors
  304 |     const criticalErrors = errors.filter(e => 
  305 |       !e.includes('favicon') && 
  306 |       !e.includes('webpack') &&
  307 |       !e.includes('hot-update')
  308 |     );
  309 |     expect(criticalErrors.length).toBe(0);
  310 |   });
  311 | 
  312 |   test('Responsive layout on mobile viewport', async ({ page }) => {
  313 |     await page.setViewportSize({ width: 375, height: 667 });
  314 |     await page.goto('http://127.0.0.1:3001/login');
  315 |     await page.waitForLoadState('networkidle');
  316 |     
  317 |     // Check login form is visible and usable
  318 |     await expect(page.locator('input[name="username"]')).toBeVisible();
  319 |     await expect(page.locator('input[name="password"]')).toBeVisible();
  320 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  321 |   });
  322 | });
```