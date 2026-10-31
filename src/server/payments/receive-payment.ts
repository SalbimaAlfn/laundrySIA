import type { PaymentInput } from "@/lib/schemas/payment";
import { paymentSchemaForBalance } from "@/lib/schemas/payment";
import { validation } from "@/lib/i18n";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { postPaymentEntry } from "@/server/accounting/posting";

export type ReceivedPayment = {
  id: number;
  orderId: number;
  amount: number;
  method: "CASH" | "TRANSFER" | "EWALLET";
  paidAt: string;
  balance: number;
};

export class PaymentReceptionError extends Error {
  constructor(readonly field: "orderId" | "amount" | "method", message: string) {
    super(message);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === "P2002";
}

async function orderBalance(tx: Prisma.TransactionClient, orderId: number, total: number) {
  const payments = await tx.$queryRaw<Array<{ amount: number }>>`
    SELECT amount FROM payments WHERE orderId = ${orderId} FOR UPDATE
  `;
  return Math.max(0, total - payments.reduce((sum, payment) => sum + payment.amount, 0));
}

function serializePayment(
  payment: { id: number; orderId: number; amount: number; method: ReceivedPayment["method"]; paidAt: Date },
  balance: number,
): ReceivedPayment {
  return { ...payment, paidAt: payment.paidAt.toISOString(), balance };
}

export async function receivePayment(
  input: PaymentInput,
  userId: number,
  submissionId: string,
): Promise<ReceivedPayment> {
  const idempotencyKey = `payment:${userId}:${submissionId}`;

  try {
    return await db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM orders WHERE id = ${input.orderId} FOR UPDATE
      `;
      if (!locked.length) throw new PaymentReceptionError("orderId", validation.id);

      const previous = await tx.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (previous?.resultId) {
        const existing = await tx.payment.findUnique({ where: { id: previous.resultId } });
        if (existing) {
          if (existing.orderId !== input.orderId || existing.amount !== input.amount || existing.method !== input.method) {
            throw new PaymentReceptionError("amount", validation.id);
          }
          const order = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, select: { total: true } });
          return serializePayment(existing, await orderBalance(tx, input.orderId, order.total));
        }
      }

      const order = await tx.order.findUniqueOrThrow({
        where: { id: input.orderId },
        select: { total: true, voidedAt: true },
      });
      if (order.voidedAt) throw new PaymentReceptionError("orderId", validation.paymentVoided);

      const balance = await orderBalance(tx, input.orderId, order.total);
      const parsed = paymentSchemaForBalance(balance).safeParse(input);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const field = issue?.path[0] === "amount" ? "amount" : "orderId";
        throw new PaymentReceptionError(field, issue?.message ?? validation.id);
      }

      await tx.idempotencyKey.create({
        data: { key: idempotencyKey, action: "RECEIVE_PAYMENT", userId },
      });
      const payment = await tx.payment.create({
        data: { ...parsed.data, receivedById: userId },
      });
      await postPaymentEntry(tx, payment, userId);
      await writeAudit(tx, {
        userId,
        action: "PAYMENT_RECEIVE",
        entityType: "Payment",
        entityId: payment.id,
        detail: { orderId: payment.orderId, amount: payment.amount, method: payment.method },
      });
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: { resultType: "Payment", resultId: payment.id },
      });

      return serializePayment(payment, balance - payment.amount);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const previous = await db.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
        select: { resultId: true },
      });
      if (previous?.resultId) {
        const payment = await db.payment.findUnique({ where: { id: previous.resultId } });
        if (payment) {
          if (payment.orderId !== input.orderId || payment.amount !== input.amount || payment.method !== input.method) {
            throw new PaymentReceptionError("amount", validation.id);
          }
          const order = await db.order.findUniqueOrThrow({ where: { id: payment.orderId }, select: { total: true } });
          const aggregate = await db.payment.aggregate({ where: { orderId: payment.orderId }, _sum: { amount: true } });
          return serializePayment(payment, Math.max(0, order.total - (aggregate._sum.amount ?? 0)));
        }
      }
    }
    throw error;
  }
}
