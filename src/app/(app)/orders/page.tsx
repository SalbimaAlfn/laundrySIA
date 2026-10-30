import type { Metadata } from "next";
import { OrdersManager } from "@/components/orders/orders-manager";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import { getOrders } from "@/server/orders/queries";

export const metadata: Metadata = {
  title: getDictionary().orders.title,
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const filters: {
    status: string;
    date: string;
    customer: string;
    invoice: string;
    paymentState: "all" | "unpaid" | "partial" | "paid";
  } = {
    status: (params.status as string) || "all",
    date: (params.date as string) || "",
    customer: (params.customer as string) || "",
    invoice: (params.invoice as string) || "",
    paymentState: typeof params.paymentState === "string" && ["unpaid", "partial", "paid"].includes(params.paymentState)
      ? (params.paymentState as "unpaid" | "partial" | "paid")
      : "all",
  };

  const { orders, total, totalPages } = await getOrders({
    status: filters.status,
    date: filters.date,
    customer: filters.customer,
    invoice: filters.invoice,
    paymentState: filters.paymentState === "all" ? undefined : filters.paymentState,
    page,
  });

  return (
    <OrdersManager
      orders={orders}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      filters={filters}
    />
  );
}
