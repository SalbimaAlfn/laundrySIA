# task.md: build plan for LaundrySIA

This file tells an AI coding assistant (or a human) exactly what to build, in what order, and how to know each piece is done.

LaundrySIA is a laundry management web app with built-in accounting. Cashiers take orders and payments. The system automatically posts balanced journal entries. Managers read reports.

---

## A. Instructions for the AI assistant

### Read in this order, before writing any code

1. `README.md` for the tech stack, commands, and folder layout.
2. `PRD.md` for behavior, rules, and numbers. It is the source of truth for what the app does.
3. `design.md` for colors, type, components, and screens.
4. This file for what to do next.

### How to work

- Do **one task at a time**, in the order given. Start from the first unchecked task whose dependencies are done. Say which task you are doing.
- Before coding a task, restate its goal and acceptance checks in two or three lines.
- After coding, run the checks in section B and report the result. Do not mark a task done if a check fails.
- If something is missing or unclear, **ask** or add it to the open questions in `PRD.md` section 15. Do not invent behavior.
- Keep changes small. Do not refactor unrelated files. Do not add libraries that are not in the README stack without asking.
- Tick the checkbox of a finished task in this file and add one line of notes if anything differs from the plan.

### Non-negotiable rules (breaking any of these is a bug)

1. **Money is integer rupiah.** Never floats, never `Number` math scattered around. All money math goes through `src/lib/money.ts`.
2. **Every multi-step write is one database transaction** (`prisma.$transaction`). An order, its items, its payment, and its journal entry are saved together or not at all.
3. **Journal entries always balance** (total debit equals total credit) and are **never updated or deleted**. Corrections use reversing entries.
4. **No delete endpoints** for orders, payments, expenses, or journal entries. Void or reverse only.
5. **Authorization is checked on the server**, inside every server action and page, with `requireRole()`. Hiding a button is never enough.
6. **Validate every input with Zod on the server.** One shared schema per form.
7. **Derive, don't store:** the paid amount and the payment state are computed from payments. Do not add stored columns for them.
8. **Copy, don't reference, prices:** order items copy service name, unit, and price at order time.
9. **Dates:** store UTC, compute business dates and display in Asia/Jakarta (WIB). Use the helpers in `src/lib/dates.ts`.
10. **UI follows `design.md`:** use the CSS tokens, one honey button per screen, status shown with color plus icon plus words, sentence-case plain copy, no gradients, no entrance animations.
11. **Never expose accounting words** (debit, credit, journal) to the cashier. Managers see them only in ledger and trial balance views.
12. **All user-facing text** goes through the dictionary file `src/lib/i18n/` so Indonesian and English both work.

### Conventions

- TypeScript strict. No `any` unless commented with a reason.
- Server code in `src/server/` (actions, queries, accounting). UI in `src/app/` and `src/components/`. Shared helpers in `src/lib/`.
- Reads happen in Server Components. Writes happen in Server Actions that return `{ ok: true, data }` or `{ ok: false, error }` (never throw for expected validation errors).
- File and folder names are kebab-case. Components are PascalCase.
- Every server action: (1) `requireRole`, (2) parse with Zod, (3) run in a transaction, (4) write an audit log row, (5) `revalidatePath`.
- Tests live next to the code as `*.test.ts` and run with Vitest.

### Task format

Each task has an ID, a priority (P1 must, P2 should, P3 nice), dependencies, what to do, and acceptance checks. Requirement IDs (FR-xx) point to `PRD.md`.

---

## B. Checks to run after every task

```bash
npm run typecheck   # TypeScript, no errors
npm run lint        # ESLint, no errors
npm run test        # Vitest, all green
npm run build       # only at the end of a phase
```

A task is done only when its own acceptance checks **and** these pass.

---

## C. Phase 0: Project setup

- [x] **T-001 (P1) Create the project**
  - Depends on: none
  - Do: create a Next.js project with App Router and TypeScript, in `src/` layout, no Tailwind. Add scripts `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `check` (runs typecheck, lint, and test).
  - Do: enable `"strict": true` and `noUncheckedIndexedAccess` in `tsconfig.json`.
  - Accept: `npm run dev` shows the default page. `npm run check` passes.

- [x] **T-002 (P1) Connect the database with Prisma**
  - Depends on: T-001
  - Do: install Prisma and the MariaDB/MySQL driver adapter as described in the **official Prisma 7 docs for MySQL** (it needs `@prisma/adapter-mariadb` and the `mariadb` driver, and the connection URL goes in `prisma.config.ts`). Create `src/server/db.ts` exporting one shared client (guard against creating many clients during hot reload).
  - Do: add `.env.example` with `DATABASE_URL` and `SESSION_SECRET`. Add `.env` to `.gitignore`.
  - Accept: a tiny script or test can run a `SELECT 1` through the client. Documented in README.
  - Note: Prisma 7.10.1 with `@prisma/adapter-mariadb`; the connection URL lives in `prisma.config.ts`. `npm run db:check` proves `SELECT 1`.

- [x] **T-003 (P1) Quality tooling**
  - Depends on: T-001
  - Do: ESLint (Next.js config) and Prettier, Vitest with a first passing test, path alias `@/` for `src/`.
  - Accept: `npm run lint`, `npm run test` pass on a clean checkout.
  - Note: Vitest 5 with `vitest.config.mts`; the `@/` alias is configured in both TypeScript and Vitest.

- [x] **T-004 (P1) Design foundation**
  - Depends on: T-001
  - Do: copy the token block from `design.md` section 12 into `src/app/globals.css`. Load Bricolage Grotesque and Figtree with `next/font/google` as shown in `design.md`. Set `lang="id"`. Add a `:focus-visible` style and the `prefers-reduced-motion` rule.
  - Do: build base components with CSS Modules: `Button` (primary, secondary, text, danger), `Field`, `MoneyInput`, `StatusBadge`, `Toast`, `Dialog`, `DataTable`.
  - Accept: a temporary `/dev/components` page shows each component in each state. Contrast matches `design.md` section 3.5. Keyboard focus is visible. Remove or protect this page before the final build.
  - Note: primitives live in `src/components/ui/`. `/dev/components` returns 404 in production.

---

## D. Phase 1: Database and helpers

- [x] **T-010 (P1) Prisma schema**
  - Depends on: T-002
  - Do: model every table in `PRD.md` section 10 with the exact enums, unique keys, and relations. Money columns are `Int`. Quantity columns are `Decimal`. Add indexes on `orders.createdAt`, `orders.customerId`, `orders.status`, `payments.orderId`, `journal_lines.accountId`, `journal_entries.entryDate`, `journal_entries(refType, refId)`.
  - Accept: `prisma migrate dev` creates a clean migration. The schema has no delete cascades on financial tables.
  - Note: migration `20261023160000_init` is applied to `laundrysia` and `laundrysia_test`. The app user cannot create a shadow database, so `npm run db:migrate` uses `migrate deploy`; the README documents how to generate the next migration.

- [x] **T-011 (P1) Money, dates, and invoice helpers** (with tests)
  - Depends on: T-003
  - Do: `src/lib/money.ts`: `lineTotal(unitPrice, quantity)` using integer math on hundredths with explicit rounding, `formatRupiah(n)` giving `Rp 40.000`, `parseRupiah(text)`, `sum(numbers)`.
  - Do: `src/lib/dates.ts`: `businessDate(date)` in Asia/Jakarta, `startOfDayWIB`, `endOfDayWIB`, `formatDate(date, locale)`.
  - Do: `src/lib/phone.ts`: `normalizePhone(text)` per `PRD.md` section 7.
  - Accept: unit tests cover rounding (for example 3,33 kg at 7.000), thousands formatting, midnight edge cases (23:30 WIB is the same business day while UTC is the previous day), and phone normalization (`+62 812-3456` becomes `0812...`).
  - Note: money math is integer hundredths; `invoice.ts` formats `INV-YYYYMMDD-NNN`. Tests cover WIB day boundaries, rounding, quantity parsing, and phone prefixes.

- [x] **T-012 (P1) Seed script**
  - Depends on: T-010
  - Do: `prisma/seed.ts` creates the 12 accounts from `PRD.md` section 8.1, two users (a manager and a cashier with documented demo passwords, hashed), the three demo services (Wash + iron 8.000/kg, Express 12.000/kg, Kiloan kos 7.000/kg), and no orders.
  - Accept: `npm run db:seed` can run twice without duplicating rows. README lists the demo logins and says to change them.
  - Note: runs twice without duplicates. Re-runs keep manager edits to services and settings; passwords are only written on first creation.

- [x] **T-013 (P1) Zod schemas**
  - Depends on: T-011
  - Do: `src/lib/schemas/` with one file per form: customer, order, payment, expense, supply purchase, supply usage, service, user, void. Rules exactly as in `PRD.md` section 7. Error messages come from the dictionary.
  - Accept: tests cover at least one valid and one invalid case per schema, including overpayment limits and phone validation.
  - Note: messages live in `src/lib/i18n.ts` with Indonesian and English catalogs. Schemas cover all listed forms plus shop profile and opening balance; 40 schema tests cover the rules.

---

## E. Phase 2: Authentication and app shell

- [x] **T-020 (P1) Login and sessions** (FR-01, FR-02, FR-04)
  - Depends on: T-012
  - Do: `bcryptjs` for password check. Sign a session token with `jose` (HS256, secret from env) and store it in an httpOnly, SameSite=Lax, Secure-in-production cookie. Provide `getSession()`, `requireUser()`, and `requireRole(role)` in `src/server/auth.ts`. Reject inactive users on every request.
  - Do: login page per `design.md` 7.1, logout action, redirect after login (cashier to `/counter`, manager to `/dashboard`).
  - Accept: wrong password shows "Username or password is not correct." Inactive users cannot log in. Direct URL access without a session redirects to `/login`. Tests cover `requireRole` allow and deny.
  - Notes: tokens live in `src/server/session.ts`; `getSession` reads the DB on every call so a deactivated user is rejected immediately. Login is covered by a real-database test in `src/server/actions/auth.test.ts`.

- [x] **T-021 (P1) Route protection**
  - Depends on: T-020
  - Do: middleware that redirects anonymous users to `/login`. Every manager page and action also calls `requireRole("MANAGER")` itself (middleware is not the only guard). Cashier hitting a manager URL is sent to `/counter` with the message from `PRD.md` section 14.
  - Accept: a manual or automated check proves a cashier cannot open `/dashboard`, `/reports/*`, `/expenses`, `/stock`, `/settings/*`, `/audit`, and cannot call the related actions.
  - Notes: Next 16 uses `src/proxy.ts` for the optimistic anonymous redirect. Manager pages call `requireRole`; a cashier is redirected to `/counter?notice=manager-only`.

- [x] **T-022 (P1) App shell and navigation**
  - Depends on: T-004, T-021
  - Do: the sidebar layout, tablet rail, and mobile bottom tab bar from `design.md` section 6. Manager-only items are not rendered for cashiers. Name and role with a Log out button at the bottom.
  - Accept: the layout works at 360px, 768px, and 1280px widths. Active item uses Honey fill. Tab order is logical.
  - Notes: `src/components/app-shell/app-shell.tsx` renders the Espresso sidebar, 72px tablet rail, and mobile tabs with the raised New order button and More dialog.

- [x] **T-023 (P1) Audit helper** (FR-70)
  - Depends on: T-010, T-020
  - Do: `writeAudit(tx, { userId, action, entityType, entityId, detail })` that works inside a transaction. Use it in login, and in every later action.
  - Accept: a test shows an audit row is created and is rolled back together with a failed transaction.
  - Notes: `src/server/audit.ts` takes `Prisma.TransactionClient`; login records success and failed attempts. `src/server/audit.test.ts` proves commit and rollback against `laundrysia_test`.

---

## F. Phase 3: Accounting engine (build and test before any screen uses it)

- [x] **T-030 (P1) Journal core** (FR-50, FR-54)
  - Depends on: T-010, T-011
  - Do: `src/server/accounting/journal.ts` with `postEntry(tx, { date, description, refType, refId, lines, createdById, reversesEntryId? })`. It must: load accounts by code, verify every line has exactly one positive side, verify total debit equals total credit (throw a typed error if not), then insert the entry and lines.
  - Do: `reverseEntry(tx, entryId, createdById)` creating a mirror entry with debit and credit swapped.
  - Accept: tests prove unbalanced entries are rejected, negative amounts are rejected, and reversing an entry nets the account balances to zero.

- [x] **T-031 (P1) Posting rules for orders and payments**
  - Depends on: T-030
  - Do: `postOrderEntry(tx, order, initialPayment?)` and `postPaymentEntry(tx, payment)` following `PRD.md` section 8.2 exactly (Cash for CASH, Bank for TRANSFER and EWALLET).
  - Accept: tests for pay in full, deposit, pay later, a later payment, and a zero-total order.

- [x] **T-032 (P1) Posting rules for expenses, purchases, usage, opening capital**
  - Depends on: T-030
  - Do: `postExpenseEntry`, `postPurchaseEntry`, `postUsageEntry` (weighted average cost per `PRD.md` section 8.2), `postOpeningEntry`.
  - Accept: tests for each, including weighted average cost after two purchases at different prices.

- [x] **T-033 (P1) Void reversal**
  - Depends on: T-031
  - Do: `reverseOrderEntries(tx, orderId, userId)` that finds all entries for the order and its payments (rule in `PRD.md` section 8.2) and reverses each.
  - Accept: tests voiding an order with no payment, with a deposit, and with a later payment. Account balances return to what they were before the order.

- [x] **T-034 (P1) Balance queries**
  - Depends on: T-030
  - Do: `src/server/accounting/queries.ts`: `accountBalance(code, asOf)`, `trialBalance(asOf)`, `ledger(code, from, to)`. Use SQL aggregation (sum of debit, sum of credit), not loops over all rows.
  - Accept: tests confirm trial balance debits equal credits after the scenario in `PRD.md` section 13.

---

## G. Phase 4: Customers and services

- [x] **T-040 (P1) Customers** (FR-10, FR-13)
  - Depends on: T-013, T-022, T-023
  - Do: customer list page, add and edit forms, a `CustomerSearch` combobox (search as you type by name or phone, show phone beside the name, keyboard navigable, 250ms debounce). Add-customer must also work inside the order screen without leaving it.
  - Accept: duplicate phone is rejected with the message in `design.md` section 13. Search matches partial names and partial phone numbers. Deactivated customers are hidden from search for new orders.

- [x] **T-041 (P1) Services and prices** (FR-11, FR-72)
  - Depends on: T-013, T-022, T-023
  - Do: manager-only services page: list, add, edit, activate or deactivate. No delete. A price change writes an audit row with old and new price.
  - Accept: a cashier cannot reach the page or call the action. Changing a price does not change any existing order.

---

## H. Phase 5: Orders

- [x] **T-050 (P1) createOrder server action** (FR-20, FR-21, FR-22, FR-30)
  - Depends on: T-031, T-040, T-041
  - Do: one transaction that: validates input, allocates the invoice number (increment `invoice_counters` for the WIB business date, retry up to 3 times on unique collision), copies service name, unit, and price into items, computes totals with `lineTotal`, creates the order, creates the first payment if any, posts the journal entry, writes an audit row, and returns the order.
  - Do: accept an idempotency key so a double-click or retry creates only one order.
  - Accept: tests for pay in full, deposit, pay later, full discount, invalid payment, double submit, and a forced failure mid-way that leaves no order, payment, journal, or counter change.
  - Note: the order creation test forces audit logging to fail after journal posting and verifies the transaction rolls back the order, payment, journal, and invoice counter.

- [x] **T-051 (P1) New order screen** (`design.md` 7.3)
  - Depends on: T-050, T-004
  - Do: two-pane layout with the live claim ticket preview. Customer search, item rows with weight stepper (0,5 steps), discount, pickup date (default from turnaround), payment type cards (Pay in full, Deposit, Pay later), method select (default Cash), Save order as the only Honey button.
  - Accept: the preview updates as you type. Server errors appear next to the right field. The button disables while saving. After saving, the ticket is shown with Print and New order.
  - Note: `NewOrderForm` covers the live preview, field errors, pending state, and saved ticket actions.

- [x] **T-052 (P1) Order list and detail** (FR-26)
  - Depends on: T-050
  - Do: `/orders` with filters (status, date, customer, invoice, payment state) and `/orders/[id]` with ticket, progress track, payments list, and actions. Pagination at 25 rows.
  - Accept: payment state shown is derived (never stored). Voided orders show the Void stamp and cannot be edited.
  - Note: list/detail derive payment totals from payment rows; void filtering and detail stamp use `voidedAt`, and pagination retains active filters.

- [x] **T-053 (P1) Status changes** (FR-23)
  - Depends on: T-052
  - Do: `advanceStatus` (any user, one step forward) and `reverseStatus` (manager, one step back). Reject skips. Reject any change on a void order. Write an audit row.
  - Accept: tests for the allowed and forbidden transitions per role.
  - Note: reverse requires manager authorization on the server and the detail screen hides the action for cashiers; voided orders reject both transitions.

- [x] **T-054 (P1) Counter board** (FR-27, `design.md` 7.2)
  - Depends on: T-053
  - Do: board with one column per status, cards with next-step button and a "Left to pay" chip, mobile swipe tabs. Voided orders do not appear.
  - Accept: moving a card updates the board without a full page reload. Columns show counts.
  - Note: the counter queries all non-void orders, derives payment balances, and revalidates the board after status actions; mobile uses scrollable status tabs.

- [x] **T-055 (P2) Claim ticket and printing** (FR-24)
  - Depends on: T-052
  - Do: the `ClaimTicket` component per `design.md` section 10 (Honey strip, perforation notches, Paid stamp, Void stamp). A print stylesheet for 80mm black and white and for A5.
  - Accept: printing from the browser shows only the ticket at the correct width. The Paid stamp animation respects reduced motion.
  - Note: shared `ClaimTicket` renders preview and detail stamps; print-size selector supports 80 mm thermal and A5 named pages. Paid motion is disabled by `prefers-reduced-motion`.

---

## I. Phase 6: Payments and receivables

- [x] **T-060 (P1) receivePayment server action** (FR-30, FR-31)
  - Depends on: T-031, T-052
  - Do: one transaction that locks the order row, recomputes the balance, rejects an amount above the balance or a void order, creates the payment, posts the payment entry, writes an audit row. Include an idempotency key.
  - Accept: tests for partial payment, exact payment, overpayment rejected, void order rejected, and two simultaneous payments that together exceed the balance (only one succeeds).
  - Note: the transaction locks the order row, reads current payments under lock, posts journal/audit atomically, and uses a user-scoped idempotency key.

- [x] **T-061 (P1) Receive payment UI**
  - Depends on: T-060
  - Do: dialog on the order detail and the board card. Amount defaults to the balance, with a Pay in full shortcut. Toast: "Payment saved. Balance is now Rp X." When the balance is zero, the Paid stamp animates in.
  - Accept: keyboard-only use works end to end.
  - Note: shared native dialog is on the order detail and counter cards; it defaults to the balance, supports full payment, and announces the saved balance.

- [x] **T-062 (P2) Receivables list** (FR-32)
  - Depends on: T-060
  - Do: list of non-void orders with a balance, sorted by age, with customer, amount, days, and a Receive payment button. Total at the top.
  - Accept: the total equals the Receivables account balance (test it).
  - Note: the page lists non-void open balances oldest first; integration test checks the list balance against the matching Receivables ledger change.

- [x] **T-063 (P3) Completed rule** (FR-33)
  - Depends on: T-053, T-060
  - Do: block Completed while a balance remains. Manager override requires a note and is audited.
  - Accept: tests for both paths.
  - Note: implemented server-side balance check in advanceStatusAction, override dialog for managers in OrderDetail and CounterBoard, audit logging with overrideNote and overrideBalance. 12 tests pass including block, override, and zero-balance paths.

---

## J. Phase 7: Expenses and stock (manager)

- [x] **T-070 (P1) Expenses** (FR-40, FR-72)
  - Depends on: T-032, T-022
  - Do: expenses page (list left, form right). Server action posts the entry and writes an audit row. No edit or delete: a mistake is fixed by voiding with a reversing entry (add a Reverse button that requires a reason).
  - Accept: cashier is blocked. Toast shows the new cash balance. The reversal restores balances.
  - Note: backend (`expenses.ts`) and UI (`expenses-manager.tsx`) complete. Tests pass. Lint fixed.

- [ ] **T-071 (P1) Supply purchases** (FR-41)
  - Depends on: T-032
  - Do: supplies list and purchase form. Purchase increases stock, updates average cost, and posts the entry in one transaction.
  - Accept: tests for the average cost calculation.

- [ ] **T-072 (P2) Supply usage and low stock** (FR-42, FR-43)
  - Depends on: T-071
  - Do: usage form that rejects usage above stock, posts the usage entry at average cost. Low-stock banner and dashboard list.
  - Accept: stock never goes negative.

---

## K. Phase 8: Reports and dashboard (manager)

- [ ] **T-080 (P1) Report query layer**
  - Depends on: T-034
  - Do: functions for income statement, cash flow, balance sheet, sales, and who owes exactly as defined in `PRD.md` section 9. Use database aggregation.
  - Accept: tests reproduce every number in the worked example in `PRD.md` section 13.

- [ ] **T-081 (P1) Income statement and cash flow pages** (FR-61, FR-62)
  - Depends on: T-080
  - Do: period presets (Today, This week, This month, Custom), a one-sentence plain-language summary, then the table. Print-friendly.
  - Accept: numbers match the query layer. The summary text is generated from the same numbers.

- [ ] **T-082 (P1) Dashboard** (FR-60, `design.md` 7.5)
  - Depends on: T-080
  - Do: the earned versus received comparison bars, to-collect list, low-stock list, and orders ready.
  - Accept: figures match the reports for the same day.

- [ ] **T-083 (P2) Balance sheet and trial balance** (FR-53, FR-63)
  - Depends on: T-080
  - Do: pages with an "Assets equal Equity" check line that turns red with an explanation if they ever differ.
  - Accept: balanced after the worked example.

- [ ] **T-084 (P2) Sales report and ledger** (FR-52, FR-64)
  - Depends on: T-080
  - Do: sales by service and day (excluding void orders). Ledger per account with running balance.
  - Accept: ledger totals match account balances.

- [ ] **T-085 (P3) Exports and chart** (FR-65, FR-66)
  - Depends on: T-081
  - Do: Excel export of reports with `exceljs` through a route handler (manager only). A 7-day revenue bar chart with Recharts (Honey bars, today in Ember, labeled axes).
  - Accept: the exported file opens in Excel with correct numbers. The chart has a text alternative.

---

## L. Phase 9: Hardening, demo, and documentation

- [ ] **T-090 (P1) Void order** (FR-25, FR-71)
  - Depends on: T-033, T-052
  - Do: manager-only action. The dialog states the cash to return to the customer. Requires a reason. One transaction: set void fields, reverse all entries, write an audit row.
  - Accept: tests from `PRD.md` section 13 step 8. Void orders cannot be modified, advanced, or paid.

- [ ] **T-091 (P1) Audit log page** (FR-70)
  - Depends on: T-023
  - Do: manager-only list with filters by user, action, and date.
  - Accept: every action in the plan creates a row.

- [ ] **T-092 (P1) End-to-end accounting test**
  - Depends on: T-090, T-080
  - Do: one automated test that runs the entire scenario in `PRD.md` section 13 through the real server actions against a test database, and asserts every expected number and the six invariants in `PRD.md` section 8.3.
  - Accept: passes. This test is the safety net for all future changes.

- [ ] **T-093 (P1) Demo data**
  - Depends on: T-092
  - Do: `npm run db:demo` loads the worked example plus about 30 more realistic orders across a month.
  - Accept: dashboards and reports look realistic and totals reconcile.

- [ ] **T-094 (P2) Accessibility and responsive pass**
  - Depends on: all UI tasks
  - Do: go through `design.md` section 14 on every screen at 360px, tablet, and desktop. Keyboard-only run of creating an order and receiving a payment.
  - Accept: no failed item left on the checklist.

- [ ] **T-095 (P2) Language support**
  - Depends on: all UI tasks
  - Do: confirm no hard-coded user text. Indonesian is default and English works through the dictionary.
  - Accept: switching language changes every visible string.

- [ ] **T-096 (P1) Final documentation**
  - Depends on: T-093
  - Do: update README (setup tested on a clean machine), list known limitations, add 6 to 8 screenshots, and write the demo script from `PRD.md` section 13.
  - Accept: a new person can run the app from the README alone.

---

## M. Definition of done (whole project)

- [ ] All P1 tasks are checked
- [ ] `npm run check` and `npm run build` pass
- [ ] The end-to-end accounting test (T-092) passes
- [ ] A cashier cannot reach any manager page or action
- [ ] Trial balance is balanced and Assets equal Equity on the demo data
- [ ] Every screen passes the design check in `design.md` section 16
- [ ] README setup works on a clean machine

## N. Quick prompts to give the AI

- "Read README.md, PRD.md, design.md, and task.md. Then do the first unchecked task and tell me the result of the checks."
- "Do task T-050 only. Follow the non-negotiable rules in section A."
- "Review the code from task T-0xx against the non-negotiable rules and list any violations."
- "Write tests for the posting rules in T-031 using the numbers in PRD.md section 13."
