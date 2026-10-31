import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn() }));

vi.mock("@/server/db", () => ({ db: { order: mocks } }));

import { getCounterOrders, getOrders, getReceivables } from "./queries";

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

  it("filters void orders", async () => {
    await getOrders({ status: "VOID" });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { voidedAt: { not: null } } }),
    );
  });

  it("loads non-void counter cards with derived balances", async () => {
    mocks.findMany.mockResolvedValueOnce([
      {
        id: 1,
        invoiceNo: "INV-1",
        status: "READY",
        total: 40_000,
        customer: { name: "Rina" },
        items: [{ serviceName: "Wash", quantity: { toString: () => "5.00" }, unit: "KG" }],
        payments: [{ amount: 15_000 }],
      },
    ]);

    await expect(getCounterOrders()).resolves.toEqual([
      {
        id: 1,
        invoiceNo: "INV-1",
        status: "READY",
        customerName: "Rina",
        total: 40_000,
        paid: 15_000,
        balance: 25_000,
        items: [{ serviceName: "Wash", quantity: "5.00", unit: "KG" }],
      },
    ]);
    expect(mocks.findMany.mock.calls[0]?.[0]).toMatchObject({ where: { voidedAt: null } });
  });

  it("lists only open balances and totals them", async () => {
    mocks.findMany.mockResolvedValueOnce([
      {
        id: 1,
        invoiceNo: "INV-1",
        total: 40_000,
        createdAt: new Date(),
        customer: { name: "Rina" },
        payments: [{ amount: 15_000 }],
      },
      {
        id: 2,
        invoiceNo: "INV-2",
        total: 20_000,
        createdAt: new Date(),
        customer: { name: "Budi" },
        payments: [{ amount: 20_000 }],
      },
    ]);

    await expect(getReceivables()).resolves.toMatchObject({
      orders: [{ id: 1, invoiceNo: "INV-1", customerName: "Rina", balance: 25_000, daysOpen: 0 }],
      total: 25_000,
    });
    expect(mocks.findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { voidedAt: null },
      orderBy: { createdAt: "asc" },
    });
  });
});
