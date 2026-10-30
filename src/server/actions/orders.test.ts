import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  return {
    findUnique,
    updateMany,
    writeAudit: vi.fn(),
    revalidatePath: vi.fn(),
    tx: { order: { findUnique, updateMany } },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({ requireUser: async () => ({ id: 42 }) }));
vi.mock("@/server/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/server/db", () => ({
  db: { $transaction: (callback: (tx: never) => unknown) => callback(mocks.tx as never) },
}));

import { advanceStatusAction, reverseStatusAction } from "./orders";

describe("order status actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue({ status: "RECEIVED" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.writeAudit.mockResolvedValue(undefined);
  });

  it("advances one step and audits the transition", async () => {
    expect(await advanceStatusAction(12)).toBe(true);
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
    mocks.findUnique.mockResolvedValue({ status: "READY" });

    expect(await reverseStatusAction(12)).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 12, status: "READY" },
      data: { status: "DRYING_IRONING" },
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "ORDER_STATUS_REVERSE",
      detail: { from: "READY", to: "DRYING_IRONING" },
    }));
  });

  it("refuses a stale update without writing an audit", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    expect(await reverseStatusAction(12)).toBe(false);
    expect(mocks.writeAudit).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects terminal and invalid transitions", async () => {
    mocks.findUnique.mockResolvedValue({ status: "COMPLETED" });
    expect(await advanceStatusAction(12)).toBe(false);
    expect(await reverseStatusAction(0)).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
