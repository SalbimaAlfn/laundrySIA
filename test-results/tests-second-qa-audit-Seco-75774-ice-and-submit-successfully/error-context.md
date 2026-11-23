# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\second-qa-audit.spec.ts >> Second QA Audit - Cashier Regression >> D-01, D-02: New order form should calculate price and submit successfully
- Location: tests\second-qa-audit.spec.ts:41:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('textarea[name="address"], textarea[id*="address"]')

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - link "Lewati ke konten" [ref=f1e3] [cursor=pointer]:
      - /url: "#main-content"
    - complementary [ref=f1e4]:
      - link "LaundrySIA" [ref=f1e5] [cursor=pointer]:
        - /url: /counter
      - navigation "Navigasi utama" [ref=f1e11]:
        - link "Counter" [ref=f1e12] [cursor=pointer]:
          - /url: /counter
        - link "Pesanan" [ref=f1e17] [cursor=pointer]:
          - /url: /orders
        - link "Pelanggan" [ref=f1e21] [cursor=pointer]:
          - /url: /customers
      - generic [ref=f1e28]:
        - generic [ref=f1e29]:
          - generic [ref=f1e30]: Kasir
          - generic [ref=f1e31]: Kasir
        - button "Keluar" [ref=f1e33] [cursor=pointer]
    - generic [ref=f1e38]:
      - banner [ref=f1e39]:
        - heading "Pelanggan" [level=1] [ref=f1e40]
        - search [ref=f1e41]:
          - generic [ref=f1e45]: Cari pesanan atau pelanggan
          - searchbox "Cari pesanan atau pelanggan" [ref=f1e46]
      - main [ref=f1e47]:
        - generic [ref=f1e48]:
          - generic [ref=f1e49]:
            - paragraph [ref=f1e50]: Cari pelanggan, atau tambahkan yang baru.
            - button "Tambah pelanggan" [ref=f1e51] [cursor=pointer]
          - search [ref=f1e53]:
            - generic [ref=f1e54]: Cari pelanggan
            - searchbox "Cari pelanggan" [ref=f1e56]
            - button "Cari" [ref=f1e57] [cursor=pointer]
          - table "Daftar pelanggan" [ref=f1e60]:
            - caption [ref=f1e61]: Daftar pelanggan
            - rowgroup [ref=f1e62]:
              - row [ref=f1e63]:
                - columnheader "Nama" [ref=f1e64]
                - columnheader "Nomor telepon" [ref=f1e65]
                - columnheader "Alamat (opsional)" [ref=f1e66]
                - columnheader "Status" [ref=f1e67]
                - columnheader [ref=f1e68]
            - rowgroup [ref=f1e69]:
              - row [ref=f1e70]:
                - cell "hari" [ref=f1e71]
                - cell "0883313921" [ref=f1e72]
                - cell "Jalan Abdul Gani" [ref=f1e73]
                - cell "Aktif" [ref=f1e74]
                - cell [ref=f1e76]:
                  - button "Ubah" [ref=f1e78] [cursor=pointer]
              - row [ref=f1e82]:
                - cell "QA-PI Customer" [ref=f1e83]
                - cell "081234567890" [ref=f1e84]
                - cell "—" [ref=f1e85]
                - cell "Aktif" [ref=f1e86]
                - cell [ref=f1e88]:
                  - button "Ubah" [ref=f1e90] [cursor=pointer]
          - dialog "Pelanggan baru" [ref=f1e94]:
            - generic [ref=f1e95]:
              - heading "Pelanggan baru" [level=2] [ref=f1e96]
              - button "Tutup dialog" [ref=f1e97] [cursor=pointer]
            - generic [ref=f1e102]:
              - generic [ref=f1e103]:
                - generic [ref=f1e104]: Nama
                - textbox "Nama" [ref=f1e105]: QA Test Customer
              - generic [ref=f1e106]:
                - generic [ref=f1e107]: Nomor telepon
                - textbox "Nomor telepon" [active] [ref=f1e108]: "081234567890"
                - paragraph [ref=f1e109]: Contoh 0812 3456 7890. Satu nomor hanya untuk satu pelanggan.
              - generic [ref=f1e110]:
                - generic [ref=f1e111]: Alamat (opsional)
                - textbox "Alamat (opsional)" [ref=f1e112]
                - paragraph [ref=f1e113]: Maksimal 200 karakter.
              - generic [ref=f1e114]:
                - button "Batal" [ref=f1e115] [cursor=pointer]
                - button "Simpan pelanggan" [ref=f1e116] [cursor=pointer]
  - alert [ref=f1e117]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Second QA Audit - Cashier Regression', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Login as cashier
  6   |     await page.goto('http://127.0.0.1:3001');
  7   |     await page.waitForLoadState('networkidle');
  8   |     await page.fill('input[name="username"]', 'cashier');
  9   |     await page.fill('input[name="password"]', 'ChangeMe-Cashier1');
  10  |     await page.click('button[type="submit"]');
  11  |     await page.waitForLoadState('networkidle');
  12  |     await expect(page).toHaveURL(/.*\/counter/);
  13  |   });
  14  | 
  15  |   test('D-03: Customer creation dialog should render form fields', async ({ page }) => {
  16  |     await page.goto('http://127.0.0.1:3001/customers');
  17  |     await page.waitForLoadState('networkidle');
  18  |     
  19  |     await page.click('button:has-text("Tambah pelanggan")');
  20  |     await page.waitForTimeout(1000);
  21  |     
  22  |     // Verify dialog has form fields
  23  |     await expect(page.locator('input[name="name"], input[id*="name"]')).toBeVisible();
  24  |     await expect(page.locator('input[name="phone"], input[id*="phone"]')).toBeVisible();
  25  |     await expect(page.locator('textarea[name="address"], textarea[id*="address"]')).toBeVisible();
  26  |     await expect(page.locator('button:has-text("Simpan")')).toBeVisible();
  27  |     await expect(page.locator('button:has-text("Batal")')).toBeVisible();
  28  |     
  29  |     // Create a customer
  30  |     await page.fill('input[name="name"], input[id*="name"]', 'QA Test Customer');
  31  |     await page.fill('input[name="phone"], input[id*="phone"]', '081234567890');
  32  |     await page.fill('textarea[name="address"], textarea[id*="address"]', 'Jl. Test No. 123');
  33  |     await page.click('button:has-text("Simpan")');
  34  |     await page.waitForLoadState('networkidle');
  35  |     await page.waitForTimeout(1000);
  36  |     
  37  |     // Verify customer appears in table
  38  |     await expect(page.locator('text=QA Test Customer')).toBeVisible();
  39  |   });
  40  | 
  41  |   test('D-01, D-02: New order form should calculate price and submit successfully', async ({ page }) => {
  42  |     // First create a customer if needed
  43  |     await page.goto('http://127.0.0.1:3001/customers');
  44  |     await page.waitForLoadState('networkidle');
  45  |     
  46  |     const existingCustomer = await page.locator('text=QA Test Customer').isVisible().catch(() => false);
  47  |     if (!existingCustomer) {
  48  |       await page.click('button:has-text("Tambah pelanggan")');
  49  |       await page.waitForTimeout(300);
  50  |       await page.fill('input[name="name"], input[id*="name"]', 'QA Test Customer');
  51  |       await page.fill('input[name="phone"], input[id*="phone"]', '081234567890');
> 52  |       await page.fill('textarea[name="address"], textarea[id*="address"]', 'Jl. Test No. 123');
      |                  ^ Error: page.fill: Test timeout of 30000ms exceeded.
  53  |       await page.click('button:has-text("Simpan")');
  54  |       await page.waitForLoadState('networkidle');
  55  |       await page.waitForTimeout(1000);
  56  |     }
  57  |     
  58  |     // Now test new order form
  59  |     await page.goto('http://127.0.0.1:3001/orders/new');
  60  |     await page.waitForLoadState('networkidle');
  61  |     
  62  |     // Select customer (combobox with name="customerSearch")
  63  |     await page.locator('[role="combobox"]').first().click();
  64  |     await page.waitForTimeout(300);
  65  |     await page.locator('[role="option"]:has-text("QA Test Customer")').click();
  66  |     await page.waitForTimeout(300);
  67  |     
  68  |     // Select service (select element with id="service-1")
  69  |     await page.selectOption('select[id="service-1"]', '1'); // Cuci + setrika
  70  |     await page.waitForTimeout(500);
  71  |     
  72  |     // Verify price calculation (Cuci + setrika = Rp 8.000/kg, default weight = 1kg)
  73  |     const subtotalText = await page.locator('text=Subtotal').locator('..').textContent();
  74  |     const totalText = await page.locator('text=Total').locator('..').textContent();
  75  |     console.log('Initial Subtotal:', subtotalText);
  76  |     console.log('Initial Total:', totalText);
  77  |     
  78  |     // Test weight step buttons (aria-label contains "Berat atau jumlah")
  79  |     const weightInput = page.locator('input[type="number"]').first();
  80  |     const initialWeight = await weightInput.inputValue();
  81  |     console.log('Initial weight:', initialWeight);
  82  |     
  83  |     // Click increment button (second button after input)
  84  |     const stepButtons = await page.locator('button[aria-label="Berat atau jumlah +"], button[aria-label*="Berat"]').evaluateAll(
  85  |       els => els.map(el => el.outerHTML)
  86  |     );
  87  |     console.log('Step buttons:', stepButtons);
  88  |     
  89  |     await page.click('button[aria-label="Berat atau jumlah +"]');
  90  |     await page.waitForTimeout(300);
  91  |     
  92  |     const newWeight = await weightInput.inputValue();
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
```