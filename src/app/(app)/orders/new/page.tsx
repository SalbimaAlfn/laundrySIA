import { PagePlaceholder } from "@/components/app-shell/page-placeholder";
import { requireUser } from "@/server/auth";

export default async function NewOrderPage() {
  await requireUser();
  return <PagePlaceholder />;
}
