import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { postOrderEntry, postPaymentEntry, reverseOrderEntries } from "./posting";

// Integration tests use the dedicated test database
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("../db");

let userId: number;

async function cleanup(): Promise<void> {
  const orderIds = [999101, 999102, 999103];
  const payments = await db.payment.findMany({
    where: { orderId: { in: orderIds } },
    select: { id: true },
  });
  const entries = await db.journalEntry.findMany({
    where: {
      OR: [
        { refType: "ORDER", refId: { in: orderIds } },
        { refType: "PAYMENT", refId: { in: payments.map(({ id }) => id) } },
      ],
    },
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

  await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
}

beforeAll(async () => {
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
    where: { username: "void-test" },
    update: {},
    create: { name: "Void Test", username: "void-test", passwordHash: "x", role: "MANAGER" },
  });
  userId = user.id;

  await db.customer.upsert({
    where: { phone: "081288888888" },
    update: {},
    create: { name: "VoidTest", phone: "081288888888" },
  });
});

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  try {
    await db.user.deleteMany({ where: { username: "void-test" } });
  } catch {}
  try {
    await db.customer.deleteMany({ where: { phone: "081288888888" } });
  } catch {}
  await db.$disconnect();
});

async function createOrder(id: number, total: number) {
  const customer = await db.customer.findUniqueOrThrow({ where: { phone: "081288888888" } });
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

describe("reverseOrderEntries", () => {
  it("voids an order with no payment", async () => {
    await createOrder(999101, 70_000);
    await db.$transaction((tx) => postOrderEntry(tx, { id: 999101, total: 70_000 }, null, userId));
    await db.$transaction((tx) => reverseOrderEntries(tx, 999101, userId));

    // All entries for order and its payments should be reversed
    const entries = await db.journalEntry.findMany({
      where: { OR: [{ refType: "ORDER", refId: 999101 }] },
      include: { lines: true },
    });
    // Should have original + reversal
    expect(entries.length).toBe(2);
  });

  it("voids an order with a deposit", async () => {
    await createOrder(999102, 40_000);
    await db.$transaction((tx) => postOrderEntry(tx, { id: 999102, total: 40_000 }, { amount: 15_000, method: "CASH" }, userId));
    await db.$transaction((tx) => reverseOrderEntries(tx, 999102, userId));

    const entries = await db.journalEntry.findMany({
      where: { refType: "ORDER", refId: 999102 },
      include: { lines: true },
    });
    expect(entries.length).toBe(2);
  });

  it("voids an order with a later payment", async () => {
    await createOrder(999103, 70_000);
    await db.$transaction((tx) => postOrderEntry(tx, { id: 999103, total: 70_000 }, null, userId));
    const payment = await db.payment.create({
      data: { orderId: 999103, amount: 25_000, method: "CASH", receivedById: userId },
    });
    await db.$transaction((tx) => postPaymentEntry(tx, payment, userId));

    await db.$transaction((tx) => reverseOrderEntries(tx, 999103, userId));

    const orderEntries = await db.journalEntry.findMany({ where: { refType: "ORDER", refId: 999103 } });
    const paymentEntries = await db.journalEntry.findMany({ where: { refType: "PAYMENT", refId: payment.id } });
    expect(orderEntries.length).toBe(2);
    expect(paymentEntries.length).toBe(2);
  });
});
