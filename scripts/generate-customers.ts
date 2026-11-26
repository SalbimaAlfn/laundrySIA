import { chromium, Browser, Page } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env' });

// Configuration
const BASE_URL = 'http://127.0.0.1:3000';
const MANAGER_USER = 'manager';
const MANAGER_PASS = 'ChangeMe-Manager1';

// Indonesian names for customers
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
  'Siahaan', 'Sitepu', 'Tarigan', 'Sembiring', 'Karo-Karo', 'Br Sitepu', 'Br Tarigan'
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

// Customer archetypes
const CUSTOMER_ARCHETYPES = [
  { type: 'regular_weekly', count: 25, weight: 1.0, paymentPattern: 'full', frequency: 7 },
  { type: 'regular_biweekly', count: 30, weight: 1.0, paymentPattern: 'mixed', frequency: 14 },
  { type: 'occasional', count: 40, weight: 0.8, paymentPattern: 'mixed', frequency: 60 },
  { type: 'heavy_bulk', count: 15, weight: 3.0, paymentPattern: 'deposit', frequency: 30 },
  { type: 'installment_payers', count: 20, weight: 1.2, paymentPattern: 'installment', frequency: 21 },
  { type: 'chronic_debt', count: 10, weight: 0.9, paymentPattern: 'debt', frequency: 30 },
  { type: 'churned', count: 10, weight: 1.0, paymentPattern: 'mixed', frequency: 30, activeMonths: 12 },
];

// Generate fictional phone numbers (Indonesian format, using 08xx prefix with reserved/test ranges)
function generatePhone(index: number): string {
  // Use 0811-0819 range for test numbers (not real allocations)
  const prefix = '081' + String(1 + (index % 9));
  const suffix = String(10000000 + index).slice(1);
  return prefix + suffix;
}

// Generate fictional address
function generateAddress(index: number): string {
  const street = INDONESIAN_STREETS[index % INDONESIAN_STREETS.length];
  const num = String(1 + (index % 99) + Math.floor(index / 100) * 10);
  const city = INDONESIAN_CITIES[index % INDONESIAN_CITIES.length];
  const rt = String(1 + (index % 15)).padStart(2, '0');
  const rw = String(1 + (index % 10)).padStart(2, '0');
  return `${street} No. ${num} RT ${rt}/RW ${rw}, ${city}`;
}

// Helper: pick random element
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate all customers
function generateCustomers(): Array<{
  name: string;
  phone: string;
  address: string;
  archetype: string;
  archetypeIndex: number;
}> {
  const customers = [];
  let custIndex = 0;
  
  for (const arch of CUSTOMER_ARCHETYPES) {
    for (let i = 0; i < arch.count; i++) {
      const firstName = pickRandom(INDONESIAN_FIRST_NAMES);
      const lastName = pickRandom(INDONESIAN_LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const phone = generatePhone(custIndex);
      const address = generateAddress(custIndex);
      
      customers.push({
        name,
        phone,
        address,
        archetype: arch.type,
        archetypeIndex: CUSTOMER_ARCHETYPES.findIndex(a => a.type === arch.type)
      });
      custIndex++;
    }
  }
  
  return customers;
}

async function login(page: Page, role: 'manager' | 'cashier' = 'manager') {
  const user = role === 'manager' ? MANAGER_USER : 'cashier';
  const pass = role === 'manager' ? MANAGER_PASS : 'ChangeMe-Cashier1';
  
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  console.log(`Logged in as ${role}`);
}

async function createCustomer(page: Page, name: string, phone: string, address: string): Promise<boolean> {
  try {
    await page.goto(`${BASE_URL}/customers`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    // Click add customer button
    await page.click('button:has-text("Tambah pelanggan")');
    await page.waitForTimeout(300);
    
    // Fill form
    await page.fill('input[name="name"], input[id*="name"]', name);
    await page.fill('input[name="phone"], input[id*="phone"]', phone);
    await page.fill('textarea[name="address"], textarea[id*="address"]', address);
    
    // Submit
    await page.click('button:has-text("Simpan")');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(500);
    
    // Verify customer appears in table by searching
    await page.fill('input[name="q"]', phone);
    await page.click('button:has-text("Cari")');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    
    const visible = await page.locator(`text=${name}`).isVisible({ timeout: 5000 });
    return visible;
  } catch (e) {
    console.error(`  Error creating ${name}:`, e);
    return false;
  }
}

async function main() {
  console.log('Starting customer generation...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await login(page, 'manager');
    
    const customers = generateCustomers();
    console.log(`Will create ${customers.length} customers`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      const result = await createCustomer(page, c.name, c.phone, c.address);
      
      if (result) {
        success++;
        console.log(`  [${i+1}/${customers.length}] ✓ ${c.name} (${c.phone}) - ${c.archetype}`);
      } else {
        failed++;
        console.log(`  [${i+1}/${customers.length}] ✗ ${c.name} (${c.phone}) - FAILED`);
      }
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 9) {
        await page.waitForTimeout(1000);
      }
    }
    
    console.log('\n=== Customer Generation Complete ===');
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${customers.length}`);
    
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);