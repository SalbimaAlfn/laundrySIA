const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  
  // Login as cashier
  await page.goto('http://127.0.0.1:3001');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="username"]', 'cashier');
  await page.fill('input[name="password"]', 'ChangeMe-Cashier1');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log('Current URL after login:', page.url());
  
  // Go to customers page
  await page.goto('http://127.0.0.1:3001/customers');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Click add customer button
  await page.click('button:has-text("Tambah pelanggan")');
  await page.waitForTimeout(1000);
  
  // Check dialog structure
  const dialog = page.locator('dialog').first();
  const body = dialog.locator('.yini9G_body');
  const html = await body.innerHTML();
  console.log('\n=== Dialog Body HTML ===');
  console.log(html);
  
  await browser.close();
})();
