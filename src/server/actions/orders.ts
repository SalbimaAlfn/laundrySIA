"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary, validation } from "@/lib/i18n";
import { orderSchema } from "@/lib/schemas/order";
import { requireUser } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { db } from "@/server/db";
import { createOrder, OrderCreationError, type CreatedOrder } from "@/server/orders/create-order";

const statuses = ["RECEIVED", "WASHING", "DRYING_IRONING", "READY", "COMPLETED"] as const;

async function changeOrderStatus(id: number, direction: 1 | -1): Promise<boolean> {
  const session = await requireUser();
  if (!Number.isInteger(id) || id <= 0) return false;

  const changed = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, select: { status: true } });
    if (!order) return false;
    const index = statuses.indexOf(order.status);
    const nextStatus = statuses[index + direction];
    if (index < 0 || !nextStatus || (direction < 0 && order.status === "COMPLETED")) return false;

    const result = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: nextStatus } });
    if (!result.count) return false;
    await writeAudit(tx, {
      userId: session.id,
      action: direction > 0 ? "ORDER_STATUS_ADVANCE" : "ORDER_STATUS_REVERSE",
      entityType: "Order",
      entityId: id,
      detail: { from: order.status, to: nextStatus },
    });
    return true;
  });

  if (changed) {
    revalidatePath(`/orders/${id}`);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
  }
  return changed;
}

export async function advanceStatusAction(id: number): Promise<boolean> {
  return changeOrderStatus(id, 1);
}

export async function reverseStatusAction(id: number): Promise<boolean> {
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
