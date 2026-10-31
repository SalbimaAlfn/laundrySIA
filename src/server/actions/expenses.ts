"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { expenseSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
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

export async function getExpenseBalance(): Promise<{ cashBalance: number; bankBalance: number }> {
  // Get opening balances
  const settings = await db.setting.findMany({
    where: { key: { in: ["opening.cash", "opening.bank"] } },
    select: { key: true, value: true },
  });
  const opening = { cash: 0, bank: 0 };
  for (const s of settings) {
    if (s.key === "opening.cash") opening.cash = Number(s.value);
    if (s.key === "opening.bank") opening.bank = Number(s.value);
  }

  // Sum all expenses and reversals
  const expenses = await db.expense.findMany({
    select: { amount: true, paidFrom: true, reversedAt: true },
  });

  let cashSpent = 0;
  let bankSpent = 0;
  for (const exp of expenses) {
    if (exp.reversedAt) continue;
    if (exp.paidFrom === "CASH") cashSpent += exp.amount;
    else bankSpent += exp.amount;
  }

  // Also include payments received (income)
  const payments = await db.payment.findMany({
    select: { amount: true, method: true },
  });
  let cashReceived = 0;
  let bankReceived = 0;
  for (const p of payments) {
    if (p.method === "CASH") cashReceived += p.amount;
    else bankReceived += p.amount;
  }

  // Include supply purchases
  const purchases = await db.supplyMovement.findMany({
    where: { type: "IN" },
    select: { totalCost: true },
  });
  let purchaseCash = 0;
  for (const pur of purchases) {
    purchaseCash += pur.totalCost;
  }

  return {
    cashBalance: opening.cash + cashReceived - cashSpent - purchaseCash,
    bankBalance: opening.bank + bankReceived - bankSpent,
  };
}