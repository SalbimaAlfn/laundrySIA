"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supplyCreateSchema, supplyPurchaseSchema, supplyUsageSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";
import { postPurchaseEntry, postUsageEntry } from "@/server/accounting/posting";

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

export type UsageFormState = PurchaseFormState;

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

export async function createSupplyUsageAction(
  _previousState: UsageFormState,
  formData: FormData,
): Promise<UsageFormState> {
  const session = await requireRole("MANAGER");
  const parsed = supplyUsageSchema.safeParse({
    supplyId: Number(formData.get("supplyId")),
    quantityHundredths: Number(formData.get("quantity")),
    date: formData.get("date"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  const quantity = parsed.data.quantityHundredths / 100;

  try {
    const movement = await db.$transaction(async (tx) => {
      const supply = await tx.supply.findUnique({
        where: { id: parsed.data.supplyId },
        select: { name: true },
      });
      if (!supply) throw new Error("Supply not found");

      const posted = await postUsageEntry(
        tx,
        {
          id: 0,
          supplyId: parsed.data.supplyId,
          quantity,
          date: parsed.data.date,
        },
        session.id,
      );

      await writeAudit(tx, {
        userId: session.id,
        action: "SUPPLY_USAGE",
        entityType: "SupplyMovement",
        entityId: posted.movementId,
        detail: {
          supplyName: supply.name,
          quantity,
          totalCost: posted.totalCost,
          note: parsed.data.note,
        },
      });

      return {
        id: posted.movementId,
        supplyId: parsed.data.supplyId,
        supplyName: supply.name,
        quantity,
        totalCost: posted.totalCost,
        date: parsed.data.date,
        note: parsed.data.note ?? null,
      };
    });

    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return {
      status: "success",
      movement: {
        ...movement,
        type: "OUT",
        createdById: session.id,
        createdBy: session.name,
      },
    };
  } catch (error) {
    console.error("Failed to create supply usage", error);
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

  const parsed = supplyCreateSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    minQty: Number(formData.get("minQty")) || 0,
  });
  if (!parsed.success) {
    return { status: "invalid", errors: fieldErrorsOf(parsed.error) };
  }

  try {
    await db.$transaction(async (tx) => {
      const created = await tx.supply.create({
        data: { ...parsed.data, stockQty: 0, avgUnitCost: 0 },
        select: { id: true },
      });

      await writeAudit(tx, {
        userId: session.id,
        action: "SUPPLY_CREATE",
        entityType: "Supply",
        entityId: created.id,
        detail: parsed.data,
      });
    });

    revalidatePath("/stock");
    return { status: "success" };
  } catch (error) {
    console.error("Failed to create supply", error);
    return { status: "error" };
  }
}