# Project memory

## Purpose and status

LaundrySIA is a Next.js laundry-management app for an SIA course: cashier workflows are intended to generate balanced accounting entries, with manager reports. Current code includes the foundations, auth/app shell, accounting engine, customer/service management, orders, counter board, shared claim ticket printing, payment receipt flow, and receivables list. **T-063 (Completed rule) is now done**: server blocks advance to COMPLETED when balance remains; manager override with required note is audited; UI override dialogs added to OrderDetail and CounterBoard. Expenses, stock, reports, dashboard, and audit UI remain unfinished or placeholders. T-050 through T-063 are checked in `task.md`; latest `npm run check` passed 153 tests across 22 files and the phase build passed.

## Architecture

- Next.js 16.4 App Router, React 19, strict TypeScript; `src/app/` pages/layouts, `src/components/` UI, `src/server/` data/auth/actions/accounting, `src/lib/` shared utilities and Zod schemas.
- Server Components perform reads; Server Actions perform writes. App pages/actions enforce access with `requireUser` / `requireRole` in `src/server/auth.ts`; `src/proxy.ts` only provides an optimistic anonymous redirect.
- Prisma 7 schema and migration history are in `prisma/`; MariaDB adapter and shared hot-reload-safe client are in `src/server/db.ts`. Generated Prisma client is under `src/generated/prisma/`.
- Money is integer rupiah; date helpers use Asia/Jakarta business dates. Journal posting validates balanced entries, and corrections use reversals. Multi-step writes should stay transactional and audited.
- Key modules: `src/server/accounting/{journal,posting,queries}.ts`; `src/server/audit.ts`; `src/server/actions/`; `src/lib/{money,dates,phone}.ts`; `src/lib/schemas/`; `src/lib/i18n.ts`; UI primitives in `src/components/ui/`.

## Decisions and constraints

- Stack favors few dependencies: CSS Modules, Zod, jose/bcryptjs, Vitest, Prisma 7 with `@prisma/adapter-mariadb` and `mariadb`; no separate API framework or state library.
- Prisma 7 datasource URL is configured in `prisma.config.ts` (which loads dotenv). The app DB user cannot create a shadow database; use reviewed migration SQL plus `npm run db:migrate` (`migrate deploy`) unless shadow DB permissions are added.
- Never use `.env` for tests. Integration tests load `.env.test` and need a separate migrated test database; `DOTENV_CONFIG_PATH=.env.test` can direct Prisma CLI commands there.
- Read `PRD.md` for behavior/accounting rules and `design.md` for UI decisions. `README.md` has setup and commands, but its feature overview is aspirational; verify implementation in code. `task.md` is the ordered plan but its phase 4 checkboxes are stale relative to current code.
- Next.js generated guidance in `AGENTS.md` is intentional; check shipped docs under `node_modules/next/dist/docs/` before framework changes.

## Commands

- `npm run dev`, `npm run build`, `npm run start`
- `npm run typecheck` (runs `next typegen` then `tsc --noEmit`), `npm run lint`, `npm run test`, `npm run check`
- Database: `npm run db:check`, `npm run db:migrate`, `npm run db:seed`, `npm run db:demo`, `npm run db:studio`
- Vitest config: `vitest.config.mts`; tests sit beside source. Some auth/accounting tests use a real database, so confirm `.env.test` is configured before running the suite.

## Current next steps and unknowns

- T-063 is complete. Next is **T-070 (Expenses)** — manager-only expenses page with void/reverse workflow.
- `npm run build` has passed; phase 6 is now complete.
- Verify test DB availability before database-backed checks; deployment target is unknown.
