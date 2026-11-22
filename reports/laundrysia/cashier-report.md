# Cashier Test Report — LaundrySIA

**Role:** Kasir (Cashier)
**Credentials:** cashier / [supplied by user]
**Dashboard URL:** http://127.0.0.1:3000/counter
**Tested:** 2026-11-22
**Re-verified:** 2026-11-22 (post-fix)

---

## 1. Login

| Check | Result | Evidence |
|-------|--------|----------|
| Login succeeds with valid credentials | PASS | Redirected to /counter |
| Correct dashboard opens | PASS | Page title: LaundrySIA; URL: /counter |
| Role displayed correctly | PASS | "Kasir" shown in user menu |
| Only permitted features accessible | PASS | Nav shows: Counter, Pesanan, Pelanggan |
| Restricted features not accessible | PASS | /reports, /settings, /dashboard redirect with manager-only notice |

## 2. Dashboard Inspection

| Area | Element | Status | Notes |
|------|---------|--------|-------|
| Statistics | Pesanan berjalan: 0 | PASS | Displays correctly |
| Statistics | Siap diambil: 0 | PASS | Displays correctly |
| Navigation | Counter link | PASS | Active state |
| Navigation | Pesanan link | PASS | Navigates to /orders |
| Navigation | Pelanggan link | PASS | Navigates to /customers |
| Header | Search box "Cari pesanan atau pelanggan" | PASS | Present |
| Action | Pesanan baru button | PASS | Navigates to /orders/new |
| User menu | Kasir label | PASS | Role shown |
| User menu | Keluar button | PASS | Logout works |
| Tabs | Diterima, Dicuci, Pengeringan dan setrika, Siap diambil, Selesai | PASS | All show 0, empty state |

## 3. Orders Page (/orders)

| Check | Result | Notes |
|-------|--------|-------|
| Page loads | PASS | Title: Daftar pesanan |
| Empty state | PASS | "Pesanan tidak ditemukan" |
| Total count | PASS | "Total pesanan: 0 pesanan" |
| Status filter | PASS | Combobox: Semua status, Diterima, Dicuci, Pengeringan dan setrika, Siap diambil, Selesai |
| Date filter | PASS | Tanggal textbox |
| Customer filter | PASS | Pelanggan searchbox |
| Invoice filter | PASS | Invoice searchbox |
| Payment filter | PASS | Pembayaran: Semua pembayaran, Belum dibayar, Sebagian, Dibayar |
| Search button | PASS | Cari button present |
| New order link | PASS | Pesanan baru → /orders/new |

## 4. Customers Page (/customers) — **FIXED**

| Check | Result | Notes |
|-------|--------|-------|
| Page loads | PASS | Title: Pelanggan |
| Empty state | PASS | "Belum ada pelanggan. Tambahkan pelanggan pertama." |
| Search | PASS | Cari pelanggan searchbox + Cari button |
| Add customer button | **PASS** ✅ | "Tambah pelanggan" opens dialog with form fields (name, phone, address, save/cancel) |

## 5. New Order Creation (/orders/new) — **FIXED**

### Form Fields Tested

| Field | Type | Tested | Result |
|-------|------|--------|--------|
| Pelanggan (Customer) | Combobox | Selected existing customer | Selection registered; customerId populated |
| Layanan 1 (Service) | Combobox | Selected "Cuci + setrika · Rp 8.000/kg" | Selection registered; price loaded |
| Berat atau jumlah (Weight) | Spinbutton | Set to 2 kg via + button | **+ button increments correctly** (0.5 kg steps) |
| Tanggal selesai (Due date) | Textbox | Default: 2026-11-24 | Present; auto-updates on service change |
| Catatan (Notes) | Textbox | Typed "QA-PI test order" | Accepted text |
| Pembayaran sekarang | Radio | Bayar lunas (default), Uang muka, Bayar nanti | Bayar lunas checked by default |
| Metode pembayaran | Combobox | Tunai (default), Transfer bank, Dompet digital | Tunai selected |
| Diskon | Textbox | Default "0" | Present; validation works |
| Subtotal | Display | **Rp 16.000** ✅ | **Calculates correctly** |
| Total | Display | **Rp 16.000** ✅ | **Calculates correctly** |

### Price Calculation Test — **FIXED**

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| Service: Cuci + setrika (Rp 8.000/kg), Weight: 1 kg | Rp 8.000 | **Rp 8.000** | **PASS** ✅ |
| Service: Cuci + setrika (Rp 8.000/kg), Weight: 2 kg | Rp 16.000 | **Rp 16.000** | **PASS** ✅ |
| Multiple services | Sum of line totals | **Correct sum** | **PASS** ✅ |
| Discount applied | Subtotal - discount | **Correct total** | **PASS** ✅ |
| Claim ticket preview | Matches form | **Matches exactly** | **PASS** ✅ |

### Form Submission Test — **FIXED**

| Check | Result | Notes |
|-------|--------|-------|
| Click Simpan pesanan (valid) | **PASS** ✅ | Order created; saved ticket displayed with invoice; order appears in /orders |
| Click Simpan pesanan (no customer) | **PASS** ✅ | Form blocked; inline error "Customer harus dipilih" |
| Click Simpan pesanan (no service) | **PASS** ✅ | Form blocked; inline error "Layanan harus dipilih" |
| HTML5 validation errors | **PASS** ✅ | **No console errors** — hidden required fields removed/not present |
| Order appears in list | **PASS** ✅ | /orders shows new order with correct invoice, customer, total, status |

## 6. Authorization (Cashier Restrictions)

| Route Attempted | Result | Status |
|-----------------|--------|--------|
| /reports | Redirected to /counter?notice=manager-only | PASS — correctly denied |
| /settings | Redirected to /counter?notice=manager-only | PASS — correctly denied |
| /dashboard | Redirected to /counter?notice=manager-only | PASS — correctly denied |
| /manager | 404 Not Found | Route does not exist |
| /admin | 404 Not Found | Route does not exist |
| /services | 404 Not Found | Route does not exist |
| /employees | 404 Not Found | Route does not exist |

Alert message displayed: "Hanya manajer yang dapat membuka halaman itu." (Only managers can open that page.)

## 7. Logout

| Check | Result | Evidence |
|-------|--------|----------|
| Click Keluar | PASS | Redirects to /login?notice=loggedOut |
| Session terminated | PASS | /counter redirects back to /login |
| Protected page inaccessible after logout | PASS | Confirmed by navigating to /counter post-logout |

## 8. Cashier Defects — **ALL RESOLVED**

| ID | Severity | Original Status | **Current Status** | Fix |
|----|----------|-----------------|-------------------|-----|
| CASH-01 | HIGH | FAIL | **PASS** ✅ | Form validation in `handleSubmit()` prevents silent failure |
| CASH-02 | HIGH | FAIL | **PASS** ✅ | `stepQuantity()` uses dot decimal for input compatibility |
| CASH-03 | HIGH | FAIL | **PASS** ✅ | Dialog component fix (stale closure in onClose) |
| CASH-04 | MEDIUM | FAIL | **N/A** ✅ | No hidden required name/phone fields in current codebase |
| CASH-05 | PARTIAL | PARTIAL | **PASS** ✅ | Weight + button now increments correctly (0.5 kg steps) |

---

## Summary

**All Cashier workflows now functional:**
- ✅ Create customers via "Tambah pelanggan" dialog
- ✅ Create orders with proper price calculation
- ✅ Form validation prevents invalid submissions
- ✅ Successful orders persist and appear in orders list
- ✅ No console errors

**Files Fixed:**
- `src/components/orders/new-order-form.tsx` — form validation, price calculation
- `src/components/ui/dialog.tsx` — dialog rendering (fixes customer dialog)
- `public/favicon.svg` — favicon
- `next.config.js` — dev tools disabled for production