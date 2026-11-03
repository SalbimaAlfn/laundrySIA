# Project memory

## Purpose and status

LaundrySIA is a Next.js laundry-management app for an SIA course: cashier workflows generate balanced accounting entries, and managers read reports. Core flows are implemented: auth/app shell, customers, services, orders, counter board, claim tickets, payments, receivables, expenses with reversal, stock purchases/usage/low stock, reports (income statement, cash flow, balance sheet, trial balance, sales, ledger), CSV export, dashboard, audit log, and void orders. The PRD section 13 worked example is covered by `src/tests/e2e-accounting.test.ts`, and `prisma/demo.ts` loads the worked example plus 30 month-spread orders. Latest verified run: `npm run check` equivalent pieces passed, with 158 tests across 24 files. Remaining P2 work: T-094 accessibility/responsive review and T-095 language switcher. Screenshots for T-096 are not in the repo.

## Architecture

- Next.js 16.4 App Router, React 19, strict TypeScript; `src/app/` pages/layouts, `src/components/` UI, `src/server/` data/auth/actions/accounting, `src/lib/` shared utilities and Zod schemas.
- Server Components perform reads; Server Actions perform writes. App pages/actions enforce access with `requireUser` / `requireRole` in `src/server/auth.ts`; `src/proxy.ts` only provides an optimistic anonymous redirect.
- Prisma 7 schema and migration history are in `prisma/`; MariaDB adapter and shared hot-reload-safe client are in `src/server/db.ts`. Generated Prisma client is under `src/generated/prisma/`.
- Money is integer rupiah; date helpers use Asia/Jakarta business dates. Journal posting validates balanced entries, and corrections use reversals. Multi-step writes stay transactional and audited.
- Reports live in `src/server/reports/queries.ts`; the single dynamic page is `src/app/(app)/reports/[type]/page.tsx`. CSV export is `src/app/(app)/api/reports/export/route.ts`.
- Key modules: `src/server/accounting/{journal,posting,queries}.ts`; `src/server/audit.ts`; `src/server/actions/`; `src/lib/{money,dates,phone}.ts`; `src/lib/schemas/`; `src/lib/i18n.ts`; UI primitives in `src/components/ui/`.

## Decisions and constraints

- Stack favors few dependencies: CSS Modules, Zod, jose/bcryptjs, Vitest, Prisma 7 with `@prisma/adapter-mariadb` and `mariadb`; no separate API framework or state library.
- Reports export CSV instead of Excel (opens in Excel) and the dashboard chart is CSS with a text alternative, avoiding `exceljs` and Recharts.
- `prisma/demo.ts` is idempotent through a `demo.completed` setting plus idempotency keys. Delete that setting to rerun it.
- Prisma 7 datasource URL is configured in `prisma.config.ts` (which loads dotenv). The app DB user cannot create a shadow database; use reviewed migration SQL plus `npm run db:migrate` (`migrate deploy`) unless shadow DB permissions are added.
- Never use `.env` for tests. Integration tests load `.env.test` and need a separate migrated test database; `DOTENV_CONFIG_PATH=.env.test` can direct Prisma CLI commands there. If the DB stops mid-run, restart it to clear stale metadata locks before rerunning tests.
- Read `PRD.md` for behavior/accounting rules and `design.md` for UI decisions. `README.md` now reflects implemented features and known limitations. `task.md` is mostly current but T-085 is implemented differently and T-094/T-095 remain open.
- Next.js generated guidance in `AGENTS.md` is intentional; check shipped docs under `node_modules/next/dist/docs/` before framework changes.

## Commands

- `npm run dev`, `npm run build`, `npm run start`
- `npm run typecheck` (runs `next typegen` then `tsc --noEmit`), `npm run lint`, `npm run test`, `npm run check`
- Database: `npm run db:check`, `npm run db:migrate`, `npm run db:seed`, `npm run db:demo`, `npm run db:studio`
- Vitest config: `vitest.config.mts`; tests sit beside source. Auth/accounting tests use a real database, so confirm `.env.test` is configured and the server is running before running the suite.

## Current next steps and unknowns

- T-092 and T-093 are implemented and verified against the test database.
- Finish T-094: manual browser/device review of keyboard navigation, focus states, contrast, and narrow layouts.
- Finish T-095: wire a persisted language switcher through server pages and client components; the Indonesian/English catalogs already exist.
- Add screenshots and a final deployment note if the course deliverable requires them. Deployment target is still unknown.
