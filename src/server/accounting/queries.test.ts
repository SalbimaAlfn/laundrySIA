import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accountBalance, trialBalance, ledger } from "./queries";
import { postEntry } from "./journal";

// Integration tests use the dedicated test database
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("../db");

const marker = "QUERIES-TEST";
let userId: number;

async function cleanup(): Promise<void> {
  const entries = await db.journalEntry.findMany({
    where: { description: { startsWith: marker } },
    select: { id: true },
  });
  const ids = entries.map((e) => e.id);
  if (ids.length === 0) return;
  const reversals = await db.journalEntry.findMany({ where: { reversesEntryId: { in: ids } }, select: { id: true } });
  const all = [...ids, ...reversals.map((r) => r.id)];
  await db.journalEntry.updateMany({ where: { reversesEntryId: { in: all } }, data: { reversesEntryId: null } });
  await db.journalEntry.updateMany({ where: { id: { in: all } }, data: { reversesEntryId: null } });
  await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
  if (reversals.length > 0) await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
  await db.journalEntry.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  const accounts = [
    { code: "1-100", name: "Kas", type: "ASSET" },
    { code: "1-110", name: "Bank", type: "ASSET" },
    { code: "1-200", name: "Piutang Usaha", type: "ASSET" },
    { code: "1-300", name: "Persediaan Perlengkapan", type: "ASSET" },
    { code: "1-400", name: "Peralatan", type: "ASSET" },
    { code: "3-100", name: "Modal Pemilik", type: "EQUITY" },
    { code: "4-100", name: "Pendapatan Jasa", type: "REVENUE" },
    { code: "5-100", name: "Beban Perlengkapan", type: "EXPENSE" },
    { code: "5-200", name: "Beban Listrik dan Air", type: "EXPENSE" },
    { code: "5-300", name: "Beban Gaji", type: "EXPENSE" },
    { code: "5-400", name: "Beban Sewa", type: "EXPENSE" },
    { code: "5-900", name: "Beban Lain-lain", type: "EXPENSE" },
  ] as const;
  for (const a of accounts) {
    await db.account.upsert({ where: { code: a.code }, update: {}, create: a as any });
  }

  const user = await db.user.upsert({
    where: { username: "queries-test" },
    update: {},
    create: { name: "Queries Test", username: "queries-test", passwordHash: "x", role: "MANAGER" },
  });
  userId = user.id;
});

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  try {
    await db.user.deleteMany({ where: { username: "queries-test" } });
  } catch {}
  await db.$disconnect();
});

describe("accounting queries", () => {
  it("confirms trial balance debits equal credits after PRD section 13 scenario", async () => {
    // Step 1: Opening capital
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} opening`,
        refType: "OPENING",
        lines: [
          { accountCode: "1-100", debit: 1_000_000 },
          { accountCode: "3-100", credit: 1_000_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 2: Order 1 - deposit
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} order1`,
        refType: "ORDER",
        refId: 1,
        lines: [
          { accountCode: "1-100", debit: 15_000 },
          { accountCode: "1-200", debit: 25_000 },
          { accountCode: "4-100", credit: 40_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 3: Order 2 - pay in full
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} order2`,
        refType: "ORDER",
        refId: 2,
        lines: [
          { accountCode: "1-100", debit: 36_000 },
          { accountCode: "4-100", credit: 36_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 4: Order 3 - pay later
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} order3`,
        refType: "ORDER",
        refId: 3,
        lines: [
          { accountCode: "1-200", debit: 70_000 },
          { accountCode: "4-100", credit: 70_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 5: Purchase
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} purchase`,
        refType: "PURCHASE",
        refId: 1,
        lines: [
          { accountCode: "1-300", debit: 120_000 },
          { accountCode: "1-100", credit: 120_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 6: Payment for order 1
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} pay1`,
        refType: "PAYMENT",
        refId: 1,
        lines: [
          { accountCode: "1-100", debit: 25_000 },
          { accountCode: "1-200", credit: 25_000 },
        ],
        createdById: userId,
      }),
    );
    // Step 7: Expense
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} expense`,
        refType: "EXPENSE",
        refId: 1,
        lines: [
          { accountCode: "5-200", debit: 300_000 },
          { accountCode: "1-100", credit: 300_000 },
        ],
        createdById: userId,
      }),
    );

    const tb = await trialBalance("2026-10-07");
    const totalDebit = tb.reduce((s, r) => s + r.debit, 0);
    const totalCredit = tb.reduce((s, r) => s + r.credit, 0);
    expect(totalDebit).toBe(totalCredit);

    expect(await accountBalance("1-100", "2026-10-07")).toBe(656_000);
    expect(await accountBalance("1-200", "2026-10-07")).toBe(70_000);
    expect(await accountBalance("1-300", "2026-10-07")).toBe(120_000);
  });

  it("ledger returns entries for an account", async () => {
    await db.$transaction((tx) =>
      postEntry(tx, {
        date: "2026-10-07",
        description: `${marker} ledger1`,
        refType: "OPENING",
        lines: [
          { accountCode: "1-100", debit: 500_000 },
          { accountCode: "3-100", credit: 500_000 },
        ],
        createdById: userId,
      }),
    );
    const l = await ledger("1-100", "2026-10-07", "2026-10-07");
    expect(l.length).toBeGreaterThan(0);
    const has500 = l.some((row) => row.debit === 500_000);
    expect(has500).toBe(true);
  });
});
