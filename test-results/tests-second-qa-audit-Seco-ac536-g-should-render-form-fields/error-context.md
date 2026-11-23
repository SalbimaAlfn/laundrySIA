# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\second-qa-audit.spec.ts >> Second QA Audit - Manager Regression >> D-04: Service creation dialog should render form fields
- Location: tests\second-qa-audit.spec.ts:182:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[name="estimatedDays"], input[id*="estimatedDays"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('input[name="estimatedDays"], input[id*="estimatedDays"]') with timeout 5000ms
  - waiting for locator('input[name="estimatedDays"], input[id*="estimatedDays"]')

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
  - heading "Pengaturan" [level=1]
  - search:
    - text: Cari pesanan atau pelanggan
    - searchbox "Cari pesanan atau pelanggan"
- main:
  - paragraph: Atur layanan yang bisa dipilih saat membuat pesanan.
  - button "Tambah layanan"
  - table "Daftar layanan":
    - caption: Daftar layanan
    - rowgroup:
      - row "Nama layanan Satuan Harga Estimasi selesai Status":
        - columnheader "Nama layanan"
        - columnheader "Satuan"
        - columnheader "Harga"
        - columnheader "Estimasi selesai"
        - columnheader "Status"
        - columnheader
    - rowgroup:
      - row "Cuci + setrika Kg Rp 8.000 2 hari Aktif Ubah Nonaktifkan":
        - cell "Cuci + setrika"
        - cell "Kg"
        - cell "Rp 8.000"
        - cell "2 hari"
        - cell "Aktif"
        - cell "Ubah Nonaktifkan":
          - button "Ubah"
          - button "Nonaktifkan"
      - row "Express Kg Rp 12.000 1 hari Aktif Ubah Nonaktifkan":
        - cell "Express"
        - cell "Kg"
        - cell "Rp 12.000"
        - cell "1 hari"
        - cell "Aktif"
        - cell "Ubah Nonaktifkan":
          - button "Ubah"
          - button "Nonaktifkan"
      - row "Kiloan Kg Rp 7.000 3 hari Aktif Ubah Nonaktifkan":
        - cell "Kiloan"
        - cell "Kg"
        - cell "Rp 7.000"
        - cell "3 hari"
        - cell "Aktif"
        - cell "Ubah Nonaktifkan":
          - button "Ubah"
          - button "Nonaktifkan"
  - dialog "Layanan baru":
    - heading "Layanan baru" [level=2]
    - button "Tutup dialog"
    - text: Nama layanan
    - textbox "Nama layanan"
    - paragraph: Contoh Cuci kering, Cuci setrika, Setrika saja.
    - text: Satuan
    - combobox "Satuan":
      - option "Kg" [selected]
      - option "Satuan"
    - text: Harga
    - textbox "Harga"
    - paragraph: Per kg atau per satuan, dalam rupiah.
    - text: Estimasi selesai (hari)
    - spinbutton "Estimasi selesai (hari)": "1"
    - paragraph: 0 berarti selesai di hari yang sama.
    - checkbox "Layanan aktif dan bisa dipilih saat membuat pesanan" [checked]
    - text: Layanan aktif dan bisa dipilih saat membuat pesanan
    - button "Batal"
    - button "Simpan layanan"
- alert
```

# Test source

```ts
  93  |     console.log('Weight after + click:', newWeight);
  94  |     
  95  |     // Verify price updates (should be 2kg * 8000 = 16000)
  96  |     await page.waitForTimeout(500);
  97  |     const subtotalAfter = await page.locator('text=Subtotal').locator('..').textContent();
  98  |     const totalAfter = await page.locator('text=Total').locator('..').textContent();
  99  |     console.log('Subtotal after weight change:', subtotalAfter);
  100 |     console.log('Total after weight change:', totalAfter);
  101 |     
  102 |     // Submit order
  103 |     await page.click('button:has-text("Simpan pesanan")');
  104 |     await page.waitForLoadState('networkidle');
  105 |     await page.waitForTimeout(1000);
  106 |     
  107 |     // Verify saved ticket shown
  108 |     await expect(page.locator('text=Pesanan tersimpan, text=Struk pesanan, text=Invoice').first()).toBeVisible({ timeout: 5000 });
  109 |   });
  110 | 
  111 |   test('D-01: Form validation should block submission without customer', async ({ page }) => {
  112 |     await page.goto('http://127.0.0.1:3001/orders/new');
  113 |     await page.waitForLoadState('networkidle');
  114 |     
  115 |     // Select service but no customer
  116 |     await page.selectOption('select[id="service-1"]', '1'); // Cuci + setrika
  117 |     await page.waitForTimeout(300);
  118 |     
  119 |     await page.click('button:has-text("Simpan pesanan")');
  120 |     await page.waitForTimeout(500);
  121 |     
  122 |     // Should show validation error
  123 |     await expect(page.locator('text=Customer harus dipilih')).toBeVisible({ timeout: 3000 });
  124 |   });
  125 | 
  126 |   test('D-01: Form validation should block submission without service', async ({ page }) => {
  127 |     await page.goto('http://127.0.0.1:3001/orders/new');
  128 |     await page.waitForLoadState('networkidle');
  129 |     
  130 |     // Select customer but no service (default select value is empty)
  131 |     await page.locator('[role="combobox"]').first().click();
  132 |     await page.waitForTimeout(300);
  133 |     await page.locator('[role="option"]:has-text("QA Test Customer")').click();
  134 |     await page.waitForTimeout(300);
  135 |     
  136 |     await page.click('button:has-text("Simpan pesanan")');
  137 |     await page.waitForTimeout(500);
  138 |     
  139 |     // Should show validation error
  140 |     await expect(page.locator('text=Layanan harus dipilih')).toBeVisible({ timeout: 3000 });
  141 |   });
  142 | 
  143 |   test('Authorization: Cashier should be blocked from manager pages', async ({ page }) => {
  144 |     const managerPages = ['/reports', '/settings', '/dashboard', '/expenses', '/stock', '/audit'];
  145 |     
  146 |     for (const managerPage of managerPages) {
  147 |       await page.goto(`http://127.0.0.1:3001${managerPage}`);
  148 |       await page.waitForLoadState('networkidle');
  149 |       
  150 |       // Should redirect to /counter with notice
  151 |       await expect(page).toHaveURL(/.*\/counter\?notice=manager-only/);
  152 |       
  153 |       // Check for alert message
  154 |       await expect(page.locator('text=Hanya manajer yang dapat membuka halaman itu')).toBeVisible({ timeout: 3000 });
  155 |     }
  156 |   });
  157 | 
  158 |   test('Logout should terminate session', async ({ page }) => {
  159 |     await page.click('button:has-text("Keluar")');
  160 |     await page.waitForLoadState('networkidle');
  161 |     await expect(page).toHaveURL(/.*\/login\?notice=loggedOut/);
  162 |     
  163 |     // Try to access protected page
  164 |     await page.goto('http://127.0.0.1:3001/counter');
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
> 193 |     await expect(page.locator('input[name="estimatedDays"], input[id*="estimatedDays"]')).toBeVisible();
      |                                                                                           ^ Error: expect(locator).toBeVisible() failed
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
  265 |     await expect(page.locator('text=QA Test Customer')).toBeVisible({ timeout: 5000 });
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
```