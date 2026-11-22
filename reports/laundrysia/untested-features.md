# Untested Features — LaundrySIA

**Application:** LaundrySIA
**Tested:** 2026-11-22
**Roles:** Kasir (Cashier), Manajer (Manager)

---

## Features Not Tested

The following features were discovered but could not be exercised during this audit. Each entry includes the reason it remains untested.

### A. Cashier — Not Tested

| Feature | Page | Reason Not Tested |
|---------|------|-------------------|
| Batal (Cancel) on new order form | /orders/new | Clicking would abandon form data; not exercised to avoid losing test state |
| Tambah layanan (Add service line) on order form | /orders/new | Not exercised; form submission already broken, adding more lines would not change outcome |
| Order search (Cari) | /orders | No orders exist in system to search |
| Order status filter | /orders | No orders exist to filter |
| Order date filter | /orders | No orders exist to filter |
| Customer search | /customers | No customers exist to search |
| Customer creation via working dialog | /customers | Dialog body is empty (Defect D-03) — cannot create customer to test with |
| Order status tab viewing (Diterima, Dicuci, etc.) | /counter | All tabs show 0; no orders exist to display |

### B. Manager — Not Tested

| Feature | Page | Reason Not Tested |
|---------|------|-------------------|
| Counter page (Manager view) | /counter | Not navigated to from Manager session |
| Report detail: Income Statement | /reports/income-statement | No financial data to generate report |
| Report detail: Cash Flow | /reports/cash-flow | No financial data to generate report |
| Report detail: Balance Sheet | /reports/balance-sheet | No financial data to generate report |
| Report detail: Sales | /reports/sales | No sales data to generate report |
| Report detail: Ledger | /reports/ledger | No account mutations to display |
| Report detail: Trial Balance | /reports/trial-balance | No accounting entries to display |
| Expense creation (Tambah pengeluaran) | /expenses | No expense data; button not clicked |
| Supply creation (Tambah supply) | /stock | No supply data; button not clicked |
| Purchase recording (Catat pembelian) | /stock | No purchase data; button not clicked |
| Usage recording (Catat pemakaian) | /stock | No usage data; button not clicked |
| Service edit (Ubah) | /settings/services | Not clicked; would modify existing service data |
| Service deactivation (Nonaktifkan) | /settings/services | Not clicked — DESTRUCTIVE operation, not authorized |
| Audit filter: Terapkan button | /audit | Filter criteria not entered; button not clicked |
| Audit filter: User selection | /audit | Not exercised |
| Audit filter: Action selection | /audit | Not exercised |
| Audit filter: Date range | /audit | Date fields not filled |

### C. Cross-Role Features — Not Tested

| Feature | Reason Not Tested |
|---------|-------------------|
| Cashier-created order visible to Manager | No order was successfully created (Defect D-01) |
| Cashier-created customer visible to Manager | No customer was successfully created (Defect D-03) |
| Manager service configuration affecting Cashier orders | No service was successfully added (Defect D-04) |
| Dashboard statistics updating after order creation | No orders exist to update statistics |
| Receivables updating after order/payment | No orders with outstanding balances exist |

### D. Technical Features — Not Tested

| Feature | Reason Not Tested |
|---------|-------------------|
| Responsive layout at tablet viewport (~768px) | Only desktop (1280×720) and mobile (375×667) were tested |
| Dark mode / color scheme | Not investigated |
| Print functionality (receipt/invoice) | No orders exist to print |
| Export functionality (reports) | No data to export |
| File upload (if any) | No upload controls discovered |
| Email/WhatsApp notifications | Not triggered (would be external communication — prohibited) |

---

## Features Blocked by Defects

The following features cannot be tested because they are blocked by confirmed defects:

| Feature | Blocking Defect | Page |
|---------|----------------|------|
| Order creation workflow | D-01 (submit fails), D-02 (price calc = 0) | /orders/new |
| Customer creation | D-03 (dialog empty body) | /customers |
| Service creation | D-04 (dialog empty body) | /settings/services |
| Form submission with visible validation | D-05 (hidden required fields) | /orders/new |

---

## Features Marked as NOT AVAILABLE

The following routes/features were probed and do not exist in the application:

| Route | Reason |
|-------|--------|
| /manager | 404 Not Found |
| /admin | 404 Not Found |
| /services | 404 Not Found |
| /employees | 404 Not Found |
| User administration page | Not present in navigation |
| Role management page | Not present in navigation |

---

## Summary

| Category | Count |
|----------|-------|
| Features not tested (Cashier) | 8 |
| Features not tested (Manager) | 14 |
| Features not tested (Cross-role) | 4 |
| Features not tested (Technical) | 5 |
| Features blocked by defects | 4 |
| Features not available | 4 |
| **Total untested/not available** | **35** |

The majority of untested features are a direct consequence of the core defects (D-01 through D-05) that prevent order, customer, and service creation. Once those defects are resolved, most of the untested features can be exercised.
