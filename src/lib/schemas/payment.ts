import { z } from "zod";
import { validation } from "@/lib/i18n";
import { idSchema, paymentMethodSchema, positiveMoneySchema } from "./common";

export const paymentSchema = z.object({
  orderId: idSchema,
  amount: positiveMoneySchema,
  method: paymentMethodSchema,
});

export const receivePaymentSchema = paymentSchema.extend({
  idempotencyKey: z.uuid({ error: validation.id }),
});

/**
 * The remaining balance comes from the order and its payments, so the caller
 * supplies it after locking the row. This keeps the overpayment rule in one
 * place and testable without a database.
 */
export function paymentSchemaForBalance(balance: number) {
  return paymentSchema.refine((value) => value.amount <= balance, {
    error: validation.paymentTooMuch,
    path: ["amount"],
  });
}

export type PaymentInput = z.infer<typeof paymentSchema>;
