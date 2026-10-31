"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/lib/i18n";
import { receivePaymentSchema } from "@/lib/schemas/payment";
import { requireUser } from "@/server/auth";
import { receivePayment, PaymentReceptionError, type ReceivedPayment } from "@/server/payments/receive-payment";

export type ReceivePaymentState = {
  status: "idle" | "success" | "invalid" | "error";
  errors?: Record<string, string>;
  payment?: ReceivedPayment;
};

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

export async function receivePaymentAction(
  _previousState: ReceivePaymentState,
  formData: FormData,
): Promise<ReceivePaymentState> {
  const session = await requireUser();
  const parsed = receivePaymentSchema.safeParse({
    orderId: numberValue(formData.get("orderId")),
    amount: numberValue(formData.get("amount")),
    method: formData.get("method"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return { status: "invalid", errors: fieldErrors(parsed.error) };

  try {
    const payment = await receivePayment(parsed.data, session.id, parsed.data.idempotencyKey);
    revalidatePath(`/orders/${payment.orderId}`);
    revalidatePath("/orders");
    revalidatePath("/counter");
    revalidatePath("/receivables");
    revalidatePath("/dashboard");
    return { status: "success", payment };
  } catch (error) {
    if (error instanceof PaymentReceptionError) {
      return { status: "invalid", errors: { [error.field]: error.message } };
    }
    console.error("Failed to receive payment", error);
    return { status: "error", errors: { form: getDictionary().common.genericError } };
  }
}
