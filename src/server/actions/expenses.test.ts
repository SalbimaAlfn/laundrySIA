import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findUnique = vi.fn();
  const create = vi.fn();
  const findMany = vi.fn();
  return {
    findUnique,
    create,
    findMany,
    requireRole: vi.fn(async () => ({ id: 99, name: "Manager", role: "MANAGER" })),
    writeAudit: vi.fn(),
    revalidatePath: vi.fn(),
    tx: {
      expense: { findUnique, create, update: vi.fn() },
      auditLog: { create: vi.fn() },
      journalEntry: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
      journalLine: { create: vi.fn() },
      account: { findUnique: vi.fn().mockResolvedValue({ id: 1, code: "5-100" }) },
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({
  requireUser: async () => ({ id: 42, name: "Cashier", role: "CASHIER" }),
  requireRole: mocks.requireRole,
}));
vi.mock("@/server/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/server/accounting/posting", () => ({
  postExpenseEntry: vi.fn().mockResolvedValue({ entryId: 1 }),
  reverseEntriesByRef: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/server/db", () => ({
  db: { $transaction: (callback: (tx: typeof mocks.tx) => Promise<unknown>) => callback(mocks.tx) },
}));
vi.mock("@/server/accounting/queries", () => ({
  accountBalance: vi.fn(async (code: string) => (code === "1-100" ? 800_000 : 1_700_000)),
}));

import { createExpenseAction, getExpenseBalance, reverseExpenseAction } from "./expenses";

describe("expense actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an expense and posts a journal entry", async () => {
    const formData = new FormData();
    formData.append("category", "ELECTRICITY_WATER");
    formData.append("amount", "50000");
    formData.append("paidFrom", "CASH");
    formData.append("date", "2026-10-31");
    formData.append("note", "Monthly bill");

    mocks.create.mockResolvedValue({
      id: 1,
      category: "ELECTRICITY_WATER",
      amount: 50000,
      paidFrom: "CASH",
      date: new Date("2026-10-31"),
      note: "Monthly bill",
      createdById: 99,
      createdAt: new Date(),
    });

    const result = await createExpenseAction({ status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(mocks.create).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/expenses");
  });

  it("rejects invalid expense data", async () => {
    const formData = new FormData();
    formData.append("amount", "-100"); // Invalid amount

    const result = await createExpenseAction({ status: "idle" }, formData);

    expect(result.status).toBe("invalid");
    expect(result.errors).toBeDefined();
  });

  it("reverses an expense and writes an audit log", async () => {
    const formData = new FormData();
    formData.append("id", "1");
    formData.append("reason", "Wrong entry");

    mocks.findUnique.mockResolvedValue({
      id: 1,
      category: "RENT",
      amount: 1000000,
      paidFrom: "BANK",
      date: new Date(),
      createdById: 99,
      reversedAt: null,
    });

    const result = await reverseExpenseAction(formData);

    expect(result.ok).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/expenses");
  });

  it("reads cash and bank from the ledger accounts", async () => {
    await expect(getExpenseBalance()).resolves.toEqual({
      cashBalance: 800_000,
      bankBalance: 1_700_000,
    });
  });

  it("fails to reverse if reason is too short", async () => {
    const formData = new FormData();
    formData.append("id", "1");
    formData.append("reason", "bad");

    const result = await reverseExpenseAction(formData);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("5-200");
  });
});