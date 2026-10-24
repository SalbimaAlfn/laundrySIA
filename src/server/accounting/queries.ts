import { Prisma } from "@/generated/prisma/client";
import { parseBusinessDate, startOfDayWIB } from "@/lib/dates";

async function getDb() {
  const mod = await import("@/server/db");
  return mod.db;
}

function toDateString(value: Date | string): string {
  if (typeof value === "string") {
    // assume YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return parseBusinessDate(value).toISOString().slice(0, 10);
  }
  const d = startOfDayWIB(value);
  const [y, m, day] = d.toISOString().slice(0, 10).split("-");
  // better use business date
  const { businessDate } = require("@/lib/dates");
  return businessDate(value);
}

export async function accountBalance(code: string, asOf?: Date | string): Promise<number> {
  const db = await getDb();
  const { businessDate } = await import("@/lib/dates");
  const asOfDateStr = typeof asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? asOf : businessDate(asOf ? (typeof asOf === "string" ? parseBusinessDate(asOf) : asOf) : new Date());
  const result = await db.$queryRaw<Array<{ balance: bigint | number | null }>>(
    Prisma.sql`
      SELECT COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM journal_lines l
      JOIN journal_entries e ON e.id = l.entryId
      JOIN accounts a ON a.id = l.accountId
      WHERE a.code = ${code}
        AND DATE(e.entryDate) <= ${asOfDateStr}
    `,
  );
  const balance = result[0]?.balance;
  if (balance === null || balance === undefined) return 0;
  return Number(balance);
}

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
};

export async function trialBalance(asOf?: Date | string): Promise<TrialBalanceRow[]> {
  const db = await getDb();
  const { businessDate } = await import("@/lib/dates");
  const asOfDateStr = typeof asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? asOf : businessDate(asOf ? (typeof asOf === "string" ? parseBusinessDate(asOf) : asOf) : new Date());
  const results = await db.$queryRaw<
    Array<{
      code: string;
      name: string;
      type: string;
      debit: bigint | number | null;
      credit: bigint | number | null;
    }>
  >(
    Prisma.sql`
      SELECT a.code, a.name, a.type,
             COALESCE(SUM(l.debit), 0) as debit,
             COALESCE(SUM(l.credit), 0) as credit
      FROM accounts a
      LEFT JOIN journal_lines l ON l.accountId = a.id
      LEFT JOIN journal_entries e ON e.id = l.entryId AND DATE(e.entryDate) <= ${asOfDateStr}
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `,
  );

  return results.map((r) => ({
    code: r.code,
    name: r.name,
    type: r.type,
    debit: Number(r.debit ?? 0),
    credit: Number(r.credit ?? 0),
  }));
}

export type LedgerRow = {
  entryId: number;
  date: Date;
  description: string;
  refType: string;
  refId: number | null;
  debit: number;
  credit: number;
};

export async function ledger(
  code: string,
  from: Date | string,
  to: Date | string,
): Promise<LedgerRow[]> {
  const db = await getDb();
  const { businessDate } = await import("@/lib/dates");
  const fromStr = typeof from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : businessDate(typeof from === "string" ? parseBusinessDate(from) : from);
  const toStr = typeof to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : businessDate(typeof to === "string" ? parseBusinessDate(to) : to);
  const results = await db.$queryRaw<
    Array<{
      entryId: number;
      date: Date;
      description: string;
      refType: string;
      refId: number | null;
      debit: bigint | number | null;
      credit: bigint | number | null;
    }>
  >(
    Prisma.sql`
      SELECT e.id as entryId, e.entryDate as date, e.description, e.refType, e.refId,
             COALESCE(l.debit, 0) as debit,
             COALESCE(l.credit, 0) as credit
      FROM journal_lines l
      JOIN journal_entries e ON e.id = l.entryId
      JOIN accounts a ON a.id = l.accountId
      WHERE a.code = ${code}
        AND DATE(e.entryDate) >= ${fromStr}
        AND DATE(e.entryDate) <= ${toStr}
      ORDER BY e.entryDate, e.id
    `,
  );

  return results.map((r) => ({
    entryId: Number(r.entryId),
    date: r.date,
    description: r.description,
    refType: r.refType,
    refId: r.refId,
    debit: Number(r.debit ?? 0),
    credit: Number(r.credit ?? 0),
  }));
}
