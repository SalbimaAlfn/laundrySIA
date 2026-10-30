import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { getDictionary } from "@/lib/i18n";
import { addBusinessDays, businessDate } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: getDictionary().orderForm.title,
};

export default async function NewOrderPage() {
  await requireUser();
  const [services, settings] = await Promise.all([
    db.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true, price: true, turnaroundDays: true },
      orderBy: { name: "asc" },
    }),
    db.setting.findMany({
      where: { key: { in: ["shop.name", "shop.address"] } },
      select: { key: true, value: true },
    }),
  ]);
  const settingsByKey = new Map(settings.map(({ key, value }) => [key, value]));
  const today = businessDate();
  const submissionId = randomUUID();

  return (
    <NewOrderForm
      key={submissionId}
      services={services}
      shopName={settingsByKey.get("shop.name") ?? getDictionary().orderForm.shopNameFallback}
      shopAddress={settingsByKey.get("shop.address") ?? null}
      today={today}
      initialPickupDate={addBusinessDays(today, services[0]?.turnaroundDays ?? 1)}
      initialSubmissionId={submissionId}
    />
  );
}
