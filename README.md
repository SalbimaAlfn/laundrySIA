# LaundrySIA

A laundry management web app with built-in accounting. The cashier takes orders and payments. The system turns each one into balanced accounting entries automatically. The owner reads the income statement, cash flow, balance sheet, and who owes money, without doing any bookkeeping.

Built for the Sistem Informasi Akuntansi (SIA) course.

**Core flow:** Order, then payment, then automatic journal entry, then ledger, then reports.

---

## Documents in this repository

| File | What it is | Read it when |
|---|---|---|
| `README.md` | Overview, tech stack, setup, commands | First |
| `PRD.md` | What the app does: workflows, rules, data, acceptance scenario | Before building any feature |
| `design.md` | Colors, type, components, screens, microcopy | Before building any screen |
| `task.md` | Ordered build plan with checks for each task | To know what to do next |

If you use an AI coding assistant, tell it to read all four files in this order before it writes code.

---

## Features

**For cashiers**
- Search or add a customer while taking an order
- Create orders with weights, discounts, pickup dates, and a live claim ticket preview
- Pay in full, deposit, or pay later; receive the balance at pickup
- Counter board that shows every order by status, with one tap to move it on
- Print a claim ticket (80mm thermal or A5)

**For managers**
- Dashboard that shows money earned versus money received today
- Reports: income statement, cash flow, balance sheet, who owes, sales, ledger, trial balance
- Expenses, supply purchases, and stock with low-stock warnings
- Service prices and user accounts
- Void an order with a reason (nothing is ever deleted)
- Audit log of who did what and when

**Built-in controls**
- Two roles, enforced on the server
- Every journal entry balances, and entries are never edited or deleted
- Orders, payment, and journal entry are saved in one database transaction

---

## Tech stack

Chosen for one goal: **few moving parts, so fewer bugs**, and light enough for a low-spec laptop (designed to run in 4 GB of RAM).

| Layer | Choice | Why it fits |
|---|---|---|
| Runtime | Node.js 20 or newer (LTS) | Required by current Next.js |
| Framework | Next.js 16 (App Router) | UI and server in one project. Server Actions replace a separate API, so there is less glue code to break |
| Language | TypeScript, strict mode | Catches mistakes (especially wrong money or date types) before the app runs |
| UI | React, plain CSS with CSS Modules and design tokens, `lucide-react` icons, `next/font` | No styling framework to configure. Tokens come straight from `design.md` |
| Database | MySQL 8 or MariaDB 10.6+ | Reliable relational database with real transactions |
| ORM | Prisma 7 with `@prisma/adapter-mariadb` and the `mariadb` driver | Typed queries and tracked migrations. Schema and database cannot drift apart |
| Validation | Zod | One schema per form, used on the server. Bad input never reaches the database |
| Authentication | `jose` (signed session token in an httpOnly cookie) and `bcryptjs` | Small and fully understood. Pure JavaScript, so no native build problems on Windows |
| Dates | Built-in `Intl` with the `Asia/Jakarta` time zone | No date library to learn or update |
| Charts (optional) | Recharts | Simple bar chart for the dashboard |
| Excel export (optional) | `exceljs` | Reliable and maintained. Printing to PDF uses the browser print dialog, so no PDF library |
| Tests | Vitest | Fast and light. Used for money math, posting rules, and the full accounting scenario |
| Code quality | ESLint and Prettier | Consistent style, common mistakes flagged |

Money is stored as **integer rupiah**. There is no floating point math for money anywhere.

Deliberately **not used**: Tailwind, Docker, NextAuth, Redux, GraphQL, microservices. Each would add setup, memory use, or another place for bugs without helping this project. Playwright end-to-end tests are optional because they are heavy on small machines.

Version note: this stack reflects the current stable versions at the time of writing (Next.js 16.x and Prisma 7). Use the latest stable patch releases, and let `package-lock.json` pin the exact versions once installed.

### Why this setup has fewer bugs

1. TypeScript strict mode and Zod catch wrong data early.
2. Prisma migrations keep the database structure in version control.
3. Database transactions make multi-step writes all-or-nothing.
4. Integer money removes rounding surprises.
5. Journal entries are immutable and always balance, and tests prove it.
6. Permissions are checked on the server, not only in the interface.
7. One automated test runs the whole accounting scenario from `PRD.md`, so any change that breaks the books is caught.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 or newer (LTS) | Check with `node -v` |
| npm | Comes with Node | |
| MySQL or MariaDB | MySQL 8 or MariaDB 10.6+ | See the lightweight options below |
| Git | Any recent version | |
| Editor | VS Code (recommended) | |

### Lightweight setup for a low-spec laptop

- Avoid Docker Desktop. It uses a lot of RAM.
- On Windows, install **Laragon** or **XAMPP** and start only MySQL (or MariaDB). Do not start Apache.
- Close extra browser tabs while developing.
- Use `npm run dev` for daily work. Run `npm run build` only at the end of a phase.

---

## Getting started

### 1. Get the code and install packages

```bash
git clone <your-repository-url> laundrysia
cd laundrysia
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env        # Windows (Command Prompt): copy .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/laundrysia"
SESSION_SECRET="paste-a-long-random-string-here"
APP_TIMEZONE="Asia/Jakarta"
```

Create a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env`.

### 3. Create the database

In your MySQL or MariaDB client (phpMyAdmin, HeidiSQL, or the command line):

```sql
CREATE DATABASE laundrysia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Create the tables and load starting data

```bash
npm run db:check      # verifies the connection with SELECT 1
npm run db:migrate    # creates tables and generates the Prisma client
npm run db:seed       # accounts, demo users, services (safe to run twice)
```

Prisma 7 reads `DATABASE_URL` from `prisma.config.ts`, not from `schema.prisma`. The CLI does not load `.env` on its own, so the config file loads it with `dotenv`.

### Changing the schema

The app's MySQL user owns the app databases but cannot create the temporary shadow database that `prisma migrate dev` needs. `npm run db:migrate` therefore runs `prisma migrate deploy`. To add a migration, generate the SQL from the live database, review it, then apply it:

```powershell
New-Item -ItemType Directory prisma/migrations/20261024120000_add_something
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --output prisma/migrations/20261024120000_add_something/migration.sql
npm run db:migrate
```

The timestamp prefix must be unique and sort after the previous migration. If you prefer the standard `migrate dev` flow, create a separate shadow database, grant this user access to it, and set `shadowDatabaseUrl` in `prisma.config.ts`.

### 5. Start the app

```bash
npm run dev
```

Open http://localhost:3000.

```bash
npm run db:demo
```

This loads the worked example from `PRD.md` plus about 30 more orders spread across the last month, so the reports have something to show. The script is safe to run again; it skips work that already exists.

### Demo walkthrough (PRD section 13)

After `db:seed` and `db:demo`, sign in as the manager and open the reports:

1. Opening capital is Rp 1.000.000.
2. Order 1: 5 kg at Rp 8.000 = Rp 40.000, with a Rp 15.000 cash deposit.
3. Order 2: 3 kg express at Rp 12.000 = Rp 36.000, paid in full in cash.
4. Order 3: 10 kg at Rp 7.000 = Rp 70.000, pay later.
5. Buy detergent for Rp 120.000 cash.
6. Order 1 pays the remaining Rp 25.000 cash.
7. Electricity bill Rp 300.000 cash.

Expected after step 7: cash Rp 656.000, receivables Rp 70.000, inventory Rp 120.000, assets Rp 846.000, revenue Rp 146.000, expenses Rp 300.000, profit minus Rp 154.000, equity Rp 846.000, cash in Rp 76.000, cash out Rp 420.000, net cash movement minus Rp 344.000. The trial balance is equal.

To try the void flow, open Order 2, choose **Void order**, and confirm. The dialog shows Rp 36.000 to return; after confirming, cash is Rp 620.000 and revenue is Rp 110.000.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (run at the end of a phase) |
| `npm run start` | Run the production build |
| `npm run typecheck` | TypeScript check with no output files |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (all tests once) |
| `npm run check` | Typecheck, lint, and tests together. Run before every commit |
| `npm run format` | Format the code with Prettier |
| `npm run db:check` | Verify the database connection with `SELECT 1` |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Apply migrations and generate the Prisma client |
| `npm run db:seed` | Load accounts, demo users, and services |
| `npm run db:demo` | Load demo orders and payments |
| `npm run db:studio` | Open Prisma Studio to look at the data |
| `npm run db:reset` | Drop and recreate the database, then seed (development only) |

---

## Project structure

```text
laundrysia/
  README.md
  PRD.md
  design.md
  task.md
  .env.example
  prisma/
    schema.prisma          database models
    migrations/            tracked changes to the database
    seed.ts                accounts, users, services
    demo.ts                demo orders and payments
  prisma.config.ts         Prisma 7 configuration
  src/
    app/                   pages and layouts (Server Components)
      (auth)/login/
      (app)/counter/
      (app)/orders/
      (app)/customers/
      (app)/dashboard/
      (app)/expenses/
      (app)/stock/
      (app)/reports/
      (app)/settings/
      (app)/audit/
      globals.css          design tokens from design.md
    components/            Button, Field, MoneyInput, StatusBadge, ClaimTicket, ...
    server/
      db.ts                single shared Prisma client
      auth.ts              session, requireUser, requireRole
      actions/             Server Actions (orders, payments, expenses, ...)
      accounting/          journal core, posting rules, balance queries, reports
    lib/
      money.ts             all money math and Rupiah formatting
      dates.ts             WIB business dates
      phone.ts             phone normalization
      schemas/             Zod schemas, one per form
      i18n.ts              Indonesian and English dictionaries
```

Rule of thumb: reads in Server Components, writes in Server Actions, money math only in `lib/money.ts`, accounting only in `server/accounting/`.

---

## How the accounting works (short version)

The cashier never sees debits and credits. The system posts them:

| Event | Debit | Credit |
|---|---|---|
| Order of Rp 40.000 with Rp 15.000 paid now | Cash 15.000, Receivables 25.000 | Service Revenue 40.000 |
| Later payment of Rp 25.000 | Cash 25.000 | Receivables 25.000 |
| Electricity bill Rp 300.000 | Electricity and Water Expense 300.000 | Cash 300.000 |
| Detergent purchase Rp 120.000 | Supplies Inventory 120.000 | Cash 120.000 |
| Void an order | Reverse every earlier entry for that order | |

Full rules, chart of accounts, and a worked example with expected totals are in `PRD.md` sections 8 and 13.

---

## Testing

```bash
npm run test
```

What is covered:

- Money helpers: rounding, formatting, parsing
- Business date handling around midnight in WIB
- Phone normalization
- Zod schemas: valid and invalid input
- Login: wrong password, inactive account, role allow/deny, and a real-database login that sets the session cookie
- Audit helper: rows commit with their transaction and roll back when it fails
- Journal core: unbalanced entries rejected, reversals net to zero
- Posting rules for every event
- Permissions: cashier cannot use manager actions
- The full scenario from `PRD.md` section 13, with every expected number and the six invariants

Use a separate database for tests (for example `laundrysia_test`) and point to it with `DATABASE_URL` in a `.env.test` file, so tests never touch your real data. The login and audit integration tests open that database, so create it and apply the same migrations before running `npm run test`:

```powershell
$env:DOTENV_CONFIG_PATH = ".env.test"
npm run db:migrate
```

Remove the environment variable (or open a new terminal) before running migrations against the development database.

---

## Backup and restore

```bash
mysqldump -u root -p laundrysia > backup.sql      # backup
mysql -u root -p laundrysia < backup.sql          # restore
```

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `Can't reach database server` | MySQL or MariaDB is not running, or `DATABASE_URL` has the wrong user, password, or port. Start the database and check `.env` |
| `@prisma/client did not initialize` or missing types | The client has not been generated. Run `npm run db:migrate` (or `npx prisma generate`) |
| Prisma errors about a missing adapter | Prisma 7 needs the driver adapter. Check that `@prisma/adapter-mariadb` and `mariadb` are installed, and follow the official Prisma 7 MySQL guide |
| Port 3000 already in use | Run `npm run dev -- -p 3001` or stop the other program |
| Login works but you are sent back to the login page | `SESSION_SECRET` is missing or changed. Set it in `.env` and restart the server |
| Dates look one day off | A date was formatted in UTC. Use the helpers in `src/lib/dates.ts` |
| Emoji or accents look broken | Database not created with `utf8mb4`. Recreate it with the SQL in step 3 |
| Out of memory while building | Close other programs and run `npm run build` on its own |
| Many Prisma connections during development | Make sure the app imports the one shared client from `src/server/db.ts` |

---

## Working with an AI assistant

1. Start every session with: "Read README.md, PRD.md, design.md, and task.md. Then do the first unchecked task."
2. Ask for one task at a time and ask for the check results.
3. Review each change against the non-negotiable rules at the top of `task.md`.
4. Commit after every finished task, with the task ID in the message (for example `T-050 create order action`).

---

## Known limitations (this version)

- One shop, no branches
- Fixed chart of accounts
- No payroll, tax, or online payments
- No customer portal or WhatsApp messages
- Receipts print through the browser print dialog
- The interface is Indonesian in this version. The English dictionary exists, but the language switcher is not wired yet
- Reports export as CSV (opens in Excel) and the dashboard chart is CSS, so the optional `exceljs` and Recharts packages are not installed
- Screenshots are not stored in the repository; use `npm run db:demo` to recreate the data shown in the walkthrough
- The accessibility and responsive pass is manual and still needs a browser/device review

## Possible next steps

Customer order history page, WhatsApp share link for tickets, custom chart of accounts, multi-branch support, and automatic daily backups.

---

## Course information

Course: Sistem Informasi Akuntansi. Case study: a small laundry business. Concepts demonstrated: data input, storage, processing, information output, and internal control.
