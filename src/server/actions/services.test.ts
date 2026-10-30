import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const create = vi.fn();
  const findUnique = vi.fn();
  const update = vi.fn();
  return {
    create,
    findUnique,
    update,
    requireRole: vi.fn(),
    writeAudit: vi.fn(),
    revalidatePath: vi.fn(),
    tx: { service: { create, findUnique, update } },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/server/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/server/db", () => ({
  db: { $transaction: (callback: (tx: never) => unknown) => callback(mocks.tx as never) },
}));

import {
  createServiceAction,
  toggleServiceActiveAction,
  updateServiceAction,
  type ServiceFormState,
} from "./services";

const idleState: ServiceFormState = { status: "idle" };

function serviceForm(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  data.set("name", "Wash and iron");
  data.set("unit", "KG");
  data.set("price", "9000");
  data.set("turnaroundDays", "1");
  data.set("isActive", "on");
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

describe("service actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({ id: 5 });
    mocks.writeAudit.mockResolvedValue(undefined);
  });

  it("requires a manager before creating a service", async () => {
    mocks.requireRole.mockRejectedValueOnce(new Error("manager only"));

    await expect(createServiceAction(idleState, serviceForm())).rejects.toThrow("manager only");
    expect(mocks.requireRole).toHaveBeenCalledWith("MANAGER");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("audits a price change with old and new prices in the transaction", async () => {
    mocks.findUnique.mockResolvedValue({ id: 9, price: 8000 });
    mocks.update.mockResolvedValue({
      id: 9,
      name: "Wash and iron",
      unit: "KG",
      price: 9000,
      turnaroundDays: 1,
      isActive: true,
    });

    const result = await updateServiceAction(idleState, serviceForm({ id: "9" }));

    expect(result).toMatchObject({ status: "success", priceChanged: true });
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: "SERVICE_PRICE_CHANGE",
      entityType: "Service",
      entityId: 9,
      detail: { oldPrice: 8000, newPrice: 9000 },
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/orders/new");
  });

  it("rejects malformed activation values without updating", async () => {
    const data = new FormData();
    data.set("id", "9");
    data.set("isActive", "yes");

    expect(await toggleServiceActiveAction(data)).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });
});
