import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const create = vi.fn();
  return {
    create,
    writeAudit: vi.fn(),
    revalidatePath: vi.fn(),
    tx: { customer: { create } },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth", () => ({ requireUser: async () => ({ id: 7 }) }));
vi.mock("@/server/audit", () => ({ writeAudit: mocks.writeAudit }));
vi.mock("@/server/db", () => ({
  db: { $transaction: (callback: (tx: never) => unknown) => callback(mocks.tx as never) },
}));

import { createCustomerAction, type CustomerFormState } from "./customers";

const idleState: CustomerFormState = { status: "idle" };

function customerForm(phone: string): FormData {
  const data = new FormData();
  data.set("name", "Budi Santoso");
  data.set("phone", phone);
  return data;
}

describe("createCustomerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue({
      id: 4,
      name: "Budi Santoso",
      phone: "081234567890",
      address: null,
      isActive: true,
    });
    mocks.writeAudit.mockResolvedValue(undefined);
  });

  it("stores normalized phone numbers", async () => {
    const result = await createCustomerAction(idleState, customerForm("+62 812-3456-7890"));

    expect(mocks.create).toHaveBeenCalledWith({
      data: { name: "Budi Santoso", phone: "081234567890", address: null },
    });
    expect(result).toMatchObject({ status: "success", customer: { phone: "081234567890" } });
    expect(mocks.writeAudit).toHaveBeenCalled();
  });

  it("returns the duplicate result for an existing normalized phone", async () => {
    mocks.create.mockRejectedValue({ code: "P2002" });

    expect(await createCustomerAction(idleState, customerForm("081234567890"))).toEqual({
      status: "duplicate",
    });
    expect(mocks.writeAudit).not.toHaveBeenCalled();
  });
});
