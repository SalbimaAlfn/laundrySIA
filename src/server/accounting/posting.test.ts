import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { postOrderEntry, postPaymentEntry } from "./posting";

// Integration tests use the dedicated test database
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("../db");

const marker = "POSTING-TEST";
let userId: number;

const testOrderIds = [999001, 999002, 999003];

async function cleanup(): Promise<void> {
  const entries = await db.journalEntry.findMany({
    where: { description: { contains: marker } },
    select: { id: true },
  });
  const ids = entries.map((e) => e.id);
  if (ids.length > 0) {
    const reversals = await db.journalEntry.findMany({
      where: { reversesEntryId: { in: ids } },
      select: { id: true },
    });
    const all = [...ids, ...reversals.map((r) => r.id)];
    await db.journalEntry.updateMany({
      where: { reversesEntryId: { in: all } },
      data: { reversesEntryId: null },
    });
    await db.journalEntry.updateMany({
      where: { id: { in: all } },
      data: { reversesEntryId: null },
    });
    await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
    if (reversals.length > 0) {
      await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
    }
    await db.journalEntry.deleteMany({ where: { id: { in: ids } } });
  }

  // Clean up by refType/description pattern too
  const otherEntries = await db.journalEntry.findMany({
    where: { description: { startsWith: "Order 999" } },
    select: { id: true },
  });
  const otherIds = otherEntries.map((e) => e.id);
  if (otherIds.length > 0) {
    const reversals = await db.journalEntry.findMany({
      where: { reversesEntryId: { in: otherIds } },
      select: { id: true },
    });
    const all = [...otherIds, ...reversals.map((r) => r.id)];
    await db.journalEntry.updateMany({ where: { reversesEntryId: { in: all } }, data: { reversesEntryId: null } });
    await db.journalEntry.updateMany({ where: { id: { in: all } }, data: { reversesEntryId: null } });
    await db.journalLine.deleteMany({ where: { entryId: { in: all } } });
    if (reversals.length > 0) await db.journalEntry.deleteMany({ where: { id: { in: reversals.map((r) => r.id) } } });
    await db.journalEntry.deleteMany({ where: { id: { in: otherIds } } });
  }

  await db.payment.deleteMany({ where: { orderId: { in: testOrderIds } } });
  await db.orderItem.deleteMany({ where: { orderId: { in: testOrderIds } } });
  await db.order.deleteMany({ where: { id: { in: testOrderIds } } });
}

beforeAll(async () => {
  // Ensure accounts exist
  const accounts = [
    { code: "1-100", name: "Kas", type: "ASSET" },
    { code: "1-110", name: "Bank", type: "ASSET" },
    { code: "1-200", name: "Piutang Usaha", type: "ASSET" },
    { code: "4-100", name: "Pendapatan Jasa", type: "REVENUE" },
  ] as const;
  for (const a of accounts) {
    await db.account.upsert({ where: { code: a.code }, update: {}, create: a });
  }

  const user = await db.user.upsert({
    where: { username: "posting-test" },
    update: {},
    create: { name: "Posting Test", username: "posting-test", passwordHash: "x", role: "MANAGER" },
  });
  userId = user.id;

  // Create a customer
  await db.customer.upsert({
    where: { phone: "081299999999" },
    update: {},
    create: { name: "Test", phone: "081299999999" },
  });
});

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  try {
    await db.user.deleteMany({ where: { username: "posting-test" } });
  } catch {}
  try {
    await db.customer.deleteMany({ where: { phone: "081299999999" } });
  } catch {}
  await db.$disconnect();
});

async function createOrder(id: number, total: number) {
  const customer = await db.customer.findUniqueOrThrow({ where: { phone: "081299999999" } });
  // Ensure clean
  await db.payment.deleteMany({ where: { orderId: id } });
  await db.orderItem.deleteMany({ where: { orderId: id } });
  await db.order.deleteMany({ where: { id } });

  await db.order.create({
    data: {
      id,
      invoiceNo: `INV-${id}`,
      customerId: customer.id,
      status: "RECEIVED",
      subtotal: total,
      discount: 0,
      total,
      pickupDate: new Date(Date.UTC(2026, 9, 7)),
      createdById: userId,
    },
  });
}

describe("postOrderEntry", () => {
  it("posts pay in full with cash", async () => {
    await createOrder(999001, 40_000);
    const result = await db.$transaction((tx) =>
      postOrderEntry(tx, { id: 999001, total: 40_000 }, { amount: 40_000, method: "CASH" }, userId),
    );
    expect(result?.entryId).toBeGreaterThan(0);
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result!.entryId },
      include: { lines: true },
    });
    // Cash debit 40k, no receivable, revenue credit 40k
    const cash = entry.lines.find((l) => l.debit === 40_000 && l.credit === 0);
    const revenue = entry.lines.find((l) => l.credit === 40_000 && l.debit === 0);
    expect(cash).toBeDefined();
    expect(revenue).toBeDefined();
    expect(entry.lines.length).toBe(2);
  });

  it("posts deposit (partial payment)", async () => {
    await createOrder(999002, 40_000);
    const result = await db.$transaction((tx) =>
      postOrderEntry(tx, { id: 999002, total: 40_000 }, { amount: 15_000, method: "CASH" }, userId),
    );
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result!.entryId },
      include: { lines: true },
    });
    // Cash 15k, Receivables 25k, Revenue 40k
    expect(entry.lines.find((l) => l.debit === 15_000)).toBeDefined();
    expect(entry.lines.find((l) => l.debit === 25_000)).toBeDefined(); // receivables
    expect(entry.lines.find((l) => l.credit === 40_000)).toBeDefined(); // revenue
    expect(entry.lines.length).toBe(3);
  });

  it("posts pay later (no payment)", async () => {
    await createOrder(999003, 70_000);
    const result = await db.$transaction((tx) =>
      postOrderEntry(tx, { id: 999003, total: 70_000 }, null, userId),
    );
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result!.entryId },
      include: { lines: true },
    });
    // Receivables 70k, Revenue 70k
    expect(entry.lines.find((l) => l.debit === 70_000)).toBeDefined();
    expect(entry.lines.find((l) => l.credit === 70_000)).toBeDefined();
    expect(entry.lines.length).toBe(2);
  });

  it("uses bank for transfer/ewallet", async () => {
    await createOrder(999001, 36_000);
    const result = await db.$transaction((tx) =>
      postOrderEntry(tx, { id: 999001, total: 36_000 }, { amount: 36_000, method: "TRANSFER" }, userId),
    );
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result!.entryId },
      include: { lines: { include: { account: true } } },
    });
    const bankLine = entry.lines.find((l) => l.debit === 36_000);
    expect(bankLine?.account.code).toBe("1-110");
  });

  it("returns null for zero total order", async () => {
    await createOrder(999001, 0);
    const result = await db.$transaction((tx) =>
      postOrderEntry(tx, { id: 999001, total: 0 }, null, userId),
    );
    expect(result).toBeNull();
  });
});

describe("postPaymentEntry", () => {
  it("posts later payment", async () => {
    await createOrder(999003, 70_000);
    await db.$transaction((tx) => postOrderEntry(tx, { id: 999003, total: 70_000 }, null, userId));
    // Create payment
    const payment = await db.payment.create({
      data: {
        orderId: 999003,
        amount: 25_000,
        method: "CASH",
        receivedById: userId,
      },
    });
    const result = await db.$transaction((tx) => postPaymentEntry(tx, payment, userId));
    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: result.entryId },
      include: { lines: true },
    });
    expect(entry.refType).toBe("PAYMENT");
    expect(entry.refId).toBe(payment.id);
    // Cash debit 25k, Receivables credit 25k
    expect(entry.lines.find((l) => l.debit === 25_000)).toBeDefined();
    expect(entry.lines.find((l) => l.credit === 25_000)).toBeDefined();
  });
});
