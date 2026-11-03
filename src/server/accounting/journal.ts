import type { Prisma } from "@/generated/prisma/client";
import { businessDate, isBusinessDate } from "@/lib/dates";

export type JournalErrorCode =
  | "JOURNAL_TOO_FEW_LINES"
  | "JOURNAL_NEGATIVE_AMOUNT"
  | "JOURNAL_BOTH_SIDES"
  | "JOURNAL_NO_SIDE"
  | "JOURNAL_NOT_INTEGER"
  | "JOURNAL_UNBALANCED"
  | "JOURNAL_ZERO_TOTAL"
  | "JOURNAL_INVALID_DATE"
  | "JOURNAL_INVALID_DESCRIPTION"
  | "JOURNAL_ACCOUNT_NOT_FOUND"
  | "JOURNAL_ENTRY_NOT_FOUND"
  | "JOURNAL_ALREADY_REVERSED"
  | "JOURNAL_INSUFFICIENT_STOCK";

export class JournalError extends Error {
  readonly code: JournalErrorCode;

  constructor(code: JournalErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "JournalError";
  }
}

export type JournalRefType = "ORDER" | "PAYMENT" | "EXPENSE" | "PURCHASE" | "USAGE" | "OPENING" | "VOID";

export type JournalLineInput = {
  accountCode: string;
  debit?: number | null;
  credit?: number | null;
};

export type PostEntryInput = {
  date: Date | string;
  description: string;
  refType: JournalRefType;
  refId?: number | null;
  lines: JournalLineInput[];
  createdById: number;
  reversesEntryId?: number | null;
};

type NormalizedLine = {
  accountCode: string;
  debit: number;
  credit: number;
};

function toEntryDate(value: Date | string): Date {
  if (typeof value === "string") {
    if (!isBusinessDate(value)) {
      throw new JournalError("JOURNAL_INVALID_DATE", "Journal date must be a real YYYY-MM-DD date");
    }
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  }

  if (Number.isNaN(value.getTime())) {
    throw new JournalError("JOURNAL_INVALID_DATE", "Journal date is invalid");
  }

  const [year, month, day] = businessDate(value).split("-").map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

function normalizeLines(lines: JournalLineInput[]): { lines: NormalizedLine[]; total: number } {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new JournalError("JOURNAL_TOO_FEW_LINES", "Journal entry must have at least two lines");
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const normalized: NormalizedLine[] = [];

  for (const line of lines) {
    const debit = line.debit ?? 0;
    const credit = line.credit ?? 0;

    if (debit < 0 || credit < 0) {
      throw new JournalError("JOURNAL_NEGATIVE_AMOUNT", "Journal line amounts must not be negative");
    }
    if (!Number.isInteger(debit) || !Number.isInteger(credit)) {
      throw new JournalError("JOURNAL_NOT_INTEGER", "Journal amounts must be integer rupiah");
    }

    const hasDebit = debit > 0;
    const hasCredit = credit > 0;
    if (hasDebit && hasCredit) {
      throw new JournalError("JOURNAL_BOTH_SIDES", "Each journal line must have exactly one positive side");
    }
    if (!hasDebit && !hasCredit) {
      throw new JournalError("JOURNAL_NO_SIDE", "Each journal line must have exactly one positive side");
    }

    totalDebit += debit;
    totalCredit += credit;
    normalized.push({ accountCode: line.accountCode, debit, credit });
  }

  if (totalDebit !== totalCredit) {
    throw new JournalError("JOURNAL_UNBALANCED", "Total debit must equal total credit");
  }
  if (totalDebit <= 0) {
    throw new JournalError("JOURNAL_ZERO_TOTAL", "Journal total must be greater than zero");
  }

  return { lines: normalized, total: totalDebit };
}

/**
 * Creates one balanced journal entry through the caller's transaction. The
 * entry is immutable once written; corrections use `reverseEntry`.
 */
export async function postEntry(
  tx: Prisma.TransactionClient,
  input: PostEntryInput,
): Promise<{ entryId: number }> {
  const description = input.description.trim();
  if (description.length === 0 || description.length > 200) {
    throw new JournalError(
      "JOURNAL_INVALID_DESCRIPTION",
      "Journal description must be 1 to 200 characters",
    );
  }

  const entryDate = toEntryDate(input.date);
  const { lines } = normalizeLines(input.lines);

  const codes = Array.from(new Set(lines.map((line) => line.accountCode)));
  const accounts = await tx.account.findMany({ where: { code: { in: codes } } });
  const accountByCode = new Map(accounts.map((account) => [account.code, account]));

  for (const code of codes) {
    if (!accountByCode.has(code)) {
      throw new JournalError("JOURNAL_ACCOUNT_NOT_FOUND", `Account not found: ${code}`);
    }
  }

  const entry = await tx.journalEntry.create({
    data: {
      entryDate,
      description,
      refType: input.refType,
      refId: input.refId ?? null,
      reversesEntryId: input.reversesEntryId ?? null,
      createdById: input.createdById,
      lines: {
        create: lines.map((line) => ({
          accountId: accountByCode.get(line.accountCode)!.id,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
    select: { id: true },
  });

  return { entryId: entry.id };
}

/**
 * Mirrors an existing entry with debit and credit swapped. The link is unique,
 * so an entry can only be reversed once.
 */
export async function reverseEntry(
  tx: Prisma.TransactionClient,
  entryId: number,
  createdById: number,
): Promise<{ entryId: number }> {
  const original = await tx.journalEntry.findUnique({
    where: { id: entryId },
    include: { lines: { include: { account: true } } },
  });

  if (!original) {
    throw new JournalError("JOURNAL_ENTRY_NOT_FOUND", "Journal entry not found");
  }
  if (original.reversesEntryId !== null) {
    throw new JournalError("JOURNAL_ALREADY_REVERSED", "A reversal entry cannot be reversed");
  }

  const existingReversal = await tx.journalEntry.findUnique({
    where: { reversesEntryId: original.id },
    select: { id: true },
  });
  if (existingReversal) {
    throw new JournalError("JOURNAL_ALREADY_REVERSED", "Journal entry has already been reversed");
  }

  return postEntry(tx, {
    date: original.entryDate,
    description: `Reversal of #${original.id}: ${original.description}`,
    refType: original.refType,
    refId: original.refId,
    createdById,
    reversesEntryId: original.id,
    lines: original.lines.map((line) => ({
      accountCode: line.account.code,
      debit: line.credit,
      credit: line.debit,
    })),
  });
}
