import { parseBusinessDate } from "@/lib/dates";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type OrderSummary = {
  id: number;
  invoiceNo: string;
  status: "RECEIVED" | "WASHING" | "DRYING_IRONING" | "READY" | "COMPLETED" | "VOID";
  customerName: string;
  total: number;
  paid: number;
  balance: number;
  createdAt: string;
  pickupDate: string;
  itemCount: number;
};

export type OrderFilters = {
  status?: string;
  date?: string;
  customer?: string;
  invoice?: string;
  paymentState?: "unpaid" | "partial" | "paid";
  page?: number;
};

const PAGE_SIZE = 25;
const ORDER_STATUSES = ["RECEIVED", "WASHING", "DRYING_IRONING", "READY", "COMPLETED"] as const;

function buildWhereClause(filters: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status && ORDER_STATUSES.includes(filters.status as (typeof ORDER_STATUSES)[number])) {
    where.status = filters.status as (typeof ORDER_STATUSES)[number];
  }

  if (filters.date) {
    const startOfDay = parseBusinessDate(filters.date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    where.createdAt = {
      gte: startOfDay,
      lt: endOfDay,
    };
  }

  if (filters.customer) {
    const digits = filters.customer.replace(/\D/g, "");
    where.customer = {
      OR: [
        { name: { contains: filters.customer } },
        ...(digits.length > 0 ? [{ phone: { contains: digits } }] : []),
      ],
    };
  }

  if (filters.invoice) {
    where.invoiceNo = { contains: filters.invoice };
  }

  return where;
}

export async function getOrders(filters: OrderFilters): Promise<{
  orders: OrderSummary[];
  total: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where = buildWhereClause(filters);

  if (filters.paymentState) {
    // shortcut: this loads matching payment totals in memory; use SQL aggregation if order volume grows.
    const candidates = await db.order.findMany({
      where,
      select: { id: true, total: true, payments: { select: { amount: true } } },
    });
    const matchingIds = candidates
      .filter((order) => {
        const paid = order.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const balance = Math.max(0, order.total - paid);
        return filters.paymentState === "paid"
          ? balance === 0
          : filters.paymentState === "unpaid"
            ? paid === 0
            : paid > 0 && balance > 0;
      })
      .map((order) => order.id);
    where.id = { in: matchingIds };
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        total: true,
        createdAt: true,
        pickupDate: true,
        customer: { select: { name: true } },
        items: { select: { id: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  const ordersWithPayment = orders.map((order) => {
    const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      id: order.id,
      invoiceNo: order.invoiceNo,
      status: order.status,
      customerName: order.customer.name,
      total: order.total,
      paid,
      balance: Math.max(0, order.total - paid),
      createdAt: order.createdAt.toISOString(),
      pickupDate: order.pickupDate.toISOString().slice(0, 10),
      itemCount: order.items.length,
    };
  });

  return {
    orders: ordersWithPayment,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getOrderDetail(id: number) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      createdBy: { select: { name: true } },
      items: {
        include: { service: { select: { name: true } } },
      },
      payments: {
        orderBy: { id: "asc" },
        include: { receivedBy: { select: { name: true } } },
      },
      voidedBy: { select: { name: true } },
    },
  });

  if (!order) return null;

  const paid = order.payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    id: order.id,
    invoiceNo: order.invoiceNo,
    status: order.status,
    customer: order.customer,
    total: order.total,
    paid,
    balance: Math.max(0, order.total - paid),
    subtotal: order.subtotal,
    discount: order.discount,
    note: order.note,
    pickupDate: order.pickupDate.toISOString().slice(0, 10),
    createdAt: order.createdAt.toISOString(),
    createdBy: order.createdBy.name,
    items: order.items.map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      unit: item.unit,
      unitPrice: item.unitPrice,
      quantity: item.quantity.toString(),
      lineTotal: item.lineTotal,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      receivedBy: p.receivedBy.name,
    })),
    voidedAt: order.voidedAt?.toISOString(),
    voidReason: order.voidReason,
    voidedBy: order.voidedBy?.name,
  };
}

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
