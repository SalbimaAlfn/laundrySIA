import type { Metadata } from "next";
import { ServicesManager } from "@/components/services/services-manager";
import { getDictionary } from "@/lib/i18n";
import { requireRole } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: getDictionary().services.title,
};

export default async function ServicesSettingsPage() {
  await requireRole("MANAGER");

  const services = await db.service.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return <ServicesManager services={services} />;
}
