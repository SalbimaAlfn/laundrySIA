import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env", quiet: true });

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

const services = [
  { name: "Cuci + setrika", unit: "KG", price: 8000, turnaroundDays: 2 },
  { name: "Express", unit: "KG", price: 12000, turnaroundDays: 1 },
  { name: "Kiloan", unit: "KG", price: 7000, turnaroundDays: 3 },
] as const;

async function main(): Promise<void> {
  const { db } = await import("../src/server/db");
  const { hash } = await import("bcryptjs");
  const { addBusinessDays, businessDate } = await import("../src/lib/dates");
  const { createOrder } = await import("../src/server/orders/create-order");
  const { receivePayment } = await import("../src/server/payments/receive-payment");
  const { postOpeningEntry, postPurchaseEntry, postExpenseEntry } = await import(
    "../src/server/accounting/posting"
  );

  const completed = await db.setting.findUnique({ where: { key: "demo.completed" } });
  if (completed?.value === "yes") {
    console.log("Demo data already exists. Delete setting demo.completed to run it again.");
    await db.$disconnect();
    return;
  }

  const today = businessDate();
  const pickupDate = addBusinessDays(today, 2);

  for (const account of accounts) {
    await db.account.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type },
      create: account,
    });
  }

  const managerHash = await hash("ChangeMe-Manager1", 12);
  const manager = await db.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      name: "Manajer",
      username: "manager",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  for (const service of services) {
    await db.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  const demoCustomers = await Promise.all(
    Array.from({ length: 6 }, (_, index) => {
      const phone = `0812000001${String(index + 1).padStart(2, "0")}`;
      return db.customer.upsert({
        where: { phone },
        update: {},
        create: { name: `Pelanggan Demo ${index + 1}`, phone },
      });
    }),
  );

  const serviceRows = await db.service.findMany({
    where: { name: { in: services.map((service) => service.name) } },
    orderBy: { id: "asc" },
  });
  const serviceId = (name: string) => serviceRows.find((service) => service.name === name)!.id;

  await db.$transaction(async (tx) => {
    const key = "demo:opening";
    const previous = await tx.idempotencyKey.findUnique({ where: { key } });
    if (previous?.resultId) return;

    const entry = await postOpeningEntry(tx, { cash: 1_000_000, date: today }, manager.id);
    await tx.idempotencyKey.create({
      data: {
        key,
        action: "OPENING",
        userId: manager.id,
        resultType: "JournalEntry",
        resultId: entry?.entryId ?? null,
      },
    });
  });

  const order1 = await createOrder(
    {
      customerId: demoCustomers[0]!.id,
      items: [{ serviceId: serviceId("Cuci + setrika"), quantityHundredths: 500 }],
      discount: 0,
      pickupDate,
      paymentType: "DEPOSIT",
      paymentAmount: 15_000,
      paymentMethod: "CASH",
      note: "Demo order 1",
    },
    manager.id,
    "demo-order-1",
  );

  await createOrder(
    {
      customerId: demoCustomers[1]!.id,
      items: [{ serviceId: serviceId("Express"), quantityHundredths: 300 }],
      discount: 0,
      pickupDate,
      paymentType: "FULL",
      paymentMethod: "CASH",
      note: "Demo order 2",
    },
    manager.id,
    "demo-order-2",
  );

  await createOrder(
    {
      customerId: demoCustomers[2]!.id,
      items: [{ serviceId: serviceId("Kiloan"), quantityHundredths: 1000 }],
      discount: 0,
      pickupDate,
      paymentType: "LATER",
      paymentMethod: "CASH",
      note: "Demo order 3",
    },
    manager.id,
    "demo-order-3",
  );

  await receivePayment(
    { orderId: order1.id, amount: 25_000, method: "CASH" },
    manager.id,
    "demo-payment-order-1",
  );

  const supply = await db.supply.upsert({
    where: { name: "Deterjen Demo" },
    update: {},
    create: { name: "Deterjen Demo", unit: "L", stockQty: 0, minQty: 1, avgUnitCost: 0 },
  });

  await db.$transaction(async (tx) => {
    const key = "demo:supply-purchase";
    const previous = await tx.idempotencyKey.findUnique({ where: { key } });
    if (previous?.resultId) return;

    const movement = await tx.supplyMovement.create({
      data: {
        supplyId: supply.id,
        type: "IN",
        quantity: 1,
        totalCost: 120_000,
        date: new Date(`${today}T00:00:00+07:00`),
        note: "Demo purchase",
        createdById: manager.id,
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
      manager.id,
    );
    await tx.idempotencyKey.create({
      data: {
        key,
        action: "SUPPLY_PURCHASE",
        userId: manager.id,
        resultType: "SupplyMovement",
        resultId: movement.id,
      },
    });
  });

  await db.$transaction(async (tx) => {
    const key = "demo:expense-electricity";
    const previous = await tx.idempotencyKey.findUnique({ where: { key } });
    if (previous?.resultId) return;

    const expense = await tx.expense.create({
      data: {
        category: "ELECTRICITY_WATER",
        amount: 300_000,
        paidFrom: "CASH",
        date: new Date(`${today}T00:00:00+07:00`),
        note: "Demo electricity",
        createdById: manager.id,
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
      manager.id,
    );
    await tx.idempotencyKey.create({
      data: {
        key,
        action: "EXPENSE_CREATE",
        userId: manager.id,
        resultType: "Expense",
        resultId: expense.id,
      },
    });
  });

  // Thirty extra orders spread over the last week so every report has data.
  for (let index = 0; index < 30; index++) {
    const customer = demoCustomers[index % demoCustomers.length]!;
    const service = serviceRows[index % serviceRows.length]!;
    const orderDate = addBusinessDays(today, -(index % 30));
    const paymentType = index % 3 === 0 ? "LATER" : index % 3 === 1 ? "FULL" : "DEPOSIT";
    const quantity = (index % 5 + 1) * 100;

    const order = await createOrder(
      {
        customerId: customer.id,
        items: [{ serviceId: service.id, quantityHundredths: quantity }],
        discount: index % 7 === 0 ? 2_000 : 0,
        pickupDate: addBusinessDays(orderDate, service.turnaroundDays),
        paymentType,
        paymentAmount:
          paymentType === "DEPOSIT"
            ? Math.max(1_000, Math.floor((quantity * service.price) / 200))
            : undefined,
        paymentMethod: index % 2 === 0 ? "CASH" : "TRANSFER",
        note: `Demo extra order ${index + 1}`,
      },
      manager.id,
      `demo-extra-${index + 1}`,
    );

    await db.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(`${orderDate}T09:00:00+07:00`) },
    });
    const payments = await db.payment.findMany({
      where: { orderId: order.id },
      select: { id: true },
    });
    await db.journalEntry.updateMany({
      where: {
        OR: [
          { refType: "ORDER", refId: order.id },
          { refType: "PAYMENT", refId: { in: payments.map((payment) => payment.id) } },
        ],
      },
      data: { entryDate: new Date(`${orderDate}T00:00:00+07:00`) },
    });
  }

  await db.setting.upsert({
    where: { key: "demo.completed" },
    update: { value: "yes" },
    create: { key: "demo.completed", value: "yes" },
  });

  console.log("Demo data ready: worked example plus 30 extra orders.");
  console.log("Login: manager / ChangeMe-Manager1");
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("Demo data failed.");
  console.error(error);
  process.exitCode = 1;
});
