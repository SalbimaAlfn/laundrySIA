"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customerSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole, requireUser } from "@/server/auth";
import { db } from "@/server/db";

export type CustomerRecord = {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  isActive: boolean;
};

export type CustomerFormState = {
  status: "idle" | "success" | "invalid" | "duplicate" | "error";
  errors?: Record<string, string>;
  customer?: CustomerRecord;
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

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === "P2002";
}

function toRecord(customer: CustomerRecord): CustomerRecord {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    isActive: customer.isActive,
  };
}

function readForm(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address") || undefined,
  });
}

export async function createCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const session = await requireUser();
  const parsed = readForm(formData);

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    const customer = await db.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          address: parsed.data.address ?? null,
        },
      });
      await writeAudit(tx, {
        userId: session.id,
        action: "CUSTOMER_CREATE",
        entityType: "Customer",
        entityId: created.id,
        detail: { name: created.name, phone: created.phone },
      });
      return created;
    });

    revalidatePath("/customers");
    revalidatePath("/orders/new");
    return { status: "success", customer: toRecord(customer) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "duplicate" };
    }
    console.error("Failed to create customer", error);
    return { status: "error" };
  }
}

export async function updateCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const session = await requireUser();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error" };
  }

  const parsed = readForm(formData);
  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    const customer = await db.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id },
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          address: parsed.data.address ?? null,
        },
      });
      await writeAudit(tx, {
        userId: session.id,
        action: "CUSTOMER_UPDATE",
        entityType: "Customer",
        entityId: updated.id,
        detail: { name: updated.name, phone: updated.phone },
      });
      return updated;
    });

    revalidatePath("/customers");
    revalidatePath("/orders/new");
    return { status: "success", customer: toRecord(customer) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "duplicate" };
    }
    console.error("Failed to update customer", error);
    return { status: "error" };
  }
}

export async function toggleCustomerActiveAction(formData: FormData): Promise<void> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const isActive = formData.get("isActive") === "true";

  await db.$transaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id },
      data: { isActive },
    });
    await writeAudit(tx, {
      userId: session.id,
      action: isActive ? "CUSTOMER_ACTIVATE" : "CUSTOMER_DEACTIVATE",
      entityType: "Customer",
      entityId: customer.id,
      detail: { name: customer.name, phone: customer.phone },
    });
  });

  revalidatePath("/customers");
  revalidatePath("/orders/new");
}
