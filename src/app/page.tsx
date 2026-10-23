import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/server/auth";

export default async function Home() {
  const session = await getSession();
  redirect(session ? homeForRole(session.role) : "/login");
}
