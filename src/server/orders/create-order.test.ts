import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { businessDate, addBusinessDays, parseBusinessDate } from "@/lib/dates";
import type { OrderInput } from "@/lib/schemas/order";

config({ path: ".env.test", override: true, quiet: true });
const { createOrder } = await import("./create-order");
const audit = await import("@/server/audit");
const { db } = await import("@/server/db");

const marker = "order-action-test";
let userId: number;
let customerId: number;
let serviceId: number;

async function cleanup(): Promise<void> {
  const orders = await db.order.findMany({ where: { note: marker }, select: { id: true } });
  const orderIds = orders.map(({ id }) => id);
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
  const entryIds = entries.map(({ id }) => id);
  await db.journalLine.deleteMany({ where: { entryId: { in: entryIds } } });
  await db.journalEntry.deleteMany({ where: { id: { in: entryIds } } });
  await db.auditLog.deleteMany({ where: { entityType: "Order", entityId: { in: orderIds } } });
  await db.payment.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
  if (userId) {
    await db.idempotencyKey.deleteMany({ where: { userId, action: "CREATE_ORDER" } });
  }
}

beforeAll(async () => {
  const accounts = [
    { code: "1-100", name: "Cash", type: "ASSET" },
    { code: "1-110", name: "Bank", type: "ASSET" },
    { code: "1-200", name: "Receivables", type: "ASSET" },
    { code: "4-100", name: "Service revenue", type: "REVENUE" },
  ] as const;
  for (const account of accounts) {
    await db.account.upsert({ where: { code: account.code }, update: {}, create: account });
  }

  const user = await db.user.upsert({
    where: { username: "order-action-test" },
    update: {},
    create: {
      name: "Order Action Test",
      username: "order-action-test",
      passwordHash: "x",
      role: "MANAGER",
    },
  });
  userId = user.id;
  const customer = await db.customer.upsert({
    where: { phone: "081277700001" },
    update: { isActive: true },
    create: { name: "Order Action Test", phone: "081277700001" },
  });
  customerId = customer.id;
  const service = await db.service.upsert({
    where: { name: "Order Action Test" },
    update: { unit: "KG", price: 8_000, isActive: true },
    create: { name: "Order Action Test", unit: "KG", price: 8_000 },
  });
  serviceId = service.id;
});

beforeEach(async () => {
  await cleanup();
  await db.service.update({ where: { id: serviceId }, data: { price: 8_000 } });
});

afterAll(async () => {
  await cleanup();
  await db.service.deleteMany({ where: { id: serviceId } });
  await db.customer.deleteMany({ where: { id: customerId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

function orderInput(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    customerId,
    items: [{ serviceId, quantityHundredths: 500 }],
    discount: 0,
    note: marker,
    pickupDate: addBusinessDays(businessDate(), 2),
    paymentType: "FULL",
    paymentMethod: "CASH",
    ...overrides,
  };
}

function key() {
  return crypto.randomUUID();
}

describe("createOrder", () => {
  it("creates a full payment, copies prices, and dates revenue on the order day", async () => {
    const result = await createOrder(orderInput(), userId, key());
    const order = await db.order.findUniqueOrThrow({
      where: { id: result.id },
      include: { items: true, payments: true },
    });
    const entry = await db.journalEntry.findFirstOrThrow({
      where: { refType: "ORDER", refId: order.id },
      include: { lines: { include: { account: true } } },
    });

    expect(order.invoiceNo).toMatch(/^INV-\d{8}-\d{3,}$/);
    expect(order.subtotal).toBe(40_000);
    expect(order.total).toBe(40_000);
    expect(order.items[0]).toMatchObject({
      serviceName: "Order Action Test",
      unit: "KG",
      unitPrice: 8_000,
      lineTotal: 40_000,
    });
    expect(order.payments.map(({ amount }) => amount)).toEqual([40_000]);
    expect(entry.lines.map(({ account, debit, credit }) => [account.code, debit, credit])).toEqual([
      ["1-100", 40_000, 0],
      ["4-100", 0, 40_000],
    ]);
    expect(entry.entryDate.toISOString().slice(0, 10)).toBe(businessDate(order.createdAt));

    await db.service.update({ where: { id: serviceId }, data: { price: 9_000 } });
    expect(await db.orderItem.findMany({ where: { orderId: order.id }, select: { unitPrice: true } })).toEqual([
      { unitPrice: 8_000 },
    ]);
  });

  it("creates a deposit and pay-later order with the right receivable", async () => {
    const deposit = await createOrder(
      orderInput({ paymentType: "DEPOSIT", paymentAmount: 15_000, paymentMethod: "TRANSFER" }),
      userId,
      key(),
    );
    const later = await createOrder(orderInput({ paymentType: "LATER" }), userId, key());
    const depositEntry = await db.journalEntry.findFirstOrThrow({
      where: { refType: "ORDER", refId: deposit.id },
      include: { lines: { include: { account: true } } },
    });
    const laterEntry = await db.journalEntry.findFirstOrThrow({
      where: { refType: "ORDER", refId: later.id },
      include: { lines: { include: { account: true } } },
    });

    expect(deposit.payment?.amount).toBe(15_000);
    expect(
      depositEntry.lines.map(({ account, debit, credit }) => [account.code, debit, credit]),
    ).toEqual([
      ["1-110", 15_000, 0],
      ["1-200", 25_000, 0],
      ["4-100", 0, 40_000],
    ]);
    expect(later.payment).toBeNull();
    expect(
      laterEntry.lines.map(({ account, debit, credit }) => [account.code, debit, credit]),
    ).toEqual([
      ["1-200", 40_000, 0],
      ["4-100", 0, 40_000],
    ]);
  });

  it("allows a full discount without creating a zero payment or journal", async () => {
    const order = await createOrder(orderInput({ discount: 40_000 }), userId, key());

    expect(order.total).toBe(0);
    expect(order.payment).toBeNull();
    expect(await db.journalEntry.count({ where: { refType: "ORDER", refId: order.id } })).toBe(0);
  });

  it("rejects a deposit at or above the total before changing data", async () => {
    const before = await db.invoiceCounter.findUnique({
      where: { date: parseBusinessDate(businessDate()) },
    });

    await expect(
      createOrder(orderInput({ paymentType: "DEPOSIT", paymentAmount: 40_000 }), userId, key()),
    ).rejects.toMatchObject({ field: "paymentAmount" });

    expect(await db.order.count({ where: { note: marker } })).toBe(0);
    expect(await db.payment.count({ where: { order: { note: marker } } })).toBe(0);
    expect(await db.journalEntry.count({ where: { refType: "ORDER", createdById: userId } })).toBe(
      0,
    );
    expect(
      await db.invoiceCounter.findUnique({ where: { date: parseBusinessDate(businessDate()) } }),
    ).toEqual(before);
  });

  it("rolls back the order, payment, journal, and invoice counter when auditing fails", async () => {
    const date = parseBusinessDate(businessDate());
    const counterBefore = await db.invoiceCounter.findUnique({ where: { date } });
    const writeAudit = vi.spyOn(audit, "writeAudit").mockRejectedValueOnce(new Error("forced audit failure"));

    try {
      await expect(createOrder(orderInput(), userId, key())).rejects.toThrow("forced audit failure");

      expect(await db.order.count({ where: { note: marker } })).toBe(0);
      expect(await db.payment.count({ where: { order: { note: marker } } })).toBe(0);
      expect(await db.journalEntry.count({ where: { refType: "ORDER", createdById: userId } })).toBe(0);
      expect(await db.invoiceCounter.findUnique({ where: { date } })).toEqual(counterBefore);
    } finally {
      writeAudit.mockRestore();
      await cleanup();
    }
  });

  it("returns the same order for a repeated submission key", async () => {
    const submissionId = key();
    const [first, second] = await Promise.all([
      createOrder(orderInput(), userId, submissionId),
      createOrder(orderInput(), userId, submissionId),
    ]);

    expect(second.id).toBe(first.id);
    expect(await db.order.count({ where: { note: marker } })).toBe(1);
    expect(await db.payment.count({ where: { orderId: first.id } })).toBe(1);
    expect(await db.journalEntry.count({ where: { refType: "ORDER", refId: first.id } })).toBe(1);
  });

  it("retries with the next invoice after a collision", async () => {
    const day = businessDate();
    const date = parseBusinessDate(day);
    const counterBefore = await db.invoiceCounter.findUnique({ where: { date } });
    const firstSequence = (counterBefore?.last ?? 0) + 1;
    const reservation = await db.order.create({
      data: {
        invoiceNo: `INV-${day.replaceAll("-", "")}-${String(firstSequence).padStart(3, "0")}`,
        customerId,
        subtotal: 1,
        total: 1,
        pickupDate: date,
        createdById: userId,
      },
    });

    try {
      const order = await createOrder(orderInput(), userId, key());
      expect(order.invoiceNo).toBe(
        `INV-${day.replaceAll("-", "")}-${String(firstSequence + 1).padStart(3, "0")}`,
      );
      expect(await db.invoiceCounter.findUnique({ where: { date } })).toMatchObject({
        last: firstSequence + 1,
      });
    } finally {
      await db.order.delete({ where: { id: reservation.id } });
    }
  });

  it("rolls back invoice counter and writes after three collisions", async () => {
    const day = businessDate();
    const date = parseBusinessDate(day);
    const counterBefore = await db.invoiceCounter.findUnique({ where: { date } });
    const firstSequence = (counterBefore?.last ?? 0) + 1;
    const submissionId = key();
    const reservations = await Promise.all(
      [0, 1, 2].map((offset) =>
        db.order.create({
          data: {
            invoiceNo: `INV-${day.replaceAll("-", "")}-${String(firstSequence + offset).padStart(3, "0")}`,
            customerId,
            subtotal: 1,
            total: 1,
            pickupDate: date,
            createdById: userId,
          },
        }),
      ),
    );

    try {
      await expect(createOrder(orderInput(), userId, submissionId)).rejects.toThrow(
        "Invoice allocation failed",
      );
      expect(await db.invoiceCounter.findUnique({ where: { date } })).toEqual(counterBefore);
      expect(await db.order.count({ where: { note: marker } })).toBe(0);
      expect(await db.payment.count({ where: { order: { note: marker } } })).toBe(0);
      expect(
        await db.idempotencyKey.findUnique({ where: { key: `order:${userId}:${submissionId}` } }),
      ).toBeNull();
      expect(
        await db.journalEntry.count({
          where: { refType: "ORDER", refId: { in: reservations.map(({ id }) => id) } },
        }),
      ).toBe(0);
    } finally {
      await db.order.deleteMany({ where: { id: { in: reservations.map(({ id }) => id) } } });
    }
  });
});
