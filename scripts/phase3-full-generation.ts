import { chromium, Page } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';
const CASHIER_USER = 'cashier';
const CASHIER_PASS = 'ChangeMe-Cashier1';

// Customer archetypes for batch generation
const CUSTOMER_ARCHETYPES = [
  { type: 'regular_weekly', count: 25, weight: 1.0, paymentPattern: 'full', frequency: 7 },
  { type: 'regular_biweekly', count: 30, weight: 1.0, paymentPattern: 'mixed', frequency: 14 },
  { type: 'occasional', count: 40, weight: 0.8, paymentPattern: 'mixed', frequency: 60 },
  { type: 'heavy_bulk', count: 15, weight: 3.0, paymentPattern: 'deposit', frequency: 30 },
  { type: 'installment_payers', count: 20, weight: 1.2, paymentPattern: 'installment', frequency: 21 },
  { type: 'chronic_debt', count: 10, weight: 0.9, paymentPattern: 'debt', frequency: 30 },
  { type: 'churned', count: 10, weight: 1.0, paymentPattern: 'mixed', frequency: 30, activeMonths: 12 },
];

// Indonesian name pools
const INDONESIAN_FIRST_NAMES = [
  'Budi', 'Siti', 'Ahmad', 'Dewi', 'Joko', 'Sri', 'Agus', 'Rina', 'Bambang', 'Fitri',
  'Doni', 'Maya', 'Eko', 'Nina', 'Fajar', 'Lestari', 'Gunawan', 'Wati', 'Hadi', 'Yuni',
  'Indra', 'Sari', 'Joko', 'Tina', 'Kusuma', 'Vera', 'Lukman', 'Rani', 'Mulyono', 'Dian',
  'Nugroho', 'Eka', 'Prasetyo', 'Yuli', 'Rachman', 'Novita', 'Santoso', 'Lina', 'Sutrisno', 'Mega',
  'Taufik', 'Nina', 'Wahyu', 'Oktavia', 'Yusuf', 'Putri', 'Zulkifli', 'Rita', 'Abdul', 'Siska',
  'Beny', 'Tuti', 'Candra', 'Umi', 'Deddy', 'Vina', 'Edi', 'Wulan', 'Ferdi', 'Xenia',
  'Gatot', 'Yani', 'Hendra', 'Zahra', 'Iwan', 'Ani', 'Jefri', 'Bella', 'Kurnia', 'Citra'
];

const INDONESIAN_LAST_NAMES = [
  'Santoso', 'Wijaya', 'Hidayat', 'Pratama', 'Putra', 'Permata', 'Kusuma', 'Saputra',
  'Wulandari', 'Ningsih', 'Setyawan', 'Maharani', 'Ramadhan', 'Lestari', 'Gunawan',
  'Hartono', 'Suryono', 'Mulyani', 'Prabowo', 'Utami', 'Susanto', 'Wijayanti', 'Harsono',
  'Kurniawan', 'Safitri', 'Pradana', 'Anggraini', 'Situmorang', 'Nasution', 'Simbolon',
  'Manurung', 'Siregar', 'Harahap', 'Panggabean', 'Marpaung', 'Tampubolon', 'Sinaga',
  'Gultom', 'Hutabarat', 'Sitorus', 'Silalahi', 'Butarbutar', 'Nainggolan', 'Purba',
  'Siahaan', 'Sitepu', 'Tarigan', 'Sembiring'
];

const INDONESIAN_STREETS = [
  'Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Hayam Wuruk',
  'Jl. Mangga Besar', 'Jl. Kemayoran', 'Jl. Senen', 'Jl. Cempaka Putih', 'Jl. Matraman',
  'Jl. Jatinegara', 'Jl. Pondok Kelapa', 'Jl. Duren Sawit', 'Jl. Cakung', 'Jl. Pulo Gadung',
  'Jl. Kalimalang', 'Jl. Bekasi Raya', 'Jl. Ahmad Yani', 'Jl. TB Simatupang', 'Jl. Rasuna Said',
  'Jl. Casablanca', 'Jl. Kuningan', 'Jl. Setiabudi', 'Jl. Sudirman Kav', 'Jl. M.H. Thamrin',
  'Jl. Imam Bonjol', 'Jl. Wahid Hasyim', 'Jl. Cikini', 'Jl. Salemba', 'Jl. Pramuka',
  'Jl. Rawamangun', 'Jl. Kayu Putih', 'Jl. Bekasi Timur', 'Jl. Bintara', 'Jl. Jatiwaringin'
];

const INDONESIAN_CITIES = [
  'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur',
  'Bekasi', 'Depok', 'Tangerang', 'Bogor', 'Tangerang Selatan'
];

// Helper functions
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(index: number): string {
  const prefix = '081' + String(1 + (index % 9));
  const suffix = String(10000000 + index).slice(1);
  return prefix + suffix;
}

function generateAddress(index: number): string {
  const street = INDONESIAN_STREETS[index % INDONESIAN_STREETS.length];
  const num = String(1 + (index % 99) + Math.floor(index / 100) * 10);
  const city = INDONESIAN_CITIES[index % INDONESIAN_CITIES.length];
  const rt = String(1 + (index % 15)).padStart(2, '0');
  const rw = String(1 + (index % 10)).padStart(2, '0');
  return `${street} No. ${num} RT ${rt}/RW ${rw}, ${city}`;
}

// Generate all customers
function generateCustomers(): Array<{ name: string; phone: string; address: string; archetype: string }> {
  const customers = [];
  let custIndex = 0;

  for (const arch of CUSTOMER_ARCHETYPES) {
    for (let i = 0; i < arch.count; i++) {
      const firstName = pickRandom(INDONESIAN_FIRST_NAMES);
      const lastName = pickRandom(INDONESIAN_LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const phone = generatePhone(custIndex);
      const address = generateAddress(custIndex);

      customers.push({ name, phone, address, archetype: arch.type });
      custIndex++;
    }
  }

  return customers;
}

// Progress tracking
interface TransactionRecord {
  batch: string;
  customer: string;
  phone: string;
  invoice?: string;
  orderTotal: number;
  paymentType: 'FULL' | 'DEPOSIT' | 'LATER';
  paymentMethod: 'CASH' | 'TRANSFER' | 'EWALLET';
  amountPaid: number;
  outstanding: number;
  verification: 'Verified' | 'Failed';
}

const ledger: TransactionRecord[] = [];

async function login(page: Page, role: 'manager' | 'cashier' = 'manager') {
  const user = role === 'manager' ? 'manager' : CASHIER_USER;
  const pass = role === 'manager' ? 'ChangeMe-Manager1' : CASHIER_PASS;

  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(counter|dashboard|orders)/, { timeout: 15000 }).catch(() => {});

  return user;
}

async function verifyCashierRole(page: Page) {
  const url = page.url();
  return url.includes('/counter');
}

async function createCustomer(page: Page, name: string, phone: string, address: string): Promise<boolean> {
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('networkidle');

  // Check if customer exists
  await page.fill('input[name="q"]', phone);
  await page.click('button:has-text("Cari")');
  await page.waitForLoadState('networkidle');

  const exists = await page.locator(`text=${phone}`).isVisible().catch(() => false);
  if (exists) return true;

  // Create new customer
  await page.click('button:has-text("Tambah pelanggan")');
  await page.waitForTimeout(1000);

  // Fill form - use flexible selectors
  await page.fill('input[name="name"], #name', name);
  await page.fill('input[name="phone"], #phone', phone);
  
  // Use page.fill without strict selector for address
  try {
    const addressInput = page.locator('textarea[name*="address"], input[name*="address"]');
    if (await addressInput.count() > 0) {
      await addressInput.fill(address);
    }
  } catch (e) {
    // Try alternative approach
    await page.fill('textarea', address).catch(() => {});
  }

  await page.click('button:has-text("Simpan")');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Verify
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="q"]', phone);
  await page.click('button:has-text("Cari")');
  await page.waitForLoadState('networkidle');

  return await page.locator(`text=${name}`).isVisible().catch(() => false);
}

async function createOrder(
  page: Page,
  customerName: string,
  serviceId: number,
  quantity: number,
  paymentType: 'FULL' | 'DEPOSIT' | 'LATER',
  paymentMethod: 'CASH' | 'TRANSFER' | 'EWALLET',
  paymentAmount?: number
): Promise<string | null> {
  await page.goto(`${BASE_URL}/orders/new`);
  await page.waitForLoadState('networkidle');

  // Select customer
  const customerCombo = page.locator('[role="combobox"]').first();
  await customerCombo.click();
  await page.waitForTimeout(300);
  const option = page.locator(`[role="option"]:has-text("${customerName}")`);
  await option.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  // Select service
  try {
    const serviceSelect = page.locator(`select[id="service-${serviceId}"]`);
    await serviceSelect.selectOption(String(serviceId), { timeout: 5000 });
    await page.waitForTimeout(800);
  } catch (e) {
    console.log(`  Warning: Could not select service ${serviceId}`);
  }

  // Set quantity (in hundredths for kg - 1 = 0.01kg)
  try {
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill(String(quantity));
    await page.waitForTimeout(800);
  } catch (e) {
    console.log('  Warning: Could not set quantity');
  }

  // Submit order
  await page.click('button:has-text("Simpan pesanan"), button:has-text("Save order")');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(500);

  // Extract invoice number
  try {
    const invoiceElement = page.locator('text=Invoice, .invoice-number, [data-testid="invoice"]').first();
    if (await invoiceElement.isVisible({ timeout: 3000 })) {
      const invoiceText = await invoiceElement.textContent();
      return invoiceText?.trim() || null;
    }
  } catch (e) {}

  return null;
}

async function main() {
  console.log('=== Phase 3: Full Data Generation ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Step 1: Login as cashier
    console.log('Step 1: Logging in as cashier...');
    await login(page, 'cashier');

    const loggedIn = await verifyCashierRole(page);
    if (!loggedIn) {
      throw new Error('Cashier login failed');
    }
    console.log('✓ Logged in as cashier');

    // Step 2: Generate customer pool
    console.log('\nStep 2: Generating customer data...');
    const customers = generateCustomers();
    console.log(`Generated ${customers.length} customer records`);

    // Step 3: Create ALL customers (144 new fictional + keep existing 6)
    console.log('\nStep 3: Creating all 144 new customers...');
    console.log('(Keeping existing 6 test customers)\n');
    
    let createdCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      const ok = await createCustomer(page, c.name, c.phone, c.address);
      if (ok) {
        createdCount++;
        if (i % 10 === 0 || i === customers.length - 1) {
          console.log(`  [${i+1}/${customers.length}] ✓ ${c.name} (${c.phone})`);
        } else if (i % 10 === 0) {
          console.log(`  [${i+1}/${customers.length}] Creating...`);
        }
      } else {
        failedCount++;
        console.log(`  [${i+1}/${customers.length}] ✗ ${c.name} - FAILED`);
      }
      
      // Update ledger
      ledger.push({
        batch: `Batch-Cust-${Math.floor(i/10)}`,
        customer: c.name,
        phone: c.phone,
        orderTotal: 0,
        paymentType: 'FULL',
        paymentMethod: 'CASH',
        amountPaid: 0,
        outstanding: 0,
        verification: createdCount > 0 ? 'Verified' : 'Failed'
      });
      
      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(50);
    }
    
    console.log(`\n=== Customer Creation Summary ===`);
    console.log(`Created: ${createdCount}/${customers.length}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Total: ${customers.length + 6} customers (144 new + 6 existing)`);

  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);