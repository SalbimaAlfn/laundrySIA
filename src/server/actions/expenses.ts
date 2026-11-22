"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { expenseSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { accountBalance } from "@/server/accounting/queries";
import { postExpenseEntry, reverseEntriesByRef } from "@/server/accounting/posting";

export type ExpenseRecord = {
  id: number;
  category: "ELECTRICITY_WATER" | "WAGES" | "RENT" | "OTHER";
  amount: number;
  paidFrom: "CASH" | "BANK";
  date: string;
  note: string | null;
  createdById: number;
  createdBy: string;
  createdAt: string;
  reversedAt: string | null;
  reversedBy: string | null;
  reverseReason: string | null;
};

export type ExpenseFormState = {
  status: "idle" | "success" | "invalid" | "error";
  errors?: Record<string, string>;
  expense?: ExpenseRecord;
};

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

function readForm(formData: FormData) {
  return expenseSchema.safeParse({
    category: formData.get("category"),
    amount: Number(formData.get("amount")),
    paidFrom: formData.get("paidFrom"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
}

export async function createExpenseAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await requireRole("MANAGER");
  const parsed = readForm(formData);

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    const expense = await db.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          ...parsed.data,
          date: new Date(parsed.data.date),
          createdById: session.id,
        },
        select: {
          id: true,
          category: true,
          amount: true,
          paidFrom: true,
          date: true,
          note: true,
          createdById: true,
          createdAt: true,
        },
      });

      const createdWithStrings = {
        ...created,
        date: created.date.toISOString().slice(0, 10),
      };

      await postExpenseEntry(tx, created, session.id);

      await writeAudit(tx, {
        userId: session.id,
        action: "EXPENSE_CREATE",
        entityType: "Expense",
        entityId: created.id,
        detail: {
          category: created.category,
          amount: created.amount,
          paidFrom: created.paidFrom,
        },
      });

      return createdWithStrings;
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { status: "success", expense: { ...expense, createdBy: session.name, createdAt: expense.createdAt.toISOString(), reversedAt: null, reversedBy: null, reverseReason: null } };
  } catch (error) {
    console.error("Failed to create expense", error);
    return { status: "error" };
  }
}

export async function reverseExpenseAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  const reason = formData.get("reason")?.toString().trim();

  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Invalid expense id" };
  if (!reason || reason.length < 5 || reason.length > 200) {
    return { ok: false, error: "Reverse reason must be 5-200 characters" };
  }

  try {
    await db.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
        select: {
          id: true,
          category: true,
          amount: true,
          paidFrom: true,
          date: true,
          createdById: true,
          reversedAt: true,
        },
      });

      if (!expense) throw new Error("Expense not found");
      if (expense.reversedAt) throw new Error("Expense already reversed");

      // Reverse the journal entry
      await reverseEntriesByRef(tx, "EXPENSE", expense.id, session.id);

      // Mark expense as reversed
      await tx.expense.update({
        where: { id },
        data: {
          reversedAt: new Date(),
          reversedById: session.id,
          reverseReason: reason,
        },
      });

      await writeAudit(tx, {
        userId: session.id,
        action: "EXPENSE_REVERSE",
        entityType: "Expense",
        entityId: id,
        detail: { reason },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    console.error("Failed to reverse expense", error);
    const message = error instanceof Error ? error.message : "Failed to reverse expense";
    return { ok: false, error: message };
  }
}

export async function getExpenses(): Promise<ExpenseRecord[]> {
  const expenses = await db.expense.findMany({
    where: {},
    include: {
      createdBy: { select: { name: true } },
      reversedBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    paidFrom: e.paidFrom,
    date: e.date.toISOString().slice(0, 10),
    note: e.note,
    createdById: e.createdById,
    createdBy: e.createdBy.name,
    createdAt: e.createdAt.toISOString(),
    reversedAt: e.reversedAt?.toISOString() ?? null,
    reversedBy: e.reversedBy?.name ?? null,
    reverseReason: e.reverseReason,
  }));
}

/**
 * Cash and bank come straight from the ledger instead of re-summing source
 * rows. Re-summing missed voided orders, charged every supply purchase to cash
 * even when it was paid from the bank, and could drift from the trial balance.
 */
export async function getExpenseBalance(): Promise<{ cashBalance: number; bankBalance: number }> {
  const [cashBalance, bankBalance] = await Promise.all([
    accountBalance("1-100"),
    accountBalance("1-110"),
  ]);
  return { cashBalance, bankBalance };
}