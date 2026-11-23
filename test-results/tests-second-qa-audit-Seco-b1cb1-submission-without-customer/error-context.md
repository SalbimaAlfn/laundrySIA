# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\second-qa-audit.spec.ts >> Second QA Audit - Cashier Regression >> D-01: Form validation should block submission without customer
- Location: tests\second-qa-audit.spec.ts:111:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Customer harus dipilih')
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('text=Customer harus dipilih') with timeout 3000ms
  - waiting for locator('text=Customer harus dipilih')

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
  - heading "Pesanan baru" [level=1]
  - search:
    - text: Cari pesanan atau pelanggan
    - searchbox "Cari pesanan atau pelanggan"
- main:
  - heading "Pesanan baru" [level=1]
  - text: Pelanggan
  - combobox "Pelanggan"
  - region "Layanan":
    - heading "Layanan" [level=2]
    - text: Layanan 1
    - combobox "Layanan 1":
      - option "Pilih layanan"
      - option "Cuci + setrika · Rp 8.000/kg" [selected]
      - option "Express · Rp 12.000/kg"
      - option "Kiloan · Rp 7.000/kg"
    - text: Berat atau jumlah
    - button "Berat atau jumlah −"
    - spinbutton "Berat atau jumlah": "1"
    - button "Berat atau jumlah +"
    - text: kg Jumlah
    - strong: Rp 8.000
    - text: "Harga satuan: Rp 8.000"
    - button "Tambah layanan"
  - text: Tanggal selesai
  - textbox "Tanggal selesai": 2026-11-25
  - text: Catatan
  - textbox "Catatan":
    - /placeholder: Catatan untuk pesanan ini (opsional)
  - region "Pembayaran sekarang":
    - heading "Pembayaran sekarang" [level=2]
    - radiogroup "Pembayaran sekarang":
      - radio "Bayar lunas" [checked]
      - text: Bayar lunas
      - radio "Uang muka"
      - text: Uang muka
      - radio "Bayar nanti"
      - text: Bayar nanti
    - text: Metode pembayaran
    - combobox "Metode pembayaran":
      - option "Tunai" [selected]
      - option "Transfer bank"
      - option "Dompet digital"
  - text: Subtotal
  - strong: Rp 8.000
  - text: Diskon
  - textbox "Diskon": "0"
  - text: Total
  - strong: Rp 8.000
  - link "Batal":
    - /url: /counter
  - button "Simpan pesanan"
  - complementary:
    - heading "Tiket klaim" [level=2]
    - article "Tiket klaim":
      - text: Sari Laundry
      - paragraph: Jl. Mawar No. 12, Jakarta
      - paragraph: Nomor dibuat saat disimpan
      - paragraph: 25 Nov 2026
      - paragraph: Pelanggan
      - text: Cuci + setrika 1 kg
      - strong: Rp 8.000
      - term: Subtotal
      - definition: Rp 8.000
      - term: Total
      - definition: Rp 8.000
      - term: Dibayar sekarang
      - definition: Rp 8.000
      - term: Sisa pembayaran
      - definition: Rp 0
      - text: Lunas
- alert
```

# Test source

```ts
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
> 123 |     await expect(page.locator('text=Customer harus dipilih')).toBeVisible({ timeout: 3000 });
      |                                                               ^ Error: expect(locator).toBeVisible() failed
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
```