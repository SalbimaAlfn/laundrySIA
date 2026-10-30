import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { postExpenseEntry, postPurchaseEntry, postUsageEntry, postOpeningEntry } from "./posting";

// Integration tests use the dedicated test database
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("../db");

let userId: number;

async function cleanup(): Promise<void> {
  // Clean test supplies
  await db.supplyMovement.deleteMany({ where: { supply: { name: { startsWith: "TEST-SUPPLY" } } } });
  await db.supply.deleteMany({ where: { name: { startsWith: "TEST-SUPPLY" } } });

  // Clean journal entries for test supplies/expenses/opening
  const entries = await db.journalEntry.findMany({
    where: { description: { startsWith: "Supply" } },
    select: { id: true },
  });
  const ids = entries.map((e) => e.id);
  if (ids.length > 0) {
    const reversals = await db.journalEntry.findMany({ where: { reversesEntryId: { in: ids } }, select: { id: true } });
    const all = [...ids, ...reversals.map((r) => r.id)];
    await db.journalEntry.updateMany({ where: { reversesEntryId: { in: all } }, data: { reversesEntryId: null } });
    await db.journalEntry.updateMany({ where: { id: { in: all } }, data: { reversesEntryId: null } });
    await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
    if (reversals.length > 0) await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
    await db.journalEntry.deleteMany({ where: { id: { in: ids } } });
  }

  const expEntries = await db.journalEntry.findMany({ where: { description: { startsWith: "Expense" } }, select: { id: true } });
  const eids = expEntries.map((e) => e.id);
  if (eids.length > 0) {
    const reversals = await db.journalEntry.findMany({ where: { reversesEntryId: { in: eids } }, select: { id: true } });
    const all = [...eids, ...reversals.map((r) => r.id)];
    await db.journalEntry.updateMany({ where: { reversesEntryId: { in: all } }, data: { reversesEntryId: null } });
    await db.journalEntry.updateMany({ where: { id: { in: all } }, data: { reversesEntryId: null } });
    await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
    if (reversals.length > 0) await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
    await db.journalEntry.deleteMany({ where: { id: { in: eids } } });
  }

  const openingEntries = await db.journalEntry.findMany({ where: { description: { contains: "Opening" } }, select: { id: true } });
  const oids = openingEntries.map((e) => e.id);
  if (oids.length > 0) {
    const reversals = await db.journalEntry.findMany({ where: { reversesEntryId: { in: oids } }, select: { id: true } });
    const all = [...oids, ...reversals.map((r) => r.id)];
    await db.journalEntry.updateMany({ where: { reversesEntryId: { in: all } }, data: { reversesEntryId: null } });
    await db.journalEntry.updateMany({ where: { id: { in: all } }, data: { reversesEntryId: null } });
    await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
    if (reversals.length > 0) await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
    await db.journalEntry.deleteMany({ where: { id: { in: oids } } });
  }
  await db.expense.deleteMany({});
}

beforeAll(async () => {
  const accounts = [
    { code: "1-100", name: "Kas", type: "ASSET" },
    { code: "1-110", name: "Bank", type: "ASSET" },
    { code: "1-300", name: "Persediaan Perlengkapan", type: "ASSET" },
    { code: "1-400", name: "Peralatan", type: "ASSET" },
    { code: "3-100", name: "Modal Pemilik", type: "EQUITY" },
    { code: "5-100", name: "Beban Perlengkapan", type: "EXPENSE" },
    { code: "5-200", name: "Beban Listrik dan Air", type: "EXPENSE" },
    { code: "5-300", name: "Beban Gaji", type: "EXPENSE" },
    { code: "5-400", name: "Beban Sewa", type: "EXPENSE" },
    { code: "5-900", name: "Beban Lain-lain", type: "EXPENSE" },
  ] as const;
  for (const a of accounts) {
    await db.account.upsert({ where: { code: a.code }, update: {}, create: a });
  }

  const user = await db.user.upsert({
    where: { username: "posting2-test" },
    update: {},
    create: { name: "Posting2 Test", username: "posting2-test", passwordHash: "x", role: "MANAGER" },
  });
  userId = user.id;
});

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  try {
    await db.user.deleteMany({ where: { username: "posting2-test" } });
  } catch {}
  await db.$disconnect();
});

describe("T-032 posting rules", () => {
  it("posts expense", async () => {
    const expense = await db.expense.create({
      data: {
        category: "ELECTRICITY_WATER",
        amount: 300_000,
        paidFrom: "CASH",
        date: new Date(Date.UTC(2026, 9, 7)),
        note: "bill",
        createdById: userId,
      },
    });
    const result = await db.$transaction((tx) => postExpenseEntry(tx, expense, userId));
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result.entryId },
      include: { lines: { include: { account: true } } },
    });
    expect(entry.refType).toBe("EXPENSE");
    const expLine = entry.lines.find((l) => l.account.code === "5-200");
    expect(expLine?.debit).toBe(300_000);
    const cashLine = entry.lines.find((l) => l.account.code === "1-100");
    expect(cashLine?.credit).toBe(300_000);
  });

  it("posts purchase with weighted average cost after two purchases at different prices", async () => {
    const supply = await db.supply.create({
      data: { name: "TEST-SUPPLY-DETERGENT", unit: "L", stockQty: 0, minQty: 0, avgUnitCost: 0 },
    });

    // First purchase: 10 L at total cost 100000 (avg 10000)
    const p1 = await db.supplyMovement.create({
      data: { supplyId: supply.id, type: "IN", quantity: 10, totalCost: 100_000, date: new Date(Date.UTC(2026, 9, 7)), createdById: userId },
    });
    await db.$transaction((tx) => postPurchaseEntry(tx, { id: p1.id, supplyId: supply.id, quantity: 10, totalCost: 100_000, date: "2026-10-07" }, userId));

    let s = await db.supply.findUniqueOrThrow({ where: { id: supply.id } });
    expect(s.stockQty.toString()).toBe("10");
    expect(s.avgUnitCost).toBe(10_000);

    // Second purchase: 10 L at total cost 120000 (avg becomes (10*10000+120000)/(20) = 11000)
    const p2 = await db.supplyMovement.create({
      data: { supplyId: supply.id, type: "IN", quantity: 10, totalCost: 120_000, date: new Date(Date.UTC(2026, 9, 7)), createdById: userId },
    });
    await db.$transaction((tx) => postPurchaseEntry(tx, { id: p2.id, supplyId: supply.id, quantity: 10, totalCost: 120_000, date: "2026-10-07" }, userId));

    s = await db.supply.findUniqueOrThrow({ where: { id: supply.id } });
    expect(s.stockQty.toString()).toBe("20");
    expect(s.avgUnitCost).toBe(11_000);
  });

  it("posts usage with weighted average cost", async () => {
    const supply = await db.supply.create({
      data: { name: "TEST-SUPPLY-DETERGENT2", unit: "L", stockQty: 20, minQty: 0, avgUnitCost: 11_000 },
    });
    const usage = await db.supplyMovement.create({
      data: { supplyId: supply.id, type: "OUT", quantity: 2, totalCost: 0, date: new Date(Date.UTC(2026, 9, 7)), createdById: userId },
    });
    const result = await db.$transaction((tx) => postUsageEntry(tx, { id: usage.id, supplyId: supply.id, quantity: 2, date: "2026-10-07" }, userId));
    expect(result.entryId).toBeGreaterThan(0);
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result.entryId },
      include: { lines: { include: { account: true } } },
    });
    // Usage cost round(2*11000)=22000, Debit Supplies Expense 5-100, Credit Inventory 1-300
    expect(entry.lines.find((l) => l.account.code === "5-100" && l.debit === 22_000)).toBeDefined();
    expect(entry.lines.find((l) => l.account.code === "1-300" && l.credit === 22_000)).toBeDefined();
    const s = await db.supply.findUniqueOrThrow({ where: { id: supply.id } });
    expect(s.stockQty.toString()).toBe("18");
  });

  it("posts opening capital", async () => {
    const result = await db.$transaction((tx) => postOpeningEntry(tx, { cash: 1_000_000, date: "2026-10-07" }, userId));
    expect(result?.entryId).toBeGreaterThan(0);
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result!.entryId },
      include: { lines: { include: { account: true } } },
    });
    expect(entry.lines.find((l) => l.account.code === "1-100" && l.debit === 1_000_000)).toBeDefined();
    expect(entry.lines.find((l) => l.account.code === "3-100" && l.credit === 1_000_000)).toBeDefined();
  });
});
