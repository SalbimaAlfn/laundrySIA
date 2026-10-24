import type { Metadata } from "next";
import { CustomersManager } from "@/components/customers/customers-manager";
import { getDictionary } from "@/lib/i18n";
import { requireUser } from "@/server/auth";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: getDictionary().customers.title,
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireUser();
  const rawQuery = (await searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";
  const digits = query.replace(/\D/g, "");

  const customers = await db.customer.findMany({
    where:
      query.length > 0
        ? {
            OR: [
              { name: { contains: query } },
              ...(digits.length > 0 ? [{ phone: { contains: digits } }] : []),
            ],
          }
        : undefined,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <CustomersManager
      customers={customers}
      query={query}
      canManage={session.role === "MANAGER"}
    />
  );
}
