import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import { getOrderDetail } from "@/server/orders/queries";

export const metadata: Metadata = {
  title: getDictionary().orders.detailTitle,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const order = await getOrderDetail(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetailView order={order} />;
}