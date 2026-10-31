import { ReceivablesManager } from "@/components/orders/receivables-manager";
import { requireRole } from "@/server/auth";
import { getReceivables } from "@/server/orders/queries";

export default async function ReceivablesPage() {
  await requireRole("MANAGER");
  const receivables = await getReceivables();
  return <ReceivablesManager {...receivables} />;
}
