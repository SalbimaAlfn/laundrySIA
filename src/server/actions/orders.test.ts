import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  return {
    findUnique,
    updateMany,
    requireUser: vi.fn(async () => ({ id: 42, role: "CASHIER" })),
    requireRole: vi.fn(async () => ({ id: 99, role: "MANAGER" })),
    writeAudit: vi.fn(),
    revalidatePath: vi.fn(),
    tx: { order: { findUnique, updateMany } },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({
  requireUser: mocks.requireUser,
  requireRole: mocks.requireRole,
}));
vi.mock("@/server/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/server/db", () => ({
  db: { $transaction: (callback: (tx: never) => unknown) => callback(mocks.tx as never) },
}));

import { advanceStatusAction, reverseStatusAction } from "./orders";

describe("order status actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue({
      status: "RECEIVED",
      voidedAt: null,
      total: 100_000,
      payments: [],
    });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.writeAudit.mockResolvedValue(undefined);
  });

  it("advances one step and audits the transition", async () => {
    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 12, status: "RECEIVED" },
      data: { status: "WASHING" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), {
      userId: 42,
      action: "ORDER_STATUS_ADVANCE",
      entityType: "Order",
      entityId: 12,
      detail: { from: "RECEIVED", to: "WASHING" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(3);
  });

  it("reverses one step and audits the transition", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: null,
      total: 100_000,
      payments: [],
    });

    const result = await reverseStatusAction(12);
    expect(result.ok).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 12, status: "READY" },
      data: { status: "DRYING_IRONING" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "ORDER_STATUS_REVERSE",
      detail: { from: "READY", to: "DRYING_IRONING" },
    }));
    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
  });

  it("denies a cashier the reverse-status action", async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error("manager only"));

    await expect(reverseStatusAction(12)).rejects.toThrow("manager only");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects status changes for voided orders", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: new Date(),
      total: 100_000,
      payments: [],
    });

    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("refuses a stale update without writing an audit", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const result = await reverseStatusAction(12);
    expect(result.ok).toBe(false);
    expect(mocks.writeAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects terminal and invalid transitions", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "COMPLETED",
      voidedAt: null,
      total: 100_000,
      payments: [],
    });
    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();

    const result2 = await advanceStatusAction(0);
    expect(result2.ok).toBe(false);
  });

  // T-063: Completed rule tests

  it("blocks advance to COMPLETED when balance remains (cashier)", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: null,
      total: 100_000,
      payments: [{ amount: 50_000 }], // balance = 50_000
    });
    mocks.requireUser.mockResolvedValue({ id: 42, role: "CASHIER" });

    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("managerRequired");
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("blocks advance to COMPLETED when balance remains (manager without note)", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: null,
      total: 100_000,
      payments: [{ amount: 50_000 }], // balance = 50_000
    });
    mocks.requireUser.mockResolvedValue({ id: 99, role: "MANAGER" });

    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("noteRequired");
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });

  it("allows manager override with note to COMPLETED when balance remains", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: null,
      total: 100_000,
      payments: [{ amount: 50_000 }], // balance = 50_000
    });
    mocks.requireUser.mockResolvedValue({ id: 99, role: "MANAGER" });

    const result = await advanceStatusAction(12, "Customer agreed to pay later");
    expect(result.ok).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 12, status: "READY" },
      data: { status: "COMPLETED" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "ORDER_STATUS_ADVANCE",
      detail: expect.objectContaining({
        from: "READY",
        to: "COMPLETED",
        overrideNote: "Customer agreed to pay later",
        overrideBalance: 50_000,
      }),
    }));
  });

  it("allows advance to COMPLETED when balance is zero", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "READY",
      voidedAt: null,
      total: 100_000,
      payments: [{ amount: 100_000 }], // balance = 0
    });
    mocks.requireUser.mockResolvedValue({ id: 42, role: "CASHIER" });

    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 12, status: "READY" },
      data: { status: "COMPLETED" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      detail: { from: "READY", to: "COMPLETED" },
    }));
  });

  it("rejects advance from COMPLETED status", async () => {
    mocks.findUnique.mockResolvedValue({
      status: "COMPLETED",
      voidedAt: null,
      total: 100_000,
      payments: [{ amount: 100_000 }],
    });

    const result = await advanceStatusAction(12);
    expect(result.ok).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("rejects advance when order not found", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const result = await advanceStatusAction(999);
    expect(result.ok).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});