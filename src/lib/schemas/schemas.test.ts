import { describe, expect, it } from "vitest";
import { validation } from "@/lib/i18n";
import {
  customerSchema,
  expenseSchema,
  openingBalanceSchema,
  orderSchema,
  paymentSchema,
  paymentSchemaForBalance,
  serviceSchema,
  shopProfileSchema,
  supplyPurchaseSchema,
  supplyUsageSchema,
  userCreateSchema,
  userUpdateSchema,
  voidOrderSchema,
} from "./index";

type ParseFailure = {
  success: boolean;
  error?: { issues: Array<{ message: string; path: PropertyKey[] }> };
};

function expectFailure(result: ParseFailure, message: string): void {
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.message).toBe(message);
}

describe("customerSchema", () => {
  it("accepts a customer and normalizes the phone", () => {
    const result = customerSchema.safeParse({
      name: "Budi Santoso",
      phone: "+62 812-3456-7890",
      address: "Jl. Melati 3",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("081234567890");
    }
  });

  it("turns an empty optional address into undefined", () => {
    const result = customerSchema.safeParse({ name: "Budi", phone: "081234567890", address: "" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address).toBeUndefined();
    }
  });

  it("rejects a missing phone", () => {
    expectFailure(customerSchema.safeParse({ name: "Budi" }), validation.required);
  });

  it("rejects an invalid phone", () => {
    expectFailure(customerSchema.safeParse({ name: "Budi", phone: "12345" }), validation.phone);
  });

  it("rejects an over-long address", () => {
    expectFailure(
      customerSchema.safeParse({
        name: "Budi",
        phone: "081234567890",
        address: "x".repeat(201),
      }),
      validation.address,
    );
  });
});

describe("orderSchema", () => {
  const validOrder = {
    customerId: 1,
    items: [{ serviceId: 1, quantityHundredths: 500 }],
    discount: 5000,
    note: "",
    pickupDate: "2026-10-10",
    paymentType: "DEPOSIT",
    paymentAmount: 15000,
    paymentMethod: "CASH",
  };

  it("accepts a valid order and applies defaults", () => {
    const result = orderSchema.safeParse(validOrder);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discount).toBe(5000);
      expect(result.data.note).toBeUndefined();
      expect(result.data.paymentMethod).toBe("CASH");
    }
  });

  it("accepts a full payment without an amount (the server computes the total)", () => {
    const result = orderSchema.safeParse({
      customerId: 1,
      items: [{ serviceId: 1, quantityHundredths: 500 }],
      pickupDate: "2026-10-10",
      paymentType: "FULL",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discount).toBe(0);
      expect(result.data.paymentMethod).toBe("CASH");
    }
  });

  it("rejects an order with no items", () => {
    expectFailure(orderSchema.safeParse({ ...validOrder, items: [] }), validation.items);
  });

  it("rejects a zero quantity", () => {
    expectFailure(
      orderSchema.safeParse({
        ...validOrder,
        items: [{ serviceId: 1, quantityHundredths: 0 }],
      }),
      validation.quantity,
    );
  });

  it("rejects a quantity above 999,99", () => {
    expectFailure(
      orderSchema.safeParse({
        ...validOrder,
        items: [{ serviceId: 1, quantityHundredths: 100000 }],
      }),
      validation.quantity,
    );
  });

  it("requires a deposit amount for DEPOSIT", () => {
    const result = orderSchema.safeParse({ ...validOrder, paymentAmount: undefined });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((entry) => entry.path[0] === "paymentAmount");
      expect(issue?.message).toBe(validation.depositAmount);
    }
  });

  it("rejects an amount for LATER", () => {
    const result = orderSchema.safeParse({ ...validOrder, paymentType: "LATER" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((entry) => entry.path[0] === "paymentAmount");
      expect(issue?.message).toBe(validation.laterPayment);
    }
  });

  it("rejects an impossible pickup date", () => {
    expectFailure(
      orderSchema.safeParse({ ...validOrder, pickupDate: "2026-02-30" }),
      validation.date,
    );
  });

  it("rejects a negative discount", () => {
    expectFailure(orderSchema.safeParse({ ...validOrder, discount: -1 }), validation.discount);
  });
});

describe("paymentSchema", () => {
  it("accepts a valid payment", () => {
    expect(paymentSchema.safeParse({ orderId: 1, amount: 25000, method: "CASH" }).success).toBe(
      true,
    );
  });

  it("rejects a zero amount", () => {
    expectFailure(
      paymentSchema.safeParse({ orderId: 1, amount: 0, method: "CASH" }),
      validation.amount,
    );
  });

  it("rejects an unknown method", () => {
    expectFailure(
      paymentSchema.safeParse({ orderId: 1, amount: 25000, method: "CHEQUE" }),
      validation.paymentMethod,
    );
  });

  it("enforces the remaining balance", () => {
    const schema = paymentSchemaForBalance(25000);

    expect(schema.safeParse({ orderId: 1, amount: 25000, method: "CASH" }).success).toBe(true);
    expectFailure(
      schema.safeParse({ orderId: 1, amount: 30000, method: "CASH" }),
      validation.paymentTooMuch,
    );
  });
});

describe("expenseSchema", () => {
  it("accepts a valid expense", () => {
    const result = expenseSchema.safeParse({
      category: "ELECTRICITY_WATER",
      amount: 300000,
      paidFrom: "CASH",
      date: "2026-10-08",
      note: "",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBeUndefined();
  });

  it("rejects a zero amount", () => {
    expectFailure(
      expenseSchema.safeParse({
        category: "RENT",
        amount: 0,
        paidFrom: "BANK",
        date: "2026-10-08",
      }),
      validation.amount,
    );
  });

  it("rejects an unknown category", () => {
    expectFailure(
      expenseSchema.safeParse({
        category: "TAX",
        amount: 1000,
        paidFrom: "CASH",
        date: "2026-10-08",
      }),
      validation.category,
    );
  });
});

describe("supply schemas", () => {
  it("accepts a purchase and a usage", () => {
    expect(
      supplyPurchaseSchema.safeParse({
        supplyId: 1,
        quantityHundredths: 1200,
        totalCost: 120000,
        paidFrom: "CASH",
        date: "2026-10-08",
      }).success,
    ).toBe(true);

    expect(
      supplyUsageSchema.safeParse({
        supplyId: 1,
        quantityHundredths: 200,
        date: "2026-10-08",
      }).success,
    ).toBe(true);
  });

  it("rejects a zero quantity", () => {
    expectFailure(
      supplyUsageSchema.safeParse({ supplyId: 1, quantityHundredths: 0, date: "2026-10-08" }),
      validation.supplyQuantity,
    );
  });

  it("rejects a zero total cost", () => {
    expectFailure(
      supplyPurchaseSchema.safeParse({
        supplyId: 1,
        quantityHundredths: 1200,
        totalCost: 0,
        paidFrom: "CASH",
        date: "2026-10-08",
      }),
      validation.totalCost,
    );
  });
});

describe("serviceSchema", () => {
  it("accepts a valid service and defaults isActive", () => {
    const result = serviceSchema.safeParse({
      name: "Cuci + setrika",
      unit: "KG",
      price: 8000,
      turnaroundDays: 2,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(true);
  });

  it("rejects a zero price", () => {
    expectFailure(
      serviceSchema.safeParse({ name: "Gratis", unit: "KG", price: 0, turnaroundDays: 1 }),
      validation.price,
    );
  });

  it("rejects an unknown unit", () => {
    expectFailure(
      serviceSchema.safeParse({ name: "Cuci", unit: "LITER", price: 8000, turnaroundDays: 1 }),
      validation.unit,
    );
  });

  it("rejects more than 30 turnaround days", () => {
    expectFailure(
      serviceSchema.safeParse({ name: "Cuci", unit: "KG", price: 8000, turnaroundDays: 31 }),
      validation.turnaround,
    );
  });
});

describe("user schemas", () => {
  const validUser = {
    name: "Manajer Baru",
    username: "Manager.Baru",
    password: "Rahasia12345",
    role: "MANAGER",
  };

  it("accepts a user and lowercases the username", () => {
    const result = userCreateSchema.safeParse(validUser);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("manager.baru");
      expect(result.data.isActive).toBe(true);
    }
  });

  it("rejects a short password", () => {
    expectFailure(
      userCreateSchema.safeParse({ ...validUser, password: "Rahasia1" }),
      validation.password,
    );
  });

  it("rejects a password without a digit", () => {
    expectFailure(
      userCreateSchema.safeParse({ ...validUser, password: "RahasiaPanjang" }),
      validation.password,
    );
  });

  it("rejects a username with spaces", () => {
    expectFailure(
      userCreateSchema.safeParse({ ...validUser, username: "manager baru" }),
      validation.username,
    );
  });

  it("allows an edit without a password", () => {
    expect(
      userUpdateSchema.safeParse({
        name: "Kasir",
        username: "kasir",
        role: "CASHIER",
      }).success,
    ).toBe(true);
  });
});

describe("settings schemas", () => {
  it("accepts a shop profile and normalizes its phone", () => {
    const result = shopProfileSchema.safeParse({
      name: "Sari Laundry",
      address: "Jl. Mawar 12",
      phone: "+62 812-3456-7890",
      receiptFooter: "Terima kasih.",
      pickupRules: "Tunjukkan struk.",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("081234567890");
  });

  it("rejects an invalid shop phone", () => {
    expectFailure(
      shopProfileSchema.safeParse({
        name: "Sari Laundry",
        address: "",
        phone: "123",
        receiptFooter: "",
        pickupRules: "",
      }),
      validation.phone,
    );
  });

  it("accepts an opening balance", () => {
    expect(
      openingBalanceSchema.safeParse({
        date: "2026-10-01",
        cash: 1000000,
        bank: 0,
        equipment: 0,
      }).success,
    ).toBe(true);
  });

  it("rejects an all-zero opening balance", () => {
    expectFailure(
      openingBalanceSchema.safeParse({ date: "2026-10-01", cash: 0, bank: 0, equipment: 0 }),
      validation.openingAmount,
    );
  });

  it("rejects a negative opening amount", () => {
    expectFailure(
      openingBalanceSchema.safeParse({ date: "2026-10-01", cash: -1, bank: 0, equipment: 0 }),
      validation.amountNegative,
    );
  });
});

describe("voidOrderSchema", () => {
  it("accepts a valid reason", () => {
    expect(
      voidOrderSchema.safeParse({
        orderId: 1,
        reason: "Pelanggan salah menyerahkan pakaian.",
      }).success,
    ).toBe(true);
  });

  it("rejects a too-short reason", () => {
    expectFailure(voidOrderSchema.safeParse({ orderId: 1, reason: "sala" }), validation.voidReason);
  });
});
