import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

config({ path: ".env.test", override: true, quiet: true });
const { PaymentReceptionError, receivePayment } = await import("./receive-payment");
const { db } = await import("@/server/db");
const { postOrderEntry } = await import("@/server/accounting/posting");
const { accountBalance } = await import("@/server/accounting/queries");
const { getReceivables } = await import("@/server/orders/queries");

const marker = "receive-payment-test";
let userId: number;
let orderId: number;

async function cleanup() {
  const orders = await db.order.findMany({ where: { note: marker }, select: { id: true } });
  const orderIds = orders.map(({ id }) => id);
  const payments = await db.payment.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
  const paymentIds = payments.map(({ id }) => id);
  const entries = await db.journalEntry.findMany({
    where: {
      OR: [
        { refType: "ORDER", refId: { in: orderIds } },
        { refType: "PAYMENT", refId: { in: paymentIds } },
      ],
    },
    select: { id: true },
  });
  const entryIds = entries.map(({ id }) => id);
  await db.journalLine.deleteMany({ where: { entryId: { in: entryIds } } });
  await db.journalEntry.deleteMany({ where: { id: { in: entryIds } } });
  await db.auditLog.deleteMany({ where: { entityType: "Payment", entityId: { in: paymentIds } } });
  await db.idempotencyKey.deleteMany({ where: { userId, action: "RECEIVE_PAYMENT" } });
  await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
}

beforeAll(async () => {
  for (const account of [
    { code: "1-100", name: "Cash", type: "ASSET" },
    { code: "1-110", name: "Bank", type: "ASSET" },
    { code: "1-200", name: "Receivables", type: "ASSET" },
    { code: "4-100", name: "Service revenue", type: "REVENUE" },
  ] as const) {
    await db.account.upsert({ where: { code: account.code }, update: {}, create: account });
  }
  const user = await db.user.upsert({
    where: { username: "receive-payment-test" },
    update: {},
    create: { name: "Receive Payment Test", username: "receive-payment-test", passwordHash: "x", role: "CASHIER" },
  });
  userId = user.id;
  await db.customer.upsert({
    where: { phone: "081277700002" },
    update: {},
    create: { name: "Receive Payment Test", phone: "081277700002" },
  });
});

beforeEach(async () => {
  await cleanup();
  const customer = await db.customer.findUniqueOrThrow({ where: { phone: "081277700002" } });
  const order = await db.order.create({
    data: {
      invoiceNo: `INV-PAY-${crypto.randomUUID().slice(0, 12)}`,
      customerId: customer.id,
      subtotal: 40_000,
      total: 40_000,
      note: marker,
      pickupDate: new Date(Date.UTC(2026, 9, 31)),
      createdById: userId,
    },
  });
  orderId = order.id;
});

afterAll(async () => {
  await cleanup();
  await db.customer.deleteMany({ where: { phone: "081277700002" } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

function input(amount: number, method: "CASH" | "TRANSFER" | "EWALLET" = "CASH") {
  return { orderId, amount, method } as const;
}

const key = () => crypto.randomUUID();

describe("receivePayment", () => {
  it("records a partial payment and posts its journal entry", async () => {
    const payment = await receivePayment(input(15_000), userId, key());

    expect(payment).toMatchObject({ orderId, amount: 15_000, method: "CASH", balance: 25_000 });
    const entry = await db.journalEntry.findFirstOrThrow({
      where: { refType: "PAYMENT", refId: payment.id },
      include: { lines: { include: { account: true } } },
    });
    expect(entry.lines.map(({ account, debit, credit }) => [account.code, debit, credit])).toEqual([
      ["1-100", 15_000, 0],
      ["1-200", 0, 15_000],
    ]);
    expect(await db.auditLog.count({ where: { action: "PAYMENT_RECEIVE", entityId: payment.id } })).toBe(1);
  });

  it("accepts an exact payment", async () => {
    await expect(receivePayment(input(40_000), userId, key())).resolves.toMatchObject({ balance: 0 });
  });

  it("rejects overpayment without writing financial rows", async () => {
    const entriesBefore = await db.journalEntry.count({ where: { refType: "PAYMENT" } });
    await expect(receivePayment(input(40_001), userId, key())).rejects.toMatchObject({ field: "amount" });
    expect(await db.payment.count({ where: { orderId } })).toBe(0);
    expect(await db.journalEntry.count({ where: { refType: "PAYMENT" } })).toBe(entriesBefore);
  });

  it("rejects a voided order", async () => {
    await db.order.update({ where: { id: orderId }, data: { voidedAt: new Date(), voidReason: "test" } });

    await expect(receivePayment(input(10_000), userId, key())).rejects.toBeInstanceOf(PaymentReceptionError);
    expect(await db.payment.count({ where: { orderId } })).toBe(0);
  });

  it("allows only one of two concurrent payments that exceed the balance together", async () => {
    const results = await Promise.allSettled([
      receivePayment(input(25_000), userId, key()),
      receivePayment(input(20_000), userId, key()),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.payment.aggregate({ where: { orderId }, _sum: { amount: true } })).toMatchObject({
      _sum: { amount: expect.any(Number) },
    });
    const paid = (await db.payment.aggregate({ where: { orderId }, _sum: { amount: true } }))._sum.amount;
    expect(paid).toBeLessThanOrEqual(40_000);
  });

  it("returns the same payment for a repeated key", async () => {
    const submissionId = key();
    const first = await receivePayment(input(12_000), userId, submissionId);
    const retry = await receivePayment(input(12_000), userId, submissionId);

    expect(retry.id).toBe(first.id);
    expect(await db.payment.count({ where: { orderId } })).toBe(1);
  });

  it("matches the Receivables account change for an open order", async () => {
    const balanceBefore = await accountBalance("1-200");
    await db.$transaction((tx) => postOrderEntry(tx, { id: orderId, total: 40_000 }, null, userId));
    await receivePayment(input(15_000), userId, key());

    const receivables = await getReceivables();
    expect(receivables.orders.find((order) => order.id === orderId)?.balance).toBe(25_000);
    expect((await accountBalance("1-200")) - balanceBefore).toBe(25_000);
  });
});
