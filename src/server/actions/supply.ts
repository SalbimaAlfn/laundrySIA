"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supplyPurchaseSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { postPurchaseEntry } from "@/server/accounting/posting";

export type SupplyRecord = {
  id: number;
  name: string;
  unit: string;
  stockQty: number;
  minQty: number;
  avgUnitCost: number;
};

export type SupplyMovementRecord = {
  id: number;
  supplyId: number;
  supplyName: string;
  type: "IN" | "OUT";
  quantity: number;
  totalCost: number;
  date: string;
  note: string | null;
  createdById: number;
  createdBy: string;
};

export type PurchaseFormState = {
  status: "idle" | "success" | "invalid" | "error";
  errors?: Record<string, string>;
  movement?: SupplyMovementRecord;
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

function readForm(formData: FormData) {
  return supplyPurchaseSchema.safeParse({
    supplyId: Number(formData.get("supplyId")),
    quantityHundredths: Number(formData.get("quantity")),
    totalCost: Number(formData.get("totalCost")),
    paidFrom: formData.get("paidFrom"),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });
}

export async function createSupplyPurchaseAction(
  _previousState: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  const session = await requireRole("MANAGER");
  const parsed = readForm(formData);

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  const quantity = parsed.data.quantityHundredths / 100; // Convert hundredths to actual quantity

  try {
    const movement = await db.$transaction(async (tx) => {
      const created = await tx.supplyMovement.create({
        data: {
          supplyId: parsed.data.supplyId,
          type: "IN",
          quantity,
          totalCost: parsed.data.totalCost,
          date: new Date(parsed.data.date),
          note: parsed.data.note,
          createdById: session.id,
        },
        select: {
          id: true,
          supplyId: true,
          type: true,
          quantity: true,
          totalCost: true,
          date: true,
          note: true,
          createdById: true,
        },
      });

      const supply = await tx.supply.findUnique({
        where: { id: parsed.data.supplyId },
        select: { name: true },
      });

      await postPurchaseEntry(tx, {
        id: created.id,
        supplyId: parsed.data.supplyId,
        quantity,
        totalCost: parsed.data.totalCost,
        date: parsed.data.date,
        paidFrom: parsed.data.paidFrom,
      }, session.id);

      await writeAudit(tx, {
        userId: session.id,
        action: "SUPPLY_PURCHASE",
        entityType: "SupplyMovement",
        entityId: created.id,
        detail: {
          supplyName: supply?.name,
          quantity,
          totalCost: parsed.data.totalCost,
          paidFrom: parsed.data.paidFrom,
        },
      });

      return {
        id: created.id,
        supplyId: created.supplyId,
        type: created.type,
        quantity: Number(created.quantity),
        totalCost: created.totalCost,
        date: created.date,
        note: created.note,
        createdById: created.createdById,
        supplyName: supply?.name ?? "Unknown",
      };
    });

    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return {
      status: "success",
      movement: {
        id: movement.id,
        supplyId: movement.supplyId,
        supplyName: movement.supplyName,
        type: movement.type as "IN" | "OUT",
        quantity: movement.quantity,
        totalCost: movement.totalCost,
        date: movement.date.toISOString().slice(0, 10),
        note: movement.note,
        createdById: movement.createdById,
        createdBy: session.name,
      },
    };
  } catch (error) {
    console.error("Failed to create supply purchase", error);
    return { status: "error" };
  }
}

export async function getSupplies(): Promise<SupplyRecord[]> {
  const supplies = await db.supply.findMany({
    orderBy: { name: "asc" },
  });

  return supplies.map((s) => ({
    id: s.id,
    name: s.name,
    unit: s.unit,
    stockQty: Number(s.stockQty),
    minQty: Number(s.minQty),
    avgUnitCost: s.avgUnitCost,
  }));
}

export async function getSupplyMovements(): Promise<SupplyMovementRecord[]> {
  const movements = await db.supplyMovement.findMany({
    include: {
      supply: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return movements.map((m) => ({
    id: m.id,
    supplyId: m.supplyId,
    supplyName: m.supply.name,
    type: m.type as "IN" | "OUT",
    quantity: Number(m.quantity),
    totalCost: m.totalCost,
    date: m.date.toISOString().slice(0, 10),
    note: m.note,
    createdById: m.createdById,
    createdBy: m.createdBy.name,
  }));
}

export async function createSupplyAction(
  _previousState: { status: "idle" | "success" | "invalid" | "error"; errors?: Record<string, string> },
  formData: FormData,
): Promise<{ status: "success" | "invalid" | "error"; errors?: Record<string, string> }> {
  const session = await requireRole("MANAGER");

  const name = formData.get("name")?.toString().trim();
  const unit = formData.get("unit")?.toString().trim();
  const minQty = Number(formData.get("minQty")) || 0;

  if (!name || name.length < 2 || name.length > 80) {
    return { status: "invalid", errors: { name: "Name must be 2-80 characters" } };
  }
  if (!unit || unit.length < 1 || unit.length > 20) {
    return { status: "invalid", errors: { unit: "Unit is required" } };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.supply.create({
        data: { name, unit, minQty, stockQty: 0, avgUnitCost: 0 },
      });

      await writeAudit(tx, {
        userId: session.id,
        action: "SUPPLY_CREATE",
        entityType: "Supply",
        entityId: 0,
        detail: { name, unit, minQty },
      });
    });

    revalidatePath("/stock");
    return { status: "success" };
  } catch (error) {
    console.error("Failed to create supply", error);
    return { status: "error" };
  }
}