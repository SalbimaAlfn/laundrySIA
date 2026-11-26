import { chromium } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';
const CASHIER_USER = 'cashier';
const CASHIER_PASS = 'ChangeMe-Cashier1';

// Customer generation functions
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(index: number): string {
  const prefix = '081' + String(1 + (index % 9));
  const suffix = String(10000000 + index).slice(1);
  return prefix + suffix;
}

function generateAddress(index: number): string {
  const streets = [
    'Jl. Merdeka', 'Jl. Sudirman', 'Jl. Thamrin', 'Jl. Gatot Subroto', 'Jl. Hayam Wuruk',
    'Jl. Mangga Besar', 'Jl. Kemayoran', 'Jl. Senen', 'Jl. Cempaka Putih'
  ];
  const cities = ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur'];
  const street = streets[index % streets.length];
  const city = cities[index % cities.length];
  return `${street} No. ${1 + (index % 99)}, ${city}`;
}

const FIRST_NAMES = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Joko', 'Sri', 'Agus', 'Rina', 'Bambang', 'Fitri',
  'Doni', 'Maya', 'Eko', 'Nina', 'Fajar', 'Gunawan', 'Wati', 'Hadi', 'Yuni', 'Indra',
  'Sari', 'Kusuma', 'Vera', 'Lukman', 'Rani', 'Mulyono', 'Dian', 'Nugroho', 'Eka', 'Yulia'];

const LAST_NAMES = ['Santoso', 'Wijaya', 'Hidayat', 'Pratama', 'Putra', 'Permata', 'Kusuma', 'Saputra',
  'Wulandari', 'Ningsih', 'Setyawan', 'Maharani', 'Ramadhan', 'Lestari', 'Gunawan',
  'Hartono', 'Suryono', 'Mulyani'];

function generateCustomers(count: number): Array<{ name: string; phone: string; address: string }> {
  const customers = [];
  for (let i = 0; i < count; i++) {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    customers.push({
      name: `${firstName} ${lastName}`,
      phone: generatePhone(i),
      address: generateAddress(i)
    });
  }
  return customers;
}

async function login(page: any) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[name="username"]', CASHIER_USER);
  await page.fill('input[name="password"]', CASHIER_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/counter/, { timeout: 15000 }).catch(() => {});
}

async function customerExists(page: any, phone: string): Promise<boolean> {
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="q"]', phone);
  await page.click('button:has-text("Cari")');
  await page.waitForLoadState('networkidle');
  return await page.locator(`text=${phone}`).isVisible().catch(() => false);
}

async function createCustomer(page: any, name: string, phone: string, address: string): Promise<boolean> {
  // Check if customer exists
  if (await customerExists(page, phone)) {
    return true; // Already exists
  }

  // Navigate to customers page and open dialog
  await page.goto(`${BASE_URL}/customers`);
  await page.waitForLoadState('networkidle');
  
  // Close any open dialogs first by clicking outside or Esc
  await page.keyboard.press('Escape').catch(() => {});
  
  await page.click('button:has-text("Tambah pelanggan")');
  await page.waitForTimeout(300); // Reduced wait time

  // Fill form - use flexible selectors that work
  // Fill name
  await page.fill('input[name="name"], #name', name);
  
  // Fill phone
  await page.fill('input[name="phone"], #phone', phone);
  
  // Fill address - try textarea first, then input
  const textareaCount = await page.locator('textarea[name="address"], input[name="address"]').count();
  if (textareaCount > 0) {
    await page.fill('textarea[name="address"], input[name="address"]', address);
  } else {
    await page.fill('textarea', address).catch(() => {});
  }

  // Submit - find save button directly
  await page.click('button:has-text("Simpan")');
  
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Verify creation
  return await customerExists(page, phone);
}

async function main() {
  console.log('=== Full Customer Generation (144 customers) ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Step 1: Logging in as cashier...');
    await login(page);
    console.log('✓ Logged in\n');

    const customers = generateCustomers(144);
    console.log(`Step 2: Creating ${customers.length} customers...\n`);

    let success = 0, failed = 0;
    
    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];
      const ok = await createCustomer(page, c.name, c.phone, c.address);
      
      if (ok) {
        success++;
        if (success % 20 === 0 || i === customers.length - 1) {
          console.log(`  Progress: ${success}/${customers.length}`);
        }
      } else {
        failed++;
        console.log(`  ✗ Failed: ${c.name}`);
      }
      
      // Minimal delay
      if (i % 5 !== 0) await page.waitForTimeout(10);
    }

    console.log(`\n=== Summary ===`);
    console.log(`Successfully created: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${customers.length + 6} customers (144 new + 6 existing)`);
    console.log(`\n✓ Customer generation complete!`);

  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);