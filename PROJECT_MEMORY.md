# Project memory

## Purpose and status

LaundrySIA is a Next.js laundry-management app for an SIA course: cashier workflows are intended to generate balanced accounting entries, with manager reports. The repository history has four phase commits through phase 4. Current code includes the foundations, auth/app shell, accounting engine, customer management, and service management. Most operational screens (orders, payments, counter, expenses, stock, reports, dashboard, audit) are still placeholders or unfinished. `task.md` still leaves T-040 and T-041 unchecked despite their current pages/actions/components being present; confirm acceptance checks before treating those tasks as complete. Next planned work is T-050, order creation.

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

- Implement T-050 order creation with invoice allocation, copied service prices, payment/posting/audit in one transaction, idempotency, and failure-path tests; then follow `task.md` dependencies.
- Verify whether phase 4 acceptance checks passed and reconcile `task.md` checkboxes/notes when confirmed.
- No reliable current test/build result was established during this documentation audit. Database availability and the intended deployment target are unknown.
