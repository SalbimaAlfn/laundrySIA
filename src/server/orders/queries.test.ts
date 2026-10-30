import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));

vi.mock("@/server/db", () => ({ db: { order: mocks } }));

import { getOrders } from "./queries";

describe("getOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
  });

  it("filters payment state before pagination and count", async () => {
    mocks.findMany
      .mockResolvedValueOnce([
        { id: 1, total: 100, payments: [] },
        { id: 2, total: 100, payments: [{ amount: 40 }] },
        { id: 3, total: 100, payments: [{ amount: 100 }] },
      ])
      .mockResolvedValueOnce([]);

    await getOrders({ paymentState: "partial", page: 2 });

    expect(mocks.findMany.mock.calls[0]?.[0]).toMatchObject({
      select: { id: true, total: true, payments: { select: { amount: true } } },
    });
    expect(mocks.findMany.mock.calls[1]?.[0]).toMatchObject({
      where: { id: { in: [2] } },
      skip: 25,
      take: 25,
    });
    expect(mocks.count).toHaveBeenCalledWith({ where: { id: { in: [2] } } });
  });

  it("treats zero-total orders as paid", async () => {
    mocks.findMany.mockResolvedValueOnce([{ id: 7, total: 0, payments: [] }]);

    await getOrders({ paymentState: "paid" });

    expect(mocks.findMany.mock.calls[1]?.[0]).toMatchObject({ where: { id: { in: [7] } } });
  });
});
