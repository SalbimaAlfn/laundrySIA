import { businessDate, parseBusinessDate } from "@/lib/dates";
import { formatInvoiceNo } from "@/lib/invoice";
import { validation } from "@/lib/i18n";
import { lineTotal } from "@/lib/money";
import { MAX_MONEY } from "@/lib/limits";
import type { OrderInput } from "@/lib/schemas/order";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { postOrderEntry } from "@/server/accounting/posting";

export type CreatedOrder = {
  id: number;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  total: number;
  note: string | null;
  pickupDate: string;
  items: Array<{
    id: number;
    serviceId: number;
    serviceName: string;
    unit: "KG" | "PIECE";
    unitPrice: number;
    quantity: string;
    lineTotal: number;
  }>;
  payment: { id: number; amount: number; method: "CASH" | "TRANSFER" | "EWALLET" } | null;
};

export class OrderCreationError extends Error {
  constructor(
    readonly field: "customerId" | "items" | "discount" | "paymentAmount",
    message: string,
  ) {
    super(message);
  }
}

function serializeOrder(order: {
  id: number;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  total: number;
  note: string | null;
  pickupDate: Date;
  items: Array<{
    id: number;
    serviceId: number;
    serviceName: string;
    unit: "KG" | "PIECE";
    unitPrice: number;
    quantity: { toString(): string };
    lineTotal: number;
  }>;
  payments: Array<{ id: number; amount: number; method: "CASH" | "TRANSFER" | "EWALLET" }>;
}): CreatedOrder {
  return {
    id: order.id,
    invoiceNo: order.invoiceNo,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    note: order.note,
    pickupDate: businessDate(order.pickupDate),
    items: order.items.map((item) => ({ ...item, quantity: item.quantity.toString() })),
    payment: order.payments[0] ?? null,
  };
}

async function findOrder(tx: Prisma.TransactionClient, id: number) {
  return tx.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { id: "asc" }, select: { id: true, amount: true, method: true } },
    },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === "P2002";
}

class InvoiceCollisionError extends Error {}

/** Creates an order and every related financial record atomically. */
export async function createOrder(
  input: OrderInput,
  userId: number,
  submissionId: string,
): Promise<CreatedOrder> {
  const day = businessDate();
  const idempotencyKey = `order:${userId}:${submissionId}`;

  try {
    return await db.$transaction(async (tx) => {
      const previous = await tx.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (previous?.resultId) {
        const existing = await findOrder(tx, previous.resultId);
        if (existing) return serializeOrder(existing);
      }

      await tx.idempotencyKey.create({
        data: { key: idempotencyKey, action: "CREATE_ORDER", userId },
      });

      const customer = await tx.customer.findFirst({
        where: { id: input.customerId, isActive: true },
        select: { id: true },
      });
      if (!customer) throw new OrderCreationError("customerId", validation.id);

      const serviceIds = [...new Set(input.items.map((item) => item.serviceId))];
      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
      });
      if (services.length !== serviceIds.length) {
        throw new OrderCreationError("items", validation.items);
      }

      const servicesById = new Map(services.map((service) => [service.id, service]));
      const items = input.items.map((item) => {
        const service = servicesById.get(item.serviceId)!;
        const total = lineTotal(service.price, item.quantityHundredths);
        if (!Number.isSafeInteger(total) || total > MAX_MONEY) {
          throw new OrderCreationError("items", validation.amountTooLarge);
        }
        return {
          serviceId: service.id,
          serviceName: service.name,
          unit: service.unit,
          unitPrice: service.price,
          quantity: (item.quantityHundredths / 100).toFixed(2),
          lineTotal: total,
        };
      });

      const subtotal = items.reduce((total, item) => total + item.lineTotal, 0);
      if (!Number.isSafeInteger(subtotal) || subtotal > MAX_MONEY) {
        throw new OrderCreationError("items", validation.amountTooLarge);
      }
      if (input.discount > subtotal) {
        throw new OrderCreationError("discount", validation.discountExceedsSubtotal);
      }

      const total = subtotal - input.discount;
      const paymentAmount =
        input.paymentType === "FULL"
          ? total
          : input.paymentType === "DEPOSIT"
            ? input.paymentAmount!
            : 0;
      if (input.paymentType === "DEPOSIT" && paymentAmount >= total) {
        throw new OrderCreationError("paymentAmount", validation.depositMustBeLess);
      }

      let order: Awaited<ReturnType<typeof tx.order.create>> | undefined;
      for (let invoiceAttempt = 0; invoiceAttempt < 3; invoiceAttempt++) {
        const counter = await tx.invoiceCounter.upsert({
          where: { date: parseBusinessDate(day) },
          create: { date: parseBusinessDate(day), last: 1 },
          update: { last: { increment: 1 } },
        });
        try {
          order = await tx.order.create({
            data: {
              invoiceNo: formatInvoiceNo(day, counter.last),
              customerId: customer.id,
              subtotal,
              discount: input.discount,
              total,
              note: input.note ?? null,
              pickupDate: parseBusinessDate(input.pickupDate),
              createdById: userId,
              items: { create: items },
            },
          });
          break;
        } catch (error) {
          if (!isUniqueViolation(error)) throw error;
          if (invoiceAttempt === 2) throw new InvoiceCollisionError("Invoice allocation failed");
        }
      }
      if (!order) throw new InvoiceCollisionError("Invoice allocation failed");
      const payment =
        paymentAmount > 0
          ? await tx.payment.create({
              data: {
                orderId: order.id,
                amount: paymentAmount,
                method: input.paymentMethod,
                receivedById: userId,
              },
            })
          : null;

      await postOrderEntry(
        tx,
        order,
        payment ? { amount: payment.amount, method: payment.method } : null,
        userId,
      );
      await writeAudit(tx, {
        userId,
        action: "ORDER_CREATE",
        entityType: "Order",
        entityId: order.id,
        detail: { invoiceNo: order.invoiceNo, customerId: customer.id, total },
      });
      await tx.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: { resultType: "Order", resultId: order.id },
      });

      const created = await findOrder(tx, order.id);
      if (!created) throw new Error("Created order could not be loaded");
      return serializeOrder(created);
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const previous = await db.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
        select: { resultId: true },
      });
      if (previous?.resultId) {
        const existing = await db.order.findUnique({
          where: { id: previous.resultId },
          include: {
            items: true,
            payments: { orderBy: { id: "asc" }, select: { id: true, amount: true, method: true } },
          },
        });
        if (existing) return serializeOrder(existing);
      }
    }
    throw error;
  }
}
