import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { requireUser } from "@/server/auth";

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await requireUser();

  return <AppShell session={{ name: session.name, role: session.role }}>{children}</AppShell>;
}
