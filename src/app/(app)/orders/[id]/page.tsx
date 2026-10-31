import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/order-detail";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";
import { getOrderDetail } from "@/server/orders/queries";

export const metadata: Metadata = {
  title: getDictionary().orders.detailTitle,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const [order, settings] = await Promise.all([
    getOrderDetail(orderId),
    db.setting.findMany({
      where: { key: { in: ["shop.name", "shop.address"] } },
      select: { key: true, value: true },
    }),
  ]);

  if (!order) {
    notFound();
  }

  const settingsByKey = new Map(settings.map(({ key, value }) => [key, value]));
  return (
    <OrderDetailView
      order={order}
      canReverseStatus={session.role === "MANAGER"}
      shopName={settingsByKey.get("shop.name") ?? getDictionary().orderForm.shopNameFallback}
      shopAddress={settingsByKey.get("shop.address") ?? null}
    />
  );
}
