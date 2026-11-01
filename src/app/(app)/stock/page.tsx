import { requireRole } from "@/server/auth";
import { getSupplies, getSupplyMovements } from "@/server/actions/supply";
import { StockManager } from "@/components/stock/stock-manager";

export default async function StockPage() {
  await requireRole("MANAGER");

  const [supplies, movements] = await Promise.all([
    getSupplies(),
    getSupplyMovements(),
  ]);

  return (
    <StockManager
      supplies={supplies}
      movements={movements}
    />
  );
}