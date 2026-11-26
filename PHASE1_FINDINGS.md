# Phase 1 — Application Discovery Report

## Environment Assessment

**Environment**: Development (local database `laundrysia` on MySQL)
**Current Date**: 2026-11-24 (based on existing data timestamps)
**Existing Data Status**: Contains test/QA data only — no production customer data
**Safety**: Safe to proceed with dummy data generation

---

## Data Model Summary

### Core Entities

| Entity | Table | Key Fields |
|--------|-------|------------|
| **User** | `users` | id, name, username, passwordHash, role (MANAGER/CASHIER), isActive |
| **Customer** | `customers` | id, name, phone (unique), address, isActive, createdAt |
| **Service** | `services` | id, name, unit (KG/PIECE), price (int rupiah), turnaroundDays, isActive |
| **Order** | `orders` | id, invoiceNo (unique), customerId, status, subtotal, discount, total, note, pickupDate, createdById, voidedAt, voidReason |
| **OrderItem** | `order_items` | id, orderId, serviceId, serviceName, unit, unitPrice, quantity (decimal), lineTotal |
| **Payment** | `payments` | id, orderId, amount, method (CASH/TRANSFER/EWALLET), paidAt, receivedById |
| **Expense** | `expenses` | id, category (ELECTRICITY_WATER/WAGES/RENT/OTHER), amount, paidFrom (CASH/BANK), date, note, createdById, reversedAt |
| **Supply** | `supplies` | id, name, unit, stockQty, minQty, avgUnitCost |
| **JournalEntry/Line** | `journal_entries`/`journal_lines` | Double-entry accounting for all financial events |
| **InvoiceCounter** | `invoice_counters` | Daily sequential invoice numbering |
| **Setting** | `settings` | Key-value configuration |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | MANAGER, CASHIER |
| `ServiceUnit` | KG, PIECE |
| `OrderStatus` | RECEIVED, WASHING, DRYING_IRONING, READY, COMPLETED |
| `PaymentMethod` | CASH, TRANSFER, EWALLET |
| `PaymentSource` | CASH, BANK |
| `ExpenseCategory` | ELECTRICITY_WATER, WAGES, RENT, OTHER |

---

## Existing Data (as of 2026-11-24)

| Entity | Count | Notes |
|--------|-------|-------|
| Customers | 6 | Mix of test names (some appear to be real Indonesian names from manual testing) |
| Orders | 9 | All from Nov 2026, statuses: 7 COMPLETED, 2 READY |
| Services | 5 | 4 active: Express (12k/kg), Kiloan (7k/kg), kilat (10k/kg), super kilat (14k/kg); 1 inactive: Cuci + setrika (8k/kg) |
| Users | 2 | Manager (id:1), Cashier (id:2) |
| Expenses | 1 | ELECTRICITY_WATER, 200 rupiah (test amount) |
| Payments | 9 | Mix of CASH and TRANSFER; some orders have multiple payments |
| Supplies | 0 | None yet |

---

## Business Rules Discovered

### Order Creation
1. Requires: active customer, at least one active service, valid pickup date (≥ today)
2. Items: serviceId + quantity (stored as decimal hundredths for KG)
3. Pricing: `lineTotal = service.price × quantity` (quantity in hundredths for KG)
4. Subtotal = sum of lineTotals
5. Discount ≤ subtotal
5. Total = subtotal - discount
6. Payment types: FULL (pay total), DEPOSIT (partial < total), LATER (pay 0)
7. Invoice format: `INV-YYYYMMDD-NNN` (daily counter)
8. Creates journal entry: Dr Cash/Bank (if deposit) + Dr Receivables (balance), Cr Revenue

### Order Status Flow
`RECEIVED` → `WASHING` → `DRYING_IRONING` → `READY` → `COMPLETED`
- Only MANAGER can reverse status
- COMPLETED with balance requires MANAGER override + note
- Orders can be voided (manager only) with reason

### Payments
1. Applied to specific order
2. Methods: CASH, TRANSFER, EWALLET
3. Cannot exceed order balance
4. Creates journal entry: Dr Cash/Bank, Cr Receivables
5. Multiple payments per order allowed

### Expenses
1. Categories: ELECTRICITY_WATER, WAGES, RENT, OTHER
2. Paid from: CASH or BANK
3. Creates journal entry: Dr Expense account, Cr Cash/Bank
4. Can be reversed (manager only) with reason ≥5 chars

### Accounting (Double-Entry)
- **Accounts**: 1-100 Kas, 1-110 Bank, 1-200 Piutang Usaha, 1-300 Persediaan, 1-400 Peralatan, 3-100 Modal, 4-100 Pendapatan, 5-100 Beban Perlengkapan, 5-200 Beban Listrik, 5-300 Beban Gaji, 5-400 Beban Sewa, 5-900 Beban Lain
- All amounts stored as **integer rupiah** (no decimals)
- Reports: Income Statement, Cash Flow, Balance Sheet, Sales, Ledger, Trial Balance

### Business Date
- Timezone: Asia/Jakarta (UTC+7)
- Business date = calendar date in Jakarta timezone
- Used for invoice numbering, report filtering, daily dashboards

---

## Application Pages / Features

| Page | Path | Role | Key Functions |
|------|------|------|---------------|
| Login | `/login` | All | Username/password |
| Dashboard | `/` | MANAGER | Today's earned/received/to-collect, ready orders, low stock, 7-day chart |
| Orders List | `/orders` | All | Filter by status, date, customer, invoice, payment state; pagination |
| New Order | `/orders/new` | All | Customer search, multi-service items, discount, payment type, pickup date, note |
| Order Detail | `/orders/[id]` | All | Status progression, payment collection, print ticket, void (manager) |
| Customers | `/customers` | All | Search, add/edit (manager), activate/deactivate (manager) |
| Expenses | `/expenses` | MANAGER | Add expense, view list with balances, reverse expense |
| Receivables | `/receivables` | MANAGER | Outstanding orders with aging, receive payment |
| Counter | `/counter` | All | Today's orders by status |
| Reports | `/reports` | MANAGER | Income statement, cash flow, balance sheet, sales, ledger, trial balance |
| Settings | `/settings` | MANAGER | Navigate to services |
| Services | `/settings/services` | MANAGER | CRUD services (name, unit, price, turnaround, active) |
| Stock | `/stock` | MANAGER | Supplies management |

---

## Proposed Data Generation Plan

### Simulation Period
- **End Date**: 2026-11-24 (current business date)
- **Start Date**: 2025-01-01 (24 calendar months: Jan 2025 – Nov 2026)
- **Approach**: Back-date orders, payments, expenses using `createdAt` manipulation (as done in demo.ts)

### Target Volumes (adjustable based on UI performance)

| Data Type | Target | Strategy |
|-----------|--------|----------|
| Customers | 150 | Create 144 new fictional Indonesian customers; keep 6 existing |
| Services | 4 active | Use existing 4 active services |
| Orders | 2,000 | ~83/month average; vary by seasonality |
| Expenses | 350 | ~15/month; recurring + variable |
| Payments | ~2,500 | Multiple per order for installments |
| Order Status Distribution | Realistic | Mix of all 5 statuses; some voided |

### Customer Archetypes (150 total)
| Type | Count | Behavior |
|------|-------|----------|
| Regular weekly | 25 | Order every 1-2 weeks, pay FULL |
| Regular biweekly | 30 | Order every 2-4 weeks, pay FULL/DEPOSIT |
| Occasional | 40 | 3-6 orders/year, mixed payment |
| Heavy/bulk | 15 | Large quantities (10-50kg), pay DEPOSIT/LATER |
| Installment payers | 20 | Frequently DEPOSIT, pay balance in 2-3 installments |
| Chronic debt | 10 | Often LATER, slow to pay, some unpaid |
| Churned | 10 | Active first 12 months, then stop |

### Seasonality Pattern
| Period | Multiplier | Notes |
|--------|------------|-------|
| Jan | 1.0 | Baseline |
| Feb | 1.1 | Chinese New Year |
| Mar | 0.9 | Post-holiday dip |
| Apr | 1.0 | |
| May | 1.15 | Lebaran prep |
| Jun | 1.25 | **Peak - Lebaran** |
| Jul | 1.0 | Post-Lebaran |
| Aug | 1.0 | |
| Sep | 0.95 | |
| Oct | 1.0 | |
| Nov | 1.05 | Year-end |
| Dec | 1.2 | **Peak - Christmas/New Year** |

### Payment Distribution (per order)
| Type | % | Description |
|------|---|-------------|
| FULL | 55% | Paid in full at order |
| DEPOSIT | 20% | 30-70% deposit, balance in 1-2 payments |
| LATER | 15% | Pay 0 at order, pay later |
| Unpaid | 10% | Never fully paid (some partial) |

### Expense Categories Distribution
| Category | Monthly Frequency | Amount Range |
|----------|-------------------|--------------|
| ELECTRICITY_WATER | 1/month | 800k - 2.5M |
| WAGES | 1/month | 3M - 8M |
| RENT | 1/month | 2M - 5M |
| OTHER (supplies, repairs, etc.) | 2-4/month | 100k - 1M |

---

## Safety Checks

- [x] Environment is development (local database)
- [x] No real customer data (existing 6 customers are test/QA)
- [x] No external integrations triggered (Telegram, payment gateways, maps)
- [x] Idempotency keys will prevent duplicate submissions
- [x] All operations go through application UI via Playwright
- [x] Will preserve existing 6 customers and 9 orders (additive only)

---

## Next Steps

**Awaiting approval to proceed with Phase 2+3: Begin batch data generation via Playwright.**

### Batch Plan
1. **Batch 1**: Create 144 fictional customers + verify services
2. **Batch 2**: Generate Q1 2025 orders (Jan-Mar) ~250 orders
3. **Batch 3**: Generate Q2 2025 orders (Apr-Jun) ~250 orders
4. **Batch 4**: Generate Q3 2025 orders (Jul-Sep) ~250 orders
5. **Batch 5**: Generate Q4 2025 orders (Oct-Dec) ~250 orders
6. **Batch 6**: Generate Q1 2026 orders (Jan-Mar) ~250 orders
7. **Batch 7**: Generate Q2 2026 orders (Apr-Jun) ~250 orders
8. **Batch 8**: Generate Q3-Q4 2026 orders (Jul-Nov) ~250 orders
9. **Batch 9**: Generate payments for all orders (partial, installment, delayed)
10. **Batch 10**: Generate 24 months of expenses
11. **Batch 11**: Final verification & report