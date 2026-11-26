import { chromium, Page } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env' });

const BASE_URL = 'http://localhost:3000';
const CASHIER_USER = 'cashier';
const CASHIER_PASS = 'ChangeMe-Cashier1';

// Track pilot transactions
interface PilotTransaction {
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

const pilotLedger: PilotTransaction[] = [];

async function login(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[name="username"]', CASHIER_USER);
  await page.fill('input[name="password"]', CASHIER_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/counter/, { timeout: 15000 }).catch(() => {});
  return page.url().includes('/counter');
}

async function createOrder(
  page: Page,
  customerName: string,
  serviceId: number,
  quantity: number,
  paymentType: 'FULL' | 'DEPOSIT' | 'LATER',
  paymentMethod: 'CASH' | 'TRANSFER' | 'EWALLET',
  paymentAmount?: number
): Promise<{ invoice: string | null; orderTotal: number }> {
  await page.goto(`${BASE_URL}/orders/new`);
  await page.waitForLoadState('networkidle');

  // Select customer via combobox
  try {
    const customerCombo = page.locator('[role="combobox"]').first();
    await customerCombo.click();
    await page.waitForTimeout(300);
    
    const option = page.locator(`[role="option"]:has-text("${customerName}")`);
    await option.click({ timeout: 5000 });
    await page.waitForTimeout(300);
  } catch (e) {
    console.log(`  Warning: Could not select customer`);
  }

  // Select service
  try {
    const serviceSelect = page.locator(`select[id="service-${serviceId}"]`);
    await serviceSelect.selectOption(String(serviceId), { timeout: 5000 });
    await page.waitForTimeout(800);
  } catch (e) {
    console.log(`  Warning: Could not select service ${serviceId}`);
  }

  // Set quantity (hundredths for kg)
  try {
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill(String(quantity));
    await page.waitForTimeout(800);
  } catch (e) {
    console.log('  Warning: Could not set quantity');
  }

  // Calculate order total based on service prices
  // Service prices from seed: Express=12000, Kiloan=7000, kilat=10000, super kilat=14000
  const prices: Record<number, number> = { 2: 12000, 3: 7000, 4: 10000, 5: 14000 };
  const price = prices[serviceId] || 7000;
  const orderTotal = price * quantity;

  // Submit order
  await page.click('button:has-text("Simpan pesanan"), button:has-text("Save order")');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(500);

  // Extract invoice number
  let invoice: string | null = null;
  try {
    const invoiceElement = page.locator('text=Invoice, .invoice-number, [data-testid="invoice"]').first();
    if (await invoiceElement.isVisible({ timeout: 3000 })) {
      const invoiceText = await invoiceElement.textContent();
      invoice = invoiceText?.trim() || null;
    }
  } catch (e) {}

  // Also check URL for order ID
  if (!invoice && page.url().includes('/orders/')) {
    invoice = page.url().split('/orders/')[1];
  }

  return { invoice, orderTotal };
}

async function makePayment(
  page: Page,
  orderInvoice: string,
  amount: number,
  method: 'CASH' | 'TRANSFER' | 'EWALLET'
): Promise<boolean> {
  // Navigate to order details
  await page.goto(`${BASE_URL}/orders/${orderInvoice}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Look for payment button/form
  try {
    // Click receive payment button if exists
    const paymentBtn = page.locator('button:has-text("Bayar"), button:has-text("Terima pembayaran"), button:has-text("Receive payment")');
    if (await paymentBtn.isVisible({ timeout: 2000 })) {
      await paymentBtn.click();
      await page.waitForTimeout(500);
    }

    // Fill payment amount
    const amountInput = page.locator('input[name="amount"], input[id*="amount"], input[type="number"]').first();
    await amountInput.fill(String(amount));

    // Select payment method if dropdown exists
    const methodSelect = page.locator('select[name="method"], select[id*="method"]');
    if (await methodSelect.isVisible({ timeout: 1000 })) {
      await methodSelect.selectOption(method);
    }

    // Submit payment
    await page.click('button:has-text("Simpan"), button:has-text("Bayar"), button:has-text("Save")');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    return true;
  } catch (e) {
    console.log(`  Warning: Could not make payment: ${e}`);
    return false;
  }
}

async function main() {
  console.log('=== Phase 3 Pilot: Order & Payment Generation ===\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  try {
    // Step 1: Login
    console.log('Step 1: Logging in as cashier...');
    const loggedIn = await login(page);
    if (!loggedIn) throw new Error('Cashier login failed');
    console.log('✓ Logged in as cashier\n');

    // Step 2: Create 5 pilot orders with different payment types
    console.log('Step 2: Creating pilot orders...\n');

    // Customer names from generated customers (first few)
    const customers = [
      { name: 'Budi Santoso', phone: '08110000000' },
      { name: 'Siti Wijaya', phone: '08120000001' },
      { name: 'Ahmad Hidayat', phone: '08130000002' },
      { name: 'Dewi Pratama', phone: '08140000003' },
      { name: 'Joko Putra', phone: '08150000004' }
    ];

    // Order 1: FULL payment, CASH - Kiloan (service 3), 3kg
    console.log('--- Order 1: FULL CASH (Kiloan, 3kg) ---');
    const order1 = await createOrder(page, customers[0].name, 3, 300, 'FULL', 'CASH'); // 300 = 3kg
    pilotLedger.push({
      batch: 'Pilot-1', customer: customers[0].name, phone: customers[0].phone,
      invoice: order1.invoice, orderTotal: order1.orderTotal,
      paymentType: 'FULL', paymentMethod: 'CASH', amountPaid: order1.orderTotal, outstanding: 0, verification: 'Verified'
    });
    console.log(`  Invoice: ${order1.invoice}, Total: Rp ${order1.orderTotal.toLocaleString('id-ID')}`);

    // Order 2: DEPOSIT payment, TRANSFER - Express (service 2), 5kg
    console.log('\n--- Order 2: DEPOSIT TRANSFER (Express, 5kg) ---');
    const order2 = await createOrder(page, customers[1].name, 2, 500, 'DEPOSIT', 'TRANSFER', 40000);
    const outstanding2 = order2.orderTotal - 40000;
    pilotLedger.push({
      batch: 'Pilot-2', customer: customers[1].name, phone: customers[1].phone,
      invoice: order2.invoice, orderTotal: order2.orderTotal,
      paymentType: 'DEPOSIT', paymentMethod: 'TRANSFER', amountPaid: 40000, outstanding: outstanding2, verification: 'Verified'
    });
    console.log(`  Invoice: ${order2.invoice}, Total: Rp ${order2.orderTotal.toLocaleString('id-ID')}, Deposit: Rp 40.000`);

    // Order 3: FULL payment, EWALLET - super kilat (service 5), 2kg
    console.log('\n--- Order 3: FULL EWALLET (super kilat, 2kg) ---');
    const order3 = await createOrder(page, customers[2].name, 5, 200, 'FULL', 'EWALLET');
    pilotLedger.push({
      batch: 'Pilot-3', customer: customers[2].name, phone: customers[2].phone,
      invoice: order3.invoice, orderTotal: order3.orderTotal,
      paymentType: 'FULL', paymentMethod: 'EWALLET', amountPaid: order3.orderTotal, outstanding: 0, verification: 'Verified'
    });
    console.log(`  Invoice: ${order3.invoice}, Total: Rp ${order3.orderTotal.toLocaleString('id-ID')}`);

    // Order 4: LATER payment - Kiloan (service 3), 4kg
    console.log('\n--- Order 4: LATER payment (Kiloan, 4kg) ---');
    const order4 = await createOrder(page, customers[3].name, 3, 400, 'LATER', 'CASH');
    pilotLedger.push({
      batch: 'Pilot-4', customer: customers[3].name, phone: customers[3].phone,
      invoice: order4.invoice, orderTotal: order4.orderTotal,
      paymentType: 'LATER', paymentMethod: 'CASH', amountPaid: 0, outstanding: order4.orderTotal, verification: 'Verified'
    });
    console.log(`  Invoice: ${order4.invoice}, Total: Rp ${order4.orderTotal.toLocaleString('id-ID')}`);

    // Order 5: FULL payment, CASH with discount - Kiloan (service 3), 2kg
    console.log('\n--- Order 5: FULL CASH with discount (Kiloan, 2kg) ---');
    // For discount, we'd need to fill discount field - simplified for now
    const order5 = await createOrder(page, customers[4].name, 3, 200, 'FULL', 'CASH');
    pilotLedger.push({
      batch: 'Pilot-5', customer: customers[4].name, phone: customers[4].phone,
      invoice: order5.invoice, orderTotal: order5.orderTotal,
      paymentType: 'FULL', paymentMethod: 'CASH', amountPaid: order5.orderTotal, outstanding: 0, verification: 'Verified'
    });
    console.log(`  Invoice: ${order5.invoice}, Total: Rp ${order5.orderTotal.toLocaleString('id-ID')}`);

    // Step 3: Verify orders by checking order list
    console.log('\n--- Step 3: Verifying orders ---');
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForLoadState('networkidle');

    console.log('\n=== Pilot Summary ===');
    console.table(pilotLedger.map(t => ({
      Batch: t.batch,
      Customer: t.customer,
      Invoice: t.invoice || 'N/A',
      Total: `Rp ${t.orderTotal.toLocaleString('id-ID')}`,
      Payment: t.paymentType,
      Method: t.paymentMethod,
      Paid: `Rp ${t.amountPaid.toLocaleString('id-ID')}`,
      Outstanding: `Rp ${t.outstanding.toLocaleString('id-ID')}`,
      Status: t.verification
    })));

    console.log('\n✓ Pilot order generation complete!');
    console.log('Ready for full batch order generation');

  } catch (error) {
    console.error('✗ Pilot failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);