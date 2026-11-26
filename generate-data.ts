import { test, expect } from '@playwright/test';

// Configuration
const BASE_URL = 'http://127.0.0.1:3000';
const MANAGER_USER = 'manager';
const MANAGER_PASS = 'ChangeMe-Manager1';
const CASHIER_USER = 'cashier';
const CASHIER_PASS = 'ChangeMe-Cashier1';

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

// Service data (from seed)
const SERVICES = [
  { id: 1, name: 'Cuci + setrika', unit: 'KG', price: 8000, turnaroundDays: 2, active: false },
  { id: 2, name: 'Express', unit: 'KG', price: 12000, turnaroundDays: 1, active: true },
  { id: 3, name: 'Kiloan', unit: 'KG', price: 7000, turnaroundDays: 3, active: true },
  { id: 4, name: 'kilat', unit: 'KG', price: 10000, turnaroundDays: 1, active: true },
  { id: 5, name: 'super kilat', unit: 'KG', price: 14000, turnaroundDays: 0, active: true }
];

const ACTIVE_SERVICES = SERVICES.filter(s => s.active);

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

// Seasonality multipliers (month 1-12, where 1=Jan)
const SEASONALITY = [1.0, 1.1, 0.9, 1.0, 1.15, 1.25, 1.0, 1.0, 0.95, 1.0, 1.05, 1.2];

// Expense categories
const EXPENSE_CATEGORIES = [
  { category: 'ELECTRICITY_WATER', label: 'Listrik & Air', monthly: true, baseAmount: 1500000, variance: 0.5 },
  { category: 'WAGES', label: 'Gaji', monthly: true, baseAmount: 5000000, variance: 0.3 },
  { category: 'RENT', label: 'Sewa', monthly: true, baseAmount: 3500000, variance: 0.1 },
  { category: 'OTHER', label: 'Lainnya', monthly: false, baseAmount: 300000, variance: 1.5 },
];

// Helper: format rupiah for input
function formatRupiahInput(amount: number): string {
  return amount.toLocaleString('id-ID');
}

// Helper: random int
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: random float
function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper: pick random element
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: weighted random
function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
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

// The main generation class
class DataGenerator {
  private customers: Array<{ name: string; phone: string; address: string; archetype: string; archetypeIndex: number }> = [];
  private createdCustomerIds: Map<string, number> = new Map(); // phone -> id
  private page: any;
  
  constructor(page: any) {
    this.page = page;
    this.customers = generateCustomers();
  }
  
  async login(role: 'manager' | 'cashier' = 'manager') {
    const user = role === 'manager' ? MANAGER_USER : CASHIER_USER;
    const pass = role === 'manager' ? MANAGER_PASS : CASHIER_PASS;
    
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState('networkidle');
    await this.page.fill('input[name="username"]', user);
    await this.page.fill('input[name="password"]', pass);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }
  
  async createCustomer(name: string, phone: string, address: string): Promise<number> {
    await this.page.goto(`${BASE_URL}/customers`);
    await this.page.waitForLoadState('networkidle');
    
    // Click add customer button
    await this.page.click('button:has-text("Tambah pelanggan")');
    await this.page.waitForTimeout(300);
    
    // Fill form
    await this.page.fill('input[name="name"], input[id*="name"]', name);
    await this.page.fill('input[name="phone"], input[id*="phone"]', phone);
    await this.page.fill('textarea[name="address"], textarea[id*="address"]', address);
    
    // Submit
    await this.page.click('button:has-text("Simpan")');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500);
    
    // Get the customer ID from the URL or table
    // The table should show the new customer
    const row = await this.page.locator(`text=${name}`).first().locator('..').locator('..');
    // Try to extract ID from data attribute or similar
    // For now, we'll need to query the DB or use a different approach
    // Let's search for the customer
    await this.page.fill('input[name="q"]', phone);
    await this.page.click('button:has-text("Cari")');
    await this.page.waitForLoadState('networkidle');
    
    // The customer should be visible
    await expect(this.page.locator(`text=${name}`)).toBeVisible({ timeout: 5000 });
    
    // We can't easily get the ID from UI, so we'll store phone->id mapping
    // by querying the database after creation
    return 0; // placeholder
  }
  
  async createAllCustomers() {
    console.log(`Creating ${this.customers.length} customers...`);
    
    for (let i = 0; i < this.customers.length; i++) {
      const c = this.customers[i];
      try {
        await this.createCustomer(c.name, c.phone, c.address);
        console.log(`  [${i+1}/${this.customers.length}] Created: ${c.name} (${c.phone})`);
      } catch (e) {
        console.error(`  Failed to create ${c.name}:`, e);
      }
      
      // Small delay to avoid overwhelming the server
      if (i % 10 === 9) {
        await this.page.waitForTimeout(1000);
      }
    }
    
    console.log('All customers created!');
  }
}

// Since we need to run this as a script, not a test, let me create a standalone version
console.log('Data generator module loaded');
console.log(`Will generate ${generateCustomers().length} customers`);

export { DataGenerator, generateCustomers, SERVICES, ACTIVE_SERVICES, CUSTOMER_ARCHETYPES, SEASONALITY, EXPENSE_CATEGORIES };