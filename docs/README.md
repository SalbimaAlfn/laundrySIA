# Documentation for LaundrySIA

This directory contains visual references and walkthrough documentation for the application.

## Screenshots

All screenshots below are exported from a production-like view (1440x1000, desktop layout) and show the Indonesian interface. Screenshots include:
- Claims tickets (orders)
- Counter board (cashier view)
- Manager dashboards and reports

### Application Screenshots

| Screenshot | URL | Description |
|---|---|---|
| Dashboard | `/dashboard` | Money earned versus received today, orders ready, low-stock list |
| Reports | `/reports` | Overview of all reports (income statement, cash flow, balance sheet) |
| Income Statement | `/reports/income-statement` | Period-aligned income statement with tax line |
| Cash Flow | `/reports/cash-flow` | Cash in from orders and payments, cash out for expenses |
| Balance Sheet | `/reports/balance-sheet` | Assets (inventory, cash, receivables) and equity |
| Orders | `/orders` | Order list with filters (date, status, customer) |
| Counter | `/counter` | Board with one column per order status |
| Audit | `/audit` | Filterable log of all actions (login, order changes, voids, expenses) |

**Note:** All screenshots were captured using `scripts/shots.mjs` against a browser QA window (`http://127.0.0.1:9222`) to provide a reliable, repeatable visual reference. The script requires `SESSION_TOKEN` in the environment for authentication.

### Claim Tickets

Claim tickets are shown inside the order detail screen (hover/click on a saved order). They support:
- 80mm thermal printer format (named page `print-80mm`)
- A5 full-page format (named page `print-a5`)
- Paid stamp (animated with `prefers-reduced-motion`)

## Demo Walkthrough

After running `npm run db:seed` and `npm run db:demo`, follow these steps to recreate the worked example from `PRD.md` section 13.

### Step-by-step Summary

1. **Initial state**: Opening capital = Rp 1.000.000
2. **Create Order 1**: 5 kg @ Rp 8.000/kg = Rp 40.000, place Rp 15.000 cash deposit
3. **Create Order 2**: 3 kg express @ Rp 12.000/kg = Rp 36.000, pay in full with cash
4. **Create Order 3**: 10 kg @ Rp 7.000/kg = Rp 70.000, pay later (no payment yet)
5. **Purchase supplies**: Buy detergent for Rp 120.000 cash
6. **Receive payment on Order 1**: Pay remaining Rp 25.000
7. **Record expense**: Electricity bill Rp 300.000 cash

### Expected Numbers (After Step 7)

| Account | Balance |
|---|---|
| Cash | Rp 656.000 |
| Receivables | Rp 70.000 |
| Inventory | Rp 120.000 |
| Assets total | Rp 846.000 |
| Revenue | Rp 146.000 |
| Expenses | Rp 300.000 |
| Net Profit | Rp -154.000 |
| Equity total | Rp 846.000 |
| Cash in (orders + payments) | Rp 76.000 |
| Cash out (expenses only) | Rp 420.000 |
| Net cash movement | Rp -344.000 |

All numbers should match the reports. The trial balance must be equal.

### Void Order Example

To verify void handling:
1. Open Order 2 (the full paid order)
2. Choose **Void order** and confirm
3. The system shows Rp 36.000 to return
4. After confirming, cash = Rp 620.000 and revenue = Rp 110.000 (3.000 discount already applied)

The void reverses all journal entries related to that order.

## README Setup Verification

This section documents setup tested on a clean machine.

### Tested On

- Operating system: Windows
- Node.js: v20.x LTS
- Database: MySQL/MariaDB 10.6+ (Laragon)
- Architecture: x86_64 (D:\LaundrySIA)

### Process

1. Clone repository
2. Run `npm install`
3. Copy `.env.from.example` → `.env` with strong `SESSION_SECRET`
4. Verify MySQL is running
5. Create database `laundrysia` (utf8mb4)
6. Run `npm run db:check`, `npm run db:migrate`, `npm run db:seed`
7. Start with `npm run dev`
8. Sign in as manager and run `npm run db:demo`

### Result

All commands succeed, app starts on `http://localhost:3000`, and demo data loads correctly. No additional packages or configuration outside the listed tech stack are required.

## Known Limitations (Static Documentation)

The interactive limitations in `README.md` (sections below) remain accurate:
- One shop, no branches
- Atomic transactions and immutability of journal entries
- Role-based access enforced on the server
- Integer-only money (no floats anywhere)
- Reports export as CSV; dashboard chart is CSS-only
- Language switcher exists but not wired
- Accessibility and responsive pass requires manual browser review