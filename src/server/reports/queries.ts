import { Prisma } from "@/generated/prisma/client";
import { businessDate } from "@/lib/dates";
import { db } from "@/server/db";
import { getReceivables } from "@/server/orders/queries";

export type AccountBalanceRow = {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
};

async function accountBalances(from?: string, to?: string): Promise<AccountBalanceRow[]> {
  const rows = await db.$queryRaw<
    Array<{ code: string; name: string; type: string; debit: bigint | number | null; credit: bigint | number | null }>
  >(
    Prisma.sql`
      SELECT a.code, a.name, a.type,
             COALESCE(t.debit, 0) AS debit,
             COALESCE(t.credit, 0) AS credit
      FROM accounts a
      LEFT JOIN (
        SELECT l.accountId, SUM(l.debit) AS debit, SUM(l.credit) AS credit
        FROM journal_lines l
        JOIN journal_entries e ON e.id = l.entryId
        WHERE e.entryDate >= ${from ?? "0001-01-01"}
          AND e.entryDate <= ${to ?? "9999-12-31"}
        GROUP BY l.accountId
      ) t ON t.accountId = a.id
      ORDER BY a.code
    `,
  );

  return rows.map((row) => {
    const debit = Number(row.debit ?? 0);
    const credit = Number(row.credit ?? 0);
    return { code: row.code, name: row.name, type: row.type, debit, credit, balance: debit - credit };
  });
}

export type IncomeStatement = {
  revenue: number;
  expenses: number;
  profit: number;
  revenueRows: AccountBalanceRow[];
  expenseRows: AccountBalanceRow[];
};

export async function incomeStatement(from: string, to: string): Promise<IncomeStatement> {
  const rows = await accountBalances(from, to);
  const revenueRows = rows
    .filter((row) => row.type === "REVENUE" && row.credit - row.debit !== 0)
    .map((row) => ({ ...row, balance: row.credit - row.debit }));
  const expenseRows = rows
    .filter((row) => row.type === "EXPENSE" && row.debit - row.credit !== 0)
    .map((row) => ({ ...row, balance: row.debit - row.credit }));
  const revenue = revenueRows.reduce((total, row) => total + row.balance, 0);
  const expenses = expenseRows.reduce((total, row) => total + row.balance, 0);
  return { revenue, expenses, profit: revenue - expenses, revenueRows, expenseRows };
}

export type CashFlow = {
  opening: number;
  cashIn: number;
  cashOut: number;
  net: number;
  closing: number;
  groups: Array<{ label: string; amount: number }>;
};

export async function cashFlow(from: string, to: string): Promise<CashFlow> {
  const [openingRows, flowRows, groups] = await Promise.all([
    db.$queryRaw<Array<{ opening: bigint | number | null }>>(
      Prisma.sql`
        SELECT COALESCE(SUM(l.debit) - SUM(l.credit), 0) AS opening
        FROM journal_lines l
        JOIN journal_entries e ON e.id = l.entryId
        JOIN accounts a ON a.id = l.accountId
        WHERE a.code IN ('1-100', '1-110')
          AND (e.entryDate < ${from} OR e.refType = 'OPENING')
      `,
    ),
    db.$queryRaw<Array<{ cashIn: bigint | number | null; cashOut: bigint | number | null }>>(
      Prisma.sql`
        SELECT COALESCE(SUM(l.debit), 0) AS cashIn, COALESCE(SUM(l.credit), 0) AS cashOut
        FROM journal_lines l
        JOIN journal_entries e ON e.id = l.entryId
        JOIN accounts a ON a.id = l.accountId
        WHERE a.code IN ('1-100', '1-110')
          AND e.refType <> 'OPENING'
          AND e.entryDate >= ${from} AND e.entryDate <= ${to}
      `,
    ),
    db.$queryRaw<Array<{ refType: string; amount: bigint | number | null }>>(
      Prisma.sql`
        SELECT e.refType, COALESCE(SUM(l.debit), 0) AS amount
        FROM journal_lines l
        JOIN journal_entries e ON e.id = l.entryId
        JOIN accounts a ON a.id = l.accountId
        WHERE a.code IN ('1-100', '1-110')
          AND e.refType <> 'OPENING'
          AND e.entryDate >= ${from} AND e.entryDate <= ${to}
        GROUP BY e.refType
      `,
    ),
  ]);

  const opening = Number(openingRows[0]?.opening ?? 0);
  const cashIn = Number(flowRows[0]?.cashIn ?? 0);
  const cashOut = Number(flowRows[0]?.cashOut ?? 0);
  const orderPayments = groups
    .filter((row) => row.refType === "ORDER" || row.refType === "PAYMENT")
    .reduce((total, row) => total + Number(row.amount ?? 0), 0);
  const other = cashIn - orderPayments;

  return {
    opening,
    cashIn,
    cashOut,
    net: cashIn - cashOut,
    closing: opening + cashIn - cashOut,
    groups: [
      { label: "Order payments", amount: orderPayments },
      { label: "Other", amount: other },
    ].filter((group) => group.amount !== 0),
  };
}

export type BalanceSheet = {
  assets: AccountBalanceRow[];
  totalAssets: number;
  capital: number;
  profit: number;
  equity: number;
  balanced: boolean;
};

export async function balanceSheet(asOf: string): Promise<BalanceSheet> {
  const rows = await accountBalances(undefined, asOf);
  const assets = rows.filter((row) => row.type === "ASSET");
  const totalAssets = assets.reduce((total, row) => total + row.balance, 0);
  const capital = rows
    .filter((row) => row.type === "EQUITY")
    .reduce((total, row) => total + row.credit - row.debit, 0);
  const revenue = rows
    .filter((row) => row.type === "REVENUE")
    .reduce((total, row) => total + row.credit - row.debit, 0);
  const expenses = rows
    .filter((row) => row.type === "EXPENSE")
    .reduce((total, row) => total + row.debit - row.credit, 0);
  const profit = revenue - expenses;
  const equity = capital + profit;
  return { assets, totalAssets, capital, profit, equity, balanced: totalAssets === equity };
}

export type SalesReport = {
  byService: Array<{ serviceName: string; unit: string; quantity: number; revenue: number }>;
  byDay: Array<{ day: string; orders: number; revenue: number }>;
  totalRevenue: number;
};

function dayString(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return businessDate(value);
}

export async function salesReport(from: string, to: string): Promise<SalesReport> {
  const byServiceRows = await db.$queryRaw<
    Array<{ serviceName: string; unit: string; quantity: bigint | number | null; revenue: bigint | number | null }>
  >(
    Prisma.sql`
      SELECT oi.serviceName, oi.unit,
             COALESCE(SUM(oi.quantity), 0) AS quantity,
             COALESCE(SUM(oi.lineTotal), 0) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.orderId
      WHERE o.voidedAt IS NULL
        AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) >= ${from}
        AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) <= ${to}
      GROUP BY oi.serviceName, oi.unit
      ORDER BY revenue DESC
    `,
  );
  const byDayRows = await db.$queryRaw<
    Array<{ day: Date | string; orders: bigint | number | null; revenue: bigint | number | null }>
  >(
    Prisma.sql`
      SELECT DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) AS day,
             COUNT(*) AS orders,
             COALESCE(SUM(o.total), 0) AS revenue
      FROM orders o
      WHERE o.voidedAt IS NULL
        AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) >= ${from}
        AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) <= ${to}
      GROUP BY day
      ORDER BY day
    `,
  );

  const byService = byServiceRows.map((row) => ({
    serviceName: row.serviceName,
    unit: row.unit,
    quantity: Number(row.quantity ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));
  const byDay = byDayRows.map((row) => ({
    day: dayString(row.day),
    orders: Number(row.orders ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));

  return {
    byService,
    byDay,
    totalRevenue: byService.reduce((total, row) => total + row.revenue, 0),
  };
}

export async function whoOwes() {
  return getReceivables();
}

export type TrialBalanceReport = {
  rows: AccountBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
};

export async function trialBalanceReport(asOf: string): Promise<TrialBalanceReport> {
  const rows = await accountBalances(undefined, asOf);
  const totalDebit = rows.reduce((total, row) => total + row.debit, 0);
  const totalCredit = rows.reduce((total, row) => total + row.credit, 0);
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

export type DashboardData = {
  earnedToday: number;
  receivedToday: number;
  toCollect: number;
  toCollectOrders: Array<{ id: number; invoiceNo: string; customerName: string; balance: number }>;
  lowStock: Array<{ id: number; name: string; unit: string; stockQty: number; minQty: number }>;
  readyOrders: Array<{ id: number; invoiceNo: string; customerName: string }>;
  revenue7Days: Array<{ day: string; revenue: number }>;
};

export async function dashboardData(today: string): Promise<DashboardData> {
  const [income, receivedRows, receivables, lowStock, readyOrders, revenueRows] = await Promise.all([
    incomeStatement(today, today),
    db.$queryRaw<Array<{ received: bigint | number | null }>>(
      Prisma.sql`
        SELECT COALESCE(SUM(l.debit), 0) AS received
        FROM journal_lines l
        JOIN journal_entries e ON e.id = l.entryId
        JOIN accounts a ON a.id = l.accountId
        WHERE a.code IN ('1-100', '1-110')
          AND e.entryDate = ${today}
          AND e.refType IN ('ORDER', 'PAYMENT')
      `,
    ),
    getReceivables(),
    db.supply.findMany({
      where: { stockQty: { lte: db.supply.fields.minQty } },
      select: { id: true, name: true, unit: true, stockQty: true, minQty: true },
      orderBy: { name: "asc" },
    }),
    db.order.findMany({
      where: { status: "READY", voidedAt: null },
      select: { id: true, invoiceNo: true, customer: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.$queryRaw<Array<{ day: Date | string; revenue: bigint | number | null }>>(
      Prisma.sql`
        SELECT DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) AS day,
               COALESCE(SUM(o.total), 0) AS revenue
        FROM orders o
        WHERE o.voidedAt IS NULL
          AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) >= DATE_SUB(${today}, INTERVAL 6 DAY)
          AND DATE(DATE_ADD(o.createdAt, INTERVAL 7 HOUR)) <= ${today}
        GROUP BY day
        ORDER BY day
      `,
    ),
  ]);

  return {
    earnedToday: income.revenue,
    receivedToday: Number(receivedRows[0]?.received ?? 0),
    toCollect: receivables.total,
    toCollectOrders: receivables.orders.slice(0, 5).map((order) => ({
      id: order.id,
      invoiceNo: order.invoiceNo,
      customerName: order.customerName,
      balance: order.balance,
    })),
    lowStock: lowStock.map((supply) => ({
      id: supply.id,
      name: supply.name,
      unit: supply.unit,
      stockQty: Number(supply.stockQty),
      minQty: Number(supply.minQty),
    })),
    readyOrders: readyOrders.map((order) => ({
      id: order.id,
      invoiceNo: order.invoiceNo,
      customerName: order.customer.name,
    })),
    revenue7Days: revenueRows.map((row) => ({
      day: dayString(row.day),
      revenue: Number(row.revenue ?? 0),
    })),
  };
}
