import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { addBusinessDays, businessDate } from "@/lib/dates";

const auth = vi.hoisted(() => ({
  actor: { id: 0, name: "E2E Manager", role: "MANAGER" as const },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({
  requireUser: vi.fn(async () => auth.actor),
  requireRole: vi.fn(async () => auth.actor),
}));

config({ path: ".env.test", override: true, quiet: true });

const { db } = await import("@/server/db");
const { createOrder } = await import("@/server/orders/create-order");
const { receivePayment } = await import("@/server/payments/receive-payment");
const { postOpeningEntry, postPurchaseEntry, postExpenseEntry } = await import(
  "@/server/accounting/posting"
);
const { accountBalance } = await import("@/server/accounting/queries");
const { voidOrderAction } = await import("@/server/actions/orders");
const { incomeStatement, cashFlow, balanceSheet, trialBalanceReport } = await import(
  "@/server/reports/queries"
);

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

async function cleanup(): Promise<void> {
  await db.journalEntry.updateMany({ data: { reversesEntryId: null } });
  await db.journalLine.deleteMany();
  await db.journalEntry.deleteMany();
  await db.auditLog.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.expense.deleteMany();
  await db.supplyMovement.deleteMany();
  await db.supply.deleteMany();
  await db.idempotencyKey.deleteMany();
}

describe("worked example (PRD section 13)", () => {
  const today = businessDate();
  let managerId: number;
  let customerId: number;
  let serviceIds: number[];

  beforeAll(async () => {
    await cleanup();

    for (const account of accounts) {
      await db.account.upsert({
        where: { code: account.code },
        update: { name: account.name, type: account.type },
        create: account,
      });
    }

    const manager = await db.user.upsert({
      where: { username: "e2e-manager" },
      update: {},
      create: {
        name: "E2E Manager",
        username: "e2e-manager",
        passwordHash: "not-used-in-this-test",
        role: "MANAGER",
      },
    });
    managerId = manager.id;
    auth.actor.id = manager.id;

    const customer = await db.customer.upsert({
      where: { phone: "081200000001" },
      update: { name: "E2E Customer", isActive: true },
      create: { name: "E2E Customer", phone: "081200000001" },
    });
    customerId = customer.id;

    const services = await Promise.all(
      [
        { name: "E2E Cuci + setrika", price: 8000 },
        { name: "E2E Express", price: 12000 },
        { name: "E2E Kiloan", price: 7000 },
      ].map((service) =>
        db.service.upsert({
          where: { name: service.name },
          update: { price: service.price, isActive: true },
          create: { ...service, unit: "KG", turnaroundDays: 2 },
        }),
      ),
    );
    serviceIds = services.map((service) => service.id);
  });

  afterAll(async () => {
    await cleanup();
    await db.$disconnect();
  });

  it("reproduces every number in the worked example, including void", async () => {
    const pickupDate = addBusinessDays(today, 2);

    await db.$transaction((tx) =>
      postOpeningEntry(tx, { cash: 1_000_000, date: today }, managerId),
    );

    const order1 = await createOrder(
      {
        customerId,
        items: [{ serviceId: serviceIds[0]!, quantityHundredths: 500 }],
        discount: 0,
        pickupDate,
        paymentType: "DEPOSIT",
        paymentAmount: 15_000,
        paymentMethod: "CASH",
        note: "E2E-ORDER-1",
      },
      managerId,
      "e2e-order-1",
    );

    const order2 = await createOrder(
      {
        customerId,
        items: [{ serviceId: serviceIds[1]!, quantityHundredths: 300 }],
        discount: 0,
        pickupDate,
        paymentType: "FULL",
        paymentMethod: "CASH",
        note: "E2E-ORDER-2",
      },
      managerId,
      "e2e-order-2",
    );

    await createOrder(
      {
        customerId,
        items: [{ serviceId: serviceIds[2]!, quantityHundredths: 1000 }],
        discount: 0,
        pickupDate,
        paymentType: "LATER",
        paymentMethod: "CASH",
        note: "E2E-ORDER-3",
      },
      managerId,
      "e2e-order-3",
    );

    const supply = await db.supply.create({
      data: { name: "E2E Detergent", unit: "L", stockQty: 0, minQty: 0, avgUnitCost: 0 },
    });
    await db.$transaction(async (tx) => {
      const movement = await tx.supplyMovement.create({
        data: {
          supplyId: supply.id,
          type: "IN",
          quantity: 1,
          totalCost: 120_000,
          date: new Date(`${today}T00:00:00+07:00`),
          note: "E2E purchase",
          createdById: managerId,
        },
      });
      await postPurchaseEntry(
        tx,
        {
          id: movement.id,
          supplyId: supply.id,
          quantity: 1,
          totalCost: 120_000,
          date: today,
        },
        managerId,
      );
    });

    await receivePayment({ orderId: order1.id, amount: 25_000, method: "CASH" }, managerId, "e2e-pay-1");

    await db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          category: "ELECTRICITY_WATER",
          amount: 300_000,
          paidFrom: "CASH",
          date: new Date(`${today}T00:00:00+07:00`),
          note: "E2E electricity",
          createdById: managerId,
        },
      });
      await postExpenseEntry(
        tx,
        {
          id: expense.id,
          category: "ELECTRICITY_WATER",
          amount: 300_000,
          paidFrom: "CASH",
          date: today,
        },
        managerId,
      );
    });

    expect(await accountBalance("1-100", today)).toBe(656_000);
    expect(await accountBalance("1-200", today)).toBe(70_000);
    expect(await accountBalance("1-300", today)).toBe(120_000);

    const income = await incomeStatement(today, today);
    expect(income.revenue).toBe(146_000);
    expect(income.expenses).toBe(300_000);
    expect(income.profit).toBe(-154_000);

    const cash = await cashFlow(today, today);
    expect(cash.opening).toBe(1_000_000);
    expect(cash.cashIn).toBe(76_000);
    expect(cash.cashOut).toBe(420_000);
    expect(cash.net).toBe(-344_000);
    expect(cash.closing).toBe(656_000);

    const balance = await balanceSheet(today);
    expect(balance.totalAssets).toBe(846_000);
    expect(balance.equity).toBe(846_000);
    expect(balance.balanced).toBe(true);

    const trial = await trialBalanceReport(today);
    expect(trial.totalDebit).toBe(trial.totalCredit);
    expect(trial.balanced).toBe(true);

    const [unbalanced, invalidLines, overpaid] = await Promise.all([
      db.$queryRaw<Array<{ count: bigint | number }>>`
        SELECT COUNT(*) AS count FROM (
          SELECT e.id
          FROM journal_entries e
          JOIN journal_lines l ON l.entryId = e.id
          GROUP BY e.id
          HAVING SUM(l.debit) <> SUM(l.credit)
        ) unbalanced
      `,
      db.$queryRaw<Array<{ count: bigint | number }>>`
        SELECT COUNT(*) AS count FROM journal_lines
        WHERE (debit > 0 AND credit > 0)
           OR debit < 0 OR credit < 0
           OR (debit = 0 AND credit = 0)
      `,
      db.$queryRaw<Array<{ count: bigint | number }>>`
        SELECT COUNT(*) AS count FROM orders o
        WHERE (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE orderId = o.id) > o.total
      `,
    ]);
    expect(Number(unbalanced[0]?.count ?? 0)).toBe(0);
    expect(Number(invalidLines[0]?.count ?? 0)).toBe(0);
    expect(Number(overpaid[0]?.count ?? 0)).toBe(0);

    const openOrders = await db.order.findMany({
      where: { voidedAt: null },
      select: { total: true, payments: { select: { amount: true } } },
    });
    const openBalance = openOrders.reduce((total, order) => {
      const paid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return total + Math.max(0, order.total - paid);
    }, 0);
    expect(await accountBalance("1-200", today)).toBe(openBalance);

    const order2Entries = await db.journalEntry.findMany({
      where: { refType: "ORDER", refId: order2.id },
      select: { id: true },
    });
    const entryCountBeforeVoid = await db.journalEntry.count();

    const voidResult = await voidOrderAction(order2.id, "Customer cancelled the order");
    expect(voidResult.ok).toBe(true);
    expect(await accountBalance("1-100", today)).toBe(620_000);
    expect((await incomeStatement(today, today)).revenue).toBe(110_000);
    expect(await accountBalance("4-100", today)).toBe(-110_000);

    const entryCountAfterVoid = await db.journalEntry.count();
    expect(entryCountAfterVoid).toBeGreaterThan(entryCountBeforeVoid);
    for (const entry of order2Entries) {
      expect(await db.journalEntry.findUnique({ where: { id: entry.id } })).not.toBeNull();
    }

    await expect(
      receivePayment({ orderId: order2.id, amount: 1_000, method: "CASH" }, managerId, "e2e-pay-voided"),
    ).rejects.toThrow();

    const secondVoid = await voidOrderAction(order2.id, "Customer cancelled again");
    expect(secondVoid.ok).toBe(false);
  });
});
