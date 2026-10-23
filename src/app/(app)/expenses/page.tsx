import { PagePlaceholder } from "@/components/app-shell/page-placeholder";
import { requireRole } from "@/server/auth";

export default async function ExpensesPage() {
  await requireRole("MANAGER");
  return <PagePlaceholder />;
}
