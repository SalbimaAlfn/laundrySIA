# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\second-qa-audit.spec.ts >> Second QA Audit - Cashier Regression >> D-03: Customer creation dialog should render form fields
- Location: tests\second-qa-audit.spec.ts:15:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('textarea[name="address"], textarea[id*="address"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('textarea[name="address"], textarea[id*="address"]') with timeout 5000ms
  - waiting for locator('textarea[name="address"], textarea[id*="address"]')

```

```yaml
- link "Lewati ke konten":
  - /url: "#main-content"
- complementary:
  - link "LaundrySIA":
    - /url: /counter
  - navigation "Navigasi utama":
    - link "Counter":
      - /url: /counter
    - link "Pesanan":
      - /url: /orders
    - link "Pelanggan":
      - /url: /customers
  - text: Kasir Kasir
  - button "Keluar"
- banner:
  - heading "Pelanggan" [level=1]
  - search:
    - text: Cari pesanan atau pelanggan
    - searchbox "Cari pesanan atau pelanggan"
- main:
  - paragraph: Cari pelanggan, atau tambahkan yang baru.
  - button "Tambah pelanggan"
  - search:
    - text: Cari pelanggan
    - searchbox "Cari pelanggan"
    - button "Cari"
  - table "Daftar pelanggan":
    - caption: Daftar pelanggan
    - rowgroup:
      - row "Nama Nomor telepon Alamat (opsional) Status":
        - columnheader "Nama"
        - columnheader "Nomor telepon"
        - columnheader "Alamat (opsional)"
        - columnheader "Status"
        - columnheader
    - rowgroup:
      - row "hari 0883313921 Jalan Abdul Gani Aktif Ubah":
        - cell "hari"
        - cell "0883313921"
        - cell "Jalan Abdul Gani"
        - cell "Aktif"
        - cell "Ubah":
          - button "Ubah"
      - row "QA-PI Customer 081234567890 — Aktif Ubah":
        - cell "QA-PI Customer"
        - cell "081234567890"
        - cell "—"
        - cell "Aktif"
        - cell "Ubah":
          - button "Ubah"
  - dialog "Pelanggan baru":
    - heading "Pelanggan baru" [level=2]
    - button "Tutup dialog"
    - text: Nama
    - textbox "Nama"
    - text: Nomor telepon
    - textbox "Nomor telepon"
    - paragraph: Contoh 0812 3456 7890. Satu nomor hanya untuk satu pelanggan.
    - text: Alamat (opsional)
    - textbox "Alamat (opsional)"
    - paragraph: Maksimal 200 karakter.
    - button "Batal"
    - button "Simpan pelanggan"
- alert
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
> 25  |     await expect(page.locator('textarea[name="address"], textarea[id*="address"]')).toBeVisible();
      |                                                                                     ^ Error: expect(locator).toBeVisible() failed
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
  52  |       await page.fill('textarea[name="address"], textarea[id*="address"]', 'Jl. Test No. 123');
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
```