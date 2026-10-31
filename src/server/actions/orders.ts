"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary, validation } from "@/lib/i18n";
import { orderSchema } from "@/lib/schemas/order";
import { requireRole, requireUser } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { db } from "@/server/db";
import { createOrder, OrderCreationError, type CreatedOrder } from "@/server/orders/create-order";
import type { Prisma } from "@/generated/prisma/client";

const statuses = ["RECEIVED", "WASHING", "DRYING_IRONING", "READY", "COMPLETED"] as const;

async function changeOrderStatus(
  id: number,
  direction: 1 | -1,
  overrideNote?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = direction > 0 ? await requireUser() : await requireRole("MANAGER");
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Invalid order id" };

  const changed = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      select: {
        status: true,
        voidedAt: true,
        total: true,
        payments: { select: { amount: true } },
      },
    });
    if (!order) return false;

    const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, order.total - paid);

    const index = statuses.indexOf(order.status);
    const nextStatus = statuses[index + direction];
    if (order.voidedAt || index < 0 || !nextStatus || (direction < 0 && order.status === "COMPLETED")) {
      return false;
    }

    // Block advancing to COMPLETED if balance remains
    if (direction > 0 && nextStatus === "COMPLETED" && balance > 0) {
      if (session.role !== "MANAGER") {
        return { ok: false, error: "managerRequired" };
      }
      if (!overrideNote || overrideNote.trim() === "") {
        return { ok: false, error: "noteRequired" };
      }
      // Manager override with note - allowed
    }

    const result = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: nextStatus },
    });
    if (!result.count) return false;

    const action = direction > 0 ? "ORDER_STATUS_ADVANCE" : "ORDER_STATUS_REVERSE";
    const detail: Record<string, unknown> = { from: order.status, to: nextStatus };
    if (direction > 0 && nextStatus === "COMPLETED" && balance > 0 && overrideNote) {
      detail.overrideNote = overrideNote.trim();
      detail.overrideBalance = balance;
    }
    await writeAudit(tx, {
      userId: session.id,
      action,
      entityType: "Order",
      entityId: id,
      detail: detail as Prisma.InputJsonValue,
    });
    return true;
  });

  if (changed === true) {
    revalidatePath(`/orders/${id}`);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  if (changed && typeof changed === "object" && "error" in changed) {
    return { ok: false, error: changed.error };
  }
  return { ok: false, error: "Status change failed" };
}

export async function advanceStatusAction(id: number, overrideNote?: string): Promise<{ ok: boolean; error?: string }> {
  return changeOrderStatus(id, 1, overrideNote);
}

export async function reverseStatusAction(id: number): Promise<{ ok: boolean; error?: string }> {
  return changeOrderStatus(id, -1);
}

export type CreateOrderState = {
  status: "idle" | "success" | "invalid" | "error";
  errors?: Record<string, string>;
  order?: CreatedOrder;
};

const submissionSchema = orderSchema.extend({ idempotencyKey: z.uuid({ error: validation.id }) });

function numberValue(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function readForm(formData: FormData) {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? ""));
  } catch {
    items = undefined;
  }

  return submissionSchema.safeParse({
    customerId: numberValue(formData.get("customerId")),
    items,
    discount: numberValue(formData.get("discount")) ?? 0,
    note: formData.get("note") ?? undefined,
    pickupDate: formData.get("pickupDate"),
    paymentType: formData.get("paymentType"),
    paymentAmount: numberValue(formData.get("paymentAmount")),
    paymentMethod: formData.get("paymentMethod") ?? undefined,
    idempotencyKey: formData.get("idempotencyKey"),
  });
}

export async function createOrderAction(
  _previousState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const session = await requireUser();
  const parsed = readForm(formData);
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

  try {
    const order = await createOrder(parsed.data, session.id, parsed.data.idempotencyKey);
    revalidatePath("/orders");
    revalidatePath("/counter");
    revalidatePath("/dashboard");
    revalidatePath("/receivables");
    return { status: "success", order };
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return { status: "invalid", errors: { [error.field]: error.message } };
    }
    console.error("Failed to create order", error);
    return { status: "error", errors: { form: getDictionary().common.genericError } };
  }
}
