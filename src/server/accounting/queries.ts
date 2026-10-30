import { Prisma } from "@/generated/prisma/client";
import { businessDate } from "@/lib/dates";

async function getDb() {
  const mod = await import("@/server/db");
  return mod.db;
}

function toDateString(value: Date | string = new Date()): string {
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return businessDate(new Date(value));
  }
  return businessDate(value);
}

export async function accountBalance(code: string, asOf?: Date | string): Promise<number> {
  const db = await getDb();
  const asOfDateStr = toDateString(asOf ?? new Date());
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
  const asOfDateStr = toDateString(asOf ?? new Date());
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
  const fromStr = toDateString(from);
  const toStr = toDateString(to);
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
