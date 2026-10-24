"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serviceSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";

export type ServiceRecord = {
  id: number;
  name: string;
  unit: "KG" | "PIECE";
  price: number;
  turnaroundDays: number;
  isActive: boolean;
};

export type ServiceFormState = {
  status: "idle" | "success" | "invalid" | "duplicate" | "error";
  errors?: Record<string, string>;
  service?: ServiceRecord;
  priceChanged?: boolean;
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

function toRecord(service: ServiceRecord): ServiceRecord {
  return {
    id: service.id,
    name: service.name,
    unit: service.unit,
    price: service.price,
    turnaroundDays: service.turnaroundDays,
    isActive: service.isActive,
  };
}

function readForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    price: Number(formData.get("price")),
    turnaroundDays: Number(formData.get("turnaroundDays")),
    isActive: formData.has("isActive"),
  });
}

export async function createServiceAction(
  _previousState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const session = await requireRole("MANAGER");
  const parsed = readForm(formData);

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    const service = await db.$transaction(async (tx) => {
      const created = await tx.service.create({ data: parsed.data });
      await writeAudit(tx, {
        userId: session.id,
        action: "SERVICE_CREATE",
        entityType: "Service",
        entityId: created.id,
        detail: { name: created.name, price: created.price },
      });
      return created;
    });

    revalidatePath("/settings/services");
    revalidatePath("/orders/new");
    return { status: "success", service: toRecord(service) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "duplicate" };
    }
    console.error("Failed to create service", error);
    return { status: "error" };
  }
}

export async function updateServiceAction(
  _previousState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "error" };
  }

  const parsed = readForm(formData);
  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.service.findUnique({ where: { id } });
      if (!existing) throw new Error("Service not found");

      const updated = await tx.service.update({
        where: { id },
        data: parsed.data,
      });

      // A price change is its own audit row so the old and new price are kept
      // together. Existing order lines keep the price they were sold at.
      if (existing.price !== updated.price) {
        await writeAudit(tx, {
          userId: session.id,
          action: "SERVICE_PRICE_CHANGE",
          entityType: "Service",
          entityId: updated.id,
          detail: { oldPrice: existing.price, newPrice: updated.price },
        });
      }

      await writeAudit(tx, {
        userId: session.id,
        action: "SERVICE_UPDATE",
        entityType: "Service",
        entityId: updated.id,
        detail: { name: updated.name, price: updated.price, isActive: updated.isActive },
      });

      return { service: updated, priceChanged: existing.price !== updated.price };
    });

    revalidatePath("/settings/services");
    revalidatePath("/orders/new");
    return {
      status: "success",
      service: toRecord(result.service),
      priceChanged: result.priceChanged,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { status: "duplicate" };
    }
    console.error("Failed to update service", error);
    return { status: "error" };
  }
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  const session = await requireRole("MANAGER");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const isActive = formData.get("isActive") === "true";

  await db.$transaction(async (tx) => {
    const service = await tx.service.update({
      where: { id },
      data: { isActive },
    });
    await writeAudit(tx, {
      userId: session.id,
      action: isActive ? "SERVICE_ACTIVATE" : "SERVICE_DEACTIVATE",
      entityType: "Service",
      entityId: service.id,
      detail: { name: service.name },
    });
  });

  revalidatePath("/settings/services");
  revalidatePath("/orders/new");
}
